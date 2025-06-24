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
import { createAboutPage } from './components/AboutPage';
import { createBoltBadge } from './components/BoltBadge';
import { supabase } from './lib/supabase';
import { testSupabaseConnection, displayConnectionDiagnostics } from './utils/connection-test';

type AppView = 'feed' | 'profile' | 'explore' | 'post-viewer' | 'following' | 'followers' | 'ai-chat' | 'about';

interface ViewData {
  userId?: string;
  userName?: string;
}

class TravelSocialApp {
  private posts: Post[] = [];
  private appContainer: HTMLElement;
  private currentView: AppView = 'feed';
  private postViewerData: { post: Post; allPosts: Post[] } | null = null;
  private viewData: ViewData = {};
  private boltBadge: HTMLElement;
  private aiChatContextPost: Post | null = null;

  constructor() {
    this.appContainer = document.querySelector('#app')!;
    this.boltBadge = createBoltBadge();
    this.init();
  }

  private init() {
    this.setupAuthModal();
    this.setupBoltBadge();
    this.render();
    this.loadPosts();
    
    // Listen for auth changes to reload posts
    authManager.onAuthChange(() => {
      this.loadPosts();
    });
  }

  private setupAuthModal() {
    const authModal = createAuthModal();
    document.body.appendChild(authModal);
  }

  private setupBoltBadge() {
    document.body.appendChild(this.boltBadge);
  }

