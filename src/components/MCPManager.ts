import { MCPServer } from '../types';
import { authManager } from '../auth';
import { supabase } from '../lib/supabase';

export function createMCPManager(onClose: () => void): HTMLElement {
  const container = document.createElement('div');
  container.className = 'mcp-manager-modal';
  
  let mcpServers: MCPServer[] = [];
  let isLoading = false;
  
  async function loadMCPServers() {
    const authState = authManager.getAuthState();
    if (!authState.isAuthenticated || !authState.currentUser) return;
    
    isLoading = true;
    renderMCPManager();
    
    try {
      const { data, error } = await supabase
        .from('mcp_servers')
        .select('*')
        .eq('user_id', authState.currentUser.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      mcpServers = data || [];
      renderMCPManager();
    } catch (error) {
      console.error('Error loading MCP servers:', error);
    } finally {
      isLoading = false;
    }
  }
  
  function renderMCPManager() {
    container.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="mcp-manager-content">
        <div class="mcp-manager-header">
          <h2>🔌 MCP Server Management</h2>
          <button class="modal-close">✕</button>
        </div>
        
        <div class="mcp-manager-body">
          <div class="mcp-intro">
            <p>Connect your business data sources using Model Context Protocol (MCP) to provide real-time information to AI chat.</p>
            <div class="mcp-benefits">
              <div class="benefit-item">
                <span class="benefit-icon">🏪</span>
                <span>Mall & Store Information</span>
              </div>
              <div class="benefit-item">
                <span class="benefit-icon">🍽️</span>
                <span>Restaurant Menus & Availability</span>
              </div>
              <div class="benefit-item">
                <span class="benefit-icon">✈️</span>
                <span>Flight Schedules & Booking</span>
              </div>
              <div class="benefit-item">
                <span class="benefit-icon">🚗</span>
                <span>Taxi & Transportation</span>
              </div>
            </div>
          </div>
          
          <div class="mcp-servers-section">
            <div class="section-header">
              <h3>Connected Servers</h3>
              <button class="add-server-btn">+ Add Server</button>
            </div>
            
            <div class="mcp-servers-list">
              ${isLoading ? `
                <div class="loading-state">
                  <div class="loading-spinner"></div>
                  <p>Loading MCP servers...</p>
                </div>
              ` : mcpServers.length === 0 ? `
                <div class="empty-servers">
                  <div class="empty-icon">🔌</div>
                  <h4>No MCP Servers Connected</h4>
                  <p>Connect your first MCP server to start providing real-time business data to AI chat.</p>
                  <button class="add-first-server-btn">Add Your First Server</button>
                </div>
              ` : mcpServers.map(server => createServerCard(server)).join('')}
            </div>
          </div>
        </div>
        
        <!-- Add/Edit Server Form -->
        <div class="server-form-modal" style="display: none;">
          <div class="server-form-backdrop"></div>
          <div class="server-form-content">
            <div class="server-form-header">
              <h3 id="form-title">Add MCP Server</h3>
              <button class="server-form-close">✕</button>
            </div>
            
            <form class="server-form" id="server-form">
              <div class="form-group">
                <label for="server-name">Server Name</label>
                <input type="text" id="server-name" class="form-input" placeholder="My Restaurant API" required>
              </div>
              
              <div class="form-group">
                <label for="server-description">Description</label>
                <textarea id="server-description" class="form-input" placeholder="Provides menu, availability, and booking information" rows="3"></textarea>
              </div>
              
              <div class="form-group">
                <label for="server-category">Category</label>
                <select id="server-category" class="form-input" required>
                  <option value="">Select category...</option>
                  <option value="restaurant">🍽️ Restaurant</option>
                  <option value="hotel">🏨 Hotel</option>
                  <option value="flight">✈️ Flight</option>
                  <option value="taxi">🚗 Taxi/Transportation</option>
                  <option value="mall">🏪 Mall/Shopping</option>
                  <option value="attraction">🎢 Attraction/Entertainment</option>
                  <option value="general">📋 General</option>
                </select>
              </div>
              
              <div class="form-group">
                <label for="server-endpoint">MCP Endpoint URL</label>
                <input type="url" id="server-endpoint" class="form-input" placeholder="https://api.yourservice.com/mcp" required>
                <small class="form-help">The URL where your MCP server is hosted</small>
              </div>
              
              <div class="form-group">
                <label for="server-api-key">API Key (Optional)</label>
                <input type="password" id="server-api-key" class="form-input" placeholder="Your API key for authentication">
                <small class="form-help">Will be encrypted and stored securely</small>
              </div>
              
              <div class="form-group">
                <label class="checkbox-label">
                  <input type="checkbox" id="server-active" checked>
                  <span class="checkbox-custom"></span>
                  Active (enable this server for AI chat)
                </label>
              </div>
              
              <div class="form-error" id="server-form-error"></div>
              
              <div class="form-actions">
                <button type="button" class="cancel-btn">Cancel</button>
                <button type="submit" class="save-btn">
                  <span class="btn-text">Save Server</span>
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
  
  function createServerCard(server: MCPServer): string {
    const categoryIcons = {
      restaurant: '🍽️',
      hotel: '🏨',
      flight: '✈️',
      taxi: '🚗',
      mall: '🏪',
      attraction: '🎢',
      general: '📋'
    };
    
    return `
      <div class="server-card ${server.isActive ? 'active' : 'inactive'}" data-server-id="${server.id}">
        <div class="server-card-header">
          <div class="server-info">
            <span class="server-icon">${categoryIcons[server.category]}</span>
            <div class="server-details">
              <h4 class="server-name">${server.name}</h4>
              <p class="server-description">${server.description || 'No description'}</p>
            </div>
          </div>
          <div class="server-status">
            <span class="status-indicator ${server.isActive ? 'active' : 'inactive'}"></span>
            <span class="status-text">${server.isActive ? 'Active' : 'Inactive'}</span>
          </div>
        </div>
        
        <div class="server-card-body">
          <div class="server-meta">
            <span class="meta-item">
              <span class="meta-label">Category:</span>
              <span class="meta-value">${server.category}</span>
            </span>
            <span class="meta-item">
              <span class="meta-label">Endpoint:</span>
              <span class="meta-value">${server.endpoint}</span>
            </span>
            <span class="meta-item">
              <span class="meta-label">Added:</span>
              <span class="meta-value">${new Date(server.created_at).toLocaleDateString()}</span>
            </span>
          </div>
          
          <div class="server-capabilities">
            ${Array.isArray(server.capabilities) && server.capabilities.length > 0 ? `
              <div class="capabilities-list">
                ${server.capabilities.map(cap => `<span class="capability-tag">${cap}</span>`).join('')}
              </div>
            ` : `
              <span class="no-capabilities">No capabilities detected</span>
            `}
          </div>
        </div>
        
        <div class="server-card-actions">
          <button class="test-server-btn" data-server-id="${server.id}">Test Connection</button>
          <button class="edit-server-btn" data-server-id="${server.id}">Edit</button>
          <button class="toggle-server-btn" data-server-id="${server.id}">
            ${server.isActive ? 'Disable' : 'Enable'}
          </button>
          <button class="delete-server-btn" data-server-id="${server.id}">Delete</button>
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
    
    // Add server buttons
    const addServerBtn = container.querySelector('.add-server-btn') as HTMLButtonElement;
    const addFirstServerBtn = container.querySelector('.add-first-server-btn') as HTMLButtonElement;
    
    addServerBtn?.addEventListener('click', () => showServerForm());
    addFirstServerBtn?.addEventListener('click', () => showServerForm());
    
    // Server form
    const serverForm = container.querySelector('#server-form') as HTMLFormElement;
    const serverFormClose = container.querySelector('.server-form-close') as HTMLButtonElement;
    const serverFormBackdrop = container.querySelector('.server-form-backdrop') as HTMLElement;
    const cancelBtn = container.querySelector('.cancel-btn') as HTMLButtonElement;
    
    serverFormClose?.addEventListener('click', hideServerForm);
    serverFormBackdrop?.addEventListener('click', hideServerForm);
    cancelBtn?.addEventListener('click', hideServerForm);
    
    serverForm?.addEventListener('submit', handleServerFormSubmit);
    
    // Server card actions
    const serverCards = container.querySelectorAll('.server-card');
    serverCards.forEach(card => {
      const serverId = card.getAttribute('data-server-id')!;
      
      const testBtn = card.querySelector('.test-server-btn') as HTMLButtonElement;
      const editBtn = card.querySelector('.edit-server-btn') as HTMLButtonElement;
      const toggleBtn = card.querySelector('.toggle-server-btn') as HTMLButtonElement;
      const deleteBtn = card.querySelector('.delete-server-btn') as HTMLButtonElement;
      
      testBtn?.addEventListener('click', () => testServerConnection(serverId));
      editBtn?.addEventListener('click', () => editServer(serverId));
      toggleBtn?.addEventListener('click', () => toggleServer(serverId));
      deleteBtn?.addEventListener('click', () => deleteServer(serverId));
    });
  }
  
  function showServerForm(server?: MCPServer) {
    const formModal = container.querySelector('.server-form-modal') as HTMLElement;
    const formTitle = container.querySelector('#form-title') as HTMLElement;
    const form = container.querySelector('#server-form') as HTMLFormElement;
    
    formTitle.textContent = server ? 'Edit MCP Server' : 'Add MCP Server';
    
    if (server) {
      (container.querySelector('#server-name') as HTMLInputElement).value = server.name;
      (container.querySelector('#server-description') as HTMLTextAreaElement).value = server.description || '';
      (container.querySelector('#server-category') as HTMLSelectElement).value = server.category;
      (container.querySelector('#server-endpoint') as HTMLInputElement).value = server.endpoint;
      (container.querySelector('#server-api-key') as HTMLInputElement).value = server.apiKey || '';
      (container.querySelector('#server-active') as HTMLInputElement).checked = server.isActive;
      
      form.dataset.serverId = server.id;
    } else {
      form.reset();
      delete form.dataset.serverId;
    }
    
    formModal.style.display = 'flex';
  }
  
  function hideServerForm() {
    const formModal = container.querySelector('.server-form-modal') as HTMLElement;
    formModal.style.display = 'none';
    
    // Clear form
    const form = container.querySelector('#server-form') as HTMLFormElement;
    form.reset();
    delete form.dataset.serverId;
    
    // Clear errors
    const errorElement = container.querySelector('#server-form-error') as HTMLElement;
    errorElement.textContent = '';
  }
  
  async function handleServerFormSubmit(e: Event) {
    e.preventDefault();
    
    const authState = authManager.getAuthState();
    if (!authState.isAuthenticated || !authState.currentUser) return;
    
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const isEdit = !!form.dataset.serverId;
    
    const serverData = {
      name: formData.get('server-name') as string,
      description: formData.get('server-description') as string,
      category: formData.get('server-category') as string,
      endpoint: formData.get('server-endpoint') as string,
      api_key: formData.get('server-api-key') as string,
      is_active: (container.querySelector('#server-active') as HTMLInputElement).checked,
      user_id: authState.currentUser.id
    };
    
    setFormLoading(true);
    
    try {
      let result;
      
      if (isEdit) {
        result = await supabase
          .from('mcp_servers')
          .update(serverData)
          .eq('id', form.dataset.serverId!)
          .eq('user_id', authState.currentUser.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from('mcp_servers')
          .insert(serverData)
          .select()
          .single();
      }
      
      if (result.error) throw result.error;
      
      hideServerForm();
      await loadMCPServers();
      
    } catch (error: any) {
      console.error('Error saving MCP server:', error);
      showFormError(error.message || 'Failed to save server');
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
    const errorElement = container.querySelector('#server-form-error') as HTMLElement;
    errorElement.textContent = message;
  }
  
  async function testServerConnection(serverId: string) {
    const server = mcpServers.find(s => s.id === serverId);
    if (!server) return;
    
    const testBtn = container.querySelector(`[data-server-id="${serverId}"].test-server-btn`) as HTMLButtonElement;
    const originalText = testBtn.textContent;
    
    testBtn.textContent = 'Testing...';
    testBtn.disabled = true;
    
    try {
      // Test MCP server connection
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mcp-test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          endpoint: server.endpoint,
          apiKey: server.apiKey
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        alert(`✅ Connection successful!\n\nCapabilities: ${result.capabilities?.length || 0} tools available`);
        
        // Update server capabilities
        if (result.capabilities) {
          await supabase
            .from('mcp_servers')
            .update({ capabilities: result.capabilities })
            .eq('id', serverId);
          
          await loadMCPServers();
        }
      } else {
        alert(`❌ Connection failed: ${result.error}`);
      }
      
    } catch (error: any) {
      console.error('Error testing MCP server:', error);
      alert(`❌ Connection failed: ${error.message}`);
    } finally {
      testBtn.textContent = originalText;
      testBtn.disabled = false;
    }
  }
  
  function editServer(serverId: string) {
    const server = mcpServers.find(s => s.id === serverId);
    if (server) {
      showServerForm(server);
    }
  }
  
  async function toggleServer(serverId: string) {
    const authState = authManager.getAuthState();
    if (!authState.isAuthenticated || !authState.currentUser) return;
    
    const server = mcpServers.find(s => s.id === serverId);
    if (!server) return;
    
    try {
      const { error } = await supabase
        .from('mcp_servers')
        .update({ is_active: !server.isActive })
        .eq('id', serverId)
        .eq('user_id', authState.currentUser.id);
      
      if (error) throw error;
      
      await loadMCPServers();
      
    } catch (error: any) {
      console.error('Error toggling MCP server:', error);
      alert(`Failed to ${server.isActive ? 'disable' : 'enable'} server: ${error.message}`);
    }
  }
  
  async function deleteServer(serverId: string) {
    const authState = authManager.getAuthState();
    if (!authState.isAuthenticated || !authState.currentUser) return;
    
    const server = mcpServers.find(s => s.id === serverId);
    if (!server) return;
    
    if (!confirm(`Are you sure you want to delete "${server.name}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('mcp_servers')
        .delete()
        .eq('id', serverId)
        .eq('user_id', authState.currentUser.id);
      
      if (error) throw error;
      
      await loadMCPServers();
      
    } catch (error: any) {
      console.error('Error deleting MCP server:', error);
      alert(`Failed to delete server: ${error.message}`);
    }
  }
  
  // Initial load
  loadMCPServers();
  
  return container;
}