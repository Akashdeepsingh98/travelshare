import { Post, Comment, MediaItem } from '../types';
import { authManager } from '../auth';
import { showAuthModal } from './AuthModal';
import { supabase } from '../lib/supabase';

export function createPostViewer(
  initialPost: Post,
  allPosts: Post[],
  onClose: () => void,
  onLike: (postId: string) => void,
  onComment: (postId: string, comment: string) => void,
  onFollow: (userId: string) => void,
  onUnfollow: (userId: string) => void
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'post-viewer-modal';
  
  let currentPostIndex = allPosts.findIndex(p => p.id === initialPost.id);
  let currentPost = allPosts[currentPostIndex];
  let userFollowStatus: { [key: string]: boolean } = {};
  let currentMediaIndex = 0;
  
  // Get media items from post
  function getMediaItems(post: Post): MediaItem[] {
    if (post.media_urls && post.media_types) {
      return post.media_urls.map((url, index) => ({
        url,
        type: (post.media_types![index] as 'image' | 'video') || 'image'
      }));
    } else if (post.image_url) {
      // Backward compatibility
      return [{ url: post.image_url, type: 'image' }];
    }
    return [];
  }
  
  // Check if post has media
  function hasMedia(post: Post): boolean {
    return (post.media_urls && post.media_urls.length > 0) || !!post.image_url;
  }
  
  // Load follow status for all users
  async function loadFollowStatus() {
    const authState = authManager.getAuthState();
    if (!authState.isAuthenticated || !authState.currentUser) return;
    
    try {
      const userIds = [...new Set(allPosts.map(p => p.user_id))];
      const { data: follows } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', authState.currentUser.id)
        .in('following_id', userIds);
      
      userFollowStatus = {};
      follows?.forEach(follow => {
        userFollowStatus[follow.following_id] = true;
      });
      
      renderPostViewer();
    } catch (error) {
      console.error('Error loading follow status:', error);
    }
  }
  
  function renderPostViewer() {
    const authState = authManager.getAuthState();
    const currentUser = authState.currentUser;
    const isLiked = currentPost.user_has_liked || false;
    const timeAgo = getTimeAgo(new Date(currentPost.created_at));
    const userAvatarUrl = currentPost.user?.avatar_url || 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop';
    const userName = currentPost.user?.name || 'Unknown User';
    const isOwnPost = currentUser?.id === currentPost.user_id;
    const isFollowing = userFollowStatus[currentPost.user_id] || false;
    const mediaItems = getMediaItems(currentPost);
    const isTextOnly = !hasMedia(currentPost);
    
    // Reset media index when switching posts
    currentMediaIndex = 0;
    
    container.innerHTML = `
      <div class="post-viewer-backdrop"></div>
      <div class="post-viewer-content ${isTextOnly ? 'post-viewer-text-only' : ''}">
        <div class="post-viewer-header">
          <button class="post-viewer-close">✕</button>
          <div class="post-navigation">
            <button class="nav-btn prev-btn" ${currentPostIndex === 0 ? 'disabled' : ''}>
              <span class="nav-icon">←</span>
            </button>
            <span class="post-counter">${currentPostIndex + 1} / ${allPosts.length}</span>
            <button class="nav-btn next-btn" ${currentPostIndex === allPosts.length - 1 ? 'disabled' : ''}>
              <span class="nav-icon">→</span>
            </button>
          </div>
        </div>
        
        <div class="post-viewer-body">
          ${!isTextOnly ? `
            <div class="post-viewer-media">
              ${createMediaViewer(mediaItems)}
            </div>
          ` : `
            <div class="post-viewer-text-content">
              <div class="text-content-display">
                <h2>${currentPost.content}</h2>
              </div>
            </div>
          `}
          
          <div class="post-viewer-sidebar">
            <div class="post-viewer-user">
              <img src="${userAvatarUrl}" alt="${userName}" class="user-avatar">
              <div class="post-user-info">
                <h3 class="user-name">${userName}</h3>
                <p class="post-location">📍 ${currentPost.location}</p>
                <p class="post-time">${timeAgo}</p>
              </div>
              ${!isOwnPost && authState.isAuthenticated ? `
                <button class="follow-btn ${isFollowing ? 'following' : ''}" data-user-id="${currentPost.user_id}">
                  ${isFollowing ? 'Following' : 'Follow'}
                </button>
              ` : ''}
            </div>
            
            ${!isTextOnly ? `
              <div class="post-viewer-content-text">
                <p>${currentPost.content}</p>
              </div>
            ` : ''}
            
            <div class="post-viewer-actions">
              <button class="action-btn like-btn ${isLiked ? 'liked' : ''}" data-post-id="${currentPost.id}">
                <span class="icon">${isLiked ? '❤️' : '🤍'}</span>
                <span class="count">${currentPost.likes_count || 0}</span>
              </button>
              <button class="action-btn comment-btn">
                <span class="icon">💬</span>
                <span class="count">${currentPost.comments?.length || 0}</span>
              </button>
            </div>
            
            <div class="post-viewer-comments">
              <div class="comments-list">
                ${(currentPost.comments || []).map(comment => createCommentHTML(comment)).join('')}
              </div>
              ${authState.isAuthenticated && currentUser ? `
                <div class="add-comment">
                  <img src="${currentUser.avatar_url || 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'}" alt="${currentUser.name}" class="user-avatar-small">
                  <div class="comment-input-container">
                    <input type="text" placeholder="Add a comment..." class="comment-input">
                    <button class="comment-submit-btn" disabled>Post</button>
                  </div>
                </div>
              ` : `
                <div class="add-comment-login">
                  <button class="comment-login-btn">Log in to comment</button>
                </div>
              `}
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Setup media viewer if there are multiple items
    if (mediaItems.length > 1) {
      setupMediaViewer(container, mediaItems);
    }
    
    // Event listeners
    const backdrop = container.querySelector('.post-viewer-backdrop') as HTMLElement;
    const closeBtn = container.querySelector('.post-viewer-close') as HTMLButtonElement;
    const prevBtn = container.querySelector('.prev-btn') as HTMLButtonElement;
    const nextBtn = container.querySelector('.next-btn') as HTMLButtonElement;
    const likeBtn = container.querySelector('.like-btn') as HTMLButtonElement;
    const followBtn = container.querySelector('.follow-btn') as HTMLButtonElement;
    
    backdrop.addEventListener('click', onClose);
    closeBtn.addEventListener('click', onClose);
    
    // Navigation
    prevBtn.addEventListener('click', () => {
      if (currentPostIndex > 0) {
        currentPostIndex--;
        currentPost = allPosts[currentPostIndex];
        renderPostViewer();
      }
    });
    
    nextBtn.addEventListener('click', () => {
      if (currentPostIndex < allPosts.length - 1) {
        currentPostIndex++;
        currentPost = allPosts[currentPostIndex];
        renderPostViewer();
      }
    });
    
    // Like functionality
    likeBtn.addEventListener('click', () => {
      if (!authState.isAuthenticated) {
        showAuthModal();
        return;
      }
      onLike(currentPost.id);
      // Update local state
      currentPost.user_has_liked = !currentPost.user_has_liked;
      currentPost.likes_count += currentPost.user_has_liked ? 1 : -1;
      renderPostViewer();
    });
    
    // Follow functionality
    if (followBtn) {
      followBtn.addEventListener('click', async () => {
        if (!authState.isAuthenticated) {
          showAuthModal();
          return;
        }
        
        const userId = followBtn.dataset.userId!;
        const isCurrentlyFollowing = userFollowStatus[userId];
        
        if (isCurrentlyFollowing) {
          await onUnfollow(userId);
          userFollowStatus[userId] = false;
        } else {
          await onFollow(userId);
          userFollowStatus[userId] = true;
        }
        
        renderPostViewer();
      });
    }
    
    // Comment functionality for authenticated users
    if (authState.isAuthenticated && currentUser) {
      const commentInput = container.querySelector('.comment-input') as HTMLInputElement;
      const commentSubmitBtn = container.querySelector('.comment-submit-btn') as HTMLButtonElement;
      
      if (commentInput && commentSubmitBtn) {
        commentInput.addEventListener('input', () => {
          commentSubmitBtn.disabled = commentInput.value.trim().length === 0;
        });
        
        commentInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter' && commentInput.value.trim()) {
            submitComment();
          }
        });
        
        commentSubmitBtn.addEventListener('click', submitComment);
        
        function submitComment() {
          const commentText = commentInput.value.trim();
          if (commentText) {
            onComment(currentPost.id, commentText);
            commentInput.value = '';
            commentSubmitBtn.disabled = true;
          }
        }
      }
    } else {
      // Login prompt for non-authenticated users
      const commentLoginBtn = container.querySelector('.comment-login-btn') as HTMLButtonElement;
      if (commentLoginBtn) {
        commentLoginBtn.addEventListener('click', showAuthModal);
      }
    }
    
    // Keyboard navigation
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && currentPostIndex > 0) {
        currentPostIndex--;
        currentPost = allPosts[currentPostIndex];
        renderPostViewer();
      } else if (e.key === 'ArrowRight' && currentPostIndex < allPosts.length - 1) {
        currentPostIndex++;
        currentPost = allPosts[currentPostIndex];
        renderPostViewer();
      }
    };
    
    document.addEventListener('keydown', handleKeyPress);
    
    // Cleanup function
    container.addEventListener('remove', () => {
      document.removeEventListener('keydown', handleKeyPress);
    });
  }
  
  function createMediaViewer(mediaItems: MediaItem[]): string {
    if (mediaItems.length === 1) {
      const media = mediaItems[0];
      return `
        <div class="media-single">
          ${media.type === 'video' ? `
            <video src="${media.url}" controls class="post-viewer-media-item">
              Your browser does not support the video tag.
            </video>
          ` : `
            <img src="${media.url}" alt="Travel photo" class="post-viewer-media-item">
          `}
        </div>
      `;
    }
    
    return `
      <div class="media-viewer-carousel">
        <div class="media-viewer-container">
          <div class="media-viewer-track" style="transform: translateX(0%)">
            ${mediaItems.map((media, index) => `
              <div class="media-viewer-slide">
                ${media.type === 'video' ? `
                  <video src="${media.url}" controls class="post-viewer-media-item">
                    Your browser does not support the video tag.
                  </video>
                ` : `
                  <img src="${media.url}" alt="Travel photo" class="post-viewer-media-item">
                `}
              </div>
            `).join('')}
          </div>
          <button class="media-viewer-nav prev-media-btn" style="display: none;">‹</button>
          <button class="media-viewer-nav next-media-btn">›</button>
        </div>
        <div class="media-viewer-indicators">
          ${mediaItems.map((_, index) => `
            <button class="media-indicator ${index === 0 ? 'active' : ''}" data-index="${index}"></button>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  function setupMediaViewer(container: HTMLElement, mediaItems: MediaItem[]) {
    const track = container.querySelector('.media-viewer-track') as HTMLElement;
    const prevBtn = container.querySelector('.prev-media-btn') as HTMLButtonElement;
    const nextBtn = container.querySelector('.next-media-btn') as HTMLButtonElement;
    const indicators = container.querySelectorAll('.media-indicator') as NodeListOf<HTMLButtonElement>;
    
    function updateMediaViewer() {
      const translateX = -currentMediaIndex * 100;
      track.style.transform = `translateX(${translateX}%)`;
      
      // Update navigation buttons
      prevBtn.style.display = currentMediaIndex === 0 ? 'none' : 'flex';
      nextBtn.style.display = currentMediaIndex === mediaItems.length - 1 ? 'none' : 'flex';
      
      // Update indicators
      indicators.forEach((indicator, index) => {
        indicator.classList.toggle('active', index === currentMediaIndex);
      });
    }
    
    prevBtn.addEventListener('click', () => {
      if (currentMediaIndex > 0) {
        currentMediaIndex--;
        updateMediaViewer();
      }
    });
    
    nextBtn.addEventListener('click', () => {
      if (currentMediaIndex < mediaItems.length - 1) {
        currentMediaIndex++;
        updateMediaViewer();
      }
    });
    
    indicators.forEach((indicator, index) => {
      indicator.addEventListener('click', () => {
        currentMediaIndex = index;
        updateMediaViewer();
      });
    });
    
    // Touch/swipe support
    let startX = 0;
    let isDragging = false;
    
    track.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      isDragging = true;
    });
    
    track.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      e.preventDefault();
    });
    
    track.addEventListener('touchend', (e) => {
      if (!isDragging) return;
      isDragging = false;
      
      const endX = e.changedTouches[0].clientX;
      const diff = startX - endX;
      
      if (Math.abs(diff) > 50) { // Minimum swipe distance
        if (diff > 0 && currentMediaIndex < mediaItems.length - 1) {
          currentMediaIndex++;
        } else if (diff < 0 && currentMediaIndex > 0) {
          currentMediaIndex--;
        }
        updateMediaViewer();
      }
    });
  }
  
  // Initial load
  loadFollowStatus();
  
  return container;
}

function createCommentHTML(comment: Comment): string {
  const timeAgo = getTimeAgo(new Date(comment.created_at));
  const userAvatarUrl = comment.user?.avatar_url || 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop';
  const userName = comment.user?.name || 'Unknown User';
  
  return `
    <div class="comment">
      <img src="${userAvatarUrl}" alt="${userName}" class="user-avatar-small">
      <div class="comment-content">
        <div class="comment-header">
          <span class="comment-user">${userName}</span>
          <span class="comment-time">${timeAgo}</span>
        </div>
        <p class="comment-text">${comment.content}</p>
      </div>
    </div>
  `;
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}