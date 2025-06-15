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

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error occurred' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.answer) {
        throw new Error('No response received from AI service');
      }
      
      // Add AI response
      addMessage('ai', data.answer);
      
    } catch (error: any) {
      console.error('Error getting AI response:', error);
      
      let errorMessage = "I'm sorry, I'm having trouble processing your question right now. ";
      
      if (error.message.includes('Invalid') && error.message.includes('API key')) {
        errorMessage = "🔑 **Invalid API Key**\n\nThe Google Gemini API key appears to be invalid. Please check that the API key is correct and has the necessary permissions.";
      } else if (error.message.includes('quota') || error.message.includes('limit')) {
        errorMessage = "📊 **API Quota Exceeded**\n\nIt looks like you've reached your API usage limit. Please try again later.";
      } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
        errorMessage = "🚫 **Access Denied**\n\nThe API key doesn't have permission to access the Gemini service.";
      } else {
        errorMessage += "Please try again later or ask a different question.\n\n**Error details:** " + error.message;
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