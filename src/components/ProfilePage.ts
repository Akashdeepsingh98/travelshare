import { User, MiniApp, Post } from '../types';
import { authManager } from '../auth';
import { supabase } from '../lib/supabase';
import { createMCPManager } from './MCPManager';
import { createMiniAppManager } from './MiniAppManager';

// Helper function to validate UUID format
function isValidUUID(str: any): boolean {
  if (typeof str !== 'string') return false;
  // UUID v4 regex pattern
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidPattern.test(str);
}
import { createItineraryList } from './ItineraryList';
import { createMiniAppViewer } from './MiniAppViewer';
import { createPostCard } from './PostCard';
import { createMCPTestGuide } from './MCPTestGuide';

export function createProfilePage(
  onNavigateBack: () => void,
  onNavigateToFollowing?: (userId: string, userName: string) => void,
  onNavigateToFollowers?: (userId: string, userName: string) => void,
  viewUserId?: string, // Optional: view another user's profile
  onUserClick?: (userId: string) => void,
  onAskAI?: (post: Post) => void,
  onAskAIAboutUser?: (userId: string, userName: string) => void,
  onViewItinerary?: (itineraryId: string) => void
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'profile-page';
  
  // Add component styles directly to the component
  const style = document.createElement('style');
  style.textContent = `
    .profile-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 2rem 1rem;
    }

    .profile-content {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 1rem;
      padding: 2rem;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
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

    .profile-loading, .profile-error {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 50vh;
      text-align: center;
      color: white;
      padding: 2rem;
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(255, 255, 255, 0.3);
      border-top: 3px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .profile-error p {
      margin-bottom: 1.5rem;
      font-size: 1.125rem;
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
      color: white;
    }

    .stat-label {
      display: block;
      font-size: 0.875rem;
      color: rgba(255, 255, 255, 0.95);
      font-weight: 500;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
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

    /* Responsive design */
    @media (max-width: 768px) {
      .profile-page {
        padding: 1rem;
      }

      .profile-content {
        padding: 1.5rem;
      }

      .profile-stats {
        flex-wrap: wrap;
      }

      .stat-item {
        min-width: calc(50% - 0.5rem);
      }
    }

    @media (max-width: 480px) {
      .profile-page {
        padding: 0.5rem;
      }

      .profile-content {
        padding: 1rem;
      }

      .profile-header {
        padding: 0.75rem 1rem;
      }

      .profile-header h1 {
        font-size: 1.25rem;
      }

      .stat-item {
        min-width: 100%;
      }
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
      color: white;
    }

    .stat-label {
      display: block;
      font-size: 0.875rem;
      color: rgba(255, 255, 255, 0.95);
      font-weight: 500;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
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

    .show-mcp-guide-btn {
      background: #10b981;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-size: 0.875rem;
      margin-left: 0.5rem;
      transition: all 0.2s;
    }

    .show-mcp-guide-btn:hover {
      background: #059669;
      transform: translateY(-1px);
    }

    .profile-posts-section {
      margin-bottom: 2rem;
    }

    .profile-posts-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .profile-posts-header h3 {
      color: #374151;
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0;
    }

    .posts-count {
      color: #6b7280;
      font-size: 0.875rem;
    }

    .profile-posts-grid {
      display: grid;
      gap: 1.5rem;
    }

    .profile-posts-empty {
      text-align: center;
      padding: 3rem 1rem;
      background: #f9fafb;
      border-radius: 0.75rem;
      border: 2px dashed #d1d5db;
    }

    .empty-posts-content {
      max-width: 400px;
      margin: 0 auto;
    }

    .empty-posts-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .empty-posts-content h3 {
      color: #374151;
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0 0 0.5rem 0;
    }

    .empty-posts-content p {
      color: #6b7280;
      margin: 0;
      line-height: 1.5;
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

    .posts-loading {
      text-align: center;
      padding: 2rem;
      color: #6b7280;
    }

    .posts-error {
      text-align: center;
      padding: 2rem;
      color: #dc2626;
    }

    .retry-posts-btn {
      background: #667eea;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      cursor: pointer;
      margin-top: 1rem;
    }
  `;
  
  if (!document.head.querySelector('#profile-page-styles')) {
    style.id = 'profile-page-styles';
    document.head.appendChild(style);
  }
  
  let profileUser: User | null = null;
  let followStats = { followers: 0, following: 0, posts: 0 };
  let mcpServerCount = 0;
  let miniApps: MiniApp[] = [];
  let activeTab: 'posts' | 'mini-apps' | 'mcp-servers' | 'itineraries' = 'posts';
  let isFollowing = false;
  let isOwnProfile = false;
  let isLoading = false;
  let postsLoading = false;
  let showMCPGuide = false;
  let userPosts: Post[] = [];
  
  async function loadProfileData() {
    isLoading = true;
    const authState = authManager.getAuthState();
    
    // Determine the target user ID
    let targetUserId = viewUserId;
    
    // If no viewUserId is provided, use the current authenticated user's ID
    if (!targetUserId && authState.isAuthenticated && authState.currentUser) {
      targetUserId = authState.currentUser.id;
    }
    
    // Check if targetUserId exists and is valid before UUID validation
    if (!targetUserId) {
      console.error('No target user ID provided');
      isLoading = false;
      renderErrorState('No user specified. Please check the URL and try again.');
      return;
    }
    
    // Validate targetUserId is a proper UUID before querying
    if (!isValidUUID(targetUserId)) {
      console.error('Invalid UUID format:', targetUserId);
      isLoading = false;
      renderErrorState('Invalid user ID format. Please check the URL and try again.');
      return;
    }
    
    if (authState.loading) {
      renderLoadingState();
      return;
    }
    
    if (!authState.isAuthenticated || !authState.currentUser) {
      isLoading = false;
      renderErrorState('Please log in to view profiles.');
      return;
    }
    
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
      
      // Load follow statistics and posts count
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
      
      // Load user posts
      await loadUserPosts(targetUserId);
      
      renderProfilePage();
    } catch (error) {
      console.error('Error loading profile:', error);
      isLoading = false;
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
      
      // Get posts count
      const { count: postsCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      
      followStats = {
        followers: followersCount || 0,
        following: followingCount || 0,
        posts: postsCount || 0
      };
    } catch (error) {
      console.error('Error loading follow stats:', error);
      followStats = { followers: 0, following: 0, posts: 0 };
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
    console.log('🔄 Loading mini apps for user:', userId);
    try {
      const { data, error } = await supabase
        .from('mini_apps')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Error loading mini apps:', error);
        throw error;
      }
      
      console.log('✅ Mini apps loaded successfully:', data?.length || 0, 'apps found');
      console.log('📱 Mini apps data:', data);
      
      miniApps = data || [];
    } catch (error) {
      console.error('❌ Error loading mini apps:', error);
      miniApps = [];
    }
  }
  
  async function loadUserPosts(userId: string) {
    postsLoading = true;
    renderProfilePage(); // Re-render to show loading state
    
    try {
      const authState = authManager.getAuthState();
      
      // Get user's posts with user profiles and comments
      const { data: posts, error } = await supabase
        .from('posts')
        .select(`
          *,
          user:profiles(*),
          comments(
            *,
            user:profiles(*)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // If current user is authenticated, check which posts they've liked
      if (authState.isAuthenticated && authState.currentUser) {
        const { data: likes } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', authState.currentUser.id);

        const likedPostIds = new Set(likes?.map(like => like.post_id) || []);

        userPosts = posts.map(post => ({
          ...post,
          user_has_liked: likedPostIds.has(post.id)
        }));
      } else {
        userPosts = posts.map(post => ({
          ...post,
          user_has_liked: false
        }));
      }
      
    } catch (error) {
      console.error('Error loading user posts:', error);
      userPosts = [];
    } finally {
      postsLoading = false;
      renderProfilePage();
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
  
  async function handleLike(postId: string) {
    const authState = authManager.getAuthState();
    if (!authState.isAuthenticated || !authState.currentUser) return;
    
    try {
      const post = userPosts.find(p => p.id === postId);
      if (!post) return;

      if (post.user_has_liked) {
        // Unlike the post
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', authState.currentUser.id);
        
        post.user_has_liked = false;
        post.likes_count = Math.max(0, post.likes_count - 1);
      } else {
        // Like the post
        await supabase
          .from('post_likes')
          .insert({
            post_id: postId,
            user_id: authState.currentUser.id
          });
        
        post.user_has_liked = true;
        post.likes_count = post.likes_count + 1;
      }
      
      renderProfilePage();
    } catch (error) {
      console.error('Error handling like:', error);
    }
  }

  async function handleComment(postId: string, commentText: string) {
    const authState = authManager.getAuthState();
    if (!authState.isAuthenticated || !authState.currentUser) return;
    
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: authState.currentUser.id,
          content: commentText
        })
        .select(`
          *,
          user:profiles(*)
        `)
        .single();

      if (error) throw error;

      const post = userPosts.find(p => p.id === postId);
      if (post) {
        if (!post.comments) post.comments = [];
        post.comments.push(data);
        renderProfilePage();
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  }

  async function handleFollow(userId: string) {
    const authState = authManager.getAuthState();
    if (!authState.isAuthenticated || !authState.currentUser) return;
    
    try {
      await supabase
        .from('follows')
        .insert({
          follower_id: authState.currentUser.id,
          following_id: userId
        });
    } catch (error) {
      console.error('Error following user:', error);
    }
  }

  async function handleUnfollow(userId: string) {
    const authState = authManager.getAuthState();
    if (!authState.isAuthenticated || !authState.currentUser) return;
    
    try {
      await supabase
        .from('follows')
        .delete()
        .eq('follower_id', authState.currentUser.id)
        .eq('following_id', userId);
    } catch (error) {
      console.error('Error unfollowing user:', error);
    }
  }

  async function handleDeletePost(postId: string) {
    const authState = authManager.getAuthState();
    if (!authState.isAuthenticated || !authState.currentUser) return;
    
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', authState.currentUser.id); // Ensure user can only delete their own posts
      
      if (error) throw error;
      
      // Remove post from local state
      userPosts = userPosts.filter(post => post.id !== postId);
      
      // Update posts count
      followStats.posts = Math.max(0, followStats.posts - 1);
      
      renderProfilePage();
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post. Please try again.');
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
          ` : `${authState.isAuthenticated ? `
            <button class="ask-ai-about-user-btn" title="Ask AI about ${profileUser.name}">
              <span class="ai-icon">🤖</span>
              <span class="ai-text">Ask AI</span>
            </button>
          ` : ''}
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
              <button class="stat-item posts-btn">
                <span class="stat-number">${followStats.posts}</span>
                <span class="stat-label">Posts</span>
              </button>
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
            
            <!-- Itineraries Section -->
            <div class="profile-section" id="itineraries-section"></div>
            
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
                <button class="show-mcp-guide-btn">
                  📖 Testing Guide
                </button>
              </div>
            ` : ''}
            
            ${showMCPGuide && isOwnProfile ? `
              <div id="mcp-guide-container"></div>
            ` : ''}
            
            <!-- Posts Section -->
            <div class="profile-posts-section">
              <div class="profile-posts-header">
                <h3>${isOwnProfile ? 'Your Posts' : `${profileUser.name}'s Posts`}</h3>
                <span class="posts-count">${followStats.posts} post${followStats.posts === 1 ? '' : 's'}</span>
              </div>
              
              ${postsLoading ? `
                <div class="posts-loading">
                  <div class="loading-spinner">Loading posts...</div>
                </div>
              ` : userPosts.length === 0 ? `
                <div class="profile-posts-empty">
                  <div class="empty-posts-content">
                    <div class="empty-posts-icon">📝</div>
                    <h3>${isOwnProfile ? 'No posts yet' : `${profileUser.name} hasn't posted yet`}</h3>
                    <p>${isOwnProfile ? 'Share your first travel adventure!' : 'Check back later for new posts.'}</p>
                  </div>
                </div>
              ` : `
                <div class="profile-posts-grid">
                  ${userPosts.map(post => createPostCardHTML(post)).join('')}
                </div>
              `}
            </div>
            
            <div class="profile-field">
              <label>Member Since</label>
              <div class="profile-value">${formatDate(profileUser.created_at)}</div>
            </div>
            
            <div class="tab-pane ${activeTab === 'itineraries' ? 'active' : ''}" id="itineraries-tab">
              <div id="itineraries-container"></div>
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
    
    // Add MCP guide if needed
    if (showMCPGuide && isOwnProfile) {
      const guideContainer = container.querySelector('#mcp-guide-container');
      if (guideContainer) {
        const mcpGuide = createMCPTestGuide();
        guideContainer.appendChild(mcpGuide);
      }
    }
    
    // Render itineraries section
    renderItinerariesSection();
    // Render itineraries tab content
    if (activeTab === 'itineraries') {
      const itinerariesContainer = document.getElementById('itineraries-container');
          undefined, // No onLike handler needed, handled internally
        itinerariesContainer.innerHTML = '';
        const itineraryList = createItineraryList(
          profileUser.id,
          (itineraryId) => {
            if (onViewItinerary) {
              onViewItinerary(itineraryId);
            }
          }
        );
        itinerariesContainer.appendChild(itineraryList);
      }
    }
    
    
    setupEventListeners();
  }
  
  function renderItinerariesSection() {
    const itinerariesSection = document.getElementById('itineraries-section');
    if (!itinerariesSection) return;
    
    const itineraryList = createItineraryList(
      profileUser!.id,
      (itineraryId) => {
        if (onViewItinerary) {
          onViewItinerary(itineraryId);
        }
      }
    );
    
    itinerariesSection.appendChild(itineraryList);
  }
  
  function createPostCardHTML(post: Post): string {
    // Create a temporary container to render the post card
    const tempContainer = document.createElement('div');
    const postCard = createPostCard(
      post,
      (postId) => handleLike(postId),
      (postId, comment) => handleComment(postId, comment),
      (userId) => handleFollow(userId),
      (userId) => handleUnfollow(userId),
      false, // Don't show follow button in profile
      onUserClick,
      isOwnProfile, // Pass whether this is own profile
      (postId) => handleDeletePost(postId), // Pass delete handler
      onAskAI // Pass Ask AI handler
    );
    tempContainer.appendChild(postCard);
    return tempContainer.innerHTML;
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

    // Ask AI about user button
    if (!isOwnProfile && authState.isAuthenticated && onAskAIAboutUser) {
      const askAIBtn = container.querySelector('.ask-ai-about-user-btn') as HTMLButtonElement;
      if (askAIBtn) {
        askAIBtn.addEventListener('click', () => {
          onAskAIAboutUser(profileUser!.id, profileUser!.name);
        });
      }
    }
    
    // Follow stats navigation
    const followersBtn = container.querySelector('.followers-btn') as HTMLButtonElement;
    const followingBtn = container.querySelector('.following-btn') as HTMLButtonElement;
    
    if (followersBtn && onNavigateToFollowers) {
      followersBtn.addEventListener('click', (e) => {
        e.preventDefault();
        onNavigateToFollowers(profileUser!.id, profileUser!.name);
      });
    }
    
    if (followingBtn && onNavigateToFollowing) {
      followingBtn.addEventListener('click', (e) => {
        e.preventDefault();
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
      const showMcpGuideBtn = container.querySelector('.show-mcp-guide-btn') as HTMLButtonElement;
      const manageAppsBtn = container.querySelector('.manage-apps-btn') as HTMLButtonElement;
      const addFirstAppBtn = container.querySelector('.add-first-app-btn') as HTMLButtonElement;
      
      mcpServersBtn?.addEventListener('click', showMCPManager);
      manageMcpBtn?.addEventListener('click', showMCPManager);
      manageAppsBtn?.addEventListener('click', showMiniAppManager);
      addFirstAppBtn?.addEventListener('click', showMiniAppManager);
      
      showMcpGuideBtn?.addEventListener('click', () => {
        showMCPGuide = !showMCPGuide;
        renderProfilePage();
      });
      
      // Edit profile functionality
      setupEditProfileFunctionality();
    }
    
    // Mini app launch buttons
    const launchBtns = container.querySelectorAll('.mini-app-launch') as NodeListOf<HTMLButtonElement>;
    launchBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const appId = btn.dataset.appId!;
        const app = miniApps.find(a => a.id === appId);
        console.log('🚀 Launch button clicked for app:', appId);
        console.log('📱 App data:', app);
        if (app) {
          showMiniAppViewer(app);
        } else {
          console.error('❌ App not found for ID:', appId);
        }
      });
    });
    
    // Re-attach post card event listeners
    setupPostCardListeners();
  }
  
  function setupPostCardListeners() {
    // Re-attach event listeners for post cards since they're rendered as HTML strings
    const postCards = container.querySelectorAll('.post-card');
    postCards.forEach((card, index) => {
      const post = userPosts[index];
      if (!post) return;
      
      // Like button
      const likeBtn = card.querySelector('.like-btn') as HTMLButtonElement;
      if (likeBtn) {
        likeBtn.addEventListener('click', () => handleLike(post.id));
      }
      
      // Ask AI button
      const askAIBtn = card.querySelector('.ask-ai-btn') as HTMLButtonElement;
      if (askAIBtn && onAskAI) {
        askAIBtn.addEventListener('click', () => onAskAI(post));
      }
      
      // Comment functionality
      const commentInput = card.querySelector('.comment-input') as HTMLInputElement;
      const commentSubmitBtn = card.querySelector('.comment-submit-btn') as HTMLButtonElement;
      
      if (commentInput && commentSubmitBtn) {
        commentInput.addEventListener('input', () => {
          commentSubmitBtn.disabled = commentInput.value.trim().length === 0;
        });
        
        commentInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter' && commentInput.value.trim()) {
            const commentText = commentInput.value.trim();
            handleComment(post.id, commentText);
            commentInput.value = '';
            commentSubmitBtn.disabled = true;
          }
        });
        
        commentSubmitBtn.addEventListener('click', () => {
          const commentText = commentInput.value.trim();
          if (commentText) {
            handleComment(post.id, commentText);
            commentInput.value = '';
            commentSubmitBtn.disabled = true;
          }
        });
      }
      
      // Delete button (only for own posts)
      const deleteBtn = card.querySelector('.delete-post-btn') as HTMLButtonElement;
      if (deleteBtn) {
        deleteBtn.addEventListener('click', () => handleDeletePost(post.id));
      }
      
      // User click handlers for comments
      const userClickables = card.querySelectorAll('[data-user-id]');
      userClickables.forEach(element => {
        element.addEventListener('click', () => {
          const userId = element.getAttribute('data-user-id');
          if (userId && onUserClick) {
            onUserClick(userId);
          }
        });
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
    console.log('🔧 Opening Mini App Manager...');
    const miniAppManager = createMiniAppManager(() => {
      console.log('🔄 Mini App Manager closing - refreshing mini apps...');
      // Close mini app manager and refresh apps
      const appModal = document.querySelector('.mini-app-manager-modal');
      if (appModal) {
        appModal.remove();
        document.body.style.overflow = '';
      }
      
      // Refresh mini apps
      if (profileUser) {
        console.log('🔄 Reloading mini apps for user:', profileUser.id);
        loadMiniApps(profileUser.id).then(() => {
          console.log('✅ Mini apps reloaded, re-rendering profile page...');
          renderProfilePage();
        });
      }
    });
    
    console.log('📱 Appending mini app manager to body...');
    document.body.appendChild(miniAppManager);
    document.body.style.overflow = 'hidden';
  }
  
  function showMiniAppViewer(app: MiniApp) {
    console.log('🎬 Opening Mini App Viewer for app:', app.name);
    console.log('🔗 App URL:', app.app_url);
    
    const viewer = createMiniAppViewer(app, () => {
      console.log('🔄 Mini App Viewer closing...');
      const viewerModal = document.querySelector('.mini-app-viewer-modal');
      if (viewerModal) {
        viewerModal.remove();
        document.body.style.overflow = '';
      }
    });
    
    console.log('📱 Appending mini app viewer to body...');
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
        <div class="loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    `;
  }
  
  function renderErrorState(message: string) {
    console.error('Profile page error:', message);
    container.innerHTML = `
      <div class="profile-error">
        <div class="error-icon">⚠️</div>
        <p>${message}</p>
        <button class="back-btn">Go Back</button>
      </div>
    `;
    
    const backBtn = container.querySelector('.back-btn') as HTMLButtonElement;
    if (backBtn && typeof onNavigateBack === 'function') {
      backBtn.addEventListener('click', onNavigateBack);
    }
  }
  
  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
  }
  
  // Listen for itinerary view events
  container.addEventListener('view-itinerary', (e: any) => {
    const itineraryId = e.detail.itineraryId;
    // This will be handled by the parent component
    // which will navigate to the itinerary detail page
  });
  
  // Initial load
  loadProfileData();
  
  // Listen for auth changes
  authManager.onAuthChange(() => {
    loadProfileData();
  });
  
  return container;
}