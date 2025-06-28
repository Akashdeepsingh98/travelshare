import { authManager } from '../auth';
import { supabase } from '../lib/supabase';

export function createExpenseFormModal(
  itineraryId: string,
  onClose: () => void,
  onSuccess?: () => void,
  expenseToEdit?: any
): HTMLElement {
  const modal = document.createElement('div');
  modal.className = 'expense-form-modal';
  
  const isEditing = !!expenseToEdit;
  
  modal.innerHTML = `
    <div class="modal-backdrop"></div>
    <div class="expense-form-content">
      <div class="expense-form-header">
        <h2>${isEditing ? 'Edit Expense' : 'Add Expense'}</h2>
        <button class="modal-close">✕</button>
      </div>
      
      <div class="expense-form-body">
        <form id="expense-form">
          <div class="form-group">
            <label for="expense-amount">Amount *</label>
            <div class="amount-input-group">
              <input type="number" id="expense-amount" class="form-input" placeholder="0.00" step="0.01" min="0" required value="${isEditing ? expenseToEdit.amount : ''}">
              <select id="expense-currency" class="currency-select">
                <option value="USD" ${isEditing && expenseToEdit.currency === 'USD' ? 'selected' : ''}>USD ($)</option>
                <option value="EUR" ${isEditing && expenseToEdit.currency === 'EUR' ? 'selected' : ''}>EUR (€)</option>
                <option value="GBP" ${isEditing && expenseToEdit.currency === 'GBP' ? 'selected' : ''}>GBP (£)</option>
                <option value="JPY" ${isEditing && expenseToEdit.currency === 'JPY' ? 'selected' : ''}>JPY (¥)</option>
                <option value="CAD" ${isEditing && expenseToEdit.currency === 'CAD' ? 'selected' : ''}>CAD ($)</option>
                <option value="AUD" ${isEditing && expenseToEdit.currency === 'AUD' ? 'selected' : ''}>AUD ($)</option>
                <option value="CNY" ${isEditing && expenseToEdit.currency === 'CNY' ? 'selected' : ''}>CNY (¥)</option>
              </select>
            </div>
          </div>
          
          <div class="form-group">
            <label for="expense-description">Description *</label>
            <input type="text" id="expense-description" class="form-input" placeholder="e.g., Dinner at Restaurant" required value="${isEditing ? expenseToEdit.description : ''}">
          </div>
          
          <div class="form-group">
            <label for="expense-category">Category *</label>
            <select id="expense-category" class="form-input" required>
              <option value="" disabled ${!isEditing ? 'selected' : ''}>Select category...</option>
              <option value="accommodation" ${isEditing && expenseToEdit.category === 'accommodation' ? 'selected' : ''}>Accommodation</option>
              <option value="food" ${isEditing && expenseToEdit.category === 'food' ? 'selected' : ''}>Food & Dining</option>
              <option value="transportation" ${isEditing && expenseToEdit.category === 'transportation' ? 'selected' : ''}>Transportation</option>
              <option value="activity" ${isEditing && expenseToEdit.category === 'activity' ? 'selected' : ''}>Activities & Entertainment</option>
              <option value="shopping" ${isEditing && expenseToEdit.category === 'shopping' ? 'selected' : ''}>Shopping</option>
              <option value="other" ${isEditing && expenseToEdit.category === 'other' ? 'selected' : ''}>Other</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="expense-date">Date *</label>
            <input type="date" id="expense-date" class="form-input" required value="${isEditing ? expenseToEdit.expense_date : new Date().toISOString().split('T')[0]}">
          </div>
          
          <div class="form-error" id="expense-form-error" style="display: none;"></div>
          
          <div class="form-actions">
            <button type="button" class="cancel-btn">Cancel</button>
            <button type="submit" class="save-btn">
              <span class="btn-text">${isEditing ? 'Update Expense' : 'Add Expense'}</span>
              <span class="btn-loading" style="display: none;">
                <span class="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
                ${isEditing ? 'Updating...' : 'Adding...'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    .expense-form-modal {
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

    .expense-form-content {
      background: white;
      border-radius: 1rem;
      width: 100%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    }

    .expense-form-header {
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

    .expense-form-header h2 {
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

    .expense-form-body {
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

    .amount-input-group {
      display: flex;
      gap: 0.5rem;
    }

    .amount-input-group .form-input {
      flex: 1;
    }

    .currency-select {
      width: 100px;
      padding: 0.75rem;
      border: 1px solid #cbd5e1;
      border-radius: 0.5rem;
      font-size: 1rem;
      transition: border-color 0.2s;
      background: #f8fafc;
    }

    .currency-select:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
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

    .save-btn {
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

    .save-btn:hover:not(:disabled) {
      background: #5a67d8;
    }

    .save-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-loading {
      display: none;
    }

    .loading-dots {
      display: inline-flex;
      gap: 0.25rem;
    }

    .loading-dots span {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: currentColor;
      animation: loading-dots 1.4s ease-in-out infinite both;
    }

    .loading-dots span:nth-child(1) {
      animation-delay: -0.32s;
    }

    .loading-dots span:nth-child(2) {
      animation-delay: -0.16s;
    }

    @keyframes loading-dots {
      0%, 80%, 100% {
        transform: scale(0);
      }
      40% {
        transform: scale(1);
      }
    }

    /* Responsive design */
    @media (max-width: 768px) {
      .expense-form-content {
        max-width: 100%;
        margin: 0 1rem;
      }
    }

    @media (max-width: 480px) {
      .expense-form-header {
        padding: 1rem;
      }

      .expense-form-body {
        padding: 1rem;
      }

      .form-actions {
        flex-direction: column;
      }

      .cancel-btn, .save-btn {
        width: 100%;
      }
    }
  `;
  
  if (!document.head.querySelector('#expense-form-styles')) {
    style.id = 'expense-form-styles';
    document.head.appendChild(style);
  }
  
  // Get elements
  const modalBackdrop = modal.querySelector('.modal-backdrop') as HTMLElement;
  const modalClose = modal.querySelector('.modal-close') as HTMLButtonElement;
  const form = modal.querySelector('#expense-form') as HTMLFormElement;
  const cancelBtn = modal.querySelector('.cancel-btn') as HTMLButtonElement;
  const saveBtn = modal.querySelector('.save-btn') as HTMLButtonElement;
  const errorElement = modal.querySelector('#expense-form-error') as HTMLElement;
  
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
    const btnText = saveBtn.querySelector('.btn-text') as HTMLElement;
    const btnLoading = saveBtn.querySelector('.btn-loading') as HTMLElement;
    
    saveBtn.disabled = loading;
    cancelBtn.disabled = loading;
    
    if (loading) {
      btnText.style.display = 'none';
      btnLoading.style.display = 'inline-flex';
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
      showError('You must be logged in to add expenses.');
      return;
    }
    
    const amountInput = document.getElementById('expense-amount') as HTMLInputElement;
    const currencyInput = document.getElementById('expense-currency') as HTMLSelectElement;
    const descriptionInput = document.getElementById('expense-description') as HTMLInputElement;
    const categoryInput = document.getElementById('expense-category') as HTMLSelectElement;
    const dateInput = document.getElementById('expense-date') as HTMLInputElement;
    
    const amount = parseFloat(amountInput.value);
    const currency = currencyInput.value;
    const description = descriptionInput.value.trim();
    const category = categoryInput.value;
    const expenseDate = dateInput.value;
    
    if (isNaN(amount) || amount <= 0) {
      showError('Please enter a valid amount greater than zero.');
      return;
    }
    
    if (!description) {
      showError('Description is required.');
      return;
    }
    
    if (!category) {
      showError('Please select a category.');
      return;
    }
    
    if (!expenseDate) {
      showError('Date is required.');
      return;
    }
    
    setLoading(true);
    
    try {
      if (isEditing) {
        // Update existing expense
        const { error } = await supabase
          .from('expenses')
          .update({
            amount,
            currency,
            description,
            category,
            expense_date: expenseDate,
            updated_at: new Date().toISOString()
          })
          .eq('id', expenseToEdit.id)
          .eq('user_id', authState.currentUser.id);
        
        if (error) throw error;
      } else {
        // Create new expense
        const { error } = await supabase
          .from('expenses')
          .insert({
            itinerary_id: itineraryId,
            user_id: authState.currentUser.id,
            amount,
            currency,
            description,
            category,
            expense_date: expenseDate
          });
        
        if (error) throw error;
      }
      
      // Success
      if (onSuccess) {
        onSuccess();
      }
      
      closeModal();
      
    } catch (error: any) {
      console.error('Error saving expense:', error);
      showError(`Failed to save expense: ${error.message}`);
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