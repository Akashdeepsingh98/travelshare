import { authManager } from '../auth';
import { showAuthModal } from './AuthModal';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

export function createAIPage(onNavigateBack: () => void): HTMLElement {
  const container = document.createElement('div');
  container.className = 'ai-page';
  
  let chatMessages: ChatMessage[] = [];
  let isLoading = false;
  
  function generateMessageId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }
  
  function addMessage(type: 'user' | 'ai', content: string) {
    const message: ChatMessage = {
      id: generateMessageId(),
      type,
      content,
      timestamp: new Date()
    };
    
    chatMessages.push(message);
    renderMessages();
    scrollToBottom();
  }
  
  function renderAIPage() {
    const authState = authManager.getAuthState();
    
    container.innerHTML = `
      <div class="ai-page-header">
        <button class="back-btn">← Back</button>
        <div class="ai-header-content">
          <h1>🤖 TravelShare AI</h1>
          <p class="ai-subtitle">Ask me anything about travel destinations and experiences!</p>
        </div>
      </div>
      
      <div class="ai-page-content">
        ${!authState.isAuthenticated ? `
          <div class="ai-login-prompt">
            <div class="ai-login-content">
              <div class="ai-login-icon">🤖✈️</div>
              <h3>Discover Amazing Travel Insights</h3>
              <p>Log in to chat with our AI assistant and get personalized travel recommendations based on real traveler experiences!</p>
              <button class="ai-login-btn">Get Started</button>
            </div>
          </div>
        ` : `
          <!-- AI Status Section -->
          <div class="ai-status-section">
            <div class="ai-status-content">
              <div class="ai-status-indicator">
                <span class="status-dot active"></span>
                <span class="status-text">AI Ready - Powered by Google Gemini</span>
              </div>
              <div class="ai-capabilities">
                <span class="capability-tag">🌍 Travel Expert</span>
                <span class="capability-tag">📊 Community Data</span>
                <span class="capability-tag">💡 Smart Recommendations</span>
              </div>
            </div>
          </div>

          <div class="chat-container">
            <div class="chat-messages" id="chat-messages">
              ${chatMessages.length === 0 ? `
                <div class="welcome-message">
                  <div class="ai-avatar">🤖</div>
                  <div class="welcome-content">
                    <h3>Welcome to TravelShare AI!</h3>
                    <p>I'm powered by Google Gemini and have access to real travel experiences from your community. I can help you discover amazing destinations, get travel tips, and find hidden gems based on actual traveler posts!</p>
                    <div class="suggestion-chips">
                      <button class="suggestion-chip" data-question="What are the most popular travel destinations in our community?">Most popular destinations</button>
                      <button class="suggestion-chip" data-question="Tell me about travel experiences in Japan">Japan experiences</button>
                      <button class="suggestion-chip" data-question="What are some hidden gems for travel?">Hidden gems</button>
                      <button class="suggestion-chip" data-question="Best places for photography based on community posts?">Photography spots</button>
                      <button class="suggestion-chip" data-question="What should I know before traveling to Europe?">Europe travel tips</button>
                      <button class="suggestion-chip" data-question="Budget travel advice from the community">Budget travel tips</button>
                    </div>
                  </div>
                </div>
              ` : ''}
            </div>
            
            <div class="chat-input-container">
              <div class="chat-input-wrapper">
                <input 
                  type="text" 
                  placeholder="Ask me about travel destinations, experiences, tips..." 
                  class="chat-input" 
                  id="chat-input" 
                  ${isLoading ? 'disabled' : ''}
                >
                <button class="send-btn" id="send-btn" ${isLoading ? 'disabled' : ''}>
                  ${isLoading ? `
                    <span class="loading-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </span>
                  ` : `
                    <span class="send-icon">➤</span>
                  `}
                </button>
              </div>
              <div class="chat-disclaimer">
                <span class="disclaimer-icon">🔒</span>
                <span class="disclaimer-text">
                  Powered by Google Gemini AI • Using real community travel data • Responses are AI-generated
                </span>
              </div>
            </div>
          </div>
        `}
      </div>
    `;
    
    setupEventListeners();
  }
  
  function setupEventListeners() {
    const authState = authManager.getAuthState();
    
    // Back button
    const backBtn = container.querySelector('.back-btn') as HTMLButtonElement;
    backBtn.addEventListener('click', onNavigateBack);
    
    if (!authState.isAuthenticated) {
      // Login button
      const aiLoginBtn = container.querySelector('.ai-login-btn') as HTMLButtonElement;
      aiLoginBtn?.addEventListener('click', showAuthModal);
      return;
    }
    
    // Chat functionality
    const chatInput = container.querySelector('#chat-input') as HTMLInputElement;
    const sendBtn = container.querySelector('#send-btn') as HTMLButtonElement;
    
    // Suggestion chips
    const suggestionChips = container.querySelectorAll('.suggestion-chip') as NodeListOf<HTMLButtonElement>;
    suggestionChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const question = chip.dataset.question!;
        if (chatInput) {
          chatInput.value = question;
          handleSendMessage();
        }
      });
    });
    
    // Send message handlers
    sendBtn?.addEventListener('click', handleSendMessage);
    
    chatInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    });
    
    // Auto-focus input
    chatInput?.focus();
  }
  
  async function handleSendMessage() {
    const chatInput = container.querySelector('#chat-input') as HTMLInputElement;
    const question = chatInput?.value.trim();
    
    if (!question || isLoading) return;
    
    // Add user message
    addMessage('user', question);
    chatInput.value = '';
    
    // Set loading state
    isLoading = true;
    renderAIPage();
    
    try {
      const authState = authManager.getAuthState();
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat-gemini`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          question,
          userId: authState.currentUser?.id
        })
      });

      // Get response text for better error handling
      const responseText = await response.text();
      let data;
      
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse response:', responseText);
        throw new Error(`Invalid response format: ${responseText.substring(0, 200)}`);
      }

      if (!response.ok) {
        console.error('API Error Response:', data);
        
        // Handle specific error cases with improved error detection
        if (data.error) {
          const errorMsg = data.error.toLowerCase();
          const errorDetails = data.details?.toLowerCase() || '';
          
          if (errorMsg.includes('gemini api key not configured') || errorMsg.includes('api key not configured')) {
            throw new Error('GEMINI_API_KEY_NOT_CONFIGURED');
          } else if (errorMsg.includes('invalid google gemini api key') || errorMsg.includes('invalid api key') || 
                     errorMsg.includes('api_key_invalid') || errorDetails.includes('invalid api key')) {
            throw new Error('GEMINI_API_KEY_INVALID');
          } else if (errorMsg.includes('quota exceeded') || errorDetails.includes('quota exceeded')) {
            throw new Error('GEMINI_QUOTA_EXCEEDED');
          } else if (errorMsg.includes('rate limit exceeded') || errorDetails.includes('rate limit')) {
            throw new Error('GEMINI_RATE_LIMIT');
          } else if (errorMsg.includes('permission denied') || errorDetails.includes('permission')) {
            throw new Error('GEMINI_PERMISSION_DENIED');
          } else if (errorMsg.includes('network error') || errorDetails.includes('network')) {
            throw new Error('GEMINI_NETWORK_ERROR');
          }
        }
        
        // Include more details in the error
        const errorDetails = data.details ? ` (${data.details})` : '';
        throw new Error(data.error + errorDetails || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      if (!data.answer) {
        throw new Error('No response received from AI service');
      }
      
      // Add AI response
      addMessage('ai', data.answer);
      
    } catch (error: any) {
      console.error('Error getting AI response:', error);
      
      let errorMessage = "I'm sorry, I'm having trouble processing your question right now. ";
      
      // Handle specific error types with detailed instructions
      if (error.message === 'GEMINI_API_KEY_NOT_CONFIGURED') {
        errorMessage = `🔧 **Configuration Required**

The Google Gemini API key needs to be configured in your Supabase project. Here's how to fix this:

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Edge Functions** in the sidebar
4. Find the **ai-chat-gemini** function
5. Click on **Settings** or **Secrets**
6. Add a new secret:
   - **Name:** \`GEMINI_API_KEY\`
   - **Value:** Your Google Gemini API key

After adding the secret, the AI chat should work properly!`;

      } else if (error.message === 'GEMINI_API_KEY_INVALID') {
        errorMessage = `🔑 **Invalid API Key**

The Google Gemini API key appears to be invalid. Please:

1. Check that your API key is correct
2. Ensure the API key has the necessary permissions
3. Verify the key is properly set in your Supabase Edge Function secrets

You can get a valid API key from the [Google AI Studio](https://makersuite.google.com/app/apikey).`;

      } else if (error.message === 'GEMINI_QUOTA_EXCEEDED') {
        errorMessage = `📊 **API Quota Exceeded**

You've reached your Google Gemini API usage limit. Please:

1. Check your usage in [Google AI Studio](https://makersuite.google.com/)
2. Wait for your quota to reset
3. Consider upgrading your API plan if needed

Try again later when your quota resets.`;

      } else if (error.message === 'GEMINI_RATE_LIMIT') {
        errorMessage = `⏱️ **Rate Limit Exceeded**

You're sending requests too quickly. Please wait a moment and try again.

The Google Gemini API has rate limits to ensure fair usage.`;

      } else if (error.message === 'GEMINI_PERMISSION_DENIED') {
        errorMessage = `🚫 **Permission Denied**

Your Google Gemini API key doesn't have the necessary permissions. Please:

1. Check your API key permissions in [Google AI Studio](https://makersuite.google.com/)
2. Ensure the key is enabled for the Gemini Pro model
3. Verify your Google Cloud project settings

Contact your administrator if you need additional permissions.`;

      } else if (error.message === 'GEMINI_NETWORK_ERROR') {
        errorMessage = `🌐 **Network Connection Error**

Unable to connect to the Google Gemini API. This could be due to:

1. Network connectivity issues
2. Google API service temporarily unavailable
3. Firewall or proxy blocking the connection

Please check your internet connection and try again in a few moments.`;

      } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        errorMessage = `🌐 **Connection Error**

Unable to connect to the AI service. This could be due to:

1. Network connectivity issues
2. Supabase Edge Function not deployed
3. CORS configuration problems

Please check your internet connection and try again.`;

      } else {
        errorMessage += `Please try again later or ask a different question.

**Technical details:** ${error.message}`;
      }
      
      addMessage('ai', errorMessage);
    } finally {
      isLoading = false;
      renderAIPage();
    }
  }
  
  function renderMessages() {
    const messagesContainer = container.querySelector('#chat-messages') as HTMLElement;
    if (!messagesContainer || chatMessages.length === 0) return;
    
    messagesContainer.innerHTML = chatMessages.map(message => {
      const timeStr = message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      if (message.type === 'user') {
        return `
          <div class="message user-message">
            <div class="message-content">
              <div class="message-text">${escapeHtml(message.content)}</div>
              <div class="message-time">${timeStr}</div>
            </div>
            <div class="message-avatar user-avatar-msg">👤</div>
          </div>
        `;
      } else {
        return `
          <div class="message ai-message">
            <div class="message-avatar ai-avatar-msg">🤖</div>
            <div class="message-content">
              <div class="message-text">${formatAIResponse(message.content)}</div>
              <div class="message-time">${timeStr}</div>
            </div>
          </div>
        `;
      }
    }).join('');
  }
  
  function formatAIResponse(content: string): string {
    // Enhanced formatting for AI responses
    return escapeHtml(content)
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n•/g, '<br>•')
      .replace(/\n-/g, '<br>-')
      .replace(/\n\d+\./g, '<br>$&')
      .replace(/\n/g, '<br>')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>');
  }
  
  function escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  function scrollToBottom() {
    const messagesContainer = container.querySelector('#chat-messages') as HTMLElement;
    if (messagesContainer) {
      setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }, 100);
    }
  }
  
  // Initial render
  renderAIPage();
  
  // Listen for auth changes
  authManager.onAuthChange(() => {
    renderAIPage();
  });
  
  return container;
}