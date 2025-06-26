import { Itinerary, ItineraryItem } from '../types';
import { authManager } from '../auth';
import { supabase } from '../lib/supabase';

export function createItineraryDetail(
  itineraryId: string,
  onNavigateBack: () => void,
  onEdit?: (itineraryId: string) => void,
  onShare?: (itineraryId: string) => void,
  onDelete?: (itineraryId: string) => void
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'itinerary-detail-page';
  
  let itinerary: Itinerary | null = null;
  let itineraryItems: ItineraryItem[] = [];
  let isLoading = false;
  let isOwner = false;
  
  async function loadItineraryData() {
    isLoading = true;
    renderItineraryDetail();
    
    try {
      // Load itinerary details
      const { data: itineraryData, error: itineraryError } = await supabase
        .from('itineraries')
        .select(`
          *,
          user:profiles(*)
        `)
        .eq('id', itineraryId)
        .single();
      
      if (itineraryError) throw itineraryError;
      
      itinerary = itineraryData;
      
      // Check if user is the owner
      const authState = authManager.getAuthState();
      isOwner = authState.isAuthenticated && authState.currentUser?.id === itinerary.user_id;
      
      // Load itinerary items
      const { data: itemsData, error: itemsError } = await supabase
        .from('itinerary_items')
        .select('*')
        .eq('itinerary_id', itineraryId)
        .order('day', { ascending: true })
        .order('order', { ascending: true });
      
      if (itemsError) throw itemsError;
      
      itineraryItems = itemsData || [];
      
    } catch (error) {
      console.error('Error loading itinerary data:', error);
    } finally {
      isLoading = false;
      renderItineraryDetail();
    }
  }
  
  function renderItineraryDetail() {
    const authState = authManager.getAuthState();
    const canView = itinerary && (itinerary.is_public || isOwner);
    
    container.innerHTML = `
      <div class="itinerary-detail-header">
        <button class="back-btn">← Back</button>
        ${itinerary ? `
          <div class="itinerary-header-content">
            <h1>${itinerary.title}</h1>
            <div class="itinerary-header-meta">
              <span class="privacy-badge ${itinerary.is_public ? 'public' : 'private'}">
                ${itinerary.is_public ? '🌍 Public' : '🔒 Private'}
              </span>
              <span class="destination-badge">📍 ${itinerary.destination}</span>
            </div>
          </div>
          ${isOwner ? `
            <div class="itinerary-header-actions">
              ${onShare ? `
                <button class="share-itinerary-btn" title="Share Itinerary">
                  <span class="btn-icon">🔄</span>
                  <span class="btn-text">Share</span>
                </button>
              ` : ''}
              ${onEdit ? `
                <button class="edit-itinerary-btn" title="Edit Itinerary">
                  <span class="btn-icon">✏️</span>
                  <span class="btn-text">Edit</span>
                </button>
              ` : ''}
              ${onDelete ? `
                <button class="delete-itinerary-btn" title="Delete Itinerary">
                  <span class="btn-icon">🗑️</span>
                  <span class="btn-text">Delete</span>
                </button>
              ` : ''}
            </div>
          ` : ''}
        ` : ''}
      </div>
      
      ${isLoading ? `
        <div class="itinerary-detail-loading">
          <div class="loading-spinner">Loading itinerary...</div>
        </div>
      ` : !itinerary ? `
        <div class="itinerary-not-found">
          <div class="not-found-content">
            <div class="not-found-icon">🔍</div>
            <h3>Itinerary Not Found</h3>
            <p>The itinerary you're looking for doesn't exist or you don't have permission to view it.</p>
            <button class="back-to-profile-btn">Back to Profile</button>
          </div>
        </div>
      ` : !canView ? `
        <div class="private-itinerary-message">
          <div class="private-content">
            <div class="private-icon">🔒</div>
            <h3>Private Itinerary</h3>
            <p>This is a private itinerary. Only the owner can view it.</p>
            <button class="back-to-profile-btn">Back to Profile</button>
          </div>
        </div>
      ` : `
        <div class="itinerary-detail-content">
          <div class="itinerary-overview">
            <div class="overview-header">
              <h2>Trip Overview</h2>
            </div>
            
            <div class="overview-details">
              <div class="overview-row">
                <div class="overview-item">
                  <div class="overview-icon">📍</div>
                  <div class="overview-info">
                    <h4>Destination</h4>
                    <p>${itinerary.destination}</p>
                  </div>
                </div>
                
                <div class="overview-item">
                  <div class="overview-icon">📅</div>
                  <div class="overview-info">
                    <h4>Dates</h4>
                    <p>${itinerary.start_date && itinerary.end_date 
                      ? `${formatDate(itinerary.start_date)} - ${formatDate(itinerary.end_date)}` 
                      : 'No dates specified'}</p>
                  </div>
                </div>
                
                <div class="overview-item">
                  <div class="overview-icon">💰</div>
                  <div class="overview-info">
                    <h4>Budget</h4>
                    <p>${itinerary.budget ? formatBudget(itinerary.budget) : 'Not specified'}</p>
                  </div>
                </div>
              </div>
              
              ${itinerary.notes ? `
                <div class="overview-notes">
                  <h4>Notes</h4>
                  <p>${itinerary.notes}</p>
                </div>
              ` : ''}
              
              ${itinerary.preferences && itinerary.preferences.length > 0 ? `
                <div class="overview-preferences">
                  <h4>Preferences</h4>
                  <div class="preferences-list">
                    ${formatPreferences(itinerary.preferences).map(pref => `
                      <span class="preference-tag">${pref}</span>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
            </div>
          </div>
          
          <div class="itinerary-days">
            ${renderItineraryDays(itineraryItems)}
          </div>
          
          <div class="itinerary-footer">
            <div class="itinerary-created-by">
              <span>Created by ${itinerary.user?.name || 'Unknown'}</span>
              <span class="created-date">on ${formatDate(itinerary.created_at)}</span>
            </div>
            
            <div class="itinerary-actions">
              <button class="print-itinerary-btn">
                <span class="btn-icon">🖨️</span>
                <span class="btn-text">Print</span>
              </button>
              
              ${isOwner ? `
                <button class="toggle-privacy-btn">
                  <span class="btn-icon">${itinerary.is_public ? '🔒' : '🌍'}</span>
                  <span class="btn-text">Make ${itinerary.is_public ? 'Private' : 'Public'}</span>
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      `}
    `;
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .itinerary-detail-page {
        min-height: 100vh;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 2rem 1rem;
      }

      .itinerary-detail-header {
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

      .itinerary-detail-header .back-btn {
        background: rgba(255, 255, 255, 0.2);
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s;
      }

      .itinerary-detail-header .back-btn:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: translateY(-1px);
      }

      .itinerary-header-content {
        flex: 1;
        text-align: center;
      }

      .itinerary-header-content h1 {
        color: white;
        font-size: 1.75rem;
        font-weight: 600;
        margin: 0 0 0.25rem 0;
      }

      .itinerary-header-meta {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
      }

      .privacy-badge, .destination-badge {
        background: rgba(255, 255, 255, 0.2);
        color: white;
        padding: 0.25rem 0.75rem;
        border-radius: 1rem;
        font-size: 0.75rem;
        font-weight: 500;
      }

      .privacy-badge.private {
        background: rgba(239, 68, 68, 0.2);
      }

      .privacy-badge.public {
        background: rgba(16, 185, 129, 0.2);
      }

      .itinerary-header-actions {
        display: flex;
        gap: 0.5rem;
      }

      .share-itinerary-btn, .edit-itinerary-btn, .delete-itinerary-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
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

      .share-itinerary-btn:hover {
        background: rgba(16, 185, 129, 0.4);
      }

      .edit-itinerary-btn:hover {
        background: rgba(102, 126, 234, 0.4);
      }

      .delete-itinerary-btn:hover {
        background: rgba(239, 68, 68, 0.4);
      }

      .itinerary-detail-content {
        background: white;
        border-radius: 1rem;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        overflow: hidden;
      }

      .itinerary-overview {
        padding: 2rem;
        border-bottom: 1px solid #f1f5f9;
      }

      .overview-header h2 {
        color: #1e293b;
        font-size: 1.5rem;
        font-weight: 600;
        margin: 0 0 1.5rem 0;
      }

      .overview-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1.5rem;
        margin-bottom: 1.5rem;
      }

      .overview-item {
        display: flex;
        gap: 1rem;
      }

      .overview-icon {
        font-size: 1.5rem;
        color: #667eea;
        flex-shrink: 0;
      }

      .overview-info h4 {
        color: #334155;
        font-size: 0.875rem;
        font-weight: 600;
        margin: 0 0 0.25rem 0;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .overview-info p {
        color: #1e293b;
        font-size: 1rem;
        margin: 0;
      }

      .overview-notes {
        margin-bottom: 1.5rem;
      }

      .overview-notes h4 {
        color: #334155;
        font-size: 0.875rem;
        font-weight: 600;
        margin: 0 0 0.5rem 0;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .overview-notes p {
        color: #64748b;
        line-height: 1.6;
        margin: 0;
        padding: 1rem;
        background: #f8fafc;
        border-radius: 0.5rem;
        border-left: 3px solid #667eea;
      }

      .overview-preferences h4 {
        color: #334155;
        font-size: 0.875rem;
        font-weight: 600;
        margin: 0 0 0.5rem 0;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .preferences-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .preference-tag {
        background: #f1f5f9;
        color: #334155;
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        font-size: 0.75rem;
        font-weight: 500;
      }

      .itinerary-days {
        padding: 2rem;
      }

      .day-container {
        margin-bottom: 2rem;
      }

      .day-container:last-child {
        margin-bottom: 0;
      }

      .day-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1rem;
        padding-bottom: 0.5rem;
        border-bottom: 2px solid #f1f5f9;
      }

      .day-number {
        background: #667eea;
        color: white;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        flex-shrink: 0;
      }

      .day-title {
        color: #1e293b;
        font-size: 1.25rem;
        font-weight: 600;
        margin: 0;
      }

      .day-items {
        padding-left: 3rem;
      }

      .day-item {
        position: relative;
        padding-left: 2rem;
        margin-bottom: 1.5rem;
      }

      .day-item:last-child {
        margin-bottom: 0;
      }

      .day-item:before {
        content: "";
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 2px;
        background: #e2e8f0;
      }

      .day-item:after {
        content: "";
        position: absolute;
        left: -4px;
        top: 8px;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: #667eea;
      }

      .item-time {
        color: #667eea;
        font-weight: 600;
        font-size: 0.875rem;
        margin-bottom: 0.25rem;
      }

      .item-title {
        color: #1e293b;
        font-weight: 600;
        font-size: 1rem;
        margin: 0 0 0.25rem 0;
      }

      .item-location {
        color: #64748b;
        font-size: 0.875rem;
        margin-bottom: 0.5rem;
        display: flex;
        align-items: center;
        gap: 0.25rem;
      }

      .item-description {
        color: #334155;
        font-size: 0.875rem;
        line-height: 1.6;
        margin-bottom: 0.5rem;
      }

      .item-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        margin-top: 0.5rem;
      }

      .item-category, .item-cost {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        color: #64748b;
        font-size: 0.75rem;
      }

      .category-badge {
        background: #f1f5f9;
        color: #334155;
        padding: 0.125rem 0.375rem;
        border-radius: 0.25rem;
        font-size: 0.75rem;
        font-weight: 500;
      }

      .category-badge.accommodation {
        background: #fee2e2;
        color: #b91c1c;
      }

      .category-badge.activity {
        background: #e0f2fe;
        color: #0369a1;
      }

      .category-badge.food {
        background: #ecfccb;
        color: #4d7c0f;
      }

      .category-badge.transportation {
        background: #fef3c7;
        color: #92400e;
      }

      .category-badge.other {
        background: #f1f5f9;
        color: #334155;
      }

      .item-notes {
        margin-top: 0.5rem;
        padding: 0.5rem;
        background: #f8fafc;
        border-radius: 0.25rem;
        font-size: 0.75rem;
        color: #64748b;
        font-style: italic;
      }

      .itinerary-footer {
        padding: 1.5rem 2rem;
        border-top: 1px solid #f1f5f9;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .itinerary-created-by {
        color: #64748b;
        font-size: 0.875rem;
      }

      .created-date {
        color: #94a3b8;
        font-size: 0.75rem;
      }

      .itinerary-actions {
        display: flex;
        gap: 0.75rem;
      }

      .print-itinerary-btn, .toggle-privacy-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: #f1f5f9;
        color: #334155;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        cursor: pointer;
        font-size: 0.875rem;
        font-weight: 500;
        transition: all 0.2s;
      }

      .print-itinerary-btn:hover {
        background: #e2e8f0;
      }

      .toggle-privacy-btn:hover {
        background: #667eea;
        color: white;
      }

      .itinerary-detail-loading {
        text-align: center;
        padding: 4rem 1rem;
        background: white;
        border-radius: 1rem;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      }

      .itinerary-not-found, .private-itinerary-message {
        text-align: center;
        padding: 4rem 1rem;
        background: white;
        border-radius: 1rem;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      }

      .not-found-content, .private-content {
        max-width: 400px;
        margin: 0 auto;
      }

      .not-found-icon, .private-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
        color: #94a3b8;
      }

      .not-found-content h3, .private-content h3 {
        color: #334155;
        font-size: 1.25rem;
        font-weight: 600;
        margin: 0 0 0.5rem 0;
      }

      .not-found-content p, .private-content p {
        color: #64748b;
        margin: 0 0 1.5rem 0;
      }

      .back-to-profile-btn {
        background: #667eea;
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 0.5rem;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s;
      }

      .back-to-profile-btn:hover {
        background: #5a67d8;
        transform: translateY(-1px);
      }

      /* Responsive design */
      @media (max-width: 768px) {
        .itinerary-detail-page {
          padding: 1rem;
        }

        .itinerary-detail-header {
          padding: 1rem;
          flex-direction: column;
          gap: 1rem;
        }

        .itinerary-header-content h1 {
          font-size: 1.5rem;
        }

        .itinerary-overview {
          padding: 1.5rem;
        }

        .overview-row {
          grid-template-columns: 1fr;
        }

        .itinerary-days {
          padding: 1.5rem;
        }

        .day-items {
          padding-left: 1.5rem;
        }

        .itinerary-footer {
          padding: 1.5rem;
          flex-direction: column;
          gap: 1rem;
          align-items: flex-start;
        }
      }
    `;
    
    if (!document.head.querySelector('#itinerary-detail-styles')) {
      style.id = 'itinerary-detail-styles';
      document.head.appendChild(style);
    }
    
    setupEventListeners();
  }
  
  function renderItineraryDays(items: ItineraryItem[]): string {
    if (items.length === 0) {
      return `
        <div class="empty-days">
          <p>No itinerary items found. This itinerary is empty.</p>
        </div>
      `;
    }
    
    // Group items by day
    const itemsByDay = items.reduce((acc, item) => {
      if (!acc[item.day]) {
        acc[item.day] = [];
      }
      acc[item.day].push(item);
      return acc;
    }, {} as Record<number, ItineraryItem[]>);
    
    // Sort days
    const sortedDays = Object.keys(itemsByDay).map(Number).sort((a, b) => a - b);
    
    return sortedDays.map(day => {
      const dayItems = itemsByDay[day];
      
      return `
        <div class="day-container">
          <div class="day-header">
            <div class="day-number">${day}</div>
            <h3 class="day-title">Day ${day}</h3>
          </div>
          
          <div class="day-items">
            ${dayItems.map(item => `
              <div class="day-item">
                ${item.time ? `<div class="item-time">${item.time}</div>` : ''}
                <h4 class="item-title">${item.title}</h4>
                ${item.location ? `
                  <div class="item-location">
                    <span class="location-icon">📍</span>
                    <span>${item.location}</span>
                  </div>
                ` : ''}
                ${item.description ? `<div class="item-description">${item.description}</div>` : ''}
                
                <div class="item-meta">
                  ${item.category ? `
                    <div class="item-category">
                      <span class="category-badge ${item.category}">${formatCategory(item.category)}</span>
                    </div>
                  ` : ''}
                  
                  ${item.cost ? `
                    <div class="item-cost">
                      <span class="cost-icon">💰</span>
                      <span>${formatCost(item.cost)}</span>
                    </div>
                  ` : ''}
                </div>
                
                ${item.notes ? `<div class="item-notes">${item.notes}</div>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }).join('');
  }
  
  function setupEventListeners() {
    // Back button
    const backBtn = container.querySelector('.back-btn') as HTMLButtonElement;
    backBtn?.addEventListener('click', onNavigateBack);
    
    // Back to profile button
    const backToProfileBtn = container.querySelector('.back-to-profile-btn') as HTMLButtonElement;
    backToProfileBtn?.addEventListener('click', onNavigateBack);
    
    // Share button
    const shareBtn = container.querySelector('.share-itinerary-btn') as HTMLButtonElement;
    shareBtn?.addEventListener('click', () => {
      if (onShare && itinerary) {
        onShare(itinerary.id);
      }
    });
    
    // Edit button
    const editBtn = container.querySelector('.edit-itinerary-btn') as HTMLButtonElement;
    editBtn?.addEventListener('click', () => {
      if (onEdit && itinerary) {
        onEdit(itinerary.id);
      }
    });
    
    // Delete button
    const deleteBtn = container.querySelector('.delete-itinerary-btn') as HTMLButtonElement;
    deleteBtn?.addEventListener('click', () => {
      if (onDelete && itinerary) {
        if (confirm('Are you sure you want to delete this itinerary? This action cannot be undone.')) {
          onDelete(itinerary.id);
        }
      }
    });
    
    // Print button
    const printBtn = container.querySelector('.print-itinerary-btn') as HTMLButtonElement;
    printBtn?.addEventListener('click', () => {
      window.print();
    });
    
    // Toggle privacy button
    const togglePrivacyBtn = container.querySelector('.toggle-privacy-btn') as HTMLButtonElement;
    togglePrivacyBtn?.addEventListener('click', async () => {
      if (!itinerary) return;
      
      try {
        const { error } = await supabase
          .from('itineraries')
          .update({ is_public: !itinerary.is_public })
          .eq('id', itinerary.id);
        
        if (error) throw error;
        
        // Reload itinerary data
        await loadItineraryData();
        
      } catch (error) {
        console.error('Error updating itinerary privacy:', error);
        alert('Failed to update itinerary privacy. Please try again.');
      }
    });
  }
  
  // Helper functions
  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
  
  function formatBudget(budget: string): string {
    switch (budget) {
      case 'budget':
        return 'Budget ($)';
      case 'moderate':
        return 'Moderate ($$)';
      case 'luxury':
        return 'Luxury ($$$)';
      default:
        return budget;
    }
  }
  
  function formatCategory(category: string): string {
    const categoryMap: Record<string, string> = {
      'accommodation': '🏨 Accommodation',
      'activity': '🎯 Activity',
      'food': '🍽️ Food',
      'transportation': '🚗 Transport',
      'other': '📌 Other'
    };
    
    return categoryMap[category] || category;
  }
  
  function formatCost(cost: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(cost);
  }
  
  function formatPreferences(preferences: any): string[] {
    if (Array.isArray(preferences)) {
      return preferences.map(pref => {
        // Map preference IDs to readable labels
        const prefMap: Record<string, string> = {
          'culture': '🏛️ Cultural',
          'nature': '🌲 Nature',
          'food': '🍽️ Food',
          'adventure': '🧗‍♀️ Adventure',
          'relaxation': '🧘‍♂️ Relaxation',
          'shopping': '🛍️ Shopping',
          'nightlife': '🌃 Nightlife',
          'family': '👨‍👩‍👧‍👦 Family',
          'budget': '💰 Budget',
          'luxury': '✨ Luxury',
          'history': '🏰 History',
          'art': '🎨 Art',
          'beach': '🏖️ Beaches',
          'mountains': '⛰️ Mountains',
          'photography': '📸 Photography'
        };
        
        return prefMap[pref] || pref;
      });
    }
    
    return [];
  }
  
  // Initial load
  loadItineraryData();
  
  return container;
}