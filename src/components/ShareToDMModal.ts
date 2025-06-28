import { Post, User } from '../types';
import { authManager } from '../auth';
import { supabase } from '../lib/supabase';

export function createShareToDMModal(post: Post, onClose: () => void, onSuccess?: () => void): HTMLElement {
  const modal = document.createElement('div');
  modal.className = 'share-to-dm-modal';
  
  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    .share-to-dm-modal {
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

    .share-to-dm-content {
      background: white;
      border-radius: 1rem;
      width: 100%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    }

    .share-to-dm-header {
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

    .share-to-dm-header h2 {
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

    .share-to-dm-body {
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

    .recipient-section {
      margin-bottom: 1.5rem;
    }

    .recipient-section h3 {
      margin: 0 0 0.75rem 0;
      font-size: 1rem;
      font-weight: 600;
      color: #334155;
    }

    .recipient-search {
      margin-bottom: 1rem;
    }

    .recipient-search-input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #cbd5e1;
      border-radius: 0.5rem;
      font-size: 0.875rem;
    }

    .recipient-search-input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .recent-conversations {
      margin-bottom: 1rem;
    }

    .recent-conversations h4 {
      margin: 0 0 0.5rem 0;
      font-size: 0.875rem;
      font-weight: 600;
      color: #64748b;
    }

    .conversation-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-height: 200px;
      overflow-y: auto;
    }

    .conversation-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .conversation-item:hover {
      background: #f8fafc;
      border-color: #cbd5e1;
    }

    .conversation-item.selected {
      background: #e0f2fe;
      border-color: #0ea5e9;
    }

    .conversation-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
    }

    .conversation-info {
      flex: 1;
    }

    .conversation-name {
      font-weight: 600;
      color: #1e293b;
      font-size: 0.875rem;
      margin: 0 0 0.25rem 0;
    }

    .conversation-preview {
      color: #64748b;
      font-size: 0.75rem;
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .search-results {
      margin-top: 1rem;
    }

    .search-results h4 {
      margin: 0 0 0.5rem 0;
      font-size: 0.875rem;
      font-weight: 600;
      color: #64748b;
    }

    .user-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-height: 200px;
      overflow-y: auto;
    }

    .user-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .user-item:hover {
      background: #f8fafc;
      border-color: #cbd5e1;
    }

    .user-item.selected {
      background: #e0f2fe;
      border-color: #0ea5e9;
    }

    .user-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
    }

    .user-info {
      flex: 1;
    }

    .user-name {
      font-weight: 600;
      color: #1e293b;
      font-size: 0.875rem;
      margin: 0;
    }

    .user-meta {
      color: #64748b;
      font-size: 0.75rem;
      margin: 0;
    }

    .search-empty {
      text-align: center;
      padding: 1rem;
      color: #64748b;
      font-size: 0.875rem;
    }

    .search-loading {
      text-align: center;
      padding: 1rem;
      color: #64748b;
      font-size: 0.875rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .search-loading .loading-spinner {
      width: 20px;
      height: 20px;
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
      .share-to-dm-content {
        max-width: 100%;
        margin: 0 1rem;
      }
    }

    @media (max-width: 480px) {
      .share-to-dm-header {
        padding: 1rem;
      }

      .share-to-dm-body {
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
  
  if (!document.head.querySelector('#share-to-dm-styles')) {
    style.id = 'share-to-dm-styles';
    document.head.appendChild(style);
  }
  
  // State variables
  let conversations: any[] = [];
  let searchResults: User[] = [];
  let selectedRecipientId: string | null = null;
  let isLoading = false;
  let isSearching = false;
  
  modal.innerHTML = `
    <div class="modal-backdrop"></div>
    <div class="share-to-dm-content">
      <div class="share-to-dm-header">
        <h2>Share Post in Message</h2>
        <button class="modal-close">✕</button>
      </div>
      
      <div class="share-to-dm-body">
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
        
        <div class="recipient-section">
          <h3>Send To</h3>
          
          <div class="recipient-search">
            <input type="text" class="recipient-search-input" placeholder="Search for users...">
          </div>
          
          <div class="recent-conversations">
            <h4>Recent Conversations</h4>
            <div class="conversation-list">
              ${isLoading ? `
                <div class="search-loading">
                  <div class="loading-spinner"></div>
                  <span>Loading conversations...</span>
                </div>
              ` : ''}
            </div>
          </div>
          
          <div class="search-results">
            <h4>Search Results</h4>
            <div class="user-list">
              ${isSearching ? `
                <div class="search-loading">
                  <div class="loading-spinner"></div>
                  <span>Searching...</span>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
        
        <div class="form-error" id="share-form-error"></div>
        
        <div class="form-actions">
          <button class="cancel-btn">Cancel</button>
          <button class="share-btn" disabled>
            <span class="btn-text">Send</span>
            <span class="btn-loading">
              <span class="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </span>
              Sending...
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
  const recipientSearchInput = modal.querySelector('.recipient-search-input') as HTMLInputElement;
  const conversationList = modal.querySelector('.conversation-list') as HTMLElement;
  const userList = modal.querySelector('.user-list') as HTMLElement;
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
    shareBtn.disabled = loading || !selectedRecipientId;
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
  
  // Load recent conversations
  async function loadRecentConversations() {
    const authState = authManager.getAuthState();
    if (!authState.isAuthenticated || !authState.currentUser) {
      return;
    }
    
    isLoading = true;
    renderConversationList();
    
    try {
      // Get all conversations where the current user is either user1 or user2
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select(`
          *,
          user1:profiles!conversations_user1_id_fkey(*),
          user2:profiles!conversations_user2_id_fkey(*)
        `)
        .or(`user1_id.eq.${authState.currentUser.id},user2_id.eq.${authState.currentUser.id}`)
        .order('updated_at', { ascending: false })
        .limit(10);
      
      if (conversationsError) throw conversationsError;
      
      // Process conversations to get the "other user" for each conversation
      conversations = conversationsData.map(conv => {
        const otherUser = conv.user1_id === authState.currentUser.id ? conv.user2 : conv.user1;
        return {
          ...conv,
          other_user: otherUser
        };
      });
      
    } catch (error) {
      console.error('Error loading conversations:', error);
      conversations = [];
    } finally {
      isLoading = false;
      renderConversationList();
    }
  }
  
  // Search for users
  async function searchUsers(query: string) {
    if (!query.trim()) {
      isSearching = false;
      searchResults = [];
      renderSearchResults();
      return;
    }
    
    const authState = authManager.getAuthState();
    if (!authState.isAuthenticated || !authState.currentUser) return;
    
    isSearching = true;
    renderSearchResults();
    
    try {
      const { data: users, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', authState.currentUser.id)
        .ilike('name', `%${query}%`)
        .limit(10);
      
      if (error) throw error;
      
      searchResults = users || [];
      
    } catch (error) {
      console.error('Error searching users:', error);
      searchResults = [];
    } finally {
      isSearching = false;
      renderSearchResults();
    }
  }
  
  // Render conversation list
  function renderConversationList() {
    if (!conversationList) return;
    
    if (isLoading) {
      conversationList.innerHTML = `
        <div class="search-loading">
          <div class="loading-spinner"></div>
          <span>Loading conversations...</span>
        </div>
      `;
      return;
    }
    
    if (conversations.length === 0) {
      conversationList.innerHTML = `
        <div class="search-empty">
          <p>No recent conversations</p>
        </div>
      `;
      return;
    }
    
    conversationList.innerHTML = conversations.map(conversation => `
      <div class="conversation-item ${selectedRecipientId === conversation.other_user.id ? 'selected' : ''}" data-user-id="${conversation.other_user.id}">
        <img src="${conversation.other_user.avatar_url || 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'}" alt="${conversation.other_user.name}" class="conversation-avatar">
        <div class="conversation-info">
          <h3 class="conversation-name">${conversation.other_user.name}</h3>
          <p class="conversation-preview">Recent conversation</p>
        </div>
      </div>
    `).join('');
    
    // Add click handlers
    const items = conversationList.querySelectorAll('.conversation-item');
    items.forEach(item => {
      item.addEventListener('click', () => {
        // Deselect all items
        conversationList.querySelectorAll('.conversation-item').forEach(i => i.classList.remove('selected'));
        userList.querySelectorAll('.user-item').forEach(i => i.classList.remove('selected'));
        
        // Select this item
        item.classList.add('selected');
        
        // Set selected recipient
        selectedRecipientId = item.getAttribute('data-user-id');
        
        // Enable share button
        shareBtn.disabled = !selectedRecipientId;
      });
    });
  }
  
  // Render search results
  function renderSearchResults() {
    if (!userList) return;
    
    if (isSearching) {
      userList.innerHTML = `
        <div class="search-loading">
          <div class="loading-spinner"></div>
          <span>Searching...</span>
        </div>
      `;
      return;
    }
    
    if (searchResults.length === 0) {
      userList.innerHTML = `
        <div class="search-empty">
          <p>No users found</p>
        </div>
      `;
      return;
    }
    
    userList.innerHTML = searchResults.map(user => `
      <div class="user-item ${selectedRecipientId === user.id ? 'selected' : ''}" data-user-id="${user.id}">
        <img src="${user.avatar_url || 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'}" alt="${user.name}" class="user-avatar">
        <div class="user-info">
          <h3 class="user-name">${user.name}</h3>
          <p class="user-meta">Traveler</p>
        </div>
      </div>
    `).join('');
    
    // Add click handlers
    const items = userList.querySelectorAll('.user-item');
    items.forEach(item => {
      item.addEventListener('click', () => {
        // Deselect all items
        conversationList.querySelectorAll('.conversation-item').forEach(i => i.classList.remove('selected'));
        userList.querySelectorAll('.user-item').forEach(i => i.classList.remove('selected'));
        
        // Select this item
        item.classList.add('selected');
        
        // Set selected recipient
        selectedRecipientId = item.getAttribute('data-user-id');
        
        // Enable share button
        shareBtn.disabled = !selectedRecipientId;
      });
    });
  }
  
  // Share post to DM
  async function sharePostToDM() {
    if (!selectedRecipientId) {
      showError('Please select a recipient');
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
      // Get or create conversation
      const { data: conversationId, error: conversationError } = await supabase
        .rpc('get_or_create_conversation', {
          user_a: authState.currentUser.id,
          user_b: selectedRecipientId
        });
      
      if (conversationError) throw conversationError;
      
      // Send message with shared post
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: authState.currentUser.id,
          content: message || null,
          shared_post_id: post.id
        });
      
      if (messageError) throw messageError;
      
      // Success
      if (onSuccess) {
        onSuccess();
      }
      
      closeModal();
      
    } catch (error: any) {
      console.error('Error sharing post to DM:', error);
      showError(`An unexpected error occurred: ${error.message}`);
      setLoading(false);
    }
  }
  
  // Event listeners
  modalBackdrop.addEventListener('click', closeModal);
  modalClose.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  shareBtn.addEventListener('click', sharePostToDM);
  
  // Search input
  let searchTimeout: NodeJS.Timeout;
  recipientSearchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      searchUsers(recipientSearchInput.value.trim());
    }, 500);
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
  loadRecentConversations();
  
  return modal;
}