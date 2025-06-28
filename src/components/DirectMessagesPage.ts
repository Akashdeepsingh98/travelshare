import { Conversation, Message, Post, User } from '../types';
import { authManager } from '../auth';
import { supabase } from '../lib/supabase';
import { showAuthModal } from './AuthModal';
import { createGroupChatsTab } from './GroupChatsTab';
import { createGroupChatPage } from './GroupChatPage';
import { createGroupChatModal } from './GroupChatModal';
import { createPostCard } from './PostCard';

export function createDirectMessagesPage(
  onNavigateBack: () => void,
  onUserClick?: (userId: string) => void,
  onSharePost?: (post: Post) => void,
  onGroupChatClick?: (groupId: string) => void,
  initialConversationId?: string
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'direct-messages-page';
  
  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    .dm-header-actions {
      display: flex;
      gap: 0.5rem;
    }

    .new-group-btn {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: none;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
    }

    .new-group-btn:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: translateY(-1px);
    }

    .direct-messages-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 2rem 1rem;
    }

    .dm-header {
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

    .dm-header h1 {
      color: white;
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0;
    }

    .dm-header .back-btn {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
    }

    .dm-header .back-btn:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: translateY(-1px);
    }

    .dm-content {
      background: white;
      border-radius: 1rem;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      display: flex;
      height: calc(100vh - 8rem);
    }

    .dm-login-prompt {
      text-align: center;
      padding: 3rem 1rem;
      width: 100%;
    }

    .login-prompt-content {
      max-width: 400px;
      margin: 0 auto;
    }

    .login-prompt-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
      color: #667eea;
    }

    .login-prompt-content h3 {
      color: #1e293b;
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0 0 0.5rem 0;
    }

    .login-prompt-content p {
      color: #64748b;
      margin: 0 0 1.5rem 0;
      line-height: 1.6;
    }

    .dm-login-btn {
      background: #667eea;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s;
    }

    .dm-login-btn:hover {
      background: #5a67d8;
      transform: translateY(-1px);
    }

    .dm-sidebar {
      width: 300px;
      border-right: 1px solid #e5e7eb;
      display: flex;
      flex-direction: column;
      background: #f8fafc;
    }

    .dm-sidebar-header {
      padding: 1rem;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .dm-sidebar-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }

    .new-message-btn {
      background: #667eea;
      color: white;
      border: none;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
    }

    .new-message-btn:hover {
      background: #5a67d8;
      transform: translateY(-1px);
    }

    .dm-search {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .dm-search-input {
      width: 100%;
      padding: 0.5rem 0.75rem;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      background: white;
    }

    .dm-search-input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
    }

    .dm-conversations {
      flex: 1;
      overflow-y: auto;
    }

    .dm-conversation-item {
      padding: 1rem;
      border-bottom: 1px solid #e5e7eb;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .dm-conversation-item:hover {
      background: #f1f5f9;
    }

    .dm-conversation-item.active {
      background: #e0f2fe;
      border-left: 3px solid #0ea5e9;
    }

    .dm-conversation-item.unread {
      background: #f0fdf4;
    }

    .dm-user-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      object-fit: cover;
    }

    .dm-conversation-info {
      flex: 1;
      min-width: 0;
    }

    .dm-user-name {
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 0.25rem 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .dm-last-message {
      color: #64748b;
      font-size: 0.875rem;
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .dm-message-time {
      font-size: 0.75rem;
      color: #94a3b8;
      white-space: nowrap;
    }

    .dm-unread-badge {
      background: #10b981;
      color: white;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .dm-chat {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: white;
    }

    .dm-chat-header {
      padding: 1rem;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .dm-chat-user-info {
      flex: 1;
    }

    .dm-chat-user-name {
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }

    .dm-chat-user-status {
      font-size: 0.875rem;
      color: #64748b;
      margin: 0;
    }

    .dm-chat-actions {
      display: flex;
      gap: 0.5rem;
    }

    .dm-chat-action-btn {
      background: #f1f5f9;
      color: #64748b;
      border: none;
      width: 32px;
      height: 32px;
      border-radius: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
    }

    .dm-chat-action-btn:hover {
      background: #e2e8f0;
      color: #334155;
    }

    .dm-messages-container {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .dm-message {
      display: flex;
      gap: 0.75rem;
      max-width: 80%;
    }

    .dm-message.outgoing {
      align-self: flex-end;
      flex-direction: row-reverse;
    }

    .dm-message-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      object-fit: cover;
    }

    .dm-message-content {
      background: #f1f5f9;
      padding: 0.75rem 1rem;
      border-radius: 1rem;
      border-bottom-left-radius: 0.25rem;
      color: #334155;
      position: relative;
    }

    .dm-message.outgoing .dm-message-content {
      background: #667eea;
      color: white;
      border-radius: 1rem;
      border-bottom-right-radius: 0.25rem;
    }

    .dm-message-text {
      margin: 0;
      line-height: 1.5;
      word-break: break-word;
    }

    .dm-message-time {
      font-size: 0.75rem;
      color: #94a3b8;
      margin-top: 0.25rem;
      text-align: right;
    }

    .dm-message.outgoing .dm-message-time {
      color: rgba(255, 255, 255, 0.8);
    }

    .dm-shared-post {
      margin-top: 0.5rem;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      overflow: hidden;
      background: white;
    }

    .dm-message.outgoing .dm-shared-post {
      border-color: rgba(255, 255, 255, 0.2);
    }

    .dm-input-container {
      padding: 1rem;
      border-top: 1px solid #e5e7eb;
      display: flex;
      gap: 0.75rem;
      align-items: flex-end;
    }

    .dm-input-wrapper {
      flex: 1;
      position: relative;
    }

    .dm-input {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 1px solid #e5e7eb;
      border-radius: 1.5rem;
      resize: none;
      max-height: 120px;
      font-family: inherit;
      font-size: 0.875rem;
      line-height: 1.5;
    }

    .dm-input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
    }

    .dm-send-btn {
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

    .dm-send-btn:hover:not(:disabled) {
      background: #5a67d8;
      transform: scale(1.05);
    }

    .dm-send-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .dm-send-icon {
      font-size: 1.25rem;
      transform: rotate(45deg);
    }

    .dm-empty-state {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      text-align: center;
    }

    .dm-empty-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
      color: #94a3b8;
    }

    .dm-empty-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 0.5rem 0;
    }

    .dm-empty-text {
      color: #64748b;
      max-width: 400px;
      margin: 0 0 1.5rem 0;
      line-height: 1.6;
    }

    .dm-start-btn {
      background: #667eea;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
    }

    .dm-start-btn:hover {
      background: #5a67d8;
      transform: translateY(-1px);
    }

    .dm-no-conversation {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      text-align: center;
      background: #f8fafc;
    }

    .dm-no-conversation-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
      color: #94a3b8;
    }

    .dm-no-conversation-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 0.5rem 0;
    }

    .dm-no-conversation-text {
      color: #64748b;
      max-width: 400px;
      margin: 0 0 1.5rem 0;
      line-height: 1.6;
    }

    .dm-loading {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #64748b;
    }

    .dm-loading-spinner {
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

    /* New Message Modal */
    .new-message-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }

    .new-message-content {
      background: white;
      border-radius: 1rem;
      width: 100%;
      max-width: 500px;
      overflow: hidden;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    }

    .new-message-header {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .new-message-header h2 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #1e293b;
    }

    .new-message-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #64748b;
    }

    .new-message-body {
      padding: 1.5rem;
    }

    .new-message-search {
      margin-bottom: 1.5rem;
    }

    .new-message-search-input {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      font-size: 0.875rem;
    }

    .new-message-search-input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
    }

    .new-message-results {
      max-height: 300px;
      overflow-y: auto;
    }

    .new-message-user-item {
      padding: 0.75rem;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .new-message-user-item:hover {
      background: #f1f5f9;
    }

    .new-message-user-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
    }

    .new-message-user-info {
      flex: 1;
    }

    .new-message-user-name {
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 0.25rem 0;
    }

    .new-message-user-meta {
      font-size: 0.875rem;
      color: #64748b;
      margin: 0;
    }

    .new-message-empty {
      text-align: center;
      padding: 2rem 1rem;
      color: #64748b;
    }

    .new-message-loading {
      text-align: center;
      padding: 2rem 1rem;
      color: #64748b;
    }

    /* Responsive design */
    @media (max-width: 768px) {
      .direct-messages-page {
        padding: 1rem;
      }

      .dm-header {
        padding: 1rem;
      }

      .dm-content {
        flex-direction: column;
        height: auto;
        min-height: calc(100vh - 8rem);
      }

      .dm-sidebar {
        width: 100%;
        border-right: none;
        border-bottom: 1px solid #e5e7eb;
        max-height: 300px;
      }

      .dm-chat {
        height: calc(100vh - 300px - 8rem);
      }

      .dm-message {
        max-width: 90%;
      }
    }

    @media (max-width: 480px) {
      .direct-messages-page {
        padding: 0.5rem;
      }

      .dm-header {
        padding: 0.75rem;
      }

      .dm-sidebar-header {
        padding: 0.75rem;
      }

      .dm-tabs {
        display: flex;
        border-bottom: 1px solid #e5e7eb;
      }

      .dm-tab {
        flex: 1;
        text-align: center;
        padding: 0.75rem;
        cursor: pointer;
        color: #64748b;
        font-weight: 500;
        transition: all 0.2s;
        border-bottom: 2px solid transparent;
      }

      .dm-tab.active {
        color: #667eea;
        border-bottom-color: #667eea;
      }

      .dm-tab:hover:not(.active) {
        color: #334155;
        background: #f8fafc;
      }

      .tab-content {
        display: none;
        flex-direction: column;
        flex: 1;
      }

      .tab-content.active {
        display: flex;
      }

      .dm-search {
        padding: 0.5rem 0.75rem;
      }

      .dm-conversation-item {
        padding: 0.75rem;
      }

      .dm-chat-header {
        padding: 0.75rem;
      }

      .dm-messages-container {
        padding: 0.75rem;
      }

      .dm-input-container {
        padding: 0.75rem;
      }
    }
  `;
  
  if (!document.head.querySelector('#direct-messages-styles')) {
    style.id = 'direct-messages-styles';
    document.head.appendChild(style);
  }
  
  // State variables
  let conversations: Conversation[] = [];
  let messages: Message[] = [];
  let selectedConversationId: string | null = initialConversationId || null;
  let groupChatsTab: HTMLElement | null = null;
  let selectedUser: User | null = null;
  let isLoading = false;
  let isSearching = false;
  let activeTab = 'direct'; // 'direct' or 'groups'
  let searchResults: User[] = [];
  let subscription: any = null;
  
  // Load conversations
  async function loadConversations() {
    const authState = authManager.getAuthState();
    if (!authState.isAuthenticated || !authState.currentUser) {
      renderDirectMessagesPage();
      return;
    }
    
    isLoading = true;
    renderDirectMessagesPage();
    
    try {
      // Get all conversations where the current user is either user1 or user2
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select(`
          *,
          user1:profiles!conversations_user1_id_fkey(*),
          user2:profiles!conversations_user2_id_fkey(*)
        `)
        .or(`user1_id.eq.${authState.currentUser.id},user2_id.eq.${authState.currentUser.id}`)
        .order('updated_at', { ascending: false });
      
      if (conversationsError) throw conversationsError;
      
      // Process conversations to get the "other user" for each conversation
      conversations = conversationsData.map(conv => {
        const otherUser = conv.user1_id === authState.currentUser.id ? conv.user2 : conv.user1;
        return {
          ...conv,
          other_user: otherUser
        };
      });
      
      // Get last message for each conversation
      for (const conversation of conversations) {
        const { data: lastMessageData } = await supabase
          .from('messages')
          .select(`
            *,
            sender:profiles!messages_sender_id_fkey(*)
          `)
          .eq('conversation_id', conversation.id)
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (lastMessageData && lastMessageData.length > 0) {
          conversation.last_message = lastMessageData[0];
        }
        
        // Get unread count
        const { data: unreadCount } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', conversation.id)
          .eq('sender_id', conversation.other_user.id)
          .is('read_at', null);
        
        conversation.unread_count = unreadCount?.count || 0;
      }
      
      // If a conversation ID was provided, select it
      if (selectedConversationId) {
        const conversation = conversations.find(c => c.id === selectedConversationId);
        if (conversation) {
          selectedUser = conversation.other_user;
          loadMessages(selectedConversationId);
        } else {
          selectedConversationId = null;
        }
      }
      // Otherwise, select the first conversation if available
      else if (conversations.length > 0 && !selectedConversationId) {
        selectedConversationId = conversations[0].id;
        selectedUser = conversations[0].other_user;
        loadMessages(selectedConversationId);
      }
      
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      isLoading = false;
      renderDirectMessagesPage();
    }
  }
  
  // Load messages for a conversation
  async function loadMessages(conversationId: string) {
    if (!conversationId) return;
    
    try {
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(*),
          shared_post:posts(
            *,
            user:profiles(*)
          )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      
      if (messagesError) throw messagesError;
      
      messages = messagesData || [];
      
      // Mark unread messages as read
      const authState = authManager.getAuthState();
      if (authState.isAuthenticated && authState.currentUser) {
        const unreadMessages = messages.filter(
          m => m.sender_id !== authState.currentUser.id && !m.read_at
        );
        
        if (unreadMessages.length > 0) {
          const unreadIds = unreadMessages.map(m => m.id);
          
          await supabase
            .from('messages')
            .update({ read_at: new Date().toISOString() })
            .in('id', unreadIds);
          
          // Update the unread count in the conversation
          const conversation = conversations.find(c => c.id === conversationId);
          if (conversation) {
            conversation.unread_count = 0;
          }
        }
      }
      
      // Set up real-time subscription for new messages
      setupMessageSubscription(conversationId);
      
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      renderDirectMessagesPage();
      scrollToBottom();
    }
  }
  
  // Set up real-time subscription for new messages
  function setupMessageSubscription(conversationId: string) {
    // Clean up existing subscription if any
    if (subscription) {
      supabase.removeChannel(subscription);
      subscription = null;
    }
    
    // Subscribe to new messages
    subscription = supabase
      .channel(`messages-channel-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          console.log('New message received:', payload);
          
          // Fetch the complete message with sender info
          const { data: newMessage } = await supabase
            .from('messages')
            .select(`
              *,
              sender:profiles!messages_sender_id_fkey(*),
              shared_post:posts(
                *,
                user:profiles(*)
              )
            `)
            .eq('id', payload.new.id)
            .single();
          
          if (newMessage) {
            // Add to messages array
            // Create a new array instead of mutating the existing one
            messages = [...messages, newMessage];
            
            // Mark as read if from other user
            const authState = authManager.getAuthState();
            if (authState.isAuthenticated && authState.currentUser && newMessage.sender_id !== authState.currentUser.id) {
              await supabase
                .from('messages')
                .update({ read_at: new Date().toISOString() })
                .eq('id', newMessage.id);
            }
            
            // Update UI
            renderDirectMessagesPage();
            
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
  async function sendMessage(content: string, sharedPostId?: string) {
    const authState = authManager.getAuthState();
    if (!authState.isAuthenticated || !authState.currentUser || !selectedConversationId) return;
    
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversationId,
          sender_id: authState.currentUser.id,
          content: content || null,
          shared_post_id: sharedPostId || null
        });
      
      if (error) throw error;
      
      // No need to reload messages as the subscription will handle it
      
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  }
  
  // Search for users to start a new conversation
  async function searchUsers(query: string) {
    if (!query.trim()) {
      isSearching = false;
      searchResults = [];
      renderDirectMessagesPage();
      return;
    }
    
    const authState = authManager.getAuthState();
    if (!authState.isAuthenticated || !authState.currentUser) return;
    
    isSearching = true;
    renderDirectMessagesPage();
    
    try {
      const { data: users, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', authState.currentUser.id)
        .ilike('name', `%${query}%`)
        .limit(10);
      
      if (error) throw error;
      
      searchResults = users || [];
      
    } catch (error) {
      console.error('Error searching users:', error);
      searchResults = [];
    } finally {
      isSearching = false;
      renderDirectMessagesPage();
    }
  }
  
  // Start or open a conversation with a user
  async function startConversation(userId: string) {
    const authState = authManager.getAuthState();
    if (!authState.isAuthenticated || !authState.currentUser) return;
    
    try {
      // Get or create conversation using the RPC function
      const { data, error } = await supabase
        .rpc('get_or_create_conversation', {
          user_a: authState.currentUser.id,
          user_b: userId
        });
      
      if (error) throw error;
      
      // Get the conversation ID
      const conversationId = data;
      
      // Close the new message modal if open
      const modal = document.querySelector('.new-message-modal');
      if (modal) {
        modal.remove();
      }
      
      // Load the conversation
      selectedConversationId = conversationId;
      
      // Get user info
      const { data: userData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (userData) {
        selectedUser = userData;
      }
      
      // Reload conversations to update the list
      await loadConversations();
      
      // Load messages for this conversation
      await loadMessages(conversationId);
      
    } catch (error) {
      console.error('Error starting conversation:', error);
      alert('Failed to start conversation. Please try again.');
    }
  }
  
  // Render group chats tab
  function renderGroupChatsTab() {
    const groupChatsTab = container.querySelector('#group-chats-tab');
    if (!groupChatsTab) return;
    
    // Clear existing content
    groupChatsTab.innerHTML = '';
    
    // Create group chats tab component
    const groupChatsTabComponent = createGroupChatsTab((groupId) => {
      // Navigate to group chat
      navigateToGroupChat(groupId);
    });
    
    groupChatsTab.appendChild(groupChatsTabComponent);
  }
  
  // Navigate to group chat
  function navigateToGroupChat(groupId: string) {
    // Clear the direct messages page
    container.innerHTML = '';
    
    // Create and render the group chat page
    const groupChatPage = createGroupChatPage(
      groupId,
      onNavigateBack,
      onUserClick,
      onSharePost
    );
    
    container.appendChild(groupChatPage);
  }
  
  // Show new message modal
  function showNewMessageModal() {
    const modal = document.createElement('div');
    modal.className = 'new-message-modal';
    
    modal.innerHTML = `
      <div class="new-message-content">
        <div class="new-message-header">
          <h2>New Message</h2>
          <button class="new-message-close">✕</button>
          <button class="messages-tab ${activeTab === 'groups' ? 'active' : ''}" data-tab="groups">Group Chats</button>
        </div>
        <div class="new-message-body">
          <div class="new-message-search">
            <input type="text" class="new-message-search-input" placeholder="Search for users...">
          </div>
          <div class="new-message-results"></div>
          <div class="tab-pane ${activeTab === 'groups' ? 'active' : ''}" id="group-chats-tab">
            <!-- Group chats tab content will be rendered here -->
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Get elements
    const closeBtn = modal.querySelector('.new-message-close') as HTMLButtonElement;
    const searchInput = modal.querySelector('.new-message-search-input') as HTMLInputElement;
    const resultsContainer = modal.querySelector('.new-message-results') as HTMLElement;
    
    // Close modal
    closeBtn.addEventListener('click', () => {
      modal.remove();
    });
    
    // Search input
    let searchTimeout: NodeJS.Timeout;
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      
      resultsContainer.innerHTML = `
        <div class="new-message-loading">
          <div class="loading-spinner"></div>
          <p>Searching...</p>
        </div>
      `;
      
      searchTimeout = setTimeout(async () => {
        const query = searchInput.value.trim();
        
        if (!query) {
          resultsContainer.innerHTML = `
            <div class="new-message-empty">
              <p>Enter a name to search for users</p>
            </div>
          `;
          return;
        }
        
        try {
          const authState = authManager.getAuthState();
          if (!authState.isAuthenticated || !authState.currentUser) return;
          
          const { data: users, error } = await supabase
            .from('profiles')
            .select('*')
            .neq('id', authState.currentUser.id)
            .ilike('name', `%${query}%`)
            .limit(10);
          
          if (error) throw error;
          
          if (!users || users.length === 0) {
            resultsContainer.innerHTML = `
              <div class="new-message-empty">
                <p>No users found matching "${query}"</p>
              </div>
            `;
            return;
          }
          
          resultsContainer.innerHTML = users.map(user => `
            <div class="new-message-user-item" data-user-id="${user.id}">
              <img src="${user.avatar_url || 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'}" alt="${user.name}" class="new-message-user-avatar">
              <div class="new-message-user-info">
                <h3 class="new-message-user-name">${user.name}</h3>
                <p class="new-message-user-meta">Traveler</p>
              </div>
            </div>
          `).join('');
          
          // Add click handlers
          const userItems = resultsContainer.querySelectorAll('.new-message-user-item');
          userItems.forEach(item => {
            item.addEventListener('click', () => {
              const userId = item.getAttribute('data-user-id');
              if (userId) {
                startConversation(userId);
              }
            });
          });
          
        } catch (error) {
          console.error('Error searching users:', error);
          resultsContainer.innerHTML = `
            <div class="new-message-empty">
              <p>Error searching users. Please try again.</p>
            </div>
          `;
        }
      }, 500);
    });
    
    // Focus search input
    searchInput.focus();
  }
  
  // Render the direct messages page
  function renderDirectMessagesPage() {
    const authState = authManager.getAuthState();

    // Save the current scroll position and input value before re-rendering
    const messagesContainer = container.querySelector('.dm-messages-container');
    const scrollPosition = messagesContainer ? messagesContainer.scrollTop : 0;
    const scrolledToBottom = messagesContainer ? 
      (messagesContainer.scrollHeight - messagesContainer.scrollTop <= messagesContainer.clientHeight + 50) : 
      true;
    
    const messageInput = container.querySelector('.dm-input') as HTMLTextAreaElement;
    const currentInputValue = messageInput ? messageInput.value : '';
    const currentInputFocused = document.activeElement === messageInput;
    
    if (!authState.isAuthenticated) {
      // Not authenticated view
      container.innerHTML = `
        <div class="dm-header">
          <button class="back-btn">← Back</button>
          <h1>💬 Direct Messages</h1>
        </div>
        
        <div class="dm-content">
          <div class="dm-login-prompt">
            <div class="login-prompt-content">
              <div class="login-prompt-icon">💬</div>
              <h3>Connect with Travelers</h3>
              <p>Log in to send direct messages to other travelers and share your favorite posts!</p>
              <button class="dm-login-btn">Get Started</button>
            </div>
          </div>
        </div>
      `;
      
      // Add event listeners
      const backBtn = container.querySelector('.back-btn') as HTMLButtonElement;
      const loginBtn = container.querySelector('.dm-login-btn') as HTMLButtonElement;
      
      backBtn.addEventListener('click', onNavigateBack);
      loginBtn.addEventListener('click', showAuthModal);
      
      return;
    }
    
    // Authenticated view
    container.innerHTML = `
      <div class="dm-header">
        <button class="back-btn">← Back</button>
        <h1>💬 Direct Messages</h1>
      </div>
      
      <div class="dm-content">
        <div class="dm-sidebar">
          <div class="dm-sidebar-header">
            <h2 class="dm-sidebar-title">Direct Messages</h2>
            <div class="dm-header-actions">
              <button class="new-group-btn" title="New Group Chat">👥</button>
              <button class="new-message-btn" title="New Message">+</button>
            </div>
          </div>
          
          <div class="dm-tabs">
            <div class="dm-tab ${activeTab === 'direct' ? 'active' : ''}" data-tab="direct">Direct</div>
            <div class="dm-tab ${activeTab === 'groups' ? 'active' : ''}" data-tab="groups">Groups</div>
          </div>
          
          <div class="tab-content ${activeTab === 'direct' ? 'active' : ''}" data-content="direct">
          <div class="dm-search">
            <input type="text" class="dm-search-input" placeholder="Search conversations...">
          </div>
          
          <div class="dm-conversations">
            ${isLoading ? `
              <div class="dm-loading">
                <div class="dm-loading-spinner"></div>
                <p>Loading conversations...</p>
              </div>
            ` : conversations.length === 0 ? `
              <div class="dm-empty-state">
                <div class="dm-empty-icon">💬</div>
                <h3 class="dm-empty-title">No Messages Yet</h3>
                <p class="dm-empty-text">Start a conversation with another traveler to share experiences and tips!</p>
                <button class="dm-start-btn">Start a Conversation</button>
              </div>
            ` : conversations.map(conversation => {
              const isUnread = (conversation.unread_count || 0) > 0;
              const isActive = conversation.id === selectedConversationId;
              const lastMessage = conversation.last_message;
              const lastMessageText = lastMessage 
                ? lastMessage.shared_post_id 
                  ? 'Shared a post' 
                  : lastMessage.content || 'No message'
                : 'No messages yet';
              const lastMessageTime = lastMessage 
                ? getTimeAgo(new Date(lastMessage.created_at))
                : '';
              
              return `
                <div class="dm-conversation-item ${isActive ? 'active' : ''} ${isUnread ? 'unread' : ''}" data-conversation-id="${conversation.id}">
                  <img src="${conversation.other_user?.avatar_url || 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'}" alt="${conversation.other_user?.name || 'User'}" class="dm-user-avatar">
                  <div class="dm-conversation-info">
                    <h3 class="dm-user-name">${conversation.other_user?.name || 'User'}</h3>
                    <p class="dm-last-message">${lastMessageText}</p>
                  </div>
                  <div class="dm-conversation-meta">
                    ${lastMessageTime ? `<span class="dm-message-time">${lastMessageTime}</span>` : ''}
                    ${isUnread ? `<span class="dm-unread-badge">${conversation.unread_count}</span>` : ''}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
          </div>
          
          <div class="tab-content ${activeTab === 'groups' ? 'active' : ''}" data-content="groups" id="group-chats-tab">
            <!-- Group chats tab will be rendered here -->
          </div>
        </div>
        
        ${selectedConversationId && selectedUser ? `
          <div class="dm-chat">
            <div class="dm-chat-header">
              <img src="${selectedUser.avatar_url || 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'}" alt="${selectedUser.name}" class="dm-user-avatar">
              <div class="dm-chat-user-info">
                <h3 class="dm-chat-user-name">${selectedUser.name}</h3>
                <p class="dm-chat-user-status">Traveler</p>
              </div>
              <div class="dm-chat-actions">
                <button class="dm-chat-action-btn view-profile-btn" data-user-id="${selectedUser.id}" title="View Profile">👤</button>
              </div>
            </div>
            
            <div class="dm-messages-container">
              ${messages.length === 0 ? `
                <div class="dm-empty-state">
                  <div class="dm-empty-icon">✉️</div>
                  <h3 class="dm-empty-title">No Messages Yet</h3>
                  <p class="dm-empty-text">Send a message to start the conversation!</p>
                </div>
              ` : messages.map(message => {
                const isOutgoing = message.sender_id === authState.currentUser?.id;
                const messageTime = formatMessageTime(new Date(message.created_at));
                
                return `
                  <div class="dm-message ${isOutgoing ? 'outgoing' : ''}">
                    <img src="${message.sender?.avatar_url || 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'}" alt="${message.sender?.name || 'User'}" class="dm-message-avatar">
                    <div class="dm-message-content">
                      ${message.content ? `<p class="dm-message-text">${message.content}</p>` : ''}
                      ${message.shared_post_id ? `<div class="dm-shared-post" id="shared-post-${message.id}"></div>` : ''}
                      <div class="dm-message-time">${messageTime}</div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
            
            <div class="dm-input-container">
              <div class="dm-input-wrapper">
                <textarea class="dm-input" placeholder="Type a message..." rows="1">${currentInputValue}</textarea>
              </div>
              <button class="dm-send-btn" disabled>
                <span class="dm-send-icon">📤</span>
              </button>
            </div>
          </div>
        ` : `
          <div class="dm-no-conversation">
            <div class="dm-no-conversation-icon">💬</div>
            <h3 class="dm-no-conversation-title">Select a Conversation</h3>
            <p class="dm-no-conversation-text">Choose a conversation from the sidebar or start a new one.</p>
            <button class="dm-start-btn">Start a New Conversation</button>
          </div>
        `}
      </div>
    `;
    
    // Add event listeners
    const backBtn = container.querySelector('.back-btn') as HTMLButtonElement;
    backBtn.addEventListener('click', onNavigateBack);
    
    // Tab switching
    const tabs = container.querySelectorAll('.dm-tab') as NodeListOf<HTMLElement>;
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.getAttribute('data-tab');
        if (tabName) {
          activeTab = tabName;
          
          // Update active tab
          tabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          
          // Update active content
          const tabContents = container.querySelectorAll('.tab-content');
          tabContents.forEach(content => {
            content.classList.remove('active');
            if (content.getAttribute('data-content') === tabName) {
              content.classList.add('active');
            }
          });
          
          // Render group chats tab if needed
          if (tabName === 'groups') {
            renderGroupChatsTab();
          }
        }
      });
    });
    
    // New message button
    const newMessageBtn = container.querySelector('.new-message-btn') as HTMLButtonElement;
    newMessageBtn?.addEventListener('click', showNewMessageModal);

    // New group button
    const newGroupBtn = container.querySelector('.new-group-btn') as HTMLButtonElement;
    newGroupBtn?.addEventListener('click', () => {
      const modal = createGroupChatModal(
        () => {}, // onClose - no action needed
        (groupId) => {
          // Navigate to the new group chat
          if (onGroupChatClick) {
            onGroupChatClick(groupId);
          }
        }
      );
      document.body.appendChild(modal);
    });
    
    // Start conversation button
    const startBtn = container.querySelector('.dm-start-btn') as HTMLButtonElement;
    startBtn?.addEventListener('click', showNewMessageModal);
    
    // Conversation items
    const conversationItems = container.querySelectorAll('.dm-conversation-item');
    conversationItems.forEach(item => {
      item.addEventListener('click', () => {
        const conversationId = item.getAttribute('data-conversation-id');
        if (conversationId) {
          selectedConversationId = conversationId;
          
          // Find the conversation and set the selected user
          const conversation = conversations.find(c => c.id === conversationId);
          if (conversation) {
            selectedUser = conversation.other_user || null;
          }
          
          loadMessages(conversationId);
        }
      });
    });
    
    // View profile button
    const viewProfileBtn = container.querySelector('.view-profile-btn') as HTMLButtonElement;
    viewProfileBtn?.addEventListener('click', () => {
      const userId = viewProfileBtn.getAttribute('data-user-id');
      if (userId && onUserClick) {
        onUserClick(userId);
      }
    });
    
    // Message input and send button
    const newMessageInput = container.querySelector('.dm-input') as HTMLTextAreaElement;
    const sendBtn = container.querySelector('.dm-send-btn') as HTMLButtonElement;

    // Restore focus if it was focused before
    if (currentInputFocused && newMessageInput) {
      newMessageInput.focus();
      
      // Place cursor at the end
      const length = newMessageInput.value.length;
      newMessageInput.setSelectionRange(length, length);
    }
    
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
    
    // Render shared posts
    messages.forEach(message => {
      if (message.shared_post_id && message.shared_post) {
        const sharedPostContainer = document.getElementById(`shared-post-${message.id}`);
        if (sharedPostContainer) {
          const postCard = createPostCard(
            message.shared_post,
            () => {}, // No like handler needed
            () => {}, // No comment handler needed
            undefined, // No follow handler needed
            undefined, // No unfollow handler needed
            false, // Don't show follow button
            onUserClick, // Navigate to user profile when clicked
            false, // Not own profile
            undefined, // No delete handler
            undefined, // No AI handler
            onSharePost // Allow resharing the post
          );
          
          sharedPostContainer.appendChild(postCard);
        }
      }
    });
    
    // Restore scroll position or scroll to bottom if we were at the bottom
    const newMessagesContainer = container.querySelector('.dm-messages-container');
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
    const messagesContainer = container.querySelector('.dm-messages-container');
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
  
  // Get time ago for conversation list
  function getTimeAgo(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
  
  // Initial load
  loadConversations();
  
  // Render group chats tab if active
  if (activeTab === 'groups') {
    setTimeout(() => {
      renderGroupChatsTab();
    }, 0);
  }
  
  // Render group chats tab if it's the active tab
  if (activeTab === 'groups' && onGroupChatClick) {
    setTimeout(() => {
      const tabContainer = container.querySelector('#group-chats-tab');
      if (tabContainer) {
        groupChatsTab = createGroupChatsTab(onGroupChatClick);
        tabContainer.appendChild(groupChatsTab);
      }
    }, 0);
  }
  
  // Listen for auth changes
  authManager.onAuthChange(() => {
    loadConversations();
  });
  
  // Clean up subscription when component is removed
  container.addEventListener('remove', () => {
    if (subscription) {
      supabase.removeChannel(subscription);
      subscription = null;
    }
  });
  
  return container;
}