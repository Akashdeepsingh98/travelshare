import { authManager } from '../auth';
import { supabase } from '../lib/supabase';
import { createGroupChatModal } from './GroupChatModal';

interface GroupChat {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  last_message_id?: string;
  creator?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  last_message?: {
    id: string;
    content?: string;
    sender_id: string;
    created_at: string;
    sender?: {
      id: string;
      name: string;
    };
  };
  members_count: number;
  unread_count: number;
}

export function createGroupChatsTab(
  onGroupChatClick: (groupId: string) => void
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'group-chats-tab';
  
  let groupChats: GroupChat[] = [];
  let isLoading = false;
  
  async function loadGroupChats() {
    const authState = authManager.getAuthState();
    if (!authState.isAuthenticated || !authState.currentUser) {
      renderGroupChatsTab();
      return;
    }
    
    isLoading = true;
    renderGroupChatsTab();
    
    try {
      // Get all group chats the user is a member of
      const { data: groupChatsData, error: groupChatsError } = await supabase
        .from('group_members')
        .select(`
          group_chat_id,
          group:group_chats!inner(
            id,
            name,
            description,
            created_by,
            created_at,
            updated_at,
            last_message_id,
            creator:profiles!group_chats_created_by_fkey(
              id,
              name,
              avatar_url
            ),
            last_message:group_messages!fk_last_message(
              id,
              content,
              sender_id,
              created_at,
              sender:profiles(
                id,
                name
              )
            )
          )
        `)
        .eq('user_id', authState.currentUser.id)
        .order('group(updated_at)', { ascending: false });
      
      if (groupChatsError) throw groupChatsError;
      
      // Process the data
      const processedChats: GroupChat[] = [];
      
      for (const item of groupChatsData || []) {
        const groupChat = item.group;
        
        // Get the last message
        let lastMessage = null;
        if (groupChat.last_message && groupChat.last_message.length > 0) {
          lastMessage = groupChat.last_message[0];
        }
        
        // Get members count
        const { count: membersCount } = await supabase
          .from('group_members')
          .select('*', { count: 'exact', head: true })
          .eq('group_chat_id', groupChat.id);
        
        // Get unread messages count
        const { count: unreadCount } = await supabase
          .from('group_messages')
          .select('*', { count: 'exact', head: true })
          .eq('group_chat_id', groupChat.id)
          .neq('sender_id', authState.currentUser.id)
          .not('read_by', 'cs', `{"${authState.currentUser.id}"}`);
        
        processedChats.push({
          id: groupChat.id,
          name: groupChat.name,
          description: groupChat.description,
          created_by: groupChat.created_by,
          created_at: groupChat.created_at,
          updated_at: groupChat.updated_at,
          last_message_id: groupChat.last_message_id,
          creator: groupChat.creator,
          last_message: lastMessage,
          members_count: membersCount || 0,
          unread_count: unreadCount || 0
        });
      }
      
      groupChats = processedChats;
      
    } catch (error) {
      console.error('Error loading group chats:', error);
    } finally {
      isLoading = false;
      renderGroupChatsTab();
    }
  }
  
  function renderGroupChatsTab() {
    const authState = authManager.getAuthState();
    
    container.innerHTML = `
      <div class="tab-header">
        <h2>Group Chats</h2>
        ${authState.isAuthenticated ? `
          <button class="new-group-btn">
            <span class="btn-icon">+</span>
            <span class="btn-text">New Group</span>
          </button>
        ` : ''}
      </div>
      
      ${isLoading ? `
        <div class="loading-state">
          <div class="loading-spinner"></div>
          <p>Loading group chats...</p>
        </div>
      ` : groupChats.length === 0 ? `
        <div class="empty-chats">
          <div class="empty-chats-content">
            <div class="empty-chats-icon">👥</div>
            <h3>No Group Chats Yet</h3>
            <p>Create a new group chat to start messaging with multiple people at once.</p>
            ${authState.isAuthenticated ? `
              <button class="create-first-group-btn">
                <span class="btn-icon">+</span>
                <span class="btn-text">Create Your First Group</span>
              </button>
            ` : ''}
          </div>
        </div>
      ` : `
        <div class="group-chats-list">
          ${groupChats.map(chat => createGroupChatItem(chat)).join('')}
        </div>
      `}
    `;
    
    // Add event listeners
    const newGroupBtn = container.querySelector('.new-group-btn') as HTMLButtonElement;
    const createFirstGroupBtn = container.querySelector('.create-first-group-btn') as HTMLButtonElement;
    
    newGroupBtn?.addEventListener('click', openCreateGroupModal);
    createFirstGroupBtn?.addEventListener('click', openCreateGroupModal);
    
    // Group chat item click
    const chatItems = container.querySelectorAll('.group-chat-item');
    chatItems.forEach(item => {
      item.addEventListener('click', () => {
        const groupId = (item as HTMLElement).dataset.groupId;
        if (groupId) {
          onGroupChatClick(groupId);
        }
      });
    });
  }
  
  function createGroupChatItem(chat: GroupChat): string {
    const lastMessageTime = chat.last_message ? formatTime(chat.last_message.created_at) : formatTime(chat.updated_at);
    const lastMessageText = chat.last_message 
      ? (chat.last_message.content 
          ? `${chat.last_message.sender?.name || 'Unknown'}: ${chat.last_message.content}` 
          : `${chat.last_message.sender?.name || 'Unknown'} shared a post`)
      : 'No messages yet';
    
    return `
      <div class="group-chat-item ${chat.unread_count > 0 ? 'unread' : ''}" data-group-id="${chat.id}">
        <div class="group-avatar">
          <div class="group-avatar-text">${chat.name.substring(0, 2).toUpperCase()}</div>
        </div>
        <div class="group-info">
          <div class="group-name-row">
            <h3 class="group-name">${chat.name}</h3>
            <span class="group-time">${lastMessageTime}</span>
          </div>
          <div class="group-preview-row">
            <p class="group-preview">${lastMessageText}</p>
            ${chat.unread_count > 0 ? `
              <span class="unread-badge">${chat.unread_count}</span>
            ` : ''}
          </div>
          <div class="group-meta-row">
            <span class="group-members-count">${chat.members_count} member${chat.members_count === 1 ? '' : 's'}</span>
          </div>
        </div>
      </div>
    `;
  }
  
  function openCreateGroupModal() {
    const modal = createGroupChatModal(
      () => {}, // onClose - no action needed
      (groupId) => {
        // Reload group chats and navigate to the new group
        loadGroupChats().then(() => {
          onGroupChatClick(groupId);
        });
      }
    );
    
    document.body.appendChild(modal);
  }
  
  function formatTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      // Today, show time
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays === 1) {
      // Yesterday
      return 'Yesterday';
    } else if (diffInDays < 7) {
      // Within a week, show day name
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      // Older, show date
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  }
  
  // Initial load
  loadGroupChats();
  
  // Listen for auth changes
  authManager.onAuthChange(() => {
    loadGroupChats();
  });
  
  return container;
}