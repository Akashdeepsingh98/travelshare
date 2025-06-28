import { Community, CommunityMember, CommunitySharedPost, Post, User } from '../types';
import { authManager } from '../auth';
import { supabase } from '../lib/supabase';
import { createPostCard } from './PostCard';

export function createCommunityDetailPage(
  communityId: string,
  onNavigateBack: () => void,
  onPostSelect: (post: Post, allPosts: Post[]) => void,
  onUserClick?: (userId: string) => void,
  onSharePost?: (post: Post) => void,
  onAskAI?: (post: Post) => void
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'community-detail-page';
  
  let community: Community | null = null;
  let members: CommunityMember[] = [];
  let sharedPosts: CommunitySharedPost[] = [];
  let isLoading = false;
  let activeTab = 'posts'; // Default tab: 'posts', 'members', or 'chat'
  let isSearchingUsers = false;
  let searchResults: User[] = [];
  let userSearchTimeout: NodeJS.Timeout | null = null;
  let searchInput: HTMLInputElement | null = null;
  let userRole: 'admin' | 'member' | null = null;
  
  async function loadCommunityData() {
    const authState = authManager.getAuthState();
    
    isLoading = true;
    renderCommunityDetailPage();
    
    try {
      // Load community details
      const { data: communityData, error: communityError } = await supabase
        .from('communities')
        .select(`
          *,
          creator:profiles!communities_created_by_fkey(*)
        `)
        .eq('id', communityId)
        .single();
      
      if (communityError) throw communityError;
      
      community = communityData;
      
      // Check if user is a member and get their role
      if (authState.isAuthenticated && authState.currentUser) {
        const { data: memberData } = await supabase
          .from('community_members')
          .select('role')
          .eq('community_id', communityId)
          .eq('user_id', authState.currentUser.id)
          .single();
        
        userRole = memberData?.role || null;
      } else {
        userRole = null;
      }
      
      // Load community members - simplified query to avoid recursion
      try {
        const { data: membersData, error: membersError } = await supabase
          .from('community_members')
          .select(`
            id,
            community_id,
            user_id,
            role,
            joined_at,
            user:profiles(id, name, avatar_url)
          `)
          .eq('community_id', communityId)
          .order('role', { ascending: false }) // Admins first
          .order('joined_at', { ascending: false });
        
        if (membersError) {
          console.error('Error loading members:', membersError);
          // If there's a policy recursion error, set empty members array
          if (membersError.message?.includes('infinite recursion')) {
            members = [];
            console.warn('Community members could not be loaded due to database policy configuration. Please check your Supabase RLS policies for the community_members table.');
          } else {
            throw membersError;
          }
        } else {
          members = membersData || [];
        }
      } catch (memberError) {
        console.error('Error loading community members:', memberError);
        members = [];
      }
      
      // Load shared posts
      const { data: sharedPostsData, error: postsError } = await supabase
        .from('community_shared_posts')
        .select(`
          *,
          post:posts(
            *,
            user:profiles(*),
            comments(
              *,
              user:profiles(*)
            )
          ),
          shared_by_user:profiles!community_shared_posts_shared_by_fkey(*)
        `)
        .eq('community_id', communityId)
        .order('shared_at', { ascending: false });
      
      if (postsError) throw postsError;
      
      sharedPosts = sharedPostsData || [];
      
      // If user is authenticated, check which posts they've liked
      if (authState.isAuthenticated && authState.currentUser) {
        const postIds = sharedPosts.map(sp => sp.post_id);
        
        if (postIds.length > 0) {
          const { data: likes } = await supabase
            .from('post_likes')
            .select('post_id')
            .eq('user_id', authState.currentUser.id)
            .in('post_id', postIds);
          
          const likedPostIds = new Set(likes?.map(like => like.post_id) || []);
          
          sharedPosts = sharedPosts.map(sp => ({
            ...sp,
            post: sp.post ? {
              ...sp.post,
              user_has_liked: likedPostIds.has(sp.post.id)
            } : null
          }));
        }
      }
      
    } catch (error) {
      console.error('Error loading community data:', error);
      
      // Handle specific error types
      if (error.message?.includes('infinite recursion')) {
        console.error('Database policy configuration error detected. Please check your Supabase RLS policies for the community_members table.');
        // Set minimal data to allow page to render
        if (!community) {
          community = null;
        }
        members = [];
        sharedPosts = [];
      }
    } finally {
      isLoading = false;
      renderCommunityDetailPage();
    }
  }
  
  // Function to handle user search for adding members
  async function handleSearchUsers(query: string) {
    // Don't search if query is too short
    if (query.length < 2) {
      searchResults = [];
      isSearchingUsers = false;
      renderSearchResults();
      return;
    }
    
    isSearchingUsers = true;
    renderSearchResults();
    
    try {
      // Get existing member IDs to exclude from search
      const existingMemberIds = members.map(m => m.user_id);
      
      // Search for users by name
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('name', `%${query}%`)
        .not('id', 'in', `(${existingMemberIds.join(',')})`)
        .limit(10);
      
      if (error) throw error;
      
      searchResults = data || [];
    } catch (error) {
      console.error('Error searching users:', error);
      searchResults = [];
    } finally {
      isSearchingUsers = false;
      renderSearchResults();
    }
  }
  
  // Function to render search results
  function renderSearchResults() {
    const resultsContainer = document.querySelector('.add-member-results');
    if (!resultsContainer) return;
    
    if (isSearchingUsers) {
      resultsContainer.innerHTML = `
        <div class="search-loading">
          <div class="loading-spinner"></div>
          <p>Searching users...</p>
        </div>
      `;
      resultsContainer.style.display = 'block';
      return;
    }
    
    if (!searchInput || searchInput.value.length < 2) {
      resultsContainer.innerHTML = `
        <div class="search-hint">
          <p>Type at least 2 characters to search for users</p>
        </div>
      `;
      resultsContainer.style.display = 'block';
      return;
    }
    
    if (searchResults.length === 0) {
      resultsContainer.innerHTML = `
        <div class="search-empty">
          <p>No users found matching "${searchInput.value}"</p>
        </div>
      `;
      resultsContainer.style.display = 'block';
      return;
    }
    
    resultsContainer.innerHTML = `
      <div class="search-results-list">
        ${searchResults.map(user => `
          <div class="search-result-item" data-user-id="${user.id}">
            <img src="${user.avatar_url || 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'}" alt="${user.name}" class="result-avatar">
            <div class="result-info">
              <h4 class="result-name">${user.name}</h4>
            </div>
            <button class="add-user-btn" data-user-id="${user.id}">Add</button>
          </div>
        `).join('')}
      </div>
    `;
    
    resultsContainer.style.display = 'block';
    
    // Add event listeners for add buttons
    const addButtons = resultsContainer.querySelectorAll('.add-user-btn');
    addButtons.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const userId = (btn as HTMLButtonElement).dataset.userId!;
        await handleAddMember(userId);
      });
    });
  }
  
  // Function to add a member to the community
  async function handleAddMember(userId: string) {
    if (!community) return;
    
    try {
      const { error } = await supabase
        .from('community_members')
        .insert({
          community_id: community.id,
          user_id: userId,
          role: 'member'
        });
      
      if (error) throw error;
      
      // Close the modal
      const modal = document.querySelector('.add-member-modal');
      if (modal) {
        modal.remove();
      }
      
      // Reload community data
      await loadCommunityData();
      
    } catch (error) {
      console.error('Error adding member:', error);
      alert('Failed to add member. Please try again.');
    }
  }
  
  // Function to show the add member modal
  function showAddMemberModal() {
    const modal = document.createElement('div');
    modal.className = 'add-member-modal';
    
    modal.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="add-member-content">
        <div class="add-member-header">
          <h2>Add Member</h2>
          <button class="modal-close">✕</button>
        </div>
        <div class="add-member-body">
          <div class="add-member-search">
            <input type="text" class="add-member-input" placeholder="Search for users by name...">
          </div>
          <div class="add-member-results"></div>
        </div>
      </div>
    `;
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .add-member-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 1rem;
      }

      .modal-backdrop {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: -1;
      }

      .add-member-content {
        background: white;
        border-radius: 1rem;
        width: 100%;
        max-width: 500px;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      }

      .add-member-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1.5rem;
        border-bottom: 1px solid #e2e8f0;
      }

      .add-member-header h2 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: #1e293b;
      }

      .modal-close {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #64748b;
        padding: 0.5rem;
        border-radius: 0.5rem;
        transition: all 0.2s;
      }

      .modal-close:hover {
        background: #f1f5f9;
        color: #334155;
      }

      .add-member-body {
        padding: 1.5rem;
      }

      .add-member-search {
        margin-bottom: 1rem;
      }

      .add-member-input {
        width: 100%;
        padding: 0.75rem 1rem;
        border: 1px solid #e2e8f0;
        border-radius: 0.5rem;
        font-size: 0.875rem;
      }

      .add-member-input:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
      }

      .add-member-results {
        max-height: 300px;
        overflow-y: auto;
      }

      .search-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        color: #64748b;
      }

      .search-loading .loading-spinner {
        margin-bottom: 0.5rem;
      }

      .search-empty, .search-hint {
        text-align: center;
        padding: 2rem;
        color: #64748b;
      }

      .search-results-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .search-result-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem;
        border: 1px solid #e2e8f0;
        border-radius: 0.5rem;
        transition: all 0.2s;
      }

      .search-result-item:hover {
        background: #f8fafc;
        border-color: #cbd5e1;
      }

      .result-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        object-fit: cover;
      }

      .result-info {
        flex: 1;
      }

      .result-name {
        font-weight: 600;
        color: #1e293b;
        font-size: 0.875rem;
        margin: 0;
      }

      .add-user-btn {
        background: #667eea;
        color: white;
        border: none;
        padding: 0.5rem 0.75rem;
        border-radius: 0.5rem;
        cursor: pointer;
        font-size: 0.75rem;
        font-weight: 500;
        transition: all 0.2s;
      }

      .add-user-btn:hover {
        background: #5a67d8;
        transform: translateY(-1px);
      }
    `;
    
    if (!document.head.querySelector('#add-member-modal-styles')) {
      style.id = 'add-member-modal-styles';
      document.head.appendChild(style);
    }
    
    document.body.appendChild(modal);
    
    // Get elements
    const closeBtn = modal.querySelector('.modal-close') as HTMLButtonElement;
    searchInput = modal.querySelector('.add-member-input') as HTMLInputElement;
    
    // Close modal
    closeBtn.addEventListener('click', () => {
      modal.remove();
      searchInput = null;
    });
    
    // Close on backdrop click
    const backdrop = modal.querySelector('.modal-backdrop') as HTMLElement;
    backdrop.addEventListener('click', () => {
      modal.remove();
      searchInput = null;
    });
    
    // Search input
    searchInput.addEventListener('input', () => {
      // Clear previous timeout
      if (userSearchTimeout) {
        clearTimeout(userSearchTimeout);
      }
      
      // Set a new timeout to debounce the search
      userSearchTimeout = setTimeout(() => {
        handleSearchUsers(searchInput!.value.trim());
      }, 300);
    });
    
    // Initial search results (showing the hint)
    renderSearchResults();
    
    // Focus the search input
    searchInput.focus();
  }
  
  function renderCommunityDetailPage() {
    const authState = authManager.getAuthState();
    const isUserMember = userRole !== null;
    const isUserAdmin = userRole === 'admin';
    const canViewContent = !community?.is_private || isUserMember;
    
    container.innerHTML = `
      <div class="community-detail-header">
        <button class="back-btn">← Back</button>
        ${community ? `
          <div class="community-header-content">
            <h1>${community.name}</h1>
            <div class="community-header-meta">
              <span class="privacy-badge ${community.is_private ? 'private' : 'public'}">
                ${community.is_private ? '🔒 Private' : '🌍 Public'}
              </span>
              <span class="member-count">👥 ${members.length} member${members.length === 1 ? '' : 's'}</span>
            </div>
          </div>
          ${isUserMember ? `
            <button class="leave-community-btn" data-community-id="${community.id}">
              Leave Community
            </button>
          ` : community.is_private ? `
            <div class="private-community-badge">
              🔒 Private Community
            </div>
          ` : `
            <button class="join-community-btn" data-community-id="${community.id}">
              Join Community
            </button>
          `}
        ` : ''}
      </div>
      
      ${isLoading ? `
        <div class="community-detail-loading">
          <div class="loading-spinner">Loading community...</div>
        </div>
      ` : !community ? `
        <div class="community-not-found">
          <div class="not-found-content">
            <div class="not-found-icon">🔍</div>
            <h3>Community Not Found</h3>
            <p>The community you're looking for doesn't exist or you don't have permission to view it.</p>
            <button class="back-to-communities-btn">Back to Communities</button>
          </div>
        </div>
      ` : `
        <div class="community-detail-content">
          <div class="community-info-section">
            <div class="community-description">
              <h3>About this Community</h3>
              <p>${community.description || 'No description provided.'}</p>
              <div class="community-meta">
                <span class="meta-item">
                  <span class="meta-icon">👤</span>
                  <span class="meta-text">Created by ${community.creator?.name || 'Unknown'}</span>
                </span>
                <span class="meta-item">
                  <span class="meta-icon">📅</span>
                  <span class="meta-text">Created ${getTimeAgo(new Date(community.created_at))}</span>
                </span>
              </div>
            </div>
            
            ${isUserAdmin ? `
              <div class="admin-actions">
                <button class="edit-community-btn" data-community-id="${community.id}">
                  <span class="btn-icon">✏️</span>
                  Edit
                </button>
                <button class="manage-members-btn" data-community-id="${community.id}">
                  <span class="btn-icon">👥</span>
                  Manage
                </button>
                <button class="add-member-btn" data-community-id="${community.id}">
                  <span class="btn-icon">➕</span>
                  Add Member
                </button>
              </div>
            ` : ''}
          </div>
          
          ${canViewContent ? `
            <div class="community-content-section">
              <div class="community-tabs">
                <button class="community-tab active" data-tab="posts">
                  <span class="tab-icon">📝</span>
                  <span class="tab-text">Shared Posts</span>
                </button>
                <button class="community-tab" data-tab="chat">
                  <span class="tab-icon">💬</span>
                  <span class="tab-text">Chat</span>
                </button>
                <button class="community-tab" data-tab="members">
                  <span class="tab-icon">👥</span>
                  <span class="tab-text">Members</span>
                </button>
              </div>
              
              <div class="community-tab-content">
                <div class="tab-pane posts-pane ${activeTab === 'posts' ? 'active' : ''}">
                  ${isUserMember ? `
                    <div class="share-post-prompt">
                      <button class="share-post-btn">
                        <span class="btn-icon">📤</span>
                        Share a Post
                      </button>
                    </div>
                  ` : ''}
                  
                  ${sharedPosts.length > 0 ? `
                    <div class="shared-posts-list">
                      ${sharedPosts.map((sharedPost, index) => `
                        <div class="shared-post-container">
                          <div class="shared-post-header">
                            <div class="shared-by">
                              <span class="shared-icon">🔄</span>
                              <span class="shared-text">Shared by ${sharedPost.shared_by_user?.name || 'Unknown'}</span>
                              <span class="shared-time">${getTimeAgo(new Date(sharedPost.shared_at))}</span>
                            </div>
                            ${(isUserAdmin || authState.currentUser?.id === sharedPost.shared_by) ? `
                              <button class="remove-shared-post-btn" data-shared-post-id="${sharedPost.id}">
                                <span class="remove-icon">✕</span>
                              </button>
                            ` : ''}
                          </div>
                          <div class="shared-post" id="shared-post-${index}"></div>
                        </div>
                      `).join('')}
                    </div>
                  ` : `
                    <div class="empty-shared-posts">
                      <div class="empty-content">
                        <div class="empty-icon">📝</div>
                        <h3>No Posts Shared Yet</h3>
                        <p>Be the first to share a travel experience with this community!</p>
                      </div>
                    </div>
                  `}
                </div>

                <div class="tab-pane chat-pane ${activeTab === 'chat' ? 'active' : ''}">
                  <div id="community-chat-container"></div>
                </div>
                
                <div class="tab-pane members-pane ${activeTab === 'members' ? 'active' : ''}">
                  ${members.length === 0 ? `
                    <div class="members-loading-error">
                      <div class="error-content">
                        <div class="error-icon">⚠️</div>
                        <h4>Unable to Load Members</h4>
                        <p>There may be a configuration issue with the community settings. Please contact an administrator.</p>
                      </div>
                    </div>
                  ` : `
                  <div class="members-list">
                    ${members.map(member => `
                      <div class="member-item" data-user-id="${member.user_id}">
                        <img src="${member.user?.avatar_url || 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'}" alt="${member.user?.name || 'Unknown'}" class="member-avatar">
                        <div class="member-info">
                          <h4 class="member-name">${member.user?.name || 'Unknown'}</h4>
                          <span class="member-role ${member.role}">${member.role === 'admin' ? '👑 Admin' : 'Member'}</span>
                        </div>
                        ${isUserAdmin && member.user_id !== authState.currentUser?.id ? `
                          <div class="member-actions">
                            ${member.role === 'member' ? `
                              <button class="promote-member-btn" data-user-id="${member.user_id}">
                                Make Admin
                              </button>
                            ` : `
                              <button class="demote-member-btn" data-user-id="${member.user_id}">
                                Remove Admin
                              </button>
                            `}
                            <button class="remove-member-btn" data-user-id="${member.user_id}">
                              Remove
                            </button>
                          </div>
                        ` : ''}
                      </div>
                    `).join('')}
                  </div>
                  `}
                </div>
              </div>
            </div>
          ` : `
            <div class="private-community-message">
              <div class="private-content">
                <div class="private-icon">🔒</div>
                <h3>Private Community</h3>
                <p>This is a private community. You need to be a member to view its content.</p>
                ${authState.isAuthenticated ? `
                  <p>Please contact a community admin for an invitation.</p>
                ` : `
                  <button class="login-to-join-btn">Log in to request access</button>
                `}
              </div>
            </div>
          `}
        </div>
      `}
    `;
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .tab-pane.chat-pane {
        padding: 0;
        display: flex;
        flex-direction: column;
        height: 500px;
      }

      #community-chat-container {
        flex: 1;
        display: flex;
        flex-direction: column;
        height: 100%;
      }

      .community-detail-page {
        min-height: 100vh;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 2rem 1rem;
      }

      .community-detail-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 2rem;
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        padding: 1rem 1.5rem;
        border-radius: 1rem;
        border: 1px solid rgba(255, 255, 255, 0.2);
      }

      .community-detail-header .back-btn {
        background: rgba(255, 255, 255, 0.2);
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s;
      }

      .community-detail-header .back-btn:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: translateY(-1px);
      }

      .community-header-content {
        flex: 1;
        text-align: center;
      }

      .community-header-content h1 {
        color: white;
        font-size: 1.75rem;
        font-weight: 600;
        margin: 0 0 0.25rem 0;
      }

      .community-header-meta {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
      }

      .privacy-badge {
        background: rgba(255, 255, 255, 0.2);
        color: white;
        padding: 0.25rem 0.75rem;
        border-radius: 1rem;
        font-size: 0.75rem;
        font-weight: 500;
      }

      .privacy-badge.private {
        background: rgba(239, 68, 68, 0.2);
      }

      .privacy-badge.public {
        background: rgba(16, 185, 129, 0.2);
      }

      .member-count {
        color: rgba(255, 255, 255, 0.9);
        font-size: 0.875rem;
      }

      .join-community-btn, .leave-community-btn {
        background: rgba(255, 255, 255, 0.2);
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s;
      }

      .join-community-btn {
        background: rgba(16, 185, 129, 0.3);
      }

      .join-community-btn:hover {
        background: rgba(16, 185, 129, 0.4);
        transform: translateY(-1px);
      }

      .leave-community-btn {
        background: rgba(239, 68, 68, 0.3);
      }

      .leave-community-btn:hover {
        background: rgba(239, 68, 68, 0.4);
        transform: translateY(-1px);
      }

      .private-community-badge {
        background: rgba(239, 68, 68, 0.3);
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        font-weight: 500;
      }

      .community-detail-content {
        background: white;
        border-radius: 1rem;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        overflow: hidden;
      }

      .community-info-section {
        padding: 2rem;
        border-bottom: 1px solid #f1f5f9;
      }

      .community-description h3 {
        color: #1e293b;
        font-size: 1.25rem;
        font-weight: 600;
        margin: 0 0 1rem 0;
      }

      .community-description p {
        color: #64748b;
        line-height: 1.6;
        margin: 0 0 1.5rem 0;
      }

      .community-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
      }

      .meta-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #64748b;
        font-size: 0.875rem;
      }

      .meta-icon {
        font-size: 1rem;
      }

      .admin-actions {
        display: flex;
        gap: 1rem;
        margin-top: 1.5rem;
      }

      .edit-community-btn, .manage-members-btn, .add-member-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: #f1f5f9;
        color: #334155;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s;
      }

      .edit-community-btn:hover, .manage-members-btn:hover, .add-member-btn:hover {
        background: #e2e8f0;
      }

      .add-member-section {
        position: relative;
        margin-top: 0.75rem;
      }

      .toggle-add-member-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: #10b981;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s;
        width: 100%;
      }

      .toggle-add-member-btn:hover {
        background: #059669;
      }

      .user-search-container {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 0.5rem;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        margin-top: 0.5rem;
        z-index: 10;
      }

      .user-search-input-container {
        display: flex;
        align-items: center;
        padding: 0.75rem;
        border-bottom: 1px solid #e2e8f0;
      }

      .user-search-input {
        flex: 1;
        padding: 0.5rem;
        border: 1px solid #e2e8f0;
        border-radius: 0.25rem;
        font-size: 0.875rem;
      }

      .user-search-input:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
      }

      .close-search-btn {
        background: none;
        border: none;
        color: #64748b;
        font-size: 1rem;
        cursor: pointer;
        margin-left: 0.5rem;
      }

      .user-search-results {
        max-height: 250px;
        overflow-y: auto;
      }

      .user-search-loading {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 1rem;
        color: #64748b;
        font-size: 0.875rem;
      }

      .user-search-list {
        padding: 0.5rem;
      }

      .user-search-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem;
        border-radius: 0.25rem;
        transition: all 0.2s;
      }

      .user-search-item:hover {
        background: #f8fafc;
      }

      .user-search-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        object-fit: cover;
      }

      .user-search-info {
        flex: 1;
      }

      .user-search-name {
        font-weight: 500;
        color: #1e293b;
        font-size: 0.875rem;
      }

      .add-user-btn {
        background: #10b981;
        color: white;
        border: none;
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        font-size: 0.75rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }

      .add-user-btn:hover {
        background: #059669;
      }

      .user-search-empty {
        padding: 1rem;
        text-align: center;
        color: #64748b;
        font-size: 0.875rem;
      }

      .community-content-section {
        padding: 0;
      }

      .community-tabs {
        display: flex;
        border-bottom: 1px solid #f1f5f9;
      }

      .community-tab {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 1rem;
        background: none;
        border: none;
        cursor: pointer;
        color: #64748b;
        font-weight: 500;
        transition: all 0.2s;
        border-bottom: 2px solid transparent;
      }

      .community-tab.active {
        color: #667eea;
        border-bottom-color: #667eea;
      }

      .community-tab:hover:not(.active) {
        background: #f8fafc;
        color: #334155;
      }

      .tab-pane {
        display: none;
        padding: 2rem;
      }

      .tab-pane.active {
        display: block;
      }

      .share-post-prompt {
        margin-bottom: 2rem;
        text-align: center;
      }

      .share-post-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: #667eea;
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 0.5rem;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s;
        margin: 0 auto;
      }

      .share-post-btn:hover {
        background: #5a67d8;
        transform: translateY(-1px);
      }

      .shared-posts-list {
        display: flex;
        flex-direction: column;
        gap: 2rem;
      }

      .shared-post-container {
        border: 1px solid #e2e8f0;
        border-radius: 1rem;
        overflow: hidden;
      }

      .shared-post-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.75rem 1rem;
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
      }

      .shared-by {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #64748b;
        font-size: 0.875rem;
      }

      .shared-text {
        font-weight: 500;
      }

      .shared-time {
        color: #94a3b8;
        font-size: 0.75rem;
      }

      .remove-shared-post-btn {
        background: none;
        border: none;
        color: #ef4444;
        cursor: pointer;
        padding: 0.25rem;
        border-radius: 0.25rem;
        transition: all 0.2s;
      }

      .remove-shared-post-btn:hover {
        background: rgba(239, 68, 68, 0.1);
      }

      .empty-shared-posts {
        text-align: center;
        padding: 3rem 1rem;
      }

      .empty-content {
        max-width: 400px;
        margin: 0 auto;
      }

      .empty-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
        color: #94a3b8;
      }

      .empty-content h3 {
        color: #334155;
        font-size: 1.25rem;
        font-weight: 600;
        margin: 0 0 0.5rem 0;
      }

      .empty-content p {
        color: #64748b;
        margin: 0;
      }

      .members-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1rem;
      }

      .member-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        border: 1px solid #e2e8f0;
        border-radius: 0.75rem;
        transition: all 0.2s;
      }

      .member-item:hover {
        background: #f8fafc;
      }

      .member-avatar {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        object-fit: cover;
      }

      .member-info {
        flex: 1;
      }

      .member-name {
        color: #1e293b;
        font-size: 1rem;
        font-weight: 600;
        margin: 0 0 0.25rem 0;
      }

      .member-role {
        display: inline-block;
        font-size: 0.75rem;
        padding: 0.125rem 0.5rem;
        border-radius: 1rem;
        background: #f1f5f9;
        color: #64748b;
      }

      .member-role.admin {
        background: #fef3c7;
        color: #92400e;
      }

      .member-actions {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .promote-member-btn, .demote-member-btn, .remove-member-btn {
        background: #f1f5f9;
        color: #334155;
        border: none;
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        cursor: pointer;
        font-size: 0.75rem;
        transition: all 0.2s;
        white-space: nowrap;
      }

      .promote-member-btn:hover {
        background: #10b981;
        color: white;
      }

      .demote-member-btn:hover, .remove-member-btn:hover {
        background: #ef4444;
        color: white;
      }

      .private-community-message {
        text-align: center;
        padding: 4rem 1rem;
      }

      .private-content {
        max-width: 400px;
        margin: 0 auto;
      }

      .private-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
        color: #94a3b8;
      }

      .private-content h3 {
        color: #334155;
        font-size: 1.25rem;
        font-weight: 600;
        margin: 0 0 0.5rem 0;
      }

      .private-content p {
        color: #64748b;
        margin: 0 0 1rem 0;
      }

      .login-to-join-btn {
        background: #667eea;
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 0.5rem;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s;
      }

      .login-to-join-btn:hover {
        background: #5a67d8;
        transform: translateY(-1px);
      }

      .community-detail-loading {
        text-align: center;
        padding: 4rem 1rem;
        background: white;
        border-radius: 1rem;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      }

      .community-not-found {
        text-align: center;
        padding: 4rem 1rem;
        background: white;
        border-radius: 1rem;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      }

      .not-found-content {
        max-width: 400px;
        margin: 0 auto;
      }

      .not-found-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
        color: #94a3b8;
      }

      .not-found-content h3 {
        color: #334155;
        font-size: 1.25rem;
        font-weight: 600;
        margin: 0 0 0.5rem 0;
      }

      .not-found-content p {
        color: #64748b;
        margin: 0 0 1.5rem 0;
      }

      .back-to-communities-btn {
        background: #667eea;
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 0.5rem;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s;
      }

      .back-to-communities-btn:hover {
        background: #5a67d8;
        transform: translateY(-1px);
      }

      .members-loading-error {
        text-align: center;
        padding: 3rem 1rem;
      }

      .members-loading-error .error-content {
        max-width: 400px;
        margin: 0 auto;
      }

      .members-loading-error .error-icon {
        font-size: 2rem;
        margin-bottom: 1rem;
        color: #f59e0b;
      }

      .members-loading-error h4 {
        color: #334155;
        font-size: 1.125rem;
        font-weight: 600;
        margin: 0 0 0.5rem 0;
      }

      .members-loading-error p {
        color: #64748b;
        margin: 0;
        font-size: 0.875rem;
      }

      /* Responsive design */
      @media (max-width: 768px) {
        .community-detail-page {
          padding: 1rem;
        }

        .community-detail-header {
          padding: 1rem;
          flex-direction: column;
          gap: 1rem;
        }

        .community-header-content h1 {
          font-size: 1.5rem;
        }

        .community-info-section {
          padding: 1.5rem;
        }

        .admin-actions {
          flex-direction: column;
        }

        .tab-pane {
          padding: 1.5rem;
        }

        .members-list {
          grid-template-columns: 1fr;
        }
      }
    `;
    
    if (!document.head.querySelector('#community-detail-styles')) {
      style.id = 'community-detail-styles';
      document.head.appendChild(style);
    }
    
    setupEventListeners();
    renderSharedPosts();
  }
  
  // Set initial active tab
  function setActiveTab(tabName: string) {
    activeTab = tabName;
    renderCommunityDetailPage();
  }
  
  function renderSharedPosts() {
    // Render post cards for shared posts
    sharedPosts.forEach((sharedPost, index) => {
      if (!sharedPost.post) return;
      
      const postContainer = document.getElementById(`shared-post-${index}`);
      if (!postContainer) return;
      
      const postCard = createPostCard(
        sharedPost.post,
        (postId) => handleLike(postId),
        (postId, comment) => handleComment(postId, comment),
        (userId) => handleFollow(userId),
        (userId) => handleUnfollow(userId),
        true, // Show follow button
        onUserClick, // Navigate to user profile when clicked
        false, // Not own profile
        undefined, // No delete handler
        onAskAI // Ask AI handler
        undefined // No AI handler
      );
      
      postContainer.innerHTML = '';
      postContainer.appendChild(postCard);
    });
  }
  
  function setupEventListeners() {
    // Back button
    const backBtn = container.querySelector('.back-btn') as HTMLButtonElement;
    backBtn?.addEventListener('click', onNavigateBack);
    
    // Back to communities button
    const backToCommunities = container.querySelector('.back-to-communities-btn') as HTMLButtonElement;
    backToCommunities?.addEventListener('click', onNavigateBack);
    
    // Login to join button
    const loginToJoinBtn = container.querySelector('.login-to-join-btn') as HTMLButtonElement;
    loginToJoinBtn?.addEventListener('click', () => {
      const authModal = document.querySelector('.auth-modal') as HTMLElement;
      if (authModal) {
        authModal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    });
    
    // Join community button
    const joinBtn = container.querySelector('.join-community-btn') as HTMLButtonElement;
    joinBtn?.addEventListener('click', () => handleJoinCommunity());
    
    // Leave community button
    const leaveBtn = container.querySelector('.leave-community-btn') as HTMLButtonElement;
    leaveBtn?.addEventListener('click', () => handleLeaveCommunity());
    
    // Edit community button
    const editBtn = container.querySelector('.edit-community-btn') as HTMLButtonElement;
    editBtn?.addEventListener('click', () => handleEditCommunity());
    
    // Manage members button - just switches to the members tab
    const manageBtn = container.querySelector('.manage-members-btn') as HTMLButtonElement;
    manageBtn?.addEventListener('click', () => {
      const membersTab = container.querySelector('.community-tab[data-tab="members"]') as HTMLButtonElement;
      membersTab?.click();
    });
    
    // Add member button
    const addMemberBtn = container.querySelector('.add-member-btn') as HTMLButtonElement;
    addMemberBtn?.addEventListener('click', () => showAddMemberModal());
    
    // Share post button
    const shareBtn = container.querySelector('.share-post-btn') as HTMLButtonElement;
    shareBtn?.addEventListener('click', () => handleSharePost());
    
    // Tab switching
    const tabs = container.querySelectorAll('.community-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', async () => {
        const tabName = (tab as HTMLElement).dataset.tab;
        activeTab = tabName || 'posts';
        
        // Update active tab
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Update active pane
        const panes = container.querySelectorAll('.tab-pane');
        panes.forEach(pane => {
          pane.classList.remove('active');
          if (pane.classList.contains(`${tabName}-pane`)) {
            pane.classList.add('active');
          }
        });
        
        // Initialize community chat if chat tab is selected
        if (tabName === 'chat') {
          const chatContainer = document.getElementById('community-chat-container');
          if (chatContainer && chatContainer.children.length === 0) {
            // Import and create the chat component
            const { createCommunityChat } = await import('./CommunityChat');
            const chatComponent = createCommunityChat(communityId, community?.name || 'Community');
            chatContainer.appendChild(chatComponent);
          }
        }
      });
    });
    
    // Member item click
    const memberItems = container.querySelectorAll('.member-item');
    memberItems.forEach(item => {
      item.addEventListener('click', (e) => {
        // Don't trigger if clicking on action buttons
        if ((e.target as HTMLElement).closest('.member-actions')) return;
        
        const userId = (item as HTMLElement).dataset.userId;
        if (userId && onUserClick) {
          onUserClick(userId);
        }
      });
    });
    
    // Promote member buttons
    const promoteBtns = container.querySelectorAll('.promote-member-btn');
    promoteBtns.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const userId = (btn as HTMLElement).dataset.userId!;
        await handlePromoteMember(userId);
      });
    });
    
    // Demote member buttons
    const demoteBtns = container.querySelectorAll('.demote-member-btn');
    demoteBtns.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const userId = (btn as HTMLElement).dataset.userId!;
        await handleDemoteMember(userId);
      });
    });
    
    // Remove member buttons
    const removeBtns = container.querySelectorAll('.remove-member-btn');
    removeBtns.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const userId = (btn as HTMLElement).dataset.userId!;
        await handleRemoveMember(userId);
      });
    });
    
    // Remove shared post buttons
    const removeSharedPostBtns = container.querySelectorAll('.remove-shared-post-btn');
    removeSharedPostBtns.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const sharedPostId = (btn as HTMLElement).dataset.sharedPostId!;
        await handleRemoveSharedPost(sharedPostId);
      });
    });
  }
  
  async function handleJoinCommunity() {
    const authState = authManager.getAuthState();
    if (!authState.isAuthenticated || !authState.currentUser) {
      const authModal = document.querySelector('.auth-modal') as HTMLElement;
      if (authModal) {
        authModal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
      return;
    }
    
    // Check if user is already a member
    if (userRole !== null) {
      alert('You are already a member of this community.');
      return;
    }
    
    try {
      // Double-check membership status before inserting
      const { data: existingMembership } = await supabase
        .from('community_members')
        .select('id')
        .eq('community_id', communityId)
        .eq('user_id', authState.currentUser.id)
        .single();
      
      if (existingMembership) {
        alert('You are already a member of this community.');
        await loadCommunityData(); // Refresh to show correct state
        return;
      }
      
      const { error } = await supabase
        .from('community_members')
        .insert({
          community_id: communityId,
          user_id: authState.currentUser.id,
          role: 'member'
        });
      
      if (error) throw error;
      
      // Reload community data
      await loadCommunityData();
      
    } catch (error) {
      console.error('Error joining community:', error);
      
      // Handle specific error types
      if (error.code === '23505') {
        alert('You are already a member of this community.');
        await loadCommunityData(); // Refresh to show correct state
      } else {
        alert('Failed to join community. Please try again.');
      }
    }
  }
  
  async function handleLeaveCommunity() {
    const authState = authManager.getAuthState();
    if (!authState.isAuthenticated || !authState.currentUser) return;
    
    // Check if user is the only admin
    if (userRole === 'admin') {
      const adminCount = members.filter(m => m.role === 'admin').length;
      if (adminCount === 1) {
        alert('You are the only admin. Please promote another member to admin before leaving.');
        return;
      }
    }
    
    if (!confirm('Are you sure you want to leave this community?')) return;
    
    try {
      const { error } = await supabase
        .from('community_members')
        .delete()
        .eq('community_id', communityId)
        .eq('user_id', authState.currentUser.id);
      
      if (error) throw error;
      
      // Navigate back to communities page
      onNavigateBack();
      
    } catch (error) {
      console.error('Error leaving community:', error);
      alert('Failed to leave community. Please try again.');
    }
  }
  
  async function handleEditCommunity() {
    if (!community) return;
    
    const newName = prompt('Community name:', community.name);
    if (!newName) return;
    
    const newDescription = prompt('Community description:', community.description || '');
    
    const isPrivate = confirm('Make this community private? (OK for private, Cancel for public)');
    
    try {
      const { error } = await supabase
        .from('communities')
        .update({
          name: newName,
          description: newDescription,
          is_private: isPrivate
        })
        .eq('id', communityId);
      
      if (error) throw error;
      
      // Reload community data
      await loadCommunityData();
      
    } catch (error) {
      console.error('Error updating community:', error);
      alert('Failed to update community. Please try again.');
    }
  }
  
  async function handlePromoteMember(userId: string) {
    try {
      const { error } = await supabase
        .from('community_members')
        .update({ role: 'admin' })
        .eq('community_id', communityId)
        .eq('user_id', userId);
      
      if (error) throw error;
      
      // Reload community data
      await loadCommunityData();
      
    } catch (error) {
      console.error('Error promoting member:', error);
      alert('Failed to promote member. Please try again.');
    }
  }
  
  async function handleDemoteMember(userId: string) {
    // Check if this is the only admin
    const adminCount = members.filter(m => m.role === 'admin').length;
    if (adminCount === 1) {
      alert('Cannot demote the only admin. Promote another member to admin first.');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('community_members')
        .update({ role: 'member' })
        .eq('community_id', communityId)
        .eq('user_id', userId);
      
      if (error) throw error;
      
      // Reload community data
      await loadCommunityData();
      
    } catch (error) {
      console.error('Error demoting member:', error);
      alert('Failed to demote member. Please try again.');
    }
  }
  
  async function handleRemoveMember(userId: string) {
    // Check if this is the only admin
    const member = members.find(m => m.user_id === userId);
    if (member?.role === 'admin') {
      const adminCount = members.filter(m => m.role === 'admin').length;
      if (adminCount === 1) {
        alert('Cannot remove the only admin. Promote another member to admin first.');
        return;
      }
    }
    
    if (!confirm('Are you sure you want to remove this member?')) return;
    
    try {
      const { error } = await supabase
        .from('community_members')
        .delete()
        .eq('community_id', communityId)
        .eq('user_id', userId);
      
      if (error) throw error;
      
      // Reload community data
      await loadCommunityData();
      
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Failed to remove member. Please try again.');
    }
  }
  
  async function handleRemoveSharedPost(sharedPostId: string) {
    if (!confirm('Are you sure you want to remove this shared post?')) return;
    
    try {
      const { error } = await supabase
        .from('community_shared_posts')
        .delete()
        .eq('id', sharedPostId);
      
      if (error) throw error;
      
      // Reload community data
      await loadCommunityData();
      
    } catch (error) {
      console.error('Error removing shared post:', error);
      alert('Failed to remove shared post. Please try again.');
    }
  }
  
  // Search for users to add to the community
  async function searchUsers(query: string) {
    if (!query) {
      isSearchingUsers = false;
      searchResults = [];
      renderCommunityDetailPage();
      return;
    }
    
    const authState = authManager.getAuthState();
    if (!authState.isAuthenticated || !authState.currentUser) return;
    
    try {
      // Get existing member IDs to exclude them from search
      const memberIds = members.map(m => m.user_id);
      
      // Search for users by name
      const { data: users, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('name', `%${query}%`)
        .not('id', 'in', `(${[...memberIds, authState.currentUser.id].join(',')})`)
        .limit(10);
      
      if (error) throw error;
      
      searchResults = users || [];
      
    } catch (error) {
      console.error('Error searching users:', error);
      searchResults = [];
    } finally {
      isSearchingUsers = false;
      renderCommunityDetailPage();
    }
  }
  
  function handleSharePost() {
    if (onSharePost) {
      // This will be handled by the parent component
      // which will open a modal to select a post to share
      onSharePost(null as any);
    }
  }
  
  async function handleLike(postId: string) {
    const authState = authManager.getAuthState();
    if (!authState.isAuthenticated || !authState.currentUser) return;
    
    try {
      const post = sharedPosts.find(sp => sp.post?.id === postId)?.post;
      if (!post) return;

      if (post.user_has_liked) {
        // Unlike the post
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', authState.currentUser.id);
        
        post.user_has_liked = false;
        post.likes_count = Math.max(0, post.likes_count - 1);
      } else {
        // Like the post
        await supabase
          .from('post_likes')
          .insert({
            post_id: postId,
            user_id: authState.currentUser.id
          });
        
        post.user_has_liked = true;
        post.likes_count = post.likes_count + 1;
      }
      
      renderCommunityDetailPage();
      
    } catch (error) {
      console.error('Error handling like:', error);
    }
  }
  
  async function handleComment(postId: string, commentText: string) {
    const authState = authManager.getAuthState();
    if (!authState.isAuthenticated || !authState.currentUser) return;
    
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: authState.currentUser.id,
          content: commentText
        })
        .select(`
          *,
          user:profiles(*)
        `)
        .single();

      if (error) throw error;

      const sharedPost = sharedPosts.find(sp => sp.post?.id === postId);
      if (sharedPost && sharedPost.post) {
        if (!sharedPost.post.comments) sharedPost.post.comments = [];
        sharedPost.post.comments.push(data);
        renderCommunityDetailPage();
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  }
  
  async function handleFollow(userId: string) {
    const authState = authManager.getAuthState();
    if (!authState.isAuthenticated || !authState.currentUser) return;
    
    try {
      await supabase
        .from('follows')
        .insert({
          follower_id: authState.currentUser.id,
          following_id: userId
        });
      
      // No need to reload data for this action
      
    } catch (error) {
      console.error('Error following user:', error);
    }
  }
  
  async function handleUnfollow(userId: string) {
    const authState = authManager.getAuthState();
    if (!authState.isAuthenticated || !authState.currentUser) return;
    
    try {
      await supabase
        .from('follows')
        .delete()
        .eq('follower_id', authState.currentUser.id)
        .eq('following_id', userId);
      
      // No need to reload data for this action
      
    } catch (error) {
      console.error('Error unfollowing user:', error);
    }
  }
  
  function getTimeAgo(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
  }
  
  // Initial load
  loadCommunityData();
  
  // Listen for auth changes
  authManager.onAuthChange(() => {
    loadCommunityData();
  });
  
  return container;
}