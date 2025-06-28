import { authManager } from '../auth';
import { supabase } from '../lib/supabase';
import { User } from '../types';

interface CommunityMessage {
  id: string;
  community_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: User;
}

export function createCommunityChat(communityId: string, communityName: string): HTMLElement {
  const container = document.createElement('div');
  container.className = 'community-chat';
  
  // State variables
  let messages: CommunityMessage[] = [];
  let isLoading = false;
  let subscription: any = null;
  
  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    .community-chat {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #f8fafc;
    }

    .chat-header {
      padding: 1rem;
      border-bottom: 1px solid #e2e8f0;
      background: white;
    }

    .chat-header h3 {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: #1e293b;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .chat-header-icon {
      font-size: 1.25rem;
    }

    .messages-container {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .message {
      display: flex;
      gap: 0.75rem;
      max-width: 80%;
    }

    .message.outgoing {
      align-self: flex-end;
      flex-direction: row-reverse;
    }

    .message-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      object-fit: cover;
    }

    .message-content {
      background: #f1f5f9;
      padding: 0.75rem 1rem;
      border-radius: 1rem;
      border-bottom-left-radius: 0.25rem;
      color: #334155;
      position: relative;
    }

    .message.outgoing .message-content {
      background: #667eea;
      color: white;
      border-radius: 1rem;
      border-bottom-right-radius: 0.25rem;
    }

    .message-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.25rem;
    }

    .message-sender {
      font-weight: 600;
      font-size: 0.875rem;
      color: #1e293b;
    }

    .message.outgoing .message-sender {
      color: rgba(255, 255, 255, 0.9);
    }

    .message-time {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .message.outgoing .message-time {
      color: rgba(255, 255, 255, 0.7);
    }

    .message-text {
      margin: 0;
      line-height: 1.5;
      word-break: break-word;
    }

    .input-container {
      padding: 1rem;
      border-top: 1px solid #e2e8f0;
      display: flex;
      gap: 0.75rem;
      align-items: flex-end;
      background: white;
    }

    .input-wrapper {
      flex: 1;
      position: relative;
    }

    .message-input {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 1px solid #e2e8f0;
      border-radius: 1.5rem;
      resize: none;
      max-height: 120px;
      font-family: inherit;
      font-size: 0.875rem;
      line-height: 1.5;
    }

    .message-input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
    }

    .send-btn {
      background: #667eea;
      color: white;
      border: none;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      flex-shrink: 0;
    }

    .send-btn:hover:not(:disabled) {
      background: #5a67d8;
      transform: scale(1.05);
    }

    .send-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .send-icon {
      font-size: 1.25rem;
      transform: rotate(45deg);
    }

    .empty-chat {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      text-align: center;
    }

    .empty-chat-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
      color: #94a3b8;
    }

    .empty-chat-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 0.5rem 0;
    }

    .empty-chat-text {
      color: #64748b;
      max-width: 400px;
      margin: 0;
      line-height: 1.6;
    }

    .loading-chat {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #f3f4f6;
      border-top: 3px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-right: 1rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .loading-text {
      color: #64748b;
      font-size: 1rem;
    }

    .error-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      text-align: center;
    }

    .error-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
      color: #ef4444;
    }

    .error-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 0.5rem 0;
    }

    .error-text {
      color: #64748b;
      max-width: 400px;
      margin: 0 0 1.5rem 0;
      line-height: 1.6;
    }

    .retry-btn {
      background: #667eea;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
    }

    .retry-btn:hover {
      background: #5a67d8;
      transform: translateY(-1px);
    }
  `;
  
  if (!document.head.querySelector('#community-chat-styles')) {
    style.id = 'community-chat-styles';
    document.head.appendChild(style);
  }
  
  // Initial render
  renderCommunityChat();
  
  // Load messages
  loadMessages();
  
  // Set up real-time subscription
  setupMessageSubscription();
  
  // Load messages from the database
  async function loadMessages() {
    isLoading = true;
    renderCommunityChat();
    
    try {
      const { data, error } = await supabase
        .from('community_messages')
        .select(`
          *,
          sender:profiles(*)
        `)
        .eq('community_id', communityId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      messages = data || [];
      
    } catch (error) {
      console.error('Error loading community messages:', error);
    } finally {
      isLoading = false;
      renderCommunityChat();
      scrollToBottom();
    }
  }
  
  // Set up real-time subscription for new messages
  function setupMessageSubscription() {
    // Clean up existing subscription if any
    if (subscription) {
      try {
        supabase.removeChannel(subscription);
      } catch (error) {
        console.error('Error removing existing subscription:', error);
      }
      subscription = null;
    }
    
    // Subscribe to new messages
    subscription = supabase
      .channel(`community-messages-${communityId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'community_messages',
          filter: `community_id=eq.${communityId}`
        },
        async (payload) => {
          console.log('New community message received:', payload);
          
          // Fetch the complete message with sender info
          const { data: newMessage } = await supabase
            .from('community_messages')
            .select(`
              *,
              sender:profiles(*)
            `)
            .eq('id', payload.new.id)
            .single();
          
          if (newMessage) {
            console.log('Fetched new message with details:', newMessage);

            // Create a new array instead of mutating the existing one
            // This ensures the UI will re-render properly
            messages = [...messages, newMessage];
            messages = [...messages, newMessage];
            
            // Update UI
            renderCommunityChat();
            
            // Use setTimeout to ensure DOM is updated before scrolling
            setTimeout(() => {
              scrollToBottom();
            }, 100);
          }
        }
      )
      .subscribe();
  }
  
  // Send a message
  async function sendMessage(content: string) {
    if (!content.trim()) return;
    
    const authState = authManager.getAuthState();
    if (!authState.isAuthenticated || !authState.currentUser) return;
    
    try {
      console.log('Sending community message:', {
        community_id: communityId,
        sender_id: authState.currentUser.id,
        content: content.trim()
      });
      
      const { error } = await supabase
        .from('community_messages')
        .insert({
          community_id: communityId,
          sender_id: authState.currentUser.id,
          content: content.trim()
        });
      
      if (error) {
        console.error('Error response from Supabase:', error);
        throw error;
      }
      
      console.log('Message sent successfully');
      
      // No need to reload messages as the subscription will handle it
      
    } catch (error) {
      console.error('Error sending community message:', error);
      alert('Failed to send message. Please try again.');
    }
  }
  
  // Render the community chat
  function renderCommunityChat() {
    console.log('Rendering community chat with', messages.length, 'messages');
    
    // Save the current scroll position and input value before re-rendering
    const messagesContainer = container.querySelector('.messages-container');
    const scrollPosition = messagesContainer ? messagesContainer.scrollTop : 0;
    const scrolledToBottom = messagesContainer ? 
      (messagesContainer.scrollHeight - messagesContainer.scrollTop <= messagesContainer.clientHeight + 50) : 
      true;
    
    const messageInput = container.querySelector('.message-input') as HTMLTextAreaElement;
    const currentInputValue = messageInput ? messageInput.value : '';
    const currentInputFocused = document.activeElement === messageInput;
    
    const authState = authManager.getAuthState();
    
    container.innerHTML = `
      <div class="chat-header">
        <h3>
          <span class="chat-header-icon">💬</span>
          ${communityName} Chat
        </h3>
      </div>
      
      ${isLoading ? `
        <div class="loading-chat">
          <div class="loading-spinner"></div>
          <span class="loading-text">Loading messages...</span>
        </div>
      ` : `
        <div class="messages-container">
          ${messages.length === 0 ? `
            <div class="empty-chat">
              <div class="empty-chat-icon">💬</div>
              <h3 class="empty-chat-title">No Messages Yet</h3>
              <p class="empty-chat-text">Be the first to start a conversation in this community!</p>
            </div>
          ` : messages.map(message => {
            const isOutgoing = message.sender_id === authState.currentUser?.id;
            const messageTime = formatMessageTime(new Date(message.created_at));
            
            return `
              <div class="message ${isOutgoing ? 'outgoing' : ''}">
                <img src="${message.sender?.avatar_url || 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'}" alt="${message.sender?.name || 'User'}" class="message-avatar">
                <div class="message-content">
                  <div class="message-header">
                    <span class="message-sender">${message.sender?.name || 'Unknown User'}</span>
                    <span class="message-time">${messageTime}</span>
                  </div>
                  <p class="message-text">${message.content}</p>
                </div>
              </div>
            `;
          }).join('')}
        </div>
        
        <div class="input-container">
          <div class="input-wrapper">
            <textarea class="message-input" placeholder="Type a message..." rows="1">${currentInputValue}</textarea>
          </div>
          <button class="send-btn" disabled>
            <span class="send-icon">📤</span>
          </button>
        </div>
      `}
    `;
    
    // Add event listeners
    const newMessageInput = container.querySelector('.message-input') as HTMLTextAreaElement;
    
    // Restore focus if it was focused before
    if (currentInputFocused && newMessageInput) {
      newMessageInput.focus();
      
      // Place cursor at the end
      const length = newMessageInput.value.length;
      newMessageInput.setSelectionRange(length, length);
    }
    
    const sendBtn = container.querySelector('.send-btn') as HTMLButtonElement;
    
    if (newMessageInput && sendBtn) {
      // Auto-resize textarea
      newMessageInput.addEventListener('input', () => {
        // Reset height to auto to get the correct scrollHeight
        newMessageInput.style.height = 'auto';
        
        // Set the height to the scrollHeight
        newMessageInput.style.height = `${Math.min(newMessageInput.scrollHeight, 120)}px`;
        
        // Enable/disable send button
        const hasContent = newMessageInput.value.trim().length > 0;
        sendBtn.disabled = !hasContent;
      });
      
      // Send message on button click
      sendBtn.addEventListener('click', () => {
        const content = newMessageInput.value.trim();
        if (content) {
          sendMessage(content);
          newMessageInput.value = '';
          newMessageInput.style.height = 'auto';
          sendBtn.disabled = true;
        }
      });
      
      // Send message on Enter (without Shift)
      newMessageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey && !sendBtn.disabled) {
          e.preventDefault();
          sendBtn.click();
        }
      });
    }
    
    // Restore scroll position or scroll to bottom if we were at the bottom
    const newMessagesContainer = container.querySelector('.messages-container');
    if (newMessagesContainer) {
      if (scrolledToBottom) {
        newMessagesContainer.scrollTop = newMessagesContainer.scrollHeight;
      } else {
        newMessagesContainer.scrollTop = scrollPosition;
      }
    }
  }
  
  // Scroll to bottom of messages container
  function scrollToBottom() {
    const messagesContainer = container.querySelector('.messages-container');
    if (messagesContainer) {
      // Use smooth scrolling for better UX
      messagesContainer.scrollTo({
        top: messagesContainer.scrollHeight,
        behavior: 'smooth'
      });
    }
  }
  
  // Format message time
  function formatMessageTime(date: Date): string {
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      // Today - show time
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays === 1) {
      // Yesterday
      return 'Yesterday';
    } else if (diffInDays < 7) {
      // Within a week - show day name
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      // Older - show date
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  }
  
  // Clean up subscription when component is removed
  container.addEventListener('remove', () => {
    if (subscription) {
      supabase.removeChannel(subscription);
      subscription = null;
    }
  });
  
  return container;
}