import './style.css';
import { Post, Comment } from './types';
import { authManager } from './auth';
import { createHeader } from './components/Header';
import { createPostForm } from './components/CreatePost';
import { createPostCard } from './components/PostCard';
import { createAuthModal } from './components/AuthModal';
import { createProfilePage } from './components/ProfilePage';
import { createExplorePage } from './components/ExplorePage';
import { createPostViewer } from './components/PostViewer';
import { createFollowingPage } from './components/FollowingPage';
import { createFollowersPage } from './components/FollowersPage';
import { createAIPage } from './components/AIPage';
import { createItineraryPage } from './components/ItineraryPage';
import { createAboutPage } from './components/AboutPage';
import { createBoltBadge } from './components/BoltBadge';
import { createCommunitiesPage } from './components/CommunitiesPage';
import { createCommunityDetailPage } from './components/CommunityDetailPage';
import { createCreateCommunityModal } from './components/CreateCommunityModal';
import { createSharePostModal } from './components/SharePostModal';
import { createPostHeatmapPage } from './components/PostHeatmapPage';
import { formatItineraryAsPlainText } from './utils/formatters';
import { supabase } from './lib/supabase';
import { testSupabaseConnection, displayConnectionDiagnostics } from './utils/connection-test';

type AppView = 'feed' | 'profile' | 'explore' | 'post-viewer' | 'following' | 'followers' | 'ai-chat' | 'about' | 'communities' | 'community-detail' | 'itineraries' | 'itinerary-detail' | 'heatmap';

interface ViewData {
  userId?: string;
  userName?: string;
  communityId?: string;
  itineraryId?: string;
  locationQuery?: string;
}

class TravelSocialApp {
  private posts: Post[] = [];
  private appContainer: HTMLElement;
  private currentView: AppView = 'feed';
  private postViewerData: { post: Post; allPosts: Post[] } | null = null;
  private viewData: ViewData = {};
  private boltBadge: HTMLElement;
  private aiChatContextPost: Post | null = null;
  private aiChatUserContext: { id: string; name: string } | null = null;

  constructor() {
    this.appContainer = document.querySelector('#app')!;
    this.boltBadge = createBoltBadge();
    this.init();
  }

  private navigateToExplore(locationQuery?: string) {
    this.viewData = { locationQuery };
    this.currentView = 'explore';
    this.postViewerData = null;
    window.location.hash = 'explore';
    this.render();
  }

  private closePostViewer() {
    this.currentView = 'feed';
    this.postViewerData = null;
    this.render();
  }

  private async init() {
    try {
      // Test Supabase connection
      const connectionResult = await testSupabaseConnection();
      if (!connectionResult.success) {
        console.warn('Supabase connection failed:', connectionResult.error);
        console.warn('Connection details:', connectionResult.details);
        
        // Show user-friendly error message
        this.showConnectionError(connectionResult.error || 'Unknown connection error');
        
        // Continue with app initialization even if connection test fails
        // The auth manager will handle connection errors gracefully
      }
    } catch (error) {
      console.warn('Error testing Supabase connection:', error);
      // Continue with app initialization
    }
    
    // Set up auth state listener
    authManager.onAuthChange(() => {
      // Add error boundary around render
      try {
        this.render();
      } catch (renderError) {
        console.error('Error during render:', renderError);
        this.showRenderError(renderError);
      }
    });

    // Load initial data and render
    try {
      await this.loadPosts();
    } catch (error) {
      console.warn('Error loading initial posts:', error);
      // Continue with empty posts array
    }
    
    // Initial render with error boundary
    try {
      this.render();
    } catch (renderError) {
      console.error('Error during initial render:', renderError);
      this.showRenderError(renderError);
    }
    
    this.setupEventListeners();
  }

  private showRenderError(error: any) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'render-error';
    errorDiv.innerHTML = `
      <div class="error-content">
        <h3>⚠️ Rendering Error</h3>
        <p>There was an error displaying the application.</p>
        <details>
          <summary>Error Details</summary>
          <pre>${error instanceof Error ? error.message : String(error)}</pre>
        </details>
        <button onclick="window.location.reload()" class="retry-btn">Reload Application</button>
      </div>
    `;
    
