import { Post, Comment, MediaItem } from '../types';
import { authManager } from '../auth';
import { showAuthModal } from './AuthModal';
import { supabase } from '../lib/supabase';

export function createPostCard(
  post: Post, 
  onLike: (postId: string) => void,
  onComment: (postId: string, comment: string) => void,
  onFollow?: (userId: string) => void,
  onUnfollow?: (userId: string) => void,
  showFollowButton: boolean = false,
  onUserClick?: (userId: string) => void,
  isOwnProfile: boolean = false,
  onDelete?: (postId: string) => void,
  onAskAI?: (post: Post) => void,
  onShareToGroup?: (post: Post) => void,
  onShareToDM?: (post: Post) => void,
): HTMLElement {
  const card = document.createElement('div');
  card.className = 'post-card';
  
  let isFollowing = false;
  
  // Get media items from post
  function getMediaItems(): MediaItem[] {
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
  
  // Check if user is approved for interactions
  async function checkUserApprovalStatus(): Promise<boolean> {
    const authState = authManager.getAuthState();
    if (!authState.isAuthenticated || !authState.currentUser) return false;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_approved')
        .eq('id', authState.currentUser.id)
        .single();
      
      if (error) {
        console.error('Error checking approval status:', error);
        return false;
      }
      
      return data?.is_approved || false;
    } catch (error) {
      console.error('Error checking approval status:', error);
      return false;
    }
  }
  
  // Load follow status if needed
  async function loadFollowStatus() {
    if (!showFollowButton || !onFollow) return;
    
    const authState = authManager.getAuthState();
    if (!authState.isAuthenticated || !authState.currentUser) return;
    if (authState.currentUser.id === post.user_id) return; // Don't show follow button for own posts
    
    try {
      const { data } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', authState.currentUser.id)
        .eq('following_id', post.user_id)
        .single();
      
      isFollowing = !!data;
      updatePostCard();
    } catch (error) {
      // No follow relationship exists
      isFollowing = false;
      updatePostCard();
    }
  }
  
  function updatePostCard() {
    const authState = authManager.getAuthState();
    const currentUser = authState.currentUser;
    const isLiked = post.user_has_liked || false;
    const timeAgo = getTimeAgo(new Date(post.created_at));
    const userAvatarUrl = post.user?.avatar_url || 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop';
    const userName = post.user?.name || 'Unknown User';
    const isOwnPost = currentUser?.id === post.user_id;
    const mediaItems = getMediaItems();
    
    card.innerHTML = `
      <div class="post-header">
        <div class="post-user-clickable" ${onUserClick ? 'style="cursor: pointer;"' : ''}>
          <img src="${userAvatarUrl}" alt="${userName}" class="user-avatar">
          <div class="post-user-info">
            <h3 class="user-name">${userName}</h3>
            <p class="post-location">📍 ${post.location}</p>
            <p class="post-time">${timeAgo}</p>
          </div>
        </div>
        <div class="post-header-actions">
          ${showFollowButton && !isOwnPost && authState.isAuthenticated && onFollow ? `
            <button class="follow-btn ${isFollowing ? 'following' : ''}" data-user-id="${post.user_id}">
              ${isFollowing ? 'Following' : 'Follow'}
            </button>
          ` : ''}
          ${isOwnProfile && isOwnPost && onDelete ? `
            <button class="delete-post-btn" title="Delete post">
              <span class="delete-icon">🗑️</span>
            </button>
          ` : ''}
        </div>
      </div>
      
      <div class="post-content">
        <p>${post.content}</p>
      </div>
      
      ${mediaItems.length > 0 ? `
        <div class="post-media">
          ${createMediaCarousel(mediaItems)}
        </div>
      ` : ''}
      ${authState.isAuthenticated && onShareToDM ? `
        <button class="action-btn share-dm-btn" data-post-id="${post.id}">
          <span class="icon">✉️</span>
          <span class="text">Message</span>
        </button>
      ` : ''}
      ${authState.isAuthenticated && onShareToGroup ? `
        <button class="action-btn share-group-btn" data-post-id="${post.id}">
          <span class="icon">👥</span>
          <span class="text">Group</span>
        </button>
      ` : ''}
      
      <div class="post-actions">
        <button class="action-btn like-btn ${isLiked ? 'liked' : ''}" data-post-id="${post.id}">
          <span class="icon">${isLiked ? '❤️' : '🤍'}</span>
          <span class="count">${post.likes_count || 0}</span>
        </button>
        <button class="action-btn comment-btn">
          <span class="icon">💬</span>
          <span class="count">${post.comments?.length || 0}</span>
        </button>
        ${authState.isAuthenticated ? `
          <button class="action-btn share-btn" data-post-id="${post.id}">
            <span class="icon">🔄</span>
            <span class="text">Share</span>
            <div class="share-dropdown">
              <button class="share-option share-to-community">
                <span class="option-icon">🏘️</span>
                <span class="option-text">Share to Community</span>
              </button>
              <button class="share-option share-to-group">
                <span class="option-icon">👥</span>
                <span class="option-text">Share to Group</span>
              </button>
            </div>
          </button>
        ` : ''}
        ${authState.isAuthenticated && onAskAI ? `
          <button class="action-btn ask-ai-btn" data-post-id="${post.id}">
            <span class="icon">🤖</span>
            <span class="text">Ask AI</span>
          </button>
        ` : ''}
      </div>
      
      <div class="comments-section">
        <div class="comments-list">
          ${(post.comments || []).map(comment => createCommentHTML(comment, onUserClick)).join('')}
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
    `;
    
    // Setup media carousel if there are multiple items
    if (mediaItems.length > 1) {
      setupMediaCarousel(card, mediaItems);
    }
    
    // User click functionality
    if (onUserClick) {
      const userClickable = card.querySelector('.post-user-clickable') as HTMLElement;
      userClickable.addEventListener('click', () => {
        onUserClick(post.user_id);
      });
    }
    
    // Like functionality with approval check
    const likeBtn = card.querySelector('.like-btn') as HTMLButtonElement;
    likeBtn.addEventListener('click', async () => {
      if (!authState.isAuthenticated) {
        showAuthModal();
        return;
      }
      
      // Check if user is approved
      const isApproved = await checkUserApprovalStatus();
      if (!isApproved) {
        alert('Your account needs to be approved before you can like posts. Please wait for admin approval.');
        return;
      }
      
      onLike(post.id);
    });
    
    // Delete functionality
    const deleteBtn = card.querySelector('.delete-post-btn') as HTMLButtonElement;
    if (deleteBtn && onDelete) {
      deleteBtn.addEventListener('click', () => {
        onDelete(post.id);
      });
    }
    
    // Follow functionality with approval check
    const followBtn = card.querySelector('.follow-btn') as HTMLButtonElement;
    if (followBtn && onFollow && onUnfollow) {
      followBtn.addEventListener('click', async () => {
        if (!authState.isAuthenticated) {
          showAuthModal();
          return;
        }
        
        // Check if user is approved
        const isApproved = await checkUserApprovalStatus();
        if (!isApproved) {
          alert('Your account needs to be approved before you can follow users. Please wait for admin approval.');
          return;
        }
        
        const userId = followBtn.dataset.userId!;
        
        if (isFollowing) {
          await onUnfollow(userId);
          isFollowing = false;
        } else {
          await onFollow(userId);
          isFollowing = true;
        }
        
        updatePostCard();
      });
    }
    
    // Share functionality
    const shareBtn = card.querySelector('.share-btn') as HTMLButtonElement;
    if (shareBtn) {
      // Toggle dropdown on click
      shareBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const dropdown = shareBtn.querySelector('.share-dropdown') as HTMLElement;
        dropdown.classList.toggle('active');
        
        // Close dropdown when clicking outside
        const closeDropdown = (e: MouseEvent) => {
          if (!shareBtn.contains(e.target as Node)) {
            dropdown.classList.remove('active');
            document.removeEventListener('click', closeDropdown);
          }
        };
        
        document.addEventListener('click', closeDropdown);
      });
      
      // Share to community option
      const shareToCommunityBtn = shareBtn.querySelector('.share-to-community') as HTMLButtonElement;
      shareToCommunityBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        // This will be handled by the parent component
        // which will open the share modal
        const event = new CustomEvent('share-post', { detail: { postId: post.id } });
        card.dispatchEvent(event);
      });
      
      // Share to group option
      const shareToGroupBtn = shareBtn.querySelector('.share-to-group') as HTMLButtonElement;
      shareToGroupBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (onShareToGroup) {
          onShareToGroup(post);
        }
          detail: { 
            postId: post.id,
            target: 'community'
          } 
        });
        card.dispatchEvent(event);
      });
    }
    
    // Share to DM functionality
    const shareDMBtn = card.querySelector('.share-dm-btn') as HTMLButtonElement;
    if (shareDMBtn && onShareToDM) {
      shareDMBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        // This will be handled by the parent component
        // which will open the share to DM modal
        const event = new CustomEvent('share-post', { 
          detail: { 
            postId: post.id,
            target: 'dm'
          } 
        });
        card.dispatchEvent(event);
      });
    }
    
    // Share to Group functionality
    const shareGroupBtn = card.querySelector('.share-group-btn') as HTMLButtonElement;
    if (shareGroupBtn && onShareToGroup) {
      shareGroupBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        // This will be handled by the parent component
        // which will open the share to group modal
        const event = new CustomEvent('share-post', { 
          detail: { 
            postId: post.id,
            target: 'group'
          } 
        });
        card.dispatchEvent(event);
      });
    }
    
    // Ask AI functionality
    const askAIBtn = card.querySelector('.ask-ai-btn') as HTMLButtonElement;
    if (askAIBtn && onAskAI) {
      askAIBtn.addEventListener('click', () => {
        if (!authState.isAuthenticated) {
          showAuthModal();
          return;
        }
        onAskAI(post);
      });
    }
    
    // Comment functionality for authenticated users with approval check
    if (authState.isAuthenticated && currentUser) {
      const commentInput = card.querySelector('.comment-input') as HTMLInputElement;
      const commentSubmitBtn = card.querySelector('.comment-submit-btn') as HTMLButtonElement;
      
      if (commentInput && commentSubmitBtn) {
        commentInput.addEventListener('input', () => {
          commentSubmitBtn.disabled = commentInput.value.trim().length === 0;
        });
        
        commentInput.addEventListener('keypress', async (e) => {
          if (e.key === 'Enter' && commentInput.value.trim()) {
            // Check if user is approved
            const isApproved = await checkUserApprovalStatus();
            if (!isApproved) {
              alert('Your account needs to be approved before you can comment. Please wait for admin approval.');
              return;
            }
            
            submitComment();
          }
        });
        
        commentSubmitBtn.addEventListener('click', async () => {
          // Check if user is approved
          const isApproved = await checkUserApprovalStatus();
          if (!isApproved) {
            alert('Your account needs to be approved before you can comment. Please wait for admin approval.');
            return;
          }
          
          submitComment();
        });
        
        function submitComment() {
          const commentText = commentInput.value.trim();
          if (commentText) {
            onComment(post.id, commentText);
            commentInput.value = '';
            commentSubmitBtn.disabled = true;
          }
        }
      }
    } else {
      // Login prompt for non-authenticated users
      const commentLoginBtn = card.querySelector('.comment-login-btn') as HTMLButtonElement;
      if (commentLoginBtn) {
        commentLoginBtn.addEventListener('click', showAuthModal);
      }
    }
  }
  
  function createMediaCarousel(mediaItems: MediaItem[]): string {
    if (mediaItems.length === 1) {
      const media = mediaItems[0];
      return `
        <div class="media-single">
          ${media.type === 'video' ? `
            <video src="${media.url}" controls class="post-media-item">
              Your browser does not support the video tag.
            </video>
          ` : `
            <img src="${media.url}" alt="Travel photo" class="post-media-item" loading="lazy">
          `}
        </div>
      `;
    }
    
    return `
      <div class="media-carousel">
        <div class="media-container">
          <div class="media-track" style="transform: translateX(0%)">
            ${mediaItems.map((media, index) => `
              <div class="media-slide">
                ${media.type === 'video' ? `
                  <video src="${media.url}" controls class="post-media-item">
                    Your browser does not support the video tag.
                  </video>
                ` : `
                  <img src="${media.url}" alt="Travel photo" class="post-media-item" loading="lazy">
                `}
              </div>
            `).join('')}
          </div>
          <button class="media-nav prev-btn" style="display: none;">‹</button>
          <button class="media-nav next-btn">›</button>
        </div>
        <div class="media-indicators">
          ${mediaItems.map((_, index) => `
            <button class="indicator ${index === 0 ? 'active' : ''}" data-index="${index}"></button>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  function setupMediaCarousel(card: HTMLElement, mediaItems: MediaItem[]) {
    const track = card.querySelector('.media-track') as HTMLElement;
    const prevBtn = card.querySelector('.prev-btn') as HTMLButtonElement;
    const nextBtn = card.querySelector('.next-btn') as HTMLButtonElement;
    const indicators = card.querySelectorAll('.indicator') as NodeListOf<HTMLButtonElement>;
    
    let currentIndex = 0;
    
    function updateCarousel() {
      const translateX = -currentIndex * 100;
      track.style.transform = `translateX(${translateX}%)`;
      
      // Update navigation buttons
      prevBtn.style.display = currentIndex === 0 ? 'none' : 'flex';
      nextBtn.style.display = currentIndex === mediaItems.length - 1 ? 'none' : 'flex';
      
      // Update indicators
      indicators.forEach((indicator, index) => {
        indicator.classList.toggle('active', index === currentIndex);
      });
    }
    
    prevBtn.addEventListener('click', () => {
      if (currentIndex > 0) {
        currentIndex--;
        updateCarousel();
      }
    });
    
    nextBtn.addEventListener('click', () => {
      if (currentIndex < mediaItems.length - 1) {
        currentIndex++;
        updateCarousel();
      }
    });
    
    indicators.forEach((indicator, index) => {
      indicator.addEventListener('click', () => {
        currentIndex = index;
        updateCarousel();
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
        if (diff > 0 && currentIndex < mediaItems.length - 1) {
          currentIndex++;
        } else if (diff < 0 && currentIndex > 0) {
          currentIndex--;
        }
        updateCarousel();
      }
    });
  }
  
  // Initial render
  updatePostCard();
  
  // Load follow status if needed and component is mounted
  setTimeout(() => {
    if (showFollowButton && card.isConnected) {
      loadFollowStatus();
    }
  }, 0);
  
  // Listen for auth changes
  authManager.onAuthChange(() => {
    updatePostCard();
    if (showFollowButton) {
      loadFollowStatus();
    }
  });
  
  return card;
}

function createCommentHTML(comment: Comment, onUserClick?: (userId: string) => void): string {
  const timeAgo = getTimeAgo(new Date(comment.created_at));
  const userAvatarUrl = comment.user?.avatar_url || 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop';
  const userName = comment.user?.name || 'Unknown User';
  
  return `
    <div class="comment">
      <div class="comment-user-clickable" ${onUserClick ? 'style="cursor: pointer;" data-user-id="' + comment.user_id + '"' : ''}>
        <img src="${userAvatarUrl}" alt="${userName}" class="user-avatar-small">
      </div>
      <div class="comment-content">
        <div class="comment-header">
          <span class="comment-user ${onUserClick ? 'clickable' : ''}" ${onUserClick ? 'data-user-id="' + comment.user_id + '"' : ''}>${userName}</span>
          <span class="comment-time">${timeAgo}</span>
        </div>
        <p class="comment-text">${comment.content}</p>
      </div>
    </div>
    .share-dropdown {
      position: absolute;
      top: 100%;
      right: 0;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      min-width: 180px;
      z-index: 100;
      display: none;
    }
    
    .share-dropdown.active {
      display: block;
    }
    
    .share-option {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      width: 100%;
      text-align: left;
      background: none;
      border: none;
      cursor: pointer;
      transition: background 0.2s;
      color: #334155;
    }
    
    .share-option:hover {
      background: #f8fafc;
    }
    
    .share-option:first-child {
      border-radius: 0.5rem 0.5rem 0 0;
    }
    
    .share-option:last-child {
      border-radius: 0 0 0.5rem 0.5rem;
    }
    
    .option-icon {
      font-size: 1rem;
    }
    
    .option-text {
      font-size: 0.875rem;
    }
    
    .action-btn.share-btn {
      position: relative;
    }
  `;
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}