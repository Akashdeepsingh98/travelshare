import { Community } from '../types';
import { authManager } from '../auth';
import { supabase } from '../lib/supabase';
import { showAuthModal } from './AuthModal';

export function createCommunitiesPage(
  onNavigateBack: () => void,
  onCommunityClick: (communityId: string) => void,
  onCreateCommunity: () => void
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'communities-page';
  
  // Add component styles directly to the component
  const style = document.createElement('style');
  style.textContent = `
    .communities-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 2rem 1rem;
    }

    .communities-page-header {
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

    .communities-page-header h1 {
      color: white;
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0;
    }

    .communities-page-header .back-btn {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
    }

    .communities-page-header .back-btn:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: translateY(-1px);
    }

    .create-community-btn {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
    }

    .create-community-btn:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: translateY(-1px);
    }

    .communities-page-content {
      background: white;
      border-radius: 1rem;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      padding: 2rem;
    }

    .communities-login-prompt {
      text-align: center;
      padding: 3rem 1rem;
    }

    .login-prompt-content {
      max-width: 400px;
      margin: 0 auto;
    }

    .login-prompt-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
      color: #667eea;
    }

    .login-prompt-content h3 {
      color: #1e293b;
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0 0 0.5rem 0;
    }

    .login-prompt-content p {
      color: #64748b;
      margin: 0 0 1.5rem 0;
      line-height: 1.6;
    }

    .communities-login-btn {
      background: #667eea;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s;
    }

    .communities-login-btn:hover {
      background: #5a67d8;
      transform: translateY(-1px);
    }

    .communities-loading {
      text-align: center;
      padding: 2rem;
      color: #64748b;
    }

    .communities-section {
      margin-bottom: 2rem;
    }

    .communities-section h2 {
      color: #1e293b;
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0 0 1.5rem 0;
    }

    .communities-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .community-card {
      background: white;
      border-radius: 1rem;
      border: 1px solid #e2e8f0;
      overflow: hidden;
      transition: all 0.3s ease;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
      cursor: pointer;
    }

    .community-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      border-color: #cbd5e1;
    }

    .community-card.user-member {
      border-color: #667eea;
      background: linear-gradient(to bottom, #f5f7ff, white);
    }

    .community-card-header {
      padding: 1.5rem;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .community-info {
      flex: 1;
    }

    .community-name {
      color: #1e293b;
      font-size: 1.125rem;
      font-weight: 600;
      margin: 0 0 0.5rem 0;
    }

    .community-description {
      color: #64748b;
      font-size: 0.875rem;
      margin: 0;
      line-height: 1.5;
    }

    .community-privacy {
      flex-shrink: 0;
      margin-left: 1rem;
    }

    .privacy-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .privacy-badge.public {
      background: #dcfce7;
      color: #166534;
    }

    .privacy-badge.private {
      background: #fee2e2;
      color: #991b1b;
    }

    .community-card-body {
      padding: 1.5rem;
    }

    .community-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 0.5rem;
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
      color: #667eea;
    }

    .user-role-badge {
      margin-top: 0.5rem;
    }

    .role-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .role-badge.admin {
      background: #fef3c7;
      color: #92400e;
    }

    .role-badge.member {
      background: #e0f2fe;
      color: #0369a1;
    }

    .community-card-actions {
      padding: 1rem 1.5rem;
      border-top: 1px solid #f1f5f9;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .view-community-btn, .join-community-btn {
      background: #667eea;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
    }

    .view-community-btn:hover, .join-community-btn:hover {
      background: #5a67d8;
      transform: translateY(-1px);
    }

    .empty-communities {
      text-align: center;
      padding: 3rem 1rem;
      background: #f8fafc;
      border-radius: 0.75rem;
      border: 2px dashed #e2e8f0;
    }

    .empty-communities-content {
      max-width: 400px;
      margin: 0 auto;
    }

    .empty-communities-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
      color: #94a3b8;
    }

    .empty-communities-content h3 {
      color: #1e293b;
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0 0 0.5rem 0;
    }

    .empty-communities-content p {
      color: #64748b;
      margin: 0 0 1.5rem 0;
      line-height: 1.5;
    }

    /* Responsive design */
    @media (max-width: 768px) {
      .communities-page {
        padding: 1rem;
      }

      .communities-page-header {
        padding: 1rem;
        flex-direction: column;
        gap: 1rem;
        text-align: center;
      }

      .communities-page-content {
        padding: 1.5rem;
      }

      .communities-grid {
        grid-template-columns: 1fr;
      }

      .community-card-header {
        flex-direction: column;
      }

      .community-privacy {
        margin-left: 0;
        margin-top: 0.5rem;
      }

      .community-card-actions {
        flex-direction: column;
        gap: 0.5rem;
      }

      .view-community-btn, .join-community-btn {
        width: 100%;
      }
    }
  `;
  
  // Append styles to document head if not already present
  if (!document.head.querySelector('#communities-page-styles')) {
    style.id = 'communities-page-styles';
    document.head.appendChild(style);
  }
  
  let userCommunities: Community[] = [];
  let publicCommunities: Community[] = [];
  let isLoading = false;
  
  async function loadCommunities() {
    const authState = authManager.getAuthState();
    if (!authState.isAuthenticated || !authState.currentUser) {
      renderCommunitiesPage();
      return;
    }
    
    isLoading = true;
    renderCommunitiesPage();
    
    try {
      // Load user's communities
      const { data: userCommunitiesData, error: userError } = await supabase
        .rpc('get_user_communities', { user_uuid: authState.currentUser.id });
      
      if (userError) throw userError;
      
      userCommunities = userCommunitiesData?.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        created_by: item.created_by,
        is_private: item.is_private,
        created_at: item.created_at,
        member_count: item.member_count,
        user_role: item.user_role,
        creator: {
          id: item.creator_id,
          name: item.creator_name,
          avatar_url: item.creator_avatar_url
        }
      })) || [];
      
      // Load public communities (excluding ones user is already in)
      const userCommunityIds = userCommunities.map(c => c.id);
      let publicQuery = supabase
        .from('communities')
        .select(`
          *,
          creator:profiles!communities_created_by_fkey(*)
        `)
        .eq('is_private', false)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (userCommunityIds.length > 0) {
        publicQuery = publicQuery.not('id', 'in', `(${userCommunityIds.join(',')})`);
      }
      
      const { data: publicCommunitiesData, error: publicError } = await publicQuery;
      
      if (publicError) throw publicError;
      
      publicCommunities = publicCommunitiesData || [];
      
      // Get member counts for all communities
      const allCommunityIds = [...userCommunities.map(c => c.id), ...publicCommunities.map(c => c.id)];
      if (allCommunityIds.length > 0) {
        const { data: memberCounts } = await supabase
          .from('community_members')
          .select('community_id')
          .in('community_id', allCommunityIds);
        
        const countMap = memberCounts?.reduce((acc, member) => {
          acc[member.community_id] = (acc[member.community_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {};
        
        userCommunities = userCommunities.map(c => ({ ...c, member_count: countMap[c.id] || 0 }));
        publicCommunities = publicCommunities.map(c => ({ ...c, member_count: countMap[c.id] || 0 }));
      }
      
    } catch (error) {
      console.error('Error loading communities:', error);
    } finally {
      isLoading = false;
      renderCommunitiesPage();
    }
  }
  
  function renderCommunitiesPage() {
    const authState = authManager.getAuthState();
    
    container.innerHTML = `
      <div class="communities-page-header">
        <button class="back-btn">← Back</button>
        <h1>🏘️ Travel Communities</h1>
        ${authState.isAuthenticated ? `
          <button class="create-community-btn">+ Create Community</button>
        ` : ''}
      </div>
      
      <div class="communities-page-content">
        ${!authState.isAuthenticated ? `
          <div class="communities-login-prompt">
            <div class="login-prompt-content">
              <div class="login-prompt-icon">🏘️</div>
              <h3>Join Travel Communities</h3>
              <p>Connect with fellow travelers, share experiences, and discover new destinations together!</p>
              <button class="communities-login-btn">Get Started</button>
            </div>
          </div>
        ` : isLoading ? `
          <div class="communities-loading">
            <div class="loading-spinner"></div>
            <p>Loading communities...</p>
          </div>
        ` : `
          ${userCommunities.length > 0 ? `
            <div class="communities-section">
              <h2>Your Communities</h2>
              <div class="communities-grid">
                ${userCommunities.map(community => createCommunityCard(community, true)).join('')}
              </div>
            </div>
          ` : ''}
          
          <div class="communities-section">
            <h2>Discover Communities</h2>
            ${publicCommunities.length > 0 ? `
              <div class="communities-grid">
                ${publicCommunities.map(community => createCommunityCard(community, false)).join('')}
              </div>
            ` : `
              <div class="empty-communities">
                <div class="empty-communities-content">
                  <div class="empty-communities-icon">🌍</div>
                  <h3>No public communities yet</h3>
                  <p>Be the first to create a travel community and start connecting with fellow adventurers!</p>
                </div>
              </div>
            `}
          </div>
        `}
      </div>
    `;
    
    setupEventListeners();
  }
  
  function createCommunityCard(community: Community, isUserMember: boolean): string {
    const timeAgo = getTimeAgo(new Date(community.created_at));
    const creatorName = community.creator?.name || 'Unknown';
    const memberText = community.member_count === 1 ? 'member' : 'members';

    return `
      <div class="community-card ${isUserMember ? 'user-member' : ''}" data-community-id="${community.id}">
        <div class="community-card-header">
          <div class="community-info">
            <h3 class="community-name">${community.name}</h3>
            <p class="community-description">${community.description || 'No description'}</p>
          </div>
          <div class="community-privacy">
            ${community.is_private ? `
              <span class="privacy-badge private">🔒 Private</span>
            ` : `
              <span class="privacy-badge public">🌍 Public</span>
            `}
          </div>
        </div>
        
        <div class="community-card-body">
          <div class="community-meta">
            <span class="meta-item">
              <span class="meta-icon">👥</span>
              <span class="meta-text">${community.member_count || 0} ${memberText}</span>
            </span>
            <span class="meta-item">
              <span class="meta-icon">👤</span>
              <span class="meta-text">Created by ${creatorName}</span>
            </span>
            <span class="meta-item">
              <span class="meta-icon">📅</span>
              <span class="meta-text">${timeAgo}</span>
            </span>
          </div>
          
          ${community.user_role ? `
            <div class="user-role-badge">
              <span class="role-badge ${community.user_role}">${community.user_role === 'admin' ? '👑 Admin' : '👤 Member'}</span>
            </div>
          ` : ''}
        </div>
        
        <div class="community-card-actions">
          <button class="view-community-btn" data-community-id="${community.id}">
            ${isUserMember ? 'View Community' : 'Learn More'}
          </button>
          ${!isUserMember && !community.is_private ? `
            <button class="join-community-btn" data-community-id="${community.id}">
              Join Community
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }
  
  function setupEventListeners() {
    const authState = authManager.getAuthState();
    
    // Back button
    const backBtn = container.querySelector('.back-btn') as HTMLButtonElement;
    backBtn.addEventListener('click', onNavigateBack);
    
    // Create community button
    const createBtn = container.querySelector('.create-community-btn') as HTMLButtonElement;
    createBtn?.addEventListener('click', onCreateCommunity);
    
    // Login button
    const loginBtn = container.querySelector('.communities-login-btn') as HTMLButtonElement;
    loginBtn?.addEventListener('click', showAuthModal);
    
    // Community card clicks
    const communityCards = container.querySelectorAll('.community-card');
    communityCards.forEach(card => {
      card.addEventListener('click', (e) => {
        // Don't trigger if clicking on action buttons
        if ((e.target as HTMLElement).closest('.community-card-actions')) return;
        
        const communityId = card.getAttribute('data-community-id')!;
        onCommunityClick(communityId);
      });
    });
    
    // View community buttons
    const viewBtns = container.querySelectorAll('.view-community-btn');
    viewBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const communityId = (btn as HTMLButtonElement).dataset.communityId!;
        onCommunityClick(communityId);
      });
    });
    
    // Join community buttons
    const joinBtns = container.querySelectorAll('.join-community-btn');
    joinBtns.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const communityId = (btn as HTMLButtonElement).dataset.communityId!;
        await handleJoinCommunity(communityId);
      });
    });
  }
  
  async function handleJoinCommunity(communityId: string) {
    const authState = authManager.getAuthState();
    if (!authState.isAuthenticated || !authState.currentUser) {
      showAuthModal();
      return;
    }
    
    try {
      const { error } = await supabase
        .from('community_members')
        .insert({
          community_id: communityId,
          user_id: authState.currentUser.id,
          role: 'member'
        });
      
      if (error) throw error;
      
      // Reload communities to update the UI
      await loadCommunities();
      
    } catch (error) {
      console.error('Error joining community:', error);
      alert('Failed to join community. Please try again.');
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
  loadCommunities();
  
  // Listen for auth changes
  authManager.onAuthChange(() => {
    loadCommunities();
  });
  
  return container;
}