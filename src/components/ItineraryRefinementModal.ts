import { Itinerary, ItineraryItem } from '../types';
import { supabase } from '../lib/supabase';

export function createItineraryRefinementModal(
  itinerary: Itinerary,
  itineraryItems: ItineraryItem[],
  onClose: () => void,
  onSuccess: () => void
): HTMLElement {
  const modal = document.createElement('div');
  modal.className = 'refine-modal';
  
  // Example refinement prompts
  const examplePrompts = [
    'Make it more budget-friendly',
    'Add more cultural activities',
    'Include more outdoor activities',
    'Make it more family-friendly',
    'Add a cooking class on day 2',
    'Suggest better restaurants',
    'Add more free time',
    'Make it more relaxing',
    'Focus more on historical sites',
    'Include local transportation options'
  ];
  
  modal.innerHTML = `
    <div class="refine-modal-content">
      <div class="refine-modal-header">
        <h2>Refine Itinerary with AI</h2>
        <button class="refine-modal-close">✕</button>
      </div>
      
      <div class="refine-modal-body">
        <div class="refine-intro">
          <p>Tell our AI how you'd like to refine your itinerary. Be specific about what you want to change or improve.</p>
        </div>
        
        <div class="refine-form">
          <label for="refine-instructions">Refinement Instructions</label>
          <textarea id="refine-instructions" class="refine-textarea" placeholder="e.g., Make it more budget-friendly, add more outdoor activities, include a cooking class on day 2..."></textarea>
        </div>
        
        <div class="refine-examples">
          <h3>Examples</h3>
          <div class="example-list">
            ${examplePrompts.map(prompt => `
              <button class="example-chip">${prompt}</button>
            `).join('')}
          </div>
        </div>
        
        <div class="refine-error" id="refine-error"></div>
        
        <div class="refine-actions">
          <button class="refine-cancel-btn">Cancel</button>
          <button class="refine-submit-btn">
            <span class="refine-btn-text">Refine Itinerary</span>
            <span class="refine-loading" style="display: none;">
              <span class="refine-loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </span>
              Refining...
            </span>
          </button>
        </div>
      </div>
    </div>
  `;
  
  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    .refine-modal {
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

    .refine-modal-content {
      background: white;
      border-radius: 1rem;
      width: 100%;
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    }

    .refine-modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.5rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .refine-modal-header h2 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #1e293b;
    }

    .refine-modal-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #64748b;
      padding: 0.5rem;
      border-radius: 0.5rem;
      transition: all 0.2s;
    }

    .refine-modal-close:hover {
      background: #f1f5f9;
      color: #334155;
    }

    .refine-modal-body {
      padding: 1.5rem;
    }

    .refine-intro {
      margin-bottom: 1.5rem;
    }

    .refine-intro p {
      color: #64748b;
      line-height: 1.6;
      margin: 0;
    }

    .refine-form {
      margin-bottom: 1.5rem;
    }

    .refine-form label {
      display: block;
      font-weight: 600;
      color: #334155;
      margin-bottom: 0.5rem;
    }

    .refine-textarea {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #cbd5e1;
      border-radius: 0.5rem;
      font-size: 1rem;
      min-height: 120px;
      resize: vertical;
      transition: border-color 0.2s;
    }

    .refine-textarea:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .refine-examples {
      background: #f8fafc;
      border-radius: 0.5rem;
      padding: 1rem;
      margin-bottom: 1.5rem;
    }

    .refine-examples h3 {
      color: #334155;
      font-size: 0.875rem;
      font-weight: 600;
      margin: 0 0 0.75rem 0;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .example-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .example-chip {
      background: #e0f2fe;
      color: #0369a1;
      padding: 0.5rem 0.75rem;
      border-radius: 1rem;
      font-size: 0.75rem;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
    }

    .example-chip:hover {
      background: #bae6fd;
      transform: translateY(-1px);
    }

    .refine-error {
      color: #ef4444;
      font-size: 0.875rem;
      margin-bottom: 1rem;
      padding: 0.75rem;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 0.5rem;
      display: none;
    }

    .refine-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
    }

    .refine-cancel-btn {
      background: #f1f5f9;
      color: #334155;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
    }

    .refine-cancel-btn:hover {
      background: #e2e8f0;
    }

    .refine-submit-btn {
      background: #10b981;
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

    .refine-submit-btn:hover:not(:disabled) {
      background: #059669;
    }

    .refine-submit-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .refine-loading {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .refine-loading-dots {
      display: inline-flex;
      gap: 0.25rem;
    }

    .refine-loading-dots span {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: currentColor;
      animation: loading-dots 1.4s ease-in-out infinite both;
    }

    .refine-loading-dots span:nth-child(1) {
      animation-delay: -0.32s;
    }

    .refine-loading-dots span:nth-child(2) {
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
      .refine-modal-content {
        max-width: 100%;
        margin: 0 1rem;
      }

      .refine-modal-header {
        padding: 1rem;
      }

      .refine-modal-body {
        padding: 1rem;
      }

      .refine-actions {
        flex-direction: column;
      }

      .refine-cancel-btn, .refine-submit-btn {
        width: 100%;
      }
    }
  `;
  
  if (!document.head.querySelector('#refine-modal-styles')) {
    style.id = 'refine-modal-styles';
    document.head.appendChild(style);
  }
  
  // Get elements
  const closeBtn = modal.querySelector('.refine-modal-close') as HTMLButtonElement;
  const cancelBtn = modal.querySelector('.refine-cancel-btn') as HTMLButtonElement;
  const submitBtn = modal.querySelector('.refine-submit-btn') as HTMLButtonElement;
  const instructionsTextarea = modal.querySelector('#refine-instructions') as HTMLTextAreaElement;
  const errorElement = modal.querySelector('#refine-error') as HTMLElement;
  const exampleChips = modal.querySelectorAll('.example-chip') as NodeListOf<HTMLButtonElement>;
  
  // Close modal function
  const closeModal = () => {
    modal.remove();
    onClose();
  };
  
  // Set loading state
  const setLoading = (loading: boolean) => {
    submitBtn.disabled = loading;
    cancelBtn.disabled = loading;
    instructionsTextarea.disabled = loading;
    
    const btnText = submitBtn.querySelector('.refine-btn-text') as HTMLElement;
    const loadingElement = submitBtn.querySelector('.refine-loading') as HTMLElement;
    
    if (loading) {
      btnText.style.display = 'none';
      loadingElement.style.display = 'inline-flex';
    } else {
      btnText.style.display = 'inline';
      loadingElement.style.display = 'none';
    }
  };
  
  // Show error
  const showError = (message: string) => {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  };
  
  // Clear error
  const clearError = () => {
    errorElement.textContent = '';
    errorElement.style.display = 'none';
  };
  
  // Event listeners
  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  
  // Example chip click
  exampleChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const currentText = instructionsTextarea.value.trim();
      const chipText = chip.textContent || '';
      
      if (currentText) {
        instructionsTextarea.value = currentText + ', ' + chipText.toLowerCase();
      } else {
        instructionsTextarea.value = chipText;
      }
      
      instructionsTextarea.focus();
    });
  });
  
  // Submit button
  submitBtn.addEventListener('click', async () => {
    const instructions = instructionsTextarea.value.trim();
    
    if (!instructions) {
      showError('Please provide instructions for refining the itinerary.');
      return;
    }
    
    clearError();
    setLoading(true);
    const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}
    try {
      // Call the AI itinerary builder edge function with refinement instructions
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-itinerary-builder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          ...corsHeaders
        },
        body: JSON.stringify({
          destination: itinerary.destination,
          startDate: itinerary.start_date || undefined,
          endDate: itinerary.end_date || undefined,
          budget: itinerary.budget || undefined,
          preferences: itinerary.preferences || [],
          notes: itinerary.notes || undefined,
          userId: itinerary.user_id,
          existingItinerary: {
            id: itinerary.id,
            items: itineraryItems
          },
          refinementInstructions: instructions
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to refine itinerary');
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Success
      onSuccess();
      closeModal();
      
    } catch (error) {
      console.error('Error refining itinerary:', error);
      showError(`Failed to refine itinerary: ${error.message || 'Unknown error'}`);
      setLoading(false);
    }
  });
  
  // Close on escape key
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && !submitBtn.disabled) {
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