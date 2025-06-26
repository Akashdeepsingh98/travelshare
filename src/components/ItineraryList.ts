import { Itinerary } from '../types';
import { authManager } from '../auth';
import { supabase } from '../lib/supabase';
import { createItineraryCard } from './ItineraryCard';
import { createItineraryModal } from './CreateItineraryModal';

export function createItineraryList(
  userId?: string,
  onItineraryClick?: (itineraryId: string) => void
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'itinerary-list-section';
  
  let itineraries: Itinerary[] = [];
  let isLoading = false;
  let isOwnProfile = false;
  
  async function loadItineraries() {
    const authState = authManager.getAuthState();
    
    // Determine if this is the user's own profile
    isOwnProfile = authState.isAuthenticated && 
                  authState.currentUser && 
                  (userId ? authState.currentUser.id === userId : true);
    
    isLoading = true;
    renderItineraryList();
    
    try {
      let query = supabase
        .from('itineraries')
        .select(`
          *,
          user:profiles(*)
        `)
        .order('created_at', { ascending: false });
      
      // If viewing a specific user's profile
      if (userId) {
        query = query.eq('user_id', userId);
        
        // If not own profile, only show public itineraries
        if (!isOwnProfile) {
          query = query.eq('is_public', true);
        }
      } else if (authState.isAuthenticated && authState.currentUser) {
        // If on own profile page with no userId specified, show own itineraries
        query = query.eq('user_id', authState.currentUser.id);
      } else {
        // If not authenticated and no userId, show public itineraries
        query = query.eq('is_public', true);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      itineraries = data || [];
      
    } catch (error) {
      console.error('Error loading itineraries:', error);
    } finally {
      isLoading = false;
      renderItineraryList();
    }
  }
  
  function renderItineraryList() {
    const authState = authManager.getAuthState();
    
    container.innerHTML = `
      <div class="itinerary-section-header">
        <h3>
          <span class="section-icon">🗺️</span>
          ${userId && !isOwnProfile 
            ? 'Public Itineraries' 
            : 'My Travel Itineraries'}
        </h3>
        <div class="header-right">
          <span class="itinerary-count">${itineraries.length} itinerary${itineraries.length === 1 ? '' : 'ies'}</span>
          ${isOwnProfile ? `
            <button class="create-itinerary-btn">
              <span class="btn-icon">✨</span>
              <span class="btn-text">Create AI Itinerary</span>
            </button>
          ` : ''}
        </div>
      </div>
      
      ${isLoading ? `
        <div class="itineraries-loading">
          <div class="loading-spinner">Loading itineraries...</div>
        </div>
      ` : itineraries.length === 0 ? `
        <div class="itineraries-empty">
          <div class="empty-itineraries-content">
            <div class="empty-itineraries-icon">🗺️</div>
            <h3>${isOwnProfile 
              ? 'No Itineraries Yet' 
              : 'No Public Itineraries'}</h3>
            <p>${isOwnProfile 
              ? 'Create your first AI-powered travel itinerary to plan your next adventure!' 
              : 'This user has not shared any public itineraries yet.'}</p>
            ${isOwnProfile ? `
              <button class="create-first-itinerary-btn">
                <span class="btn-icon">✨</span>
                <span class="btn-text">Create Your First Itinerary</span>
              </button>
            ` : ''}
          </div>
        </div>
      ` : `
        <div class="itinerary-grid" id="itinerary-grid"></div>
      `}
    `;
    
    // Render itinerary cards
    const itineraryGrid = container.querySelector('#itinerary-grid');
    if (itineraryGrid && itineraries.length > 0) {
      itineraries.forEach(itinerary => {
        const card = createItineraryCard(
          itinerary,
          (itineraryId) => {
            if (onItineraryClick) {
              onItineraryClick(itineraryId);
            }
          },
          isOwnProfile ? (itineraryId) => handleDeleteItinerary(itineraryId) : undefined,
          isOwnProfile ? (itineraryId) => handleShareItinerary(itineraryId) : undefined
        );
        
        itineraryGrid.appendChild(card);
      });
    }
    
    // Add event listeners
    const createBtn = container.querySelector('.create-itinerary-btn') as HTMLButtonElement;
    const createFirstBtn = container.querySelector('.create-first-itinerary-btn') as HTMLButtonElement;
    
    createBtn?.addEventListener('click', openCreateItineraryModal);
    createFirstBtn?.addEventListener('click', openCreateItineraryModal);
  }
  
  function openCreateItineraryModal() {
    const modal = createItineraryModal(
      () => {}, // onClose - no action needed
      () => {
        // Reload itineraries after successful creation
        loadItineraries();
      }
    );
    
    document.body.appendChild(modal);
  }
  
  async function handleDeleteItinerary(itineraryId: string) {
    try {
      // First delete all itinerary items
      const { error: itemsError } = await supabase
        .from('itinerary_items')
        .delete()
        .eq('itinerary_id', itineraryId);
      
      if (itemsError) throw itemsError;
      
      // Then delete the itinerary
      const { error } = await supabase
        .from('itineraries')
        .delete()
        .eq('id', itineraryId);
      
      if (error) throw error;
      
      // Reload itineraries
      await loadItineraries();
      
    } catch (error) {
      console.error('Error deleting itinerary:', error);
      alert('Failed to delete itinerary. Please try again.');
    }
  }
  
  function handleShareItinerary(itineraryId: string) {
    const itinerary = itineraries.find(i => i.id === itineraryId);
    if (!itinerary) return;
    
    // For now, just toggle public/private status
    toggleItineraryPrivacy(itineraryId, !itinerary.is_public);
  }
  
  async function toggleItineraryPrivacy(itineraryId: string, isPublic: boolean) {
    try {
      const { error } = await supabase
        .from('itineraries')
        .update({ is_public: isPublic })
        .eq('id', itineraryId);
      
      if (error) throw error;
      
      // Reload itineraries
      await loadItineraries();
      
    } catch (error) {
      console.error('Error updating itinerary privacy:', error);
      alert('Failed to update itinerary privacy. Please try again.');
    }
  }
  
  // Initial load
  loadItineraries();
  
  // Listen for auth changes
  authManager.onAuthChange(() => {
    loadItineraries();
  });
  
  return container;
}