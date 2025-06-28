import { Post, User } from '../types';
import { authManager } from '../auth';
import { supabase } from '../lib/supabase';

interface GroupChat {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  member_count?: number;
}

export function createShareToGroupModal(post: Post, onClose: () => void, onSuccess?: () => void): HTMLElement {
  const modal = document.createElement('div');
  modal.className = 'share-to-group-modal';
  
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

    .message-input-section {
      margin-bottom: 1.5rem;
    }

    .message-input-section h3 {
      margin: 0 0 0.75rem 0;
      font-size: 1rem;
      font-weight: 600;
      color: #334155;
    }

    .message-textarea {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #cbd5e1;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      resize: vertical;
      min-height: 80px;
      font-family: inherit;
    }

    .message-textarea:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .group-section {
      margin-bottom: 1.5rem;
    }

    .group-section h3 {
      margin: 0 0 0.75rem 0;
      font-size: 1rem;
      font-weight: 600;
      color: #334155;
    }

    .group-search {
      margin-bottom: 1rem;
    }

    .group-search-input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #cbd5e1;
      border-radius: 0.5rem;
      font-size: 0.875rem;
    }

    .group-search-input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .group-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-height: 300px;
      overflow-y: auto;
    }

    .group-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .group-item:hover {
      background: #f8fafc;
      border-color: #cbd5e1;
    }

    .group-item.selected {
      background: #e0f2fe;
      border-color: #0ea5e9;
    }

    .group-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      font-weight: 600;
    }

    .group-info {
      flex: 1;
    }

    .group-name {
      font-weight: 600;
      color: #1e293b;
      font-size: 0.875rem;
      margin: 0 0 0.25rem 0;
    }

    .group-meta {
      color: #64748b;
      font-size: 0.75rem;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .group-empty {
      text-align: center;
      padding: 2rem;
      color: #64748b;
      background: #f8fafc;
      border-radius: 0.5rem;
    }

    .group-loading {
      text-align: center;
      padding: 2rem;
      color: #64748b;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .create-group-btn {
      background: #667eea;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 1rem auto;
    }

    .create-group-btn:hover {
      background: #5a67d8;
      transform: translateY(-1px);
    }

    .form-error {
      color: #ef4444;
      font-size: 0.875rem;
      margin-bottom: 1rem;
      padding: 0.75rem;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 0.5rem;
      display: none;
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
      display: flex;
      align-items: center;
      gap: 0.5rem;
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
  
  // State variables
  let groups: GroupChat[] = [];
  let selectedGroupId: string | null = null;
  let isLoading = false;
  let searchQuery = '';
  
  modal.innerHTML = `
    <div class="modal-backdrop"></div>
    <div class="share-to-group-content">
      <div class="share-to-group-header">
        <h2>Share Post in Group</h2>
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
        
        <div class="message-input-section">
          <h3>Add a Message (Optional)</h3>
          <textarea class="message-textarea" placeholder="Write a message to send with this post..."></textarea>
        </div>
        
        <div class="group-section">
          <h3>Select a Group</h3>
          
          <div class="group-search">
            <input type="text" class="group-search-input" placeholder="Search groups...">
          </div>
          
          <div class="group-list">
            ${isLoading ? `
              <div class="group-loading">
                <div class="loading-spinner"></div>
                <p>Loading your groups...</p>
              </div>
            ` : ''}
          </div>
        </div>
        
        <div class="form-error" id="share-form-error"></div>
        
        <div class="form-actions">
          <button class="cancel-btn">Cancel</button>
          <button class="share-btn" disabled>
            <span class="btn-text">Share</span>
            <span class="btn-loading">
              <span class="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </span>
              Sharing...
            </span>
          </button>
        </div>
      </div>
    </div>
  `;
  
  // Get elements
  const modalBackdrop = modal.querySelector('.modal-backdrop') as HTMLElement;
  const modalClose = modal.querySelector('.modal-close') as HTMLButtonElement;
  const messageTextarea = modal.querySelector('.message-textarea') as HTMLTextAreaElement;
  const groupSearchInput = modal.querySelector('.group-search-input') as HTMLInputElement;
  const groupList = modal.querySelector('.group-list') as HTMLElement;
  const errorElement = modal.querySelector('#share-form-error') as HTMLElement;
  const cancelBtn = modal.querySelector('.cancel-btn') as HTMLButtonElement;
  const shareBtn = modal.querySelector('.share-btn') as HTMLButtonElement;
  
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
    shareBtn.disabled = loading || !selectedGroupId;
    cancelBtn.disabled = loading;
    
    const btnText = shareBtn.querySelector('.btn-text') as HTMLElement;
    const btnLoading = shareBtn.querySelector('.btn-loading') as HTMLElement;
    
    if (loading) {
      btnText.style.display = 'none';
      btnLoading.style.display = 'inline-flex';
    } else {
      btnText.style.display = 'inline';
      btnLoading.style.display = 'none';
    }
  }
  
  // Load user's groups
  async function loadGroups() {
    const authState = authManager.getAuthState();
    if (!authState.isAuthenticated || !authState.currentUser) {
      renderGroupList();
      return;
    }
    
    isLoading = true;
    renderGroupList();
    
    try {
      // Get all group chats where the current user is a member
      const { data: membershipData, error: membershipError } = await supabase
        .from('group_members')
        .select('group_chat_id')
        .eq('user_id', authState.currentUser.id);
      
      if (membershipError) throw membershipError;
      
      if (!membershipData || membershipData.length === 0) {
        groups = [];
        isLoading = false;
        renderGroupList();
        return;
      }
      
      const groupChatIds = membershipData.map(m => m.group_chat_id);
      
      // Get group chat details
      const { data: groupChatsData, error: groupChatsError } = await supabase
        .from('group_chats')
        .select('*')
        .in('id', groupChatIds)
        .order('updated_at', { ascending: false });
      
      if (groupChatsError) throw groupChatsError;
      
      // Get member counts for each group
      const groupsWithMemberCounts = await Promise.all((groupChatsData || []).map(async (group) => {
        const { data: members } = await supabase
          .from('group_members')
          .select('id', { count: 'exact', head: true })
          .eq('group_chat_id', group.id);
        
        return {
          ...group,
          member_count: members?.count || 0
        };
      }));
      
      groups = groupsWithMemberCounts;
      
    } catch (error) {
      console.error('Error loading groups:', error);
      groups = [];
    } finally {
      isLoading = false;
      renderGroupList();
    }
  }
  
  // Render group list
  function renderGroupList() {
    if (!groupList) return;
    
    if (isLoading) {
      groupList.innerHTML = `
        <div class="group-loading">
          <div class="loading-spinner"></div>
          <p>Loading your groups...</p>
        </div>
      `;
      return;
    }
    
    // Filter groups by search query
    const filteredGroups = searchQuery
      ? groups.filter(group => group.name.toLowerCase().includes(searchQuery.toLowerCase()))
      : groups;
    
    if (filteredGroups.length === 0) {
      groupList.innerHTML = `
        <div class="group-empty">
          <p>You're not a member of any groups yet.</p>
          <button class="create-group-btn">
            <span class="btn-icon">👥</span>
            <span class="btn-text">Create a Group</span>
          </button>
        </div>
      `;
      
      const createGroupBtn = groupList.querySelector('.create-group-btn') as HTMLButtonElement;
      createGroupBtn?.addEventListener('click', () => {
        // Close this modal
        closeModal();
        
        // Import and show the group chat modal
        import('./GroupChatModal').then(({ createGroupChatModal }) => {
          const groupChatModal = createGroupChatModal(
            () => {}, // onClose - no action needed
            (groupId) => {
              // Reload groups and select the new group
              loadGroups().then(() => {
                selectedGroupId = groupId;
                renderGroupList();
              });
            }
          );
          
          document.body.appendChild(groupChatModal);
        });
      });
      
      return;
    }
    
    groupList.innerHTML = filteredGroups.map(group => {
      // Get initials for avatar
      const initials = group.name
        .split(' ')
        .map(word => word[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
      
      return `
        <div class="group-item ${selectedGroupId === group.id ? 'selected' : ''}" data-group-id="${group.id}">
          <div class="group-avatar">${initials}</div>
          <div class="group-info">
            <h3 class="group-name">${group.name}</h3>
            <p class="group-meta">
              <span class="group-members">👥 ${group.member_count || 0} member${group.member_count === 1 ? '' : 's'}</span>
              ${group.description ? `<span class="group-description">• ${group.description}</span>` : ''}
            </p>
          </div>
        </div>
      `;
    }).join('');
    
    // Add click handlers
    const groupItems = groupList.querySelectorAll('.group-item');
    groupItems.forEach(item => {
      item.addEventListener('click', () => {
        const groupId = item.getAttribute('data-group-id');
        if (groupId) {
          // Deselect all items
          groupItems.forEach(i => i.classList.remove('selected'));
          
          // Select this item
          item.classList.add('selected');
          
          // Set selected group
          selectedGroupId = groupId;
          
          // Enable share button
          shareBtn.disabled = !selectedGroupId;
        }
      });
    });
  }
  
  // Share post to group
  async function sharePostToGroup() {
    if (!selectedGroupId) {
      showError('Please select a group');
      return;
    }
    
    const authState = authManager.getAuthState();
    if (!authState.isAuthenticated || !authState.currentUser) {
      showError('You must be logged in to share posts');
      return;
    }
    
    const message = messageTextarea.value.trim();
    
    clearError();
    setLoading(true);
    
    try {
      // Send message with shared post
      const { error } = await supabase
        .from('group_messages')
        .insert({
          group_chat_id: selectedGroupId,
          sender_id: authState.currentUser.id,
          content: message || null,
          shared_post_id: post.id,
          read_by: [authState.currentUser.id] // Mark as read by sender
        });
      
      if (error) throw error;
      
      // Success
      if (onSuccess) {
        onSuccess();
      }
      
      closeModal();
      
    } catch (error: any) {
      console.error('Error sharing post to group:', error);
      showError(`An unexpected error occurred: ${error.message}`);
      setLoading(false);
    }
  }
  
  // Event listeners
  modalBackdrop.addEventListener('click', closeModal);
  modalClose.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  shareBtn.addEventListener('click', sharePostToGroup);
  
  // Group search
  let searchTimeout: NodeJS.Timeout;
  groupSearchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      searchQuery = groupSearchInput.value.trim();
      renderGroupList();
    }, 300);
  });
  
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