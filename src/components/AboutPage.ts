import { authManager } from '../auth';

export function createAboutPage(onNavigateBack: () => void): HTMLElement {
  const container = document.createElement('div');
  container.className = 'about-page';
  
  // Add component styles
  const style = document.createElement('style');
  style.textContent = `
    .about-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 2rem 1rem;
    }

    .about-header {
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

    .about-header h1 {
      color: white;
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0;
    }

    .about-header .back-btn {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
    }

    .about-header .back-btn:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: translateY(-1px);
    }

    .about-content {
      background: white;
      border-radius: 1rem;
      padding: 2rem;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      max-width: 1200px;
      margin: 0 auto;
    }

    .hero-section {
      text-align: center;
      margin-bottom: 2rem;
      padding: 2rem 0;
    }

    .hero-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .hero-section h2 {
      color: #374151;
      font-size: 2.5rem;
      font-weight: 700;
      margin: 0 0 1rem 0;
    }

    .hero-description {
      color: #6b7280;
      font-size: 1.25rem;
      line-height: 1.6;
      max-width: 600px;
      margin: 0 auto;
    }

    .demo-info-section {
      margin-bottom: 3rem;
    }

    .demo-info-card {
      background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
      border: 2px solid #2196f3;
      border-radius: 1rem;
      padding: 2rem;
      display: flex;
      align-items: flex-start;
      gap: 1.5rem;
    }

    .demo-info-icon {
      font-size: 3rem;
      flex-shrink: 0;
    }

    .demo-info-content h3 {
      color: #1565c0;
      font-size: 1.5rem;
      font-weight: 700;
      margin: 0 0 1rem 0;
    }

    .demo-info-content p {
      color: #1976d2;
      font-size: 1.125rem;
      line-height: 1.6;
      margin: 0 0 1.5rem 0;
    }

    .demo-info-content code {
      background: rgba(25, 118, 210, 0.1);
      color: #0d47a1;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-family: 'Courier New', monospace;
      font-weight: 600;
    }

    .demo-tips h4 {
      color: #0d47a1;
      font-size: 1.125rem;
      font-weight: 600;
      margin: 0 0 0.75rem 0;
    }

    .demo-tips ul {
      color: #1976d2;
      line-height: 1.8;
      margin: 0;
      padding-left: 1rem;
    }

    .demo-tips li {
      margin-bottom: 0.5rem;
      font-weight: 500;
    }

    .features-section,
    .how-it-works-section,
    .business-section,
    .technology-section,
    .community-section {
      margin-bottom: 3rem;
    }

    .features-section h3,
    .how-it-works-section h3,
    .business-section h3,
    .technology-section h3,
    .community-section h3 {
      color: #374151;
      font-size: 2rem;
      font-weight: 600;
      margin: 0 0 2rem 0;
      text-align: center;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
    }

    .feature-card {
      background: #f9fafb;
      padding: 2rem;
      border-radius: 1rem;
      text-align: center;
      transition: all 0.2s;
    }

    .feature-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    }

    .feature-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .feature-card h4 {
      color: #374151;
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0 0 1rem 0;
    }

    .feature-card p {
      color: #6b7280;
      line-height: 1.6;
      margin: 0;
    }

    .steps-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
    }

    .step {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
    }

    .step-number {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      width: 3rem;
      height: 3rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1.25rem;
      flex-shrink: 0;
    }

    .step-content h4 {
      color: #374151;
      font-size: 1.125rem;
      font-weight: 600;
      margin: 0 0 0.5rem 0;
    }

    .step-content p {
      color: #6b7280;
      line-height: 1.6;
      margin: 0;
    }

    .business-content {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 3rem;
    }

    .business-text h4 {
      color: #374151;
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0 0 1rem 0;
    }

    .business-text p {
      color: #6b7280;
      line-height: 1.6;
      margin: 0 0 1rem 0;
    }

    .business-text ul {
      color: #6b7280;
      line-height: 1.8;
      padding-left: 1rem;
    }

    .business-text li {
      margin-bottom: 0.5rem;
    }

    .tech-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
    }

    .tech-item {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1.5rem;
      background: #f9fafb;
      border-radius: 1rem;
    }

    .tech-icon {
      font-size: 2rem;
      flex-shrink: 0;
    }

    .tech-content h4 {
      color: #374151;
      font-size: 1.125rem;
      font-weight: 600;
      margin: 0 0 0.5rem 0;
    }

    .tech-content p {
      color: #6b7280;
      line-height: 1.6;
      margin: 0;
    }

    .community-content {
      text-align: center;
    }

    .community-content > p {
      color: #6b7280;
      font-size: 1.125rem;
      line-height: 1.6;
      max-width: 600px;
      margin: 0 auto 2rem auto;
    }

    .community-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
      margin-bottom: 3rem;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem;
      background: #f9fafb;
      border-radius: 1rem;
    }

    .stat-icon {
      font-size: 2.5rem;
      flex-shrink: 0;
    }

    .stat-text h4 {
      color: #374151;
      font-size: 1.125rem;
      font-weight: 600;
      margin: 0 0 0.25rem 0;
    }

    .stat-text p {
      color: #6b7280;
      margin: 0;
    }

    .cta-section {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 3rem 2rem;
      border-radius: 1rem;
      color: white;
    }

    .cta-section h4 {
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0 0 0.5rem 0;
    }

    .cta-section p {
      font-size: 1.125rem;
      margin: 0 0 2rem 0;
      opacity: 0.9;
    }

    .cta-button {
      background: white;
      color: #667eea;
      border: none;
      padding: 1rem 2rem;
      border-radius: 0.5rem;
      font-size: 1.125rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
    }

    @media (max-width: 768px) {
      .about-page {
        padding: 1rem;
      }

      .about-content {
        padding: 1.5rem;
      }

      .hero-section h2 {
        font-size: 2rem;
      }

      .hero-description {
        font-size: 1.125rem;
      }

      .demo-info-card {
        flex-direction: column;
        text-align: center;
      }

      .features-grid {
        grid-template-columns: 1fr;
      }

      .steps-container {
        grid-template-columns: 1fr;
      }

      .business-content {
        grid-template-columns: 1fr;
      }

      .tech-grid {
        grid-template-columns: 1fr;
      }

      .community-stats {
        grid-template-columns: 1fr;
      }
    }
  `;
  
  if (!document.head.querySelector('#about-page-styles')) {
    style.id = 'about-page-styles';
    document.head.appendChild(style);
  }
  
  container.innerHTML = `
    <div class="about-header">
      <button class="back-btn">← Back</button>
      <h1>About TravelShare</h1>
    </div>
    
    <div class="about-content">
      <div class="hero-section">
        <div class="hero-icon">✈️🌍</div>
        <h2>Share Your Travel Adventures</h2>
        <p class="hero-description">
          TravelShare is a social platform where travelers connect, share experiences, and discover amazing destinations through authentic stories from fellow adventurers.
        </p>
      </div>
      
      <div class="demo-info-section">
        <div class="demo-info-card">
          <div class="demo-info-icon">🎯</div>
          <div class="demo-info-content">
            <h3>Try It Now - No Real Email Required!</h3>
            <p>This is a demo application. You can sign up with any fake email address (like <code>demo@test.com</code> or <code>traveler@example.org</code>) and start exploring immediately. No email verification needed!</p>
            <div class="demo-tips">
              <h4>Quick Start Tips:</h4>
              <ul>
                <li>✅ Use any fake email to create an account</li>
                <li>✅ Choose a password you'll remember</li>
                <li>✅ Log back in anytime with the same fake email + password</li>
                <li>✅ All features work exactly like a real social platform</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      <div class="features-section">
        <h3>Features</h3>
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">📸</div>
            <h4>Share Your Journey</h4>
            <p>Post photos, videos, and stories from your travels. Add locations and share the moments that made your trip special.</p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon">🔍</div>
            <h4>Explore Destinations</h4>
            <p>Discover new places through real traveler experiences. Search by location, hashtags, or browse popular destinations.</p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon">👥</div>
            <h4>Connect with Travelers</h4>
            <p>Follow other travelers, like and comment on posts, and build a community of adventure seekers.</p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon">🤖</div>
            <h4>AI Travel Assistant</h4>
            <p>Get personalized travel recommendations powered by Google Gemini AI, based on real community experiences.</p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon">📱</div>
            <h4>Mini Apps</h4>
            <p>Share your business services directly on your profile. Perfect for transportation, food delivery, hotels, and more.</p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon">🔌</div>
            <h4>MCP Integration</h4>
            <p>Connect real-time business data through Model Context Protocol for enhanced AI recommendations.</p>
          </div>
        </div>
      </div>
      
      <div class="how-it-works-section">
        <h3>How It Works</h3>
        <div class="steps-container">
          <div class="step">
            <div class="step-number">1</div>
            <div class="step-content">
              <h4>Sign Up (Fake Email OK!)</h4>
              <p>Create your account with any email address - real or fake. No verification required for this demo!</p>
            </div>
          </div>
          
          <div class="step">
            <div class="step-number">2</div>
            <div class="step-content">
              <h4>Share Your Adventures</h4>
              <p>Post photos and stories from your travels. Add locations and describe your experiences.</p>
            </div>
          </div>
          
          <div class="step">
            <div class="step-number">3</div>
            <div class="step-content">
              <h4>Discover & Connect</h4>
              <p>Explore posts from other travelers, follow interesting accounts, and engage with the community.</p>
            </div>
          </div>
          
          <div class="step">
            <div class="step-number">4</div>
            <div class="step-content">
              <h4>Get AI Recommendations</h4>
              <p>Chat with our AI assistant for personalized travel advice based on community experiences.</p>
            </div>
          </div>
        </div>
      </div>
      
      <div class="business-section">
        <h3>For Businesses</h3>
        <div class="business-content">
          <div class="business-text">
            <h4>Showcase Your Services</h4>
            <p>Business owners can create mini apps to showcase their services directly on their profiles. Perfect for:</p>
            <ul>
              <li>🚗 Transportation and taxi services</li>
              <li>🍽️ Restaurants and food delivery</li>
              <li>🏨 Hotels and accommodations</li>
              <li>🛍️ Shopping and e-commerce</li>
              <li>🎬 Entertainment and attractions</li>
              <li>💼 Business services</li>
            </ul>
          </div>
          
          <div class="business-text">
            <h4>MCP Integration</h4>
            <p>Connect your business data through Model Context Protocol (MCP) to provide real-time information to our AI assistant:</p>
            <ul>
              <li>📊 Real-time availability and pricing</li>
              <li>📋 Current menus and services</li>
              <li>🔄 Live booking and reservation data</li>
              <li>📈 Enhanced customer recommendations</li>
            </ul>
          </div>
        </div>
      </div>
      
      <div class="technology-section">
        <h3>Technology</h3>
        <div class="tech-grid">
          <div class="tech-item">
            <div class="tech-icon">⚡</div>
            <div class="tech-content">
              <h4>Modern Web Technology</h4>
              <p>Built with TypeScript, Vite, and modern web standards for a fast, responsive experience.</p>
            </div>
          </div>
          
          <div class="tech-item">
            <div class="tech-icon">🔒</div>
            <div class="tech-content">
              <h4>Secure & Reliable</h4>
              <p>Powered by Supabase with row-level security, authentication, and real-time updates.</p>
            </div>
          </div>
          
          <div class="tech-item">
            <div class="tech-icon">🌐</div>
            <div class="tech-content">
              <h4>Global Accessibility</h4>
              <p>Responsive design that works on all devices, with support for multiple media formats.</p>
            </div>
          </div>
          
          <div class="tech-item">
            <div class="tech-icon">🚀</div>
            <div class="tech-content">
              <h4>AI-Powered</h4>
              <p>Google Gemini AI integration for intelligent travel recommendations and assistance.</p>
            </div>
          </div>
        </div>
      </div>
      
      <div class="community-section">
        <h3>Join Our Community</h3>
        <div class="community-content">
          <p>TravelShare is more than just a social platform – it's a community of passionate travelers sharing authentic experiences and helping each other discover the world.</p>
          
          <div class="community-stats">
            <div class="stat-card">
              <div class="stat-icon">👥</div>
              <div class="stat-text">
                <h4>Growing Community</h4>
                <p>Join travelers from around the world</p>
              </div>
            </div>
            
            <div class="stat-card">
              <div class="stat-icon">🌍</div>
              <div class="stat-text">
                <h4>Global Destinations</h4>
                <p>Discover places you never knew existed</p>
              </div>
            </div>
            
            <div class="stat-card">
              <div class="stat-icon">💡</div>
              <div class="stat-text">
                <h4>Real Experiences</h4>
                <p>Authentic stories from real travelers</p>
              </div>
            </div>
          </div>
          
          <div class="cta-section">
            <h4>Ready to start your journey?</h4>
            <p>Sign up today with any email (fake ones work too!) and become part of the TravelShare community!</p>
            <button class="cta-button" id="get-started-btn">Get Started</button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Event listeners
  const backBtn = container.querySelector('.back-btn') as HTMLButtonElement;
  const getStartedBtn = container.querySelector('#get-started-btn') as HTMLButtonElement;
  
  backBtn.addEventListener('click', onNavigateBack);
  
  getStartedBtn.addEventListener('click', () => {
    const authState = authManager.getAuthState();
    if (!authState.isAuthenticated) {
      // Show auth modal
      const authModal = document.querySelector('.auth-modal') as HTMLElement;
      if (authModal) {
        authModal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    } else {
      // Navigate back to feed
      onNavigateBack();
    }
  });
  
  return container;
}