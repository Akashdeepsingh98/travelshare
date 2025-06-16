import { Post, MediaItem } from '../types';
import { authManager } from '../auth';
import { showAuthModal } from './AuthModal';
import { supabase } from '../lib/supabase';
import { createLocationSelector, LocationData } from './LocationSelector';
import { APP_CONFIG } from '../utils/constants';

export function createPostForm(onPostCreate: (post: Post) => void): HTMLElement {
  const container = document.createElement('div');
  container.className = 'create-post-container';
  
  function updateCreatePost() {
    const authState = authManager.getAuthState();
    
    if (authState.loading) {
      container.innerHTML = `
        <div class="create-post-loading">
          <div class="loading-spinner">Loading...</div>
        </div>
      `;
      return;
    }
    
    if (!authState.isAuthenticated || !authState.currentUser) {
      // Show login prompt for non-authenticated users
      container.innerHTML = `
        <div class="create-post-login-prompt">
          <div class="login-prompt-content">
            <div class="login-prompt-icon">✈️</div>
            <h3>Share Your Travel Adventures</h3>
            <p>Join TravelShare to share your amazing travel experiences with the world</p>
            <button class="login-prompt-btn">Get Started</button>
          </div>
        </div>
      `;
      
      const loginPromptBtn = container.querySelector('.login-prompt-btn') as HTMLButtonElement;
      loginPromptBtn.addEventListener('click', showAuthModal);
      return;
    }
    
    const currentUser = authState.currentUser;
    const avatarUrl = currentUser.avatar_url || 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop';
    
    // Create post trigger button
    const triggerButton = document.createElement('button');
    triggerButton.className = 'create-post-trigger';
    triggerButton.innerHTML = `
      <div class="trigger-content">
        <img src="${avatarUrl}" alt="${currentUser.name}" class="user-avatar">
        <span class="trigger-text">Share your travel adventure...</span>
        <div class="camera-icon">📷</div>
      </div>
    `;
    
    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'create-post-modal';
    modal.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="modal-content">
        <div class="modal-header">
          <button class="modal-close">✕</button>
          <h2>New Post</h2>
          <button class="modal-share" disabled>
            <span class="btn-text">Share</span>
            <span class="btn-loading" style="display: none;">Sharing...</span>
          </button>
        </div>
        
        <div class="modal-body">
          <div class="media-upload-section">
            <div class="media-preview-container">
              <div class="media-placeholder">
                <div class="upload-icon">📷</div>
                <p>Add photos or videos</p>
                <span class="media-hint">Up to 10 files • Supports JPG, PNG, GIF, WebP, HEIC, MP4, WebM, MOV, AVI</span>
              </div>
              <div class="media-grid" style="display: none;"></div>
              <input type="file" accept="${APP_CONFIG.supportedImageTypes.join(',')},${APP_CONFIG.supportedVideoTypes.join(',')}" multiple class="media-file-input" style="display: none;">
              <div class="media-url-section">
                <input type="url" placeholder="Or paste media URL" class="media-url-input">
                <button type="button" class="add-url-btn">Add</button>
              </div>
            </div>
          </div>
          
          <div class="post-details-section">
            <div class="user-info">
              <img src="${avatarUrl}" alt="${currentUser.name}" class="user-avatar">
              <span class="user-name">${currentUser.name}</span>
            </div>
            
            <textarea class="post-caption" placeholder="Write a caption..." rows="4"></textarea>
            
            <div class="location-section" id="location-section">
              <!-- Location selector will be inserted here -->
            </div>
          </div>
        </div>
      </div>
    `;
    
    container.innerHTML = '';
    container.appendChild(triggerButton);
    container.appendChild(modal);
    
    // Get modal elements
    const modalBackdrop = modal.querySelector('.modal-backdrop') as HTMLElement;
    const modalClose = modal.querySelector('.modal-close') as HTMLButtonElement;
    const modalShare = modal.querySelector('.modal-share') as HTMLButtonElement;
    const mediaPlaceholder = modal.querySelector('.media-placeholder') as HTMLElement;
    const mediaGrid = modal.querySelector('.media-grid') as HTMLElement;
    const mediaFileInput = modal.querySelector('.media-file-input') as HTMLInputElement;
    const mediaUrlInput = modal.querySelector('.media-url-input') as HTMLInputElement;
    const addUrlBtn = modal.querySelector('.add-url-btn') as HTMLButtonElement;
    const postCaption = modal.querySelector('.post-caption') as HTMLTextAreaElement;
    const locationSection = modal.querySelector('#location-section') as HTMLElement;
    
    let selectedMedia: MediaItem[] = [];
    let selectedLocation: LocationData | null = null;
    
    // Create location selector
    const locationSelector = createLocationSelector((location: LocationData) => {
      selectedLocation = location;
      updateShareButton();
    });
    locationSection.appendChild(locationSelector);
    
    // Open modal
    function openModal() {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      postCaption.focus();
    }
    
    // Close modal
    function closeModal() {
      modal.classList.remove('active');
      document.body.style.overflow = '';
      resetForm();
    }
    
    // Reset form
    function resetForm() {
      postCaption.value = '';
      selectedLocation = null;
      mediaUrlInput.value = '';
      selectedMedia = [];
      updateMediaPreview();
      updateShareButton();
      setLoading(false);
      
      // Reset location selector
      const locationInput = locationSelector.querySelector('.location-input') as HTMLInputElement;
      if (locationInput) {
        locationInput.value = '';
      }
    }
    
    // Set loading state
    function setLoading(loading: boolean) {
      const btnText = modalShare.querySelector('.btn-text') as HTMLElement;
      const btnLoading = modalShare.querySelector('.btn-loading') as HTMLElement;
      
      if (loading) {
        modalShare.disabled = true;
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline';
      } else {
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
        updateShareButton();
      }
    }
    
    // Update media preview
    function updateMediaPreview() {
      if (selectedMedia.length === 0) {
        mediaPlaceholder.style.display = 'flex';
        mediaGrid.style.display = 'none';
      } else {
        mediaPlaceholder.style.display = 'none';
        mediaGrid.style.display = 'grid';
        
        mediaGrid.innerHTML = selectedMedia.map((media, index) => `
          <div class="media-item" data-index="${index}">
            ${media.type === 'video' ? `
              <video src="${media.url}" controls class="media-preview">
                Your browser does not support the video tag.
              </video>
              <div class="media-type-badge">📹</div>
            ` : `
              <img src="${media.url}" alt="Preview" class="media-preview">
              <div class="media-type-badge">📷</div>
            `}
            <button class="remove-media" data-index="${index}">✕</button>
            ${selectedMedia.length > 1 ? `<div class="media-order">${index + 1}</div>` : ''}
          </div>
        `).join('');
        
        // Add remove handlers
        const removeButtons = mediaGrid.querySelectorAll('.remove-media');
        removeButtons.forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt((btn as HTMLButtonElement).dataset.index!);
            selectedMedia.splice(index, 1);
            updateMediaPreview();
            updateShareButton();
          });
        });
      }
    }
    
    // Update share button state
    function updateShareButton() {
      const hasContent = postCaption.value.trim().length > 0;
      const hasLocation = selectedLocation !== null;
      const hasMedia = selectedMedia.length > 0;
      
      modalShare.disabled = !(hasContent && hasLocation && hasMedia);
    }
    
    // Detect media type from URL
    function getMediaTypeFromUrl(url: string): 'image' | 'video' {
      const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.wmv', '.flv', '.mkv', '.hevc', '.h265'];
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.heic', '.heif'];
      
      const urlLower = url.toLowerCase();
      
      if (videoExtensions.some(ext => urlLower.includes(ext))) {
        return 'video';
      }
      
      if (imageExtensions.some(ext => urlLower.includes(ext))) {
        return 'image';
      }
      
      // Default to image if can't determine
      return 'image';
    }
    
    // Validate file type and size
    function validateFile(file: File): { isValid: boolean; error?: string } {
      // Check file type
      const allSupportedTypes = [...APP_CONFIG.supportedImageTypes, ...APP_CONFIG.supportedVideoTypes];
      if (!allSupportedTypes.includes(file.type)) {
        return { 
          isValid: false, 
          error: `Unsupported file type: ${file.type}. Supported formats: JPG, PNG, GIF, WebP, HEIC, MP4, WebM, OGG, MOV, AVI` 
        };
      }
      
      // Check file size
      const maxSizeInBytes = APP_CONFIG.maxFileSize * 1024 * 1024;
      if (file.size > maxSizeInBytes) {
        return { 
          isValid: false, 
          error: `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum size: ${APP_CONFIG.maxFileSize}MB` 
        };
      }
      
      return { isValid: true };
    }
    
    // Event listeners
    triggerButton.addEventListener('click', openModal);
    modalBackdrop.addEventListener('click', closeModal);
    modalClose.addEventListener('click', closeModal);
    
    // Media upload handling
    mediaPlaceholder.addEventListener('click', () => {
      if (selectedMedia.length < APP_CONFIG.maxMediaFiles) {
        mediaFileInput.click();
      }
    });
    
    mediaFileInput.addEventListener('change', (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      
      files.forEach(file => {
        if (selectedMedia.length >= APP_CONFIG.maxMediaFiles) {
          alert(`Maximum ${APP_CONFIG.maxMediaFiles} files allowed`);
          return;
        }
        
        // Validate file
        const validation = validateFile(file);
        if (!validation.isValid) {
          alert(validation.error);
          return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
          const url = e.target?.result as string;
          const type = file.type.startsWith('video/') ? 'video' : 'image';
          
          selectedMedia.push({ url, type });
          updateMediaPreview();
          updateShareButton();
        };
        reader.readAsDataURL(file);
      });
      
      // Reset input
      mediaFileInput.value = '';
    });
    
    // URL input handling
    addUrlBtn.addEventListener('click', () => {
      const url = mediaUrlInput.value.trim();
      if (url && selectedMedia.length < APP_CONFIG.maxMediaFiles) {
        const type = getMediaTypeFromUrl(url);
        selectedMedia.push({ url, type });
        mediaUrlInput.value = '';
        updateMediaPreview();
        updateShareButton();
      }
    });
    
    mediaUrlInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        addUrlBtn.click();
      }
    });
    
    // Form validation
    postCaption.addEventListener('input', updateShareButton);
    
    // Handle form submission
    modalShare.addEventListener('click', async () => {
      const content = postCaption.value.trim();
      
      if (content && selectedLocation && selectedMedia.length > 0 && currentUser) {
        setLoading(true);
        
        try {
          const mediaUrls = selectedMedia.map(media => media.url);
          const mediaTypes = selectedMedia.map(media => media.type);
          
          const { data, error } = await supabase
            .from('posts')
            .insert({
              user_id: currentUser.id,
              location: selectedLocation.name,
              content,
              image_url: mediaUrls[0], // Keep first media as image_url for backward compatibility
              media_urls: mediaUrls,
              media_types: mediaTypes
            })
            .select(`
              *,
              user:profiles(*)
            `)
            .single();

          if (error) throw error;

          const newPost: Post = {
            ...data,
            user: data.user,
            comments: [],
            user_has_liked: false
          };
          
          onPostCreate(newPost);
          closeModal();
        } catch (error) {
          console.error('Error creating post:', error);
          setLoading(false);
        }
      }
    });
    
    // Close modal on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
      }
    });
  }
  
  // Initial render
  updateCreatePost();
  
  // Listen for auth changes
  authManager.onAuthChange(() => {
    updateCreatePost();
  });
  
  return container;
}