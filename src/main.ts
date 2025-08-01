import './style.css';
import { authManager } from './auth';
import { createHeader } from './components/Header';
import { createPostForm } from './components/CreatePost';
import { createAuthModal } from './components/AuthModal';
import { createBoltBadge } from './components/BoltBadge';
import { createProfilePage } from './components/ProfilePage';
import { createExplorePage } from './components/ExplorePage';
import { createAIPage } from './components/AIPage';
import { createCommunitiesPage } from './components/CommunitiesPage';
import { createCommunityDetailPage } from './components/CommunityDetailPage';
import { createTravelGuidesPage } from './components/TravelGuidesPage';
import { createTravelGuideDetail } from './components/TravelGuideDetail';
import { createItineraryPage } from './components/ItineraryPage';
import { createDirectMessagesPage } from './components/DirectMessagesPage';
import { createPostHeatmapPage } from './components/PostHeatmapPage';
import { createAboutPage } from './components/AboutPage';
import { createPostViewer } from './components/PostViewer';
import { createSharePostModal } from './components/SharePostModal';
import { createShareToDMModal } from './components/ShareToDMModal';
import { createMCPManager } from './components/MCPManager';
import { createMiniAppManager } from './components/MiniAppManager';
import { createMiniAppViewer } from './components/MiniAppViewer';
import { createCreateCommunityModal } from './components/CreateCommunityModal';
import { supabase } from './lib/supabase';
import { Post, User } from './types';

// Main application container
const appContainer = document.getElementById('app') as HTMLElement;

// Current view state
let currentView: string = 'feed';
let currentUserId: string | null = null;
let currentPostId: string | null = null;
let currentCommunityId: string | null = null;
let currentGuideId: string | null = null;
let currentItineraryId: string | null = null;
let currentConversationId: string | null = null;

// Initialize the application
function initApp() {
  // Create and append the auth modal
  const authModal = createAuthModal();
  document.body.appendChild(authModal);

  // Create and append the Bolt badge
  const boltBadge = createBoltBadge();
  document.body.appendChild(boltBadge);

  // Parse the initial hash
  parseHash(false);

  // Listen for hash changes
  window.addEventListener('hashchange', () => parseHash(true));

  // Listen for auth changes
  authManager.onAuthChange(() => {
    renderApp(false);
  });

  // Initial render
  renderApp(false);
}

// Handle visibility change to detect when the app comes back into focus
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    console.log('App visibility restored - refreshing state');
    
    // Force a refresh of the app state
    renderApp(true);
    
    // Re-establish Supabase connection if needed
    const authState = authManager.getAuthState();
    if (authState.isAuthenticated) {
      // Refresh the current user data
      authManager.refreshCurrentUser();
      
      // Ping Supabase to ensure connection is active
      supabase.auth.getSession().catch(error => {
        console.warn('Error refreshing Supabase session:', error);
      });
    }
  }
});

// Parse the URL hash to determine the current view
function parseHash(fromHashChange: boolean = false) {
  const hash = window.location.hash.substring(1);
  
  if (!hash) {
    currentView = 'feed';
    currentUserId = null;
    currentPostId = null;
    currentCommunityId = null;
    currentGuideId = null;
    currentItineraryId = null;
    currentConversationId = null;
    renderApp(fromHashChange);
    return;
  }

  const parts = hash.split('/');
  const mainPart = parts[0];

  switch (mainPart) {
    case 'profile':
      currentView = 'profile';
      currentUserId = parts[1] || null;
      break;
    case 'post':
      currentView = 'post';
      currentPostId = parts[1] || null;
      break;
    case 'explore':
      currentView = 'explore';
      // Reset all IDs to ensure a fresh load
      currentUserId = null;
      currentPostId = null;
      currentCommunityId = null;
      currentGuideId = null;
      currentItineraryId = null;
      currentConversationId = null;
      break;
    case 'ai-chat':
      currentView = 'ai-chat';
      break;
    case 'communities':
      currentView = 'communities';
      currentCommunityId = parts[1] || null;
      break;
    case 'travel-guides':
      currentView = 'travel-guides';
      currentGuideId = parts[1] || null;
      break;
    case 'itineraries':
      currentView = 'itineraries';
      currentItineraryId = parts[1] || null;
      break;
    case 'messages':
      currentView = 'direct-messages';
      currentConversationId = parts[1] || null;
      break;
    case 'heatmap':
      currentView = 'heatmap';
      break;
    case 'about':
      currentView = 'about';
      break;
    default:
      currentView = 'feed';
      // Reset all IDs to ensure a fresh load for the feed view too
      currentUserId = null;
      currentPostId = null;
      currentCommunityId = null;
      currentGuideId = null;
      currentItineraryId = null;
      currentConversationId = null;
      break;
  }
  renderApp(fromHashChange);
}

