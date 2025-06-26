import { authManager } from '../auth';
import { supabase } from '../lib/supabase';

export function createCreateCommunityModal(onClose: () => void, onSuccess?: () => void): HTMLElement {
  const modal = document.createElement('div');
  modal.className = 'create-community-modal';
  
  modal.innerHTML = `
    <div class="modal-backdrop"></div>
    <div class="create-community-content">
      <div class="create-community-header">
        <h2>Create a New Community</h2>
        <button class="modal-close">✕</button>
      </div>
      
      <div class="create-community-body">
        <form id="create-community-form">
          <div class="form-group">
            <label for="community-name">Community Name *</label>
            <input type="text" id="community-name" class="form-input" placeholder="e.g., Japan Travelers" required>
            <small class="form-help">Choose a descriptive name for your community</small>
          </div>
          
          <div class="form-group">
            <label for="community-description">Description</label>
            <textarea id="community-description" class="form-input" placeholder="What is this community about?" rows="4"></textarea>
            <small class="form-help">Describe the purpose and focus of your community</small>
          </div>
          
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" id="community-private">
              <span class="checkbox-custom"></span>
              Make this community private
            </label>
            <small class="form-help">Private communities are only visible to members</small>
          </div>
          
          <div class="form-error" id="community-form-error"></div>
          
          <div class="form-actions">
            <button type="button" class="cancel-btn">Cancel</button>
            <button type="submit" class="create-btn">
              <span class="btn-text">Create Community</span>
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
    .create-community-modal {
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

    .create-community-content {
      background: white;
      border-radius: 1rem;
      width: 100%;
      max-width: 500px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .create-community-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.5rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .create-community-header h2 {
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

    .create-community-body {
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

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
    }

    .checkbox-custom {
      width: 20px;
      height: 20px;
      border: 2px solid #cbd5e1;
      border-radius: 0.25rem;
      position: relative;
      transition: all 0.2s;
    }

    .checkbox-label input[type="checkbox"] {
      display: none;
    }

    .checkbox-label input[type="checkbox"]:checked + .checkbox-custom {
      background: #667eea;
      border-color: #667eea;
    }

    .checkbox-label input[type="checkbox"]:checked + .checkbox-custom::after {
      content: '✓';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      font-size: 0.875rem;
      font-weight: bold;
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
      .create-community-content {
        max-width: 100%;
        margin: 0 1rem;
      }
    }

    @media (max-width: 480px) {
      .create-community-header {
        padding: 1rem;
      }

      .create-community-body {
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
  
  if (!document.head.querySelector('#create-community-styles')) {
    style.id = 'create-community-styles';
    document.head.appendChild(style);
  }
  
  // Get elements
  const modalBackdrop = modal.querySelector('.modal-backdrop') as HTMLElement;
  const modalClose = modal.querySelector('.modal-close') as HTMLButtonElement;
  const form = modal.querySelector('#create-community-form') as HTMLFormElement;
  const cancelBtn = modal.querySelector('.cancel-btn') as HTMLButtonElement;
  const createBtn = modal.querySelector('.create-btn') as HTMLButtonElement;
  const errorElement = modal.querySelector('#community-form-error') as HTMLElement;
  
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
  
  // Event listeners
  modalBackdrop.addEventListener('click', closeModal);
  modalClose.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  
  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();
    
    const authState = authManager.getAuthState();
    if (!authState.isAuthenticated || !authState.currentUser) {
      showError('You must be logged in to create a community.');
      return;
    }
    
    const nameInput = document.getElementById('community-name') as HTMLInputElement;
    const descriptionInput = document.getElementById('community-description') as HTMLTextAreaElement;
    const privateInput = document.getElementById('community-private') as HTMLInputElement;
    
    const name = nameInput.value.trim();
    const description = descriptionInput.value.trim();
    const isPrivate = privateInput.checked;
    
    if (!name) {
      showError('Community name is required.');
      return;
    }
    
    if (name.length < 3) {
      showError('Community name must be at least 3 characters.');
      return;
    }
    
    if (name.length > 50) {
      showError('Community name must be less than 50 characters.');
      return;
    }
    
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('communities')
        .insert({
          name,
          description: description || null,
          created_by: authState.currentUser.id,
          is_private: isPrivate
        })
        .select()
        .single();
      
      if (error) {
        if (error.code === '23505') {
          showError('A community with this name already exists. Please choose a different name.');
        } else {
          showError(`Error creating community: ${error.message}`);
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
      console.error('Error creating community:', error);
      showError(`An unexpected error occurred: ${error.message}`);
      setLoading(false);
    }
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
  
  return modal;
}