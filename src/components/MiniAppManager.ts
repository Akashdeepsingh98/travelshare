import { MiniApp } from '../types';
import { authManager } from '../auth';
import { supabase } from '../lib/supabase';

export function createMiniAppManager(onClose: () => void): HTMLElement {
  const container = document.createElement('div');
  container.className = 'mini-app-manager-modal';
  
  // Add component styles
  const style = document.createElement('style');
  style.textContent = `
    .mini-app-manager-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      padding: 1rem;
    }

    .modal-backdrop {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: -1;
    }

    .mini-app-manager-content {
      background: white;
      border-radius: 1rem;
      width: 100%;
      max-width: 800px;
      max-height: 90vh;
      overflow-y: auto;
      position: relative;
      z-index: 1;
    }

    .mini-app-manager-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.5rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .mini-app-manager-header h2 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: #374151;
    }

    .modal-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #6b7280;
      padding: 0.5rem;
      border-radius: 0.5rem;
      transition: all 0.2s;
    }

    .modal-close:hover {
      background: #f3f4f6;
      color: #374151;
    }

    .mini-app-manager-body {
      padding: 1.5rem;
    }

    .mini-app-intro {
      margin-bottom: 2rem;
      text-align: center;
    }

    .mini-app-intro p {
      color: #6b7280;
      margin-bottom: 1rem;
      line-height: 1.6;
    }

    .mini-app-benefits {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
    }

    .benefit-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem;
      background: #f9fafb;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      color: #374151;
    }

    .benefit-icon {
      font-size: 1.25rem;
    }

    .mini-apps-section {
      margin-top: 2rem;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .section-header h3 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #374151;
    }

    .add-app-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
    }

    .add-app-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    .mini-apps-list {
      min-height: 200px;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      color: #6b7280;
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
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

    .empty-apps {
      text-align: center;
      padding: 3rem 1rem;
      background: #f9fafb;
      border-radius: 0.75rem;
      border: 2px dashed #d1d5db;
    }

    .empty-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .empty-apps h4 {
      color: #374151;
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0 0 0.5rem 0;
    }

    .empty-apps p {
      color: #6b7280;
      margin: 0 0 1.5rem 0;
      line-height: 1.5;
    }

    .add-first-app-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
    }

    .add-first-app-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    .app-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 0.75rem;
      padding: 1.5rem;
      margin-bottom: 1rem;
      transition: all 0.2s;
    }

    .app-card:hover {
      border-color: #667eea;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .app-card.active {
      border-color: #10b981;
      background: #f0fdf4;
    }

    .app-card.inactive {
      border-color: #f59e0b;
      background: #fffbeb;
    }

    .app-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }

    .app-info {
      display: flex;
      gap: 1rem;
      flex: 1;
    }

    .app-icon {
      width: 48px;
      height: 48px;
      position: relative;
    }

    .app-icon img {
      width: 100%;
      height: 100%;
      border-radius: 0.5rem;
      object-fit: cover;
    }

    .app-icon-fallback {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 0.5rem;
      font-size: 1.5rem;
      color: white;
    }

    .app-details {
      flex: 1;
    }

    .app-name {
      font-size: 1.125rem;
      font-weight: 600;
      color: #374151;
      margin: 0 0 0.25rem 0;
    }

    .app-description {
      color: #6b7280;
      font-size: 0.875rem;
      margin: 0;
      line-height: 1.4;
    }

    .app-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .status-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .status-indicator.active {
      background: #10b981;
    }

    .status-indicator.inactive {
      background: #f59e0b;
    }

    .status-text {
      font-size: 0.875rem;
      font-weight: 500;
    }

    .status-text {
      color: #374151;
    }

    .app-card-body {
      margin-bottom: 1rem;
    }

    .app-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .meta-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .meta-label {
      font-size: 0.75rem;
      color: #6b7280;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .meta-value {
      font-size: 0.875rem;
      color: #374151;
      word-break: break-all;
    }

    .app-card-actions {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .preview-app-btn, .edit-app-btn, .toggle-app-btn, .delete-app-btn {
      padding: 0.5rem 0.75rem;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      border: 1px solid;
    }

    .preview-app-btn {
      background: #667eea;
      color: white;
      border-color: #667eea;
    }

    .preview-app-btn:hover {
      background: #5a67d8;
      border-color: #5a67d8;
    }

    .edit-app-btn {
      background: white;
      color: #374151;
      border-color: #d1d5db;
    }

    .edit-app-btn:hover {
      background: #f9fafb;
      border-color: #9ca3af;
    }

    .toggle-app-btn {
      background: #10b981;
      color: white;
      border-color: #10b981;
    }

    .toggle-app-btn:hover {
      background: #059669;
      border-color: #059669;
    }

    .delete-app-btn {
      background: #ef4444;
      color: white;
      border-color: #ef4444;
    }

    .delete-app-btn:hover {
      background: #dc2626;
      border-color: #dc2626;
    }

    /* App Form Modal */
    .app-form-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      padding: 1rem;
    }

    .app-form-backdrop {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
    }

    .app-form-content {
      background: white;
      border-radius: 1rem;
      width: 100%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
      position: relative;
      z-index: 1;
    }

    .app-form-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.5rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .app-form-header h3 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #374151;
    }

    .app-form-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #6b7280;
      padding: 0.5rem;
      border-radius: 0.5rem;
      transition: all 0.2s;
    }

    .app-form-close:hover {
      background: #f3f4f6;
      color: #374151;
    }

    .app-form {
      padding: 1.5rem;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-group label {
      display: block;
      font-weight: 600;
      color: #374151;
      margin-bottom: 0.5rem;
    }

    .form-input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #d1d5db;
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
      color: #6b7280;
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

    .form-error {
      color: #dc2626;
      font-size: 0.875rem;
      margin-bottom: 1rem;
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
    }

    .cancel-btn {
      background: #6b7280;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
    }

    .cancel-btn:hover {
      background: #4b5563;
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
    }

    .save-btn:hover {
      background: #5a67d8;
    }

    .save-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-loading {
      display: none;
    }
  `;
  
  if (!document.head.querySelector('#mini-app-manager-styles')) {
    style.id = 'mini-app-manager-styles';
    document.head.appendChild(style);
  }
  
  let miniApps: MiniApp[] = [];
  let isLoading = false;
  
  async function loadMiniApps() {
    const authState = authManager.getAuthState();
    if (!authState.isAuthenticated || !authState.currentUser) return;
    
    isLoading = true;
    renderMiniAppManager();
    
    try {
      const { data, error } = await supabase
        .from('mini_apps')
        .select('*')
        .eq('user_id', authState.currentUser.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      miniApps = data || [];
      renderMiniAppManager();
    } catch (error) {
      console.error('Error loading mini apps:', error);
    } finally {
      isLoading = false;
    }
  }
  
  function renderMiniAppManager() {
    container.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="mini-app-manager-content">
        <div class="mini-app-manager-header">
          <h2>📱 Mini App Management</h2>
          <button class="modal-close">✕</button>
        </div>
        
        <div class="mini-app-manager-body">
          <div class="mini-app-intro">
            <p>Share your business apps directly on your profile. Users can access your services like Uber, restaurant ordering, hotel booking, and more!</p>
            <div class="mini-app-benefits">
              <div class="benefit-item">
                <span class="benefit-icon">🚗</span>
                <span>Transportation Services</span>
              </div>
              <div class="benefit-item">
                <span class="benefit-icon">🍽️</span>
                <span>Food Delivery & Ordering</span>
              </div>
              <div class="benefit-item">
                <span class="benefit-icon">🏨</span>
                <span>Hotel & Accommodation</span>
              </div>
              <div class="benefit-item">
                <span class="benefit-icon">🛍️</span>
                <span>Shopping & E-commerce</span>
              </div>
            </div>
          </div>
          
          <div class="mini-apps-section">
            <div class="section-header">
              <h3>Your Mini Apps</h3>
              <button class="add-app-btn">+ Add App</button>
            </div>
            
            <div class="mini-apps-list">
              ${isLoading ? `
                <div class="loading-state">
                  <div class="loading-spinner"></div>
                  <p>Loading mini apps...</p>
                </div>
              ` : miniApps.length === 0 ? `
                <div class="empty-apps">
                  <div class="empty-icon">📱</div>
                  <h4>No Mini Apps Added</h4>
                  <p>Add your first mini app to start sharing your services with travelers.</p>
                  <button class="add-first-app-btn">Add Your First App</button>
                </div>
              ` : miniApps.map(app => createAppCard(app)).join('')}
            </div>
          </div>
        </div>
        
        <!-- Add/Edit App Form -->
        <div class="app-form-modal">
          <div class="app-form-backdrop"></div>
          <div class="app-form-content">
            <div class="app-form-header">
              <h3 id="app-form-title">Add Mini App</h3>
              <button class="app-form-close">✕</button>
            </div>
            
            <form class="app-form" id="app-form">
              <div class="form-group">
                <label for="app-name">App Name</label>
                <input type="text" id="app-name" class="form-input" placeholder="My Taxi Service" required>
              </div>
              
              <div class="form-group">
                <label for="app-description">Description</label>
                <textarea id="app-description" class="form-input" placeholder="Fast and reliable taxi service in the city" rows="3"></textarea>
              </div>
              
              <div class="form-group">
                <label for="app-category">Category</label>
                <select id="app-category" class="form-input" required>
                  <option value="">Select category...</option>
                  <option value="transportation">🚗 Transportation</option>
                  <option value="food">🍽️ Food & Dining</option>
                  <option value="shopping">🛍️ Shopping</option>
                  <option value="entertainment">🎬 Entertainment</option>
                  <option value="travel">✈️ Travel & Tourism</option>
                  <option value="business">💼 Business Services</option>
                  <option value="other">📋 Other</option>
                </select>
              </div>
              
              <div class="form-group">
                <label for="app-url">App URL</label>
                <input type="url" id="app-url" class="form-input" placeholder="https://your-app.com" required>
                <small class="form-help">The URL where users can access your app or service</small>
              </div>
              
              <div class="form-group">
                <label for="app-icon">Icon URL (Optional)</label>
                <input type="url" id="app-icon" class="form-input" placeholder="https://your-app.com/icon.png">
                <small class="form-help">URL to your app's icon or logo</small>
              </div>
              
              <div class="form-group">
                <label class="checkbox-label">
                  <input type="checkbox" id="app-active" checked>
                  <span class="checkbox-custom"></span>
                  Active (show this app on your profile)
                </label>
              </div>
              
              <div class="form-error" id="app-form-error"></div>
              
              <div class="form-actions">
                <button type="button" class="cancel-btn">Cancel</button>
                <button type="submit" class="save-btn">
                  <span class="btn-text">Save App</span>
                  <span class="btn-loading" style="display: none;">Saving...</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
    
    setupEventListeners();
  }
  
  function createAppCard(app: MiniApp): string {
    const categoryIcons = {
      transportation: '🚗',
      food: '🍽️',
      shopping: '🛍️',
      entertainment: '🎬',
      travel: '✈️',
      business: '💼',
      other: '📋'
    };
    
    const defaultIcon = categoryIcons[app.category] || '📱';
    
    return `
      <div class="app-card ${app.is_active ? 'active' : 'inactive'}" data-app-id="${app.id}">
        <div class="app-card-header">
          <div class="app-info">
            <div class="app-icon">
              ${app.icon_url ? `<img src="${app.icon_url}" alt="${app.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">` : ''}
              <span class="app-icon-fallback" ${app.icon_url ? 'style="display: none;"' : ''}>${defaultIcon}</span>
            </div>
            <div class="app-details">
              <h4 class="app-name">${app.name}</h4>
              <p class="app-description">${app.description || 'No description'}</p>
            </div>
          </div>
          <div class="app-status">
            <span class="status-indicator ${app.is_active ? 'active' : 'inactive'}"></span>
            <span class="status-text">${app.is_active ? 'Active' : 'Inactive'}</span>
          </div>
        </div>
        
        <div class="app-card-body">
          <div class="app-meta">
            <span class="meta-item">
              <span class="meta-label">Category</span>
              <span class="meta-value">${app.category}</span>
            </span>
            <span class="meta-item">
              <span class="meta-label">URL</span>
              <span class="meta-value">${app.app_url}</span>
            </span>
            <span class="meta-item">
              <span class="meta-label">Added</span>
              <span class="meta-value">${new Date(app.created_at).toLocaleDateString()}</span>
            </span>
          </div>
        </div>
        
        <div class="app-card-actions">
          <button class="preview-app-btn" data-app-id="${app.id}">Preview</button>
          <button class="edit-app-btn" data-app-id="${app.id}">Edit</button>
          <button class="toggle-app-btn" data-app-id="${app.id}">
            ${app.is_active ? 'Disable' : 'Enable'}
          </button>
          <button class="delete-app-btn" data-app-id="${app.id}">Delete</button>
        </div>
      </div>
    `;
  }
  
  function setupEventListeners() {
    // Close modal
    const modalClose = container.querySelector('.modal-close') as HTMLButtonElement;
    const modalBackdrop = container.querySelector('.modal-backdrop') as HTMLElement;
    
    modalClose.addEventListener('click', onClose);
    modalBackdrop.addEventListener('click', onClose);
    
    // Add app buttons
    const addAppBtn = container.querySelector('.add-app-btn') as HTMLButtonElement;
    const addFirstAppBtn = container.querySelector('.add-first-app-btn') as HTMLButtonElement;
    
    addAppBtn?.addEventListener('click', () => showAppForm());
    addFirstAppBtn?.addEventListener('click', () => showAppForm());
    
    // App form
    const appForm = container.querySelector('#app-form') as HTMLFormElement;
    const appFormClose = container.querySelector('.app-form-close') as HTMLButtonElement;
    const appFormBackdrop = container.querySelector('.app-form-backdrop') as HTMLElement;
    const cancelBtn = container.querySelector('.cancel-btn') as HTMLButtonElement;
    
    appFormClose?.addEventListener('click', hideAppForm);
    appFormBackdrop?.addEventListener('click', hideAppForm);
    cancelBtn?.addEventListener('click', hideAppForm);
    
    appForm?.addEventListener('submit', handleAppFormSubmit);
    
    // App card actions
    const appCards = container.querySelectorAll('.app-card');
    appCards.forEach(card => {
      const appId = card.getAttribute('data-app-id')!;
      
      const previewBtn = card.querySelector('.preview-app-btn') as HTMLButtonElement;
      const editBtn = card.querySelector('.edit-app-btn') as HTMLButtonElement;
      const toggleBtn = card.querySelector('.toggle-app-btn') as HTMLButtonElement;
      const deleteBtn = card.querySelector('.delete-app-btn') as HTMLButtonElement;
      
      previewBtn?.addEventListener('click', () => previewApp(appId));
      editBtn?.addEventListener('click', () => editApp(appId));
      toggleBtn?.addEventListener('click', () => toggleApp(appId));
      deleteBtn?.addEventListener('click', () => deleteApp(appId));
    });
  }
  
  function showAppForm(app?: MiniApp) {
    const formModal = container.querySelector('.app-form-modal') as HTMLElement;
    const formTitle = container.querySelector('#app-form-title') as HTMLElement;
    const form = container.querySelector('#app-form') as HTMLFormElement;
    
    formTitle.textContent = app ? 'Edit Mini App' : 'Add Mini App';
    
    if (app) {
      (container.querySelector('#app-name') as HTMLInputElement).value = app.name;
      (container.querySelector('#app-description') as HTMLTextAreaElement).value = app.description || '';
      (container.querySelector('#app-category') as HTMLSelectElement).value = app.category;
      (container.querySelector('#app-url') as HTMLInputElement).value = app.app_url;
      (container.querySelector('#app-icon') as HTMLInputElement).value = app.icon_url || '';
      (container.querySelector('#app-active') as HTMLInputElement).checked = app.is_active;
      
      form.dataset.appId = app.id;
    } else {
      form.reset();
      delete form.dataset.appId;
    }
    
    formModal.style.display = 'flex';
  }
  
  function hideAppForm() {
    const formModal = container.querySelector('.app-form-modal') as HTMLElement;
    formModal.style.display = 'none';
    
    // Clear form
    const form = container.querySelector('#app-form') as HTMLFormElement;
    form.reset();
    delete form.dataset.appId;
    
    // Clear errors
    const errorElement = container.querySelector('#app-form-error') as HTMLElement;
    errorElement.textContent = '';
  }
  
  async function handleAppFormSubmit(e: Event) {
    e.preventDefault();
    
    const authState = authManager.getAuthState();
    if (!authState.isAuthenticated || !authState.currentUser) return;
    
    const form = e.target as HTMLFormElement;
    const isEdit = !!form.dataset.appId;
    
    const appData = {
      name: (container.querySelector('#app-name') as HTMLInputElement).value,
      description: (container.querySelector('#app-description') as HTMLTextAreaElement).value,
      category: (container.querySelector('#app-category') as HTMLSelectElement).value,
      app_url: (container.querySelector('#app-url') as HTMLInputElement).value,
      icon_url: (container.querySelector('#app-icon') as HTMLInputElement).value || null,
      is_active: (container.querySelector('#app-active') as HTMLInputElement).checked,
      user_id: authState.currentUser.id
    };
    
    setFormLoading(true);
    
    try {
      let result;
      
      if (isEdit) {
        result = await supabase
          .from('mini_apps')
          .update(appData)
          .eq('id', form.dataset.appId!)
          .eq('user_id', authState.currentUser.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from('mini_apps')
          .insert(appData)
          .select()
          .single();
      }
      
      if (result.error) throw result.error;
      
      hideAppForm();
      await loadMiniApps();
      
    } catch (error: any) {
      console.error('Error saving mini app:', error);
      showFormError(error.message || 'Failed to save app');
    } finally {
      setFormLoading(false);
    }
  }
  
  function setFormLoading(loading: boolean) {
    const saveBtn = container.querySelector('.save-btn') as HTMLButtonElement;
    const btnText = saveBtn.querySelector('.btn-text') as HTMLElement;
    const btnLoading = saveBtn.querySelector('.btn-loading') as HTMLElement;
    
    saveBtn.disabled = loading;
    btnText.style.display = loading ? 'none' : 'inline';
    btnLoading.style.display = loading ? 'inline' : 'none';
  }
  
  function showFormError(message: string) {
    const errorElement = container.querySelector('#app-form-error') as HTMLElement;
    errorElement.textContent = message;
  }
  
  function previewApp(appId: string) {
    const app = miniApps.find(a => a.id === appId);
    if (app) {
      window.open(app.app_url, '_blank', 'noopener,noreferrer');
    }
  }
  
  function editApp(appId: string) {
    const app = miniApps.find(a => a.id === appId);
    if (app) {
      showAppForm(app);
    }
  }
  
  async function toggleApp(appId: string) {
    const authState = authManager.getAuthState();
    if (!authState.isAuthenticated || !authState.currentUser) return;
    
    const app = miniApps.find(a => a.id === appId);
    if (!app) return;
    
    try {
      const { error } = await supabase
        .from('mini_apps')
        .update({ is_active: !app.is_active })
        .eq('id', appId)
        .eq('user_id', authState.currentUser.id);
      
      if (error) throw error;
      
      await loadMiniApps();
      
    } catch (error: any) {
      console.error('Error toggling mini app:', error);
      alert(`Failed to ${app.is_active ? 'disable' : 'enable'} app: ${error.message}`);
    }
  }
  
  async function deleteApp(appId: string) {
    const authState = authManager.getAuthState();
    if (!authState.isAuthenticated || !authState.currentUser) return;
    
    const app = miniApps.find(a => a.id === appId);
    if (!app) return;
    
    if (!confirm(`Are you sure you want to delete "${app.name}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('mini_apps')
        .delete()
        .eq('id', appId)
        .eq('user_id', authState.currentUser.id);
      
      if (error) throw error;
      
      await loadMiniApps();
      
    } catch (error: any) {
      console.error('Error deleting mini app:', error);
      alert(`Failed to delete app: ${error.message}`);
    }
  }
  
  // Initial load
  loadMiniApps();
  
  return container;
}