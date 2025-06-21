import { Post, MediaItem } from '../types';
import { authManager } from '../auth';
import { showAuthModal } from './AuthModal';
import { supabase } from '../lib/supabase';
import { createLocationSelector, LocationData } from './LocationSelector';
import { APP_CONFIG } from '../utils/constants';

type PostType = 'media' | 'text';

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
    
    // Check if user is approved
    checkUserApprovalStatus(authState.currentUser.id).then(isApproved => {
      if (!isApproved) {
        container.innerHTML = `
          <div class="create-post-approval-pending">
            <div class="approval-pending-content">
              <div class="approval-pending-icon">⏳</div>
              <h3>Account Pending Approval</h3>
              <p>Your account is currently under review. You'll be able to create posts once your account is approved by our team.</p>
              <div class="approval-info">
                <p><strong>What happens next?</strong></p>
                <ul>
                  <li>Our team will review your account</li>
                  <li>You'll receive an email notification when approved</li>
                  <li>You can still browse and view posts while waiting</li>
                </ul>
              </div>
            </div>
          </div>
        `;
        return;
      }
      
      // User is approved, show normal create post form
      renderCreatePostForm(authState.currentUser);
    });
  }
  
  async function checkUserApprovalStatus(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_approved')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error checking approval status:', error);
        return false;
      }
      
      return data?.is_approved || false;
    } catch (error) {
      console.error('Error checking approval status:', error);
      return false;
    }
  }
  
  function renderCreatePostForm(currentUser: any) {
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
          <!-- Post Type Selection -->
          <div class="post-type-section">
            <div class="post-type-tabs">
              <button class="post-type-tab active" data-type="media">
                <span class="tab-icon">📷</span>
                <span class="tab-text">Media Post</span>
              </button>
              <button class="post-type-tab" data-type="text">
                <span class="tab-icon">📝</span>
                <span class="tab-text">Text Post</span>
              </button>
            </div>
          </div>
          
          <!-- Media Upload Section -->
          <div class="media-upload-section" id="media-upload-section">
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
          
          <!-- Post Details Section -->
          <div class="post-details-section">
            <div class="user-info">
              <img src="${avatarUrl}" alt="${currentUser.name}" class="user-avatar">
              <span class="user-name">${currentUser.name}</span>
            </div>
            
            <div class="caption-container">
              <textarea class="post-caption" placeholder="Write a caption..." rows="4"></textarea>
              <div class="word-count-container">
                <span class="word-count">0 words</span>
                <span class="word-limit" style="display: none;">/ ${APP_CONFIG.maxTextPostWords} words</span>
              </div>
            </div>
            
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
    const postTypeTabs = modal.querySelectorAll('.post-type-tab') as NodeListOf<HTMLButtonElement>;
    const mediaUploadSection = modal.querySelector('#media-upload-section') as HTMLElement;
    const mediaPlaceholder = modal.querySelector('.media-placeholder') as HTMLElement;
    const mediaGrid = modal.querySelector('.media-grid') as HTMLElement;
    const mediaFileInput = modal.querySelector('.media-file-input') as HTMLInputElement;
    const mediaUrlInput = modal.querySelector('.media-url-input') as HTMLInputElement;
    const addUrlBtn = modal.querySelector('.add-url-btn') as HTMLButtonElement;
    const postCaption = modal.querySelector('.post-caption') as HTMLTextAreaElement;
    const wordCountElement = modal.querySelector('.word-count') as HTMLElement;
    const wordLimitElement = modal.querySelector('.word-limit') as HTMLElement;
    const locationSection = modal.querySelector('#location-section') as HTMLElement;
    
    let selectedMedia: MediaItem[] = [];
    let selectedLocation: LocationData | null = null;
    let currentPostType: PostType = 'media';
    
    // Create location selector
    const locationSelector = createLocationSelector((location: LocationData) => {
      selectedLocation = location;
      updateShareButton();
    });
    locationSection.appendChild(locationSelector);
    
    // Post type switching
    postTypeTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const newType = tab.dataset.type as PostType;
        if (newType === currentPostType) return;
        
        // Update active tab
        postTypeTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Update post type
        currentPostType = newType;
        
        // Show/hide media section
        if (currentPostType === 'text') {
          mediaUploadSection.style.display = 'none';
          wordLimitElement.style.display = 'inline';
          postCaption.placeholder = 'Share your travel thoughts, tips, or experiences...';
        } else {
          mediaUploadSection.style.display = 'block';
          wordLimitElement.style.display = 'none';
          postCaption.placeholder = 'Write a caption...';
        }
        
        updateWordCount();
        updateShareButton();
      });
    });
    
    // Word counting functionality
    function countWords(text: string): number {
      return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    }
    
    function updateWordCount() {
      const text = postCaption.value;
      const wordCount = countWords(text);
      
      wordCountElement.textContent = `${wordCount} word${wordCount === 1 ? '' : 's'}`;
      
      if (currentPostType === 'text') {
        const isOverLimit = wordCount > APP_CONFIG.maxTextPostWords;
        wordCountElement.classList.toggle('over-limit', isOverLimit);
        
        if (isOverLimit) {
          wordCountElement.style.color = '#ef4444';
        } else if (wordCount > APP_CONFIG.maxTextPostWords * 0.8) {
          wordCountElement.style.color = '#f59e0b';
        } else {
          wordCountElement.style.color = '#6b7280';
        }
      } else {
        wordCountElement.style.color = '#6b7280';
      }
    }
    
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
      currentPostType = 'media';
      
      // Reset post type tabs
      postTypeTabs.forEach(tab => tab.classList.remove('active'));
      postTypeTabs[0].classList.add('active');
      
      // Reset UI
      mediaUploadSection.style.display = 'block';
      wordLimitElement.style.display = 'none';
      postCaption.placeholder = 'Write a caption...';
      
      updateMediaPreview();
      updateWordCount();
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
      const wordCount = countWords(postCaption.value);
      const isWordCountValid = currentPostType === 'text' ? wordCount <= APP_CONFIG.maxTextPostWords : true;
      
      let isValid = false;
      
      if (currentPostType === 'media') {
        // Media post requires content, location, and at least one media file
        isValid = hasContent && hasLocation && hasMedia && isWordCountValid;
      } else {
        // Text post requires content and location, media is optional
        isValid = hasContent && hasLocation && isWordCountValid;
      }
      
      modalShare.disabled = !isValid;
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
    postCaption.addEventListener('input', () => {
      updateWordCount();
      updateShareButton();
    });
    
    // Handle form submission
    modalShare.addEventListener('click', async () => {
      const content = postCaption.value.trim();
      const wordCount = countWords(content);
      
      // Validate word count for text posts
      if (currentPostType === 'text' && wordCount > APP_CONFIG.maxTextPostWords) {
        alert(`Text posts cannot exceed ${APP_CONFIG.maxTextPostWords} words. Current: ${wordCount} words.`);
        return;
      }
      
      if (content && selectedLocation && currentUser) {
        // Check if media is required
        if (currentPostType === 'media' && selectedMedia.length === 0) {
          alert('Please add at least one photo or video for a media post.');
          return;
        }
        
        setLoading(true);
        
        try {
          const mediaUrls = selectedMedia.map(media => media.url);
          const mediaTypes = selectedMedia.map(media => media.type);
          
          // Prepare post data with coordinates
          const postData: any = {
            user_id: currentUser.id,
            location: selectedLocation.name,
            content,
            media_urls: mediaUrls,
            media_types: mediaTypes
          };
          
          // For backward compatibility, set image_url to first media if available
          if (mediaUrls.length > 0) {
            postData.image_url = mediaUrls[0];
          }
          
          // Add coordinates if available
          if (selectedLocation.lat !== undefined && selectedLocation.lng !== undefined) {
            postData.latitude = selectedLocation.lat;
            postData.longitude = selectedLocation.lng;
          }
          
          const { data, error } = await supabase
            .from('posts')
            .insert(postData)
            .select(`
              *,
              user:profiles(*)
            `)
            .single();

          if (error) throw error;

          // Create the Post object with proper structure
          const newPost: Post = {
            id: data.id,
            user_id: data.user_id,
            location: data.location,
            content: data.content,
            image_url: data.image_url,
            media_urls: data.media_urls,
            media_types: data.media_types,
            created_at: data.created_at,
            likes_count: data.likes_count || 0,
            user: data.user,
            comments: [],
            user_has_liked: false
          };
          
          onPostCreate(newPost);
          closeModal();
        } catch (error) {
          console.error('Error creating post:', error);
          setLoading(false);
          
          // Show user-friendly error message
          if (error.message?.includes('new row violates row-level security policy')) {
            alert('Your account needs to be approved before you can create posts. Please wait for admin approval.');
          } else {
            alert('Failed to create post. Please try again.');
          }
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