import { authManager } from '../auth';

export function createHeader(
  onProfileClick?: () => void, 
  onExploreClick?: (forceReload?: boolean) => void, 
  onHomeClick?: (forceReload?: boolean) => void, 
  onAIChatClick?: () => void,
  onDirectMessagesClick?: () => void,
  onCommunitiesClick?: () => void,
  onTravelGuidesClick?: () => void,
  onAboutClick?: () => void,
  onItinerariesClick?: () => void,
  currentView?: string
): HTMLElement {
  const header = document.createElement('header');
  header.className = 'header';
  
  function updateHeader() {
    const authState = authManager.getAuthState();
    
    if (authState.loading) {
      header.innerHTML = `
        <div class="header-content">
          <div class="logo">
            <h1>✈️ TravelShare</h1>
          </div>
          <div class="loading-spinner">Loading...</div>
        </div>
      `;
      return;
    }
    
    if (authState.isAuthenticated && authState.currentUser) {
      const avatarUrl = authState.currentUser.avatar_url || 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop';
      
      header.innerHTML = `
        <div class="header-content">
          <div class="logo">
            <button class="logo-btn">
              <h1>✈️ TravelShare</h1>
            </button>
          </div>
          
          <nav class="main-nav">
            <button class="nav-btn ${currentView === 'feed' ? 'active' : ''}" data-view="feed">
              <span class="nav-icon">🏠</span>
              <span class="nav-text">Home</span>
            </button>
            <button class="nav-btn ${currentView === 'explore' ? 'active' : ''}" data-view="explore">
              <span class="nav-icon">🔍</span>
              <span class="nav-text">Explore</span>
            </button>
            <button class="nav-btn ${currentView === 'travel-guides' ? 'active' : ''}" data-view="travel-guides">
              <span class="nav-icon">🧭</span>
              <span class="nav-text">Guides</span>
            </button>
            <button class="nav-btn ${currentView === 'ai-chat' ? 'active' : ''}" data-view="ai-chat">
              <span class="nav-icon">🤖</span>
              <span class="nav-text">AI Chat</span>
            </button>
            <button class="nav-btn ${currentView === 'direct-messages' ? 'active' : ''}" data-view="direct-messages">
              <span class="nav-icon">💬</span>
              <span class="nav-text">Messages</span>
            </button>
            <button class="nav-btn ${currentView === 'heatmap' ? 'active' : ''}" data-view="heatmap">
              <span class="nav-icon">🔥</span>
              <span class="nav-text">Heatmap</span>
            </button>
            <button class="nav-btn ${currentView === 'about' ? 'active' : ''}" data-view="about">
              <span class="nav-icon">ℹ️</span>
              <span class="nav-text">About</span>
            </button>
          </nav>
          
          <div class="user-menu">
            <button class="user-profile-btn">
              <img src="${avatarUrl}" alt="${authState.currentUser.name}" class="user-avatar-small">
              <span class="user-name">${authState.currentUser.name}</span>
            </button>
            <div class="user-dropdown">
              <button class="dropdown-item profile-btn">
                <span class="dropdown-icon">👤</span>
                Profile
              </button>
              <button class="dropdown-item logout-btn">
                <span class="dropdown-icon">🚪</span>
                Logout
              </button>
            </div>
          </div>
        </div>
      `;
      
      // Get elements
      const logoBtn = header.querySelector('.logo-btn') as HTMLButtonElement;
      const navBtns = header.querySelectorAll('.nav-btn') as NodeListOf<HTMLButtonElement>;
      const userProfileBtn = header.querySelector('.user-profile-btn') as HTMLButtonElement;
      const userDropdown = header.querySelector('.user-dropdown') as HTMLElement;
      const profileBtn = header.querySelector('.profile-btn') as HTMLButtonElement;
      const logoutBtn = header.querySelector('.logout-btn') as HTMLButtonElement;
      
      // Logo navigation
      logoBtn.addEventListener('click', () => {
        if (onHomeClick) onHomeClick();
      });
      
      // Navigation buttons
      navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const view = btn.dataset.view;

          if (view === 'feed' && onHomeClick) {
            onHomeClick(true); // Always force reload when clicking Home
          } else if (view === 'explore' && onExploreClick) {
            onExploreClick(true); // Always force reload when clicking Explore
          } else if (view === 'heatmap' && onExploreClick) {
            // Navigate to heatmap using explore click handler
            window.location.hash = 'heatmap';
          } else if (view === 'ai-chat' && onAIChatClick) {
            onAIChatClick();
          } else if (view === 'direct-messages' && onDirectMessagesClick) {
            onDirectMessagesClick();
          } else if (view === 'communities' && onCommunitiesClick) {
            onCommunitiesClick();
          } else if (view === 'travel-guides' && onTravelGuidesClick) {
            onTravelGuidesClick();
          } else if (view === 'itineraries' && onItinerariesClick) {
            onItinerariesClick();
          } else if (view === 'about' && onAboutClick) {
            onAboutClick();
          }
        });
      });
      
      // Toggle dropdown
      userProfileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle('active');
      });
      
      // Close dropdown when clicking outside
      document.addEventListener('click', () => {
        userDropdown.classList.remove('active');
      });
      
      // Profile navigation
      profileBtn.addEventListener('click', () => {
        userDropdown.classList.remove('active');
        if (onProfileClick) {
          onProfileClick();
        }
      });
      
      // Logout functionality
      logoutBtn.addEventListener('click', async () => {
        userDropdown.classList.remove('active');
        await authManager.logout();
      });
    } else {
      header.innerHTML = `
        <div class="header-content">
          <div class="logo">
            <h1>✈️ TravelShare</h1>
          </div>
          <nav class="main-nav">
            <button class="nav-btn ${currentView === 'about' ? 'active' : ''}" data-view="about">
              <span class="nav-icon">ℹ️</span>
              <span class="nav-text">About</span>
            </button>
            <button class="nav-btn ${currentView === 'travel-guides' ? 'active' : ''}" data-view="travel-guides">
              <span class="nav-icon">🧭</span>
              <span class="nav-text">Guides</span>
            </button>
          </nav>
          <div class="auth-buttons">
            <button class="login-btn">Log In</button>
          </div>
        </div>
      `;
      
      // Add login functionality
      const loginBtn = header.querySelector('.login-btn') as HTMLButtonElement;
      loginBtn.addEventListener('click', () => {
        const authModal = document.querySelector('.auth-modal') as HTMLElement;
        if (authModal) {
          authModal.classList.add('active');
          document.body.style.overflow = 'hidden';
        }
      });
      
      // Navigation buttons for non-authenticated users
      const navBtns = header.querySelectorAll('.nav-btn') as NodeListOf<HTMLButtonElement>;
      navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const view = btn.dataset.view;
          if (view === 'about' && onAboutClick) {
            onAboutClick();
          } else if (view === 'travel-guides' && onTravelGuidesClick) {
            onTravelGuidesClick();
          } else if (view === 'itineraries' && onItinerariesClick) {
            onItinerariesClick();
          }
        });
      });
    }
  }
  
  // Initial render
  updateHeader();
  
  // Listen for auth changes
  authManager.onAuthChange(() => {
    updateHeader();
  });
  
  return header;
}