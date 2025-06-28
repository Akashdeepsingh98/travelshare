import { authManager } from '../auth';
import { supabase } from '../lib/supabase';
import { Post } from '../types';

interface GroupChat {
  id: string;
  name: string;
  description?: string;
  members_count: number;
}

export function createShareToGroupModal(post: Post, onClose: () => void, onSuccess?: () => void): HTMLElement {
  const modal = document.createElement('div');
  modal.className = 'share-to-group-modal';
  
  let groupChats: GroupChat[] = [];
  let isLoading = false;
  let selectedGroupId: string | null = null;
  
  modal.innerHTML = `
    <div class="modal-backdrop"></div>
    <div class="share-to-group-content">
      <div class="share-to-group-header">
        <h2>Share Post to Group</h2>
        <button class="modal-close">✕</button>
      </div>
      
      <div class="share-to-group-body">
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
        
        <div class="groups-selection">
          <h3>Select a Group</h3>
          
          <div class="groups-list" id="groups-list">
            ${isLoading ? `
              <div class="loading-state">
                <div class="loading-spinner"></div>
                <p>Loading your groups...</p>
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
    .share-to-group-modal {
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

    .share-to-group-content {
      background: white;
      border-radius: 1rem;
      width: 100%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    }

    .share-to-group-header {
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

    .share-to-group-header h2 {
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

    .share-to-group-body {
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

    .groups-selection {
      margin-bottom: 1.5rem;
    }

    .groups-selection h3 {
      margin: 0 0 1rem 0;
      font-size: 1rem;
      font-weight: 600;
      color: #334155;
    }

    .groups-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-height: 300px;
      overflow-y: auto;
    }

    .group-option {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .group-option:hover {
      border-color: #cbd5e1;
      background: #f8fafc;
    }

    .group-option.selected {
      border-color: #667eea;
      background: rgba(102, 126, 234, 0.1);
    }

    .group-avatar {
      width: 40px;
      height: 40px;
      border-radius: 0.5rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 1rem;
      flex-shrink: 0;
    }

    .group-info {
      flex: 1;
    }

    .group-name {
      font-weight: 600;
      color: #1e293b;
      font-size: 0.875rem;
      margin-bottom: 0.25rem;
    }

    .group-description {
      color: #64748b;
      font-size: 0.75rem;
      margin-bottom: 0.25rem;
    }

    .group-members-count {
      color: #94a3b8;
      font-size: 0.75rem;
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

    .empty-groups {
      text-align: center;
      padding: 2rem;
      color: #64748b;
    }

    .empty-icon {
      font-size: 2rem;
      margin-bottom: 1rem;
    }

    .empty-groups h4 {
      color: #334155;
      font-size: 1rem;
      font-weight: 600;
      margin: 0 0 0.5rem 0;
    }

    .empty-groups p {
      margin: 0 0 1rem 0;
      font-size: 0.875rem;
    }

    .create-group-link {
      color: #667eea;
      text-decoration: none;
      font-weight: 500;
    }

    .create-group-link:hover {
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
      .share-to-group-content {
        max-width: 100%;
        margin: 0 1rem;
      }
    }

    @media (max-width: 480px) {
      .share-to-group-header {
        padding: 1rem;
      }

      .share-to-group-body {
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
  
  if (!document.head.querySelector('#share-to-group-styles')) {
    style.id = 'share-to-group-styles';
    document.head.appendChild(style);
  }
  
  // Get elements
  const modalBackdrop = modal.querySelector('.modal-backdrop') as HTMLElement;
  const modalClose = modal.querySelector('.modal-close') as HTMLButtonElement;
  const cancelBtn = modal.querySelector('.cancel-btn') as HTMLButtonElement;
  const shareBtn = modal.querySelector('.share-btn') as HTMLButtonElement;
  const groupsList = modal.querySelector('#groups-list') as HTMLElement;
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
    
    shareBtn.disabled = loading || !selectedGroupId;
    cancelBtn.disabled = loading;
    
    if (loading) {
      btnText.style.display = 'none';
      btnLoading.style.display = 'inline';
    } else {
      btnText.style.display = 'inline';
      btnLoading.style.display = 'none';
    }
  }
  
  // Load user's groups
  async function loadGroups() {
    const authState = authManager.getAuthState();
    if (!authState.isAuthenticated || !authState.currentUser) {
      renderGroupsList([]);
      return;
    }
    
    isLoading = true;
    renderGroupsList([]);
    
    try {
      // Get all groups the user is a member of
      const { data: userGroups, error: groupsError } = await supabase
        .from('group_members')
        .select(`
          group_chat_id,
          group:group_chats!inner(
            id,
            name,
            description
          )
        `)
        .eq('user_id', authState.currentUser.id);
      
      if (groupsError) throw groupsError;
      
      // Process the groups
      const processedGroups: GroupChat[] = [];
      
      for (const item of userGroups || []) {
        const group = item.group;
        
        // Get members count
        const { count: membersCount } = await supabase
          .from('group_members')
          .select('*', { count: 'exact', head: true })
          .eq('group_chat_id', group.id);
        
        processedGroups.push({
          id: group.id,
          name: group.name,
          description: group.description,
          members_count: membersCount || 0
        });
      }
      
      renderGroupsList(processedGroups);
      
    } catch (error) {
      console.error('Error loading groups:', error);
      renderGroupsList([]);
    } finally {
      isLoading = false;
    }
  }
  
  // Render groups list
  function renderGroupsList(groups: GroupChat[]) {
    groupChats = groups;
    
    if (isLoading) {
      groupsList.innerHTML = `
        <div class="loading-state">
          <div class="loading-spinner"></div>
          <p>Loading your groups...</p>
        </div>
      `;
      return;
    }
    
    if (groups.length === 0) {
      groupsList.innerHTML = `
        <div class="empty-groups">
          <div class="empty-icon">👥</div>
          <h4>No Groups Found</h4>
          <p>You're not a member of any groups yet. Create a group to share posts with multiple people at once.</p>
          <a href="#" class="create-group-link">Create a new group</a>
        </div>
      `;
      
      const createLink = groupsList.querySelector('.create-group-link') as HTMLAnchorElement;
      createLink?.addEventListener('click', (e) => {
        e.preventDefault();
        closeModal();
        // This should be handled by the parent component
        // which will open the create group modal
      });
      
      return;
    }
    
    groupsList.innerHTML = groups.map(group => `
      <div class="group-option" data-group-id="${group.id}">
        <div class="group-avatar">${group.name.substring(0, 2).toUpperCase()}</div>
        <div class="group-info">
          <div class="group-name">${group.name}</div>
          ${group.description ? `<div class="group-description">${group.description}</div>` : ''}
          <div class="group-members-count">${group.members_count} member${group.members_count === 1 ? '' : 's'}</div>
        </div>
      </div>
    `).join('');
    
    // Add click handlers
    const groupOptions = groupsList.querySelectorAll('.group-option');
    groupOptions.forEach(option => {
      option.addEventListener('click', () => {
        // Deselect all options
        groupOptions.forEach(opt => opt.classList.remove('selected'));
        
        // Select this option
        option.classList.add('selected');
        
        // Update selected group
        selectedGroupId = option.getAttribute('data-group-id');
        
        // Enable share button
        shareBtn.disabled = !selectedGroupId;
      });
    });
  }
  
  // Share post to group
  async function sharePostToGroup() {
    if (!selectedGroupId) {
      showError('Please select a group to share this post.');
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
        .from('group_messages')
        .insert({
          group_chat_id: selectedGroupId,
          sender_id: authState.currentUser.id,
          shared_post_id: post.id,
          read_by: [authState.currentUser.id] // Mark as read by sender
        });
      
      if (error) {
        showError(`Error sharing post: ${error.message}`);
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
  shareBtn.addEventListener('click', sharePostToGroup);
  
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
  loadGroups();
  
  return modal;
}