import { Itinerary } from '../types';
import { authManager } from '../auth';
import { supabase } from '../lib/supabase';
import { createItineraryCard } from './ItineraryCard';
import { createItineraryDetail } from './ItineraryDetail';
import { createItineraryModal } from './CreateItineraryModal';

export function createItineraryPage(
  itineraryId?: string,
  onNavigateBack: () => void,
  onNavigateToProfile?: (userId: string) => void
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'itinerary-page';
  
  let itineraries: Itinerary[] = [];
  let currentItinerary: Itinerary | null = null;
  let isLoading = false;
  
  async function loadItineraries() {
    const authState = authManager.getAuthState();
    if (!authState.isAuthenticated || !authState.currentUser) {
      renderItineraryPage();
      return;
    }
    
    isLoading = true;
    renderItineraryPage();
    
    try {
      // Load user's itineraries
      const { data, error } = await supabase
        .from('itineraries')
        .select(`
          *,
          user:profiles(*)
        `)
        .eq('user_id', authState.currentUser.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      itineraries = data || [];
      
      // If itineraryId is provided, load that specific itinerary
      if (itineraryId) {
        const { data: itineraryData, error: itineraryError } = await supabase
          .from('itineraries')
          .select(`
            *,
            user:profiles(*)
          `)
          .eq('id', itineraryId)
          .single();
        
        if (itineraryError) {
          console.error('Error loading specific itinerary:', itineraryError);
        } else {
          currentItinerary = itineraryData;
        }
      }
      
    } catch (error) {
      console.error('Error loading itineraries:', error);
    } finally {
      isLoading = false;
      renderItineraryPage();
    }
  }
  
  function renderItineraryPage() {
    const authState = authManager.getAuthState();
    
    if (currentItinerary) {
      // Render itinerary detail view
      container.innerHTML = '';
      const detailView = createItineraryDetail(
        currentItinerary.id,
        () => {
          currentItinerary = null;
          renderItineraryPage();
        },
        (itineraryId) => handleEditItinerary(itineraryId),
        (itineraryId) => handleShareItinerary(itineraryId),
        (itineraryId) => handleDeleteItinerary(itineraryId)
      );
      container.appendChild(detailView);
      return;
    }
    
    // Render itinerary list view
    container.innerHTML = `
      <div class="itinerary-page-header">
        <button class="back-btn">← Back</button>
        <h1>🗺️ Travel Itineraries</h1>
        ${authState.isAuthenticated ? `
          <button class="create-itinerary-btn">
            <span class="btn-icon">✨</span>
            <span class="btn-text">Create AI Itinerary</span>
          </button>
        ` : ''}
      </div>
      
      <div class="itinerary-page-content">
        ${!authState.isAuthenticated ? `
          <div class="itinerary-login-prompt">
            <div class="login-prompt-content">
              <div class="login-prompt-icon">🗺️</div>
              <h3>Plan Your Perfect Trip</h3>
              <p>Log in to create AI-powered travel itineraries tailored to your preferences!</p>
              <button class="itinerary-login-btn">Get Started</button>
            </div>
          </div>
        ` : isLoading ? `
          <div class="itineraries-loading">
            <div class="loading-spinner">Loading itineraries...</div>
          </div>
        ` : `
          <div class="itinerary-list-container">
            ${itineraries.length > 0 ? `
              <div class="itinerary-grid">
                ${itineraries.map(itinerary => `
                  <div class="itinerary-card-container" data-itinerary-id="${itinerary.id}"></div>
                `).join('')}
              </div>
            ` : `
              <div class="itineraries-empty">
                <div class="empty-itineraries-content">
                  <div class="empty-itineraries-icon">🗺️</div>
                  <h3>No Itineraries Yet</h3>
                  <p>Create your first AI-powered travel itinerary to plan your next adventure!</p>
                  <button class="create-first-itinerary-btn">
                    <span class="btn-icon">✨</span>
                    <span class="btn-text">Create Your First Itinerary</span>
                  </button>
                </div>
              </div>
            `}
          </div>
        `}
      </div>
    `;
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .itinerary-page {
        min-height: 100vh;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 2rem 1rem;
      }

      .itinerary-page-header {
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

      .itinerary-page-header .back-btn {
        background: rgba(255, 255, 255, 0.2);
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s;
      }

      .itinerary-page-header .back-btn:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: translateY(-1px);
      }

      .itinerary-page-header h1 {
        color: white;
        font-size: 1.75rem;
        font-weight: 600;
        margin: 0;
      }

      .create-itinerary-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: rgba(255, 255, 255, 0.2);
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s;
      }

      .create-itinerary-btn:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: translateY(-1px);
      }

      .itinerary-page-content {
        background: white;
        border-radius: 1rem;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        padding: 2rem;
      }

      .itinerary-login-prompt {
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

      .itinerary-login-btn {
        background: #667eea;
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 0.5rem;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.2s;
      }

      .itinerary-login-btn:hover {
        background: #5a67d8;
        transform: translateY(-1px);
      }

      .itineraries-loading {
        text-align: center;
        padding: 2rem;
        color: #64748b;
      }

      .itinerary-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1.5rem;
      }

      .itineraries-empty {
        text-align: center;
        padding: 3rem 1rem;
      }

      .empty-itineraries-content {
        max-width: 400px;
        margin: 0 auto;
      }

      .empty-itineraries-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
        color: #667eea;
      }

      .empty-itineraries-content h3 {
        color: #1e293b;
        font-size: 1.5rem;
        font-weight: 600;
        margin: 0 0 0.5rem 0;
      }

      .empty-itineraries-content p {
        color: #64748b;
        margin: 0 0 1.5rem 0;
        line-height: 1.6;
      }

      .create-first-itinerary-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: #667eea;
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 0.5rem;
        cursor: pointer;
        font-weight: 500;
        margin: 0 auto;
        transition: all 0.2s;
      }

      .create-first-itinerary-btn:hover {
        background: #5a67d8;
        transform: translateY(-1px);
      }

      /* Responsive design */
      @media (max-width: 768px) {
        .itinerary-page {
          padding: 1rem;
        }

        .itinerary-page-header {
          padding: 1rem;
          flex-direction: column;
          gap: 1rem;
        }

        .itinerary-page-content {
          padding: 1.5rem;
        }

        .itinerary-grid {
          grid-template-columns: 1fr;
        }
      }
    `;
    
    if (!document.head.querySelector('#itinerary-page-styles')) {
      style.id = 'itinerary-page-styles';
      document.head.appendChild(style);
    }
    
    // Add event listeners
    const backBtn = container.querySelector('.back-btn') as HTMLButtonElement;
    backBtn?.addEventListener('click', onNavigateBack);
    
    const createBtn = container.querySelector('.create-itinerary-btn') as HTMLButtonElement;
    createBtn?.addEventListener('click', openCreateItineraryModal);
    
    const createFirstBtn = container.querySelector('.create-first-itinerary-btn') as HTMLButtonElement;
    createFirstBtn?.addEventListener('click', openCreateItineraryModal);
    
    const loginBtn = container.querySelector('.itinerary-login-btn') as HTMLButtonElement;
    loginBtn?.addEventListener('click', () => {
      const authModal = document.querySelector('.auth-modal') as HTMLElement;
      if (authModal) {
        authModal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    });
    
    // Render itinerary cards
    const cardContainers = container.querySelectorAll('.itinerary-card-container');
    cardContainers.forEach((container, index) => {
      const itinerary = itineraries[index];
      if (!itinerary) return;
      
      const card = createItineraryCard(
        itinerary,
        (itineraryId) => handleViewItinerary(itineraryId),
        (itineraryId) => handleDeleteItinerary(itineraryId),
        (itineraryId) => handleShareItinerary(itineraryId)
      );
      
      container.appendChild(card);
    });
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
  
  function handleViewItinerary(itineraryId: string) {
    const itinerary = itineraries.find(i => i.id === itineraryId);
    if (itinerary) {
      currentItinerary = itinerary;
      renderItineraryPage();
    }
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
      
      // If we're viewing this itinerary, go back to the list
      if (currentItinerary?.id === itineraryId) {
        currentItinerary = null;
      }
      
      // Reload itineraries
      await loadItineraries();
      
    } catch (error) {
      console.error('Error deleting itinerary:', error);
      alert('Failed to delete itinerary. Please try again.');
    }
  }
  
  async function handleShareItinerary(itineraryId: string) {
    const itinerary = itineraries.find(i => i.id === itineraryId);
    if (!itinerary) return;
    
    // For now, just toggle public/private status
    try {
      const { error } = await supabase
        .from('itineraries')
        .update({ is_public: !itinerary.is_public })
        .eq('id', itineraryId);
      
      if (error) throw error;
      
      // Update local state
      itinerary.is_public = !itinerary.is_public;
      
      // If we're viewing this itinerary, update the current itinerary
      if (currentItinerary?.id === itineraryId) {
        currentItinerary = { ...itinerary };
      }
      
      // Reload itineraries
      await loadItineraries();
      
      // Show success message
      alert(`Itinerary is now ${itinerary.is_public ? 'public' : 'private'}`);
      
    } catch (error) {
      console.error('Error updating itinerary privacy:', error);
      alert('Failed to update itinerary privacy. Please try again.');
    }
  }
  
  async function handleEditItinerary(itineraryId: string) {
    // For now, just toggle public/private status
    const itinerary = itineraries.find(i => i.id === itineraryId);
    if (!itinerary) return;
    
    try {
      const { error } = await supabase
        .from('itineraries')
        .update({ is_public: !itinerary.is_public })
        .eq('id', itineraryId);
      
      if (error) throw error;
      
      // Update local state
      itinerary.is_public = !itinerary.is_public;
      
      // If we're viewing this itinerary, update the current itinerary
      if (currentItinerary?.id === itineraryId) {
        currentItinerary = { ...itinerary };
        renderItineraryPage();
      }
      
    } catch (error) {
      console.error('Error updating itinerary:', error);
      alert('Failed to update itinerary. Please try again.');
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