    errorDiv.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      font-family: system-ui, -apple-system, sans-serif;
    `;
    
    const errorContent = errorDiv.querySelector('.error-content') as HTMLElement;
    if (errorContent) {
      errorContent.style.cssText = `
        background: #1a1a1a;
        padding: 2rem;
        border-radius: 8px;
        max-width: 500px;
        text-align: center;
      `;
    }
    
    document.body.appendChild(errorDiv);
  }

  private showConnectionError(errorMessage: string) {
    // Create a simple error display in the app container
    const errorDiv = document.createElement('div');
    errorDiv.className = 'connection-error';
    errorDiv.innerHTML = `
      <div class="error-content">
        <h3>🚨 Connection Issue</h3>
        <p>${errorMessage}</p>
        <div class="error-details">
          <p><strong>Most likely cause:</strong> CORS configuration needed</p>
          <ol>
            <li>Go to <a href="https://supabase.com/dashboard" target="_blank">Supabase Dashboard</a></li>
            <li>Select your project → Settings → API</li>
            <li>Add <code>${window.location.origin}</code> to CORS allowed origins</li>
            <li>Save and refresh this page</li>
          </ol>
        </div>
        <div class="error-actions">
          <button onclick="window.location.reload()" class="retry-btn">Retry Connection</button>
          <button onclick="this.parentElement.parentElement.parentElement.style.display='none'" class="dismiss-btn">Continue Anyway</button>
        </div>
      </div>
    `;
    
    // Add some basic styling
    errorDiv.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      font-family: system-ui, -apple-system, sans-serif;
    `;
    
    const errorContent = errorDiv.querySelector('.error-content') as HTMLElement;
    if (errorContent) {
      errorContent.style.cssText = `
        background: #1a1a1a;
        padding: 2rem;
        border-radius: 8px;
        max-width: 500px;
        text-align: center;
      `;
    }
    
    const buttons = errorDiv.querySelectorAll('button');
    buttons.forEach(btn => {
      (btn as HTMLElement).style.cssText = `
        background: #3b82f6;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
        margin: 0.5rem;
      `;
    });
    