// Navigate to a specific view
function navigateTo(view: string, id?: string, forceReload: boolean = false) {
  let hash = view;
  if (id) {
    hash += `/${id}`;
  }
  
  // Check if we're navigating to the same view
  const currentHash = window.location.hash.substring(1);
  const isSameView = currentHash === hash;
  
  // Update the hash (this will trigger hashchange event if hash is different)
  window.location.hash = hash;
  
  // If we're navigating to the same view and force reload is requested,
  // we need to manually trigger the render since hashchange won't fire
  if (isSameView && forceReload) {
    console.log('Force reloading same view:', view);
    renderApp(true);
  }
}

// Render the application based on the current view
async function renderApp(forceReload: boolean = false) {
  // Clear the app container
  appContainer.innerHTML = '';

  // Create and append the header
  const header = createHeader(
    () => navigateTo('profile'), // Profile click
    (forceReload) => navigateTo('explore', undefined, forceReload), // Explore click
    (forceReload) => navigateTo('feed', undefined, forceReload), // Home click
    () => navigateTo('ai-chat'), // AI chat click
    () => navigateTo('messages'), // Direct messages click
    () => navigateTo('communities'), // Communities click
    () => navigateTo('travel-guides'), // Travel guides click
    () => navigateTo('about'), // About click
    () => navigateTo('itineraries'), // Itineraries click
    currentView // Current view for highlighting active tab
  );
  appContainer.appendChild(header);

  // Create main content container
  const mainContent = document.createElement('div');
  mainContent.className = 'main-content';
  appContainer.appendChild(mainContent);

  // Render the appropriate view
  switch (currentView) {
    case 'feed':
      renderFeedPage(mainContent, forceReload);
      break;
    case 'profile':
      renderProfilePage(mainContent);
      break;
    case 'post':
      renderPostPage(mainContent);
      break;
    case 'explore':
      renderExplorePage(mainContent, forceReload);
      break;
    case 'ai-chat':
      renderAIChatPage(mainContent);
      break;
    case 'communities':
      renderCommunitiesPage(mainContent);
      break;
    case 'travel-guides':
      renderTravelGuidesPage(mainContent);
      break;
    case 'itineraries':
      renderItinerariesPage(mainContent);
      break;
    case 'direct-messages':
      renderDirectMessagesPage(mainContent);
      break;
    case 'heatmap':
      renderHeatmapPage(mainContent);
      break;
    case 'about':
      renderAboutPage(mainContent);
      break;
    default:
      renderFeedPage(mainContent);
      break;
  }
}

// Render the feed page
function renderFeedPage(container: HTMLElement, forceReload: boolean = false) {
  // Create post form
  const createPostSection = document.createElement('div');
  createPostSection.className = 'create-post-section';
  container.appendChild(createPostSection);

  const postForm = createPostForm(onPostCreate);
  createPostSection.appendChild(postForm);

  // Create posts feed container
  const postsFeedContainer = document.createElement('div');
  postsFeedContainer.className = 'posts-feed-container';
  container.appendChild(postsFeedContainer);

  // Load posts
  loadPosts(postsFeedContainer, undefined, forceReload);
}

