import { MiniApp } from '../types';

export function createMiniAppViewer(app: MiniApp, onClose: () => void): HTMLElement {
  const container = document.createElement('div');
  container.className = 'mini-app-viewer-modal';
  
  const categoryIcons = {
    transportation: '🚗',
    food: '🍽️',
    shopping: '🛍️',
    entertainment: '🎬',
    travel: '✈️',
    business: '💼',
    other: '📋'
  };
  
  const defaultIcon = categoryIcons[app.category] || '📱';
  
  container.innerHTML = `
    <div class="mini-app-viewer-backdrop"></div>
    <div class="mini-app-viewer-content">
      <div class="mini-app-viewer-header">
        <div class="app-header-info">
          <div class="app-header-icon">
            ${app.icon_url ? `<img src="${app.icon_url}" alt="${app.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">` : ''}
            <span class="app-icon-fallback" ${app.icon_url ? 'style="display: none;"' : ''}>${defaultIcon}</span>
          </div>
          <div class="app-header-details">
            <h2 class="app-header-name">${app.name}</h2>
            <p class="app-header-description">${app.description || 'No description available'}</p>
            <span class="app-header-category">${app.category}</span>
          </div>
        </div>
        <div class="app-header-actions">
          <button class="open-app-btn">
            <span class="open-icon">🔗</span>
            Open App
          </button>
          <button class="close-viewer-btn">✕</button>
        </div>
      </div>
      
      <div class="mini-app-viewer-body">
        <div class="app-iframe-container">
          <iframe 
            src="${app.app_url}" 
            class="app-iframe"
            title="${app.name}"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            loading="lazy">
          </iframe>
          <div class="iframe-overlay">
            <div class="iframe-message">
              <div class="iframe-icon">${defaultIcon}</div>
              <h3>Loading ${app.name}...</h3>
              <p>If the app doesn't load, you can open it in a new tab.</p>
              <button class="open-new-tab-btn">
                <span class="tab-icon">🔗</span>
                Open in New Tab
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div class="mini-app-viewer-footer">
        <div class="app-footer-info">
          <span class="app-url">🔗 ${app.app_url}</span>
        </div>
        <div class="app-footer-actions">
          <button class="share-app-btn">
            <span class="share-icon">📤</span>
            Share
          </button>
          <button class="open-external-btn">
            <span class="external-icon">🔗</span>
            Open External
          </button>
        </div>
      </div>
    </div>
  `;
  
  setupViewerEventListeners();
  
  function setupViewerEventListeners() {
    const backdrop = container.querySelector('.mini-app-viewer-backdrop') as HTMLElement;
    const closeBtn = container.querySelector('.close-viewer-btn') as HTMLButtonElement;
    const openAppBtn = container.querySelector('.open-app-btn') as HTMLButtonElement;
    const openNewTabBtn = container.querySelector('.open-new-tab-btn') as HTMLButtonElement;
    const openExternalBtn = container.querySelector('.open-external-btn') as HTMLButtonElement;
    const shareBtn = container.querySelector('.share-app-btn') as HTMLButtonElement;
    const iframe = container.querySelector('.app-iframe') as HTMLIFrameElement;
    const overlay = container.querySelector('.iframe-overlay') as HTMLElement;
    
    // Close modal
    backdrop.addEventListener('click', onClose);
    closeBtn.addEventListener('click', onClose);
    
    // Open app actions
    openAppBtn.addEventListener('click', () => {
      console.log('🔗 Open App button clicked');
      openInNewTab();
    });
    openNewTabBtn.addEventListener('click', () => {
      console.log('🔗 Open New Tab button clicked');
      openInNewTab();
    });
    openExternalBtn.addEventListener('click', () => {
      console.log('🔗 Open External button clicked');
      openInNewTab();
    });
    
    // Share app
    shareBtn.addEventListener('click', () => shareApp());
    
    // Handle iframe loading
    iframe.addEventListener('load', () => {
      console.log('✅ Iframe loaded successfully');
      setTimeout(() => {
        overlay.style.display = 'none';
      }, 1000);
    });
    
    iframe.addEventListener('error', () => {
      console.error('❌ Iframe failed to load');
      overlay.innerHTML = `
        <div class="iframe-message">
          <div class="iframe-icon">⚠️</div>
          <h3>Unable to load ${app.name}</h3>
          <p>This app cannot be displayed in an embedded frame.</p>
          <button class="open-new-tab-btn">
            <span class="tab-icon">🔗</span>
            Open in New Tab
          </button>
        </div>
      `;
      
      const newOpenBtn = overlay.querySelector('.open-new-tab-btn') as HTMLButtonElement;
      newOpenBtn.addEventListener('click', () => {
        console.log('🔗 Retry Open New Tab button clicked');
        openInNewTab();
      });
    });
    
    // Hide overlay after timeout
    setTimeout(() => {
      if (overlay.style.display !== 'none') {
        console.log('⏰ Hiding overlay after timeout');
        overlay.style.display = 'none';
      }
    }, 5000);
    
    // Close on escape key
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyPress);
    
    // Cleanup function
    container.addEventListener('remove', () => {
      document.removeEventListener('keydown', handleKeyPress);
    });
  }
  
  function openInNewTab() {
    console.log('🚀 Opening app in new tab:', app.app_url);
    console.log('📱 App details:', {
      name: app.name,
      url: app.app_url,
      category: app.category
    });
    
    try {
      const newWindow = window.open(app.app_url, '_blank', 'noopener,noreferrer');
      if (newWindow) {
        console.log('✅ New window opened successfully');
      } else {
        console.error('❌ Failed to open new window - popup blocked?');
        alert('Unable to open the app. Please check if popup blockers are enabled and try again.');
      }
    } catch (error) {
      console.error('❌ Error opening new tab:', error);
      alert('Unable to open the app. Please try again or check the app URL.');
    }
  }
  
  function shareApp() {
    console.log('📤 Sharing app:', app.name);
    
    if (navigator.share) {
      navigator.share({
        title: app.name,
        text: app.description || `Check out ${app.name}`,
        url: app.app_url
      }).catch(console.error);
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(app.app_url).then(() => {
        console.log('📋 App URL copied to clipboard');
        // Show temporary success message
        const shareBtn = container.querySelector('.share-app-btn') as HTMLButtonElement;
        const originalContent = shareBtn.innerHTML;
        shareBtn.innerHTML = '<span class="check-icon">✅</span> Copied!';
        shareBtn.disabled = true;
        
        setTimeout(() => {
          shareBtn.innerHTML = originalContent;
          shareBtn.disabled = false;
        }, 2000);
      }).catch(() => {
        // Fallback: show URL
        prompt('Copy this URL to share:', app.app_url);
      });
    }
  }
  
  return container;
}