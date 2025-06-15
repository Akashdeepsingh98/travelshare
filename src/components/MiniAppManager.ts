import { MiniApp } from '../types';
import { authManager } from '../auth';
import { supabase } from '../lib/supabase';

export function createMiniAppManager(onClose: () => void): HTMLElement {
  const container = document.createElement('div');
  container.className = 'mini-app-manager-modal';
  
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
        <div class="app-form-modal" style="display: none;">
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
              <span class="meta-label">Category:</span>
              <span class="meta-value">${app.category}</span>
            </span>
            <span class="meta-item">
              <span class="meta-label">URL:</span>
              <span class="meta-value">${app.app_url}</span>
            </span>
            <span class="meta-item">
              <span class="meta-label">Added:</span>
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
    const formData = new FormData(form);
    const isEdit = !!form.dataset.appId;
    
    const appData = {
      name: formData.get('app-name') as string,
      description: formData.get('app-description') as string,
      category: formData.get('app-category') as string,
      app_url: formData.get('app-url') as string,
      icon_url: formData.get('app-icon') as string || null,
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