import { Itinerary, ItineraryItem } from '../types';
import { authManager } from '../auth';
import { supabase } from '../lib/supabase';
import { createShareItineraryModal } from './SharePostModal';

export function createItineraryDetail(
  itinerary: Itinerary,
  onNavigateBack: () => void,
  onEdit?: (itineraryId: string) => void,
  onShare?: (itineraryId: string) => void,
  onDelete?: (itineraryId: string) => void
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'itinerary-detail-page';

  let itineraryItems: ItineraryItem[] = [];
  let isLoading = false;
  let isOwner = false;
  let isRefining = false;

  async function loadItineraryItems() {
    isLoading = true;
    renderItineraryDetail();

    try {
      // Check if user is the owner
      const authState = authManager.getAuthState();
      isOwner = authState.isAuthenticated && authState.currentUser?.id === itinerary.user_id;

      // Load itinerary items
      const { data: itemsData, error: itemsError } = await supabase
        .from('itinerary_items')
        .select('*')
        .eq('itinerary_id', itinerary.id)
        .order('day', { ascending: true })
        .order('order', { ascending: true });

      if (itemsError) throw itemsError;

      itineraryItems = itemsData || [];
    } catch (error) {
      console.error('Error loading itinerary items:', error);
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
                <button class="refine-itinerary-btn">
                  <span class="btn-icon">✨</span>
                  <span class="btn-text">Refine with AI</span>
                </button>
              ` : ''}
              
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

      .refine-itinerary-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: #10b981;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        cursor: pointer;
        font-size: 0.875rem;
        font-weight: 500;
        transition: all 0.2s;
      }

      .refine-itinerary-btn:hover {
        background: #059669;
      }

      .refine-itinerary-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
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
      
      /* Refine Modal Styles */
      .refine-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 1rem;
      }

      .refine-modal-content {
        background: white;
        border-radius: 1rem;
        width: 100%;
        max-width: 600px;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      }

      .refine-modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1.5rem;
        border-bottom: 1px solid #e2e8f0;
      }

      .refine-modal-header h2 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: #1e293b;
      }

      .refine-modal-close {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #64748b;
        padding: 0.5rem;
        border-radius: 0.5rem;
        transition: all 0.2s;
      }

      .refine-modal-close:hover {
        background: #f1f5f9;
        color: #334155;
      }

      .refine-modal-body {
        padding: 1.5rem;
      }

      .refine-intro {
        margin-bottom: 1.5rem;
      }

      .refine-intro p {
        color: #64748b;
        line-height: 1.6;
        margin: 0;
      }

      .refine-form {
        margin-bottom: 1.5rem;
      }

      .refine-form label {
        display: block;
        font-weight: 600;
        color: #334155;
        margin-bottom: 0.5rem;
      }

      .refine-textarea {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #cbd5e1;
        border-radius: 0.5rem;
        font-size: 1rem;
        min-height: 120px;
        resize: vertical;
        transition: border-color 0.2s;
      }

      .refine-textarea:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
      }

      .refine-examples {
        background: #f8fafc;
        border-radius: 0.5rem;
        padding: 1rem;
        margin-bottom: 1.5rem;
      }

      .refine-examples h3 {
        color: #334155;
        font-size: 0.875rem;
        font-weight: 600;
        margin: 0 0 0.75rem 0;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .example-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .example-chip {
        background: #e0f2fe;
        color: #0369a1;
        padding: 0.5rem 0.75rem;
        border-radius: 1rem;
        font-size: 0.75rem;
        cursor: pointer;
        transition: all 0.2s;
        border: none;
      }

      .example-chip:hover {
        background: #bae6fd;
        transform: translateY(-1px);
      }

      .refine-error {
        color: #ef4444;
        font-size: 0.875rem;
        margin-bottom: 1rem;
        padding: 0.75rem;
        background: #fef2f2;
        border: 1px solid #fecaca;
        border-radius: 0.5rem;
        display: none;
      }

      .refine-actions {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
      }

      .refine-cancel-btn {
        background: #f1f5f9;
        color: #334155;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 0.5rem;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s;
      }

      .refine-cancel-btn:hover {
        background: #e2e8f0;
      }

      .refine-submit-btn {
        background: #10b981;
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 0.5rem;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .refine-submit-btn:hover:not(:disabled) {
        background: #059669;
      }

      .refine-submit-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .refine-loading {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
      }

      .refine-loading-dots {
        display: inline-flex;
        gap: 0.25rem;
      }

      .refine-loading-dots span {
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background: currentColor;
        animation: loading-dots 1.4s ease-in-out infinite both;
      }

      .refine-loading-dots span:nth-child(1) {
        animation-delay: -0.32s;
      }

      .refine-loading-dots span:nth-child(2) {
        animation-delay: -0.16s;
      }

      @keyframes loading-dots {
        0%, 80%, 100% {
          transform: scale(0);
        }
        40% {
          transform: scale(1);
        }
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
    backBtn?.addEventListener('click', () => onNavigateBack());
    
    // Back to profile button
    const backToProfileBtn = container.querySelector('.back-to-profile-btn') as HTMLButtonElement;
    backToProfileBtn?.addEventListener('click', () => onNavigateBack());
    
    // Share button
    const shareBtn = container.querySelector('.share-itinerary-btn') as HTMLButtonElement;
    shareBtn?.addEventListener('click', () => {
      if (onShare && itinerary) {
        // Get itinerary items first
        supabase
          .from('itinerary_items')
          .select('*')
          .eq('itinerary_id', itinerary.id)
          .order('day', { ascending: true })
          .order('order', { ascending: true })
          .then(({ data }) => {
            // Create and show the share itinerary modal
            const modal = createShareItineraryModal(
              itinerary,
              data || [],
              () => {}, // onClose - no action needed
              () => {} // onSuccess - no action needed
            );
            document.body.appendChild(modal);
          })
          .catch(error => {
            console.error('Error fetching itinerary items:', error);
            // Fallback to original behavior
            onShare(itinerary.id);
          });
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
      if (isRefining) return; // Prevent actions while refining
      if (!itinerary) return;
      
      try {
        const { error } = await supabase
          .from('itineraries')
          .update({ is_public: !itinerary.is_public })
          .eq('id', itinerary.id);
        
        if (error) throw error;
        
        // Reload itinerary data
        await loadItineraryItems();
        
      } catch (error) {
        console.error('Error updating itinerary privacy:', error);
        alert('Failed to update itinerary privacy. Please try again.');
      }
    });
    
    // Refine with AI button
    const refineBtn = container.querySelector('.refine-itinerary-btn') as HTMLButtonElement;
    refineBtn?.addEventListener('click', () => {
      if (isRefining) return; // Prevent multiple clicks
      showRefineModal();
    });
  }
  
  function showRefineModal() {
    // Create modal element
    const modal = document.createElement('div');
    modal.className = 'refine-modal';
    
    // Example refinement prompts
    const examplePrompts = [
      'Make it more budget-friendly',
      'Add more cultural activities',
      'Include more outdoor activities',
      'Make it more family-friendly',
      'Add a cooking class on day 2',
      'Suggest better restaurants',
      'Add more free time',
      'Make it more relaxing',
      'Focus more on historical sites',
      'Include local transportation options'
    ];
    
    modal.innerHTML = `
      <div class="refine-modal-content">
        <div class="refine-modal-header">
          <h2>Refine Itinerary with AI</h2>
          <button class="refine-modal-close">✕</button>
        </div>
        
        <div class="refine-modal-body">
          <div class="refine-intro">
            <p>Tell our AI how you'd like to refine your itinerary. Be specific about what you want to change or improve.</p>
          </div>
          
          <div class="refine-form">
            <label for="refine-instructions">Refinement Instructions</label>
            <textarea id="refine-instructions" class="refine-textarea" placeholder="e.g., Make it more budget-friendly, add more outdoor activities, include a cooking class on day 2..."></textarea>
          </div>
          
          <div class="refine-examples">
            <h3>Examples</h3>
            <div class="example-list">
              ${examplePrompts.map(prompt => `
                <button class="example-chip">${prompt}</button>
              `).join('')}
            </div>
          </div>
          
          <div class="refine-error" id="refine-error"></div>
          
          <div class="refine-actions">
            <button class="refine-cancel-btn">Cancel</button>
            <button class="refine-submit-btn">
              <span class="refine-btn-text">Refine Itinerary</span>
              <span class="refine-loading" style="display: none;">
                <span class="refine-loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
                Refining...
              </span>
            </button>
          </div>
        </div>
      </div>
    `;
    
    // Add modal to the document
    document.body.appendChild(modal);
    
    // Get elements
    const closeBtn = modal.querySelector('.refine-modal-close') as HTMLButtonElement;
    const cancelBtn = modal.querySelector('.refine-cancel-btn') as HTMLButtonElement;
    const submitBtn = modal.querySelector('.refine-submit-btn') as HTMLButtonElement;
    const instructionsTextarea = modal.querySelector('#refine-instructions') as HTMLTextAreaElement;
    const errorElement = modal.querySelector('#refine-error') as HTMLElement;
    const exampleChips = modal.querySelectorAll('.example-chip') as NodeListOf<HTMLButtonElement>;
    
    // Close modal function
    const closeModal = () => {
      modal.remove();
    };
    
    // Set loading state
    const setLoading = (loading: boolean) => {
      isRefining = loading;
      submitBtn.disabled = loading;
      cancelBtn.disabled = loading;
      instructionsTextarea.disabled = loading;
      
      const btnText = submitBtn.querySelector('.refine-btn-text') as HTMLElement;
      const loadingElement = submitBtn.querySelector('.refine-loading') as HTMLElement;
      
      if (loading) {
        btnText.style.display = 'none';
        loadingElement.style.display = 'inline-flex';
      } else {
        btnText.style.display = 'inline';
        loadingElement.style.display = 'none';
      }
    };
    
    // Show error
    const showError = (message: string) => {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    };
    
    // Clear error
    const clearError = () => {
      errorElement.textContent = '';
      errorElement.style.display = 'none';
    };
    
    // Event listeners
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    
    // Example chip click
    exampleChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const currentText = instructionsTextarea.value.trim();
        const chipText = chip.textContent || '';
        
        if (currentText) {
          instructionsTextarea.value = currentText + ', ' + chipText.toLowerCase();
        } else {
          instructionsTextarea.value = chipText;
        }
        
        instructionsTextarea.focus();
      });
    });
    
    // Submit button
    submitBtn.addEventListener('click', async () => {
      const instructions = instructionsTextarea.value.trim();
      
      if (!instructions) {
        showError('Please provide instructions for refining the itinerary.');
        return;
      }
      
      clearError();
      setLoading(true);
      
      try {
        await refineItinerary(instructions);
        closeModal();
      } catch (error) {
        console.error('Error refining itinerary:', error);
        // Provide more specific error messages based on the error type
        let errorMessage = 'Failed to refine itinerary. ';
        
        if (error.message) {
          const message = error.message.toLowerCase();
          
          if (message.includes('api key') || message.includes('unauthorized')) {
            errorMessage += 'AI service is not properly configured. Please contact support.';
          } else if (message.includes('quota') || message.includes('limit')) {
            errorMessage += 'AI service quota exceeded. Please try again later.';
          } else if (message.includes('network') || message.includes('fetch')) {
            errorMessage += 'Network connection issue. Please check your internet connection and try again.';
          } else if (message.includes('timeout')) {
            errorMessage += 'Request timed out. Please try again with simpler instructions.';
          } else if (message.includes('internal server error')) {
            errorMessage += 'Server is temporarily unavailable. Please try again in a few minutes.';
          } else if (message.includes('invalid') || message.includes('bad request')) {
            errorMessage += 'Invalid request. Please check your refinement instructions and try again.';
          } else {
            errorMessage += error.message;
          }
        } else {
          errorMessage += 'An unexpected error occurred. Please try again.';
        }
        
        showError(errorMessage);
        setLoading(false);
      }
    });
    
    // Close on escape key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isRefining) {
        closeModal();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    // Cleanup
    modal.addEventListener('remove', () => {
      document.removeEventListener('keydown', handleKeyDown);
    });
    
    // Focus the textarea
    instructionsTextarea.focus();
  }
  
  async function refineItinerary(instructions: string) {
    if (!itinerary || !itineraryItems.length) {
      throw new Error('No itinerary data available to refine');
    }
    
    try {
      // Call the AI itinerary builder edge function with refinement instructions
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-itinerary-builder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          destination: itinerary.destination,
          startDate: itinerary.start_date || undefined,
          endDate: itinerary.end_date || undefined,
          budget: itinerary.budget || undefined,
          preferences: itinerary.preferences || [],
          notes: itinerary.notes || undefined,
          userId: itinerary.user_id,
          existingItinerary: {
            id: itinerary.id,
            items: itineraryItems
          },
          refinementInstructions: instructions
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to refine itinerary');
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Success - reload itinerary data
      await loadItineraryItems();
      
      // Show success message
      alert('Itinerary successfully refined!');
      
    } catch (error) {
      console.error('Error refining itinerary:', error);
      throw error;
    } finally {
      isRefining = false;
    }
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
  loadItineraryItems();
  
  return container;
}