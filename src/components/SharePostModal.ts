import { Community, Post } from '../types';
import { authManager } from '../auth';
import { supabase } from '../lib/supabase';

export function createSharePostModal(post: Post, onClose: () => void, onSuccess?: () => void): HTMLElement {
  const modal = document.createElement('div');
  modal.className = 'share-post-modal';
  
  let communities: Community[] = [];
  let isLoading = false;
  let selectedCommunityId: string | null = null;
  
  modal.innerHTML = `
    <div class="modal-backdrop"></div>
    <div class="share-post-content">
      <div class="share-post-header">
        <h2>Share Post to Community</h2>
        <button class="modal-close">✕</button>
      </div>
      
      <div class="share-post-body">
        <div class="post-preview">
          <div class="preview-header">
            <h3>Post Preview</h3>
          </div>
          <div class="preview-content">
            <div class="preview-user">
              <img src="${post.user?.avatar_url || 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'}" alt="${post.user?.name || 'Unknown'}" class="preview-avatar">
              <div class="preview-user-info">
                <span class="preview-name">${post.user?.name || 'Unknown'}</span>
                <span class="preview-location">📍 ${post.location}</span>
              </div>
            </div>
            <p class="preview-text">${post.content.length > 100 ? post.content.substring(0, 100) + '...' : post.content}</p>
            ${post.image_url || (post.media_urls && post.media_urls.length > 0) ? `
              <div class="preview-media">
                <img src="${post.image_url || post.media_urls![0]}" alt="Post media" class="preview-image">
              </div>
            ` : ''}
          </div>
        </div>
        
        <div class="communities-selection">
          <h3>Select a Community</h3>
          
          <div class="communities-list" id="communities-list">
            ${isLoading ? `
              <div class="loading-state">
                <div class="loading-spinner"></div>
                <p>Loading your communities...</p>
              </div>
            ` : ''}
          </div>
        </div>
        
        <div class="form-error" id="share-form-error" style="display: none;"></div>
        
        <div class="form-actions">
          <button type="button" class="cancel-btn">Cancel</button>
          <button type="button" class="share-btn" disabled>
            <span class="btn-text">Share Post</span>
            <span class="btn-loading" style="display: none;">Sharing...</span>
          </button>
        </div>
      </div>
    </div>
  `;
  
  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    .share-post-modal {
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

    .share-post-content {
      background: white;
      border-radius: 1rem;
      width: 100%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    }

    .share-post-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.5rem;
      border-bottom: 1px solid #e2e8f0;
      position: sticky;
      top: 0;
      background: white;
      z-index: 10;
    }

    .share-post-header h2 {
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

    .share-post-body {
      padding: 1.5rem;
    }

    .post-preview {
      margin-bottom: 1.5rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      overflow: hidden;
    }

    .preview-header {
      padding: 1rem;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }

    .preview-header h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: #334155;
    }

    .preview-content {
      padding: 1rem;
    }

    .preview-user {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
    }

    .preview-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
    }

    .preview-user-info {
      display: flex;
      flex-direction: column;
    }

    .preview-name {
      font-weight: 600;
      color: #1e293b;
      font-size: 0.875rem;
    }

    .preview-location {
      font-size: 0.75rem;
      color: #667eea;
    }

    .preview-text {
      color: #334155;
      font-size: 0.875rem;
      line-height: 1.5;
      margin-bottom: 0.75rem;
    }

    .preview-media {
      border-radius: 0.5rem;
      overflow: hidden;
    }

    .preview-image {
      width: 100%;
      height: auto;
      max-height: 200px;
      object-fit: cover;
    }

    .communities-selection {
      margin-bottom: 1.5rem;
    }

    .communities-selection h3 {
      margin: 0 0 1rem 0;
      font-size: 1rem;
      font-weight: 600;
      color: #334155;
    }

    .communities-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-height: 300px;
      overflow-y: auto;
    }

    .community-option {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .community-option:hover {
      border-color: #cbd5e1;
      background: #f8fafc;
    }

    .community-option.selected {
      border-color: #667eea;
      background: rgba(102, 126, 234, 0.1);
    }

    .community-icon {
      width: 40px;
      height: 40px;
      border-radius: 0.5rem;
      background: #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      flex-shrink: 0;
    }

    .community-info {
      flex: 1;
    }

    .community-name {
      font-weight: 600;
      color: #1e293b;
      font-size: 0.875rem;
      margin-bottom: 0.25rem;
    }

    .community-meta {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .community-privacy {
      font-size: 0.75rem;
      color: #64748b;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .community-members {
      font-size: 0.75rem;
      color: #64748b;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      color: #64748b;
    }

    .loading-spinner {
      width: 30px;
      height: 30px;
      border: 3px solid #f3f4f6;
      border-top: 3px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .empty-communities {
      text-align: center;
      padding: 2rem;
      color: #64748b;
    }

    .empty-icon {
      font-size: 2rem;
      margin-bottom: 1rem;
    }

    .empty-communities h4 {
      color: #334155;
      font-size: 1rem;
      font-weight: 600;
      margin: 0 0 0.5rem 0;
    }

    .empty-communities p {
      margin: 0 0 1rem 0;
      font-size: 0.875rem;
    }

    .create-community-link {
      color: #667eea;
      text-decoration: none;
      font-weight: 500;
    }

    .create-community-link:hover {
      text-decoration: underline;
    }

    .form-error {
      color: #ef4444;
      font-size: 0.875rem;
      margin-bottom: 1rem;
      padding: 0.75rem;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 0.5rem;
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
    }

    .cancel-btn {
      background: #f1f5f9;
      color: #334155;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
    }

    .cancel-btn:hover {
      background: #e2e8f0;
    }

    .share-btn {
      background: #667eea;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
    }

    .share-btn:hover:not(:disabled) {
      background: #5a67d8;
    }

    .share-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-loading {
      display: none;
    }

    /* Responsive design */
    @media (max-width: 768px) {
      .share-post-content {
        max-width: 100%;
        margin: 0 1rem;
      }
    }

    @media (max-width: 480px) {
      .share-post-header {
        padding: 1rem;
      }

      .share-post-body {
        padding: 1rem;
      }

      .form-actions {
        flex-direction: column;
      }

      .cancel-btn, .share-btn {
        width: 100%;
      }
    }
  `;
  
  if (!document.head.querySelector('#share-post-styles')) {
    style.id = 'share-post-styles';
    document.head.appendChild(style);
  }
  
  // Get elements
  const modalBackdrop = modal.querySelector('.modal-backdrop') as HTMLElement;
  const modalClose = modal.querySelector('.modal-close') as HTMLButtonElement;
  const cancelBtn = modal.querySelector('.cancel-btn') as HTMLButtonElement;
  const shareBtn = modal.querySelector('.share-btn') as HTMLButtonElement;
  const communitiesList = modal.querySelector('#communities-list') as HTMLElement;
  const errorElement = modal.querySelector('#share-form-error') as HTMLElement;
  
  // Close modal
  function closeModal() {
    modal.remove();
    onClose();
  }
  
  // Show error
  function showError(message: string) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }
  
  // Clear error
  function clearError() {
    errorElement.textContent = '';
    errorElement.style.display = 'none';
  }
  
  // Set loading state
  function setLoading(loading: boolean) {
    const btnText = shareBtn.querySelector('.btn-text') as HTMLElement;
    const btnLoading = shareBtn.querySelector('.btn-loading') as HTMLElement;
    
    shareBtn.disabled = loading || !selectedCommunityId;
    cancelBtn.disabled = loading;
    
    if (loading) {
      btnText.style.display = 'none';
      btnLoading.style.display = 'inline';
    } else {
      btnText.style.display = 'inline';
      btnLoading.style.display = 'none';
    }
  }
  
  // Load user's communities
  async function loadCommunities() {
    const authState = authManager.getAuthState();
    if (!authState.isAuthenticated || !authState.currentUser) {
      renderCommunitiesList([]);
      return;
    }
    
    isLoading = true;
    renderCommunitiesList([]);
    
    try {
      // Load communities where user is a member
      const { data, error } = await supabase
        .from('community_members')
        .select(`
          community_id,
          communities!inner(
            id,
            name,
            description,
            is_private,
            created_at
          )
        `)
        .eq('user_id', authState.currentUser.id);
      
      if (error) throw error;
      
      communities = data?.map(item => item.communities) || [];
      
      // Get member counts
      if (communities.length > 0) {
        const communityIds = communities.map(c => c.id);
        const { data: memberCounts } = await supabase
          .from('community_members')
          .select('community_id')
          .in('community_id', communityIds);
        
        const countMap = memberCounts?.reduce((acc, member) => {
          acc[member.community_id] = (acc[member.community_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {};
        
        communities = communities.map(c => ({ ...c, member_count: countMap[c.id] || 0 }));
      }
      
      // Check if post is already shared to any communities
      if (communities.length > 0) {
        const { data: sharedPosts } = await supabase
          .from('community_shared_posts')
          .select('community_id')
          .eq('post_id', post.id);
        
        const sharedCommunityIds = new Set(sharedPosts?.map(sp => sp.community_id) || []);
        
        // Filter out communities where the post is already shared
        communities = communities.filter(c => !sharedCommunityIds.has(c.id));
      }
      
    } catch (error) {
      console.error('Error loading communities:', error);
    } finally {
      isLoading = false;
      renderCommunitiesList(communities);
    }
  }
  
  // Render communities list
  function renderCommunitiesList(communities: Community[]) {
    if (isLoading) {
      communitiesList.innerHTML = `
        <div class="loading-state">
          <div class="loading-spinner"></div>
          <p>Loading your communities...</p>
        </div>
      `;
      return;
    }
    
    if (communities.length === 0) {
      communitiesList.innerHTML = `
        <div class="empty-communities">
          <div class="empty-icon">🏘️</div>
          <h4>No Communities Found</h4>
          <p>You're not a member of any communities yet, or the post is already shared to all your communities.</p>
          <a href="#" class="create-community-link">Create a new community</a>
        </div>
      `;
      
      const createLink = communitiesList.querySelector('.create-community-link') as HTMLAnchorElement;
      createLink?.addEventListener('click', (e) => {
        e.preventDefault();
        closeModal();
        // This should be handled by the parent component
        // which will open the create community modal
      });
      
      return;
    }
    
    communitiesList.innerHTML = communities.map(community => `
      <div class="community-option" data-community-id="${community.id}">
        <div class="community-icon">🏘️</div>
        <div class="community-info">
          <div class="community-name">${community.name}</div>
          <div class="community-meta">
            <span class="community-privacy">
              ${community.is_private ? '🔒 Private' : '🌍 Public'}
            </span>
            <span class="community-members">
              👥 ${community.member_count || 0} member${community.member_count === 1 ? '' : 's'}
            </span>
          </div>
        </div>
      </div>
    `).join('');
    
    // Add click handlers
    const communityOptions = communitiesList.querySelectorAll('.community-option');
    communityOptions.forEach(option => {
      option.addEventListener('click', () => {
        // Deselect all options
        communityOptions.forEach(opt => opt.classList.remove('selected'));
        
        // Select this option
        option.classList.add('selected');
        
        // Update selected community
        selectedCommunityId = option.getAttribute('data-community-id');
        
        // Enable share button
        shareBtn.disabled = !selectedCommunityId;
      });
    });
  }
  
  // Share post to community
  async function sharePostToCommunity() {
    if (!selectedCommunityId) {
      showError('Please select a community to share this post.');
      return;
    }
    
    const authState = authManager.getAuthState();
    if (!authState.isAuthenticated || !authState.currentUser) {
      showError('You must be logged in to share posts.');
      return;
    }
    
    clearError();
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('community_shared_posts')
        .insert({
          community_id: selectedCommunityId,
          post_id: post.id,
          shared_by: authState.currentUser.id
        });
      
      if (error) {
        if (error.code === '23505') {
          showError('This post is already shared to this community.');
        } else {
          showError(`Error sharing post: ${error.message}`);
        }
        setLoading(false);
        return;
      }
      
      // Success
      if (onSuccess) {
        onSuccess();
      }
      
      closeModal();
      
    } catch (error: any) {
      console.error('Error sharing post:', error);
      showError(`An unexpected error occurred: ${error.message}`);
      setLoading(false);
    }
  }
  
  // Event listeners
  modalBackdrop.addEventListener('click', closeModal);
  modalClose.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  shareBtn.addEventListener('click', sharePostToCommunity);
  
  // Close on escape key
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  };
  
  document.addEventListener('keydown', handleKeyDown);
  
  // Cleanup
  modal.addEventListener('remove', () => {
    document.removeEventListener('keydown', handleKeyDown);
  });
  
  // Initial load
  loadCommunities();
  
  return modal;
}