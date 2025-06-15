import { MiniApp } from '../types';
import { authManager } from '../auth';
import { supabase } from '../lib/supabase';

export function createMiniAppManager(onClose: () => void): HTMLElement {
  const container = document.createElement('div');
  container.className = 'fixed inset-0 z-50 flex items-center justify-center p-4';
  
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
      <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" id="backdrop"></div>
      <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div class="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 class="text-2xl font-bold text-gray-900 flex items-center gap-2">
            📱 Mini App Management
          </h2>
          <button class="p-2 hover:bg-gray-100 rounded-lg transition-colors" id="close-btn">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <div class="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div class="mb-6">
            <p class="text-gray-600 mb-4">Share your business apps directly on your profile. Users can access your services like Uber, restaurant ordering, hotel booking, and more!</p>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                <span class="text-2xl">🚗</span>
                <span class="text-sm font-medium text-blue-800">Transportation</span>
              </div>
              <div class="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                <span class="text-2xl">🍽️</span>
                <span class="text-sm font-medium text-green-800">Food & Dining</span>
              </div>
              <div class="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
                <span class="text-2xl">🏨</span>
                <span class="text-sm font-medium text-purple-800">Hotels</span>
              </div>
              <div class="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
                <span class="text-2xl">🛍️</span>
                <span class="text-sm font-medium text-orange-800">Shopping</span>
              </div>
            </div>
          </div>
          
          <div class="mb-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-gray-900">Your Mini Apps</h3>
              <button class="btn-primary flex items-center gap-2" id="add-app-btn">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                </svg>
                Add App
              </button>
            </div>
            
            <div id="apps-list">
              ${isLoading ? `
                <div class="flex items-center justify-center py-12">
                  <div class="flex items-center gap-3">
                    <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                    <span class="text-gray-600">Loading mini apps...</span>
                  </div>
                </div>
              ` : miniApps.length === 0 ? `
                <div class="text-center py-12">
                  <div class="text-6xl mb-4">📱</div>
                  <h4 class="text-lg font-semibold text-gray-900 mb-2">No Mini Apps Added</h4>
                  <p class="text-gray-600 mb-6">Add your first mini app to start sharing your services with travelers.</p>
                  <button class="btn-primary" id="add-first-app-btn">Add Your First App</button>
                </div>
              ` : `
                <div class="grid gap-4">
                  ${miniApps.map(app => createAppCard(app)).join('')}
                </div>
              `}
            </div>
          </div>
        </div>
        
        <!-- Add/Edit App Form Modal -->
        <div class="hidden fixed inset-0 z-60 flex items-center justify-center p-4" id="app-form-modal">
          <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" id="form-backdrop"></div>
          <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden">
            <div class="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 class="text-lg font-semibold text-gray-900" id="form-title">Add Mini App</h3>
              <button class="p-2 hover:bg-gray-100 rounded-lg transition-colors" id="form-close-btn">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            <form class="p-6 space-y-4" id="app-form">
              <div>
                <label class="form-label" for="app-name">App Name</label>
                <input type="text" id="app-name" class="form-input" placeholder="My Taxi Service" required>
              </div>
              
              <div>
                <label class="form-label" for="app-description">Description</label>
                <textarea id="app-description" class="form-input" placeholder="Fast and reliable taxi service in the city" rows="3"></textarea>
              </div>
              
              <div>
                <label class="form-label" for="app-category">Category</label>
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
              
              <div>
                <label class="form-label" for="app-url">App URL</label>
                <input type="url" id="app-url" class="form-input" placeholder="https://your-app.com" required>
                <p class="form-help">The URL where users can access your app or service</p>
              </div>
              
              <div>
                <label class="form-label" for="app-icon">Icon URL (Optional)</label>
                <input type="url" id="app-icon" class="form-input" placeholder="https://your-app.com/icon.png">
                <p class="form-help">URL to your app's icon or logo</p>
              </div>
              
              <div class="flex items-center gap-2">
                <input type="checkbox" id="app-active" class="rounded border-gray-300 text-primary-600 focus:ring-primary-500" checked>
                <label for="app-active" class="text-sm text-gray-700">Active (show this app on your profile)</label>
              </div>
              
              <div class="form-error" id="app-form-error"></div>
              
              <div class="flex gap-3 pt-4">
                <button type="button" class="flex-1 px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors" id="cancel-btn">
                  Cancel
                </button>
                <button type="submit" class="flex-1 btn-primary" id="save-btn">
                  <span id="save-text">Save App</span>
                  <span id="save-loading" class="hidden">
                    <div class="loading-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </span>
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
      <div class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow ${app.is_active ? '' : 'opacity-60'}" data-app-id="${app.id}">
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
              ${app.icon_url ? `<img src="${app.icon_url}" alt="${app.name}" class="w-full h-full object-cover" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : ''}
              <span class="text-2xl ${app.icon_url ? 'hidden' : 'flex'}">${defaultIcon}</span>
            </div>
            <div>
              <h4 class="font-semibold text-gray-900">${app.name}</h4>
              <p class="text-sm text-gray-600">${app.description || 'No description'}</p>
            </div>
          </div>
          <div class="flex items-center gap-1">
            <span class="w-2 h-2 rounded-full ${app.is_active ? 'bg-green-500' : 'bg-gray-400'}"></span>
            <span class="text-xs text-gray-500">${app.is_active ? 'Active' : 'Inactive'}</span>
          </div>
        </div>
        
        <div class="space-y-2 mb-4">
          <div class="flex items-center gap-2 text-sm text-gray-600">
            <span class="font-medium">Category:</span>
            <span class="capitalize">${app.category}</span>
          </div>
          <div class="flex items-center gap-2 text-sm text-gray-600">
            <span class="font-medium">URL:</span>
            <span class="truncate">${app.app_url}</span>
          </div>
          <div class="flex items-center gap-2 text-sm text-gray-600">
            <span class="font-medium">Added:</span>
            <span>${new Date(app.created_at).toLocaleDateString()}</span>
          </div>
        </div>
        
        <div class="flex gap-2">
          <button class="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors preview-btn" data-app-id="${app.id}">
            Preview
          </button>
          <button class="flex-1 px-3 py-2 text-sm bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors edit-btn" data-app-id="${app.id}">
            Edit
          </button>
          <button class="flex-1 px-3 py-2 text-sm ${app.is_active ? 'bg-orange-50 text-orange-700 hover:bg-orange-100' : 'bg-green-50 text-green-700 hover:bg-green-100'} rounded-lg transition-colors toggle-btn" data-app-id="${app.id}">
            ${app.is_active ? 'Disable' : 'Enable'}
          </button>
          <button class="px-3 py-2 text-sm bg-red-50 text-red-700 hover:bg-red-100 rounded-lg transition-colors delete-btn" data-app-id="${app.id}">
            Delete
          </button>
        </div>
      </div>
    `;
  }
  
  function setupEventListeners() {
    // Close modal
    const backdrop = container.querySelector('#backdrop') as HTMLElement;
    const closeBtn = container.querySelector('#close-btn') as HTMLButtonElement;
    
    backdrop.addEventListener('click', onClose);
    closeBtn.addEventListener('click', onClose);
    
    // Add app buttons
    const addAppBtn = container.querySelector('#add-app-btn') as HTMLButtonElement;
    const addFirstAppBtn = container.querySelector('#add-first-app-btn') as HTMLButtonElement;
    
    addAppBtn?.addEventListener('click', () => showAppForm());
    addFirstAppBtn?.addEventListener('click', () => showAppForm());
    
    // App form
    const appForm = container.querySelector('#app-form') as HTMLFormElement;
    const formBackdrop = container.querySelector('#form-backdrop') as HTMLElement;
    const formCloseBtn = container.querySelector('#form-close-btn') as HTMLButtonElement;
    const cancelBtn = container.querySelector('#cancel-btn') as HTMLButtonElement;
    
    formBackdrop?.addEventListener('click', hideAppForm);
    formCloseBtn?.addEventListener('click', hideAppForm);
    cancelBtn?.addEventListener('click', hideAppForm);
    
    appForm?.addEventListener('submit', handleAppFormSubmit);
    
    // App card actions
    const appCards = container.querySelectorAll('[data-app-id]');
    appCards.forEach(card => {
      const appId = card.getAttribute('data-app-id')!;
      
      const previewBtn = card.querySelector('.preview-btn') as HTMLButtonElement;
      const editBtn = card.querySelector('.edit-btn') as HTMLButtonElement;
      const toggleBtn = card.querySelector('.toggle-btn') as HTMLButtonElement;
      const deleteBtn = card.querySelector('.delete-btn') as HTMLButtonElement;
      
      previewBtn?.addEventListener('click', () => previewApp(appId));
      editBtn?.addEventListener('click', () => editApp(appId));
      toggleBtn?.addEventListener('click', () => toggleApp(appId));
      deleteBtn?.addEventListener('click', () => deleteApp(appId));
    });
  }
  
  function showAppForm(app?: MiniApp) {
    const formModal = container.querySelector('#app-form-modal') as HTMLElement;
    const formTitle = container.querySelector('#form-title') as HTMLElement;
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
      (container.querySelector('#app-active') as HTMLInputElement).checked = true;
    }
    
    formModal.classList.remove('hidden');
  }
  
  function hideAppForm() {
    const formModal = container.querySelector('#app-form-modal') as HTMLElement;
    formModal.classList.add('hidden');
    
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
      name: (container.querySelector('#app-name') as HTMLInputElement).value.trim(),
      description: (container.querySelector('#app-description') as HTMLTextAreaElement).value.trim() || null,
      category: (container.querySelector('#app-category') as HTMLSelectElement).value,
      app_url: (container.querySelector('#app-url') as HTMLInputElement).value.trim(),
      icon_url: (container.querySelector('#app-icon') as HTMLInputElement).value.trim() || null,
      is_active: (container.querySelector('#app-active') as HTMLInputElement).checked,
      user_id: authState.currentUser.id
    };
    
    // Validation
    if (!appData.name || !appData.category || !appData.app_url) {
      showFormError('Please fill in all required fields');
      return;
    }
    
    try {
      new URL(appData.app_url);
    } catch {
      showFormError('Please enter a valid URL');
      return;
    }
    
    if (appData.icon_url) {
      try {
        new URL(appData.icon_url);
      } catch {
        showFormError('Please enter a valid icon URL');
        return;
      }
    }
    
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
    const saveBtn = container.querySelector('#save-btn') as HTMLButtonElement;
    const saveText = container.querySelector('#save-text') as HTMLElement;
    const saveLoading = container.querySelector('#save-loading') as HTMLElement;
    
    saveBtn.disabled = loading;
    saveText.classList.toggle('hidden', loading);
    saveLoading.classList.toggle('hidden', !loading);
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