// Load posts for the feed
async function loadPosts(container: HTMLElement, userId?: string, forceReload: boolean = false) {
  // Show loading state immediately
  container.innerHTML = `
    <div class="posts-loading">
      <div class="loading-spinner"></div>
      <p>Loading posts...</p>
    </div>
  `;
  
  console.log('Loading posts with forceReload:', forceReload);

  try {
    // Create a timeout promise that rejects after 30 seconds
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timed out after 30 seconds')), 30000);
    });

    // Build the query
    let query = supabase
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

    // If userId is provided, filter by that user
    if (userId) {
      query = query.eq('user_id', userId);
    }

    // Race the query against the timeout
    const result = await Promise.race([
      query,
      timeoutPromise
    ]);

    const { data: posts, error } = result;

    if (error) throw error;

    // Check if user has liked each post
    const authState = authManager.getAuthState();
    if (authState.isAuthenticated && authState.currentUser) {
      try {
        // Create a shorter timeout for the likes query
        const likesTimeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Likes query timed out')), 10000);
        });

        const likesResult = await Promise.race([
          supabase
            .from('post_likes')
            .select('post_id')
            .eq('user_id', authState.currentUser.id),
          likesTimeoutPromise
        ]);

        const { data: likes } = likesResult;
        const likedPostIds = new Set(likes?.map(like => like.post_id) || []);

        posts.forEach(post => {
          post.user_has_liked = likedPostIds.has(post.id);
        });
      } catch (likesError) {
        console.warn('Failed to load likes data:', likesError);
        // Continue without likes data
        posts.forEach(post => {
          post.user_has_liked = false;
        });
      }
    }

    // Render posts
    if (posts.length === 0) {
      container.innerHTML = `
        <div class="empty-feed">
          <div class="empty-feed-content">
            <div class="empty-feed-icon">📷</div>
            <h3>No posts yet</h3>
            <p>${userId ? 'This user hasn\'t shared any posts yet.' : 'Start sharing your travel adventures or follow other travelers to see their posts here!'}</p>
            ${!userId ? '<button class="explore-btn">Explore</button>' : ''}
          </div>
        </div>
      `;

      // Add event listener to explore button
      const exploreBtn = container.querySelector('.explore-btn');
      if (exploreBtn) {
        exploreBtn.addEventListener('click', () => navigateTo('explore'));
      }
    } else {
      container.innerHTML = '';
      
      // Import the createPostCard function dynamically to avoid circular dependencies
      const { createPostCard } = await import('./components/PostCard');
      
      posts.forEach(post => {
        const postCard = createPostCard(
          post,
          handleCommentPost, // Use the comment handler
          handleFollowUser,
          handleUnfollowUser,
          true, // Show follow button
          (userId) => navigateTo('profile', userId),
          userId === authManager.getAuthState().currentUser?.id,
          handleDeletePost,
          (post) => navigateTo('ai-chat'),
          (post) => handleSharePost(post)
        );
        
        // Listen for share-post event
        postCard.addEventListener('share-post', (e: any) => {
          const { postId, target } = e.detail;
          const post = posts.find(p => p.id === postId);
          if (post) {
            if (target === 'dm') {
              handleShareToDM(post);
            } else {
              handleSharePost(post);
            }
          }
        });
        
        container.appendChild(postCard);
      });

      // Add load more button if there are more than 10 posts
      if (posts.length > 10) {
        const loadMoreContainer = document.createElement('div');
        loadMoreContainer.className = 'load-more-container';
        loadMoreContainer.innerHTML = `
          <button class="load-more-btn">Load More</button>
        `;
        container.appendChild(loadMoreContainer);

        // Add event listener to load more button
        const loadMoreBtn = loadMoreContainer.querySelector('.load-more-btn');
        if (loadMoreBtn) {
          loadMoreBtn.addEventListener('click', () => {
            // Implement load more functionality
            loadMoreBtn.textContent = 'Loading...';
            // For now, just disable the button
            loadMoreBtn.setAttribute('disabled', 'true');
          });
        }
      }
    }
  } catch (error) {
    console.error('Error loading posts:', error);
    
    // Check if this is a CORS or network connectivity issue
    const isCorsOrNetworkError = error.message.includes('timed out') || 
                                 error.message.includes('Failed to fetch') ||
                                 error.message.includes('Network') ||
                                 error.name === 'TypeError';
    
    container.innerHTML = `
      <div class="error-message">
        <div class="error-content">
          <div class="error-icon">⚠️</div>
          <h3>${isCorsOrNetworkError ? 'Connection Error' : 'Error Loading Posts'}</h3>
          <p>${isCorsOrNetworkError 
              ? 'Unable to connect to the server. This is likely a CORS configuration issue. Please check the browser console for setup instructions.' 
              : 'We couldn\'t load the posts. Please try again.'}</p>
          ${isCorsOrNetworkError ? '<p><small>Check the browser console for detailed setup instructions.</small></p>' : ''}
          <button class="retry-btn">Retry</button>
        </div>
      </div>
    `;

    // Log CORS setup instructions if it's a network/CORS error
    if (isCorsOrNetworkError) {
      console.error('🚨 CORS Configuration Required');
      console.error('');
      console.error('This error indicates your Supabase project needs CORS configuration.');
      console.error('');
      console.error('📋 Steps to fix:');
      console.error('1. Go to https://supabase.com/dashboard');
      console.error('2. Select your project');
      console.error('3. Go to Settings → API');
      console.error('4. Under "Configuration", find "CORS"');
      console.error(`5. Add these URLs to allowed origins:`);
      console.error(`   - ${window.location.origin}`);
      console.error(`   - http://localhost:5173`);
      console.error(`   - https://localhost:5173`);
      console.error('6. Save changes and refresh this page');
      console.error('');
      console.error('📖 For detailed instructions, see CORS_SETUP_GUIDE.md');
    }

    // Add event listener to retry button
    const retryBtn = container.querySelector('.retry-btn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => loadPosts(container, userId));
    }
  }
}

