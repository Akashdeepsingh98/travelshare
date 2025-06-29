import { User } from '../types';
import { authManager } from '../auth';
import { supabase } from '../lib/supabase';

export function createFollowingPage(
  userId: string,
  userName: string,
  onNavigateBack: () => void,
  onUserClick?: (userId: string) => void
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'following-page';
  
  let followingUsers: User[] = [];
  let userFollowStatus: { [key: string]: boolean } = {};
  let isLoading = false;
  
  async function loadFollowingUsers() {
    if (isLoading) return;
    isLoading = true;
    
    try {
      // Get users that this user is following
      const { data: follows, error } = await supabase
        .from('follows')
        .select(`
          following_id,
          following:profiles!follows_following_id_fkey(*)
        `)
        .eq('follower_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      followingUsers = follows?.map(follow => follow.following).filter(Boolean) || [];
      
      // Load current user's follow status for these users
      await loadCurrentUserFollowStatus();
      
      renderFollowingPage();
    } catch (error) {
      console.error('Error loading following users:', error);
      renderErrorState();
    } finally {
      isLoading = false;
    }
  }
  
  async function loadCurrentUserFollowStatus() {
    const authState = authManager.getAuthState();
    if (!authState.isAuthenticated || !authState.currentUser) return;
    
    try {
      const userIds = followingUsers.map(user => user.id);
      if (userIds.length === 0) return;
      
      const { data: follows } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', authState.currentUser.id)
        .in('following_id', userIds);
      
      userFollowStatus = {};
      follows?.forEach(follow => {
        userFollowStatus[follow.following_id] = true;
      });
    } catch (error) {
      console.error('Error loading follow status:', error);
    }
  }
  
  function renderFollowingPage() {
    container.innerHTML = `
      <div class="follow-page-header">
        <button class="back-btn">← Back</button>
        <h1>${userName}'s Following</h1>
        <div class="follow-count">${followingUsers.length} following</div>
      </div>
      
      <div class="follow-page-content">
        ${followingUsers.length === 0 ? `
          <div class="empty-follow-list">
            <div class="empty-follow-content">
              <div class="empty-follow-icon">👥</div>
              <h3>${userName} isn't following anyone yet</h3>
              <p>When they start following other travelers, you'll see them here.</p>
            </div>
          </div>
        ` : `
          <div class="users-list">
            ${followingUsers.map(user => createUserListItem(user)).join('')}
          </div>
        `}
      </div>
    `;
    
    // Event listeners
    const backBtn = container.querySelector('.back-btn') as HTMLButtonElement;
    backBtn.addEventListener('click', onNavigateBack);
    
    // User click handlers
    const userItems = container.querySelectorAll('.user-list-item');
    userItems.forEach((item, index) => {
      item.addEventListener('click', () => {
        if (onUserClick) {
          onUserClick(followingUsers[index].id);
        }
      });
    });
    
    // Follow button handlers
    const followBtns = container.querySelectorAll('.user-follow-btn');
    followBtns.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation(); // Prevent user click
        const targetUserId = (btn as HTMLButtonElement).dataset.userId!;
        await handleFollowToggle(targetUserId);
      });
    });
  }
  
  function createUserListItem(user: User): string {
    const authState = authManager.getAuthState();
    const currentUser = authState.currentUser;
    const isOwnProfile = currentUser?.id === user.id;
    const isFollowing = userFollowStatus[user.id] || false;
    const avatarUrl = user.avatar_url || 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop';
    
    return `
      <div class="user-list-item" data-user-id="${user.id}">
        <img src="${avatarUrl}" alt="${user.name}" class="user-list-avatar">
        <div class="user-list-info">
          <h3 class="user-list-name">${user.name}</h3>
          <p class="user-list-meta">Traveler</p>
        </div>
        ${!isOwnProfile && authState.isAuthenticated ? `
          <button class="user-follow-btn ${isFollowing ? 'following' : ''}" data-user-id="${user.id}">
            ${isFollowing ? 'Following' : 'Follow'}
          </button>
        ` : ''}
      </div>
    `;
  }
  
  async function handleFollowToggle(targetUserId: string) {
    const authState = authManager.getAuthState();
    if (!authState.isAuthenticated || !authState.currentUser) return;
    
    try {
      const isCurrentlyFollowing = userFollowStatus[targetUserId];
      
      if (isCurrentlyFollowing) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', authState.currentUser.id)
          .eq('following_id', targetUserId);
        
        userFollowStatus[targetUserId] = false;
      } else {
        await supabase
          .from('follows')
          .insert({
            follower_id: authState.currentUser.id,
            following_id: targetUserId
          });
        
        userFollowStatus[targetUserId] = true;
      }
      
      renderFollowingPage();
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  }
  
  function renderLoadingState() {
    container.innerHTML = `
      <div class="follow-page-header">
        <button class="back-btn">← Back</button>
        <h1>${userName}'s Following</h1>
        <div class="follow-count">Loading...</div>
      </div>
      
      <div class="follow-page-content">
        <div class="follow-loading">
          <div class="loading-spinner">Loading following list...</div>
        </div>
      </div>
    `;
    
    const backBtn = container.querySelector('.back-btn') as HTMLButtonElement;
    backBtn.addEventListener('click', onNavigateBack);
  }
  
  function renderErrorState() {
    container.innerHTML = `
      <div class="follow-page-header">
        <button class="back-btn">← Back</button>
        <h1>${userName}'s Following</h1>
        <div class="follow-count">Error</div>
      </div>
      
      <div class="follow-page-content">
        <div class="follow-error">
          <p>Unable to load following list. Please try again.</p>
          <button class="retry-btn">Retry</button>
        </div>
      </div>
    `;
    
    const backBtn = container.querySelector('.back-btn') as HTMLButtonElement;
    const retryBtn = container.querySelector('.retry-btn') as HTMLButtonElement;
    
    backBtn.addEventListener('click', onNavigateBack);
    retryBtn.addEventListener('click', loadFollowingUsers);
  }
  
  // Initial render
  renderLoadingState();
  loadFollowingUsers();
  
  return container;
}