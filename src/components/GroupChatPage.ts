import { authManager } from '../auth';
import { supabase } from '../lib/supabase';
import { User } from '../types';
import { showAuthModal } from './AuthModal';

interface GroupChat {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  last_message_id?: string;
  creator?: User;
}

interface GroupMember {
  id: string;
  group_chat_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  user?: User;
}

interface GroupMessage {
  id: string;
  group_chat_id: string;
  sender_id: string;
  content?: string;
  shared_post_id?: string;
  created_at: string;
  read_by: string[];
  sender?: User;
  shared_post?: any;
}

export function createGroupChatPage(
  groupId: string,
  onNavigateBack: () => void,
  onUserClick?: (userId: string) => void,
  onSharePost?: (groupId: string) => void
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'group-chat-page';
  
  let groupChat: GroupChat | null = null;
  let groupMembers: GroupMember[] = [];
  let groupMessages: GroupMessage[] = [];
  let isLoading = false;
  let isLoadingMore = false;
  let hasMoreMessages = true;
  let messageSubscription: any = null;
  let userRole: 'admin' | 'member' | null = null;
  
  async function loadGroupChat() {
    const authState = authManager.getAuthState();
    if (!authState.isAuthenticated || !authState.currentUser) {
      renderGroupChatPage();
      return;
    }
    
    isLoading = true;
    renderGroupChatPage();
    
    try {
      // Load group chat details
      const { data: chatData, error: chatError } = await supabase
        .from('group_chats')
        .select(`
          *,
          creator:profiles!group_chats_created_by_fkey(*)
        `)
        .eq('id', groupId)
        .single();
      
      if (chatError) throw chatError;
      
      groupChat = chatData;
      
      // Check if user is a member and get their role
      const { data: memberData, error: memberError } = await supabase
        .from('group_members')
        .select('role')
        .eq('group_chat_id', groupId)
        .eq('user_id', authState.currentUser.id)
        .single();
      
      if (memberError) {
        console.error('Error checking membership:', memberError);
        userRole = null;
      } else {
        userRole = memberData.role as 'admin' | 'member';
      }
      
      // Load group members
      const { data: membersData, error: membersError } = await supabase
        .from('group_members')
        .select(`
          *,
          user:profiles(*)
        `)
        .eq('group_chat_id', groupId)
        .order('role', { ascending: false }) // Admins first
        .order('joined_at', { ascending: false });
      
      if (membersError) throw membersError;
      
      groupMembers = membersData || [];
      
      // Load group messages
      await loadMessages();
      
      // Subscribe to new messages
      subscribeToMessages();
      
      // Mark messages as read
      if (groupMessages.length > 0) {
        markMessagesAsRead();
      }
      
    } catch (error) {
      console.error('Error loading group chat:', error);
    } finally {
      isLoading = false;
      renderGroupChatPage();
    }
  }
  
  async function loadMessages(limit = 20, offset = 0) {
    try {
      const { data: messagesData, error: messagesError } = await supabase
        .from('group_messages')
        .select(`
          *,
          sender:profiles(*),
          shared_post:posts(
            *,
            user:profiles(*)
          )
        `)
        .eq('group_chat_id', groupId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (messagesError) throw messagesError;
      
      // Process messages
      const newMessages = messagesData || [];
      
      // Check if we have more messages to load
      hasMoreMessages = newMessages.length === limit;
      
      // Parse read_by JSON
      newMessages.forEach(message => {
        try {
          if (typeof message.read_by === 'string') {
            message.read_by = JSON.parse(message.read_by);
          }
        } catch (e) {
          message.read_by = [];
        }
      });
      
      if (offset === 0) {
        // First load, replace all messages
        groupMessages = newMessages.reverse();
      } else {
        // Loading more, prepend to existing messages
        groupMessages = [...newMessages.reverse(), ...groupMessages];
      }
      
    } catch (error) {
      console.error('Error loading messages:', error);
      hasMoreMessages = false;
    }
  }
  
  async function loadMoreMessages() {
    if (!hasMoreMessages || isLoadingMore) return;
    
    isLoadingMore = true;
    renderLoadingMoreState();
    
    try {
      await loadMessages(20, groupMessages.length);
      renderGroupChatPage();
      
      // Maintain scroll position
      const messagesContainer = container.querySelector('.group-chat-messages') as HTMLElement;
      if (messagesContainer) {
        messagesContainer.scrollTop = 200; // Scroll to show some of the new messages
      }
      
    } catch (error) {
      console.error('Error loading more messages:', error);
    } finally {
      isLoadingMore = false;
    }
  }
  
  function subscribeToMessages() {
    // Clean up existing subscription if any
    if (messageSubscription) {
      messageSubscription.unsubscribe();
    }
    
    // Subscribe to new messages
    messageSubscription = supabase
      .channel(`group-chat-${groupId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'group_messages',
        filter: `group_chat_id=eq.${groupId}`
      }, async (payload) => {
        console.log('New message received:', payload);
        
        // Fetch the complete message with sender info
        const { data: messageData, error: messageError } = await supabase
          .from('group_messages')
          .select(`
            *,
            sender:profiles(*),
            shared_post:posts(
              *,
              user:profiles(*)
            )
          `)
          .eq('id', payload.new.id)
          .single();
        
        if (messageError) {
          console.error('Error fetching new message:', messageError);
          return;
        }
        
        // Parse read_by JSON
        try {
          if (typeof messageData.read_by === 'string') {
            messageData.read_by = JSON.parse(messageData.read_by);
          }
        } catch (e) {
          messageData.read_by = [];
        }
        
        // Add to messages
        groupMessages.push(messageData);
        renderGroupChatPage();
        
        // Scroll to bottom
        scrollToBottom();
        
        // Mark as read if not from current user
        const authState = authManager.getAuthState();
        if (authState.isAuthenticated && authState.currentUser && messageData.sender_id !== authState.currentUser.id) {
          markMessagesAsRead([messageData.id]);
        }
      })
      .subscribe();
  }
  
  async function markMessagesAsRead(messageIds?: string[]) {
    const authState = authManager.getAuthState();
    if (!authState.isAuthenticated || !authState.currentUser) return;
    
    try {
      // If specific message IDs are provided, only mark those as read
      // Otherwise, mark all messages as read
      const messagesToMark = messageIds || groupMessages
        .filter(msg => 
          msg.sender_id !== authState.currentUser!.id && 
          !msg.read_by.includes(authState.currentUser!.id)
        )
        .map(msg => msg.id);
      
      if (messagesToMark.length === 0) return;
      
      // Update each message's read_by array
      for (const messageId of messagesToMark) {
        await supabase.rpc('mark_message_as_read', {
          message_uuid: messageId,
          user_uuid: authState.currentUser.id,
          is_group_message: true
        });
      }
      
      // Update local state
      groupMessages = groupMessages.map(msg => {
        if (messagesToMark.includes(msg.id) && !msg.read_by.includes(authState.currentUser!.id)) {
          return {
            ...msg,
            read_by: [...msg.read_by, authState.currentUser!.id]
          };
        }
        return msg;
      });
      
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }
  
  function renderGroupChatPage() {
    const authState = authManager.getAuthState();
    const isAuthenticated = authState.isAuthenticated && authState.currentUser;
    const isMember = userRole !== null;
    
    container.innerHTML = `
      <div class="group-chat-header">
        <button class="back-btn">← Back</button>
        ${groupChat ? `
          <div class="chat-header-info">
            <h1>${groupChat.name}</h1>
            <div class="chat-header-meta">
              <span class="members-count">${groupMembers.length} member${groupMembers.length === 1 ? '' : 's'}</span>
            </div>
          </div>
          <div class="chat-header-actions">
            ${isMember ? `
              <button class="group-info-btn" title="Group Info">
                <span class="info-icon">ℹ️</span>
              </button>
            ` : ''}
          </div>
        ` : ''}
      </div>
      
      ${isLoading ? `
        <div class="group-chat-loading">
          <div class="loading-spinner"></div>
          <p>Loading group chat...</p>
        </div>
      ` : !groupChat ? `
        <div class="group-chat-not-found">
          <div class="not-found-content">
            <div class="not-found-icon">🔍</div>
            <h3>Group Chat Not Found</h3>
            <p>The group chat you're looking for doesn't exist or you don't have permission to view it.</p>
            <button class="back-to-messages-btn">Back to Messages</button>
          </div>
        </div>
      ` : !isMember ? `
        <div class="not-member-message">
          <div class="not-member-content">
            <div class="not-member-icon">🔒</div>
            <h3>Not a Member</h3>
            <p>You are not a member of this group chat. You need to be added by a group admin to participate.</p>
            <button class="back-to-messages-btn">Back to Messages</button>
          </div>
        </div>
      ` : `
        <div class="group-chat-content">
          <div class="group-chat-messages" id="group-chat-messages">
            ${hasMoreMessages ? `
              <div class="load-more-container">
                <button class="load-more-btn" id="load-more-btn">
                  <span class="btn-text">Load earlier messages</span>
                  <span class="btn-loading" style="display: none;">Loading...</span>
                </button>
              </div>
            ` : ''}
            
            ${groupMessages.length === 0 ? `
              <div class="empty-chat-message">
                <div class="empty-chat-icon">💬</div>
                <h3>No Messages Yet</h3>
                <p>Be the first to send a message in this group!</p>
              </div>
            ` : groupMessages.map(message => createMessageHTML(message, authState.currentUser?.id)).join('')}
          </div>
          
          <div class="group-chat-input-container">
            <div class="chat-actions">
              <button class="share-post-btn" title="Share a post">
                <span class="share-icon">🔄</span>
              </button>
            </div>
            <div class="chat-input-wrapper">
              <input type="text" placeholder="Type a message..." class="chat-input" id="chat-input">
              <button class="send-btn" id="send-btn" disabled>
                <span class="send-icon">➤</span>
              </button>
            </div>
          </div>
        </div>
        
        <!-- Group Info Modal (hidden by default) -->
        <div class="group-info-modal" style="display: none;">
          <div class="group-info-backdrop"></div>
          <div class="group-info-content">
            <div class="group-info-header">
              <h2>Group Info</h2>
              <button class="info-close-btn">✕</button>
            </div>
            
            <div class="group-info-body">
              <div class="group-details">
                <h3>${groupChat.name}</h3>
                ${groupChat.description ? `<p class="group-description">${groupChat.description}</p>` : ''}
                <div class="group-meta">
                  <span class="meta-item">
                    <span class="meta-icon">👑</span>
                    <span class="meta-text">Created by ${groupChat.creator?.name || 'Unknown'}</span>
                  </span>
                  <span class="meta-item">
                    <span class="meta-icon">📅</span>
                    <span class="meta-text">Created ${formatDate(groupChat.created_at)}</span>
                  </span>
                </div>
              </div>
              
              <div class="group-members-section">
                <div class="section-header">
                  <h3>Members (${groupMembers.length})</h3>
                  ${userRole === 'admin' ? `
                    <button class="add-member-btn">
                      <span class="btn-icon">+</span>
                      <span class="btn-text">Add</span>
                    </button>
                  ` : ''}
                </div>
                
                <div class="members-list">
                  ${groupMembers.map(member => `
                    <div class="member-item" data-user-id="${member.user_id}">
                      <img src="${member.user?.avatar_url || 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'}" alt="${member.user?.name || 'Unknown'}" class="member-avatar">
                      <div class="member-info">
                        <h4 class="member-name">${member.user?.name || 'Unknown'}</h4>
                        <span class="member-role ${member.role}">${member.role === 'admin' ? '👑 Admin' : 'Member'}</span>
                      </div>
                      ${userRole === 'admin' && member.user_id !== authState.currentUser?.id ? `
                        <div class="member-actions">
                          ${member.role === 'member' ? `
                            <button class="promote-member-btn" data-user-id="${member.user_id}">
                              Make Admin
                            </button>
                          ` : `
                            <button class="demote-member-btn" data-user-id="${member.user_id}">
                              Remove Admin
                            </button>
                          `}
                          <button class="remove-member-btn" data-user-id="${member.user_id}">
                            Remove
                          </button>
                        </div>
                      ` : ''}
                    </div>
                  `).join('')}
                </div>
              </div>
              
              <div class="group-actions">
                <button class="leave-group-btn">
                  <span class="btn-icon">🚪</span>
                  <span class="btn-text">Leave Group</span>
                </button>
                ${userRole === 'admin' && groupChat.created_by === authState.currentUser?.id ? `
                  <button class="delete-group-btn">
                    <span class="btn-icon">🗑️</span>
                    <span class="btn-text">Delete Group</span>
                  </button>
                ` : ''}
              </div>
            </div>
          </div>
        </div>
      `}
    `;
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .group-chat-page {
        min-height: 100vh;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 2rem 1rem;
        display: flex;
        flex-direction: column;
      }

      .group-chat-header {
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

      .group-chat-header .back-btn {
        background: rgba(255, 255, 255, 0.2);
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s;
      }

      .group-chat-header .back-btn:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: translateY(-1px);
      }

      .chat-header-info {
        flex: 1;
        text-align: center;
      }

      .chat-header-info h1 {
        color: white;
        font-size: 1.5rem;
        font-weight: 600;
        margin: 0 0 0.25rem 0;
      }

      .chat-header-meta {
        color: rgba(255, 255, 255, 0.9);
        font-size: 0.875rem;
      }

      .chat-header-actions {
        display: flex;
        gap: 0.5rem;
      }

      .group-info-btn {
        background: rgba(255, 255, 255, 0.2);
        color: white;
        border: none;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
      }

      .group-info-btn:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: translateY(-1px);
      }

      .group-chat-content {
        background: white;
        border-radius: 1rem;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .group-chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        min-height: 300px;
      }

      .load-more-container {
        display: flex;
        justify-content: center;
        margin-bottom: 1rem;
      }

      .load-more-btn {
        background: #f1f5f9;
        color: #64748b;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        cursor: pointer;
        font-size: 0.875rem;
        font-weight: 500;
        transition: all 0.2s;
      }

      .load-more-btn:hover {
        background: #e2e8f0;
        color: #475569;
      }

      .empty-chat-message {
        text-align: center;
        padding: 3rem 1rem;
        color: #94a3b8;
      }

      .empty-chat-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
      }

      .empty-chat-message h3 {
        font-size: 1.25rem;
        font-weight: 600;
        margin-bottom: 0.5rem;
        color: #64748b;
      }

      .empty-chat-message p {
        color: #94a3b8;
      }

      .message {
        display: flex;
        gap: 0.75rem;
        align-items: flex-start;
        max-width: 80%;
      }

      .message.own-message {
        align-self: flex-end;
        flex-direction: row-reverse;
      }

      .message-avatar {
        width: 36px;
        height: 36px;
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

      .own-message .message-content {
        background: #667eea;
        color: white;
        border-bottom-left-radius: 1rem;
        border-bottom-right-radius: 0.25rem;
      }

      .message-sender {
        font-weight: 600;
        font-size: 0.875rem;
        margin-bottom: 0.25rem;
        color: #475569;
      }

      .own-message .message-sender {
        color: rgba(255, 255, 255, 0.9);
      }

      .message-text {
        font-size: 0.875rem;
        line-height: 1.5;
        word-break: break-word;
      }

      .message-time {
        font-size: 0.75rem;
        color: #94a3b8;
        margin-top: 0.25rem;
        text-align: right;
      }

      .own-message .message-time {
        color: rgba(255, 255, 255, 0.8);
      }

      .message-status {
        font-size: 0.75rem;
        color: #94a3b8;
        margin-top: 0.25rem;
        text-align: right;
      }

      .own-message .message-status {
        color: rgba(255, 255, 255, 0.8);
      }

      .shared-post {
        margin-top: 0.5rem;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 0.5rem;
        padding: 0.75rem;
        font-size: 0.875rem;
      }

      .shared-post-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
      }

      .shared-post-avatar {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        object-fit: cover;
      }

      .shared-post-user {
        font-weight: 600;
        color: #1e293b;
        font-size: 0.75rem;
      }

      .shared-post-location {
        color: #667eea;
        font-size: 0.75rem;
      }

      .shared-post-content {
        color: #334155;
        margin-bottom: 0.5rem;
        font-size: 0.75rem;
        line-height: 1.4;
      }

      .shared-post-image {
        width: 100%;
        height: 120px;
        object-fit: cover;
        border-radius: 0.25rem;
        margin-top: 0.5rem;
      }

      .group-chat-input-container {
        padding: 1rem 1.5rem;
        border-top: 1px solid #e2e8f0;
        background: #f8fafc;
      }

      .chat-actions {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
      }

      .share-post-btn {
        background: #f1f5f9;
        color: #64748b;
        border: none;
        padding: 0.5rem;
        border-radius: 0.5rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
      }

      .share-post-btn:hover {
        background: #e2e8f0;
        color: #475569;
      }

      .chat-input-wrapper {
        display: flex;
        gap: 0.5rem;
        align-items: center;
      }

      .chat-input {
        flex: 1;
        padding: 0.75rem 1rem;
        border: 1px solid #cbd5e1;
        border-radius: 1.5rem;
        font-size: 0.875rem;
        outline: none;
        transition: border-color 0.2s;
      }

      .chat-input:focus {
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
      }

      .send-btn {
        background: #667eea;
        color: white;
        border: none;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
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
        font-size: 0.875rem;
        transform: rotate(90deg);
      }

      .group-chat-loading, .group-chat-not-found, .not-member-message {
        background: white;
        border-radius: 1rem;
        padding: 3rem 1rem;
        text-align: center;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      }

      .loading-spinner {
        width: 40px;
        height: 40px;
        border: 3px solid #f3f4f6;
        border-top: 3px solid #667eea;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 1rem;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .not-found-content, .not-member-content {
        max-width: 400px;
        margin: 0 auto;
      }

      .not-found-icon, .not-member-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
        color: #94a3b8;
      }

      .not-found-content h3, .not-member-content h3 {
        color: #334155;
        font-size: 1.25rem;
        font-weight: 600;
        margin-bottom: 0.5rem;
      }

      .not-found-content p, .not-member-content p {
        color: #64748b;
        margin-bottom: 1.5rem;
      }

      .back-to-messages-btn {
        background: #667eea;
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 0.5rem;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s;
      }

      .back-to-messages-btn:hover {
        background: #5a67d8;
        transform: translateY(-1px);
      }

      /* Group Info Modal */
      .group-info-modal {
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

      .group-info-backdrop {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: -1;
      }

      .group-info-content {
        background: white;
        border-radius: 1rem;
        width: 100%;
        max-width: 500px;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      }

      .group-info-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1.5rem;
        border-bottom: 1px solid #e2e8f0;
        position: sticky;
        top: 0;
        background: white;
        z-index: 10;
      }

      .group-info-header h2 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: #1e293b;
      }

      .info-close-btn {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #64748b;
        padding: 0.5rem;
        border-radius: 0.5rem;
        transition: all 0.2s;
      }

      .info-close-btn:hover {
        background: #f1f5f9;
        color: #334155;
      }

      .group-info-body {
        padding: 1.5rem;
      }

      .group-details {
        margin-bottom: 2rem;
      }

      .group-details h3 {
        color: #1e293b;
        font-size: 1.5rem;
        font-weight: 600;
        margin: 0 0 0.5rem 0;
      }

      .group-description {
        color: #64748b;
        margin-bottom: 1rem;
        line-height: 1.6;
      }

      .group-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
      }

      .meta-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #64748b;
        font-size: 0.875rem;
      }

      .meta-icon {
        font-size: 1rem;
      }

      .group-members-section {
        margin-bottom: 2rem;
      }

      .section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1rem;
      }

      .section-header h3 {
        color: #1e293b;
        font-size: 1.125rem;
        font-weight: 600;
        margin: 0;
      }

      .add-member-btn {
        background: #667eea;
        color: white;
        border: none;
        padding: 0.5rem 0.75rem;
        border-radius: 0.5rem;
        cursor: pointer;
        font-size: 0.875rem;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        transition: all 0.2s;
      }

      .add-member-btn:hover {
        background: #5a67d8;
      }

      .members-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        max-height: 300px;
        overflow-y: auto;
      }

      .member-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 0.75rem;
        border: 1px solid #e2e8f0;
        border-radius: 0.75rem;
        transition: all 0.2s;
      }

      .member-item:hover {
        background: #f8fafc;
      }

      .member-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        object-fit: cover;
      }

      .member-info {
        flex: 1;
      }

      .member-name {
        color: #1e293b;
        font-size: 0.875rem;
        font-weight: 600;
        margin: 0 0 0.25rem 0;
      }

      .member-role {
        display: inline-block;
        font-size: 0.75rem;
        padding: 0.125rem 0.5rem;
        border-radius: 1rem;
        background: #f1f5f9;
        color: #64748b;
      }

      .member-role.admin {
        background: #fef3c7;
        color: #92400e;
      }

      .member-actions {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .promote-member-btn, .demote-member-btn, .remove-member-btn {
        background: #f1f5f9;
        color: #334155;
        border: none;
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        cursor: pointer;
        font-size: 0.75rem;
        transition: all 0.2s;
        white-space: nowrap;
      }

      .promote-member-btn:hover {
        background: #10b981;
        color: white;
      }

      .demote-member-btn:hover, .remove-member-btn:hover {
        background: #ef4444;
        color: white;
      }

      .group-actions {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .leave-group-btn, .delete-group-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 0.75rem;
        border-radius: 0.5rem;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s;
        border: none;
      }

      .leave-group-btn {
        background: #f1f5f9;
        color: #334155;
      }

      .leave-group-btn:hover {
        background: #e2e8f0;
      }

      .delete-group-btn {
        background: #fee2e2;
        color: #b91c1c;
      }

      .delete-group-btn:hover {
        background: #fecaca;
      }

      /* Responsive design */
      @media (max-width: 768px) {
        .group-chat-page {
          padding: 1rem;
        }

        .group-chat-header {
          padding: 1rem;
          margin-bottom: 1rem;
        }

        .chat-header-info h1 {
          font-size: 1.25rem;
        }

        .group-chat-messages {
          padding: 1rem;
        }

        .message {
          max-width: 90%;
        }

        .group-chat-input-container {
          padding: 0.75rem 1rem;
        }

        .group-info-content {
          width: 95%;
          max-width: none;
        }
      }

      @media (max-width: 480px) {
        .group-chat-page {
          padding: 0.5rem;
        }

        .group-chat-header {
          padding: 0.75rem;
        }

        .chat-header-info h1 {
          font-size: 1.125rem;
        }

        .group-chat-messages {
          padding: 0.75rem;
        }

        .message {
          max-width: 95%;
        }

        .group-chat-input-container {
          padding: 0.5rem 0.75rem;
        }

        .group-info-header {
          padding: 1rem;
        }

        .group-info-body {
          padding: 1rem;
        }

        .member-actions {
          flex-direction: row;
        }
      }
    `;
    
    if (!document.head.querySelector('#group-chat-page-styles')) {
      style.id = 'group-chat-page-styles';
      document.head.appendChild(style);
    }
    
    setupEventListeners();
    
    // Scroll to bottom on initial load
    if (!isLoadingMore) {
      scrollToBottom();
    }
  }
  
  function createMessageHTML(message: GroupMessage, currentUserId?: string): string {
    const isOwnMessage = message.sender_id === currentUserId;
    const timeStr = formatTime(message.created_at);
    const readStatus = getReadStatus(message, isOwnMessage);
    
    return `
      <div class="message ${isOwnMessage ? 'own-message' : ''}">
        ${!isOwnMessage ? `
          <img src="${message.sender?.avatar_url || 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'}" alt="${message.sender?.name || 'Unknown'}" class="message-avatar">
        ` : ''}
        <div class="message-content">
          ${!isOwnMessage ? `<div class="message-sender">${message.sender?.name || 'Unknown'}</div>` : ''}
          ${message.content ? `<div class="message-text">${message.content}</div>` : ''}
          ${message.shared_post ? createSharedPostHTML(message.shared_post) : ''}
          <div class="message-time">${timeStr}</div>
          ${isOwnMessage && readStatus ? `<div class="message-status">${readStatus}</div>` : ''}
        </div>
        ${isOwnMessage ? `
          <img src="${message.sender?.avatar_url || 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'}" alt="${message.sender?.name || 'Unknown'}" class="message-avatar">
        ` : ''}
      </div>
    `;
  }
  
  function createSharedPostHTML(post: any): string {
    const hasMedia = post.image_url || (post.media_urls && post.media_urls.length > 0);
    const mediaUrl = post.image_url || (post.media_urls && post.media_urls.length > 0 ? post.media_urls[0] : null);
    
    return `
      <div class="shared-post">
        <div class="shared-post-header">
          <img src="${post.user?.avatar_url || 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'}" alt="${post.user?.name || 'Unknown'}" class="shared-post-avatar">
          <div>
            <div class="shared-post-user">${post.user?.name || 'Unknown'}</div>
            <div class="shared-post-location">📍 ${post.location}</div>
          </div>
        </div>
        <div class="shared-post-content">${post.content.length > 100 ? post.content.substring(0, 100) + '...' : post.content}</div>
        ${hasMedia ? `<img src="${mediaUrl}" alt="Post image" class="shared-post-image">` : ''}
      </div>
    `;
  }
  
  function getReadStatus(message: GroupMessage, isOwnMessage: boolean): string | null {
    if (!isOwnMessage) return null;
    
    const readCount = message.read_by.length;
    const totalMembers = groupMembers.length;
    
    // Don't count the sender
    const potentialReaders = totalMembers - 1;
    
    if (potentialReaders === 0) return null;
    
    if (readCount === 0) {
      return 'Sent';
    } else if (readCount < potentialReaders) {
      return `Read by ${readCount}`;
    } else {
      return 'Read by all';
    }
  }
  
  function renderLoadingMoreState() {
    const loadMoreBtn = container.querySelector('#load-more-btn') as HTMLButtonElement;
    if (!loadMoreBtn) return;
    
    const btnText = loadMoreBtn.querySelector('.btn-text') as HTMLElement;
    const btnLoading = loadMoreBtn.querySelector('.btn-loading') as HTMLElement;
    
    if (isLoadingMore) {
      btnText.style.display = 'none';
      btnLoading.style.display = 'inline';
      loadMoreBtn.disabled = true;
    } else {
      btnText.style.display = 'inline';
      btnLoading.style.display = 'none';
      loadMoreBtn.disabled = false;
    }
  }
  
  function setupEventListeners() {
    // Back button
    const backBtn = container.querySelector('.back-btn') as HTMLButtonElement;
    backBtn?.addEventListener('click', onNavigateBack);
    
    // Back to messages button
    const backToMessagesBtn = container.querySelector('.back-to-messages-btn') as HTMLButtonElement;
    backToMessagesBtn?.addEventListener('click', onNavigateBack);
    
    // Load more button
    const loadMoreBtn = container.querySelector('#load-more-btn') as HTMLButtonElement;
    loadMoreBtn?.addEventListener('click', loadMoreMessages);
    
    // Group info button
    const groupInfoBtn = container.querySelector('.group-info-btn') as HTMLButtonElement;
    groupInfoBtn?.addEventListener('click', () => {
      const groupInfoModal = container.querySelector('.group-info-modal') as HTMLElement;
      groupInfoModal.style.display = 'flex';
    });
    
    // Close group info modal
    const infoCloseBtn = container.querySelector('.info-close-btn') as HTMLButtonElement;
    const groupInfoBackdrop = container.querySelector('.group-info-backdrop') as HTMLElement;
    
    infoCloseBtn?.addEventListener('click', () => {
      const groupInfoModal = container.querySelector('.group-info-modal') as HTMLElement;
      groupInfoModal.style.display = 'none';
    });
    
    groupInfoBackdrop?.addEventListener('click', () => {
      const groupInfoModal = container.querySelector('.group-info-modal') as HTMLElement;
      groupInfoModal.style.display = 'none';
    });
    
    // Member item click (navigate to profile)
    const memberItems = container.querySelectorAll('.member-item');
    memberItems.forEach(item => {
      item.addEventListener('click', (e) => {
        // Don't trigger if clicking on action buttons
        if ((e.target as HTMLElement).closest('.member-actions')) return;
        
        const userId = (item as HTMLElement).dataset.userId;
        if (userId && onUserClick) {
          onUserClick(userId);
        }
      });
    });
    
    // Promote member button
    const promoteBtns = container.querySelectorAll('.promote-member-btn');
    promoteBtns.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const userId = (btn as HTMLElement).dataset.userId!;
        await handlePromoteMember(userId);
      });
    });
    
    // Demote member button
    const demoteBtns = container.querySelectorAll('.demote-member-btn');
    demoteBtns.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const userId = (btn as HTMLElement).dataset.userId!;
        await handleDemoteMember(userId);
      });
    });
    
    // Remove member button
    const removeBtns = container.querySelectorAll('.remove-member-btn');
    removeBtns.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const userId = (btn as HTMLElement).dataset.userId!;
        await handleRemoveMember(userId);
      });
    });
    
    // Leave group button
    const leaveGroupBtn = container.querySelector('.leave-group-btn') as HTMLButtonElement;
    leaveGroupBtn?.addEventListener('click', handleLeaveGroup);
    
    // Delete group button
    const deleteGroupBtn = container.querySelector('.delete-group-btn') as HTMLButtonElement;
    deleteGroupBtn?.addEventListener('click', handleDeleteGroup);
    
    // Add member button
    const addMemberBtn = container.querySelector('.add-member-btn') as HTMLButtonElement;
    addMemberBtn?.addEventListener('click', handleAddMember);
    
    // Share post button
    const sharePostBtn = container.querySelector('.share-post-btn') as HTMLButtonElement;
    sharePostBtn?.addEventListener('click', () => {
      if (onSharePost) {
        onSharePost(groupId);
      }
    });
    
    // Send message
    const chatInput = container.querySelector('#chat-input') as HTMLInputElement;
    const sendBtn = container.querySelector('#send-btn') as HTMLButtonElement;
    
    chatInput?.addEventListener('input', () => {
      if (sendBtn) {
        sendBtn.disabled = !chatInput.value.trim();
      }
    });
    
    chatInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && chatInput.value.trim()) {
        sendMessage(chatInput.value.trim());
        chatInput.value = '';
        sendBtn.disabled = true;
      }
    });
    
    sendBtn?.addEventListener('click', () => {
      if (chatInput.value.trim()) {
        sendMessage(chatInput.value.trim());
        chatInput.value = '';
        sendBtn.disabled = true;
      }
    });
    
    // Focus input when clicking on messages container
    const messagesContainer = container.querySelector('.group-chat-messages') as HTMLElement;
    messagesContainer?.addEventListener('click', () => {
      chatInput?.focus();
    });
  }
  
  async function sendMessage(content: string) {
    const authState = authManager.getAuthState();
    if (!authState.isAuthenticated || !authState.currentUser) {
      showAuthModal();
      return;
    }
    
    try {
      await supabase
        .from('group_messages')
        .insert({
          group_chat_id: groupId,
          sender_id: authState.currentUser.id,
          content,
          read_by: [authState.currentUser.id] // Mark as read by sender
        });
      
      // The message will be added via the subscription
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  }
  
  async function handlePromoteMember(userId: string) {
    try {
      const { error } = await supabase
        .from('group_members')
        .update({ role: 'admin' })
        .eq('group_chat_id', groupId)
        .eq('user_id', userId);
      
      if (error) throw error;
      
      // Reload group members
      await loadGroupChat();
      
    } catch (error) {
      console.error('Error promoting member:', error);
      alert('Failed to promote member. Please try again.');
    }
  }
  
  async function handleDemoteMember(userId: string) {
    // Check if this is the only admin
    const adminCount = groupMembers.filter(m => m.role === 'admin').length;
    if (adminCount === 1) {
      alert('Cannot demote the only admin. Promote another member to admin first.');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('group_members')
        .update({ role: 'member' })
        .eq('group_chat_id', groupId)
        .eq('user_id', userId);
      
      if (error) throw error;
      
      // Reload group members
      await loadGroupChat();
      
    } catch (error) {
      console.error('Error demoting member:', error);
      alert('Failed to demote member. Please try again.');
    }
  }
  
  async function handleRemoveMember(userId: string) {
    // Check if this is the only admin
    const member = groupMembers.find(m => m.user_id === userId);
    if (member?.role === 'admin') {
      const adminCount = groupMembers.filter(m => m.role === 'admin').length;
      if (adminCount === 1) {
        alert('Cannot remove the only admin. Promote another member to admin first.');
        return;
      }
    }
    
    if (!confirm('Are you sure you want to remove this member?')) return;
    
    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_chat_id', groupId)
        .eq('user_id', userId);
      
      if (error) throw error;
      
      // Reload group members
      await loadGroupChat();
      
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Failed to remove member. Please try again.');
    }
  }
  
  async function handleLeaveGroup() {
    const authState = authManager.getAuthState();
    if (!authState.isAuthenticated || !authState.currentUser) return;
    
    // Check if user is the only admin
    const isAdmin = userRole === 'admin';
    if (isAdmin) {
      const adminCount = groupMembers.filter(m => m.role === 'admin').length;
      if (adminCount === 1 && groupMembers.length > 1) {
        alert('You are the only admin. Please promote another member to admin before leaving.');
        return;
      }
    }
    
    if (!confirm('Are you sure you want to leave this group?')) return;
    
    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_chat_id', groupId)
        .eq('user_id', authState.currentUser.id);
      
      if (error) throw error;
      
      // Navigate back
      onNavigateBack();
      
    } catch (error) {
      console.error('Error leaving group:', error);
      alert('Failed to leave group. Please try again.');
    }
  }
  
  async function handleDeleteGroup() {
    if (!confirm('Are you sure you want to delete this group? This action cannot be undone.')) return;
    
    try {
      const { error } = await supabase
        .from('group_chats')
        .delete()
        .eq('id', groupId);
      
      if (error) throw error;
      
      // Navigate back
      onNavigateBack();
      
    } catch (error) {
      console.error('Error deleting group:', error);
      alert('Failed to delete group. Please try again.');
    }
  }
  
  async function handleAddMember() {
    // This would open a modal to add members
    // For simplicity, we'll just show an alert for now
    alert('Add member functionality would open a modal to select users to add to the group.');
  }
  
  function scrollToBottom() {
    const messagesContainer = container.querySelector('.group-chat-messages') as HTMLElement;
    if (messagesContainer) {
      setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }, 100);
    }
  }
  
  function formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' });
  }
  
  // Initial load
  loadGroupChat();
  
  // Cleanup function
  container.addEventListener('remove', () => {
    // Unsubscribe from messages
    if (messageSubscription) {
      messageSubscription.unsubscribe();
    }
  });
  
  return container;
}