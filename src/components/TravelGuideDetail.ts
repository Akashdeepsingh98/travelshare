import { TravelGuide, GuideContentItem, Post, Itinerary } from '../types';
import { authManager } from '../auth';
import { supabase } from '../lib/supabase';
import { createPostCard } from './PostCard';
import { createItineraryCard } from './ItineraryCard';

export function createTravelGuideDetail(
  guideId: string,
  onNavigateBack: () => void,
  onPostSelect?: (post: Post, allPosts: Post[]) => void,
  onItinerarySelect?: (itineraryId: string) => void,
  onUserClick?: (userId: string) => void,
  onEdit?: (guideId: string) => void,
  onDelete?: (guideId: string) => void
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'travel-guide-detail';
  
  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    .travel-guide-detail {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 2rem 1rem;
    }

    .guide-detail-header {
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

    .guide-detail-header .back-btn {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
    }

    .guide-detail-header .back-btn:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: translateY(-1px);
    }

    .guide-header-content {
      flex: 1;
      text-align: center;
    }

    .guide-header-content h1 {
      color: white;
      font-size: 1.75rem;
      font-weight: 600;
      margin: 0 0 0.25rem 0;
    }

    .guide-header-meta {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
    }

    .guide-badge {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .guide-header-actions {
      display: flex;
      gap: 0.5rem;
    }

    .edit-guide-btn, .delete-guide-btn, .share-guide-btn {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .edit-guide-btn:hover, .share-guide-btn:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: translateY(-1px);
    }

    .delete-guide-btn {
      background: rgba(239, 68, 68, 0.2);
    }

    .delete-guide-btn:hover {
      background: rgba(239, 68, 68, 0.3);
      transform: translateY(-1px);
    }

    .guide-detail-content {
      background: white;
      border-radius: 1rem;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .guide-banner {
      height: 300px;
      background-size: cover;
      background-position: center;
      position: relative;
    }

    .guide-banner-overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
      padding: 2rem;
      color: white;
    }

    .guide-banner-title {
      font-size: 2rem;
      font-weight: 700;
      margin: 0 0 0.5rem 0;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .guide-banner-destination {
      font-size: 1.25rem;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    }

    .guide-info {
      padding: 2rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .guide-description {
      color: #334155;
      line-height: 1.6;
      margin: 0 0 1.5rem 0;
    }

    .guide-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .guide-author {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .author-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
    }

    .author-info {
      display: flex;
      flex-direction: column;
    }

    .author-name {
      color: #1e293b;
      font-weight: 600;
      font-size: 0.875rem;
    }

    .author-title {
      color: #64748b;
      font-size: 0.75rem;
    }

    .guide-date {
      color: #64748b;
      font-size: 0.875rem;
    }

    .guide-content {
      padding: 2rem;
    }

    .guide-content-header {
      margin-bottom: 2rem;
    }

    .guide-content-header h2 {
      color: #1e293b;
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0 0 0.5rem 0;
    }

    .guide-content-header p {
      color: #64748b;
      margin: 0;
    }

    .guide-items {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .guide-item {
      border: 1px solid #e2e8f0;
      border-radius: 1rem;
      overflow: hidden;
    }

    .guide-item-header {
      padding: 1rem 1.5rem;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .guide-item-type {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .item-type-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .item-type-badge.post {
      background: #e0f2fe;
      color: #0369a1;
    }

    .item-type-badge.itinerary {
      background: #dcfce7;
      color: #166534;
    }

    .guide-item-number {
      color: #64748b;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .guide-item-content {
      padding: 1.5rem;
    }

    .guide-item-notes {
      margin-top: 1rem;
      padding: 1rem;
      background: #f8fafc;
      border-radius: 0.5rem;
      color: #334155;
      font-size: 0.875rem;
      line-height: 1.6;
    }

    .guide-loading {
      text-align: center;
      padding: 4rem 2rem;
      background: white;
      border-radius: 1rem;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    }

    .guide-not-found {
      text-align: center;
      padding: 4rem 2rem;
      background: white;
      border-radius: 1rem;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    }

    .not-found-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
      color: #94a3b8;
    }

    .guide-not-found h2 {
      color: #1e293b;
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0 0 0.5rem 0;
    }

    .guide-not-found p {
      color: #64748b;
      margin: 0 0 1.5rem 0;
      line-height: 1.6;
      max-width: 500px;
      margin-left: auto;
      margin-right: auto;
    }

    .back-to-guides-btn {
      background: #667eea;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
    }

    .back-to-guides-btn:hover {
      background: #5a67d8;
      transform: translateY(-1px);
    }

    /* Responsive design */
    @media (max-width: 768px) {
      .travel-guide-detail {
        padding: 1rem;
      }

      .guide-detail-header {
        padding: 1rem;
        flex-direction: column;
        gap: 1rem;
        text-align: center;
      }

      .guide-header-content {
        order: 2;
      }

      .guide-header-actions {
        order: 3;
        width: 100%;
        justify-content: center;
      }

      .guide-banner {
        height: 200px;
      }

      .guide-banner-title {
        font-size: 1.5rem;
      }

      .guide-banner-destination {
        font-size: 1rem;
      }

      .guide-info, .guide-content {
        padding: 1.5rem;
      }

      .guide-meta {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }

      .guide-date {
        align-self: flex-end;
      }
    }
  `;
  
  if (!document.head.querySelector('#travel-guide-detail-styles')) {
    style.id = 'travel-guide-detail-styles';
    document.head.appendChild(style);
  }
  
  // State variables
  let guide: TravelGuide | null = null;
  let guideItems: GuideContentItem[] = [];
  let isLoading = false;
  let isOwner = false;
  
  // Load guide data
  async function loadGuideData() {
    isLoading = true;
    renderGuideDetail();
    
    try {
      // Load guide details
      const { data: guideData, error: guideError } = await supabase
        .from('travel_guides')
        .select(`
          *,
          user:profiles(*)
        `)
        .eq('id', guideId)
        .single();
      
      if (guideError) throw guideError;
      
      guide = guideData;
      
      // Check if user is the owner
      const authState = authManager.getAuthState();
      isOwner = authState.isAuthenticated && authState.currentUser?.id === guide.user_id;
      
      // Check if guide is public or user is the owner
      if (!guide.is_public && !isOwner) {
        throw new Error('You do not have permission to view this guide');
      }
      
      // Load guide content items
      const { data: itemsData, error: itemsError } = await supabase
        .rpc('get_guide_content', { guide_uuid: guideId });
      
      if (itemsError) throw itemsError;
      
      guideItems = itemsData || [];
      
    } catch (error) {
      console.error('Error loading guide data:', error);
      guide = null;
      guideItems = [];
    } finally {
      isLoading = false;
      renderGuideDetail();
    }
  }
  
  // Render guide detail
  function renderGuideDetail() {
    if (isLoading) {
      container.innerHTML = `
        <div class="guide-detail-header">
          <button class="back-btn">← Back</button>
          <div class="guide-header-content">
            <h1>Loading Guide...</h1>
          </div>
        </div>
        
        <div class="guide-loading">
          <div class="loading-spinner"></div>
          <p>Loading travel guide...</p>
        </div>
      `;
      
      const backBtn = container.querySelector('.back-btn') as HTMLButtonElement;
      backBtn.addEventListener('click', onNavigateBack);
      
      return;
    }
    
    if (!guide) {
      container.innerHTML = `
        <div class="guide-detail-header">
          <button class="back-btn">← Back</button>
          <div class="guide-header-content">
            <h1>Guide Not Found</h1>
          </div>
        </div>
        
        <div class="guide-not-found">
          <div class="not-found-icon">🔍</div>
          <h2>Guide Not Found</h2>
          <p>The travel guide you're looking for doesn't exist or you don't have permission to view it.</p>
          <button class="back-to-guides-btn">Back to Guides</button>
        </div>
      `;
      
      const backBtn = container.querySelector('.back-btn') as HTMLButtonElement;
      const backToGuidesBtn = container.querySelector('.back-to-guides-btn') as HTMLButtonElement;
      
      backBtn.addEventListener('click', onNavigateBack);
      backToGuidesBtn.addEventListener('click', onNavigateBack);
      
      return;
    }
    
    const coverImage = guide.cover_image_url || getDestinationImage(guide.destination);
    const formattedDate = new Date(guide.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    container.innerHTML = `
      <div class="guide-detail-header">
        <button class="back-btn">← Back</button>
        <div class="guide-header-content">
          <h1>${guide.title}</h1>
          <div class="guide-header-meta">
            <span class="guide-badge">${guide.is_public ? '🌍 Public Guide' : '🔒 Private Guide'}</span>
            <span class="guide-badge">📍 ${guide.destination}</span>
          </div>
        </div>
        ${isOwner ? `
          <div class="guide-header-actions">
            <button class="share-guide-btn">
              <span class="btn-icon">🔄</span>
              <span class="btn-text">Share</span>
            </button>
            <button class="edit-guide-btn">
              <span class="btn-icon">✏️</span>
              <span class="btn-text">Edit</span>
            </button>
            <button class="delete-guide-btn">
              <span class="btn-icon">🗑️</span>
              <span class="btn-text">Delete</span>
            </button>
          </div>
        ` : ''}
      </div>
      
      <div class="guide-detail-content">
        <div class="guide-banner" style="background-image: url('${coverImage}')">
          <div class="guide-banner-overlay">
            <h2 class="guide-banner-title">${guide.title}</h2>
            <p class="guide-banner-destination">📍 ${guide.destination}</p>
          </div>
        </div>
        
        <div class="guide-info">
          ${guide.description ? `<p class="guide-description">${guide.description}</p>` : ''}
          
          <div class="guide-meta">
            <div class="guide-author" data-user-id="${guide.user?.id || guide.user_id}">
              <img src="${guide.user?.avatar_url || 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'}" alt="${guide.user?.name || 'User'}" class="author-avatar">
              <div class="author-info">
                <span class="author-name">${guide.user?.name || 'User'}</span>
                <span class="author-title">Travel Guide Creator</span>
              </div>
            </div>
            <span class="guide-date">Created on ${formattedDate}</span>
          </div>
        </div>
        
        <div class="guide-content">
          <div class="guide-content-header">
            <h2>Guide Contents</h2>
            <p>Follow this curated collection of posts and itineraries to explore ${guide.destination}.</p>
          </div>
          
          <div class="guide-items">
            ${guideItems.length === 0 ? `
              <div class="guide-empty">
                <p>This guide doesn't have any content items yet.</p>
              </div>
            ` : guideItems.map((item, index) => `
              <div class="guide-item">
                <div class="guide-item-header">
                  <div class="guide-item-type">
                    <span class="item-type-badge ${item.content_type}">${item.content_type === 'post' ? 'Post' : 'Itinerary'}</span>
                  </div>
                  <span class="guide-item-number">Item ${index + 1} of ${guideItems.length}</span>
                </div>
                <div class="guide-item-content" id="guide-item-${item.id}">
                  <!-- Content will be rendered here -->
                </div>
                ${item.notes ? `
                  <div class="guide-item-notes">
                    <strong>Notes:</strong> ${item.notes}
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
    
    // Add event listeners
    const backBtn = container.querySelector('.back-btn') as HTMLButtonElement;
    backBtn.addEventListener('click', onNavigateBack);
    
    // Author click
    const authorElement = container.querySelector('.guide-author') as HTMLElement;
    if (authorElement && onUserClick) {
      authorElement.addEventListener('click', () => {
        const userId = authorElement.getAttribute('data-user-id');
        if (userId) {
          onUserClick(userId);
        }
      });
    }
    
    // Owner actions
    if (isOwner) {
      const shareBtn = container.querySelector('.share-guide-btn') as HTMLButtonElement;
      const editBtn = container.querySelector('.edit-guide-btn') as HTMLButtonElement;
      const deleteBtn = container.querySelector('.delete-guide-btn') as HTMLButtonElement;
      
      shareBtn.addEventListener('click', () => {
        // Toggle public/private
        toggleGuideVisibility();
      });
      
      editBtn.addEventListener('click', () => {
        if (onEdit) {
          onEdit(guideId);
        }
      });
      
      deleteBtn.addEventListener('click', () => {
        if (onDelete && confirm('Are you sure you want to delete this guide? This action cannot be undone.')) {
          onDelete(guideId);
        }
      });
    }
    
    // Render guide items
    guideItems.forEach(item => {
      const itemContainer = document.getElementById(`guide-item-${item.id}`);
      if (!itemContainer) return;
      
      if (item.content_type === 'post' && item.post_data) {
        // Render post card
        const post = item.post_data;
        const postCard = createPostCard(
          post,
          undefined, // No like handler needed
          undefined, // No follow handler needed
          undefined, // No unfollow handler needed
          false, // Don't show follow button
          onUserClick, // Navigate to user profile when clicked
          false, // Not own profile
          undefined, // No delete handler
          undefined // No AI handler
        );
        
        // Add click handler to view post
        postCard.addEventListener('click', () => {
          if (onPostSelect) {
            // Get all posts from guide items
            const allPosts = guideItems
              .filter(i => i.content_type === 'post' && i.post_data)
              .map(i => i.post_data as Post);
            
            onPostSelect(post, allPosts);
          }
        });
        
        itemContainer.appendChild(postCard);
      } else if (item.content_type === 'itinerary' && item.itinerary_data) {
        // Render itinerary card
        const itinerary = item.itinerary_data;
        const itineraryCard = createItineraryCard(
          itinerary,
          (itineraryId) => {
            if (onItinerarySelect) {
              onItinerarySelect(itineraryId);
            }
          }
        );
        
        itemContainer.appendChild(itineraryCard);
      }
    });
  }
  
  // Toggle guide visibility (public/private)
  async function toggleGuideVisibility() {
    if (!guide) return;
    
    try {
      const { error } = await supabase
        .from('travel_guides')
        .update({ is_public: !guide.is_public })
        .eq('id', guideId);
      
      if (error) throw error;
      
      // Update local state
      guide.is_public = !guide.is_public;
      
      // Re-render
      renderGuideDetail();
      
      // Show success message
      alert(`Guide is now ${guide.is_public ? 'public' : 'private'}`);
      
    } catch (error) {
      console.error('Error updating guide visibility:', error);
      alert('Failed to update guide visibility. Please try again.');
    }
  }
  
  // Get destination image
  function getDestinationImage(destination: string): string {
    // Map common destinations to Pexels images
    const destinationImages: Record<string, string> = {
      'tokyo': 'https://images.pexels.com/photos/2506923/pexels-photo-2506923.jpeg?auto=compress&cs=tinysrgb&w=800',
      'japan': 'https://images.pexels.com/photos/3408354/pexels-photo-3408354.jpeg?auto=compress&cs=tinysrgb&w=800',
      'paris': 'https://images.pexels.com/photos/699466/pexels-photo-699466.jpeg?auto=compress&cs=tinysrgb&w=800',
      'france': 'https://images.pexels.com/photos/532826/pexels-photo-532826.jpeg?auto=compress&cs=tinysrgb&w=800',
      'new york': 'https://images.pexels.com/photos/802024/pexels-photo-802024.jpeg?auto=compress&cs=tinysrgb&w=800',
      'usa': 'https://images.pexels.com/photos/1486222/pexels-photo-1486222.jpeg?auto=compress&cs=tinysrgb&w=800',
      'rome': 'https://images.pexels.com/photos/1797158/pexels-photo-1797158.jpeg?auto=compress&cs=tinysrgb&w=800',
      'italy': 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=800',
      'london': 'https://images.pexels.com/photos/460672/pexels-photo-460672.jpeg?auto=compress&cs=tinysrgb&w=800',
      'uk': 'https://images.pexels.com/photos/672532/pexels-photo-672532.jpeg?auto=compress&cs=tinysrgb&w=800',
      'barcelona': 'https://images.pexels.com/photos/819764/pexels-photo-819764.jpeg?auto=compress&cs=tinysrgb&w=800',
      'spain': 'https://images.pexels.com/photos/1388030/pexels-photo-1388030.jpeg?auto=compress&cs=tinysrgb&w=800',
      'sydney': 'https://images.pexels.com/photos/995764/pexels-photo-995764.jpeg?auto=compress&cs=tinysrgb&w=800',
      'australia': 'https://images.pexels.com/photos/3617500/pexels-photo-3617500.jpeg?auto=compress&cs=tinysrgb&w=800',
      'bali': 'https://images.pexels.com/photos/1822458/pexels-photo-1822458.jpeg?auto=compress&cs=tinysrgb&w=800',
      'indonesia': 'https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg?auto=compress&cs=tinysrgb&w=800',
      'bangkok': 'https://images.pexels.com/photos/1031659/pexels-photo-1031659.jpeg?auto=compress&cs=tinysrgb&w=800',
      'thailand': 'https://images.pexels.com/photos/1659438/pexels-photo-1659438.jpeg?auto=compress&cs=tinysrgb&w=800',
      'dubai': 'https://images.pexels.com/photos/823696/pexels-photo-823696.jpeg?auto=compress&cs=tinysrgb&w=800',
      'uae': 'https://images.pexels.com/photos/2044434/pexels-photo-2044434.jpeg?auto=compress&cs=tinysrgb&w=800'
    };
    
    // Check if we have a specific image for this destination
    const destinationLower = destination.toLowerCase();
    for (const [key, url] of Object.entries(destinationImages)) {
      if (destinationLower.includes(key)) {
        return url;
      }
    }
    
    // Default travel image if no match
    return 'https://images.pexels.com/photos/1051073/pexels-photo-1051073.jpeg?auto=compress&cs=tinysrgb&w=800';
  }
  
  // Initial load
  loadGuideData();
  
  return container;
}