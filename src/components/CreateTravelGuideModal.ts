import { Post, Itinerary, TravelGuide } from '../types';
import { authManager } from '../auth';
import { supabase } from '../lib/supabase';

export function createTravelGuideModal(
  onClose: () => void,
  onSuccess?: (guideId: string) => void,
  userPosts?: Post[],
  userItineraries?: Itinerary[]
): HTMLElement {
  const modal = document.createElement('div');
  modal.className = 'travel-guide-modal';
  
  // State variables
  let selectedPosts: string[] = [];
  let selectedItineraries: string[] = [];
  let isLoading = false;
  let posts: Post[] = userPosts || [];
  let itineraries: Itinerary[] = userItineraries || [];
  
  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    .travel-guide-modal {
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

    .guide-modal-content {
      background: white;
      border-radius: 1rem;
      width: 100%;
      max-width: 800px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    }

    .guide-modal-header {
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

    .guide-modal-header h2 {
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

    .guide-modal-body {
      padding: 1.5rem;
    }

    .guide-intro {
      margin-bottom: 1.5rem;
    }

    .guide-intro p {
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

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
    }

    .checkbox-custom {
      width: 20px;
      height: 20px;
      border: 2px solid #d1d5db;
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

    .content-section {
      margin-bottom: 1.5rem;
    }

    .content-section h3 {
      font-size: 1.125rem;
      font-weight: 600;
      color: #334155;
      margin: 0 0 1rem 0;
    }

    .content-tabs {
      display: flex;
      border-bottom: 1px solid #e2e8f0;
      margin-bottom: 1rem;
    }

    .content-tab {
      padding: 0.75rem 1rem;
      cursor: pointer;
      color: #64748b;
      font-weight: 500;
      transition: all 0.2s;
      border-bottom: 2px solid transparent;
    }

    .content-tab.active {
      color: #667eea;
      border-bottom-color: #667eea;
    }

    .content-tab:hover:not(.active) {
      color: #334155;
      background: #f8fafc;
    }

    .tab-content {
      display: none;
    }

    .tab-content.active {
      display: block;
    }

    .content-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1rem;
      max-height: 300px;
      overflow-y: auto;
      padding: 0.5rem;
    }

    .content-item {
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      overflow: hidden;
      transition: all 0.2s;
      cursor: pointer;
      position: relative;
    }

    .content-item:hover {
      border-color: #cbd5e1;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .content-item.selected {
      border-color: #667eea;
      box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
    }

    .content-item-image {
      height: 100px;
      background-color: #f1f5f9;
      background-size: cover;
      background-position: center;
    }

    .content-item-info {
      padding: 0.75rem;
    }

    .content-item-title {
      font-weight: 600;
      color: #1e293b;
      font-size: 0.875rem;
      margin: 0 0 0.25rem 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .content-item-location {
      color: #667eea;
      font-size: 0.75rem;
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .content-item-date {
      color: #94a3b8;
      font-size: 0.75rem;
      margin: 0.25rem 0 0 0;
    }

    .content-item-checkbox {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: white;
      border: 2px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: transparent;
      font-size: 0.75rem;
      font-weight: bold;
      transition: all 0.2s;
    }

    .content-item.selected .content-item-checkbox {
      background: #667eea;
      border-color: #667eea;
      color: white;
    }

    .content-empty {
      text-align: center;
      padding: 2rem;
      color: #64748b;
      background: #f8fafc;
      border-radius: 0.5rem;
    }

    .content-loading {
      text-align: center;
      padding: 2rem;
      color: #64748b;
    }

    .selected-items {
      margin-top: 1.5rem;
    }

    .selected-items h3 {
      font-size: 1.125rem;
      font-weight: 600;
      color: #334155;
      margin: 0 0 1rem 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .clear-selection {
      background: none;
      border: none;
      color: #ef4444;
      font-size: 0.875rem;
      cursor: pointer;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      transition: all 0.2s;
    }

    .clear-selection:hover {
      background: #fee2e2;
    }

    .selected-list {
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      overflow: hidden;
    }

    .selected-item {
      display: flex;
      align-items: center;
      padding: 0.75rem;
      border-bottom: 1px solid #e2e8f0;
      background: #f8fafc;
    }

    .selected-item:last-child {
      border-bottom: none;
    }

    .selected-item-type {
      background: #e0f2fe;
      color: #0369a1;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      font-weight: 500;
      margin-right: 0.75rem;
      flex-shrink: 0;
    }

    .selected-item-type.post {
      background: #e0f2fe;
      color: #0369a1;
    }

    .selected-item-type.itinerary {
      background: #dcfce7;
      color: #166534;
    }

    .selected-item-info {
      flex: 1;
      min-width: 0;
    }

    .selected-item-title {
      font-weight: 600;
      color: #1e293b;
      font-size: 0.875rem;
      margin: 0 0 0.25rem 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .selected-item-subtitle {
      color: #64748b;
      font-size: 0.75rem;
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .selected-item-actions {
      display: flex;
      gap: 0.5rem;
      margin-left: 0.75rem;
    }

    .move-up-btn, .move-down-btn, .remove-item-btn {
      background: none;
      border: none;
      width: 24px;
      height: 24px;
      border-radius: 0.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 1rem;
    }

    .move-up-btn:hover, .move-down-btn:hover {
      background: #e2e8f0;
    }

    .remove-item-btn {
      color: #ef4444;
    }

    .remove-item-btn:hover {
      background: #fee2e2;
    }

    .selected-empty {
      padding: 1.5rem;
      text-align: center;
      color: #64748b;
      background: #f8fafc;
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
      .guide-modal-content {
        max-width: 100%;
        margin: 0 1rem;
      }

      .guide-modal-header {
        padding: 1rem;
      }

      .guide-modal-body {
        padding: 1rem;
      }

      .content-grid {
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      }

      .form-actions {
        flex-direction: column;
      }

      .cancel-btn, .create-btn {
        width: 100%;
      }
    }
  `;
  
  if (!document.head.querySelector('#travel-guide-modal-styles')) {
    style.id = 'travel-guide-modal-styles';
    document.head.appendChild(style);
  }
  
  // Render modal content
  modal.innerHTML = `
    <div class="modal-backdrop"></div>
    <div class="guide-modal-content">
      <div class="guide-modal-header">
        <h2>Create Travel Guide</h2>
        <button class="modal-close">✕</button>
      </div>
      
      <div class="guide-modal-body">
        <div class="guide-intro">
          <p>Create a comprehensive travel guide by compiling your posts and itineraries. Share your expertise and experiences with the travel community!</p>
        </div>
        
        <form id="guide-form">
          <div class="form-group">
            <label for="guide-title">Guide Title *</label>
            <input type="text" id="guide-title" class="form-input" placeholder="e.g., Ultimate Tokyo Travel Guide" required>
            <small class="form-help">Choose a descriptive title for your guide</small>
          </div>
          
          <div class="form-group">
            <label for="guide-destination">Destination *</label>
            <input type="text" id="guide-destination" class="form-input" placeholder="e.g., Tokyo, Japan" required>
            <small class="form-help">The main location this guide covers</small>
          </div>
          
          <div class="form-group">
            <label for="guide-description">Description</label>
            <textarea id="guide-description" class="form-input" placeholder="Describe what travelers will find in this guide..." rows="3"></textarea>
            <small class="form-help">Provide an overview of what your guide offers</small>
          </div>
          
          <div class="form-group">
            <label for="guide-cover-image">Cover Image URL (Optional)</label>
            <input type="url" id="guide-cover-image" class="form-input" placeholder="https://example.com/image.jpg">
            <small class="form-help">URL to an image that represents your guide</small>
          </div>
          
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" id="guide-public">
              <span class="checkbox-custom"></span>
              Make this guide public
            </label>
            <small class="form-help">Public guides are visible to everyone</small>
          </div>
          
          <div class="content-section">
            <h3>Add Content to Your Guide</h3>
            
            <div class="content-tabs">
              <div class="content-tab active" data-tab="posts">Your Posts</div>
              <div class="content-tab" data-tab="itineraries">Your Itineraries</div>
            </div>
            
            <div class="tab-content active" data-content="posts">
              ${isLoading ? `
                <div class="content-loading">
                  <div class="loading-spinner"></div>
                  <p>Loading your posts...</p>
                </div>
              ` : posts.length === 0 ? `
                <div class="content-empty">
                  <p>You don't have any posts yet. Create some posts to add to your guide!</p>
                </div>
              ` : `
                <div class="content-grid">
                  ${posts.map(post => `
                    <div class="content-item" data-id="${post.id}" data-type="post">
                      <div class="content-item-image" style="background-image: url('${post.image_url || (post.media_urls && post.media_urls.length > 0 ? post.media_urls[0] : 'https://images.pexels.com/photos/1051073/pexels-photo-1051073.jpeg?auto=compress&cs=tinysrgb&w=800')}')"></div>
                      <div class="content-item-info">
                        <h4 class="content-item-title">${post.content.length > 30 ? post.content.substring(0, 30) + '...' : post.content}</h4>
                        <p class="content-item-location">📍 ${post.location}</p>
                        <p class="content-item-date">${new Date(post.created_at).toLocaleDateString()}</p>
                      </div>
                      <div class="content-item-checkbox">✓</div>
                    </div>
                  `).join('')}
                </div>
              `}
            </div>
            
            <div class="tab-content" data-content="itineraries">
              ${isLoading ? `
                <div class="content-loading">
                  <div class="loading-spinner"></div>
                  <p>Loading your itineraries...</p>
                </div>
              ` : itineraries.length === 0 ? `
                <div class="content-empty">
                  <p>You don't have any itineraries yet. Create some itineraries to add to your guide!</p>
                </div>
              ` : `
                <div class="content-grid">
                  ${itineraries.map(itinerary => `
                    <div class="content-item" data-id="${itinerary.id}" data-type="itinerary">
                      <div class="content-item-image" style="background-image: url('${getDestinationImage(itinerary.destination)}')"></div>
                      <div class="content-item-info">
                        <h4 class="content-item-title">${itinerary.title}</h4>
                        <p class="content-item-location">📍 ${itinerary.destination}</p>
                        <p class="content-item-date">${new Date(itinerary.created_at).toLocaleDateString()}</p>
                      </div>
                      <div class="content-item-checkbox">✓</div>
                    </div>
                  `).join('')}
                </div>
              `}
            </div>
          </div>
          
          <div class="selected-items">
            <h3>
              Selected Items
              <button type="button" class="clear-selection" style="display: none;">Clear All</button>
            </h3>
            
            <div class="selected-list">
              <div class="selected-empty">
                <p>No items selected yet. Click on posts and itineraries above to add them to your guide.</p>
              </div>
            </div>
          </div>
          
          <div class="form-error" id="guide-form-error"></div>
          
          <div class="form-actions">
            <button type="button" class="cancel-btn">Cancel</button>
            <button type="submit" class="create-btn">
              <span class="btn-text">Create Guide</span>
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
  const form = modal.querySelector('#guide-form') as HTMLFormElement;
  const contentTabs = modal.querySelectorAll('.content-tab') as NodeListOf<HTMLElement>;
  const tabContents = modal.querySelectorAll('.tab-content') as NodeListOf<HTMLElement>;
  const contentItems = modal.querySelectorAll('.content-item') as NodeListOf<HTMLElement>;
  const selectedList = modal.querySelector('.selected-list') as HTMLElement;
  const clearSelectionBtn = modal.querySelector('.clear-selection') as HTMLButtonElement;
  const cancelBtn = modal.querySelector('.cancel-btn') as HTMLButtonElement;
  const createBtn = modal.querySelector('.create-btn') as HTMLButtonElement;
  const errorElement = modal.querySelector('#guide-form-error') as HTMLElement;
  
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
    createBtn.disabled = loading;
    cancelBtn.disabled = loading;
    
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
  
  // Update selected items list
  function updateSelectedItems() {
    const hasSelectedItems = selectedPosts.length > 0 || selectedItineraries.length > 0;
    
    // Show/hide clear selection button
    clearSelectionBtn.style.display = hasSelectedItems ? 'block' : 'none';
    
    if (!hasSelectedItems) {
      selectedList.innerHTML = `
        <div class="selected-empty">
          <p>No items selected yet. Click on posts and itineraries above to add them to your guide.</p>
        </div>
      `;
      return;
    }
    
    // Create combined array of selected items with their types
    const selectedItems: Array<{id: string, type: 'post' | 'itinerary'}> = [
      ...selectedPosts.map(id => ({id, type: 'post' as const})),
      ...selectedItineraries.map(id => ({id, type: 'itinerary' as const}))
    ];
    
    // Render selected items
    selectedList.innerHTML = selectedItems.map((item, index) => {
      const isPost = item.type === 'post';
      const itemData = isPost 
        ? posts.find(p => p.id === item.id)
        : itineraries.find(i => i.id === item.id);
      
      if (!itemData) return '';
      
      const title = isPost 
        ? (itemData as Post).content.length > 50 
          ? (itemData as Post).content.substring(0, 50) + '...' 
          : (itemData as Post).content
        : (itemData as Itinerary).title;
      
      const subtitle = isPost 
        ? `📍 ${(itemData as Post).location}`
        : `📍 ${(itemData as Itinerary).destination}`;
      
      return `
        <div class="selected-item" data-id="${item.id}" data-type="${item.type}" data-index="${index}">
          <span class="selected-item-type ${item.type}">${isPost ? 'Post' : 'Itinerary'}</span>
          <div class="selected-item-info">
            <h4 class="selected-item-title">${title}</h4>
            <p class="selected-item-subtitle">${subtitle}</p>
          </div>
          <div class="selected-item-actions">
            ${index > 0 ? `<button class="move-up-btn" title="Move Up">↑</button>` : ''}
            ${index < selectedItems.length - 1 ? `<button class="move-down-btn" title="Move Down">↓</button>` : ''}
            <button class="remove-item-btn" title="Remove">✕</button>
          </div>
        </div>
      `;
    }).join('');
    
    // Add event listeners for selected item actions
    const moveUpBtns = selectedList.querySelectorAll('.move-up-btn');
    const moveDownBtns = selectedList.querySelectorAll('.move-down-btn');
    const removeItemBtns = selectedList.querySelectorAll('.remove-item-btn');
    
    moveUpBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const item = (btn as HTMLElement).closest('.selected-item') as HTMLElement;
        const index = parseInt(item.dataset.index || '0');
        
        if (index > 0) {
          // Swap with previous item
          const itemType = item.dataset.type as 'post' | 'itinerary';
          const itemId = item.dataset.id as string;
          
          if (itemType === 'post') {
            // Move in selectedPosts array
            const temp = selectedPosts[index];
            selectedPosts[index] = selectedPosts[index - 1];
            selectedPosts[index - 1] = temp;
          } else {
            // Find the actual index in the selectedItineraries array
            const itineraryIndex = selectedItineraries.indexOf(itemId);
            if (itineraryIndex > 0) {
              const temp = selectedItineraries[itineraryIndex];
              selectedItineraries[itineraryIndex] = selectedItineraries[itineraryIndex - 1];
              selectedItineraries[itineraryIndex - 1] = temp;
            }
          }
          
          // Update UI
          updateSelectedItems();
        }
      });
    });
    
    moveDownBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const item = (btn as HTMLElement).closest('.selected-item') as HTMLElement;
        const index = parseInt(item.dataset.index || '0');
        const totalItems = selectedPosts.length + selectedItineraries.length;
        
        if (index < totalItems - 1) {
          // Swap with next item
          const itemType = item.dataset.type as 'post' | 'itinerary';
          const itemId = item.dataset.id as string;
          
          if (itemType === 'post') {
            // Move in selectedPosts array
            const postIndex = selectedPosts.indexOf(itemId);
            if (postIndex < selectedPosts.length - 1) {
              const temp = selectedPosts[postIndex];
              selectedPosts[postIndex] = selectedPosts[postIndex + 1];
              selectedPosts[postIndex + 1] = temp;
            }
          } else {
            // Move in selectedItineraries array
            const itineraryIndex = selectedItineraries.indexOf(itemId);
            if (itineraryIndex < selectedItineraries.length - 1) {
              const temp = selectedItineraries[itineraryIndex];
              selectedItineraries[itineraryIndex] = selectedItineraries[itineraryIndex + 1];
              selectedItineraries[itineraryIndex + 1] = temp;
            }
          }
          
          // Update UI
          updateSelectedItems();
        }
      });
    });
    
    removeItemBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const item = (btn as HTMLElement).closest('.selected-item') as HTMLElement;
        const itemType = item.dataset.type as 'post' | 'itinerary';
        const itemId = item.dataset.id as string;
        
        if (itemType === 'post') {
          // Remove from selectedPosts
          selectedPosts = selectedPosts.filter(id => id !== itemId);
          
          // Update UI for the content item
          const contentItem = modal.querySelector(`.content-item[data-id="${itemId}"][data-type="post"]`);
          if (contentItem) {
            contentItem.classList.remove('selected');
          }
        } else {
          // Remove from selectedItineraries
          selectedItineraries = selectedItineraries.filter(id => id !== itemId);
          
          // Update UI for the content item
          const contentItem = modal.querySelector(`.content-item[data-id="${itemId}"][data-type="itinerary"]`);
          if (contentItem) {
            contentItem.classList.remove('selected');
          }
        }
        
        // Update UI
        updateSelectedItems();
      });
    });
  }
  
  // Load user's posts and itineraries if not provided
  async function loadUserContent() {
    const authState = authManager.getAuthState();
    if (!authState.isAuthenticated || !authState.currentUser) return;
    
    isLoading = true;
    
    try {
      // Only load posts if not provided
      if (!userPosts) {
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', authState.currentUser.id)
          .order('created_at', { ascending: false });
        
        if (postsError) throw postsError;
        
        posts = postsData || [];
      }
      
      // Only load itineraries if not provided
      if (!userItineraries) {
        const { data: itinerariesData, error: itinerariesError } = await supabase
          .from('itineraries')
          .select('*')
          .eq('user_id', authState.currentUser.id)
          .order('created_at', { ascending: false });
        
        if (itinerariesError) throw itinerariesError;
        
        itineraries = itinerariesData || [];
      }
      
      // Update UI
      renderContentTabs();
      
    } catch (error) {
      console.error('Error loading user content:', error);
    } finally {
      isLoading = false;
      renderContentTabs();
    }
  }
  
  // Render content tabs
  function renderContentTabs() {
    const postsTab = modal.querySelector('.tab-content[data-content="posts"]');
    const itinerariesTab = modal.querySelector('.tab-content[data-content="itineraries"]');
    
    if (postsTab) {
      postsTab.innerHTML = isLoading ? `
        <div class="content-loading">
          <div class="loading-spinner"></div>
          <p>Loading your posts...</p>
        </div>
      ` : posts.length === 0 ? `
        <div class="content-empty">
          <p>You don't have any posts yet. Create some posts to add to your guide!</p>
        </div>
      ` : `
        <div class="content-grid">
          ${posts.map(post => `
            <div class="content-item ${selectedPosts.includes(post.id) ? 'selected' : ''}" data-id="${post.id}" data-type="post">
              <div class="content-item-image" style="background-image: url('${post.image_url || (post.media_urls && post.media_urls.length > 0 ? post.media_urls[0] : 'https://images.pexels.com/photos/1051073/pexels-photo-1051073.jpeg?auto=compress&cs=tinysrgb&w=800')}')"></div>
              <div class="content-item-info">
                <h4 class="content-item-title">${post.content.length > 30 ? post.content.substring(0, 30) + '...' : post.content}</h4>
                <p class="content-item-location">📍 ${post.location}</p>
                <p class="content-item-date">${new Date(post.created_at).toLocaleDateString()}</p>
              </div>
              <div class="content-item-checkbox">✓</div>
            </div>
          `).join('')}
        </div>
      `;
    }
    
    if (itinerariesTab) {
      itinerariesTab.innerHTML = isLoading ? `
        <div class="content-loading">
          <div class="loading-spinner"></div>
          <p>Loading your itineraries...</p>
        </div>
      ` : itineraries.length === 0 ? `
        <div class="content-empty">
          <p>You don't have any itineraries yet. Create some itineraries to add to your guide!</p>
        </div>
      ` : `
        <div class="content-grid">
          ${itineraries.map(itinerary => `
            <div class="content-item ${selectedItineraries.includes(itinerary.id) ? 'selected' : ''}" data-id="${itinerary.id}" data-type="itinerary">
              <div class="content-item-image" style="background-image: url('${getDestinationImage(itinerary.destination)}')"></div>
              <div class="content-item-info">
                <h4 class="content-item-title">${itinerary.title}</h4>
                <p class="content-item-location">📍 ${itinerary.destination}</p>
                <p class="content-item-date">${new Date(itinerary.created_at).toLocaleDateString()}</p>
              </div>
              <div class="content-item-checkbox">✓</div>
            </div>
          `).join('')}
        </div>
      `;
    }
    
    // Add event listeners for content items
    const contentItems = modal.querySelectorAll('.content-item');
    contentItems.forEach(item => {
      item.addEventListener('click', () => {
        const itemId = item.getAttribute('data-id') as string;
        const itemType = item.getAttribute('data-type') as 'post' | 'itinerary';
        
        if (itemType === 'post') {
          if (selectedPosts.includes(itemId)) {
            // Deselect
            selectedPosts = selectedPosts.filter(id => id !== itemId);
            item.classList.remove('selected');
          } else {
            // Select
            selectedPosts.push(itemId);
            item.classList.add('selected');
          }
        } else {
          if (selectedItineraries.includes(itemId)) {
            // Deselect
            selectedItineraries = selectedItineraries.filter(id => id !== itemId);
            item.classList.remove('selected');
          } else {
            // Select
            selectedItineraries.push(itemId);
            item.classList.add('selected');
          }
        }
        
        // Update selected items list
        updateSelectedItems();
      });
    });
  }
  
  // Create travel guide
  async function createTravelGuide() {
    const authState = authManager.getAuthState();
    if (!authState.isAuthenticated || !authState.currentUser) {
      showError('You must be logged in to create a travel guide.');
      return;
    }
    
    const titleInput = document.getElementById('guide-title') as HTMLInputElement;
    const destinationInput = document.getElementById('guide-destination') as HTMLInputElement;
    const descriptionInput = document.getElementById('guide-description') as HTMLTextAreaElement;
    const coverImageInput = document.getElementById('guide-cover-image') as HTMLInputElement;
    const isPublicInput = document.getElementById('guide-public') as HTMLInputElement;
    
    const title = titleInput.value.trim();
    const destination = destinationInput.value.trim();
    const description = descriptionInput.value.trim();
    const coverImageUrl = coverImageInput.value.trim();
    const isPublic = isPublicInput.checked;
    
    // Validate required fields
    if (!title) {
      showError('Guide title is required.');
      return;
    }
    
    if (!destination) {
      showError('Destination is required.');
      return;
    }
    
    // Validate that at least one item is selected
    if (selectedPosts.length === 0 && selectedItineraries.length === 0) {
      showError('Please select at least one post or itinerary to include in your guide.');
      return;
    }
    
    // Validate cover image URL if provided
    if (coverImageUrl && !isValidUrl(coverImageUrl)) {
      showError('Please enter a valid URL for the cover image.');
      return;
    }
    
    clearError();
    setLoading(true);
    
    try {
      // Create the travel guide
      const { data: guideData, error: guideError } = await supabase
        .from('travel_guides')
        .insert({
          user_id: authState.currentUser.id,
          title,
          description: description || null,
          destination,
          cover_image_url: coverImageUrl || null,
          is_public: isPublic
        })
        .select()
        .single();
      
      if (guideError) throw guideError;
      
      const guideId = guideData.id;
      
      // Create combined array of selected items with their types
      const selectedItems: Array<{id: string, type: 'post' | 'itinerary', position: number}> = [
        ...selectedPosts.map((id, index) => ({id, type: 'post' as const, position: index})),
        ...selectedItineraries.map((id, index) => ({id, type: 'itinerary' as const, position: selectedPosts.length + index}))
      ];
      
      // Create guide content items
      const contentItems = selectedItems.map((item, index) => ({
        guide_id: guideId,
        content_type: item.type,
        item_id: item.id,
        order_position: index + 1,
        notes: null
      }));
      
      const { error: contentError } = await supabase
        .from('guide_content_items')
        .insert(contentItems);
      
      if (contentError) throw contentError;
      
      // Success
      if (onSuccess) {
        onSuccess(guideId);
      }
      
      closeModal();
      
    } catch (error: any) {
      console.error('Error creating travel guide:', error);
      showError(`Failed to create travel guide: ${error.message}`);
      setLoading(false);
    }
  }
  
  // Validate URL
  function isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
  
  // Get destination image
  function getDestinationImage(destination: string): string {
    // Map common destinations to Pexels images
    const destinationImages: Record<string, string> = {
      'tokyo': 'https://images.pexels.com/photos/2506923/pexels-photo-2506923.jpeg?auto=compress&cs=tinysrgb&w=800',
      'japan': 'https://images.pexels.com/photos/3408354/pexels-photo-3408354.jpeg?auto=compress&cs=tinysrgb&w=800',
      'paris': 'https://images.pexels.com/photos/699466/pexels-photo-699466.jpeg?auto=compress&cs=tinysrgb&w=800',
      'france': 'https://images.pexels.com/photos/532826/pexels-photo-532826.jpeg?auto=compress&cs=tinysrgb&w=800',
      'new york': 'https://images.pexels.com/photos/802024/pexels-photo-802024.jpeg?auto=compress&cs=tinysrgb&w=800',
      'usa': 'https://images.pexels.com/photos/1486222/pexels-photo-1486222.jpeg?auto=compress&cs=tinysrgb&w=800',
      'rome': 'https://images.pexels.com/photos/1797158/pexels-photo-1797158.jpeg?auto=compress&cs=tinysrgb&w=800',
      'italy': 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=800',
      'london': 'https://images.pexels.com/photos/460672/pexels-photo-460672.jpeg?auto=compress&cs=tinysrgb&w=800',
      'uk': 'https://images.pexels.com/photos/672532/pexels-photo-672532.jpeg?auto=compress&cs=tinysrgb&w=800',
      'barcelona': 'https://images.pexels.com/photos/819764/pexels-photo-819764.jpeg?auto=compress&cs=tinysrgb&w=800',
      'spain': 'https://images.pexels.com/photos/1388030/pexels-photo-1388030.jpeg?auto=compress&cs=tinysrgb&w=800',
      'sydney': 'https://images.pexels.com/photos/995764/pexels-photo-995764.jpeg?auto=compress&cs=tinysrgb&w=800',
      'australia': 'https://images.pexels.com/photos/3617500/pexels-photo-3617500.jpeg?auto=compress&cs=tinysrgb&w=800',
      'bali': 'https://images.pexels.com/photos/1822458/pexels-photo-1822458.jpeg?auto=compress&cs=tinysrgb&w=800',
      'indonesia': 'https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg?auto=compress&cs=tinysrgb&w=800',
      'bangkok': 'https://images.pexels.com/photos/1031659/pexels-photo-1031659.jpeg?auto=compress&cs=tinysrgb&w=800',
      'thailand': 'https://images.pexels.com/photos/1659438/pexels-photo-1659438.jpeg?auto=compress&cs=tinysrgb&w=800',
      'dubai': 'https://images.pexels.com/photos/823696/pexels-photo-823696.jpeg?auto=compress&cs=tinysrgb&w=800',
      'uae': 'https://images.pexels.com/photos/2044434/pexels-photo-2044434.jpeg?auto=compress&cs=tinysrgb&w=800'
    };
    
    // Check if we have a specific image for this destination
    const destinationLower = destination.toLowerCase();
    for (const [key, url] of Object.entries(destinationImages)) {
      if (destinationLower.includes(key)) {
        return url;
      }
    }
    
    // Default travel image if no match
    return 'https://images.pexels.com/photos/1051073/pexels-photo-1051073.jpeg?auto=compress&cs=tinysrgb&w=800';
  }
  
  // Event listeners
  modalBackdrop.addEventListener('click', closeModal);
  modalClose.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  
  // Tab switching
  contentTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.getAttribute('data-tab');
      
      // Update active tab
      contentTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Update active content
      tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.getAttribute('data-content') === tabName) {
          content.classList.add('active');
        }
      });
    });
  });
  
  // Clear selection button
  clearSelectionBtn.addEventListener('click', () => {
    selectedPosts = [];
    selectedItineraries = [];
    
    // Update UI
    contentItems.forEach(item => {
      item.classList.remove('selected');
    });
    
    updateSelectedItems();
  });
  
  // Form submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    createTravelGuide();
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
  loadUserContent();
  updateSelectedItems();
  
  return modal;
}