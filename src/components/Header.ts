import { authManager } from '../auth';

export function createHeader(
  onProfileClick?: () => void, 
  onExploreClick?: () => void, 
  onHomeClick?: () => void, 
  onAIChatClick?: () => void,
  currentView?: string
): HTMLElement {
  const header = document.createElement('header');
  header.className = 'bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30';
  
  function updateHeader() {
    const authState = authManager.getAuthState();
    
    if (authState.loading) {
      header.innerHTML = `
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between h-16">
            <div class="flex items-center gap-2">
              <h1 class="text-xl font-bold text-gray-900">✈️ TravelShare</h1>
            </div>
            <div class="flex items-center gap-2">
              <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
              <span class="text-sm text-gray-600">Loading...</span>
            </div>
          </div>
        </div>
      `;
      return;
    }
    
    if (authState.isAuthenticated && authState.currentUser) {
      const avatarUrl = authState.currentUser.avatar_url || 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop';
      
      header.innerHTML = `
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between h-16">
            <div class="flex items-center">
              <button class="flex items-center gap-2 hover:opacity-80 transition-opacity" id="logo-btn">
                <h1 class="text-xl font-bold text-gray-900">✈️ TravelShare</h1>
              </button>
            </div>
            
            <nav class="hidden md:flex items-center space-x-1">
              <button class="nav-btn ${currentView === 'feed' ? 'active' : ''}" data-view="feed">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                </svg>
                <span>Home</span>
              </button>
              <button class="nav-btn ${currentView === 'explore' ? 'active' : ''}" data-view="explore">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
                <span>Explore</span>
              </button>
              <button class="nav-btn ${currentView === 'ai-chat' ? 'active' : ''}" data-view="ai-chat">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                </svg>
                <span>AI Chat</span>
              </button>
            </nav>
            
            <div class="relative">
              <button class="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg transition-colors" id="user-menu-btn">
                <img src="${avatarUrl}" alt="${authState.currentUser.name}" class="w-8 h-8 rounded-full object-cover">
                <span class="hidden sm:block text-sm font-medium text-gray-700">${authState.currentUser.name}</span>
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>
              
              <div class="hidden absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50" id="user-dropdown">
                <button class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2" id="profile-btn">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                  Profile
                </button>
                <button class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2" id="logout-btn">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                  </svg>
                  Logout
                </button>
              </div>
            </div>
          </div>
          
          <!-- Mobile Navigation -->
          <div class="md:hidden border-t border-gray-200">
            <div class="flex justify-around py-2">
              <button class="mobile-nav-btn ${currentView === 'feed' ? 'active' : ''}" data-view="feed">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                </svg>
                <span class="text-xs">Home</span>
              </button>
              <button class="mobile-nav-btn ${currentView === 'explore' ? 'active' : ''}" data-view="explore">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
                <span class="text-xs">Explore</span>
              </button>
              <button class="mobile-nav-btn ${currentView === 'ai-chat' ? 'active' : ''}" data-view="ai-chat">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                </svg>
                <span class="text-xs">AI Chat</span>
              </button>
            </div>
          </div>
        </div>
      `;
      
      // Add styles for navigation
      const style = document.createElement('style');
      style.textContent = `
        .nav-btn {
          @apply flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors;
        }
        .nav-btn.active {
          @apply text-primary-600 bg-primary-50;
        }
        .mobile-nav-btn {
          @apply flex flex-col items-center gap-1 p-2 text-gray-600 hover:text-gray-900 transition-colors;
        }
        .mobile-nav-btn.active {
          @apply text-primary-600;
        }
      `;
      document.head.appendChild(style);
      
      // Get elements
      const logoBtn = header.querySelector('#logo-btn') as HTMLButtonElement;
      const navBtns = header.querySelectorAll('.nav-btn, .mobile-nav-btn') as NodeListOf<HTMLButtonElement>;
      const userMenuBtn = header.querySelector('#user-menu-btn') as HTMLButtonElement;
      const userDropdown = header.querySelector('#user-dropdown') as HTMLElement;
      const profileBtn = header.querySelector('#profile-btn') as HTMLButtonElement;
      const logoutBtn = header.querySelector('#logout-btn') as HTMLButtonElement;
      
      // Logo navigation
      logoBtn.addEventListener('click', () => {
        if (onHomeClick) onHomeClick();
      });
      
      // Navigation buttons
      navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const view = btn.dataset.view;
          if (view === 'feed' && onHomeClick) {
            onHomeClick();
          } else if (view === 'explore' && onExploreClick) {
            onExploreClick();
          } else if (view === 'ai-chat' && onAIChatClick) {
            onAIChatClick();
          }
        });
      });
      
      // Toggle dropdown
      userMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle('hidden');
      });
      
      // Close dropdown when clicking outside
      document.addEventListener('click', () => {
        userDropdown.classList.add('hidden');
      });
      
      // Profile navigation
      profileBtn.addEventListener('click', () => {
        userDropdown.classList.add('hidden');
        if (onProfileClick) {
          onProfileClick();
        }
      });
      
      // Logout functionality
      logoutBtn.addEventListener('click', async () => {
        userDropdown.classList.add('hidden');
        await authManager.logout();
      });
    } else {
      header.innerHTML = `
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between h-16">
            <div class="flex items-center gap-2">
              <h1 class="text-xl font-bold text-gray-900">✈️ TravelShare</h1>
            </div>
            <div class="flex items-center">
              <button class="btn-primary" id="login-btn">Log In</button>
            </div>
          </div>
        </div>
      `;
      
      // Add login functionality
      const loginBtn = header.querySelector('#login-btn') as HTMLButtonElement;
      loginBtn.addEventListener('click', () => {
        const authModal = document.querySelector('.auth-modal') as HTMLElement;
        if (authModal) {
          authModal.classList.add('active');
          document.body.style.overflow = 'hidden';
        }
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