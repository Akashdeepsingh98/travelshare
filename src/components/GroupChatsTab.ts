import { authManager } from '../auth';
import { supabase } from '../lib/supabase';
import { createGroupChatModal } from './GroupChatModal';

interface GroupChat {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  last_message_id: string | null;
  last_message?: {
    content: string | null;
    sender_name: string;
    created_at: string;
    shared_post_id: string | null;
  };
  unread_count: number;
  member_count: number;
}

export function createGroupChatsTab(onGroupChatClick: (groupId: string) => void): HTMLElement {
  const container = document.createElement('div');
  container.className = 'group-chats-tab';
  
  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    .group-chats-tab {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .group-chats-header {
      padding: 1rem;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .group-chats-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }

    .new-group-btn {
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

    .new-group-btn:hover {
      background: #5a67d8;
      transform: translateY(-1px);
    }

    .group-chats-search {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .group-search-input {
      width: 100%;
      padding: 0.5rem 0.75rem;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      background: white;
    }

    .group-search-input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
    }

    .group-chats-list {
      flex: 1;
      overflow-y: auto;
    }

    .group-chat-item {
      padding: 1rem;
      border-bottom: 1px solid #e5e7eb;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .group-chat-item:hover {
      background: #f1f5f9;
    }

    .group-chat-item.active {
      background: #e0f2fe;
      border-left: 3px solid #0ea5e9;
    }

    .group-chat-item.unread {
      background: #f0fdf4;
    }

    .group-chat-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      font-weight: 600;
    }

    .group-chat-info {
      flex: 1;
      min-width: 0;
    }

    .group-chat-name {
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 0.25rem 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .group-chat-last-message {
      color: #64748b;
      font-size: 0.875rem;
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .group-chat-meta {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.25rem;
    }

    .group-chat-time {
      font-size: 0.75rem;
      color: #94a3b8;
      white-space: nowrap;
    }

    .group-chat-unread {
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

    .group-chats-empty {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      text-align: center;
    }

    .empty-groups-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
      color: #94a3b8;
    }

    .group-chats-empty h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 0.5rem 0;
    }

    .group-chats-empty p {
      color: #64748b;
      max-width: 300px;
      margin: 0 0 1.5rem 0;
      line-height: 1.6;
    }

    .create-group-btn {
      background: #667eea;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .create-group-btn:hover {
      background: #5a67d8;
      transform: translateY(-1px);
    }

    .group-chats-loading {
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
  `;
  
  if (!document.head.querySelector('#group-chats-tab-styles')) {
    style.id = 'group-chats-tab-styles';
    document.head.appendChild(style);
  }
  
  // State variables
  let groupChats: GroupChat[] = [];
  let isLoading = false;
  let searchQuery = '';
  
  // Load group chats
  async function loadGroupChats() {
    const authState = authManager.getAuthState();
    if (!authState.isAuthenticated || !authState.currentUser) {
      renderGroupChatsTab();
      return;
    }
    
    isLoading = true;
    renderGroupChatsTab();
    
    try {
      // Get all group chats where the current user is a member
      const { data: membershipData, error: membershipError } = await supabase
        .from('group_members')
        .select('group_chat_id')
        .eq('user_id', authState.currentUser.id);
      
      if (membershipError) throw membershipError;
      
      if (!membershipData || membershipData.length === 0) {
        groupChats = [];
        isLoading = false;
        renderGroupChatsTab();
        return;
      }
      
      const groupChatIds = membershipData.map(m => m.group_chat_id);
      
      // Get group chat details
      const { data: groupChatsData, error: groupChatsError } = await supabase
        .from('group_chats')
        .select('*')
        .in('id', groupChatIds)
        .order('updated_at', { ascending: false });
      
      if (groupChatsError) throw groupChatsError;
      
      // Get last message for each group chat
      const groupChatsWithLastMessage = await Promise.all((groupChatsData || []).map(async (chat) => {
        // Get last message
        let lastMessage = null;
        if (chat.last_message_id) {
          const { data: messageData } = await supabase
            .from('group_messages')
            .select(`
              content,
              shared_post_id,
              created_at,
              sender:profiles!group_messages_sender_id_fkey(name)
            `)
            .eq('id', chat.last_message_id)
            .single();
          
          if (messageData) {
            lastMessage = {
              content: messageData.content,
              sender_name: messageData.sender?.name || 'Unknown',
              created_at: messageData.created_at,
              shared_post_id: messageData.shared_post_id
            };
          }
        }
        
        // Get unread count
        const { data: unreadMessages } = await supabase
          .from('group_messages')
          .select('id', { count: 'exact', head: true })
          .eq('group_chat_id', chat.id)
          .neq('sender_id', authState.currentUser.id)
          .not('read_by', 'cs', `{${authState.currentUser.id}}`);
        
        const unreadCount = unreadMessages?.count || 0;
        
        // Get member count
        const { data: members } = await supabase
          .from('group_members')
          .select('id', { count: 'exact', head: true })
          .eq('group_chat_id', chat.id);
        
        const memberCount = members?.count || 0;
        
        return {
          ...chat,
          last_message: lastMessage,
          unread_count: unreadCount,
          member_count: memberCount
        };
      }));
      
      groupChats = groupChatsWithLastMessage;
      
    } catch (error) {
      console.error('Error loading group chats:', error);
      groupChats = [];
    } finally {
      isLoading = false;
      renderGroupChatsTab();
    }
  }
  
  // Render group chats tab
  function renderGroupChatsTab() {
    const authState = authManager.getAuthState();
    
    if (!authState.isAuthenticated) {
      container.innerHTML = `
        <div class="group-chats-empty">
          <div class="empty-groups-icon">👥</div>
          <h3>Group Chats</h3>
          <p>Log in to create and join group chats with other travelers.</p>
        </div>
      `;
      return;
    }
    
    if (isLoading) {
      container.innerHTML = `
        <div class="group-chats-loading">
          <div class="loading-spinner"></div>
          <span class="loading-text">Loading group chats...</span>
        </div>
      `;
      return;
    }
    
    // Filter group chats by search query
    const filteredGroupChats = searchQuery
      ? groupChats.filter(chat => chat.name.toLowerCase().includes(searchQuery.toLowerCase()))
      : groupChats;
    
    container.innerHTML = `
      <div class="group-chats-header">
        <h2 class="group-chats-title">Group Chats</h2>
        <button class="new-group-btn" title="Create New Group">+</button>
      </div>
      
      <div class="group-chats-search">
        <input type="text" class="group-search-input" placeholder="Search groups..." value="${searchQuery}">
      </div>
      
      ${filteredGroupChats.length === 0 ? `
        <div class="group-chats-empty">
          <div class="empty-groups-icon">👥</div>
          <h3>No Group Chats Yet</h3>
          <p>Create a new group chat to start messaging with multiple travelers at once.</p>
          <button class="create-group-btn">
            <span class="btn-icon">👥</span>
            <span class="btn-text">Create Group Chat</span>
          </button>
        </div>
      ` : `
        <div class="group-chats-list">
          ${filteredGroupChats.map(chat => {
            const hasUnread = chat.unread_count > 0;
            const lastMessageText = chat.last_message
              ? chat.last_message.shared_post_id
                ? `${chat.last_message.sender_name} shared a post`
                : `${chat.last_message.sender_name}: ${chat.last_message.content || ''}`
              : 'No messages yet';
            const lastMessageTime = chat.last_message
              ? getTimeAgo(new Date(chat.last_message.created_at))
              : '';
            
            // Get initials for avatar
            const initials = chat.name
              .split(' ')
              .map(word => word[0])
              .join('')
              .substring(0, 2)
              .toUpperCase();
            
            return `
              <div class="group-chat-item ${hasUnread ? 'unread' : ''}" data-group-id="${chat.id}">
                <div class="group-chat-avatar">${initials}</div>
                <div class="group-chat-info">
                  <h3 class="group-chat-name">${chat.name}</h3>
                  <p class="group-chat-last-message">${lastMessageText}</p>
                </div>
                <div class="group-chat-meta">
                  ${lastMessageTime ? `<span class="group-chat-time">${lastMessageTime}</span>` : ''}
                  ${hasUnread ? `<span class="group-chat-unread">${chat.unread_count}</span>` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}
    `;
    
    // Add event listeners
    const newGroupBtn = container.querySelector('.new-group-btn') as HTMLButtonElement;
    const createGroupBtn = container.querySelector('.create-group-btn') as HTMLButtonElement;
    const searchInput = container.querySelector('.group-search-input') as HTMLInputElement;
    const groupChatItems = container.querySelectorAll('.group-chat-item');
    
    newGroupBtn?.addEventListener('click', showCreateGroupModal);
    createGroupBtn?.addEventListener('click', showCreateGroupModal);
    
    searchInput?.addEventListener('input', (e) => {
      searchQuery = (e.target as HTMLInputElement).value;
      renderGroupChatsTab();
    });
    
    groupChatItems.forEach(item => {
      item.addEventListener('click', () => {
        const groupId = item.getAttribute('data-group-id');
        if (groupId) {
          onGroupChatClick(groupId);
        }
      });
    });
  }
  
  // Show create group modal
  function showCreateGroupModal() {
    const modal = createGroupChatModal(
      () => {}, // onClose - no action needed
      (groupId) => {
        // Reload group chats after successful creation
        loadGroupChats();
        
        // Navigate to the new group chat
        onGroupChatClick(groupId);
      }
    );
    
    document.body.appendChild(modal);
  }
  
  // Get time ago for last message
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
  loadGroupChats();
  
  // Listen for auth changes
  authManager.onAuthChange(() => {
    loadGroupChats();
  });
  
  return container;
}