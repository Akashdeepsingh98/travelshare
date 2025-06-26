import { Itinerary } from '../types';

export function createItineraryCard(
  itinerary: Itinerary,
  onClick: (itineraryId: string) => void,
  onDelete?: (itineraryId: string) => void,
  onShare?: (itineraryId: string) => void
): HTMLElement {
  const card = document.createElement('div');
  card.className = 'itinerary-card';
  
  // Calculate trip duration
  let durationText = 'Trip';
  if (itinerary.start_date && itinerary.end_date) {
    const start = new Date(itinerary.start_date);
    const end = new Date(itinerary.end_date);
    const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    durationText = `${days} day${days !== 1 ? 's' : ''}`;
  }
  
  // Format dates
  const startDate = itinerary.start_date ? new Date(itinerary.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null;
  const endDate = itinerary.end_date ? new Date(itinerary.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null;
  
  // Get destination image (using a placeholder for now)
  const destinationImage = getDestinationImage(itinerary.destination);
  
  card.innerHTML = `
    <div class="itinerary-card-image">
      <img src="${destinationImage}" alt="${itinerary.destination}" loading="lazy">
      <div class="itinerary-card-badge ${itinerary.is_public ? 'public' : 'private'}">
        ${itinerary.is_public ? '🌍 Public' : '🔒 Private'}
      </div>
    </div>
    
    <div class="itinerary-card-content">
      <h3 class="itinerary-card-title">${itinerary.title}</h3>
      
      <div class="itinerary-card-details">
        <div class="itinerary-detail">
          <span class="detail-icon">📍</span>
          <span class="detail-text">${itinerary.destination}</span>
        </div>
        
        ${startDate && endDate ? `
          <div class="itinerary-detail">
            <span class="detail-icon">📅</span>
            <span class="detail-text">${startDate} - ${endDate}</span>
          </div>
        ` : ''}
        
        <div class="itinerary-detail">
          <span class="detail-icon">⏱️</span>
          <span class="detail-text">${durationText}</span>
        </div>
        
        ${itinerary.budget ? `
          <div class="itinerary-detail">
            <span class="detail-icon">💰</span>
            <span class="detail-text">${formatBudget(itinerary.budget)}</span>
          </div>
        ` : ''}
      </div>
      
      ${itinerary.preferences && itinerary.preferences.length > 0 ? `
        <div class="itinerary-preferences">
          ${formatPreferences(itinerary.preferences).map(pref => `
            <span class="preference-tag">${pref}</span>
          `).join('')}
        </div>
      ` : ''}
    </div>
    
    <div class="itinerary-card-actions">
      <button class="view-itinerary-btn" data-itinerary-id="${itinerary.id}">
        <span class="btn-icon">👁️</span>
        <span class="btn-text">View Itinerary</span>
      </button>
      
      <div class="action-buttons">
        ${onShare ? `
          <button class="share-itinerary-btn" data-itinerary-id="${itinerary.id}" title="Share Itinerary">
            <span class="btn-icon">🔄</span>
          </button>
        ` : ''}
        
        ${onDelete ? `
          <button class="delete-itinerary-btn" data-itinerary-id="${itinerary.id}" title="Delete Itinerary">
            <span class="btn-icon">🗑️</span>
          </button>
        ` : ''}
      </div>
    </div>
  `;
  
  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    .itinerary-card {
      background: white;
      border-radius: 1rem;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
      display: flex;
      flex-direction: column;
    }

    .itinerary-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
    }

    .itinerary-card-image {
      position: relative;
      height: 160px;
      overflow: hidden;
    }

    .itinerary-card-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }

    .itinerary-card:hover .itinerary-card-image img {
      transform: scale(1.05);
    }

    .itinerary-card-badge {
      position: absolute;
      top: 1rem;
      right: 1rem;
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: white;
    }

    .itinerary-card-badge.public {
      background: rgba(16, 185, 129, 0.8);
    }

    .itinerary-card-badge.private {
      background: rgba(239, 68, 68, 0.8);
    }

    .itinerary-card-content {
      padding: 1.5rem;
      flex: 1;
    }

    .itinerary-card-title {
      color: #1e293b;
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0 0 1rem 0;
      line-height: 1.4;
    }

    .itinerary-card-details {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    .itinerary-detail {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .detail-icon {
      font-size: 1rem;
      color: #667eea;
    }

    .detail-text {
      font-size: 0.875rem;
      color: #64748b;
    }

    .itinerary-preferences {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 1rem;
    }

    .preference-tag {
      background: #f1f5f9;
      color: #334155;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .itinerary-card-actions {
      padding: 1rem 1.5rem;
      border-top: 1px solid #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .view-itinerary-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #667eea;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 500;
      transition: all 0.2s;
    }

    .view-itinerary-btn:hover {
      background: #5a67d8;
    }

    .action-buttons {
      display: flex;
      gap: 0.5rem;
    }

    .share-itinerary-btn, .delete-itinerary-btn {
      background: #f1f5f9;
      color: #64748b;
      border: none;
      width: 32px;
      height: 32px;
      border-radius: 0.5rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .share-itinerary-btn:hover {
      background: #10b981;
      color: white;
    }

    .delete-itinerary-btn:hover {
      background: #ef4444;
      color: white;
    }
  `;
  
  if (!document.head.querySelector('#itinerary-card-styles')) {
    style.id = 'itinerary-card-styles';
    document.head.appendChild(style);
  }
  
  // Event listeners
  const viewBtn = card.querySelector('.view-itinerary-btn') as HTMLButtonElement;
  viewBtn.addEventListener('click', () => {
    onClick(itinerary.id);
  });
  
  // Make the whole card clickable except for action buttons
  card.addEventListener('click', (e) => {
    if (!(e.target as HTMLElement).closest('.action-buttons')) {
      onClick(itinerary.id);
    }
  });
  
  // Share button
  if (onShare) {
    const shareBtn = card.querySelector('.share-itinerary-btn') as HTMLButtonElement;
    shareBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      onShare(itinerary.id);
    });
  }
  
  // Delete button
  if (onDelete) {
    const deleteBtn = card.querySelector('.delete-itinerary-btn') as HTMLButtonElement;
    deleteBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm('Are you sure you want to delete this itinerary? This action cannot be undone.')) {
        onDelete(itinerary.id);
      }
    });
  }
  
  return card;
}

// Helper functions
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