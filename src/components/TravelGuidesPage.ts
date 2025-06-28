import { TravelGuide } from '../types';
import { authManager } from '../auth';
import { supabase } from '../lib/supabase';
import { showAuthModal } from './AuthModal';
import { createTravelGuideModal } from './CreateTravelGuideModal';

export function createTravelGuidesPage(
  onNavigateBack: () => void,
  onGuideClick: (guideId: string) => void,
  onUserClick?: (userId: string) => void
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'travel-guides-page';
  
  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    .guides-search {
      margin-bottom: 1.5rem;
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
      border: 1px solid #e2e8f0;
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

    .travel-guides-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 2rem 1rem;
    }

    .guides-header {
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

    .guides-header h1 {
      color: white;
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0;
    }

    .guides-header .back-btn {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
    }

    .guides-header .back-btn:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: translateY(-1px);
    }

    .create-guide-btn {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .create-guide-btn:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: translateY(-1px);
    }

    .guides-content {
      background: white;
      border-radius: 1rem;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      padding: 2rem;
    }

    .guides-login-prompt {
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

    .guides-login-btn {
      background: #667eea;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s;
    }

    .guides-login-btn:hover {
      background: #5a67d8;
      transform: translateY(-1px);
    }

    .guides-tabs {
      display: flex;
      border-bottom: 1px solid #e2e8f0;
      margin-bottom: 2rem;
    }

    .guides-tab {
      padding: 1rem 1.5rem;
      cursor: pointer;
      color: #64748b;
      font-weight: 500;
      transition: all 0.2s;
      border-bottom: 2px solid transparent;
    }

    .guides-tab.active {
      color: #667eea;
      border-bottom-color: #667eea;
    }

    .guides-tab:hover:not(.active) {
      color: #334155;
      background: #f8fafc;
    }

    .tab-content {
      display: none;
    }

    .tab-content.active {
      display: block;
    }

    .guides-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .guide-card {
      background: white;
      border-radius: 1rem;
      border: 1px solid #e2e8f0;
      overflow: hidden;
      transition: all 0.3s ease;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
      cursor: pointer;
      display: flex;
      flex-direction: column;
    }

    .guide-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      border-color: #cbd5e1;
    }

    .guide-card-image {
      height: 160px;
      background-size: cover;
      background-position: center;
      position: relative;
    }

    .guide-card-badge {
      position: absolute;
      top: 1rem;
      right: 1rem;
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
      font-size: 0.75rem;
      font-weight: 500;
      background: rgba(255, 255, 255, 0.9);
      color: #1e293b;
    }

    .guide-card-content {
      padding: 1.5rem;
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .guide-card-title {
      color: #1e293b;
      font-size: 1.125rem;
      font-weight: 600;
      margin: 0 0 0.5rem 0;
    }

    .guide-card-destination {
      color: #667eea;
      font-size: 0.875rem;
      margin: 0 0 1rem 0;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .guide-card-description {
      color: #64748b;
      font-size: 0.875rem;
      margin: 0 0 1rem 0;
      line-height: 1.5;
      flex: 1;
    }

    .guide-card-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: auto;
      padding-top: 1rem;
      border-top: 1px solid #f1f5f9;
    }

    .guide-card-author {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .author-avatar {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      object-fit: cover;
    }

    .author-name {
      color: #64748b;
      font-size: 0.75rem;
    }

    .guide-card-date {
      color: #94a3b8;
      font-size: 0.75rem;
    }

    .guides-loading {
      text-align: center;
      padding: 3rem 1rem;
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #f3f4f6;
      border-top: 3px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .guides-empty {
      text-align: center;
      padding: 3rem 1rem;
      background: #f8fafc;
      border-radius: 0.75rem;
      border: 2px dashed #e2e8f0;
    }

    .empty-guides-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
      color: #94a3b8;
    }

    .guides-empty h3 {
      color: #1e293b;
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0 0 0.5rem 0;
    }

    .guides-empty p {
      color: #64748b;
      margin: 0 0 1.5rem 0;
      line-height: 1.5;
      max-width: 500px;
      margin-left: auto;
      margin-right: auto;
    }

    .create-first-guide-btn {
      background: #667eea;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .create-first-guide-btn:hover {
      background: #5a67d8;
      transform: translateY(-1px);
    }

    /* Responsive design */
    @media (max-width: 768px) {
      .travel-guides-page {
        padding: 1rem;
      }

      .guides-header {
        padding: 1rem;
        flex-direction: column;
        gap: 1rem;
        text-align: center;
      }

      .guides-content {
        padding: 1.5rem;
      }

      .guides-grid {
        grid-template-columns: 1fr;
      }

      .guides-tabs {
        overflow-x: auto;
        white-space: nowrap;
        padding-bottom: 0.5rem;
      }

      .guides-tab {
        padding: 0.75rem 1rem;
      }
      
      .search-input-wrapper {
        padding: 0.5rem 1rem;
      }
    }
  `;
  
  if (!document.head.querySelector('#travel-guides-styles')) {
    style.id = 'travel-guides-styles';
    document.head.appendChild(style);
  }
  
  // State variables
  let userGuides: TravelGuide[] = [];
  let publicGuides: TravelGuide[] = [];
  let isLoading = false;
  let searchQuery = '';
  let activeTab = 'discover'; // 'discover' or 'my-guides'
  
  // Load guides
  async function loadGuides(query: string = '') {
    const authState = authManager.getAuthState();
    
    isLoading = true;
    renderGuidesPage();
    
    try {
      // Prepare base query for public guides
      let publicGuidesQuery = supabase
          .from('travel_guides')
          .select(`
            *,
            user:profiles(*)
          `)
          .eq('is_public', true)
          .order('created_at', { ascending: false });
      
      // Add search filter if query is provided
      if (query) {
        publicGuidesQuery = publicGuidesQuery.or(
          `title.ilike.%${query}%,destination.ilike.%${query}%`
        );
      }
      
      // Execute query with limit
      const { data: publicGuidesData, error: publicError } = await publicGuidesQuery.limit(50);
      
      if (publicError) throw publicError;
      
      publicGuides = publicGuidesData || [];
      
      // Load user's guides if authenticated
      if (authState.isAuthenticated && authState.currentUser) {
        // Prepare base query for user guides
        let userGuidesQuery = supabase
            .from('travel_guides')
            .select(`
              *,
              user:profiles(*)
            `)
            .eq('user_id', authState.currentUser.id)
            .order('created_at', { ascending: false });
        
        // Add search filter if query is provided
        if (query) {
          userGuidesQuery = userGuidesQuery.or(
            `title.ilike.%${query}%,destination.ilike.%${query}%`
          );
        }
        
        // Execute query
        const { data: userGuidesData, error: userError } = await userGuidesQuery;
        
        if (userError) throw userError;
        
        userGuides = userGuidesData || [];
        
        // If user has guides, default to my-guides tab
        if (userGuides.length > 0) {
          activeTab = 'my-guides';
        }
      }
      
    } catch (error) {
      console.error('Error loading travel guides:', error);
    } finally {
      isLoading = false;
      renderGuidesPage();
    }
  }
  
  // Initial load
  loadGuides();
  
  // Listen for auth changes
  authManager.onAuthChange(() => {
    loadGuides(searchQuery);
  });
  
  return container;
}