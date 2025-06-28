import { authManager } from '../auth';
import { supabase } from '../lib/supabase';
import { User } from '../types';

export function createGroupChatModal(onClose: () => void, onSuccess?: (groupId: string) => void): HTMLElement {
  const modal = document.createElement('div');
  modal.className = 'group-chat-modal';
  
  let selectedUsers: User[] = [];
  let allUsers: User[] = [];
  let isLoading = false;
  
  modal.innerHTML = `
    <div class="modal-backdrop"></div>
    <div class="group-chat-content">
      <div class="group-chat-header">
        <h2>Create Group Chat</h2>
        <button class="modal-close">✕</button>
      </div>
      
      <div class="group-chat-body">
        <form id="group-chat-form">
          <div class="form-group">
            <label for="group-name">Group Name *</label>
            <input type="text" id="group-name" class="form-input" placeholder="e.g., Travel Buddies" required>
            <small class="form-help">Choose a descriptive name for your group</small>
          </div>
          
          <div class="form-group">
            <label for="group-description">Description</label>
            <textarea id="group-description" class="form-input" placeholder="What is this group about?" rows="2"></textarea>
            <small class="form-help">Optional description for your group</small>
          </div>
          
          <div class="form-group">
            <label>Add Members *</label>
            <div class="search-members-container">
              <div class="search-input-wrapper">
                <input type="text" id="search-members" class="form-input" placeholder="Search users...">
                <button type="button" class="search-clear-btn" style="display: none;">✕</button>
              </div>
              <div class="search-results" style="display: none;"></div>
            </div>
            
            <div class="selected-members-container">
              <div class="selected-members-list"></div>
              <small class="form-help">Select at least one member to create a group</small>
            </div>
          </div>
          
          <div class="form-error" id="group-chat-form-error"></div>
          
          <div class="form-actions">
            <button type="button" class="cancel-btn">Cancel</button>
            <button type="submit" class="create-btn">
              <span class="btn-text">Create Group</span>
              <span class="btn-loading" style="display: none;">Creating...</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    .group-chat-modal {
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

    .group-chat-content {
      background: white;
      border-radius: 1rem;
      width: 100%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    }

    .group-chat-header {
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

    .group-chat-header h2 {
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

    .group-chat-body {
      padding: 1.5rem;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-group label {
      display: block;
      font-weight: 600;
      color: #334155;
      margin-bottom: 0.5rem;
    }

    .form-input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #cbd5e1;
      border-radius: 0.5rem;
      font-size: 1rem;
      transition: border-color 0.2s;
    }

    .form-input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .form-help {
      display: block;
      margin-top: 0.25rem;
      font-size: 0.875rem;
      color: #64748b;
    }

    .search-input-wrapper {
      position: relative;
      margin-bottom: 0.5rem;
    }

    .search-clear-btn {
      position: absolute;
      right: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      background: #f1f5f9;
      color: #64748b;
      border: none;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
      transition: all 0.2s;
    }

    .search-clear-btn:hover {
      background: #e2e8f0;
      color: #475569;
    }

    .search-results {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      max-height: 200px;
      overflow-y: auto;
      margin-bottom: 1rem;
    }

    .search-result-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      cursor: pointer;
      transition: background 0.2s;
    }

    .search-result-item:hover {
      background: #f8fafc;
    }

    .search-result-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
    }

    .search-result-info {
      flex: 1;
    }

    .search-result-name {
      font-weight: 600;
      color: #1e293b;
      font-size: 0.875rem;
    }

    .search-result-meta {
      color: #64748b;
      font-size: 0.75rem;
    }

    .selected-members-container {
      margin-top: 1rem;
    }

    .selected-members-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .selected-member {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #f1f5f9;
      padding: 0.5rem 0.75rem;
      border-radius: 2rem;
      font-size: 0.875rem;
      color: #334155;
    }

    .selected-member-avatar {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      object-fit: cover;
    }

    .selected-member-name {
      font-weight: 500;
    }

    .remove-member-btn {
      background: none;
      border: none;
      color: #64748b;
      cursor: pointer;
      padding: 0.25rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .remove-member-btn:hover {
      background: #e2e8f0;
      color: #ef4444;
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

    .create-btn {
      background: #667eea;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
    }

    .create-btn:hover {
      background: #5a67d8;
    }

    .create-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-loading {
      display: none;
    }

    /* Responsive design */
    @media (max-width: 768px) {
      .group-chat-content {
        max-width: 100%;
        margin: 0 1rem;
      }
    }

    @media (max-width: 480px) {
      .group-chat-header {
        padding: 1rem;
      }

      .group-chat-body {
        padding: 1rem;
      }

      .form-actions {
        flex-direction: column;
      }

      .cancel-btn, .create-btn {
        width: 100%;
      }
    }
  `;
  
  if (!document.head.querySelector('#group-chat-modal-styles')) {
    style.id = 'group-chat-modal-styles';
    document.head.appendChild(style);
  }
  
  // Get elements
  const modalBackdrop = modal.querySelector('.modal-backdrop') as HTMLElement;
  const modalClose = modal.querySelector('.modal-close') as HTMLButtonElement;
  const form = modal.querySelector('#group-chat-form') as HTMLFormElement;
  const cancelBtn = modal.querySelector('.cancel-btn') as HTMLButtonElement;
  const createBtn = modal.querySelector('.create-btn') as HTMLButtonElement;
  const errorElement = modal.querySelector('#group-chat-form-error') as HTMLElement;
  const searchInput = modal.querySelector('#search-members') as HTMLInputElement;
  const searchClearBtn = modal.querySelector('.search-clear-btn') as HTMLButtonElement;
  const searchResults = modal.querySelector('.search-results') as HTMLElement;
  const selectedMembersList = modal.querySelector('.selected-members-list') as HTMLElement;
  
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
    const btnText = createBtn.querySelector('.btn-text') as HTMLElement;
    const btnLoading = createBtn.querySelector('.btn-loading') as HTMLElement;
    
    isLoading = loading;
    createBtn.disabled = loading;
    cancelBtn.disabled = loading;
    
    if (loading) {
      btnText.style.display = 'none';
      btnLoading.style.display = 'inline';
    } else {
      btnText.style.display = 'inline';
      btnLoading.style.display = 'none';
    }
  }
  
  // Load users for search
  async function loadUsers() {
    const authState = authManager.getAuthState();
    if (!authState.isAuthenticated || !authState.currentUser) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', authState.currentUser.id)
        .order('name');
      
      if (error) throw error;
      
      allUsers = data || [];
    } catch (error) {
      console.error('Error loading users:', error);
    }
  }
  
  // Search users
  function searchUsers(query: string) {
    if (!query.trim()) {
      searchResults.style.display = 'none';
      return;
    }
    
    const filteredUsers = allUsers.filter(user => {
      // Exclude already selected users
      if (selectedUsers.some(selected => selected.id === user.id)) {
        return false;
      }
      
      // Match by name
      return user.name.toLowerCase().includes(query.toLowerCase());
    });
    
    if (filteredUsers.length === 0) {
      searchResults.style.display = 'none';
      return;
    }
    
    searchResults.innerHTML = filteredUsers.map(user => `
      <div class="search-result-item" data-user-id="${user.id}">
        <img src="${user.avatar_url || 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'}" alt="${user.name}" class="search-result-avatar">
        <div class="search-result-info">
          <div class="search-result-name">${user.name}</div>
          <div class="search-result-meta">Traveler</div>
        </div>
      </div>
    `).join('');
    
    searchResults.style.display = 'block';
    
    // Add click handlers
    const resultItems = searchResults.querySelectorAll('.search-result-item');
    resultItems.forEach(item => {
      item.addEventListener('click', () => {
        const userId = item.getAttribute('data-user-id')!;
        const user = allUsers.find(u => u.id === userId);
        if (user) {
          addSelectedUser(user);
          searchInput.value = '';
          searchResults.style.display = 'none';
          searchClearBtn.style.display = 'none';
        }
      });
    });
  }
  
  // Add selected user
  function addSelectedUser(user: User) {
    if (selectedUsers.some(selected => selected.id === user.id)) {
      return;
    }
    
    selectedUsers.push(user);
    updateSelectedUsersList();
  }
  
  // Remove selected user
  function removeSelectedUser(userId: string) {
    selectedUsers = selectedUsers.filter(user => user.id !== userId);
    updateSelectedUsersList();
  }
  
  // Update selected users list
  function updateSelectedUsersList() {
    selectedMembersList.innerHTML = selectedUsers.map(user => `
      <div class="selected-member">
        <img src="${user.avatar_url || 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'}" alt="${user.name}" class="selected-member-avatar">
        <span class="selected-member-name">${user.name}</span>
        <button type="button" class="remove-member-btn" data-user-id="${user.id}">✕</button>
      </div>
    `).join('');
    
    // Add click handlers for remove buttons
    const removeButtons = selectedMembersList.querySelectorAll('.remove-member-btn');
    removeButtons.forEach(button => {
      button.addEventListener('click', () => {
        const userId = button.getAttribute('data-user-id')!;
        removeSelectedUser(userId);
      });
    });
    
    // Update create button state
    createBtn.disabled = selectedUsers.length === 0;
  }
  
  // Create group chat
  async function createGroupChat() {
    const authState = authManager.getAuthState();
    if (!authState.isAuthenticated || !authState.currentUser) {
      showError('You must be logged in to create a group chat.');
      return;
    }
    
    const nameInput = document.getElementById('group-name') as HTMLInputElement;
    const descriptionInput = document.getElementById('group-description') as HTMLTextAreaElement;
    
    const name = nameInput.value.trim();
    const description = descriptionInput.value.trim();
    
    if (!name) {
      showError('Group name is required.');
      return;
    }
    
    if (selectedUsers.length === 0) {
      showError('Please select at least one member for the group.');
      return;
    }
    
    setLoading(true);
    clearError();
    
    try {
      // Call the create_group_chat function
      const { data, error } = await supabase.rpc('create_group_chat', {
        chat_name: name,
        chat_description: description || null,
        creator_id: authState.currentUser.id,
        member_ids: selectedUsers.map(user => user.id)
      });
      
      if (error) throw error;
      
      const groupId = data;
      
      if (onSuccess) {
        onSuccess(groupId);
      }
      
      closeModal();
      
    } catch (error: any) {
      console.error('Error creating group chat:', error);
      showError(`Failed to create group chat: ${error.message}`);
      setLoading(false);
    }
  }
  
  // Event listeners
  modalBackdrop.addEventListener('click', closeModal);
  modalClose.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  
  // Search input
  let searchTimeout: NodeJS.Timeout;
  
  searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim();
    
    // Show/hide clear button
    searchClearBtn.style.display = query ? 'flex' : 'none';
    
    // Debounce search
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      searchUsers(query);
    }, 300);
  });
  
  searchClearBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchClearBtn.style.display = 'none';
    searchResults.style.display = 'none';
  });
  
  // Close search results when clicking outside
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target as Node) && !searchResults.contains(e.target as Node)) {
      searchResults.style.display = 'none';
    }
  });
  
  // Form submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    createGroupChat();
  });
  
  // Close on escape key
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && !isLoading) {
      closeModal();
    }
  };
  
  document.addEventListener('keydown', handleKeyDown);
  
  // Cleanup
  modal.addEventListener('remove', () => {
    document.removeEventListener('keydown', handleKeyDown);
  });
  
  // Initial load
  loadUsers();
  
  return modal;
}