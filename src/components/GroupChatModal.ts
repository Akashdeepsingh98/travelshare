import { authManager } from '../auth';
import { supabase } from '../lib/supabase';
import { User } from '../types';

export function createGroupChatModal(onClose: () => void, onSuccess?: (groupId: string) => void): HTMLElement {
  const modal = document.createElement('div');
  modal.className = 'group-chat-modal';
  
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
      max-width: 600px;
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

    .group-intro {
      margin-bottom: 1.5rem;
    }

    .group-intro p {
      color: #64748b;
      line-height: 1.6;
      margin: 0;
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

    .members-section {
      margin-bottom: 1.5rem;
    }

    .members-section h3 {
      font-size: 1.125rem;
      font-weight: 600;
      color: #334155;
      margin: 0 0 1rem 0;
    }

    .members-search {
      margin-bottom: 1rem;
    }

    .members-search-input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #cbd5e1;
      border-radius: 0.5rem;
      font-size: 0.875rem;
    }

    .members-search-input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
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
      transition: all 0.2s;
    }

    .user-item:hover {
      background: #f8fafc;
      border-color: #cbd5e1;
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

    .add-user-btn {
      background: #667eea;
      color: white;
      border: none;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      cursor: pointer;
      font-size: 0.75rem;
      font-weight: 500;
      transition: all 0.2s;
    }

    .add-user-btn:hover {
      background: #5a67d8;
    }

    .add-user-btn.added {
      background: #10b981;
    }

    .add-user-btn.added:hover {
      background: #059669;
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

    .selected-members {
      margin-top: 1.5rem;
    }

    .selected-members h4 {
      margin: 0 0 0.5rem 0;
      font-size: 0.875rem;
      font-weight: 600;
      color: #64748b;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .clear-selection {
      background: none;
      border: none;
      color: #ef4444;
      font-size: 0.75rem;
      cursor: pointer;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      transition: all 0.2s;
    }

    .clear-selection:hover {
      background: #fee2e2;
    }

    .selected-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .selected-member {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #f1f5f9;
      padding: 0.5rem 0.75rem;
      border-radius: 2rem;
    }

    .selected-member-avatar {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      object-fit: cover;
    }

    .selected-member-name {
      font-size: 0.875rem;
      color: #334155;
    }

    .remove-member-btn {
      background: none;
      border: none;
      color: #64748b;
      cursor: pointer;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .remove-member-btn:hover {
      background: #e2e8f0;
      color: #334155;
    }

    .selected-empty {
      padding: 1rem;
      text-align: center;
      color: #64748b;
      font-size: 0.875rem;
      background: #f8fafc;
      border-radius: 0.5rem;
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
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .create-btn:hover:not(:disabled) {
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
  
  // State variables
  let selectedMembers: User[] = [];
  let searchResults: User[] = [];
  let isSearching = false;
  let isLoading = false;
  
  // Render modal content
  modal.innerHTML = `
    <div class="modal-backdrop"></div>
    <div class="group-chat-content">
      <div class="group-chat-header">
        <h2>Create Group Chat</h2>
        <button class="modal-close">✕</button>
      </div>
      
      <div class="group-chat-body">
        <div class="group-intro">
          <p>Create a group chat to communicate with multiple travelers at once. Share experiences, plan trips together, and stay connected!</p>
        </div>
        
        <form id="group-chat-form">
          <div class="form-group">
            <label for="group-name">Group Name *</label>
            <input type="text" id="group-name" class="form-input" placeholder="e.g., Japan Trip 2025" required>
            <small class="form-help">Choose a descriptive name for your group</small>
          </div>
          
          <div class="form-group">
            <label for="group-description">Description (Optional)</label>
            <textarea id="group-description" class="form-input" placeholder="What's this group about?" rows="3"></textarea>
            <small class="form-help">Provide a brief description of the group's purpose</small>
          </div>
          
          <div class="members-section">
            <h3>Add Members</h3>
            
            <div class="members-search">
              <input type="text" class="members-search-input" placeholder="Search for users to add...">
            </div>
            
            <div class="search-results">
              <h4>Search Results</h4>
              <div class="user-list">
                <div class="search-empty">
                  <p>Search for users to add to your group</p>
                </div>
              </div>
            </div>
            
            <div class="selected-members">
              <h4>
                Selected Members
                <button type="button" class="clear-selection" style="display: none;">Clear All</button>
              </h4>
              
              <div class="selected-list">
                <div class="selected-empty">
                  <p>No members selected yet</p>
                </div>
              </div>
            </div>
          </div>
          
          <div class="form-error" id="group-form-error"></div>
          
          <div class="form-actions">
            <button type="button" class="cancel-btn">Cancel</button>
            <button type="submit" class="create-btn" disabled>
              <span class="btn-text">Create Group</span>
              <span class="btn-loading">
                <span class="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
                Creating...
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  // Get elements
  const modalBackdrop = modal.querySelector('.modal-backdrop') as HTMLElement;
  const modalClose = modal.querySelector('.modal-close') as HTMLButtonElement;
  const form = modal.querySelector('#group-chat-form') as HTMLFormElement;
  const searchInput = modal.querySelector('.members-search-input') as HTMLInputElement;
  const userList = modal.querySelector('.user-list') as HTMLElement;
  const selectedList = modal.querySelector('.selected-list') as HTMLElement;
  const clearSelectionBtn = modal.querySelector('.clear-selection') as HTMLButtonElement;
  const errorElement = modal.querySelector('#group-form-error') as HTMLElement;
  const cancelBtn = modal.querySelector('.cancel-btn') as HTMLButtonElement;
  const createBtn = modal.querySelector('.create-btn') as HTMLButtonElement;
  
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
    isLoading = loading;
    createBtn.disabled = loading || selectedMembers.length === 0;
    cancelBtn.disabled = loading;
    searchInput.disabled = loading;
    
    const btnText = createBtn.querySelector('.btn-text') as HTMLElement;
    const btnLoading = createBtn.querySelector('.btn-loading') as HTMLElement;
    
    if (loading) {
      btnText.style.display = 'none';
      btnLoading.style.display = 'inline-flex';
    } else {
      btnText.style.display = 'inline';
      btnLoading.style.display = 'none';
    }
  }
  
  // Update selected members list
  function updateSelectedMembers() {
    const hasSelectedMembers = selectedMembers.length > 0;
    
    // Show/hide clear selection button
    clearSelectionBtn.style.display = hasSelectedMembers ? 'block' : 'none';
    
    // Enable/disable create button
    createBtn.disabled = !hasSelectedMembers || isLoading;
    
    if (!hasSelectedMembers) {
      selectedList.innerHTML = `
        <div class="selected-empty">
          <p>No members selected yet</p>
        </div>
      `;
      return;
    }
    
    // Render selected members
    selectedList.innerHTML = `
      <div class="selected-list">
        ${selectedMembers.map(member => `
          <div class="selected-member" data-user-id="${member.id}">
            <img src="${member.avatar_url || 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'}" alt="${member.name}" class="selected-member-avatar">
            <span class="selected-member-name">${member.name}</span>
            <button class="remove-member-btn" data-user-id="${member.id}">✕</button>
          </div>
        `).join('')}
      </div>
    `;
    
    // Add event listeners for remove buttons
    const removeButtons = selectedList.querySelectorAll('.remove-member-btn');
    removeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const userId = btn.getAttribute('data-user-id');
        if (userId) {
          // Remove from selected members
          selectedMembers = selectedMembers.filter(member => member.id !== userId);
          
          // Update UI
          updateSelectedMembers();
          
          // Update search results to show "Add" button again
          renderSearchResults();
        }
      });
    });
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
  
  // Render search results
  function renderSearchResults() {
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
    
    userList.innerHTML = searchResults.map(user => {
      const isSelected = selectedMembers.some(member => member.id === user.id);
      
      return `
        <div class="user-item">
          <img src="${user.avatar_url || 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'}" alt="${user.name}" class="user-avatar">
          <div class="user-info">
            <h3 class="user-name">${user.name}</h3>
            <p class="user-meta">Traveler</p>
          </div>
          <button class="add-user-btn ${isSelected ? 'added' : ''}" data-user-id="${user.id}">
            ${isSelected ? 'Added' : 'Add'}
          </button>
        </div>
      `;
    }).join('');
    
    // Add event listeners for add buttons
    const addButtons = userList.querySelectorAll('.add-user-btn');
    addButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const userId = btn.getAttribute('data-user-id');
        if (userId) {
          const user = searchResults.find(u => u.id === userId);
          if (user) {
            const isAlreadySelected = selectedMembers.some(member => member.id === userId);
            
            if (isAlreadySelected) {
              // Remove from selected members
              selectedMembers = selectedMembers.filter(member => member.id !== userId);
            } else {
              // Add to selected members
              selectedMembers.push(user);
            }
            
            // Update UI
            updateSelectedMembers();
            renderSearchResults();
          }
        }
      });
    });
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
    
    // Validate required fields
    if (!name) {
      showError('Group name is required.');
      return;
    }
    
    if (selectedMembers.length === 0) {
      showError('Please select at least one member for the group.');
      return;
    }
    
    clearError();
    setLoading(true);
    
    try {
      // Get member IDs
      const memberIds = selectedMembers.map(member => member.id);
      
      // Create group chat using RPC function
      const { data, error } = await supabase
        .rpc('create_group_chat', {
          chat_name: name,
          chat_description: description || null,
          creator_id: authState.currentUser.id,
          member_ids: memberIds
        });
      
      if (error) throw error;
      
      // Success
      if (onSuccess) {
        onSuccess(data);
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
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      searchUsers(searchInput.value.trim());
    }, 500);
  });
  
  // Clear selection button
  clearSelectionBtn.addEventListener('click', () => {
    selectedMembers = [];
    updateSelectedMembers();
    renderSearchResults();
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
  
  // Initial setup
  updateSelectedMembers();
  
  return modal;
}