// Render the profile page
function renderProfilePage(container: HTMLElement) {
  const authState = authManager.getAuthState();
  
  // If no specific user ID is provided, use the current authenticated user's ID
  let userId = currentUserId;
  if (!userId && authState.isAuthenticated && authState.currentUser) {
    userId = authState.currentUser.id;
  }

  if (!userId) {
    // If no userId and not authenticated, redirect to feed
    navigateTo('feed');
    return;
  }

  const profilePage = createProfilePage(
    () => navigateTo('feed'),
    (userId: string, userName: string) => {
      // Navigate to following page - implement if needed
      console.log('Navigate to following:', userId, userName);
    },
    (userId: string, userName: string) => {
      // Navigate to followers page - implement if needed
      console.log('Navigate to followers:', userId, userName);
    },
    userId, // viewUserId parameter
    (userId: string) => navigateTo('profile', userId),
    (post: Post) => navigateTo('ai-chat'),
    (userId: string, userName: string) => {
      // Ask AI about user - implement if needed
      console.log('Ask AI about user:', userId, userName);
    },
    (itineraryId: string) => navigateTo('itineraries', itineraryId),
  );

  container.appendChild(profilePage);
}

// Render the post page
async function renderPostPage(container: HTMLElement) {
  if (!currentPostId) {
    navigateTo('feed');
    return;
  }

  container.innerHTML = `
    <div class="posts-loading">
      <div class="loading-spinner"></div>
      <p>Loading post...</p>
    </div>
  `;

  try {
    const { data: post, error } = await supabase
      .from('posts')
      .select(`
        *,
        user:profiles(*),
        comments(
          *,
          user:profiles(*)
        )
      `)
      .eq('id', currentPostId)
      .single();

    if (error) throw error;

    // Check if user has liked the post
    const authState = authManager.getAuthState();
    if (authState.isAuthenticated && authState.currentUser) {
      const { data: like } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', authState.currentUser.id)
        .maybeSingle();

      post.user_has_liked = !!like;
    }

    // Create post viewer
    const postViewer = createPostViewer(
      post,
      [post], // Array with just this post
      () => navigateTo('feed'),
      handleCommentPost, // Use the comment handler
      handleFollowUser,
      handleUnfollowUser,
      (post) => navigateTo('ai-chat'),
      (post) => handleShareToDM(post)
    );

    container.innerHTML = '';
    container.appendChild(postViewer);
  } catch (error) {
    console.error('Error loading post:', error);
    container.innerHTML = `
      <div class="error-message">
        <div class="error-content">
          <div class="error-icon">⚠️</div>
          <h3>Error Loading Post</h3>
          <p>We couldn't load the post. It may have been deleted or you don't have permission to view it.</p>
          <button class="back-btn">Back to Feed</button>
        </div>
      </div>
    `;

    // Add event listener to back button
    const backBtn = container.querySelector('.back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => navigateTo('feed'));
    }
  }
}

// Render the explore page
function renderExplorePage(container: HTMLElement, forceReload: boolean = false) {
  const explorePage = createExplorePage(
    (post, allPosts) => handleViewPost(post.id, allPosts),
    () => navigateTo('feed'),
    (userId) => navigateTo('profile', userId),
    forceReload
  );

  container.appendChild(explorePage);
}

// Render the AI chat page
function renderAIChatPage(container: HTMLElement) {
  const aiPage = createAIPage(
    () => navigateTo('feed')
  );

  container.appendChild(aiPage);
}

// Render the communities page
function renderCommunitiesPage(container: HTMLElement) {
  if (currentCommunityId) {
    // Render community detail page
    const communityDetailPage = createCommunityDetailPage(
      currentCommunityId,
      () => navigateTo('communities'),
      (userId) => navigateTo('profile', userId)
    );
    container.appendChild(communityDetailPage);
  } else {
    // Render communities list page
    const communitiesPage = createCommunitiesPage(
      () => navigateTo('feed'),
      (communityId) => navigateTo('communities', communityId),
      () => {
        // Create and show community modal
        const modal = createCreateCommunityModal(
          () => {}, // onClose - no action needed
          () => {
            // Reload communities after successful creation
            renderApp();
          }
        );
        document.body.appendChild(modal);
      }
    );
    container.appendChild(communitiesPage);
  }
}

