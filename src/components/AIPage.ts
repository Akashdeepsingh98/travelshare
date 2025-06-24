import { authManager } from '../auth';
import { showAuthModal } from './AuthModal';
import { Post, ProfileContext } from '../types';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

export function createAIPage(
  onNavigateBack: () => void, 
  postContext?: Post | null,
  profileContext?: ProfileContext | null
): HTMLElement {
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
    updateChatMessages();
    scrollToBottom();
  }
  
  function updateChatMessages() {
    const messagesContainer = container.querySelector('#chat-messages') as HTMLElement;
    if (!messagesContainer) return;
    
    if (chatMessages.length === 0) {
      messagesContainer.innerHTML = `
        <div class="welcome-message">
          <div class="ai-avatar">🤖</div>
          <div class="welcome-content">
            <h3>Welcome to TravelShare AI!</h3>
            <p>I'm powered by Google Gemini with vision capabilities and have access to real travel experiences from your community. I can analyze photos from posts and connect to business data through MCP servers for real-time information!</p>
            <div class="ai-features">
              <div class="feature-badge">📷 Photo Analysis</div>
              <div class="feature-badge">🌍 Community Data</div>
              <div class="feature-badge">🔌 MCP Integration</div>
              <div class="feature-badge">💡 Smart Recommendations</div>
            </div>
            ${postContext ? `
              <div class="post-context-info">
                <h4>💬 Asking about this post:</h4>
                <div class="context-post-preview">
                  <div class="context-post-header">
                    <span class="context-location">📍 ${postContext.location}</span>
                    <span class="context-author">by ${postContext.user?.name || 'Unknown'}</span>
                  </div>
                  <div class="context-post-content">"${postContext.content.length > 100 ? postContext.content.substring(0, 100) + '...' : postContext.content}"</div>
                  ${(postContext.image_url || (postContext.media_urls && postContext.media_urls.length > 0)) ? `
                    <div class="context-post-media">
                      <img src="${postContext.image_url || postContext.media_urls![0]}" alt="Post media" class="context-media-preview">
                    </div>
                  ` : ''}
                </div>
              </div>
            ` : ''}
            ${profileContext ? `
              <div class="profile-context-info">
                <h4>👤 Summarizing this profile:</h4>
                <div class="context-profile-preview">
                  <div class="context-profile-header">
                    <span class="context-profile-name">${profileContext.name}</span>
                    <span class="context-profile-stats">${profileContext.posts_count} posts • ${profileContext.followers_count} followers • ${profileContext.following_count} following</span>
                  </div>
                  ${profileContext.avatar_url ? `
                    <div class="context-profile-avatar">
                      <img src="${profileContext.avatar_url}" alt="${profileContext.name}" class="context-avatar-preview">
                    </div>
                  ` : ''}
                  <div class="context-profile-content">
                    <p>I'll analyze ${profileContext.name}'s profile, posts, and activities to provide you with a comprehensive summary.</p>
                  </div>
                </div>
              </div>
            ` : ''}
            <div class="suggestion-chips">
              ${postContext ? `
                <button class="suggestion-chip" data-question="Tell me more about ${postContext.location}">About this location</button>
                <button class="suggestion-chip" data-question="How can I get to ${postContext.location}?">How to get there</button>
                <button class="suggestion-chip" data-question="What are the best things to do in ${postContext.location}?">Things to do</button>
                <button class="suggestion-chip" data-question="Where can I eat near ${postContext.location}?">Food & dining</button>
                <button class="suggestion-chip" data-question="What's the best time to visit ${postContext.location}?">Best time to visit</button>
              ` : profileContext ? `
                <button class="suggestion-chip" data-question="Summarize ${profileContext.name}'s travel interests">Travel interests</button>
                <button class="suggestion-chip" data-question="What destinations has ${profileContext.name} visited?">Visited destinations</button>
                <button class="suggestion-chip" data-question="What services does ${profileContext.name} offer?">Services offered</button>
                <button class="suggestion-chip" data-question="What type of traveler is ${profileContext.name}?">Traveler type</button>
                <button class="suggestion-chip" data-question="What are ${profileContext.name}'s most popular posts?">Popular posts</button>
              ` : `
                <button class="suggestion-chip" data-question="What are the most popular travel destinations in our community?">Most popular destinations</button>
                <button class="suggestion-chip" data-question="Tell me about travel experiences in Japan with photos">Japan experiences</button>
                <button class="suggestion-chip" data-question="What are some hidden gems for travel?">Hidden gems</button>
                <button class="suggestion-chip" data-question="Best places for photography based on community posts?">Photography spots</button>
                <button class="suggestion-chip" data-question="What should I know before traveling to Europe?">Europe travel tips</button>
                <button class="suggestion-chip" data-question="Budget travel advice from the community">Budget travel tips</button>
              `}
            </div>
          </div>
        </div>
      `;
      
      // Re-attach suggestion chip listeners
      const suggestionChips = messagesContainer.querySelectorAll('.suggestion-chip') as NodeListOf<HTMLButtonElement>;
      suggestionChips.forEach(chip => {
        chip.addEventListener('click', () => {
          const question = chip.dataset.question!;
          const chatInput = container.querySelector('#chat-input') as HTMLInputElement;
          if (chatInput) {
            chatInput.value = question;
            handleSendMessage();
          }
        });
      });
    } else {
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
  }
  
  function renderAIPage() {
    const authState = authManager.getAuthState();
    
    container.innerHTML = `
      <div class="ai-page-header">
        <button class="back-btn">← Back</button>
        <div class="ai-header-content">
          <h1>🤖 TravelShare AI</h1>
          <p class="ai-subtitle">
            ${postContext 
              ? `Ask me about this post from ${postContext.location}` 
              : profileContext 
                ? `Ask me about ${profileContext.name}'s profile` 
                : 'Ask me anything about travel destinations and experiences!'}
          </p>
        </div>
      </div>
      
      <div class="ai-page-content">
        ${!authState.isAuthenticated ? `
          <div class="ai-login-prompt">
            <div class="ai-login-content">
              <div class="ai-login-icon">🤖✈️</div>
              <h3>Discover Amazing Travel Insights</h3>
              <p>Log in to chat with our AI assistant and get personalized travel recommendations based on real traveler experiences and photo analysis!</p>
              <button class="ai-login-btn">Get Started</button>
            </div>
          </div>
        ` : `
          <!-- AI Status Section -->
          <div class="ai-status-section">
            <div class="ai-status-content">
              <div class="ai-status-indicator">
                <span class="status-dot active"></span>
                <span class="status-text">AI Ready - Powered by Google Gemini with Vision</span>
              </div>
              <div class="ai-capabilities">
                <span class="capability-tag">🌍 Travel Expert</span>
                <span class="capability-tag">📊 Community Data</span>
                <span class="capability-tag">📷 Photo Analysis</span>
                <span class="capability-tag">💡 Smart Recommendations</span>
                <span class="capability-tag">🔌 MCP Integration</span>
              </div>
            </div>
          </div>

          <div class="chat-container">
            <div class="chat-messages" id="chat-messages">
              <!-- Messages will be rendered here -->
            </div>
            
            <div class="chat-input-container">
              <div class="chat-input-wrapper">
                <input 
                  type="text" 
                  placeholder="${postContext 
                    ? `Ask about ${postContext.location}...` 
                    : profileContext 
                      ? `Ask about ${profileContext.name}'s profile...` 
                      : 'Ask me about travel destinations, experiences, tips...'}" 
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
                  Powered by Google Gemini AI with Vision • Analyzes community photos • Using real travel data • MCP-enabled for business data • Responses are AI-generated
                </span>
              </div>
            </div>
          </div>
        `}
      </div>
    `;
    
    // Update chat messages after rendering
    if (authState.isAuthenticated) {
      updateChatMessages();
    }
    
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
    
    // If we have a profile context, automatically trigger a profile summary
    if (profileContext && chatMessages.length === 0) {
      setTimeout(() => {
        chatInput.value = `Summarize ${profileContext.name}'s profile`;
        handleSendMessage();
      }, 500);
    }
  }
  
  async function handleSendMessage() {
    const chatInput = container.querySelector('#chat-input') as HTMLInputElement;
    const question = chatInput?.value.trim();
    
    if (!question || isLoading) return;
    
    // Add user message immediately
    addMessage('user', question);
    chatInput.value = '';
    
    // Set loading state and update UI
    isLoading = true;
    updateSendButton();
    
    try {
      const authState = authManager.getAuthState();
      
      const requestBody: any = {
        question,
        userId: authState.currentUser?.id
      };
      
      // Include post context if available
      if (postContext) {
        requestBody.postContext = {
          id: postContext.id,
          location: postContext.location,
          content: postContext.content,
          image_url: postContext.image_url,
          media_urls: postContext.media_urls,
          media_types: postContext.media_types,
          user_name: postContext.user?.name,
          created_at: postContext.created_at
        };
      }
      
      // Include profile context if available
      if (profileContext) {
        requestBody.profileContext = {
          id: profileContext.id,
          name: profileContext.name,
          avatar_url: profileContext.avatar_url,
          created_at: profileContext.created_at,
          posts_count: profileContext.posts_count,
          followers_count: profileContext.followers_count,
          following_count: profileContext.following_count,
          mini_apps_count: profileContext.mini_apps_count
        };
      }
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat-mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(requestBody)
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
      
      // Add AI response with enhanced info
      let aiResponseContent = data.answer;
      
      // Add metadata about the analysis
      if (data.imagesAnalyzed === 'Yes' || data.mcpServersUsed > 0 || postContext || profileContext) {
        aiResponseContent += '\n\n---\n*Enhanced with: ';
        const enhancements = [];
        if (postContext) enhancements.push('📍 Post context');
        if (profileContext) enhancements.push('👤 Profile context');
        if (data.imagesAnalyzed === 'Yes') enhancements.push('📷 Photo analysis');
        if (data.mcpServersUsed > 0) enhancements.push(`🔌 ${data.mcpServersUsed} MCP server${data.mcpServersUsed > 1 ? 's' : ''}`);
        if (data.postsCount > 0) enhancements.push(`📊 ${data.postsCount} community posts`);
        aiResponseContent += enhancements.join(', ') + '*';
      }
      
      addMessage('ai', aiResponseContent);
      
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
4. Find the **ai-chat-mcp** function
5. Click on **Settings** or **Secrets**
6. Add a new secret:
   - **Name:** \`GEMINI_API_KEY\`
   - **Value:** Your Google Gemini API key

After adding the secret, the AI chat with vision capabilities should work properly!`;

      } else if (error.message === 'GEMINI_API_KEY_INVALID') {
        errorMessage = `🔑 **Invalid API Key**

The Google Gemini API key appears to be invalid. Please:

1. Check that your API key is correct
2. Ensure the API key has the necessary permissions for Gemini Pro Vision
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
2. Ensure the key is enabled for the Gemini Pro Vision model
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
      updateSendButton();
    }
  }
  
  function updateSendButton() {
    const sendBtn = container.querySelector('#send-btn') as HTMLButtonElement;
    const chatInput = container.querySelector('#chat-input') as HTMLInputElement;
    
    if (sendBtn && chatInput) {
      sendBtn.disabled = isLoading;
      chatInput.disabled = isLoading;
      
      if (isLoading) {
        sendBtn.innerHTML = `
          <span class="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </span>
        `;
      } else {
        sendBtn.innerHTML = '<span class="send-icon">➤</span>';
      }
    }
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