import { authManager } from '../auth';

export function createAuthModal(): HTMLElement {
  const modal = document.createElement('div');
  modal.className = 'auth-modal fixed inset-0 z-50 hidden';
  
  modal.innerHTML = `
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm"></div>
    <div class="fixed inset-0 flex items-center justify-center p-4">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div class="p-6 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <h2 class="text-2xl font-bold text-gray-900">Welcome to TravelShare</h2>
            <button class="p-2 hover:bg-gray-100 rounded-lg transition-colors modal-close">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
        
        <div class="p-6">
          <div class="flex border-b border-gray-200 mb-6">
            <button class="auth-tab flex-1 py-2 px-4 text-center font-medium border-b-2 border-primary-600 text-primary-600" data-tab="login">
              Log In
            </button>
            <button class="auth-tab flex-1 py-2 px-4 text-center font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700" data-tab="signup">
              Sign Up
            </button>
          </div>
          
          <!-- Login Form -->
          <form class="auth-form space-y-4" data-form="login">
            <div>
              <label class="form-label" for="login-email">Email</label>
              <input type="email" id="login-email" class="form-input" placeholder="Enter your email" required>
            </div>
            <div>
              <label class="form-label" for="login-password">Password</label>
              <input type="password" id="login-password" class="form-input" placeholder="Enter your password" required>
            </div>
            <div class="form-error" id="login-error"></div>
            <button type="submit" class="w-full btn-primary">
              <span class="btn-text">Log In</span>
              <span class="btn-loading hidden">
                <div class="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </span>
            </button>
          </form>
          
          <!-- Signup Form -->
          <form class="auth-form space-y-4 hidden" data-form="signup">
            <div>
              <label class="form-label" for="signup-name">Full Name</label>
              <input type="text" id="signup-name" class="form-input" placeholder="Enter your full name" required>
            </div>
            <div>
              <label class="form-label" for="signup-email">Email</label>
              <input type="email" id="signup-email" class="form-input" placeholder="Enter your email" required>
            </div>
            <div>
              <label class="form-label" for="signup-password">Password</label>
              <input type="password" id="signup-password" class="form-input" placeholder="Create a password (min 6 characters)" required>
            </div>
            <div class="form-error" id="signup-error"></div>
            <button type="submit" class="w-full btn-primary">
              <span class="btn-text">Sign Up</span>
              <span class="btn-loading hidden">
                <div class="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  `;
  
  // Add active class styles
  const style = document.createElement('style');
  style.textContent = `
    .auth-modal.active {
      display: block;
    }
  `;
  document.head.appendChild(style);
  
  // Get elements
  const modalBackdrop = modal.querySelector('.fixed.inset-0.bg-black\\/50') as HTMLElement;
  const modalClose = modal.querySelector('.modal-close') as HTMLButtonElement;
  const authTabs = modal.querySelectorAll('.auth-tab') as NodeListOf<HTMLButtonElement>;
  const authForms = modal.querySelectorAll('.auth-form') as NodeListOf<HTMLFormElement>;
  const loginForm = modal.querySelector('[data-form="login"]') as HTMLFormElement;
  const signupForm = modal.querySelector('[data-form="signup"]') as HTMLFormElement;
  
  // Tab switching
  authTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabType = tab.dataset.tab!;
      
      // Update active tab
      authTabs.forEach(t => {
        t.classList.remove('border-primary-600', 'text-primary-600');
        t.classList.add('border-transparent', 'text-gray-500');
      });
      tab.classList.remove('border-transparent', 'text-gray-500');
      tab.classList.add('border-primary-600', 'text-primary-600');
      
      // Update active form
      authForms.forEach(form => {
        form.classList.add('hidden');
        if (form.dataset.form === tabType) {
          form.classList.remove('hidden');
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
    const form = modal.querySelector(`[data-form="${formType}"]`) as HTMLFormElement;
    const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
    const btnText = submitBtn.querySelector('.btn-text') as HTMLElement;
    const btnLoading = submitBtn.querySelector('.btn-loading') as HTMLElement;
    
    if (loading) {
      submitBtn.disabled = true;
      btnText.classList.add('hidden');
      btnLoading.classList.remove('hidden');
    } else {
      submitBtn.disabled = false;
      btnText.classList.remove('hidden');
      btnLoading.classList.add('hidden');
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
      showError('signup', 'Account created! Please check your email to verify your account.');
      setTimeout(() => {
        const loginTab = modal.querySelector('[data-tab="login"]') as HTMLButtonElement;
        loginTab.click();
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