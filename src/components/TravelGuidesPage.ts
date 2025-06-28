import { TravelGuide } from '../types';
import { authManager } from '../auth';
import { supabase } from '../lib/supabase';
import { showAuthModal } from './AuthModal';
import { createTravelGuideModal } from './CreateTravelGuideModal';

export function createTravelGuidesPage(
  onNavigateBack: () => void,
  onGuideClick: (guideId: string) => void,
  onUserClick?: (userId: string) => void
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'travel-guides-page';
  
  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    .guides-search {
      margin-bottom: 1.5rem;
    }

    .search-container {
      max-width: 600px;
      margin: 0 auto;
    }

    .search-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      background: white;
      border-radius: 2rem;
      padding: 0.75rem 1.5rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      border: 1px solid #e2e8f0;
    }

    .search-icon {
      color: #667eea;
      font-size: 1.25rem;
      margin-right: 1rem;
    }

    .search-input {
      flex: 1;
      border: none;
      outline: none;
      font-size: 1rem;
      background: transparent;
      color: #334155;
    }

    .search-input::placeholder {
      color: #94a3b8;
    }

    .search-clear-btn {
      background: #f1f5f9;
      color: #64748b;
      border: none;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
      transition: all 0.2s;
    }

    .search-clear-btn:hover {
      background: #e2e8f0;
      color: #475569;
    }

    .travel-guides-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 2rem 1rem;
    }

    .guides-header {
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

    .guides-header h1 {
      color: white;
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0;
    }

    .guides-header .back-btn {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
    }

    .guides-header .back-btn:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: translateY(-1px);
    }

    .create-guide-btn {
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

    .create-guide-btn:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: translateY(-1px);
    }

    .guides-content {
      background: white;
      border-radius: 1rem;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      padding: 2rem;
    }

    .guides-login-prompt {
      text-align: center;
      padding: 3rem 1rem;
    }

    .login-prompt-content {
      max-width: 400px;
      margin: 0 auto;
    }

    .login-prompt-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
      color: #667eea;
    }

    .login-prompt-content h3 {
      color: #1e293b;
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0 0 0.5rem 0;
    }

    .login-prompt-content p {
      color: #64748b;
      margin: 0 0 1.5rem 0;
      line-height: 1.6;
    }

    .guides-login-btn {
      background: #667eea;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s;
    }

    .guides-login-btn:hover {
      background: #5a67d8;
      transform: translateY(-1px);
    }

    .guides-tabs {
      display: flex;
      border-bottom: 1px solid #e2e8f0;
      margin-bottom: 2rem;
    }

    .guides-tab {
      padding: 1rem 1.5rem;
      cursor: pointer;
      color: #64748b;
      font-weight: 500;
      transition: all 0.2s;
      border-bottom: 2px solid transparent;
    }

    .guides-tab.active {
      color: #667eea;
      border-bottom-color: #667eea;
    }

    .guides-tab:hover:not(.active) {
      color: #334155;
      background: #f8fafc;
    }

    .tab-content {
      display: none;
    }

    .tab-content.active {
      display: block;
    }

    .guides-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .guide-card {
      background: white;
      border-radius: 1rem;
      border: 1px solid #e2e8f0;
      overflow: hidden;
      transition: all 0.3s ease;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
      cursor: pointer;
      display: flex;
      flex-direction: column;
    }

    .guide-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      border-color: #cbd5e1;
    }

    .guide-card-image {
      height: 160px;
      background-size: cover;
      background-position: center;
      position: relative;
    }

    .guide-card-badge {
      position: absolute;
      top: 1rem;
      right: 1rem;
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
      font-size: 0.75rem;
      font-weight: 500;
      background: rgba(255, 255, 255, 0.9);
      color: #1e293b;
    }

    .guide-card-content {
      padding: 1.5rem;
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .guide-card-title {
      color: #1e293b;
      font-size: 1.125rem;
      font-weight: 600;
      margin: 0 0 0.5rem 0;
    }

    .guide-card-destination {
      color: #667eea;
      font-size: 0.875rem;
      margin: 0 0 1rem 0;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .guide-card-description {
      color: #64748b;
      font-size: 0.875rem;
      margin: 0 0 1rem 0;
      line-height: 1.5;
      flex: 1;
    }

    .guide-card-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: auto;
      padding-top: 1rem;
      border-top: 1px solid #f1f5f9;
    }

    .guide-card-author {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .author-avatar {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      object-fit: cover;
    }

    .author-name {
      color: #64748b;
      font-size: 0.75rem;
    }

    .guide-card-date {
      color: #94a3b8;
      font-size: 0.75rem;
    }

    .guides-loading {
      text-align: center;
      padding: 3rem 1rem;
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #f3f4f6;
      border-top: 3px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .guides-empty {
      text-align: center;
      padding: 3rem 1rem;
      background: #f8fafc;
      border-radius: 0.75rem;
      border: 2px dashed #e2e8f0;
    }

    .empty-guides-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
      color: #94a3b8;
    }

    .guides-empty h3 {
      color: #1e293b;
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0 0 0.5rem 0;
    }

    .guides-empty p {
      color: #64748b;
      margin: 0 0 1.5rem 0;
      line-height: 1.5;
      max-width: 500px;
      margin-left: auto;
      margin-right: auto;
    }

    .create-first-guide-btn {
      background: #667eea;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .create-first-guide-btn:hover {
      background: #5a67d8;
      transform: translateY(-1px);
    }

    /* Responsive design */
    @media (max-width: 768px) {
      .travel-guides-page {
        padding: 1rem;
      }

      .guides-header {
        padding: 1rem;
        flex-direction: column;
        gap: 1rem;
        text-align: center;
      }

      .guides-content {
        padding: 1.5rem;
      }

      .guides-grid {
        grid-template-columns: 1fr;
      }

      .guides-tabs {
        overflow-x: auto;
        white-space: nowrap;
        padding-bottom: 0.5rem;
      }

      .guides-tab {
        padding: 0.75rem 1rem;
      }
      
      .search-input-wrapper {
        padding: 0.5rem 1rem;
      }
    }
  `;
  
  if (!document.head.querySelector('#travel-guides-styles')) {
    style.id = 'travel-guides-styles';
    document.head.appendChild(style);
  }
  
  // State variables
  let userGuides: TravelGuide[] = [];
  let publicGuides: TravelGuide[] = [];
  let isLoading = false;
  let searchQuery = '';
  let searchQuery = '';
  let activeTab = 'discover'; // 'discover' or 'my-guides'
  
  // Load guides
  async function loadGuides(query: string = '') {
    const authState = authManager.getAuthState();
    
    isLoading = true;
    renderGuidesPage();
    
    try {
      // Prepare base query for public guides
      let publicGuidesQuery = supabase
          .from('travel_guides')
          .select(`
            *,
            user:profiles(*)
          `)
          .eq('is_public', true)
          .order('created_at', { ascending: false });
      
      // Add search filter if query is provided
      if (query) {
        publicGuidesQuery = publicGuidesQuery.or(
          `title.ilike.%${query}%,destination.ilike.%${query}%`
        );
      }
      
      // Execute query with limit
      const { data: publicGuidesData, error: publicError } = await publicGuidesQuery.limit(50);
      // Add search filter if query is provided
      if (query) {
        publicGuidesQuery = publicGuidesQuery.or(
          `title.ilike.%${query}%,destination.ilike.%${query}%`
        );
      }
      
      // Execute query with limit
      const { data: publicGuidesData, error: publicError } = await publicGuidesQuery.limit(50);
      
      if (publicError) throw publicError;
      
      publicGuides = publicGuidesData || [];
      
      // Load user's guides if authenticated
      if (authState.isAuthenticated && authState.currentUser) {
        // Prepare base query for user guides
        let userGuidesQuery = supabase
            .from('travel_guides')
            .select(`
              *,
              user:profiles(*)
            `)
            .eq('user_id', authState.currentUser.id)
            .order('created_at', { ascending: false });
        
        // Add search filter if query is provided
        if (query) {
          userGuidesQuery = userGuidesQuery.or(
            `title.ilike.%${query}%,destination.ilike.%${query}%`
          );
        }
        
        // Execute query
        const { data: userGuidesData, error: userError } = await userGuidesQuery;
            .order('created_at', { ascending: false });
        
        // Add search filter if query is provided
        if (query) {
          userGuidesQuery = userGuidesQuery.or(
            `title.ilike.%${query}%,destination.ilike.%${query}%`
          );
        }
        
        // Execute query
        const { data: userGuidesData, error: userError } = await userGuidesQuery;
        
        if (userError) throw userError;
        
        userGuides = userGuidesData || [];
        
        // If user has guides, default to my-guides tab
        if (userGuides.length > 0) {
          activeTab = 'my-guides';
        }
      }
      
    } catch (error) {
      console.error('Error loading travel guides:', error);
    } finally {
      isLoading = false;
      renderGuidesPage();
    }
  }
  
  // Render guides page
  function renderGuidesPage() {
    const authState = authManager.getAuthState();
    
    container.innerHTML = `
      <div class="guides-header">
        <button class="back-btn">← Back</button>
        <h1>🧭 Travel Guides</h1>
        ${authState.isAuthenticated ? `
          <button class="create-guide-btn">
            <span class="btn-icon">✨</span>
            <span class="btn-text">Create Guide</span>
          </button>
        ` : ''}
      </div>
      
      <div class="guides-content">
        ${!authState.isAuthenticated ? `
          <div class="guides-login-prompt">
            <div class="login-prompt-content">
              <div class="login-prompt-icon">🧭</div>
              <h3>Create & Discover Travel Guides</h3>
              <p>Log in to create your own travel guides and share your expertise with the community!</p>
              <button class="guides-login-btn">Get Started</button>
            </div>
          </div>
        ` : `
          <div class="guides-search">
            <div class="search-container">
              <div class="search-input-wrapper">
                <span class="search-icon">🔍</span>
                <input 
                  type="text" 
                  placeholder="Search guides by title or destination..." 
                  class="search-input"
                  value="${searchQuery}"
                >
                ${searchQuery ? `<button class="search-clear-btn">✕</button>` : ''}
              </div>
            </div>
          </div>
          
          <div class="guides-search">
            <div class="search-container">
              <div class="search-input-wrapper">
                <span class="search-icon">🔍</span>
                <input 
                  type="text" 
                  placeholder="Search guides by title or destination..." 
                  class="search-input"
                  value="${searchQuery}"
                >
                ${searchQuery ? `<button class="search-clear-btn">✕</button>` : ''}
              </div>
            </div>
          </div>
          
          <div class="guides-tabs">
            <div class="guides-tab ${activeTab === 'discover' ? 'active' : ''}" data-tab="discover">Discover Guides</div>
            <div class="guides-tab ${activeTab === 'my-guides' ? 'active' : ''}" data-tab="my-guides">My Guides</div>
          </div>
          
          <div class="tab-content ${activeTab === 'discover' ? 'active' : ''}" data-content="discover">
            ${isLoading ? `
              <div class="guides-loading">
                <div class="loading-spinner"></div>
                <p>Loading travel guides...</p>
              </div>
            ` : publicGuides.length === 0 ? `
              <div class="guides-empty">
                <div class="empty-guides-icon">🧭</div>
                <h3>${searchQuery ? `No guides found for "${searchQuery}"` : 'No Public Guides Yet'}</h3>
                <p>${searchQuery ? 'Try a different search term or create your own guide!' : 'Be the first to create and share a travel guide with the community!'}</p>
                <button class="create-first-guide-btn">
                  <span class="btn-icon">✨</span>
                  <span class="btn-text">Create Your First Guide</span>
                </button>
              </div>
            ` : `
              <div class="guides-grid">
                ${publicGuides.map(guide => createGuideCard(guide)).join('')}
              </div>
            `}
          </div>
          
          <div class="tab-content ${activeTab === 'my-guides' ? 'active' : ''}" data-content="my-guides">
            ${isLoading ? `
              <div class="guides-loading">
                <div class="loading-spinner"></div>
                <p>Loading your guides...</p>
              </div>
            ` : userGuides.length === 0 ? `
              <div class="guides-empty">
                <div class="empty-guides-icon">🧭</div>
                <h3>${searchQuery ? `No guides found for "${searchQuery}"` : 'You Haven\'t Created Any Guides Yet'}</h3>
                <p>${searchQuery ? 'Try a different search term or create a new guide!' : 'Create your first travel guide by compiling your posts and itineraries. Share your expertise with the community!'}</p>
                <button class="create-first-guide-btn">
                  <span class="btn-icon">✨</span>
                  <span class="btn-text">Create Your First Guide</span>
                </button>
              </div>
            ` : `
              <div class="guides-grid">
                ${userGuides.map(guide => createGuideCard(guide)).join('')}
              </div>
            `}
          </div>
        `}
      </div>
    `;
    
    // Add event listeners
    const backBtn = container.querySelector('.back-btn') as HTMLButtonElement;
    backBtn.addEventListener('click', onNavigateBack);
    
    // Login button
    const loginBtn = container.querySelector('.guides-login-btn') as HTMLButtonElement;
    loginBtn?.addEventListener('click', showAuthModal);
    
    // Create guide buttons
    const createGuideBtn = container.querySelector('.create-guide-btn') as HTMLButtonElement;
    const createFirstGuideBtn = container.querySelector('.create-first-guide-btn') as HTMLButtonElement;
    
    createGuideBtn?.addEventListener('click', openCreateGuideModal);
    createFirstGuideBtn?.addEventListener('click', openCreateGuideModal);
    
    // Search functionality
    const searchInput = container.querySelector('.search-input') as HTMLInputElement;
    const searchClearBtn = container.querySelector('.search-clear-btn') as HTMLButtonElement;
    
    if (searchInput) {
      // Debounce search to avoid too many requests
      let searchTimeout: NodeJS.Timeout;
      
      searchInput.addEventListener('input', (e) => {
        const query = (e.target as HTMLInputElement).value;
        
        // Show/hide clear button
        if (searchClearBtn) {
          searchClearBtn.style.display = query ? 'block' : 'none';
        }
        
        // Debounce search
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          searchQuery = query;
          loadGuides(query);
        }, 300);
      });
      
      // Clear search
      searchClearBtn?.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        loadGuides('');
        searchClearBtn.style.display = 'none';
      });
    }
    
    // Tab switching
    const tabs = container.querySelectorAll('.guides-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.getAttribute('data-tab');
        if (tabName) {
          activeTab = tabName;
          
          // Update active tab
          tabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          
          // Update active content
          const tabContents = container.querySelectorAll('.tab-content');
          tabContents.forEach(content => {
            content.classList.remove('active');
            if (content.getAttribute('data-content') === tabName) {
              content.classList.add('active');
            }
          });
        }
      });
    });
    
    // Guide card clicks
    const guideCards = container.querySelectorAll('.guide-card');
    guideCards.forEach(card => {
      card.addEventListener('click', (e) => {
        const guideId = card.getAttribute('data-guide-id');
        if (guideId) {
          // Check if clicking on author
          const authorElement = (e.target as HTMLElement).closest('.guide-card-author');
          if (authorElement && onUserClick) {
            const userId = authorElement.getAttribute('data-user-id');
            if (userId) {
              e.stopPropagation();
              onUserClick(userId);
              return;
            }
          }
          
          onGuideClick(guideId);
        }
      });
    });
  }
  
  // Create guide card HTML
  function createGuideCard(guide: TravelGuide): string {
    const coverImage = guide.cover_image_url || getDestinationImage(guide.destination);
    const description = guide.description || `A travel guide for ${guide.destination}`;
    const truncatedDescription = description.length > 100 ? description.substring(0, 100) + '...' : description;
    const date = new Date(guide.created_at).toLocaleDateString();
    
    return `
      <div class="guide-card" data-guide-id="${guide.id}">
        <div class="guide-card-image" style="background-image: url('${coverImage}')">
          <div class="guide-card-badge">${guide.is_public ? '🌍 Public' : '🔒 Private'}</div>
        </div>
        <div class="guide-card-content">
          <h3 class="guide-card-title">${guide.title}</h3>
          <p class="guide-card-destination">📍 ${guide.destination}</p>
          <p class="guide-card-description">${truncatedDescription}</p>
          <div class="guide-card-meta">
            <div class="guide-card-author" data-user-id="${guide.user?.id || guide.user_id}">
              <img src="${guide.user?.avatar_url || 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'}" alt="${guide.user?.name || 'User'}" class="author-avatar">
              <span class="author-name">By ${guide.user?.name || 'User'}</span>
            </div>
            <span class="guide-card-date">${date}</span>
          </div>
        </div>
      </div>
    `;
  }
  
  // Open create guide modal
  function openCreateGuideModal() {
    const authState = authManager.getAuthState();
    if (!authState.isAuthenticated) {
      showAuthModal();
      return;
    }
    
    // Load user's posts and itineraries first
    Promise.all([
      supabase
        .from('posts')
        .select('*')
        .eq('user_id', authState.currentUser!.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('itineraries')
        .select('*')
        .eq('user_id', authState.currentUser!.id)
        .order('created_at', { ascending: false })
    ])
    .then(([postsResult, itinerariesResult]) => {
      const posts = postsResult.data || [];
      const itineraries = itinerariesResult.data || [];
      
      const modal = createTravelGuideModal(
        () => {}, // onClose - no action needed
        (guideId) => {
          // Reload guides after successful creation
          loadGuides(searchQuery);
          
          // Show success message
          alert('Travel guide created successfully!');
          
          // Switch to my guides tab
          activeTab = 'my-guides';
          renderGuidesPage();
        },
        posts,
        itineraries
      );
      
      document.body.appendChild(modal);
    })
    .catch(error => {
      console.error('Error loading user content:', error);
      alert('Failed to load your content. Please try again.');
    });
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
  loadGuides();
  
  // Listen for auth changes
  authManager.onAuthChange(() => {
    loadGuides(searchQuery);
  });
  
  return container;
}
            <div class="login-prompt-content">
              <div class="login-prompt-icon">🧭</div>
              <h3>Create & Discover Travel Guides</h3>
              <p>Log in to create your own travel guides and share your expertise with the community!</p>
              <button class="guides-login-btn">Get Started</button>
            </div>
          </div>
        ` : `
          <div class="guides-tabs">
            <div class="guides-tab ${activeTab === 'discover' ? 'active' : ''}" data-tab="discover">Discover Guides</div>
            <div class="guides-tab ${activeTab === 'my-guides' ? 'active' : ''}" data-tab="my-guides">My Guides</div>
          </div>
          
          <div class="tab-content ${activeTab === 'discover' ? 'active' : ''}" data-content="discover">
            ${isLoading ? `
              <div class="guides-loading">
                <div class="loading-spinner"></div>
                <p>Loading travel guides...</p>
              </div>
            ` : publicGuides.length === 0 ? `
              <div class="guides-empty">
                <div class="empty-guides-icon">🧭</div>
                <h3>${searchQuery ? `No guides found for "${searchQuery}"` : 'No Public Guides Yet'}</h3>
                <p>${searchQuery ? 'Try a different search term or create your own guide!' : 'Be the first to create and share a travel guide with the community!'}</p>
                <button class="create-first-guide-btn">
                  <span class="btn-icon">✨</span>
                  <span class="btn-text">Create Your First Guide</span>
                </button>
              </div>
            ` : `
              <div class="guides-grid">
                ${publicGuides.map(guide => createGuideCard(guide)).join('')}
              </div>
            `}
          </div>
          
          <div class="tab-content ${activeTab === 'my-guides' ? 'active' : ''}" data-content="my-guides">
            ${isLoading ? `
              <div class="guides-loading">
                <div class="loading-spinner"></div>
                <p>Loading your guides...</p>
              </div>
            ` : userGuides.length === 0 ? `
              <div class="guides-empty">
                <div class="empty-guides-icon">🧭</div>
                <h3>${searchQuery ? `No guides found for "${searchQuery}"` : 'You Haven\'t Created Any Guides Yet'}</h3>
                <p>${searchQuery ? 'Try a different search term or create a new guide!' : 'Create your first travel guide by compiling your posts and itineraries. Share your expertise with the community!'}</p>
                <button class="create-first-guide-btn">
                  <span class="btn-icon">✨</span>
                  <span class="btn-text">Create Your First Guide</span>
                </button>
              </div>
            ` : `
              <div class="guides-grid">
                ${userGuides.map(guide => createGuideCard(guide)).join('')}
              </div>
            `}
          </div>
        `}
      </div>
    `;
    
    // Add event listeners
    const backBtn = container.querySelector('.back-btn') as HTMLButtonElement;
    backBtn.addEventListener('click', onNavigateBack);
    
    // Login button
    const loginBtn = container.querySelector('.guides-login-btn') as HTMLButtonElement;
    loginBtn?.addEventListener('click', showAuthModal);
    
    // Create guide buttons
    const createGuideBtn = container.querySelector('.create-guide-btn') as HTMLButtonElement;
    const createFirstGuideBtn = container.querySelector('.create-first-guide-btn') as HTMLButtonElement;
    
    createGuideBtn?.addEventListener('click', openCreateGuideModal);
    createFirstGuideBtn?.addEventListener('click', openCreateGuideModal);
    
    // Search functionality
    const searchInput = container.querySelector('.search-input') as HTMLInputElement;
    const searchClearBtn = container.querySelector('.search-clear-btn') as HTMLButtonElement;
    
    if (searchInput) {
      // Debounce search to avoid too many requests
      let searchTimeout: NodeJS.Timeout;
      
      searchInput.addEventListener('input', (e) => {
        const query = (e.target as HTMLInputElement).value;
        
        // Show/hide clear button
        if (searchClearBtn) {
          searchClearBtn.style.display = query ? 'block' : 'none';
        }
        
        // Debounce search
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          searchQuery = query;
          loadGuides(query);
        }, 300);
      });
      
      // Clear search
      searchClearBtn?.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        loadGuides('');
        searchClearBtn.style.display = 'none';
      });
    }
    
    // Tab switching
    const tabs = container.querySelectorAll('.guides-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.getAttribute('data-tab');
        if (tabName) {
          activeTab = tabName;
          
          // Update active tab
          tabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          
          // Update active content
          const tabContents = container.querySelectorAll('.tab-content');
          tabContents.forEach(content => {
            content.classList.remove('active');
            if (content.getAttribute('data-content') === tabName) {
              content.classList.add('active');
            }
          });
        }
      });
    });
    
    // Guide card clicks
    const guideCards = container.querySelectorAll('.guide-card');
    guideCards.forEach(card => {
      card.addEventListener('click', (e) => {
        const guideId = card.getAttribute('data-guide-id');
        if (guideId) {
          // Check if clicking on author
          const authorElement = (e.target as HTMLElement).closest('.guide-card-author');
          if (authorElement && onUserClick) {
            const userId = authorElement.getAttribute('data-user-id');
            if (userId) {
              e.stopPropagation();
              onUserClick(userId);
              return;
            }
          }
          
          onGuideClick(guideId);
        }
      });
    });
  }
  
  // Create guide card HTML
  function createGuideCard(guide: TravelGuide): string {
    const coverImage = guide.cover_image_url || getDestinationImage(guide.destination);
    const description = guide.description || `A travel guide for ${guide.destination}`;
    const truncatedDescription = description.length > 100 ? description.substring(0, 100) + '...' : description;
    const date = new Date(guide.created_at).toLocaleDateString();
    
    return `
      <div class="guide-card" data-guide-id="${guide.id}">
        <div class="guide-card-image" style="background-image: url('${coverImage}')">
          <div class="guide-card-badge">${guide.is_public ? '🌍 Public' : '🔒 Private'}</div>
        </div>
        <div class="guide-card-content">
          <h3 class="guide-card-title">${guide.title}</h3>
          <p class="guide-card-destination">📍 ${guide.destination}</p>
          <p class="guide-card-description">${truncatedDescription}</p>
          <div class="guide-card-meta">
            <div class="guide-card-author" data-user-id="${guide.user?.id || guide.user_id}">
              <img src="${guide.user?.avatar_url || 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'}" alt="${guide.user?.name || 'User'}" class="author-avatar">
              <span class="author-name">By ${guide.user?.name || 'User'}</span>
            </div>
            <span class="guide-card-date">${date}</span>
          </div>
        </div>
      </div>
    `;
  }
  
  // Open create guide modal
  function openCreateGuideModal() {
    const authState = authManager.getAuthState();
    if (!authState.isAuthenticated) {
      showAuthModal();
      return;
    }
    
    // Load user's posts and itineraries first
    Promise.all([
      supabase
        .from('posts')
        .select('*')
        .eq('user_id', authState.currentUser!.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('itineraries')
        .select('*')
        .eq('user_id', authState.currentUser!.id)
        .order('created_at', { ascending: false })
    ])
    .then(([postsResult, itinerariesResult]) => {
      const posts = postsResult.data || [];
      const itineraries = itinerariesResult.data || [];
      
      const modal = createTravelGuideModal(
        () => {}, // onClose - no action needed
        (guideId) => {
          // Reload guides after successful creation
          loadGuides();
          
          // Show success message
          alert('Travel guide created successfully!');
          
          // Switch to my guides tab
          activeTab = 'my-guides';
          renderGuidesPage();
        },
        posts,
        itineraries
      );
      
      document.body.appendChild(modal);
    })
    .catch(error => {
      console.error('Error loading user content:', error);
      alert('Failed to load your content. Please try again.');
    });
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
  loadGuides(searchQuery);
  
  // Listen for auth changes
  authManager.onAuthChange(() => {
    loadGuides(searchQuery);
  });
  
  return container;
}