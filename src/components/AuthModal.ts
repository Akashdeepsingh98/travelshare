import { authManager } from '../auth';

export function createAuthModal(): HTMLElement {
  const modal = document.createElement('div');
  modal.className = 'auth-modal';
  
  modal.innerHTML = `
    <div class="modal-backdrop"></div>
    <div class="auth-modal-content">
      <div class="auth-modal-header">
        <button class="modal-close">✕</button>
        <h2 class="auth-title">Welcome to TravelShare</h2>
      </div>
      
      <div class="auth-modal-body">
        <div class="auth-tabs">
          <button class="auth-tab active" data-tab="login">Log In</button>
          <button class="auth-tab" data-tab="signup">Sign Up</button>
        </div>
        
        <div class="auth-forms">
          <!-- Login Form -->
          <form class="auth-form login-form active" data-form="login">
            <div class="demo-notice">
              <div class="demo-icon">💡</div>
              <p><strong>Demo Mode:</strong> You can log in with any email you've used before (even fake ones like test@example.com) as long as you remember the password.</p>
            </div>
            <div class="form-group">
              <input type="email" placeholder="Email (can be fake for demo)" class="form-input" id="login-email" required>
            </div>
            <div class="form-group">
              <input type="password" placeholder="Password" class="form-input" id="login-password" required>
            </div>
            <div class="form-error" id="login-error"></div>
            <button type="submit" class="auth-submit-btn">
              <span class="btn-text">Log In</span>
              <span class="btn-loading" style="display: none;">Logging in...</span>
            </button>
          </form>
          
          <!-- Signup Form -->
          <form class="auth-form signup-form" data-form="signup">
            <div class="demo-notice">
              <div class="demo-icon">🎯</div>
              <p><strong>Quick Start:</strong> You can use any fake email (like demo@test.com) to create an account instantly. No email verification required!</p>
            </div>
            <div class="form-group">
              <input type="text" placeholder="Full Name" class="form-input" id="signup-name" required>
            </div>
            <div class="form-group">
              <input type="email" placeholder="Email (fake emails work!)" class="form-input" id="signup-email" required>
            </div>
            <div class="form-group">
              <input type="password" placeholder="Password (min 6 characters)" class="form-input" id="signup-password" required>
            </div>
            <div class="form-error" id="signup-error"></div>
            <button type="submit" class="auth-submit-btn">
              <span class="btn-text">Sign Up</span>
              <span class="btn-loading" style="display: none;">Creating account...</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  `;
  
  // Add styles for demo notice
  const style = document.createElement('style');
  style.textContent = `
    .demo-notice {
      background: linear-gradient(135deg, #e0f2fe 0%, #f3e5f5 100%);
      border: 1px solid #81d4fa;
      border-radius: 0.5rem;
      padding: 1rem;
      margin-bottom: 1.5rem;
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .demo-icon {
      font-size: 1.25rem;
      flex-shrink: 0;
      margin-top: 0.125rem;
    }

    .demo-notice p {
      margin: 0;
      font-size: 0.875rem;
      line-height: 1.4;
      color: #1565c0;
    }

    .demo-notice strong {
      color: #0d47a1;
      font-weight: 600;
    }
  `;
  
  if (!document.head.querySelector('#auth-demo-styles')) {
    style.id = 'auth-demo-styles';
    document.head.appendChild(style);
  }
  
  // Get elements
  const modalBackdrop = modal.querySelector('.modal-backdrop') as HTMLElement;
  const modalClose = modal.querySelector('.modal-close') as HTMLButtonElement;
  const authTabs = modal.querySelectorAll('.auth-tab') as NodeListOf<HTMLButtonElement>;
  const authForms = modal.querySelectorAll('.auth-form') as NodeListOf<HTMLFormElement>;
  const loginForm = modal.querySelector('.login-form') as HTMLFormElement;
  const signupForm = modal.querySelector('.signup-form') as HTMLFormElement;
  
  // Tab switching
  authTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabType = tab.dataset.tab!;
      
      // Update active tab
      authTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Update active form
      authForms.forEach(form => {
        form.classList.remove('active');
        if (form.dataset.form === tabType) {
          form.classList.add('active');
        }
      });
      
      // Clear errors
      clearErrors();
    });
  });
  
  // Close modal
  function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
    clearForms();
    clearErrors();
  }
  
  // Clear forms
  function clearForms() {
    loginForm.reset();
    signupForm.reset();
  }
  
  // Clear errors
  function clearErrors() {
    const errorElements = modal.querySelectorAll('.form-error');
    errorElements.forEach(el => el.textContent = '');
  }
  
  // Show error
  function showError(formType: string, message: string) {
    const errorElement = modal.querySelector(`#${formType}-error`) as HTMLElement;
    errorElement.textContent = message;
  }
  
  // Set loading state
  function setLoading(formType: string, loading: boolean) {
    const form = modal.querySelector(`.${formType}-form`) as HTMLFormElement;
    const submitBtn = form.querySelector('.auth-submit-btn') as HTMLButtonElement;
    const btnText = submitBtn.querySelector('.btn-text') as HTMLElement;
    const btnLoading = submitBtn.querySelector('.btn-loading') as HTMLElement;
    
    if (loading) {
      submitBtn.disabled = true;
      btnText.style.display = 'none';
      btnLoading.style.display = 'inline';
    } else {
      submitBtn.disabled = false;
      btnText.style.display = 'inline';
      btnLoading.style.display = 'none';
    }
  }
  
  // Event listeners
  modalBackdrop.addEventListener('click', closeModal);
  modalClose.addEventListener('click', closeModal);
  
  // Login form
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = (modal.querySelector('#login-email') as HTMLInputElement).value;
    const password = (modal.querySelector('#login-password') as HTMLInputElement).value;
    
    setLoading('login', true);
    clearErrors();
    
    const result = await authManager.login(email, password);
    
    setLoading('login', false);
    
    if (result.success) {
      closeModal();
    } else {
      showError('login', result.error!);
    }
  });
  
  // Signup form
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = (modal.querySelector('#signup-name') as HTMLInputElement).value;
    const email = (modal.querySelector('#signup-email') as HTMLInputElement).value;
    const password = (modal.querySelector('#signup-password') as HTMLInputElement).value;
    
    setLoading('signup', true);
    clearErrors();
    
    const result = await authManager.signup(name, email, password);
    
    setLoading('signup', false);
    
    if (result.success) {
      // Show success message and switch to login
      showError('signup', 'Account created successfully! You can now log in with your credentials.');
      setTimeout(() => {
        const loginTab = modal.querySelector('[data-tab="login"]') as HTMLButtonElement;
        loginTab.click();
        // Pre-fill the login form
        const loginEmailInput = modal.querySelector('#login-email') as HTMLInputElement;
        loginEmailInput.value = email;
      }, 2000);
    } else {
      showError('signup', result.error!);
    }
  });
  
  // Close on escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });
  
  return modal;
}

export function showAuthModal() {
  const existingModal = document.querySelector('.auth-modal') as HTMLElement;
  if (existingModal) {
    existingModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}