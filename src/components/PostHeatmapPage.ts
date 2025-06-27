import * as L from 'leaflet';
// @ts-ignore - Leaflet.heat doesn't have TypeScript definitions
import 'leaflet.heat';
import { supabase } from '../lib/supabase';

export function createPostHeatmapPage(onNavigateBack: () => void): HTMLElement {
  const container = document.createElement('div');
  container.className = 'heatmap-page';

  container.innerHTML = `
    <div class="heatmap-header">
      <button class="back-btn">← Back</button>
      <div class="heatmap-title-section">
        <h1>🔥 Post Heatmap</h1>
        <div class="heatmap-search-container">
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
        <p>This map shows the density of posts around the world. Hotter areas indicate more posts.</p>
        <p>Data is based on posts with location coordinates from the TravelShare community.</p>
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
    }

    .heatmap-search-btn:hover {
      background: rgba(255, 255, 255, 0.4);
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

  // Get search elements and suggestions container
  const searchInput = container.querySelector('.heatmap-search-input') as HTMLInputElement;
  const searchBtn = container.querySelector('.heatmap-search-btn') as HTMLButtonElement;
  const suggestionsContainer = container.querySelector('.location-suggestions') as HTMLElement;

  let map: L.Map | null = null;
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
  
  // Add event listeners for search
  searchBtn.addEventListener('click', () => {
    searchLocationAndCenterMap(searchInput.value);
  });
  
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      searchLocationAndCenterMap(searchInput.value);
    }
  });

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

    await loadHeatmapData(map);
  };

  const loadHeatmapData = async (mapInstance: L.Map) => {
    try {
      const { data: posts, error } = await supabase
        .from('posts')
        .select('latitude, longitude')
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
    }
  };

  // Initialize map when the component is added to the DOM
  // Use a small delay to ensure the element is fully rendered
  setTimeout(initializeMap, 100);

  return container;
}