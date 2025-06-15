import { User, MiniApp } from '../types';
import { authManager } from '../auth';
import { supabase } from '../lib/supabase';
import { createMCPManager } from './MCPManager';
import { createMiniAppManager } from './MiniAppManager';
import { createMiniAppViewer } from './MiniAppViewer';

export function createProfilePage(
  onNavigateBack: () => void,
  onNavigateToFollowing?: (userId: string, userName: string) => void,
  onNavigateToFollowers?: (userId: string, userName: string) => void,
  viewUserId?: string // Optional: view another user's profile
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'profile-page';
  
  // Add component styles
  const style = document.createElement('style');
  style.textContent = `
    .profile-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 2rem 1rem;
    }

    .profile-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 2rem;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      padding: 1rem 1.5rem;
      border-radius: 1rem;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .profile-header h1 {
      color: white;
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0;
    }

    .back-btn {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
    }

    .back-btn:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: translateY(-1px);
    }

    .profile-actions {
      display: flex;
      gap: 0.5rem;
    }

    .edit-profile-btn, .profile-follow-btn {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
    }

    .edit-profile-btn:hover, .profile-follow-btn:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: translateY(-1px);
    }

    .profile-follow-btn.following {
      background: rgba(34, 197, 94, 0.8);
    }

    .profile-content {
      background: white;
      border-radius: 1rem;
      padding: 2rem;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    }

    .profile-avatar-section {
      text-align: center;
      margin-bottom: 2rem;
    }

    .profile-avatar-large {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      object-fit: cover;
      border: 4px solid #667eea;
      margin-bottom: 1rem;
    }

    .profile-field {
      margin-bottom: 1.5rem;
    }

    .profile-field label {
      display: block;
      font-weight: 600;
      color: #374151;
      margin-bottom: 0.5rem;
    }

    .profile-value {
      color: #6b7280;
      font-size: 1rem;
    }

    .profile-stats {
      display: flex;
      gap: 1rem;
      margin-bottom: 2rem;
      justify-content: center;
    }

    .stat-item {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 1rem;
      border-radius: 0.75rem;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
      min-width: 80px;
    }

    .stat-item:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
    }

    .stat-item:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .stat-number {
      display: block;
      font-size: 1.5rem;
      font-weight: 700;
    }

    .stat-label {
      display: block;
      font-size: 0.875rem;
      opacity: 0.9;
    }

    .mini-apps-section {
      margin-bottom: 2rem;
    }

    .mini-apps-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .mini-apps-header h3 {
      color: #374151;
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0;
    }

    .manage-apps-btn {
      background: #667eea;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-size: 0.875rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.2s;
    }

    .manage-apps-btn:hover {
      background: #5a67d8;
      transform: translateY(-1px);
    }

    .mini-apps-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1rem;
    }

    .mini-app-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 0.75rem;
      padding: 1.5rem;
      transition: all 0.2s;
      cursor: pointer;
    }

    .mini-app-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
      border-color: #667eea;
    }

    .mini-app-icon {
      width: 48px;
      height: 48px;
      margin-bottom: 1rem;
      position: relative;
    }

    .mini-app-icon img {
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
    }

    .mini-app-info {
      margin-bottom: 1rem;
    }

    .mini-app-name {
      font-size: 1.125rem;
      font-weight: 600;
      color: #374151;
      margin: 0 0 0.5rem 0;
    }

    .mini-app-description {
      color: #6b7280;
      font-size: 0.875rem;
      margin: 0 0 0.5rem 0;
      line-height: 1.4;
    }

    .mini-app-category {
      display: inline-block;
      background: #f3f4f6;
      color: #6b7280;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      text-transform: capitalize;
    }

    .mini-app-launch {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 500;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: all 0.2s;
    }

    .mini-app-launch:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    .mini-apps-empty {
      text-align: center;
      padding: 3rem 1rem;
      background: #f9fafb;
      border-radius: 0.75rem;
      border: 2px dashed #d1d5db;
    }

    .empty-apps-content {
      max-width: 400px;
      margin: 0 auto;
    }

    .empty-apps-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .empty-apps-content h3 {
      color: #374151;
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0 0 0.5rem 0;
    }

    .empty-apps-content p {
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
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.2s;
    }

    .add-first-app-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    .business-section {
      background: #f9fafb;
      padding: 1.5rem;
      border-radius: 0.75rem;
      margin-bottom: 2rem;
    }

    .business-section h3 {
      color: #374151;
      font-size: 1.125rem;
      font-weight: 600;
      margin: 0 0 0.5rem 0;
    }

    .business-description {
      color: #6b7280;
      margin: 0 0 1rem 0;
      line-height: 1.5;
    }

    .manage-mcp-btn {
      background: #667eea;
      color: white;
      border: none;
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
    }

    .manage-mcp-btn:hover {
      background: #5a67d8;
      transform: translateY(-1px);
    }

    .profile-loading, .profile-error {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 50vh;
      text-align: center;
    }

    .loading-spinner {
      color: white;
      font-size: 1.125rem;
    }

    .profile-error p {
      color: white;
      font-size: 1.125rem;
      margin-bottom: 1rem;
    }

    /* Edit Profile Styles */
    .profile-edit-mode {
      background: white;
      border-radius: 1rem;
      padding: 2rem;
    }

    .profile-avatar-edit-section {
      text-align: center;
      margin-bottom: 2rem;
    }

    .avatar-preview-container {
      position: relative;
      display: inline-block;
      margin-bottom: 1rem;
    }

    .change-avatar-btn {
      position: absolute;
      bottom: 0;
      right: 0;
      background: #667eea;
      color: white;
      border: none;
      padding: 0.5rem;
      border-radius: 50%;
      cursor: pointer;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .avatar-url-section {
      margin-top: 1rem;
    }

    .avatar-url-input {
      width: 100%;
      max-width: 400px;
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.5rem;
      font-size: 0.875rem;
    }

    .profile-form-fields {
      max-width: 500px;
      margin: 0 auto;
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

    .form-error {
      color: #dc2626;
      font-size: 0.875rem;
      margin-top: 0.5rem;
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
    }

    .cancel-edit-btn {
      background: #6b7280;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 500;
    }

    .save-profile-btn {
      background: #667eea;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 500;
    }

    .save-profile-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-loading {
      display: none;
    }
  `;
  
  if (!document.head.querySelector('#profile-page-styles')) {
    style.id = 'profile-page-styles';
    document.head.appendChild(style);
  }
  
  let profileUser: User | null = null;
  let followStats = { followers: 0, following: 0 };
  let mcpServerCount = 0;
  let miniApps: MiniApp[] = [];
  let isFollowing = false;
  let isOwnProfile = false;
  
  async function loadProfileData() {
    const authState = authManager.getAuthState();
    
    if (authState.loading) {
      renderLoadingState();
      return;
    }
    
    if (!authState.isAuthenticated || !authState.currentUser) {
      renderErrorState('Please log in to view profiles.');
      return;
    }
    
    const targetUserId = viewUserId || authState.currentUser.id;
    isOwnProfile = targetUserId === authState.currentUser.id;
    
    try {
      // Load profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .single();
      
      if (profileError) throw profileError;
      
      profileUser = profile;
      
      // Load follow statistics
      await loadFollowStats(targetUserId);
      
      // Load MCP server count if it's own profile
      if (isOwnProfile) {
        await loadMCPServerCount(targetUserId);
      }
      
      // Load mini apps
      await loadMiniApps(targetUserId);
      
      // Load follow status if viewing another user's profile
      if (!isOwnProfile) {
        await loadFollowStatus(targetUserId, authState.currentUser.id);
      }
      
      renderProfilePage();
    } catch (error) {
      console.error('Error loading profile:', error);
      renderErrorState('Unable to load profile. Please try again.');
    }
  }
  
  async function loadFollowStats(userId: string) {
    try {
      // Get followers count
      const { count: followersCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId);
      
      // Get following count
      const { count: followingCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId);
      
      followStats = {
        followers: followersCount || 0,
        following: followingCount || 0
      };
    } catch (error) {
      console.error('Error loading follow stats:', error);
      followStats = { followers: 0, following: 0 };
    }
  }
  
  async function loadMCPServerCount(userId: string) {
    try {
      const { count } = await supabase
        .from('mcp_servers')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      
      mcpServerCount = count || 0;
    } catch (error) {
      console.error('Error loading MCP server count:', error);
      mcpServerCount = 0;
    }
  }
  
  async function loadMiniApps(userId: string) {
    try {
      const { data, error } = await supabase
        .from('mini_apps')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      miniApps = data || [];
    } catch (error) {
      console.error('Error loading mini apps:', error);
      miniApps = [];
    }
  }
  
  async function loadFollowStatus(targetUserId: string, currentUserId: string) {
    try {
      const { data } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', currentUserId)
        .eq('following_id', targetUserId)
        .single();
      
      isFollowing = !!data;
    } catch (error) {
      isFollowing = false;
    }
  }
  
  function renderProfilePage() {
    if (!profileUser) return;
    
    const authState = authManager.getAuthState();
    const currentUser = authState.currentUser;
    const avatarUrl = profileUser.avatar_url || 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop';
    
    container.innerHTML = `
      <div class="profile-header">
        <button class="back-btn">← Back</button>
        <h1>${isOwnProfile ? 'Profile' : profileUser.name}</h1>
        <div class="profile-actions">
          ${isOwnProfile ? `
            <button class="edit-profile-btn">Edit</button>
          ` : `
            <button class="profile-follow-btn ${isFollowing ? 'following' : ''}" data-user-id="${profileUser.id}">
              ${isFollowing ? 'Following' : 'Follow'}
            </button>
          `}
        </div>
      </div>
      
      <div class="profile-content">
        <!-- Profile View Mode -->
        <div class="profile-view-mode">
          <div class="profile-avatar-section">
            <img src="${avatarUrl}" alt="${profileUser.name}" class="profile-avatar-large">
          </div>
          
          <div class="profile-info-section">
            <div class="profile-field">
              <label>Name</label>
              <div class="profile-value">${profileUser.name}</div>
            </div>
            
            <div class="profile-stats">
              <button class="stat-item followers-btn" ${onNavigateToFollowers ? '' : 'disabled'}>
                <span class="stat-number">${followStats.followers}</span>
                <span class="stat-label">Followers</span>
              </button>
              <button class="stat-item following-btn" ${onNavigateToFollowing ? '' : 'disabled'}>
                <span class="stat-number">${followStats.following}</span>
                <span class="stat-label">Following</span>
              </button>
              ${isOwnProfile ? `
                <button class="stat-item mcp-servers-btn">
                  <span class="stat-number">${mcpServerCount}</span>
                  <span class="stat-label">MCP Servers</span>
                </button>
              ` : ''}
            </div>
            
            ${miniApps.length > 0 ? `
              <div class="mini-apps-section">
                <div class="mini-apps-header">
                  <h3>${isOwnProfile ? 'Your Services' : `${profileUser.name}'s Services`}</h3>
                  ${isOwnProfile ? `
                    <button class="manage-apps-btn">
                      <span class="manage-icon">⚙️</span>
                      Manage
                    </button>
                  ` : ''}
                </div>
                <div class="mini-apps-grid">
                  ${miniApps.map(app => createMiniAppCard(app)).join('')}
                </div>
              </div>
            ` : isOwnProfile ? `
              <div class="mini-apps-section">
                <div class="mini-apps-empty">
                  <div class="empty-apps-content">
                    <div class="empty-apps-icon">📱</div>
                    <h3>Share Your Services</h3>
                    <p>Add mini apps to showcase your business services like transportation, food delivery, or booking platforms.</p>
                    <button class="add-first-app-btn">
                      <span class="add-icon">➕</span>
                      Add Your First App
                    </button>
                  </div>
                </div>
              </div>
            ` : ''}
            
            ${isOwnProfile ? `
              <div class="business-section">
                <h3>Business Integration</h3>
                <p class="business-description">
                  Connect your business data through MCP (Model Context Protocol) to provide real-time information to AI chat.
                </p>
                <button class="manage-mcp-btn">
                  🔌 Manage MCP Servers
                </button>
              </div>
            ` : ''}
            
            <div class="profile-field">
              <label>Member Since</label>
              <div class="profile-value">${formatDate(profileUser.created_at)}</div>
            </div>
          </div>
        </div>
        
        <!-- Profile Edit Mode (only for own profile) -->
        ${isOwnProfile ? `
          <div class="profile-edit-mode" style="display: none;">
            <form class="profile-edit-form">
              <div class="profile-avatar-edit-section">
                <div class="avatar-preview-container">
                  <img src="${avatarUrl}" alt="${profileUser.name}" class="profile-avatar-large" id="avatar-preview">
                  <button type="button" class="change-avatar-btn">
                    <span class="camera-icon">📷</span>
                  </button>
                </div>
                <input type="file" accept="image/*" class="avatar-file-input" style="display: none;">
                <div class="avatar-url-section">
                  <input type="url" placeholder="Or paste image URL" class="avatar-url-input" value="${profileUser.avatar_url || ''}">
                </div>
              </div>
              
              <div class="profile-form-fields">
                <div class="form-group">
                  <label for="profile-name">Name</label>
                  <input type="text" id="profile-name" class="form-input" value="${profileUser.name}" required>
                </div>
                
                <div class="form-error" id="profile-error"></div>
                
                <div class="form-actions">
                  <button type="button" class="cancel-edit-btn">Cancel</button>
                  <button type="submit" class="save-profile-btn">
                    <span class="btn-text">Save Changes</span>
                    <span class="btn-loading" style="display: none;">Saving...</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        ` : ''}
      </div>
    `;
    
    setupEventListeners();
  }
  
  function createMiniAppCard(app: MiniApp): string {
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
      <div class="mini-app-card" data-app-id="${app.id}">
        <div class="mini-app-icon">
          ${app.icon_url ? `<img src="${app.icon_url}" alt="${app.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">` : ''}
          <span class="app-icon-fallback" ${app.icon_url ? 'style="display: none;"' : ''}>${defaultIcon}</span>
        </div>
        <div class="mini-app-info">
          <h4 class="mini-app-name">${app.name}</h4>
          <p class="mini-app-description">${app.description || 'No description'}</p>
          <span class="mini-app-category">${app.category}</span>
        </div>
        <button class="mini-app-launch" data-app-id="${app.id}">
          <span class="launch-icon">🚀</span>
          Launch
        </button>
      </div>
    `;
  }
  
  function setupEventListeners() {
    if (!profileUser) return;
    
    const authState = authManager.getAuthState();
    const currentUser = authState.currentUser;
    
    // Navigation
    const backBtn = container.querySelector('.back-btn') as HTMLButtonElement;
    backBtn.addEventListener('click', onNavigateBack);
    
    // Follow stats navigation
    const followersBtn = container.querySelector('.followers-btn') as HTMLButtonElement;
    const followingBtn = container.querySelector('.following-btn') as HTMLButtonElement;
    
    if (followersBtn && onNavigateToFollowers) {
      followersBtn.addEventListener('click', () => {
        onNavigateToFollowers(profileUser!.id, profileUser!.name);
      });
    }
    
    if (followingBtn && onNavigateToFollowing) {
      followingBtn.addEventListener('click', () => {
        onNavigateToFollowing(profileUser!.id, profileUser!.name);
      });
    }
    
    // Follow button for other users' profiles
    const profileFollowBtn = container.querySelector('.profile-follow-btn') as HTMLButtonElement;
    if (profileFollowBtn && !isOwnProfile) {
      profileFollowBtn.addEventListener('click', async () => {
        if (!authState.isAuthenticated) return;
        
        try {
          if (isFollowing) {
            await supabase
              .from('follows')
              .delete()
              .eq('follower_id', currentUser!.id)
              .eq('following_id', profileUser!.id);
            
            isFollowing = false;
            followStats.followers = Math.max(0, followStats.followers - 1);
          } else {
            await supabase
              .from('follows')
              .insert({
                follower_id: currentUser!.id,
                following_id: profileUser!.id
              });
            
            isFollowing = true;
            followStats.followers += 1;
          }
          
          renderProfilePage();
        } catch (error) {
          console.error('Error toggling follow:', error);
        }
      });
    }
    
    // MCP servers navigation (only for own profile)
    if (isOwnProfile) {
      const mcpServersBtn = container.querySelector('.mcp-servers-btn') as HTMLButtonElement;
      const manageMcpBtn = container.querySelector('.manage-mcp-btn') as HTMLButtonElement;
      const manageAppsBtn = container.querySelector('.manage-apps-btn') as HTMLButtonElement;
      const addFirstAppBtn = container.querySelector('.add-first-app-btn') as HTMLButtonElement;
      
      mcpServersBtn?.addEventListener('click', showMCPManager);
      manageMcpBtn?.addEventListener('click', showMCPManager);
      manageAppsBtn?.addEventListener('click', showMiniAppManager);
      addFirstAppBtn?.addEventListener('click', showMiniAppManager);
      
      // Edit profile functionality
      setupEditProfileFunctionality();
    }
    
    // Mini app launch buttons
    const launchBtns = container.querySelectorAll('.mini-app-launch') as NodeListOf<HTMLButtonElement>;
    launchBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const appId = btn.dataset.appId!;
        const app = miniApps.find(a => a.id === appId);
        if (app) {
          showMiniAppViewer(app);
        }
      });
    });
  }
  
  function showMCPManager() {
    const mcpManager = createMCPManager(() => {
      // Close MCP manager and refresh server count
      const mcpModal = document.querySelector('.mcp-manager-modal');
      if (mcpModal) {
        mcpModal.remove();
        document.body.style.overflow = '';
      }
      
      // Refresh MCP server count
      if (profileUser) {
        loadMCPServerCount(profileUser.id).then(() => {
          renderProfilePage();
        });
      }
    });
    
    document.body.appendChild(mcpManager);
    document.body.style.overflow = 'hidden';
  }
  
  function showMiniAppManager() {
    console.log('Creating mini app manager...');
    const miniAppManager = createMiniAppManager(() => {
      console.log('Closing mini app manager...');
      // Close mini app manager and refresh apps
      const appModal = document.querySelector('.mini-app-manager-modal');
      if (appModal) {
        appModal.remove();
        document.body.style.overflow = '';
      }
      
      // Refresh mini apps
      if (profileUser) {
        loadMiniApps(profileUser.id).then(() => {
          renderProfilePage();
        });
      }
    });
    
    console.log('Appending mini app manager to body...');
    document.body.appendChild(miniAppManager);
    document.body.style.overflow = 'hidden';
    
    // Force the modal to be visible
    setTimeout(() => {
      const modal = document.querySelector('.mini-app-manager-modal') as HTMLElement;
      if (modal) {
        modal.style.display = 'flex';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.zIndex = '9999';
        console.log('Modal should now be visible');
      }
    }, 100);
  }
  
  function showMiniAppViewer(app: MiniApp) {
    const viewer = createMiniAppViewer(app, () => {
      const viewerModal = document.querySelector('.mini-app-viewer-modal');
      if (viewerModal) {
        viewerModal.remove();
        document.body.style.overflow = '';
      }
    });
    
    document.body.appendChild(viewer);
    document.body.style.overflow = 'hidden';
  }
  
  function setupEditProfileFunctionality() {
    if (!profileUser) return;
    
    const authState = authManager.getAuthState();
    const currentUser = authState.currentUser!;
    
    const editProfileBtn = container.querySelector('.edit-profile-btn') as HTMLButtonElement;
    const profileViewMode = container.querySelector('.profile-view-mode') as HTMLElement;
    const profileEditMode = container.querySelector('.profile-edit-mode') as HTMLElement;
    const profileEditForm = container.querySelector('.profile-edit-form') as HTMLFormElement;
    const changeAvatarBtn = container.querySelector('.change-avatar-btn') as HTMLButtonElement;
    const avatarFileInput = container.querySelector('.avatar-file-input') as HTMLInputElement;
    const avatarUrlInput = container.querySelector('.avatar-url-input') as HTMLInputElement;
    const avatarPreview = container.querySelector('#avatar-preview') as HTMLImageElement;
    const profileNameInput = container.querySelector('#profile-name') as HTMLInputElement;
    const cancelEditBtn = container.querySelector('.cancel-edit-btn') as HTMLButtonElement;
    const saveProfileBtn = container.querySelector('.save-profile-btn') as HTMLButtonElement;
    const profileError = container.querySelector('#profile-error') as HTMLElement;
    
    let selectedAvatarUrl = profileUser.avatar_url || '';
    
    // Toggle edit mode
    editProfileBtn.addEventListener('click', () => {
      profileViewMode.style.display = 'none';
      profileEditMode.style.display = 'block';
      editProfileBtn.style.display = 'none';
    });
    
    cancelEditBtn.addEventListener('click', () => {
      profileEditMode.style.display = 'none';
      profileViewMode.style.display = 'block';
      editProfileBtn.style.display = 'block';
      
      // Reset form
      profileNameInput.value = profileUser!.name;
      avatarUrlInput.value = profileUser!.avatar_url || '';
      selectedAvatarUrl = profileUser!.avatar_url || '';
      avatarPreview.src = profileUser!.avatar_url || 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop';
      clearError();
    });
    
    // Avatar upload handling
    changeAvatarBtn.addEventListener('click', () => {
      avatarFileInput.click();
    });
    
    avatarFileInput.addEventListener('change', (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          selectedAvatarUrl = e.target?.result as string;
          avatarPreview.src = selectedAvatarUrl;
          avatarUrlInput.value = '';
        };
        reader.readAsDataURL(file);
      }
    });
    
    avatarUrlInput.addEventListener('input', (e) => {
      const url = (e.target as HTMLInputElement).value.trim();
      if (url) {
        selectedAvatarUrl = url;
        avatarPreview.src = url;
      } else if (!avatarFileInput.files?.length) {
        selectedAvatarUrl = profileUser!.avatar_url || '';
        avatarPreview.src = profileUser!.avatar_url || 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop';
      }
    });
    
    // Error handling
    function showError(message: string) {
      profileError.textContent = message;
    }
    
    function clearError() {
      profileError.textContent = '';
    }
    
    // Loading state
    function setLoading(loading: boolean) {
      const btnText = saveProfileBtn.querySelector('.btn-text') as HTMLElement;
      const btnLoading = saveProfileBtn.querySelector('.btn-loading') as HTMLElement;
      
      if (loading) {
        saveProfileBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline';
      } else {
        saveProfileBtn.disabled = false;
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
      }
    }
    
    // Form submission
    profileEditForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const newName = profileNameInput.value.trim();
      
      if (!newName) {
        showError('Name is required');
        return;
      }
      
      setLoading(true);
      clearError();
      
      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            name: newName,
            avatar_url: selectedAvatarUrl || null
          })
          .eq('id', currentUser.id);
        
        if (error) throw error;
        
        // Update local profile data
        profileUser = {
          ...profileUser!,
          name: newName,
          avatar_url: selectedAvatarUrl || null
        };
        
        // Force auth manager to refresh user data
        await authManager.refreshCurrentUser();
        
        // Switch back to view mode
        profileEditMode.style.display = 'none';
        profileViewMode.style.display = 'block';
        editProfileBtn.style.display = 'block';
        
        // Re-render with updated data
        renderProfilePage();
        
      } catch (error) {
        console.error('Error updating profile:', error);
        showError('Failed to update profile. Please try again.');
      } finally {
        setLoading(false);
      }
    });
  }
  
  function renderLoadingState() {
    container.innerHTML = `
      <div class="profile-loading">
        <div class="loading-spinner">Loading profile...</div>
      </div>
    `;
  }
  
  function renderErrorState(message: string) {
    container.innerHTML = `
      <div class="profile-error">
        <p>${message}</p>
        <button class="back-btn">Go Back</button>
      </div>
    `;
    
    const backBtn = container.querySelector('.back-btn') as HTMLButtonElement;
    backBtn.addEventListener('click', onNavigateBack);
  }
  
  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
  }
  
  // Initial load
  loadProfileData();
  
  // Listen for auth changes
  authManager.onAuthChange(() => {
    loadProfileData();
  });
  
  return container;
}