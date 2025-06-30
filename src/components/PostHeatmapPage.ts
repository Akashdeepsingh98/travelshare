import * as L from 'leaflet';
// @ts-ignore - Leaflet.heat doesn't have TypeScript definitions
import 'leaflet.heat';
import { createPostCard } from './PostCard';
import { showAuthModal } from './AuthModal';
import { supabase } from '../lib/supabase';
import { calculateDistance, formatDistance, reverseGeocode } from '../utils/geolocation';
import { Post } from '../types';
import { authManager } from '../auth';

export function createPostHeatmapPage(
  onNavigateBack: () => void,
  onUserClick?: (userId: string) => void
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'heatmap-page';

  container.innerHTML = `
    <div class="heatmap-header">
      <button class="back-btn">← Back</button>
      <div class="heatmap-title-section">
        <h1>🔥 Post Heatmap</h1>
        <div class="heatmap-search-container">
          <button class="current-location-btn" title="Use my current location">
            <span class="location-icon">📍</span>
            <span class="location-text">My Location</span>
          </button>
          <div class="heatmap-search-wrapper">
            <input type="text" class="heatmap-search-input" placeholder="Search for a location...">
            <button class="heatmap-search-btn">🔍</button>
            <div class="location-suggestions" style="display: none;"></div>
          </div>
        </div>
      </div>
    </div>
    <div class="heatmap-content">
      <div id="post-heatmap-map" class="map-container"></div>
      <div class="heatmap-info">
        <p>This map shows the density of posts around the world. Hotter areas indicate more posts. Click anywhere on the map to see posts from that area.</p>
        <p>Data is based on posts with location coordinates from the TravelShare community. The posts list will update when you click on different areas.</p>
      </div>
      <div class="posts-in-area-section">
        <div class="posts-in-area-header">
          <h3 class="posts-in-area-title">Click on the map to see posts from that area</h3>
        </div>
        <div class="posts-in-area-list" id="posts-in-area-list"></div>
      </div>
    </div>
  `;

  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    .heatmap-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 2rem 1rem;
      display: flex;
      flex-direction: column;
    }

    .heatmap-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 2rem;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      padding: 1rem 1.5rem;
      border-radius: 1rem;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .heatmap-title-section {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .heatmap-header h1 {
      color: white;
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0;
    }

    .heatmap-header .back-btn {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
    }

    .heatmap-header .back-btn:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: translateY(-1px);
    }

    .heatmap-search-container {
      display: flex;
      align-items: center;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 0.5rem;
      padding: 0.25rem;
      border: 1px solid rgba(255, 255, 255, 0.3);
      position: relative;
    }
    
    .heatmap-header {
      position: relative;
      z-index: 1001;
    }
    
    .heatmap-search-wrapper {
      position: relative;
      flex: 1;
      display: flex;
    }

    .heatmap-search-input {
      background: transparent;
      border: none;
      color: white;
      padding: 0.5rem;
      width: 200px;
      outline: none;
    }

    .heatmap-search-input::placeholder {
      color: rgba(255, 255, 255, 0.7);
    }

    .heatmap-search-btn {
      background: rgba(255, 255, 255, 0.3);
      border: none;
      color: white;
      padding: 0.5rem;
      border-radius: 0.25rem;
      cursor: pointer;
      transition: all 0.2s;
      margin-right: 0.5rem;
    }

    .heatmap-search-btn:hover {
      background: rgba(255, 255, 255, 0.4);
    }
    
    .current-location-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(255, 255, 255, 0.3);
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
      margin-right: 0.5rem;
    }
    
    .current-location-btn:hover {
      background: rgba(255, 255, 255, 0.4);
      transform: translateY(-1px);
    }
    
    .current-location-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .location-icon {
      font-size: 1rem;
    }
    
    .location-text {
      font-size: 0.875rem;
    }

    .location-suggestions {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      max-height: 200px;
      overflow-y: auto;
      overflow-y: auto;
      margin-top: 0.25rem;
    }

    .location-suggestion {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      cursor: pointer;
      transition: background 0.2s;
    }

    .location-suggestion:hover {
      background: #f8fafc;
    }

    .suggestion-icon {
      color: #667eea;
      font-size: 1rem;
    }

    .suggestion-content {
      flex: 1;
    }

    .suggestion-main {
      font-weight: 500;
      color: #1e293b;
    }

    .suggestion-secondary {
      font-size: 0.875rem;
      color: #64748b;
    }

    .search-error {
      position: absolute;
      top: 10px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(239, 68, 68, 0.9);
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      z-index: 1000;
      font-size: 0.875rem;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
      max-width: 80%;
      text-align: center;
      animation: fadeIn 0.3s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translate(-50%, -10px); }
      to { opacity: 1; transform: translate(-50%, 0); }
    }

    .heatmap-content {
      background: white;
      border-radius: 1rem;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .map-container {
      flex: 1;
      min-height: 500px; /* Ensure map has a minimum height */
      width: 100%;
      background: #f0f0f0;
    }

    .posts-in-area-section {
      padding: 1.5rem;
      border-top: 1px solid #e5e7eb;
    }

    .posts-in-area-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .posts-in-area-title {
      color: #374151;
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0;
    }

    .posts-in-area-list {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .posts-in-area-empty {
      text-align: center;
      padding: 3rem 1rem;
      background: #f9fafb;
      border-radius: 0.75rem;
      border: 2px dashed #d1d5db;
    }

    .posts-in-area-empty-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
      color: #9ca3af;
    }

    .posts-in-area-empty h3 {
      color: #374151;
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0 0 0.5rem 0;
    }

    .posts-in-area-empty p {
      color: #6b7280;
      margin: 0;
      line-height: 1.5;
    }

    .posts-in-area-loading {
      text-align: center;
      padding: 3rem 1rem;
      color: #6b7280;
    }

    .heatmap-info {
      padding: 1.5rem;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 0.875rem;
      line-height: 1.5;
    }

    .heatmap-info p {
      margin-bottom: 0.5rem;
    }

    /* Responsive adjustments */
    @media (max-width: 768px) {
      .heatmap-page {
        padding: 1rem;
      }
      .heatmap-header {
        padding: 1rem;
        flex-direction: column;
        gap: 0.75rem;
        text-align: center;
      }
      
      .heatmap-title-section {
        flex-direction: column;
        gap: 0.75rem;
      }
      
      .heatmap-search-container {
        width: 100%;
      }
      
      .heatmap-search-input {
        width: 100%;
      }
      
      .map-container {
        min-height: 300px;
      }
    }
  `;

  if (!document.head.querySelector('#heatmap-page-styles')) {
    style.id = 'heatmap-page-styles';
    document.head.appendChild(style);
  }

  const backBtn = container.querySelector('.back-btn') as HTMLButtonElement;
  backBtn.addEventListener('click', onNavigateBack);

  // State variables
  let map: L.Map | null = null;
  let allPostsWithCoords: Post[] = [];
  let postsInArea: Post[] = [];
  let isLoadingPosts = false;
  let selectedArea: { lat: number; lng: number; name: string } | null = null;

  // Get current location button
  const currentLocationBtn = container.querySelector('.current-location-btn') as HTMLButtonElement;
  
  // Get search elements and suggestions container
  const searchInput = container.querySelector('.heatmap-search-input') as HTMLInputElement;
  const searchBtn = container.querySelector('.heatmap-search-btn') as HTMLButtonElement;
  const suggestionsContainer = container.querySelector('.location-suggestions') as HTMLElement;

  let searchTimeout: NodeJS.Timeout | null = null;

  // Interface for location data
  interface LocationData {
    name: string;
    lat: number;
    lng: number;
    displayName?: string;
  }

  // Function to search for locations using Nominatim
  async function searchLocations(query: string): Promise<any[]> {
    if (query.length < 3) return [];
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'TravelShare App'
          }
        }
      );
      
      if (!response.ok) throw new Error('Search failed');
      
      const results = await response.json();
      return results;
    } catch (error) {
      console.error('Error searching locations:', error);
      return [];
    }
  }

  // Function to display location suggestions
  function displaySuggestions(results: any[]) {
    if (results.length === 0) {
      suggestionsContainer.style.display = 'none';
      return;
    }
    
    suggestionsContainer.innerHTML = results.map(result => {
      const mainText = result.name || result.display_name.split(',')[0];
      const secondaryText = result.display_name.split(',').slice(1, 3).join(',').trim();
      
      return `
        <div class="location-suggestion" data-lat="${result.lat}" data-lng="${result.lon}" data-display-name="${result.display_name}">
          <div class="suggestion-icon">📍</div>
          <div class="suggestion-content">
            <div class="suggestion-main">${mainText}</div>
            <div class="suggestion-secondary">${secondaryText}</div>
          </div>
        </div>
      `;
    }).join('');
    
    suggestionsContainer.style.display = 'block';
    
    // Add click handlers for suggestions
    const suggestionElements = suggestionsContainer.querySelectorAll('.location-suggestion');
    suggestionElements.forEach(element => {
      element.addEventListener('click', () => {
        const lat = parseFloat(element.getAttribute('data-lat')!);
        const lng = parseFloat(element.getAttribute('data-lng')!);
        const displayName = element.getAttribute('data-display-name')!;
        
        const location: LocationData = {
          name: displayName,
          lat,
          lng,
          displayName
        };
        
        searchInput.value = displayName;
        suggestionsContainer.style.display = 'none';
        centerMapOnLocation(location);
      });
    });
  }

  // Function to center map on a location
  function centerMapOnLocation(location: LocationData) {
    if (!map) return;
    
    // Center map on the location
    map.setView([location.lat, location.lng], 10);
    
    // Add a marker to indicate the searched location
    const marker = L.marker([location.lat, location.lng])
      .addTo(map)
      .bindPopup(`<b>${location.displayName || location.name}</b>`)
      .openPopup();
    
    // Remove marker after 5 seconds
    setTimeout(() => {
      if (map) map.removeLayer(marker);
    }, 5000);
  }

  // Add event listeners for search input
  searchInput.addEventListener('input', (e) => {
    const query = (e.target as HTMLInputElement).value;
    
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    if (query.trim().length >= 3) {
      // Debounce search requests
      searchTimeout = setTimeout(async () => {
        const results = await searchLocations(query);
        displaySuggestions(results);
      }, 300);
    } else {
      suggestionsContainer.style.display = 'none';
    }
  });
  
  searchInput.addEventListener('blur', () => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      suggestionsContainer.style.display = 'none';
    }, 200);
  });
  
  searchInput.addEventListener('focus', () => {
    // Show suggestions again if there's text and we have results
    if (searchInput.value.trim().length >= 3 && suggestionsContainer.children.length > 0) {
      suggestionsContainer.style.display = 'block';
    }
  });

  // Function to search for a location and center the map
  const searchLocationAndCenterMap = async (query: string) => {
    if (!query.trim() || !map) return;
    
    try {
      // Show loading state
      searchBtn.textContent = '⏳';
      searchBtn.disabled = true;
      
      // Use Nominatim for geocoding (same as in LocationSelector)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'TravelShare App'
          }
        }
      );
      
      if (!response.ok) throw new Error('Search failed');
      
      const results = await response.json();
      
      // Reset search button
      searchBtn.textContent = '🔍';
      searchBtn.disabled = false;
      
      if (results.length === 0) {
        showSearchError('Location not found. Please try a different search term.');
        return;
      }
      
      // Get the first result
      const location = results[0];
      const lat = parseFloat(location.lat);
      const lng = parseFloat(location.lon);
      
      // Use the centerMapOnLocation function
      centerMapOnLocation({
        name: location.display_name,
        lat,
        lng,
        displayName: location.display_name
      });
      
    } catch (error) {
      console.error('Error searching location:', error);
      searchBtn.textContent = '🔍';
      searchBtn.disabled = false;
      showSearchError('Error searching for location. Please try again.');
    }
  };
  
  // Function to show search error
  const showSearchError = (message: string) => {
    // Remove any existing error
    const existingError = container.querySelector('.search-error');
    if (existingError) {
      existingError.remove();
    }
    
    // Create error element
    const errorElement = document.createElement('div');
    errorElement.className = 'search-error';
    errorElement.textContent = message;
    
    // Add to map container
    const mapContainer = container.querySelector('.map-container');
    if (mapContainer) {
      mapContainer.appendChild(errorElement);
      
      // Auto-remove after 3 seconds
      setTimeout(() => {
        errorElement.remove();
      }, 3000);
    }
  };
  
  // Function to get user's current location and center map
  const getUserLocationAndCenterMap = () => {
    if (!map || !navigator.geolocation) {
      showSearchError('Geolocation is not supported by your browser.');
      return;
    }
    
    // Disable button and show loading state
    currentLocationBtn.disabled = true;
    const originalText = currentLocationBtn.innerHTML;
    currentLocationBtn.innerHTML = `<span class="location-icon">⏳</span><span class="location-text">Loading...</span>`;
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Success - center map on user's location
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        map.setView([lat, lng], 13);
        
        // Add a marker to indicate the user's location
        const marker = L.marker([lat, lng])
          .addTo(map)
          .bindPopup('<b>Your Location</b>')
          .openPopup();
        
        // Remove marker after 5 seconds
        setTimeout(() => {
          if (map) map.removeLayer(marker);
        }, 5000);
        
        // Reset button
        currentLocationBtn.innerHTML = originalText;
        currentLocationBtn.disabled = false;
      },
      (error) => {
        // Error handling
        let errorMessage = 'Unable to get your location.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        
        showSearchError(errorMessage);
        
        // Reset button
        currentLocationBtn.innerHTML = originalText;
        currentLocationBtn.disabled = false;
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };
  
  // Add event listeners for search
  searchBtn.addEventListener('click', () => {
    searchLocationAndCenterMap(searchInput.value);
  });
  
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      searchLocationAndCenterMap(searchInput.value);
    }
  });
  
  // Add event listener for current location button
  currentLocationBtn.addEventListener('click', getUserLocationAndCenterMap);

  // Initialize the post list area
  function initializePostListArea() {
    const postsListContainer = container.querySelector('#posts-in-area-list') as HTMLElement;
    if (!postsListContainer) return;

    postsListContainer.innerHTML = `
      <div class="posts-in-area-empty">
        <div class="posts-in-area-empty-icon">📍</div>
        <h3>Click on the map to see posts</h3>
        <p>Select an area on the map to view posts from that location.</p>
      </div>
    `;
  }

  // Filter and display posts in the clicked area
  async function filterAndDisplayPostsInArea(lat: number, lng: number) {
    const postsListContainer = container.querySelector('#posts-in-area-list') as HTMLElement;
    if (!postsListContainer) return;

    // Set loading state
    isLoadingPosts = true;
    postsListContainer.innerHTML = `
      <div class="posts-in-area-loading">
        <div class="loading-spinner"></div>
        <p>Finding posts in this area...</p>
      </div>
    `;

    try {
      // Get location name through reverse geocoding
      const locationName = await reverseGeocode(lat, lng);
      selectedArea = { lat, lng, name: locationName };

      // Update the title
      const titleElement = container.querySelector('.posts-in-area-title') as HTMLElement;
      if (titleElement) {
        titleElement.textContent = `Posts near ${locationName}`;
      }

      // Filter posts within a certain radius (e.g., 10km)
      const radius = 10; // km
      postsInArea = allPostsWithCoords.filter(post => {
        if (!post.latitude || !post.longitude) return false;
        
        const distance = calculateDistance(
          lat,
          lng,
          post.latitude,
          post.longitude
        );
        
        // Add distance to post for display
        (post as any).distance = distance;
        
        return distance <= radius;
      });

      // Sort by distance
      postsInArea.sort((a, b) => (a as any).distance - (b as any).distance);

      // Render the posts
      renderPostsInArea();

    } catch (error) {
      console.error('Error filtering posts:', error);
      postsListContainer.innerHTML = `
        <div class="posts-in-area-empty">
          <div class="posts-in-area-empty-icon">⚠️</div>
          <h3>Error finding posts</h3>
          <p>Something went wrong while trying to find posts in this area. Please try again.</p>
        </div>
      `;
    } finally {
      isLoadingPosts = false;
    }
  }

  // Render posts in the area
  function renderPostsInArea() {
    const postsListContainer = container.querySelector('#posts-in-area-list') as HTMLElement;
    if (!postsListContainer) return;

    if (postsInArea.length === 0) {
      postsListContainer.innerHTML = `
        <div class="posts-in-area-empty">
          <div class="posts-in-area-empty-icon">🔍</div>
          <h3>No posts found in this area</h3>
          <p>Try selecting a different area on the map or zooming out to see more posts.</p>
        </div>
      `;
      return;
    }

    // Clear the container
    postsListContainer.innerHTML = '';

    // Add posts
    postsInArea.forEach(post => {
      const distance = (post as any).distance;
      const distanceText = formatDistance(distance);
      
      // Create post card
      const postCard = createPostCard(
        post,
        (postId) => handleLikeInArea(postId),
        (postId, comment) => handleCommentInArea(postId, comment),
        undefined, // No follow handler needed
        undefined, // No unfollow handler needed
        false, // Don't show follow button
        onUserClick, // Navigate to user profile when clicked
        false, // Not own profile
        undefined, // No delete handler
        undefined // No AI handler
      );
      
      // Add distance badge to post card
      const postHeader = postCard.querySelector('.post-header') as HTMLElement;
      if (postHeader) {
        const distanceBadge = document.createElement('div');
        distanceBadge.className = 'distance-badge';
        distanceBadge.textContent = distanceText;
        postHeader.appendChild(distanceBadge);
      }
      
      postsListContainer.appendChild(postCard);
    });
  }

  // Handle like action for posts in the area
  async function handleLikeInArea(postId: string) {
    const authState = authManager.getAuthState();
    if (!authState.isAuthenticated || !authState.currentUser) {
      showAuthModal();
      return;
    }
    
    try {
      const post = postsInArea.find(p => p.id === postId);
      if (!post) return;

      // Check if the user has already liked this post in the database
      const { data: existingLike } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', authState.currentUser.id)
        .maybeSingle();

      if (existingLike) {
        // Unlike the post - remove the existing like
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', authState.currentUser.id);
        
        post.user_has_liked = false;
        post.likes_count = Math.max(0, post.likes_count - 1);
      } else {
        // Like the post - insert new like
        await supabase
          .from('post_likes')
          .insert({
            post_id: postId,
            user_id: authState.currentUser.id
          });
        
        post.user_has_liked = true;
        post.likes_count = post.likes_count + 1;
      }
      
      renderPostsInArea();
    } catch (error) {
      console.error('Error handling like:', error);
    }
  }

  // Handle comment action for posts in the area
  async function handleCommentInArea(postId: string, commentText: string) {
    const authState = authManager.getAuthState();
    if (!authState.isAuthenticated || !authState.currentUser) {
      showAuthModal();
      return;
    }
    
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

      const post = postsInArea.find(p => p.id === postId);
      if (post) {
        if (!post.comments) post.comments = [];
        post.comments.push(data);
        renderPostsInArea();
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  }

  const initializeMap = async () => {
    const mapElement = container.querySelector('#post-heatmap-map') as HTMLElement;
    if (!mapElement) return;

    // Ensure map is only initialized once
    if (map) {
      map.remove();
    }

    map = L.map(mapElement).setView([20, 0], 2); // Centered globally, zoomed out

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map);

    // Set map language to English only
    map.getContainer().style.setProperty('--map-tiles-filter', 'grayscale(0.1) contrast(1.1)');

    // Add click handler to the map
    map.on('click', async (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      await filterAndDisplayPostsInArea(lat, lng);
    });

    await loadHeatmapData(map);
    
    // Initialize the post list area
    initializePostListArea();
  };

  const loadHeatmapData = async (mapInstance: L.Map): Promise<void> => {
    try {
      const authState = authManager.getAuthState();
      
      // Get all posts with coordinates and full details
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
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (error) {
        console.error('Error fetching post locations:', error);
        return;
      }

      if (!posts || posts.length === 0) {
        // Show a message if no posts with coordinates
        const mapElement = container.querySelector('#post-heatmap-map') as HTMLElement;
        const noDataOverlay = document.createElement('div');
        noDataOverlay.className = 'no-data-overlay';
        noDataOverlay.innerHTML = `
          <div class="no-data-message">
            <div class="no-data-icon">📍</div>
            <h3>No Location Data Available</h3>
            <p>Posts with location coordinates will appear on this map.</p>
          </div>
        `;
        
        // Add styles for the overlay
        const overlayStyle = document.createElement('style');
        overlayStyle.textContent = `
          .no-data-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255, 255, 255, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          }
          
          .no-data-message {
            text-align: center;
            padding: 2rem;
            max-width: 400px;
          }
          
          .no-data-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
            color: #94a3b8;
          }
          
          .no-data-message h3 {
            color: #334155;
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
          }
          
          .no-data-message p {
            color: #64748b;
          }
        `;
        document.head.appendChild(overlayStyle);
        
        mapElement.style.position = 'relative';
        mapElement.appendChild(noDataOverlay);
        return;
      }
      
      // Store all posts with coordinates for later filtering
      allPostsWithCoords = posts;
      
      // If user is authenticated, check which posts they've liked
      if (authState.isAuthenticated && authState.currentUser) {
        const { data: likes } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', authState.currentUser.id);

        const likedPostIds = new Set(likes?.map(like => like.post_id) || []);

        allPostsWithCoords = allPostsWithCoords.map(post => ({
          ...post,
          user_has_liked: likedPostIds.has(post.id)
        }));
      } else {
        allPostsWithCoords = allPostsWithCoords.map(post => ({
          ...post,
          user_has_liked: false
        }));
      }

      // Convert posts to heatmap data format [lat, lng, intensity]
      const heatData = posts.map(post => [post.latitude, post.longitude, 1]);

      // Create the heat layer
      if (heatData.length > 0) {
        // @ts-ignore - Leaflet.heat is added via import but TypeScript doesn't recognize it
        const heatLayer = L.heatLayer(heatData, { 
          radius: 25,
          blur: 15,
          maxZoom: 10,
          gradient: {
            0.4: 'blue',
            0.6: 'lime',
            0.8: 'yellow',
            1.0: 'red'
          }
        }).addTo(mapInstance);
      }

      // Add a legend
      const legend = L.control({ position: 'bottomright' });
      legend.onAdd = function() {
        const div = L.DomUtil.create('div', 'heatmap-legend');
        div.innerHTML = `
          <div class="legend-title">Post Density</div>
          <div class="legend-scale">
            <div class="legend-labels">
              <div class="legend-item">
                <span class="legend-color" style="background: blue;"></span>
                <span>Low</span>
              </div>
              <div class="legend-item">
                <span class="legend-color" style="background: lime;"></span>
                <span>Medium</span>
              </div>
              <div class="legend-item">
                <span class="legend-color" style="background: yellow;"></span>
                <span>High</span>
              </div>
              <div class="legend-item">
                <span class="legend-color" style="background: red;"></span>
                <span>Very High</span>
              </div>
            </div>
          </div>
        `;
        
        // Add styles for the legend
        const legendStyle = document.createElement('style');
        legendStyle.textContent = `
          .heatmap-legend {
            background: white;
            padding: 10px;
            border-radius: 5px;
            box-shadow: 0 0 15px rgba(0,0,0,0.2);
            line-height: 1.5;
          }
          
          .legend-title {
            font-weight: bold;
            margin-bottom: 5px;
            font-size: 14px;
            color: #333;
          }
          
          .legend-scale {
            margin-top: 5px;
          }
          
          .legend-labels {
            display: flex;
            flex-direction: column;
            gap: 5px;
          }
          
          .legend-item {
            display: flex;
            align-items: center;
            gap: 5px;
            font-size: 12px;
          }
          
          .legend-color {
            display: inline-block;
            width: 20px;
            height: 10px;
            border-radius: 2px;
          }
        `;
        document.head.appendChild(legendStyle);
        
        return div;
      };
      legend.addTo(mapInstance);

    } catch (error) {
      console.error('Error loading heatmap data:', error);
      
      // Show error in the posts list area
      const postsListContainer = container.querySelector('#posts-in-area-list') as HTMLElement;
      if (postsListContainer) {
        postsListContainer.innerHTML = `
          <div class="posts-in-area-empty">
            <div class="posts-in-area-empty-icon">⚠️</div>
            <h3>Error loading data</h3>
            <p>Something went wrong while loading the heatmap data. Please try refreshing the page.</p>
          </div>
        `;
      }
    }
  };

  // Initialize map when the component is added to the DOM
  // Use a small delay to ensure the element is fully rendered
  setTimeout(initializeMap, 100);

  return container;
}