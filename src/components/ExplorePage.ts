import { Post, User } from '../types';
import { authManager } from '../auth';
import { supabase } from '../lib/supabase';
import { getCurrentPosition, calculateDistance, formatDistance, GeolocationPosition } from '../utils/geolocation';
import { forwardGeocode } from '../utils/geocoding';

export function createExplorePage(
  onPostSelect: (post: Post, allPosts: Post[]) => void,
  onNavigateBack: () => void,
  onUserClick?: (userId: string) => void,
  initialLocationQuery?: string
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'explore-page';
  
  // Add styles directly to the component
  const style = document.createElement('style');
  style.textContent = `
    .explore-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 2rem 1rem;
    }

    .explore-content {
      max-width: 1200px;
      margin: 0 auto;
    }

    .explore-header {
      text-align: center;
      margin-bottom: 3rem;
      color: white;
    }

    .explore-header h2 {
      font-size: 2.5rem;
      font-weight: 700;
      margin: 0 0 0.5rem 0;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .explore-subtitle {
      font-size: 1.125rem;
      opacity: 0.9;
      margin: 0 0 2rem 0;
      max-width: 600px;
      margin-left: auto;
      margin-right: auto;
    }

    .search-section {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: 1rem;
      padding: 2rem;
      margin-bottom: 2rem;
      border: 1px solid rgba(255, 255, 255, 0.2);
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
      margin-bottom: 1.5rem;
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

    .nearby-search-section {
      background: rgba(255, 255, 255, 0.15);
      border-radius: 1rem;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      border: 1px solid rgba(255, 255, 255, 0.3);
    }

    .nearby-search-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
    }

    .nearby-search-title {
      color: white;
      font-size: 1.125rem;
      font-weight: 600;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .nearby-toggle {
      position: relative;
      display: inline-block;
      width: 50px;
      height: 24px;
    }

    .nearby-toggle input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .nearby-slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(255, 255, 255, 0.3);
      transition: 0.3s;
      border-radius: 24px;
    }

    .nearby-slider:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: 0.3s;
      border-radius: 50%;
    }

    input:checked + .nearby-slider {
      background-color: #10b981;
    }

    input:checked + .nearby-slider:before {
      transform: translateX(26px);
    }

    .nearby-controls {
      display: none;
      gap: 1rem;
      align-items: center;
      flex-wrap: wrap;
    }

    .nearby-controls.active {
      display: flex;
    }

    .distance-control {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .distance-label {
      color: white;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .distance-select {
      background: rgba(255, 255, 255, 0.9);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 0.5rem;
      padding: 0.5rem;
      color: #374151;
      font-size: 0.875rem;
      cursor: pointer;
    }

    .location-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: white;
      font-size: 0.875rem;
    }

    .location-status.loading {
      color: #fbbf24;
    }

    .location-status.success {
      color: #10b981;
    }

    .location-status.error {
      color: #ef4444;
    }

    .get-location-btn {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 500;
      transition: all 0.2s;
    }

    .get-location-btn:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    .get-location-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .search-suggestions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      justify-content: center;
    }

    .search-suggestion {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.3);
      padding: 0.5rem 1rem;
      border-radius: 1.5rem;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 500;
      transition: all 0.2s;
      backdrop-filter: blur(10px);
    }

    .search-suggestion:hover {
      background: rgba(255, 255, 255, 0.3);
      border-color: rgba(255, 255, 255, 0.5);
      transform: translateY(-1px);
    }

    .search-results-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(255, 255, 255, 0.1);
      padding: 1rem 1.5rem;
      border-radius: 0.75rem;
      margin-bottom: 1rem;
      backdrop-filter: blur(10px);
    }

    .results-count {
      color: white;
      font-weight: 500;
    }

    .clear-search-btn {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-size: 0.875rem;
      transition: all 0.2s;
    }

    .clear-search-btn:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    .profile-search-results {
      margin-bottom: 2rem;
    }

    .profiles-section-header {
      color: white;
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .profiles-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .user-grid-item {
      background: white;
      border-radius: 1rem;
      padding: 1.5rem;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .user-grid-item:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
    }

    .user-grid-avatar {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      object-fit: cover;
      flex-shrink: 0;
      border: 3px solid #667eea;
    }

    .user-grid-info {
      flex: 1;
      min-width: 0;
    }

    .user-grid-name {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 0.25rem 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-grid-meta {
      color: #64748b;
      font-size: 0.875rem;
      margin: 0;
    }

    .user-grid-badge {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
      font-size: 0.75rem;
      font-weight: 600;
      flex-shrink: 0;
    }

    .posts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
      margin-top: 2rem;
    }

    .post-grid-item {
      background: white;
      border-radius: 1rem;
      overflow: hidden;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .post-grid-item:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
    }

    .text-only-post {
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      border: 2px solid #cbd5e1;
    }

    .text-only-post .grid-item-image {
      display: none;
    }

    .text-only-post .grid-item-info {
      padding: 2rem 1.5rem;
    }

    .text-only-preview {
      background: white;
      border-radius: 0.75rem;
      padding: 1.5rem;
      margin-bottom: 1rem;
      border-left: 4px solid #667eea;
    }

    .text-only-preview h3 {
      color: #1e293b;
      font-size: 1.125rem;
      font-weight: 600;
      margin-bottom: 0.75rem;
      line-height: 1.4;
    }

    .text-only-preview p {
      color: #475569;
      line-height: 1.6;
      margin: 0;
    }

    .grid-item-image {
      position: relative;
      aspect-ratio: 4/3;
      overflow: hidden;
    }

    .grid-item-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }

    .post-grid-item:hover .grid-item-image img {
      transform: scale(1.05);
    }

    .grid-item-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.7) 100%);
      display: flex;
      align-items: flex-end;
      padding: 1rem;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .post-grid-item:hover .grid-item-overlay {
      opacity: 1;
    }

    .grid-item-stats {
      display: flex;
      gap: 1rem;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      color: white;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .stat-icon {
      font-size: 1rem;
    }

    .grid-item-info {
      padding: 1.5rem;
    }

    .grid-item-user {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .grid-item-user:hover {
      color: #667eea;
    }

    .grid-user-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
    }

    .grid-user-details {
      flex: 1;
    }

    .grid-user-name {
      font-weight: 600;
      color: #1e293b;
      font-size: 0.875rem;
      margin-bottom: 0.25rem;
      display: block;
    }

    .grid-location {
      color: #667eea;
      font-size: 0.75rem;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .distance-badge {
      background: #10b981;
      color: white;
      padding: 0.125rem 0.5rem;
      border-radius: 1rem;
      font-size: 0.7rem;
      font-weight: 600;
      margin-left: 0.5rem;
    }

    .grid-item-content {
      margin-top: 0.75rem;
    }

    .grid-content-preview {
      color: #64748b;
      font-size: 0.875rem;
      line-height: 1.5;
      margin: 0;
    }

    .explore-loading {
      text-align: center;
      padding: 4rem 2rem;
      color: white;
    }

    .loading-spinner {
      color: white;
      font-size: 1.125rem;
      margin-bottom: 1rem;
    }

    .explore-error {
      text-align: center;
      padding: 4rem 2rem;
      color: white;
    }

    .explore-error p {
      margin-bottom: 1.5rem;
      font-size: 1.125rem;
    }

    .retry-btn {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.3);
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
      backdrop-filter: blur(10px);
    }

    .retry-btn:hover {
      background: rgba(255, 255, 255, 0.3);
      border-color: rgba(255, 255, 255, 0.5);
    }

    .no-search-results {
      text-align: center;
      padding: 4rem 2rem;
      color: white;
    }

    .no-results-content {
      max-width: 500px;
      margin: 0 auto;
    }

    .no-results-icon {
      font-size: 4rem;
      margin-bottom: 1.5rem;
      opacity: 0.8;
    }

    .no-results-content h3 {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 1rem;
    }

    .no-results-content p {
      font-size: 1.125rem;
      margin-bottom: 2rem;
      opacity: 0.9;
    }

    .search-tips {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 0.75rem;
      padding: 1.5rem;
      text-align: left;
      backdrop-filter: blur(10px);
    }

    .search-tips h4 {
      font-size: 1rem;
      font-weight: 600;
      margin-bottom: 0.75rem;
      color: white;
    }

    .search-tips ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .search-tips li {
      padding: 0.25rem 0;
      color: rgba(255, 255, 255, 0.9);
      font-size: 0.875rem;
    }

    .search-tips li::before {
      content: "•";
      color: #667eea;
      font-weight: bold;
      display: inline-block;
      width: 1em;
      margin-left: -1em;
    }

    /* Responsive design */
    @media (max-width: 768px) {
      .explore-page {
        padding: 1rem;
      }

      .explore-header h2 {
        font-size: 2rem;
      }

      .explore-subtitle {
        font-size: 1rem;
      }

      .search-section {
        padding: 1.5rem;
      }

      .posts-grid {
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 1rem;
      }

      .profiles-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .search-suggestions {
        gap: 0.5rem;
      }

      .search-suggestion {
        font-size: 0.8rem;
        padding: 0.4rem 0.8rem;
      }

      .grid-item-info {
        padding: 1rem;
      }

      .search-results-info {
        flex-direction: column;
        gap: 0.75rem;
        text-align: center;
      }

      .nearby-controls {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
      }

      .distance-control {
        justify-content: space-between;
      }
    }

    @media (max-width: 480px) {
      .explore-page {
        padding: 0.5rem;
      }

      .explore-header {
        margin-bottom: 2rem;
      }

      .explore-header h2 {
        font-size: 1.75rem;
      }

      .search-section {
        padding: 1rem;
      }

      .posts-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .search-input-wrapper {
        padding: 0.5rem 1rem;
      }

      .search-suggestions {
        flex-direction: column;
        align-items: center;
      }

      .search-suggestion {
        width: 100%;
        text-align: center;
        max-width: 200px;
      }

      .no-results-content {
        padding: 0 1rem;
      }

      .search-tips {
        padding: 1rem;
      }
    }
  `;
  
  // Append styles to document head if not already present
  if (!document.head.querySelector('#explore-page-styles')) {
    style.id = 'explore-page-styles';
    document.head.appendChild(style);
  }
  
  let allPosts: Post[] = [];
  let filteredPosts: Post[] = [];
  let filteredProfiles: User[] = [];
  let isLoading = false;
  let currentSearchQuery = '';
  let nearbySearchEnabled = false;
  let userLocation: GeolocationPosition | null = null;
  let selectedDistance = 25; // Default 25km
  let locationStatus: 'idle' | 'loading' | 'success' | 'error' = 'idle';
  let initialLocationCoordinates: GeolocationPosition | null = null;
  
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

      filteredPosts = allPosts;
      renderExplorePage();
    } catch (error) {
    
    // If there's an initial location query, perform the search after loading posts
    if (initialLocationQuery) {
      // Set the search input value
      const searchInput = container.querySelector('.search-input') as HTMLInputElement;
      if (searchInput) {
        searchInput.value = initialLocationQuery;
      }
      
      // Try to get coordinates for the location
      try {
        initialLocationCoordinates = await forwardGeocode(initialLocationQuery);
        
        if (initialLocationCoordinates) {
          // Enable nearby search with the coordinates
          nearbySearchEnabled = true;
          userLocation = initialLocationCoordinates;
          locationStatus = 'success';
          
          // Update UI to show nearby search is enabled
          const nearbyToggle = container.querySelector('#nearby-toggle') as HTMLInputElement;
          if (nearbyToggle) {
            nearbyToggle.checked = true;
          }
        }
      } catch (error) {
        console.error('Error geocoding initial location:', error);
      }
      
      // Perform the search
      performSearch(initialLocationQuery);
    }
      console.error('Error loading explore posts:', error);
      renderErrorState();
    } finally {
      isLoading = false;
    }
  }
  
  async function getUserLocation() {
    if (locationStatus === 'loading') return;
    
    locationStatus = 'loading';
    renderExplorePage();
    
    try {
      userLocation = await getCurrentPosition();
      locationStatus = 'success';
      console.log('User location obtained:', userLocation);
      
      // If nearby search is enabled, re-filter posts
      if (nearbySearchEnabled) {
        performSearch(currentSearchQuery);
      }
    } catch (error) {
      console.error('Error getting user location:', error);
      locationStatus = 'error';
      userLocation = null;
    }
    
    renderExplorePage();
  }
  
  function performSearch(query: string) {
    currentSearchQuery = query.toLowerCase().trim();
    
    let postsToFilter = allPosts;
    
    // Apply nearby filter first if enabled
    if (nearbySearchEnabled && userLocation) {
      postsToFilter = allPosts.filter(post => {
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
  
  async function searchProfiles(query: string) {
    if (!query.trim()) {
      filteredProfiles = [];
      return;
    }
    
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('name', `%${query}%`)
        .limit(10);
      
      if (error) {
        console.error('Error searching profiles:', error);
        filteredProfiles = [];
        return;
      }
      
      filteredProfiles = profiles || [];
    } catch (error) {
      console.error('Error searching profiles:', error);
      filteredProfiles = [];
    }
  }
  
  function renderExplorePage() {
    const nearbyResultsText = nearbySearchEnabled && userLocation 
      ? ` within ${selectedDistance}km` 
      : '';
    
    const searchResultsText = currentSearchQuery 
      ? ` for "${currentSearchQuery}"` 
      : '';
    
    const totalResults = filteredPosts.length + filteredProfiles.length;
    
    container.innerHTML = `
      <div class="explore-content">
        <div class="explore-header">
          <h2>Explore</h2>
          <p class="explore-subtitle">Discover amazing travel experiences and connect with fellow travelers</p>
          
          <div class="search-section">
            <div class="search-container">
              <div class="search-input-wrapper">
                <span class="search-icon">🔍</span>
                <input 
                  type="text"
                  placeholder="Search posts, users, locations, hashtags..." 
                  class="search-input"
                  value="${currentSearchQuery}"
                >
                <button class="search-clear-btn" style="display: ${currentSearchQuery ? 'flex' : 'none'}">✕</button>
              </div>
              
              <div class="nearby-search-section">
                <div class="nearby-search-header">
                  <h3 class="nearby-search-title">
                    <span>📍</span>
                    Nearby Experiences
                  </h3>
                  <label class="nearby-toggle">
                    <input type="checkbox" id="nearby-toggle" ${nearbySearchEnabled ? 'checked' : ''}>
                    <span class="nearby-slider"></span>
                  </label>
                </div>
                
                <div class="nearby-controls ${nearbySearchEnabled ? 'active' : ''}">
                  <div class="distance-control">
                    <span class="distance-label">Distance:</span>
                    <select class="distance-select" id="distance-select">
                      <option value="5" ${selectedDistance === 5 ? 'selected' : ''}>5 km</option>
                      <option value="10" ${selectedDistance === 10 ? 'selected' : ''}>10 km</option>
                      <option value="25" ${selectedDistance === 25 ? 'selected' : ''}>25 km</option>
                      <option value="50" ${selectedDistance === 50 ? 'selected' : ''}>50 km</option>
                      <option value="100" ${selectedDistance === 100 ? 'selected' : ''}>100 km</option>
                    </select>
                  </div>
                  
                  <div class="location-status ${locationStatus}">
                    ${locationStatus === 'idle' ? `
                      <button class="get-location-btn" id="get-location-btn">
                        📍 Get My Location
                      </button>
                    ` : locationStatus === 'loading' ? `
                      <span>⏳ Getting your location...</span>
                    ` : locationStatus === 'success' ? `
                      <span>✅ Location found</span>
                    ` : `
                      <span>❌ Location access denied</span>
                      <button class="get-location-btn" id="retry-location-btn">
                        🔄 Try Again
                      </button>
                    `}
                  </div>
                </div>
              </div>
              
              <div class="search-suggestions">
                <button class="search-suggestion" data-query="#travel">#travel</button>
                <button class="search-suggestion" data-query="#adventure">#adventure</button>
                <button class="search-suggestion" data-query="#foodie">#foodie</button>
                <button class="search-suggestion" data-query="#photography">#photography</button>
                <button class="search-suggestion" data-query="Japan">Japan</button>
                <button class="search-suggestion" data-query="Europe">Europe</button>
                <button class="search-suggestion" data-query="beach">Beach</button>
                <button class="search-suggestion" data-query="mountains">Mountains</button>
              </div>
            </div>
            
            ${currentSearchQuery || nearbySearchEnabled ? `
              <div class="search-results-info">
                <span class="results-count">${totalResults} result${totalResults === 1 ? '' : 's'}${searchResultsText}${nearbyResultsText}</span>
                <button class="clear-search-btn">Clear search</button>
              </div>
            ` : ''}
          </div>
        </div>
        
        ${filteredProfiles.length > 0 ? `
          <div class="profile-search-results">
            <h3 class="profiles-section-header">
              <span>👥</span>
              Profiles (${filteredProfiles.length})
            </h3>
            <div class="profiles-grid">
              ${filteredProfiles.map(profile => createUserGridItem(profile)).join('')}
            </div>
          </div>
        ` : ''}
        
        ${filteredPosts.length > 0 ? `
          <h3 class="profiles-section-header">
            <span>📸</span>
            Posts (${filteredPosts.length})
          </h3>
          <div class="posts-grid">
            ${filteredPosts.map(post => createPostGridItem(post)).join('')}
          </div>
        ` : ''}
        
        ${filteredPosts.length === 0 && filteredProfiles.length === 0 && (currentSearchQuery || nearbySearchEnabled) ? `
          <div class="no-search-results">
            <div class="no-results-content">
              <div class="no-results-icon">🔍</div>
              <h3>No results found</h3>
              <p>Try ${nearbySearchEnabled ? 'increasing the distance or ' : ''}searching for different keywords, locations, or hashtags.</p>
              <div class="search-tips">
                <h4>Search tips:</h4>
                <ul>
                  <li>Try searching for locations like "Tokyo" or "Paris"</li>
                  <li>Use hashtags like "#travel" or "#adventure"</li>
                  <li>Search for user names or travel experiences</li>
                  <li>Look for specific activities like "hiking" or "food"</li>
                  ${nearbySearchEnabled ? '<li>Increase the distance range to find more posts</li>' : '<li>Enable "Nearby Experiences" to find posts near you</li>'}
                </ul>
              </div>
            </div>
          </div>
        ` : ''}
      </div>
    `;
    
    setupSearchListeners();
    
    // Add click handlers for grid items
    const userGridItems = container.querySelectorAll('.user-grid-item');
    userGridItems.forEach((item) => {
      item.addEventListener('click', () => {
        const userId = item.getAttribute('data-user-id');
        if (userId && onUserClick) {
          onUserClick(userId);
        }
      });
    });
    
    const postGridItems = container.querySelectorAll('.post-grid-item');
    postGridItems.forEach((item, index) => {
      item.addEventListener('click', (e) => {
        // Check if click was on user info area
        const userInfoArea = (e.target as HTMLElement).closest('.grid-item-user');
        if (userInfoArea && onUserClick) {
          e.stopPropagation();
          const post = filteredPosts[index];
          if (post.user_id) {
            onUserClick(post.user_id);
          }
        } else {
          onPostSelect(filteredPosts[index], filteredPosts);
        }
      });
    });
  }
  
  function setupSearchListeners() {
    const searchInput = container.querySelector('.search-input') as HTMLInputElement;
    const searchClearBtn = container.querySelector('.search-clear-btn') as HTMLButtonElement;
    const clearSearchBtn = container.querySelector('.clear-search-btn') as HTMLButtonElement;
    const searchSuggestions = container.querySelectorAll('.search-suggestion') as NodeListOf<HTMLButtonElement>;
    const nearbyToggle = container.querySelector('#nearby-toggle') as HTMLInputElement;
    const distanceSelect = container.querySelector('#distance-select') as HTMLSelectElement;
    const getLocationBtn = container.querySelector('#get-location-btn') as HTMLButtonElement;
    const retryLocationBtn = container.querySelector('#retry-location-btn') as HTMLButtonElement;
    
    // Search input handling
    let searchTimeout: NodeJS.Timeout;
    
    searchInput?.addEventListener('input', (e) => {
      const query = (e.target as HTMLInputElement).value;
      
      // Update clear button visibility
      if (searchClearBtn) {
        searchClearBtn.style.display = query ? 'flex' : 'none';
      }
      
      // Debounce search
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        performSearch(query);
      }, 300);
    });
    
    searchInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        clearTimeout(searchTimeout);
        performSearch(searchInput.value);
      }
    });
    
    // Clear search
    searchClearBtn?.addEventListener('click', () => {
      searchInput.value = '';
      searchClearBtn.style.display = 'none';
      performSearch('');
    });
    
    clearSearchBtn?.addEventListener('click', () => {
      searchInput.value = '';
      nearbySearchEnabled = false;
      performSearch('');
    });
    
    // Nearby search toggle
    nearbyToggle?.addEventListener('change', (e) => {
      nearbySearchEnabled = (e.target as HTMLInputElement).checked;
      
      if (nearbySearchEnabled && !userLocation && locationStatus !== 'loading') {
        getUserLocation();
      } else {
        performSearch(currentSearchQuery);
      }
    });
    
    // Distance selection
    distanceSelect?.addEventListener('change', (e) => {
      selectedDistance = parseInt((e.target as HTMLSelectElement).value);
      if (nearbySearchEnabled) {
        performSearch(currentSearchQuery);
      }
    });
    
    // Location buttons
    getLocationBtn?.addEventListener('click', getUserLocation);
    retryLocationBtn?.addEventListener('click', getUserLocation);
    
    // Search suggestions
    searchSuggestions.forEach(suggestion => {
      suggestion.addEventListener('click', () => {
        const query = suggestion.dataset.query!;
        searchInput.value = query;
        performSearch(query);
      });
    });
  }
  
  function createUserGridItem(user: User): string {
    const avatarUrl = user.avatar_url || 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop';
    
    return `
      <div class="user-grid-item" data-user-id="${user.id}">
        <img src="${avatarUrl}" alt="${user.name}" class="user-grid-avatar">
        <div class="user-grid-info">
          <h4 class="user-grid-name">${user.name}</h4>
          <p class="user-grid-meta">Traveler</p>
        </div>
        <span class="user-grid-badge">Profile</span>
      </div>
    `;
  }
  
  function createPostGridItem(post: Post): string {
    const userAvatarUrl = post.user?.avatar_url || 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop';
    const userName = post.user?.name || 'Unknown User';
    
    // Check if this is a text-only post (no media)
    const hasMedia = (post.media_urls && post.media_urls.length > 0) || post.image_url;
    
    // Calculate distance if nearby search is enabled and user location is available
    let distanceBadge = '';
    if (nearbySearchEnabled && userLocation && post.latitude && post.longitude) {
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        post.latitude,
        post.longitude
      );
      distanceBadge = `<span class="distance-badge">${formatDistance(distance)}</span>`;
    }
    
    if (!hasMedia) {
      // Text-only post layout
      return `
        <div class="post-grid-item text-only-post" data-post-id="${post.id}">
          <div class="grid-item-info">
            <div class="grid-item-user">
              <img src="${userAvatarUrl}" alt="${userName}" class="grid-user-avatar">
              <div class="grid-user-details">
                <span class="grid-user-name">${userName}</span>
                <span class="grid-location">
                  📍 ${post.location}${distanceBadge}
                </span>
              </div>
            </div>
            
            <div class="text-only-preview">
              <h3>${post.content.length > 80 ? post.content.substring(0, 80) + '...' : post.content}</h3>
              ${post.content.length > 80 ? `<p>${post.content.substring(80, 200)}${post.content.length > 200 ? '...' : ''}</p>` : ''}
            </div>
            
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
      `;
    }
    
    // Media post layout
    const imageUrl = (post.media_urls && post.media_urls.length > 0) 
      ? post.media_urls[0] 
      : post.image_url || 'https://images.pexels.com/photos/1761279/pexels-photo-1761279.jpeg?auto=compress&cs=tinysrgb&w=800';
    
    return `
      <div class="post-grid-item" data-post-id="${post.id}">
        <div class="grid-item-image">
          <img src="${imageUrl}" alt="Travel photo" loading="lazy">
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
              <span class="grid-location">
                📍 ${post.location}${distanceBadge}
              </span>
            </div>
          </div>
          
          <div class="grid-item-content">
            <p class="grid-content-preview">${post.content.length > 100 ? post.content.substring(0, 100) + '...' : post.content}</p>
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