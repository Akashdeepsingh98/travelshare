// Geocoding utility functions
import { GeolocationPosition } from './geolocation';

/**
 * Reverse geocode coordinates to get a location name
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
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

/**
 * Forward geocode a location name to get coordinates
 */
export async function forwardGeocode(query: string): Promise<GeolocationPosition | null> {
  if (query.length < 3) return null;
  
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'TravelShare App'
        }
      }
    );
    
    if (!response.ok) throw new Error('Forward geocoding failed');
    
    const results = await response.json();
    
    if (results.length === 0) return null;
    
    return {
      latitude: parseFloat(results[0].lat),
      longitude: parseFloat(results[0].lon)
    };
  } catch (error) {
    console.error('Error forward geocoding:', error);
    return null;
  }
}

/**
 * Search for locations by name
 */
export async function searchLocations(query: string): Promise<any[]> {
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