    document.body.appendChild(errorDiv);
  }

  private async loadPosts() {
    try {
      const { data: posts, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (
            id,
            name,
            avatar_url
          ),
          post_likes (
            user_id
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      this.posts = posts || [];
    } catch (error) {
      console.error('Error loading posts:', error);
      this.posts = [];
    }
  }

  private setupEventListeners() {
    // Handle browser back/forward navigation
    window.addEventListener('hashchange', () => {
      this.handleHashChange();
    });

    // Handle initial hash
    this.handleHashChange();
  }

  private handleHashChange() {
    const hash = window.location.hash.slice(1);
    
    if (hash.startsWith('profile/')) {
      const userId = hash.split('/')[1];
      this.navigateToProfile(userId);
    } else if (hash === 'explore') {
      this.navigateToExplore();
    } else if (hash === 'communities') {
      this.navigateToCommunities();
    } else if (hash === 'ai-chat') {
      this.navigateToAIChat();
    } else if (hash === 'about') {
      this.navigateToAbout();
    } else if (hash === 'itineraries') {
      this.navigateToItineraries();
    } else if (hash === 'heatmap') {
      this.navigateToHeatmap();
    } else {
      this.navigateToFeed();
    }
  }

  private navigateToFeed() {
    this.currentView = 'feed';
    this.viewData = {};
    this.postViewerData = null;
    this.render();
  }

  private navigateToProfile(userId: string) {
    this.currentView = 'profile';
    this.viewData = { userId };
    this.postViewerData = null;
    this.render();
  }

  private navigateToCommunities() {
    this.currentView = 'communities';
    this.viewData = {};
    this.postViewerData = null;
    this.render();
  }

  private navigateToAIChat() {
    this.currentView = 'ai-chat';
    this.viewData = {};
    this.postViewerData = null;
    this.render();
  }

  private navigateToAbout() {
    this.currentView = 'about';
    this.viewData = {};
    this.postViewerData = null;
    this.render();
  }

  private navigateToItineraries() {
    this.currentView = 'itineraries';
    this.viewData = {};
    this.postViewerData = null;
    this.render();
  }

  private navigateToHeatmap() {
    this.currentView = 'heatmap';
    this.viewData = {};
    this.postViewerData = null;
    this.render();
  }

  private render() {
    this.appContainer.innerHTML = '';
    
    // Add header
    const header = createHeader({
      onNavigate: (view: string, data?: any) => {
        switch (view) {
          case 'feed':
            this.navigateToFeed();
            break;
          case 'profile':
            this.navigateToProfile(data?.userId || authManager.getCurrentUser()?.id);
            break;
          case 'explore':
            this.navigateToExplore(data?.locationQuery);
            break;
          case 'communities':
            this.navigateToCommunities();
            break;
          case 'ai-chat':
            this.navigateToAIChat();
            break;
          case 'about':
            this.navigateToAbout();
            break;
          case 'itineraries':
            this.navigateToItineraries();
            break;
          case 'heatmap':
            this.navigateToHeatmap();
            break;
        }
      },
      onAuthAction: (action: string) => {
        if (action === 'login' || action === 'signup') {
          const authModal = createAuthModal({
            mode: action as 'login' | 'signup',
            onClose: () => {
              document.body.removeChild(authModal);
            },
            onSuccess: () => {
              document.body.removeChild(authModal);
              this.render();
            }
          });
          document.body.appendChild(authModal);
        } else if (action === 'logout') {
          authManager.signOut();
        }
      }
    });
    
    this.appContainer.appendChild(header);

    // Add main content based on current view
    const mainContent = document.createElement('main');
    mainContent.className = 'main-content';

    switch (this.currentView) {
      case 'feed':
        this.renderFeed(mainContent);
        break;
      case 'profile':
        this.renderProfile(mainContent);
        break;
      case 'explore':
        this.renderExplore(mainContent);
        break;
      case 'post-viewer':
        this.renderPostViewer(mainContent);
        break;
      case 'following':
        this.renderFollowing(mainContent);
        break;
      case 'followers':
        this.renderFollowers(mainContent);
        break;
      case 'ai-chat':
        this.renderAIChat(mainContent);
        break;
      case 'about':
        this.renderAbout(mainContent);
        break;
      case 'communities':
        this.renderCommunities(mainContent);
        break;
      case 'community-detail':
        this.renderCommunityDetail(mainContent);
        break;
      case 'itineraries':
        this.renderItineraries(mainContent);
        break;
      case 'heatmap':
        this.renderHeatmap(mainContent);
        break;
    }

    this.appContainer.appendChild(mainContent);
    this.appContainer.appendChild(this.boltBadge);
  }

  private renderFeed(container: HTMLElement) {
    const user = authManager.getCurrentUser();
    
    if (user) {
      const postForm = createPostForm({
        onPostCreated: async (postData) => {
          await this.loadPosts();
          this.render();
        }
      });
      container.appendChild(postForm);
    }

    const postsContainer = document.createElement('div');
    postsContainer.className = 'posts-container';

    if (this.posts.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-state';
      emptyState.innerHTML = `
        <h3>No posts yet</h3>
        <p>Be the first to share your travel experience!</p>
      `;
      postsContainer.appendChild(emptyState);
    } else {
      this.posts.forEach(post => {
        const postCard = createPostCard({
          post,
          onLike: async () => {
            await this.loadPosts();
            this.render();
          },
          onComment: (post) => {
            this.postViewerData = { post, allPosts: this.posts };
            this.currentView = 'post-viewer';
            this.render();
          },
          onUserClick: (userId) => {
            this.navigateToProfile(userId);
          },
          onLocationClick: (location) => {
            this.navigateToExplore(location);
          }
        });
        postsContainer.appendChild(postCard);
      });
    }

    container.appendChild(postsContainer);
  }

  private renderProfile(container: HTMLElement) {
    const profilePage = createProfilePage({
      userId: this.viewData.userId,
      onNavigate: (view, data) => {
        if (view === 'following') {
          this.currentView = 'following';
          this.viewData = { userId: data.userId, userName: data.userName };
          this.render();
        } else if (view === 'followers') {
          this.currentView = 'followers';
          this.viewData = { userId: data.userId, userName: data.userName };
          this.render();
        }
      },
      onPostClick: (post) => {
        this.postViewerData = { post, allPosts: this.posts };
        this.currentView = 'post-viewer';
        this.render();
      },
      onLocationClick: (location) => {
        this.navigateToExplore(location);
      }
    });
    container.appendChild(profilePage);
  }

  private renderExplore(container: HTMLElement) {
    const explorePage = createExplorePage({
      locationQuery: this.viewData.locationQuery,
      onPostClick: (post) => {
        this.postViewerData = { post, allPosts: this.posts };
        this.currentView = 'post-viewer';
        this.render();
      },
      onUserClick: (userId) => {
        this.navigateToProfile(userId);
      },
      onLocationClick: (location) => {
        this.navigateToExplore(location);
      }
    });
    container.appendChild(explorePage);
  }

  private renderPostViewer(container: HTMLElement) {
    if (!this.postViewerData) return;
    
    const postViewer = createPostViewer({
      post: this.postViewerData.post,
      allPosts: this.postViewerData.allPosts,
      onClose: () => this.closePostViewer(),
      onUserClick: (userId) => {
        this.navigateToProfile(userId);
      },
      onLocationClick: (location) => {
        this.navigateToExplore(location);
      },
      onPostChange: async () => {
        await this.loadPosts();
        this.render();
      }
    });
    container.appendChild(postViewer);
  }

  private renderFollowing(container: HTMLElement) {
    const followingPage = createFollowingPage({
      userId: this.viewData.userId!,
      userName: this.viewData.userName!,
      onBack: () => {
        this.navigateToProfile(this.viewData.userId!);
      },
      onUserClick: (userId) => {
        this.navigateToProfile(userId);
      }
    });
    container.appendChild(followingPage);
  }

  private renderFollowers(container: HTMLElement) {
    const followersPage = createFollowersPage({
      userId: this.viewData.userId!,
      userName: this.viewData.userName!,
      onBack: () => {
        this.navigateToProfile(this.viewData.userId!);
      },
      onUserClick: (userId) => {
        this.navigateToProfile(userId);
      }
    });
    container.appendChild(followersPage);
  }

  private renderAIChat(container: HTMLElement) {
    const aiPage = createAIPage({
      contextPost: this.aiChatContextPost,
      userContext: this.aiChatUserContext,
      onNavigate: (view, data) => {
        if (view === 'itinerary-detail') {
          this.currentView = 'itinerary-detail';
          this.viewData = { itineraryId: data.itineraryId };
          this.render();
        }
      }
    });
    container.appendChild(aiPage);
  }

  private renderAbout(container: HTMLElement) {
    const aboutPage = createAboutPage();
    container.appendChild(aboutPage);
  }

  private renderCommunities(container: HTMLElement) {
    const communitiesPage = createCommunitiesPage({
      onCommunityClick: (communityId) => {
        this.currentView = 'community-detail';
        this.viewData = { communityId };
        this.render();
      },
      onCreateCommunity: () => {
        const modal = createCreateCommunityModal({
          onClose: () => document.body.removeChild(modal),
          onSuccess: () => {
            document.body.removeChild(modal);
            this.render();
          }
        });
        document.body.appendChild(modal);
      }
    });
    container.appendChild(communitiesPage);
  }

  private renderCommunityDetail(container: HTMLElement) {
    const communityDetailPage = createCommunityDetailPage({
      communityId: this.viewData.communityId!,
      onBack: () => {
        this.navigateToCommunities();
      },
      onPostClick: (post) => {
        this.postViewerData = { post, allPosts: this.posts };
        this.currentView = 'post-viewer';
        this.render();
      },
      onUserClick: (userId) => {
        this.navigateToProfile(userId);
      },
      onLocationClick: (location) => {
        this.navigateToExplore(location);
      },
      onSharePost: (post) => {
        const modal = createSharePostModal({
          post,
          communityId: this.viewData.communityId!,
          onClose: () => document.body.removeChild(modal),
          onSuccess: () => {
            document.body.removeChild(modal);
            this.render();
          }
        });
        document.body.appendChild(modal);
      }
    });
    container.appendChild(communityDetailPage);
  }

  private renderItineraries(container: HTMLElement) {
    const itineraryPage = createItineraryPage({
      onItineraryClick: (itineraryId) => {
        this.currentView = 'itinerary-detail';
        this.viewData = { itineraryId };
        this.render();
      }
    });
    container.appendChild(itineraryPage);
  }

  private renderHeatmap(container: HTMLElement) {
    const heatmapPage = createPostHeatmapPage({
      onLocationClick: (location) => {
        this.navigateToExplore(location);
      }
    });
    container.appendChild(heatmapPage);
  }
}

// Initialize the app
new TravelSocialApp();