// Render the travel guides page
function renderTravelGuidesPage(container: HTMLElement) {
  if (currentGuideId) {
    // Render travel guide detail page
    const travelGuideDetail = createTravelGuideDetail(
      currentGuideId,
      () => navigateTo('travel-guides'),
      (post, allPosts) => handleViewPost(post.id, allPosts),
      (itineraryId) => navigateTo('itineraries', itineraryId),
      (userId) => navigateTo('profile', userId),
      (guideId) => {
        // Edit guide functionality
        console.log('Edit guide:', guideId);
      },
      (guideId) => {
        // Delete guide functionality
        console.log('Delete guide:', guideId);
        navigateTo('travel-guides');
      }
    );
    container.appendChild(travelGuideDetail);
  } else {
    // Render travel guides list page
    const travelGuidesPage = createTravelGuidesPage(
      () => navigateTo('feed'),
      (guideId) => navigateTo('travel-guides', guideId),
      (userId) => navigateTo('profile', userId)
    );
    container.appendChild(travelGuidesPage);
  }
}

// Render the itineraries page
function renderItinerariesPage(container: HTMLElement) {
  const itineraryPage = createItineraryPage(
    currentItineraryId,
    (userId) => userId ? navigateTo('profile', userId) : navigateTo('feed'),
    (userId) => navigateTo('profile', userId)
  );
  container.appendChild(itineraryPage);
}

// Render the direct messages page
function renderDirectMessagesPage(container: HTMLElement) {
  const directMessagesPage = createDirectMessagesPage(
    () => navigateTo('feed'),
    (userId) => navigateTo('profile', userId),
    (post) => handleSharePost(post),
    currentConversationId
  );
  container.appendChild(directMessagesPage);
}

// Render the heatmap page
function renderHeatmapPage(container: HTMLElement) {
  const heatmapPage = createPostHeatmapPage(
    () => navigateTo('feed'),
    (userId) => navigateTo('profile', userId)
  );
  container.appendChild(heatmapPage);
}

// Render the about page
function renderAboutPage(container: HTMLElement) {
  const aboutPage = createAboutPage(
    () => navigateTo('feed')
  );
  container.appendChild(aboutPage);
}

// Event handlers
function onPostCreate(post: Post) { 
  // Refresh the feed
  renderApp();
}

function handleCommentPost(postId: string, comment: string) {
  const authState = authManager.getAuthState();
  if (!authState.isAuthenticated) {
    const authModal = document.querySelector('.auth-modal') as HTMLElement;
    if (authModal) {
      authModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
    return;
  }

  // Add comment
  const userId = authState.currentUser!.id;
  
  supabase
    .from('comments')
    .insert({
      post_id: postId,
      user_id: userId,
      content: comment
    })
    .then(({ error }) => {
      if (error) {
        console.error('Error adding comment:', error);
        return;
      }
      
      // Refresh the view
      renderApp();
    });
}

function handleFollowUser(userId: string) {
  const authState = authManager.getAuthState();
  if (!authState.isAuthenticated) {
    const authModal = document.querySelector('.auth-modal') as HTMLElement;
    if (authModal) {
      authModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
    return;
  }

  // Follow user
  const currentUserId = authState.currentUser!.id;
  
  supabase
    .from('follows')
    .insert({
      follower_id: currentUserId,
      following_id: userId
    })
    .then(({ error }) => {
      if (error) {
        console.error('Error following user:', error);
        return;
      }
      
      // Refresh the view
      renderApp();
    });
}

function handleUnfollowUser(userId: string) {
  const authState = authManager.getAuthState();
  if (!authState.isAuthenticated) return;

  // Unfollow user
  const currentUserId = authState.currentUser!.id;
  
  supabase
    .from('follows')
    .delete()
    .eq('follower_id', currentUserId)
    .eq('following_id', userId)
    .then(({ error }) => {
      if (error) {
        console.error('Error unfollowing user:', error);
        return;
      }
      
      // Refresh the view
      renderApp();
    });
}

function handleDeletePost(postId: string) {
  if (confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
    supabase
      .from('posts')
      .delete()
      .eq('id', postId)
      .then(({ error }) => {
        if (error) {
          console.error('Error deleting post:', error);
          return;
        }
        
        // Refresh the view
        renderApp();
      });
  }
}

function handleViewPost(postId: string, allPosts?: Post[]) {
  navigateTo('post', postId);
}

function handleSharePost(post: Post) {
  const modal = createSharePostModal(
    post,
    () => {}, // onClose - no action needed
    () => {
      // Success callback
      alert('Post shared successfully!');
    }
  );
  document.body.appendChild(modal);
}

function handleShareToDM(post: Post) {
  const modal = createShareToDMModal(
    post,
    () => {}, // onClose - no action needed
    () => {
      // Success callback
      alert('Post shared in message!');
    }
  );
  document.body.appendChild(modal);
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);