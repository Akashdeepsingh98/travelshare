import * as L from 'leaflet';

export interface LocationData {
  name: string;
  lat?: number;
  lng?: number;
  displayName?: string;
}

export function createLocationSelector(
  onLocationSelect: (location: LocationData) => void,
  initialLocation?: string
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'location-selector';
  
  container.innerHTML = `
    <div class="location-input-container">
      <div class="location-icon">📍</div>
      <input type="text" placeholder="Add location" class="location-input" value="${initialLocation || ''}">
      <button class="current-location-btn" title="Use current location">
        <span class="location-icon">🎯</span>
      </button>
      <button class="map-selector-btn" title="Select on map">
        <span class="location-icon">🗺️</span>
      </button>
    </div>
    
    <div class="location-suggestions" style="display: none;"></div>
    
    <!-- Map Modal -->
    <div class="map-modal" style="display: none;">
      <div class="map-modal-backdrop"></div>
      <div class="map-modal-content">
        <div class="map-modal-header">
          <h3>Select Location</h3>
          <button class="map-modal-close">✕</button>
        </div>
        <div class="map-container" id="map-container"></div>
        <div class="map-modal-footer">
          <div class="selected-location-info">
            <span class="selected-location-text">Tap on the map to select a location</span>
          </div>
          <div class="map-modal-actions">
            <button class="map-cancel-btn">Cancel</button>
            <button class="map-confirm-btn" disabled>Confirm Location</button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  const locationInput = container.querySelector('.location-input') as HTMLInputElement;
  const currentLocationBtn = container.querySelector('.current-location-btn') as HTMLButtonElement;
  const mapSelectorBtn = container.querySelector('.map-selector-btn') as HTMLButtonElement;
  const suggestionsContainer = container.querySelector('.location-suggestions') as HTMLElement;
  const mapModal = container.querySelector('.map-modal') as HTMLElement;
  const mapModalBackdrop = container.querySelector('.map-modal-backdrop') as HTMLElement;
  const mapModalClose = container.querySelector('.map-modal-close') as HTMLButtonElement;
  const mapContainer = container.querySelector('#map-container') as HTMLElement;
  const selectedLocationText = container.querySelector('.selected-location-text') as HTMLElement;
  const mapCancelBtn = container.querySelector('.map-cancel-btn') as HTMLButtonElement;
  const mapConfirmBtn = container.querySelector('.map-confirm-btn') as HTMLButtonElement;
  
  let map: L.Map | null = null;
  let marker: L.Marker | null = null;
  let selectedMapLocation: LocationData | null = null;
  let searchTimeout: NodeJS.Timeout | null = null;
  let userLocation: [number, number] | null = null;
  
  // Nominatim geocoding service (OpenStreetMap)
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
  
  // Reverse geocoding
  async function reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'TravelShare App'
          }
        }
      );
      
      if (!response.ok) throw new Error('Reverse geocoding failed');
      
      const result = await response.json();
      return result.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  }
  
  // Get user's current location for map centering
  function getUserLocation(): Promise<[number, number]> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: [number, number] = [position.coords.latitude, position.coords.longitude];
          userLocation = coords;
          resolve(coords);
        },
        (error) => {
          console.log('Could not get user location for map centering:', error.message);
          // Fallback to default location (New York City)
          const defaultCoords: [number, number] = [40.7128, -74.0060];
          resolve(defaultCoords);
        },
        {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }
  
  // Get location suggestions
  async function getLocationSuggestions(query: string) {
    if (query.length < 3) {
      suggestionsContainer.style.display = 'none';
      return;
    }
    
    const results = await searchLocations(query);
    displaySuggestions(results);
  }
  
  // Display location suggestions
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
        
        locationInput.value = displayName;
        suggestionsContainer.style.display = 'none';
        onLocationSelect(location);
      });
    });
  }
  
  // Get current location
  function getCurrentLocation() {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }
    
    currentLocationBtn.disabled = true;
    currentLocationBtn.innerHTML = '<span class="location-icon">⏳</span>';
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        try {
          const displayName = await reverseGeocode(lat, lng);
          
          const location: LocationData = {
            name: displayName,
            lat,
            lng,
            displayName
          };
          
          locationInput.value = displayName;
          onLocationSelect(location);
        } catch (error) {
          console.error('Error getting location name:', error);
          const location: LocationData = {
            name: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
            lat,
            lng
          };
          
          locationInput.value = location.name;
          onLocationSelect(location);
        } finally {
          currentLocationBtn.disabled = false;
          currentLocationBtn.innerHTML = '<span class="location-icon">🎯</span>';
        }
      },
      (error) => {
        currentLocationBtn.disabled = false;
        currentLocationBtn.innerHTML = '<span class="location-icon">🎯</span>';
        
        let message = 'Unable to get your location.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location access denied. Please enable location permissions.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            message = 'Location request timed out.';
            break;
        }
        alert(message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  }
  
  // Initialize map
  async function initializeMap() {
    if (!map) {
      // Get user location or fallback to default
      const centerCoords = await getUserLocation();
      
      map = L.map(mapContainer, {
        center: centerCoords,
        zoom: userLocation ? 13 : 2, // Zoom in if we have user location
        zoomControl: true,
        attributionControl: true
      });
      
      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);
      
      // Create marker
      marker = L.marker(centerCoords, {
        draggable: true
      }).addTo(map);
      
      marker.setOpacity(0); // Hide initially
      
      // Map click handler
      map.on('click', async (event: L.LeafletMouseEvent) => {
        const lat = event.latlng.lat;
        const lng = event.latlng.lng;
        
        marker!.setLatLng([lat, lng]);
        marker!.setOpacity(1);
        
        try {
          const displayName = await reverseGeocode(lat, lng);
          
          selectedMapLocation = {
            name: displayName,
            lat,
            lng,
            displayName
          };
          
          selectedLocationText.textContent = displayName;
          mapConfirmBtn.disabled = false;
        } catch (error) {
          console.error('Error getting location name:', error);
          selectedMapLocation = {
            name: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
            lat,
            lng
          };
          
          selectedLocationText.textContent = selectedMapLocation.name;
          mapConfirmBtn.disabled = false;
        }
      });
      
      // Marker drag handler
      marker.on('dragend', async () => {
        const position = marker!.getLatLng();
        const lat = position.lat;
        const lng = position.lng;
        
        try {
          const displayName = await reverseGeocode(lat, lng);
          
          selectedMapLocation = {
            name: displayName,
            lat,
            lng,
            displayName
          };
          
          selectedLocationText.textContent = displayName;
          mapConfirmBtn.disabled = false;
        } catch (error) {
          console.error('Error getting location name:', error);
          selectedMapLocation = {
            name: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
            lat,
            lng
          };
          
          selectedLocationText.textContent = selectedMapLocation.name;
          mapConfirmBtn.disabled = false;
        }
      });
    }
  }
  
  // Open map modal
  function openMapModal() {
    mapModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Initialize map if not already done
    setTimeout(async () => {
      await initializeMap();
      if (map) {
        map.invalidateSize(); // Refresh map size
      }
    }, 100);
  }
  
  // Close map modal
  function closeMapModal() {
    mapModal.style.display = 'none';
    document.body.style.overflow = '';
    selectedMapLocation = null;
    selectedLocationText.textContent = 'Tap on the map to select a location';
    mapConfirmBtn.disabled = true;
    if (marker) {
      marker.setOpacity(0);
    }
  }
  
  // Event listeners
  locationInput.addEventListener('input', (e) => {
    const query = (e.target as HTMLInputElement).value;
    
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    if (query.trim()) {
      // Debounce search requests
      searchTimeout = setTimeout(() => {
        getLocationSuggestions(query);
      }, 300);
    } else {
      suggestionsContainer.style.display = 'none';
    }
  });
  
  locationInput.addEventListener('blur', () => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      suggestionsContainer.style.display = 'none';
    }, 200);
  });
  
  locationInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const value = locationInput.value.trim();
      if (value) {
        onLocationSelect({ name: value });
        suggestionsContainer.style.display = 'none';
      }
    }
  });
  
  currentLocationBtn.addEventListener('click', getCurrentLocation);
  mapSelectorBtn.addEventListener('click', openMapModal);
  mapModalBackdrop.addEventListener('click', closeMapModal);
  mapModalClose.addEventListener('click', closeMapModal);
  mapCancelBtn.addEventListener('click', closeMapModal);
  
  mapConfirmBtn.addEventListener('click', () => {
    if (selectedMapLocation) {
      locationInput.value = selectedMapLocation.name;
      onLocationSelect(selectedMapLocation);
      closeMapModal();
    }
  });
  
  return container;
}