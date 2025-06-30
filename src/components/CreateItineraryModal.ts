import { authManager } from '../auth';
import { supabase } from '../lib/supabase';
import { ItineraryPreference } from '../types';

export function createItineraryModal(onClose: () => void, onSuccess?: () => void): HTMLElement {
  const modal = document.createElement('div');
  modal.className = 'create-itinerary-modal';
  
  // Available preferences for itinerary generation
  const availablePreferences: ItineraryPreference[] = [
    { id: 'culture', label: 'Cultural Experiences', icon: '🏛️' },
    { id: 'nature', label: 'Nature & Outdoors', icon: '🌲' },
    { id: 'food', label: 'Food & Dining', icon: '🍽️' },
    { id: 'adventure', label: 'Adventure Activities', icon: '🧗‍♀️' },
    { id: 'relaxation', label: 'Relaxation', icon: '🧘‍♂️' },
    { id: 'shopping', label: 'Shopping', icon: '🛍️' },
    { id: 'nightlife', label: 'Nightlife', icon: '🌃' },
    { id: 'family', label: 'Family-Friendly', icon: '👨‍👩‍👧‍👦' },
    { id: 'budget', label: 'Budget-Friendly', icon: '💰' },
    { id: 'luxury', label: 'Luxury', icon: '✨' },
    { id: 'history', label: 'Historical Sites', icon: '🏰' },
    { id: 'art', label: 'Art & Museums', icon: '🎨' },
    { id: 'beach', label: 'Beaches', icon: '🏖️' },
    { id: 'mountains', label: 'Mountains', icon: '⛰️' },
    { id: 'photography', label: 'Photography Spots', icon: '📸' }
  ];
  
  let selectedPreferences: string[] = [];
  let isGenerating = false;
  
  modal.innerHTML = `
    <div class="modal-backdrop"></div>
    <div class="itinerary-modal-content">
      <div class="itinerary-modal-header">
        <h2>Create AI Travel Itinerary</h2>
        <button class="modal-close">✕</button>
      </div>
      
      <div class="itinerary-modal-body">
        <div class="itinerary-intro">
          <p>Let our AI create a personalized travel itinerary based on your preferences. Just tell us where you're going, when, and what you like!</p>
        </div>
        
        <form id="itinerary-form">
          <div class="form-group">
            <label for="destination">Destination *</label>
            <input type="text" id="destination" class="form-input" placeholder="e.g., Tokyo, Japan" required>
            <small class="form-help">City, country, or specific region you plan to visit</small>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="start-date">Start Date</label>
              <input type="date" id="start-date" class="form-input">
            </div>
            
            <div class="form-group">
              <label for="end-date">End Date</label>
              <input type="date" id="end-date" class="form-input">
            </div>
          </div>
          
          <div class="form-group">
            <label for="budget">Budget Range</label>
            <select id="budget" class="form-input">
              <option value="">Select budget range...</option>
              <option value="budget">Budget ($)</option>
              <option value="moderate">Moderate ($$)</option>
              <option value="luxury">Luxury ($$$)</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>Travel Preferences (select up to 5)</label>
            <div class="preferences-grid">
              ${availablePreferences.map(pref => `
                <div class="preference-item" data-preference="${pref.id}">
                  <span class="preference-icon">${pref.icon}</span>
                  <span class="preference-label">${pref.label}</span>
                </div>
              `).join('')}
            </div>
            <small class="form-help">Select what matters most for your trip</small>
          </div>
          
          <div class="form-group">
            <label for="notes">Additional Notes</label>
            <textarea id="notes" class="form-input" placeholder="Any specific requests or information for your itinerary..." rows="3"></textarea>
            <small class="form-help">Special requirements, accessibility needs, or specific places you want to visit</small>
          </div>
          
          <div class="form-error" id="itinerary-form-error" style="display: none;"></div>
          
          <div class="form-actions">
            <button type="button" class="cancel-btn">Cancel</button>
            <button type="submit" class="generate-btn">
              <span class="btn-text">Generate Itinerary</span>
              <span class="btn-loading" style="display: none;">
                <span class="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
                Generating...
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
    .create-itinerary-modal {
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

    .itinerary-modal-content {
      background: white;
      border-radius: 1rem;
      width: 100%;
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    }

    .itinerary-modal-header {
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

    .itinerary-modal-header h2 {
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

    .itinerary-modal-body {
      padding: 1.5rem;
    }

    .itinerary-intro {
      margin-bottom: 1.5rem;
    }

    .itinerary-intro p {
      color: #64748b;
      line-height: 1.6;
      margin: 0;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-row {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .form-row .form-group {
      flex: 1;
      margin-bottom: 0;
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

    .preferences-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 0.75rem;
      margin-top: 0.5rem;
    }

    .preference-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .preference-item:hover {
      border-color: #cbd5e1;
      background: #f8fafc;
    }

    .preference-item.selected {
      border-color: #667eea;
      background: rgba(102, 126, 234, 0.1);
    }

    .preference-icon {
      font-size: 1.25rem;
    }

    .preference-label {
      font-size: 0.875rem;
      color: #334155;
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

    .generate-btn {
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

    .generate-btn:hover:not(:disabled) {
      background: #5a67d8;
    }

    .generate-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .loading-dots {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      margin-right: 0.5rem;
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
      .itinerary-modal-content {
        max-width: 100%;
        margin: 0 1rem;
      }

      .form-row {
        flex-direction: column;
        gap: 1rem;
      }

      .preferences-grid {
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      }
    }

    @media (max-width: 480px) {
      .itinerary-modal-header {
        padding: 1rem;
      }

      .itinerary-modal-body {
        padding: 1rem;
      }

      .preferences-grid {
        grid-template-columns: 1fr;
      }

      .form-actions {
        flex-direction: column;
      }

      .cancel-btn, .generate-btn {
        width: 100%;
      }
    }
  `;
  
  if (!document.head.querySelector('#create-itinerary-styles')) {
    style.id = 'create-itinerary-styles';
    document.head.appendChild(style);
  }
  
  // Get elements
  const modalBackdrop = modal.querySelector('.modal-backdrop') as HTMLElement;
  const modalClose = modal.querySelector('.modal-close') as HTMLButtonElement;
  const form = modal.querySelector('#itinerary-form') as HTMLFormElement;
  const cancelBtn = modal.querySelector('.cancel-btn') as HTMLButtonElement;
  const generateBtn = modal.querySelector('.generate-btn') as HTMLButtonElement;
  const errorElement = modal.querySelector('#itinerary-form-error') as HTMLElement;
  const preferenceItems = modal.querySelectorAll('.preference-item') as NodeListOf<HTMLElement>;
  
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
    const btnText = generateBtn.querySelector('.btn-text') as HTMLElement;
    const btnLoading = generateBtn.querySelector('.btn-loading') as HTMLElement;
    
    isGenerating = loading;
    generateBtn.disabled = loading;
    cancelBtn.disabled = loading;
    
    if (loading) {
      btnText.style.display = 'none';
      btnLoading.style.display = 'flex';
    } else {
      btnText.style.display = 'inline';
      btnLoading.style.display = 'none';
    }
  }
  
  // Handle preference selection
  preferenceItems.forEach(item => {
    item.addEventListener('click', () => {
      const prefId = item.dataset.preference!;
      
      if (item.classList.contains('selected')) {
        // Deselect
        item.classList.remove('selected');
        selectedPreferences = selectedPreferences.filter(id => id !== prefId);
      } else {
        // Select (if under limit)
        if (selectedPreferences.length < 5) {
          item.classList.add('selected');
          selectedPreferences.push(prefId);
        } else {
          // Show temporary error message
          showError('You can select up to 5 preferences. Deselect one to add another.');
          setTimeout(clearError, 3000);
        }
      }
    });
  });
  
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
      showError('You must be logged in to create an itinerary.');
      return;
    }
    
    const destinationInput = document.getElementById('destination') as HTMLInputElement;
    const startDateInput = document.getElementById('start-date') as HTMLInputElement;
    const endDateInput = document.getElementById('end-date') as HTMLInputElement;
    const budgetInput = document.getElementById('budget') as HTMLSelectElement;
    const notesInput = document.getElementById('notes') as HTMLTextAreaElement;
    
    const destination = destinationInput.value.trim();
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;
    const budget = budgetInput.value;
    const notes = notesInput.value.trim();
    
    if (!destination) {
      showError('Destination is required.');
      return;
    }
    
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      showError('Start date cannot be after end date.');
      return;
    }
    
    if (selectedPreferences.length === 0) {
      showError('Please select at least one preference.');
      return;
    }
    
    setLoading(true);
    
    const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}
    try {
      // Call the AI itinerary builder edge function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-itinerary-builder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          ...corsHeaders
        },
        body: JSON.stringify({
          destination,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          budget: budget || undefined,
          preferences: selectedPreferences,
          notes: notes || undefined,
          userId: authState.currentUser.id
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate itinerary');
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Success
      if (onSuccess) {
        onSuccess();
      }
      
      closeModal();
      
    } catch (error: any) {
      console.error('Error generating itinerary:', error);
      showError(`Failed to generate itinerary: ${error.message}`);
      setLoading(false);
    }
  });
  
  // Close on escape key
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && !isGenerating) {
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