import { Post, User } from '../types';
import { authManager } from '../auth';
import { supabase } from '../lib/supabase';
import { createPostCard } from './PostCard';
import { calculateDistance } from '../utils/geolocation';

export function createExplorePage(
  onUserClick?: (userId: string) => void,
  onAskAI?: (post: Post) => void
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'explore-page';
  
  let posts: Post[] = [];
  let profiles: User[] = [];
  let filteredPosts: Post[] = [];
  let filteredProfiles: User[] = [];
  let isLoading = false;
  let searchQuery = '';
  let userLocation: { latitude: number; longitude: number } | null = null;
  let nearbySearchEnabled = false;
  let selectedDistance = 10; // Default 10km
  
  // Add component styles
  const style = document.createElement('style');
  style.textContent = `
    .explore-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 2rem 1rem;
    }

    .explore-content {
      max-width: 800px;
      margin: 0 auto;
    }

    .explore-header {
      text-align: center;
      margin-bottom: 2rem;
      color: white;
    }

    .explore-header h1 {
      font-size: 2.5rem;
      font-weight: 700;
      margin: 0 0 0.5rem 0;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }

    .explore-header p {
      font-size: 1.125rem;
      opacity: 0.9;
      margin: 0;
    }

    .search-section {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: 1rem;
      padding: 1.5rem;
      margin-bottom: 2rem;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .search-input-container {
      position: relative;
      margin-bottom: 1rem;
    }

    .search-input {
      width: 100%;
      padding: 1rem 1rem 1rem 3rem;
      border: none;
      border-radius: 0.75rem;
      font-size: 1rem;
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(10px);
      transition: all 0.2s;
    }

    .search-input:focus {
      outline: none;
      background: white;
      box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.3);
    }

    .search-icon {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      color: #6b7280;
      font-size: 1.25rem;
    }

    .search-filters {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      align-items: center;
    }

    .location-filter {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(255, 255, 255, 0.2);
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      color: white;
    }

    .location-toggle {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
    }

    .location-toggle.active {
      color: #10b981;
    }

    .distance-selector {
      background: rgba(255, 255, 255, 0.9);
      border: none;
      padding: 0.5rem;
      border-radius: 0.5rem;
      font-size: 0.875rem;
    }

    .search-results {
      background: white;
      border-radius: 1rem;
      padding: 2rem;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    }

    .results-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .results-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: #374151;
      margin: 0;
    }

    .results-count {
      color: #6b7280;
      font-size: 0.875rem;
    }

    .results-tabs {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .tab-btn {
      background: none;
      border: none;
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
      color: #6b7280;
    }

    .tab-btn.active {
      background: #667eea;
      color: white;
    }

    .tab-btn:hover:not(.active) {
      background: #f3f4f6;
    }

    .posts-grid {
      display: grid;
      gap: 1.5rem;
    }

    .profiles-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1rem;
    }

    .profile-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 0.75rem;
      padding: 1.5rem;
      text-align: center;
      transition: all 0.2s;
      cursor: pointer;
    }

    .profile-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
      border-color: #667eea;
    }

    .profile-avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      object-fit: cover;
      margin: 0 auto 1rem auto;
      border: 3px solid #667eea;
    }

    .profile-name {
      font-size: 1.125rem;
      font-weight: 600;
      color: #374151;
      margin: 0 0 0.5rem 0;
    }

    .profile-stats {
      color: #6b7280;
      font-size: 0.875rem;
    }

    .loading-state, .empty-state, .error-state {
      text-align: center;
      padding: 3rem 1rem;
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e5e7eb;
      border-top: 3px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem auto;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .empty-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .empty-state h3 {
      color: #374151;
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0 0 0.5rem 0;
    }

    .empty-state p {
      color: #6b7280;
      margin: 0;
    }

    .error-state {
      color: #dc2626;
    }

    .retry-btn {
      background: #667eea;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 500;
      margin-top: 1rem;
      transition: all 0.2s;
    }

    .retry-btn:hover {
      background: #5a67d8;
      transform: translateY(-1px);
    }

    /* Responsive design */
    @media (max-width: 768px) {
      .explore-page {
        padding: 1rem;
      }

      .explore-header h1 {
        font-size: 2rem;
      }

      .search-section {
        padding: 1rem;
      }

      .search-filters {
        flex-direction: column;
        align-items: stretch;
      }

      .results-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }

      .results-tabs {
        overflow-x: auto;
        padding-bottom: 0.5rem;
      }

      .profiles-grid {
        grid-template-columns: 1fr;
      }
    }
  `;
  
  if (!document.head.querySelector('#explore-page-styles')) {
    style.id = 'explore-page-styles';
    document.head.appendChild(style);
  }
  
  let activeTab: 'posts' | 'profiles' = 'posts';
  
  async function loadPosts() {
    isLoading = true;
    renderExplorePage();
    
    try {
      const authState = authManager.getAuthState();
      
      // Get all posts with user profiles and comments
      const { data: postsData, error } = await supabase
        .from('posts')
        .select(`
          *,
          user:profiles(*),
          comments(
            *,
            user:profiles(*)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // If current user is authenticated, check which posts they've liked
      if (authState.isAuthenticated && authState.currentUser) {
        const { data: likes } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', authState.currentUser.id);

        const likedPostIds = new Set(likes?.map(like => like.post_id) || []);

        posts = postsData.map(post => ({
          ...post,
          user_has_liked: likedPostIds.has(post.id)
        }));
      } else {
        posts = postsData.map(post => ({
          ...post,
          user_has_liked: false
        }));
      }
      
      performSearch();
    } catch (error) {
      console.error('Error loading posts:', error);
      posts = [];
      filteredPosts = [];
    } finally {
      isLoading = false;
      renderExplorePage();
    }
  }
  
  async function searchProfiles(query: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('name', `%${query}%`)
        .limit(20);
      
      if (error) throw error;
      
      profiles = data || [];
      filteredProfiles = profiles;
    } catch (error) {
      console.error('Error searching profiles:', error);
      profiles = [];
      filteredProfiles = [];
    }
  }
  
  async function getUserLocation() {
    return new Promise<{ latitude: number; longitude: number } | null>((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }
  
  async function handleLike(postId: string) {
    const authState = authManager.getAuthState();
    if (!authState.isAuthenticated || !authState.currentUser) return;
    
    try {
      const post = posts.find(p => p.id === postId);
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
      
      // Update filtered posts as well
      const filteredPost = filteredPosts.find(p => p.id === postId);
      if (filteredPost) {
        filteredPost.user_has_liked = post.user_has_liked;
        filteredPost.likes_count = post.likes_count;
      }
      
      renderExplorePage();
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

      // Update both posts and filteredPosts
      [posts, filteredPosts].forEach(postArray => {
        const post = postArray.find(p => p.id === postId);
        if (post) {
          if (!post.comments) post.comments = [];
          post.comments.push(data);
        }
      });
      
      renderExplorePage();
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
  
  function performSearch() {
    const currentSearchQuery = searchQuery.toLowerCase().trim();
    let postsToFilter = [...posts];
    
    // Apply location filter first if enabled
    if (nearbySearchEnabled && userLocation) {
      postsToFilter = postsToFilter.filter(post => {
        if (!post.latitude || !post.longitude) return false;
        
        const distance = calculateDistance(
          userLocation!.latitude,
          userLocation!.longitude,
          post.latitude,
          post.longitude
        );
        
        return distance <= selectedDistance;
      });
    }
    
    // Apply text search filter for posts
    if (!currentSearchQuery) {
      filteredPosts = postsToFilter;
      filteredProfiles = [];
    } else {
      filteredPosts = postsToFilter.filter(post => {
        // Search in post content
        const contentMatch = post.content.toLowerCase().includes(currentSearchQuery);
        
        // Search in location
        const locationMatch = post.location.toLowerCase().includes(currentSearchQuery);
        
        // Search in user name
        const userMatch = post.user?.name.toLowerCase().includes(currentSearchQuery) || false;
        
        // Search for hashtags (words starting with #)
        const hashtagMatch = currentSearchQuery.startsWith('#') 
          ? post.content.toLowerCase().includes(currentSearchQuery)
          : false;
        
        // Search in comments
        const commentMatch = post.comments?.some(comment => 
          comment.content.toLowerCase().includes(currentSearchQuery) ||
          comment.user?.name.toLowerCase().includes(currentSearchQuery)
        ) || false;
        
        return contentMatch || locationMatch || userMatch || hashtagMatch || commentMatch;
      });
      
      // Search for profiles
      searchProfiles(currentSearchQuery);
    }
    
    renderExplorePage();
  }
  
  function renderExplorePage() {
    const authState = authManager.getAuthState();
    
    container.innerHTML = `
      <div class="explore-content">
        <div class="explore-header">
          <h1>Explore</h1>
          <p>Discover amazing travel experiences and connect with fellow travelers</p>
        </div>
        
        <div class="search-section">
          <div class="search-input-container">
            <span class="search-icon">🔍</span>
            <input 
              type="text" 
              class="search-input" 
              placeholder="Search posts, users, locations, or hashtags..."
              value="${searchQuery}"
            >
          </div>
          
          <div class="search-filters">
            <div class="location-filter">
              <button class="location-toggle ${nearbySearchEnabled ? 'active' : ''}">
                <span class="location-icon">${nearbySearchEnabled ? '📍' : '🌍'}</span>
                <span>${nearbySearchEnabled ? 'Nearby' : 'Enable Location'}</span>
              </button>
              ${nearbySearchEnabled ? `
                <select class="distance-selector">
                  <option value="5" ${selectedDistance === 5 ? 'selected' : ''}>5km</option>
                  <option value="10" ${selectedDistance === 10 ? 'selected' : ''}>10km</option>
                  <option value="25" ${selectedDistance === 25 ? 'selected' : ''}>25km</option>
                  <option value="50" ${selectedDistance === 50 ? 'selected' : ''}>50km</option>
                  <option value="100" ${selectedDistance === 100 ? 'selected' : ''}>100km</option>
                </select>
              ` : ''}
            </div>
          </div>
        </div>
        
        <div class="search-results">
          ${isLoading ? `
            <div class="loading-state">
              <div class="loading-spinner"></div>
              <p>Loading posts...</p>
            </div>
          ` : `
            <div class="results-header">
              <h2 class="results-title">
                ${searchQuery ? `Search Results` : 'Latest Posts'}
              </h2>
              <span class="results-count">
                ${searchQuery ? `${filteredPosts.length + filteredProfiles.length} results` : `${filteredPosts.length} posts`}
              </span>
            </div>
            
            ${searchQuery ? `
              <div class="results-tabs">
                <button class="tab-btn ${activeTab === 'posts' ? 'active' : ''}" data-tab="posts">
                  Posts (${filteredPosts.length})
                </button>
                <button class="tab-btn ${activeTab === 'profiles' ? 'active' : ''}" data-tab="profiles">
                  People (${filteredProfiles.length})
                </button>
              </div>
            ` : ''}
            
            <div class="results-content">
              ${activeTab === 'posts' ? renderPostsTab() : renderProfilesTab()}
            </div>
          `}
        </div>
      </div>
    `;
    
    setupEventListeners();
  }
  
  function renderPostsTab(): string {
    if (filteredPosts.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-icon">📝</div>
          <h3>${searchQuery ? 'No posts found' : 'No posts yet'}</h3>
          <p>${searchQuery ? 'Try adjusting your search terms' : 'Be the first to share your travel experience!'}</p>
        </div>
      `;
    }
    
    return `
      <div class="posts-grid">
        ${filteredPosts.map(post => createPostCardHTML(post)).join('')}
      </div>
    `;
  }
  
  function renderProfilesTab(): string {
    if (filteredProfiles.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-icon">👥</div>
          <h3>No people found</h3>
          <p>Try searching for different names or usernames</p>
        </div>
      `;
    }
    
    return `
      <div class="profiles-grid">
        ${filteredProfiles.map(profile => createProfileCardHTML(profile)).join('')}
      </div>
    `;
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
      true, // Show follow button
      onUserClick,
      false, // Not own profile
      undefined, // No delete handler
      onAskAI // Pass Ask AI handler
    );
    tempContainer.appendChild(postCard);
    return tempContainer.innerHTML;
  }
  
  function createProfileCardHTML(profile: User): string {
    const avatarUrl = profile.avatar_url || 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop';
    
    return `
      <div class="profile-card" data-user-id="${profile.id}">
        <img src="${avatarUrl}" alt="${profile.name}" class="profile-avatar">
        <h3 class="profile-name">${profile.name}</h3>
        <div class="profile-stats">
          Member since ${formatDate(profile.created_at)}
        </div>
      </div>
    `;
  }
  
  function setupEventListeners() {
    // Search input
    const searchInput = container.querySelector('.search-input') as HTMLInputElement;
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = (e.target as HTMLInputElement).value;
        performSearch();
      });
    }
    
    // Location toggle
    const locationToggle = container.querySelector('.location-toggle') as HTMLButtonElement;
    if (locationToggle) {
      locationToggle.addEventListener('click', async () => {
        if (!nearbySearchEnabled) {
          const location = await getUserLocation();
          if (location) {
            userLocation = location;
            nearbySearchEnabled = true;
            performSearch();
          } else {
            alert('Unable to get your location. Please enable location services and try again.');
          }
        } else {
          nearbySearchEnabled = false;
          userLocation = null;
          performSearch();
        }
      });
    }
    
    // Distance selector
    const distanceSelector = container.querySelector('.distance-selector') as HTMLSelectElement;
    if (distanceSelector) {
      distanceSelector.addEventListener('change', (e) => {
        selectedDistance = parseInt((e.target as HTMLSelectElement).value);
        performSearch();
      });
    }
    
    // Tab buttons
    const tabBtns = container.querySelectorAll('.tab-btn') as NodeListOf<HTMLButtonElement>;
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        activeTab = btn.dataset.tab as 'posts' | 'profiles';
        renderExplorePage();
      });
    });
    
    // Profile cards
    const profileCards = container.querySelectorAll('.profile-card') as NodeListOf<HTMLElement>;
    profileCards.forEach(card => {
      card.addEventListener('click', () => {
        const userId = card.dataset.userId!;
        if (onUserClick) {
          onUserClick(userId);
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
      const post = filteredPosts[index];
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
      
      // User click handlers
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
  
  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short' 
    });
  }
  
  // Initial load
  loadPosts();
  
  // Listen for auth changes
  authManager.onAuthChange(() => {
    loadPosts();
  });
  
  return container;
}