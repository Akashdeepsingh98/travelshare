import { User } from '../types';
import { authManager } from '../auth';
import { supabase } from '../lib/supabase';

export function createProfilePage(
  onNavigateBack: () => void,
  onNavigateToFollowing?: (userId: string, userName: string) => void,
  onNavigateToFollowers?: (userId: string, userName: string) => void,
  viewUserId?: string // Optional: view another user's profile
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'profile-page';
  
  let profileUser: User | null = null;
  let followStats = { followers: 0, following: 0 };
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
            </div>
            
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
                    Change Photo
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
    
    // Edit profile functionality (only for own profile)
    if (isOwnProfile) {
      setupEditProfileFunctionality();
    }
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