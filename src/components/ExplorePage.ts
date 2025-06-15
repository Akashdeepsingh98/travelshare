import { Post } from '../types';
import { authManager } from '../auth';
import { supabase } from '../lib/supabase';

export function createExplorePage(
  onPostSelect: (post: Post, allPosts: Post[]) => void,
  onNavigateBack: () => void
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'explore-page';
  
  let allPosts: Post[] = [];
  let isLoading = false;
  
  async function loadExplorePosts() {
    if (isLoading) return;
    isLoading = true;
    
    try {
      const authState = authManager.getAuthState();
      
      // Get all posts with user profiles and comments
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
        .order('created_at', { ascending: false });

      if (error) throw error;

      // If user is authenticated, check which posts they've liked
      if (authState.isAuthenticated && authState.currentUser) {
        const { data: likes } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', authState.currentUser.id);

        const likedPostIds = new Set(likes?.map(like => like.post_id) || []);

        allPosts = posts.map(post => ({
          ...post,
          user_has_liked: likedPostIds.has(post.id)
        }));
      } else {
        allPosts = posts.map(post => ({
          ...post,
          user_has_liked: false
        }));
      }

      renderExplorePage();
    } catch (error) {
      console.error('Error loading explore posts:', error);
      renderErrorState();
    } finally {
      isLoading = false;
    }
  }
  
  function renderExplorePage() {
    container.innerHTML = `
      <div class="explore-content">
        <div class="explore-header">
          <h2>Explore</h2>
          <p class="explore-subtitle">Discover amazing travel experiences from around the world</p>
        </div>
        
        <div class="posts-grid">
          ${allPosts.map(post => createPostGridItem(post)).join('')}
        </div>
      </div>
    `;
    
    // Add click handlers for grid items
    const gridItems = container.querySelectorAll('.post-grid-item');
    gridItems.forEach((item, index) => {
      item.addEventListener('click', () => {
        onPostSelect(allPosts[index], allPosts);
      });
    });
  }
  
  function createPostGridItem(post: Post): string {
    const userAvatarUrl = post.user?.avatar_url || 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop';
    const userName = post.user?.name || 'Unknown User';
    
    return `
      <div class="post-grid-item" data-post-id="${post.id}">
        <div class="grid-item-image">
          <img src="${post.image_url}" alt="Travel photo" loading="lazy">
          <div class="grid-item-overlay">
            <div class="grid-item-stats">
              <span class="stat-item">
                <span class="stat-icon">❤️</span>
                <span class="stat-count">${post.likes_count || 0}</span>
              </span>
              <span class="stat-item">
                <span class="stat-icon">💬</span>
                <span class="stat-count">${post.comments?.length || 0}</span>
              </span>
            </div>
          </div>
        </div>
        
        <div class="grid-item-info">
          <div class="grid-item-user">
            <img src="${userAvatarUrl}" alt="${userName}" class="grid-user-avatar">
            <div class="grid-user-details">
              <span class="grid-user-name">${userName}</span>
              <span class="grid-location">📍 ${post.location}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  function renderLoadingState() {
    container.innerHTML = `
      <div class="explore-content">
        <div class="explore-header">
          <h2>Explore</h2>
          <p class="explore-subtitle">Discover amazing travel experiences from around the world</p>
        </div>
        
        <div class="explore-loading">
          <div class="loading-spinner">Loading amazing posts...</div>
        </div>
      </div>
    `;
  }
  
  function renderErrorState() {
    container.innerHTML = `
      <div class="explore-content">
        <div class="explore-header">
          <h2>Explore</h2>
          <p class="explore-subtitle">Discover amazing travel experiences from around the world</p>
        </div>
        
        <div class="explore-error">
          <p>Unable to load posts. Please try again.</p>
          <button class="retry-btn">Retry</button>
        </div>
      </div>
    `;
    
    const retryBtn = container.querySelector('.retry-btn') as HTMLButtonElement;
    retryBtn.addEventListener('click', loadExplorePosts);
  }
  
  // Initial render
  renderLoadingState();
  loadExplorePosts();
  
  return container;
}