  private async loadPosts() {
    try {
      const authState = authManager.getAuthState();
      
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

      // If user is authenticated, load posts from followed users for home feed
      if (authState.isAuthenticated && authState.currentUser && this.currentView === 'feed') {
        // Get followed user IDs
        const { data: follows } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', authState.currentUser.id);

        const followedUserIds = follows?.map(f => f.following_id) || [];
        
        // Include user's own posts and followed users' posts
        const userIds = [authState.currentUser.id, ...followedUserIds];
        
        if (userIds.length > 0) {
          query = query.in('user_id', userIds);
        } else {
          // If not following anyone, show own posts only
          query = query.eq('user_id', authState.currentUser.id);
        }
      }

      const { data: posts, error } = await query;

      if (error) {
        console.error('Error fetching posts:', error);
        if (error.message && error.message.includes('Failed to fetch')) {
          await this.showConnectionError();
        } else {
          this.showGenericError('Failed to load posts. Please try refreshing the page.');
        }
        return;
      }

      // If user is authenticated, check which posts they've liked
      if (authState.isAuthenticated && authState.currentUser) {
        const { data: likes } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', authState.currentUser.id);

        const likedPostIds = new Set(likes?.map(like => like.post_id) || []);

        this.posts = posts.map(post => ({
          ...post,
          user_has_liked: likedPostIds.has(post.id)
        }));
      } else {
        this.posts = posts.map(post => ({
          ...post,
          user_has_liked: false
        }));
      }

      if (this.currentView === 'feed') {
        this.renderPosts();
      }
    } catch (error) {
      console.error('Error loading posts:', error);
      console.error('Error type:', typeof error);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      
      // Provide more specific error messages based on error type
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        await this.showConnectionError();
      } else {
        this.showGenericError('An unexpected error occurred while loading posts. Please try again.');
      }
    }
  }

  private async showConnectionError() {
    console.log('🔍 Analyzing connection issue...');
    
    // Run connection test
    let testResult;
    try {
      testResult = await testSupabaseConnection();
    } catch (error) {
      console.error('Failed to run connection test:', error);
    }

    const feedSection = document.querySelector('#posts-feed') as HTMLElement;
    if (feedSection) {
      feedSection.innerHTML = `
        <div class="error-message connection-error">
          <div class="error-content">
            <div class="error-icon">🚫</div>
            <h3>Connection Failed</h3>
            <p>Unable to connect to your Supabase project. This is most likely a <strong>CORS configuration issue</strong>.</p>
            
            <div class="cors-solution">
              <h4>🔧 Quick Fix (2 minutes):</h4>
              <ol>
                <li>Open <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer">Supabase Dashboard</a></li>
                <li>Select your project</li>
                <li>Go to <strong>Settings → API</strong></li>
                <li>Find <strong>CORS</strong> section</li>
                <li>Add <code>${window.location.origin}</code> to allowed origins
                  <br><small style="color: #666;">Current origin: <strong>${window.location.origin}</strong></small>
                  <br><small style="color: #666;">Also try adding: <code>http://localhost:5173</code> and <code>https://localhost:5173</code></small>
                </li>
                <li>Save and refresh this page</li>
              </ol>
            </div>
            
            <div class="quick-fixes">
              <h4>Other things to try:</h4>
              <ol>
                <li>Refresh the page (Ctrl+F5 or Cmd+Shift+R)</li>
                <li>Verify your Supabase project is active in the dashboard</li>
                <li>Check your internet connection</li>
                <li>Try disabling VPN if active</li>
              </ol>
            </div>
            ${displayConnectionDiagnostics()}
          </div>
        </div>
      `;
      
      // Add event listeners for diagnostic buttons
      const retryBtn = feedSection.querySelector('.retry-btn') as HTMLButtonElement;
      if (retryBtn) {
        retryBtn.addEventListener('click', () => this.loadPosts());
      }
      
      const testBtn = feedSection.querySelector('#run-connection-test') as HTMLButtonElement;
      if (testBtn) {
        testBtn.addEventListener('click', async () => {
          const resultsDiv = feedSection.querySelector('#test-results') as HTMLElement;
          resultsDiv.style.display = 'block';
          resultsDiv.innerHTML = '<p>Running connection test...</p>';
          
          try {
            const result = await testSupabaseConnection();
            resultsDiv.innerHTML = `
              <h4>Test Results:</h4>
              <p><strong>Status:</strong> ${result.success ? '✅ Success' : '❌ Failed'}</p>
              ${result.error ? `<p><strong>Error:</strong> ${result.error}</p>` : ''}
              <details>
                <summary>Technical Details</summary>
                <pre>${JSON.stringify(result.details, null, 2)}</pre>
              </details>
            `;
          } catch (error) {
            resultsDiv.innerHTML = `<p>❌ Test failed: ${error}</p>`;
          }
        });
      }
      
      const retryConnectionBtn = feedSection.querySelector('#retry-connection') as HTMLButtonElement;
      if (retryConnectionBtn) {
        retryConnectionBtn.addEventListener('click', () => {
          window.location.reload();
        });
      }
    }
  }

  private showGenericError(message: string) {
    const feedSection = document.querySelector('#posts-feed') as HTMLElement;
    if (feedSection) {
      feedSection.innerHTML = `
        <div class="error-message">
          <div class="error-content">
            <div class="error-icon">⚠️</div>
            <h3>Connection Error</h3>
            <p>${message.replace(/\n/g, '<br>')}</p>
            <button class="retry-btn">Try Again</button>
            <a href="https://supabase.com/docs/guides/api/cors" target="_blank" rel="noopener noreferrer" class="setup-guide-btn">
              View Setup Guide
            </a>
          </div>
        </div>
      `;
      
      const retryBtn = feedSection.querySelector('.retry-btn') as HTMLButtonElement;
      if (retryBtn) {
        retryBtn.addEventListener('click', () => this.loadPosts());
      }
    }
  }

  private navigateToProfile(userId?: string) {
    this.currentView = 'profile';
    this.viewData = { userId };
    this.aiChatContextPost = null;
    this.render();
  }

  private navigateToFeed() {
    this.currentView = 'feed';
    this.viewData = {};
    this.aiChatContextPost = null;
    this.render();
    this.loadPosts();
  }

  private navigateToExplore() {
    this.currentView = 'explore';
    this.viewData = {};
    this.aiChatContextPost = null;
    this.render();
  }

  private navigateToAIChat(postContext?: Post) {
    this.currentView = 'ai-chat';
    this.viewData = {};
    this.aiChatContextPost = postContext || null;
    this.render();
  }

  private navigateToAbout() {
    this.currentView = 'about';
    this.viewData = {};
    this.aiChatContextPost = null;
    this.render();
  }

  private navigateToFollowing(userId: string, userName: string) {
    this.currentView = 'following';
    this.viewData = { userId, userName };
    this.aiChatContextPost = null;
    this.render();
  }

  private navigateToFollowers(userId: string, userName: string) {
    this.currentView = 'followers';
    this.viewData = { userId, userName };
    this.aiChatContextPost = null;
    this.render();
  }

  private openPostViewer(post: Post, allPosts: Post[]) {
    this.currentView = 'post-viewer';
    this.postViewerData = { post, allPosts };
    this.render();
  }

  private closePostViewer() {
    this.currentView = 'explore';
    this.postViewerData = null;
    this.render();
  }

  private render() {
    this.appContainer.innerHTML = '';
    
    if (this.currentView === 'post-viewer' && this.postViewerData) {
      // Post viewer modal
      const postViewer = createPostViewer(
        this.postViewerData.post,
        this.postViewerData.allPosts,
        () => this.closePostViewer(),
        (postId) => this.handleLike(postId),
        (postId, comment) => this.handleComment(postId, comment),
        (userId) => this.handleFollow(userId),
        (userId) => this.handleUnfollow(userId),
        (post) => this.navigateToAIChat(post)
      );
      this.appContainer.appendChild(postViewer);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      
      if (this.currentView === 'about') {
        // About page
        const aboutPage = createAboutPage(() => this.navigateToFeed());
        this.appContainer.appendChild(aboutPage);
      } else if (this.currentView === 'ai-chat') {
        // AI Chat page
        const aiPage = createAIPage(() => this.navigateToFeed(), this.aiChatContextPost);
        this.appContainer.appendChild(aiPage);
      } else if (this.currentView === 'profile') {
        // Profile page
        const profilePage = createProfilePage(
          () => this.navigateToFeed(),
          (userId, userName) => this.navigateToFollowing(userId, userName),
          (userId, userName) => this.navigateToFollowers(userId, userName),
          this.viewData.userId, // Pass the userId to view another user's profile
          (userId) => this.navigateToProfile(userId) // Pass user click handler
        );
        this.appContainer.appendChild(profilePage);
      } else if (this.currentView === 'following') {
        // Following page
        const followingPage = createFollowingPage(
          this.viewData.userId!,
          this.viewData.userName!,
          () => this.navigateToProfile(this.viewData.userId),
          (userId) => this.navigateToProfile(userId) // Navigate to user profile when clicked
        );
        this.appContainer.appendChild(followingPage);
      } else if (this.currentView === 'followers') {
        // Followers page
        const followersPage = createFollowersPage(
          this.viewData.userId!,
          this.viewData.userName!,
          () => this.navigateToProfile(this.viewData.userId),
          (userId) => this.navigateToProfile(userId) // Navigate to user profile when clicked
        );
        this.appContainer.appendChild(followersPage);
      } else if (this.currentView === 'explore') {
        // Header
        const header = createHeader(
          () => this.navigateToProfile(),
          () => this.navigateToExplore(),
          () => this.navigateToFeed(),
          () => this.navigateToAIChat(),
          () => this.navigateToAbout(),
          this.currentView
        );
        this.appContainer.appendChild(header);
        
        // Explore page
        const explorePage = createExplorePage(
          (post, allPosts) => this.openPostViewer(post, allPosts),
          () => this.navigateToFeed(),
          (userId) => this.navigateToProfile(userId) // Navigate to user profile when clicked
        );
        this.appContainer.appendChild(explorePage);
      } else {
        // Feed page
        // Header
        const header = createHeader(
          () => this.navigateToProfile(),
          () => this.navigateToExplore(),
          () => this.navigateToFeed(),
          () => this.navigateToAIChat(),
          () => this.navigateToAbout(),
          this.currentView
        );
        this.appContainer.appendChild(header);
        
        // Main content
        const main = document.createElement('main');
        main.className = 'main-content';
        
        // Create post form
        const createPostSection = document.createElement('section');
        createPostSection.className = 'create-post-section';
        const postForm = createPostForm((post) => this.handleCreatePost(post));
        createPostSection.appendChild(postForm);
        main.appendChild(createPostSection);
        
        // Posts feed
        const feedSection = document.createElement('section');
        feedSection.className = 'posts-feed';
        feedSection.id = 'posts-feed';
        
        main.appendChild(feedSection);
        this.appContainer.appendChild(main);
        
        this.renderPosts();
      }
    }
  }

  private renderPosts() {
    const feedSection = document.querySelector('#posts-feed') as HTMLElement;
    if (!feedSection) return;

    feedSection.innerHTML = '';
    
    if (this.posts.length === 0) {
      const authState = authManager.getAuthState();
      if (authState.isAuthenticated) {
        feedSection.innerHTML = `
          <div class="empty-feed">
            <div class="empty-feed-content">
              <div class="empty-feed-icon">🌍</div>
              <h3>Your feed is empty</h3>
              <p>Follow other travelers to see their amazing adventures, or explore posts from around the world!</p>
              <button class="explore-btn">Explore Posts</button>
            </div>
          </div>
        `;
        
        const exploreBtn = feedSection.querySelector('.explore-btn') as HTMLButtonElement;
        exploreBtn.addEventListener('click', () => this.navigateToExplore());
      }
      return;
    }
    
    this.posts.forEach(post => {
      const postCard = createPostCard(
        post,
        (postId) => this.handleLike(postId),
        (postId, comment) => this.handleComment(postId, comment),
        (userId) => this.handleFollow(userId),
        (userId) => this.handleUnfollow(userId),
        true, // Show follow button in feed
        (userId) => this.navigateToProfile(userId), // Navigate to user profile when clicked
        false, // Not own profile
        undefined, // No delete handler in feed
        (post) => this.navigateToAIChat(post) // Navigate to AI chat with post context
      );
      feedSection.appendChild(postCard);
    });
  }

  private handleCreatePost(post: Post) {
    this.posts.unshift(post);
    this.renderPosts();
  }

  private async handleLike(postId: string) {
    const authState = authManager.getAuthState();
    if (!authState.isAuthenticated || !authState.currentUser) return;
    
    try {
      const post = this.posts.find(p => p.id === postId);
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
      
      if (this.currentView === 'feed') {
        this.renderPosts();
      }
    } catch (error) {
      console.error('Error handling like:', error);
    }
  }

  private async handleComment(postId: string, commentText: string) {
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

      const post = this.posts.find(p => p.id === postId);
      if (post) {
        if (!post.comments) post.comments = [];
        post.comments.push(data);
        if (this.currentView === 'feed') {
          this.renderPosts();
        }
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  }

  private async handleFollow(userId: string) {
    const authState = authManager.getAuthState();
    if (!authState.isAuthenticated || !authState.currentUser) return;
    
    try {
      await supabase
        .from('follows')
        .insert({
          follower_id: authState.currentUser.id,
          following_id: userId
        });
      
      // Reload posts to include new followed user's posts
      if (this.currentView === 'feed') {
        this.loadPosts();
      }
    } catch (error) {
      console.error('Error following user:', error);
    }
  }

  private async handleUnfollow(userId: string) {
    const authState = authManager.getAuthState();
    if (!authState.isAuthenticated || !authState.currentUser) return;
    
    try {
      await supabase
        .from('follows')
        .delete()
        .eq('follower_id', authState.currentUser.id)
        .eq('following_id', userId);
      
      // Reload posts to exclude unfollowed user's posts
      if (this.currentView === 'feed') {
        this.loadPosts();
      }
    } catch (error) {
      console.error('Error unfollowing user:', error);
    }
  }
}

// Initialize the app
new TravelSocialApp();