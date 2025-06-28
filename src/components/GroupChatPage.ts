import { authManager } from '../auth';
import { supabase } from '../lib/supabase';
import { User, Post } from '../types';
import { createPostCard } from './PostCard';

interface GroupChat {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  last_message_id: string | null;
  creator?: User;
  members?: GroupMember[];
  unread_count?: number;
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
  content: string | null;
  shared_post_id: string | null;
  created_at: string;
  read_by: string[];
  sender?: User;
  shared_post?: Post;
}

export function createGroupChatPage(
  groupId: string,
  onNavigateBack: () => void,
  onUserClick?: (userId: string) => void,
  onSharePost?: (post: Post) => void
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'group-chat-page';
  
  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    .group-chat-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 2rem 1rem;
    }

    .group-header {
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

    .group-header h1 {
      color: white;
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0;
    }

    .group-header .back-btn {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
    }

    .group-header .back-btn:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: translateY(-1px);
    }

    .group-content {
      background: white;
      border-radius: 1rem;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      display: flex;
      height: calc(100vh - 8rem);
    }

    .group-sidebar {
      width: 300px;
      border-right: 1px solid #e5e7eb;
      display: flex;
      flex-direction: column;
      background: #f8fafc;
    }

    .group-info {
      padding: 1.5rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .group-name {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 0.5rem 0;
    }

    .group-description {
      color: #64748b;
      font-size: 0.875rem;
      margin: 0 0 1rem 0;
      line-height: 1.5;
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
      color: #667eea;
    }

    .group-tabs {
      display: flex;
      border-bottom: 1px solid #e5e7eb;
    }

    .group-tab {
      flex: 1;
      text-align: center;
      padding: 1rem;
      cursor: pointer;
      color: #64748b;
      font-weight: 500;
      transition: all 0.2s;
      border-bottom: 2px solid transparent;
    }

    .group-tab.active {
      color: #667eea;
      border-bottom-color: #667eea;
    }

    .group-tab:hover:not(.active) {
      color: #334155;
      background: #f1f5f9;
    }

    .tab-content {
      flex: 1;
      display: none;
      overflow-y: auto;
    }

    .tab-content.active {
      display: flex;
      flex-direction: column;
    }

    .members-list {
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .member-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      transition: all 0.2s;
    }

    .member-item:hover {
      background: #f8fafc;
      border-color: #cbd5e1;
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
      font-weight: 600;
      color: #1e293b;
      font-size: 0.875rem;
      margin: 0 0 0.25rem 0;
    }

    .member-role {
      display: inline-block;
      padding: 0.125rem 0.5rem;
      border-radius: 1rem;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .member-role.admin {
      background: #fef3c7;
      color: #92400e;
    }

    .member-role.member {
      background: #e0f2fe;
      color: #0369a1;
    }

    .member-actions {
      display: flex;
      gap: 0.5rem;
    }

    .member-action-btn {
      background: #f1f5f9;
      color: #64748b;
      border: none;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      cursor: pointer;
      font-size: 0.75rem;
      transition: all 0.2s;
    }

    .member-action-btn:hover {
      background: #e2e8f0;
      color: #334155;
    }

    .member-action-btn.remove {
      color: #ef4444;
    }

    .member-action-btn.remove:hover {
      background: #fee2e2;
    }

    .add-member-btn {
      margin: 1rem;
      background: #667eea;
      color: white;
      border: none;
      padding: 0.75rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .add-member-btn:hover {
      background: #5a67d8;
      transform: translateY(-1px);
    }

    .group-chat {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: white;
    }

    .chat-header {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .chat-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }

    .chat-actions {
      display: flex;
      gap: 0.5rem;
    }

    .chat-action-btn {
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

    .chat-action-btn:hover {
      background: #e2e8f0;
      color: #334155;
    }

    .messages-container {
      flex: 1;
      overflow-y: auto;
      padding: 1rem 1.5rem;
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

    .shared-post {
      margin-top: 0.5rem;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      overflow: hidden;
      background: white;
    }

    .message.outgoing .shared-post {
      border-color: rgba(255, 255, 255, 0.2);
    }

    .input-container {
      padding: 1rem 1.5rem;
      border-top: 1px solid #e5e7eb;
      display: flex;
      gap: 0.75rem;
      align-items: flex-end;
    }

    .input-wrapper {
      flex: 1;
      position: relative;
    }

    .message-input {
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

    /* Responsive design */
    @media (max-width: 768px) {
      .group-chat-page {
        padding: 1rem;
      }

      .group-header {
        padding: 1rem;
      }

      .group-content {
        flex-direction: column;
        height: auto;
        min-height: calc(100vh - 8rem);
      }

      .group-sidebar {
        width: 100%;
        border-right: none;
        border-bottom: 1px solid #e5e7eb;
        max-height: 300px;
      }

      .group-chat {
        height: calc(100vh - 300px - 8rem);
      }

      .message {
        max-width: 90%;
      }
    }

    @media (max-width: 480px) {
      .group-chat-page {
        padding: 0.5rem;
      }

      .group-header {
        padding: 0.75rem;
      }

      .group-info {
        padding: 1rem;
      }

      .group-tab {
        padding: 0.75rem;
      }

      .chat-header {
        padding: 0.75rem 1rem;
      }

      .messages-container {
        padding: 0.75rem 1rem;
      }

      .input-container {
        padding: 0.75rem 1rem;
      }
    }
  `;
  
  if (!document.head.querySelector('#group-chat-page-styles')) {
    style.id = 'group-chat-page-styles';
    document.head.appendChild(style);
  }
  
  // State variables
  let groupChat: GroupChat | null = null;
  let groupMembers: GroupMember[] = [];
  let groupMessages: GroupMessage[] = [];
  let isLoading = false;
  let activeTab = 'chat'; // 'chat' or 'members'
  let subscription: any = null;
  let isAdmin = false;
  
  // Load group chat data
  async function loadGroupChatData() {
    isLoading = true;
    renderGroupChatPage();
    
    try {
      // Load group chat details
      const { data: groupData, error: groupError } = await supabase
        .from('group_chats')
        .select(`
          *,
          creator:profiles!group_chats_created_by_fkey(*)
        `)
        .eq('id', groupId)
        .single();
      
      if (groupError) throw groupError;
      
      groupChat = groupData;
      
      // Load group members
      const { data: membersData, error: membersError } = await supabase
        .from('group_members')
        .select(`
          *,
          user:profiles(*)
        `)
        .eq('group_chat_id', groupId)
        .order('role', { ascending: false }) // Admins first
        .order('joined_at', { ascending: true });
      
      if (membersError) throw membersError;
      
      groupMembers = membersData || [];
      
      // Check if current user is an admin
      const authState = authManager.getAuthState();
      if (authState.isAuthenticated && authState.currentUser) {
        const currentUserMember = groupMembers.find(member => member.user_id === authState.currentUser?.id);
        isAdmin = currentUserMember?.role === 'admin';
      }
      
      // Load group messages
      await loadGroupMessages();
      
      // Set up real-time subscription for new messages
      setupMessageSubscription();
      
    } catch (error) {
      console.error('Error loading group chat data:', error);
      groupChat = null;
      groupMembers = [];
      groupMessages = [];
    } finally {
      isLoading = false;
      renderGroupChatPage();
    }
  }
  
  // Load group messages
  async function loadGroupMessages() {
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
        .order('created_at', { ascending: true });
      
      if (messagesError) throw messagesError;
      
      groupMessages = messagesData || [];
      
      // Mark messages as read
      markMessagesAsRead();
      
    } catch (error) {
      console.error('Error loading group messages:', error);
      groupMessages = [];
    }
  }
  
  // Mark messages as read
  async function markMessagesAsRead() {
    const authState = authManager.getAuthState();
    if (!authState.isAuthenticated || !authState.currentUser) return;
    
    try {
      // Get messages that haven't been read by the current user
      const unreadMessages = groupMessages.filter(message => {
        const readBy = message.read_by || [];
        return message.sender_id !== authState.currentUser?.id && !readBy.includes(authState.currentUser?.id);
      });
      
      if (unreadMessages.length === 0) return;
      
      // Update each message's read_by array
      for (const message of unreadMessages) {
        const readBy = message.read_by || [];
        readBy.push(authState.currentUser.id);
        
        await supabase
          .from('group_messages')
          .update({ read_by: readBy })
          .eq('id', message.id);
      }
      
    } catch (error) {
      console.error('Error marking messages as read:', error);
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
      .channel(`group-messages-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `group_chat_id=eq.${groupId}`
        },
        async (payload) => {
          console.log('New group message received:', payload);
          
          // Fetch the complete message with sender info
          const { data: newMessage } = await supabase
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
          
          if (newMessage) {
            // Add to messages array
            groupMessages = [...groupMessages, newMessage];
            
            // Mark as read if from other user
            const authState = authManager.getAuthState();
            if (authState.isAuthenticated && authState.currentUser && newMessage.sender_id !== authState.currentUser.id) {
              const readBy = newMessage.read_by || [];
              readBy.push(authState.currentUser.id);
              
              await supabase
                .from('group_messages')
                .update({ read_by: readBy })
                .eq('id', newMessage.id);
            }
            
            // Update UI
            renderGroupChatPage();
            
            // Scroll to bottom
            scrollToBottom();
          }
        }
      )
      .subscribe();
  }
  
  // Send a message
  async function sendMessage(content: string, sharedPostId?: string) {
    const authState = authManager.getAuthState();
    if (!authState.isAuthenticated || !authState.currentUser || !groupChat) return;
    
    try {
      const { error } = await supabase
        .from('group_messages')
        .insert({
          group_chat_id: groupId,
          sender_id: authState.currentUser.id,
          content: content || null,
          shared_post_id: sharedPostId || null,
          read_by: [authState.currentUser.id] // Mark as read by sender
        });
      
      if (error) throw error;
      
      // No need to reload messages as the subscription will handle it
      
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  }
  
  // Add member to group
  async function addMember(userId: string) {
    const authState = authManager.getAuthState();
    if (!authState.isAuthenticated || !authState.currentUser || !isAdmin) return;
    
    try {
      const { error } = await supabase
        .from('group_members')
        .insert({
          group_chat_id: groupId,
          user_id: userId,
          role: 'member'
        });
      
      if (error) throw error;
      
      // Reload group members
      await loadGroupChatData();
      
    } catch (error) {
      console.error('Error adding member:', error);
      alert('Failed to add member. Please try again.');
    }
  }
  
  // Remove member from group
  async function removeMember(userId: string) {
    const authState = authManager.getAuthState();
    if (!authState.isAuthenticated || !authState.currentUser || !isAdmin) return;
    
    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_chat_id', groupId)
        .eq('user_id', userId);
      
      if (error) throw error;
      
      // Reload group members
      await loadGroupChatData();
      
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Failed to remove member. Please try again.');
    }
  }
  
  // Promote member to admin
  async function promoteMember(userId: string) {
    const authState = authManager.getAuthState();
    if (!authState.isAuthenticated || !authState.currentUser || !isAdmin) return;
    
    try {
      const { error } = await supabase
        .from('group_members')
        .update({ role: 'admin' })
        .eq('group_chat_id', groupId)
        .eq('user_id', userId);
      
      if (error) throw error;
      
      // Reload group members
      await loadGroupChatData();
      
    } catch (error) {
      console.error('Error promoting member:', error);
      alert('Failed to promote member. Please try again.');
    }
  }
  
  // Demote admin to member
  async function demoteMember(userId: string) {
    const authState = authManager.getAuthState();
    if (!authState.isAuthenticated || !authState.currentUser || !isAdmin) return;
    
    try {
      // Check if this is the only admin
      const admins = groupMembers.filter(member => member.role === 'admin');
      if (admins.length === 1 && admins[0].user_id === userId) {
        alert('Cannot demote the only admin. Promote another member to admin first.');
        return;
      }
      
      const { error } = await supabase
        .from('group_members')
        .update({ role: 'member' })
        .eq('group_chat_id', groupId)
        .eq('user_id', userId);
      
      if (error) throw error;
      
      // Reload group members
      await loadGroupChatData();
      
    } catch (error) {
      console.error('Error demoting member:', error);
      alert('Failed to demote member. Please try again.');
    }
  }
  
  // Leave group
  async function leaveGroup() {
    const authState = authManager.getAuthState();
    if (!authState.isAuthenticated || !authState.currentUser) return;
    
    try {
      // Check if user is the only admin
      const isUserAdmin = groupMembers.some(member => 
        member.user_id === authState.currentUser?.id && member.role === 'admin'
      );
      
      if (isUserAdmin) {
        const admins = groupMembers.filter(member => member.role === 'admin');
        if (admins.length === 1) {
          alert('You are the only admin. Please promote another member to admin before leaving.');
          return;
        }
      }
      
      if (!confirm('Are you sure you want to leave this group?')) return;
      
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
  
  // Delete group
  async function deleteGroup() {
    const authState = authManager.getAuthState();
    if (!authState.isAuthenticated || !authState.currentUser || !groupChat) return;
    
    // Only the creator can delete the group
    if (groupChat.created_by !== authState.currentUser.id) {
      alert('Only the group creator can delete the group.');
      return;
    }
    
    if (!confirm('Are you sure you want to delete this group? This action cannot be undone.')) return;
    
    try {
      // Delete the group chat (cascade will delete members and messages)
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
  
  // Render group chat page
  function renderGroupChatPage() {
    const authState = authManager.getAuthState();
    
    // Save the current scroll position and input value before re-rendering
    const messagesContainer = container.querySelector('.messages-container');
    const scrollPosition = messagesContainer ? messagesContainer.scrollTop : 0;
    const scrolledToBottom = messagesContainer ? 
      (messagesContainer.scrollHeight - messagesContainer.scrollTop <= messagesContainer.clientHeight + 50) : 
      true;
    
    const messageInput = container.querySelector('.message-input') as HTMLTextAreaElement;
    const currentInputValue = messageInput ? messageInput.value : '';
    const currentInputFocused = document.activeElement === messageInput;
    
    if (isLoading) {
      container.innerHTML = `
        <div class="group-header">
          <button class="back-btn">← Back</button>
          <h1>Loading Group Chat...</h1>
        </div>
        
        <div class="loading-chat">
          <div class="loading-spinner"></div>
          <span class="loading-text">Loading group chat...</span>
        </div>
      `;
      
      const backBtn = container.querySelector('.back-btn') as HTMLButtonElement;
      backBtn.addEventListener('click', onNavigateBack);
      
      return;
    }
    
    if (!groupChat) {
      container.innerHTML = `
        <div class="group-header">
          <button class="back-btn">← Back</button>
          <h1>Group Not Found</h1>
        </div>
        
        <div class="error-container">
          <div class="error-icon">⚠️</div>
          <h2 class="error-title">Group Chat Not Found</h2>
          <p class="error-text">The group chat you're looking for doesn't exist or you don't have permission to view it.</p>
          <button class="retry-btn">Retry</button>
        </div>
      `;
      
      const backBtn = container.querySelector('.back-btn') as HTMLButtonElement;
      backBtn.addEventListener('click', onNavigateBack);
      
      const retryBtn = container.querySelector('.retry-btn') as HTMLButtonElement;
      retryBtn.addEventListener('click', loadGroupChatData);
      
      return;
    }
    
    container.innerHTML = `
      <div class="group-header">
        <button class="back-btn">← Back</button>
        <h1>${groupChat.name}</h1>
        ${isAdmin ? `
          <button class="manage-group-btn">Manage Group</button>
        ` : ''}
      </div>
      
      <div class="group-content">
        <div class="group-sidebar">
          <div class="group-info">
            <h2 class="group-name">${groupChat.name}</h2>
            ${groupChat.description ? `<p class="group-description">${groupChat.description}</p>` : ''}
            <div class="group-meta">
              <span class="meta-item">
                <span class="meta-icon">👥</span>
                <span class="meta-text">${groupMembers.length} member${groupMembers.length === 1 ? '' : 's'}</span>
              </span>
              <span class="meta-item">
                <span class="meta-icon">👤</span>
                <span class="meta-text">Created by ${groupChat.creator?.name || 'Unknown'}</span>
              </span>
            </div>
          </div>
          
          <div class="group-tabs">
            <div class="group-tab ${activeTab === 'chat' ? 'active' : ''}" data-tab="chat">Chat</div>
            <div class="group-tab ${activeTab === 'members' ? 'active' : ''}" data-tab="members">Members</div>
          </div>
          
          <div class="tab-content ${activeTab === 'chat' ? 'active' : ''}" data-content="chat">
            <div class="messages-container">
              ${groupMessages.length === 0 ? `
                <div class="empty-chat">
                  <div class="empty-chat-icon">💬</div>
                  <h3 class="empty-chat-title">No Messages Yet</h3>
                  <p class="empty-chat-text">Be the first to start a conversation in this group!</p>
                </div>
              ` : groupMessages.map(message => {
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
                      ${message.content ? `<p class="message-text">${message.content}</p>` : ''}
                      ${message.shared_post_id ? `<div class="shared-post" id="shared-post-${message.id}"></div>` : ''}
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
          </div>
          
          <div class="tab-content ${activeTab === 'members' ? 'active' : ''}" data-content="members">
            <div class="members-list">
              ${groupMembers.map(member => `
                <div class="member-item" data-user-id="${member.user_id}">
                  <img src="${member.user?.avatar_url || 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'}" alt="${member.user?.name || 'User'}" class="member-avatar">
                  <div class="member-info">
                    <h3 class="member-name">${member.user?.name || 'Unknown User'}</h3>
                    <span class="member-role ${member.role}">${member.role === 'admin' ? '👑 Admin' : 'Member'}</span>
                  </div>
                  ${isAdmin && member.user_id !== authState.currentUser?.id ? `
                    <div class="member-actions">
                      ${member.role === 'member' ? `
                        <button class="member-action-btn promote" data-user-id="${member.user_id}">
                          Make Admin
                        </button>
                      ` : `
                        <button class="member-action-btn demote" data-user-id="${member.user_id}">
                          Remove Admin
                        </button>
                      `}
                      <button class="member-action-btn remove" data-user-id="${member.user_id}">
                        Remove
                      </button>
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
            
            ${isAdmin ? `
              <button class="add-member-btn">
                <span class="btn-icon">👤</span>
                <span class="btn-text">Add Members</span>
              </button>
            ` : ''}
            
            <button class="add-member-btn leave-group-btn" style="background: #ef4444;">
              <span class="btn-icon">🚪</span>
              <span class="btn-text">Leave Group</span>
            </button>
            
            ${isAdmin && groupChat.created_by === authState.currentUser?.id ? `
              <button class="add-member-btn delete-group-btn" style="background: #dc2626;">
                <span class="btn-icon">🗑️</span>
                <span class="btn-text">Delete Group</span>
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
    
    // Add event listeners
    const backBtn = container.querySelector('.back-btn') as HTMLButtonElement;
    backBtn.addEventListener('click', onNavigateBack);
    
    // Manage group button
    const manageGroupBtn = container.querySelector('.manage-group-btn') as HTMLButtonElement;
    manageGroupBtn?.addEventListener('click', () => {
      // Switch to members tab
      const membersTab = container.querySelector('.group-tab[data-tab="members"]') as HTMLElement;
      membersTab?.click();
    });
    
    // Tab switching
    const tabs = container.querySelectorAll('.group-tab');
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
        }
      });
    });
    
    // Message input and send button
    const newMessageInput = container.querySelector('.message-input') as HTMLTextAreaElement;
    const sendBtn = container.querySelector('.send-btn') as HTMLButtonElement;
    
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
    
    // Member actions
    const promoteButtons = container.querySelectorAll('.member-action-btn.promote');
    const demoteButtons = container.querySelectorAll('.member-action-btn.demote');
    const removeButtons = container.querySelectorAll('.member-action-btn.remove');
    
    promoteButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const userId = btn.getAttribute('data-user-id');
        if (userId) {
          promoteMember(userId);
        }
      });
    });
    
    demoteButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const userId = btn.getAttribute('data-user-id');
        if (userId) {
          demoteMember(userId);
        }
      });
    });
    
    removeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const userId = btn.getAttribute('data-user-id');
        if (userId && confirm('Are you sure you want to remove this member from the group?')) {
          removeMember(userId);
        }
      });
    });
    
    // Add member button
    const addMemberBtn = container.querySelector('.add-member-btn:not(.leave-group-btn):not(.delete-group-btn)') as HTMLButtonElement;
    addMemberBtn?.addEventListener('click', showAddMemberModal);
    
    // Leave group button
    const leaveGroupBtn = container.querySelector('.leave-group-btn') as HTMLButtonElement;
    leaveGroupBtn?.addEventListener('click', leaveGroup);
    
    // Delete group button
    const deleteGroupBtn = container.querySelector('.delete-group-btn') as HTMLButtonElement;
    deleteGroupBtn?.addEventListener('click', deleteGroup);
    
    // Member item clicks
    const memberItems = container.querySelectorAll('.member-item');
    memberItems.forEach(item => {
      item.addEventListener('click', (e) => {
        // Don't trigger if clicking on action buttons
        if ((e.target as HTMLElement).closest('.member-actions')) return;
        
        const userId = item.getAttribute('data-user-id');
        if (userId && onUserClick) {
          onUserClick(userId);
        }
      });
    });
    
    // Render shared posts
    groupMessages.forEach(message => {
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
    const newMessagesContainer = container.querySelector('.messages-container');
    if (newMessagesContainer) {
      if (scrolledToBottom) {
        newMessagesContainer.scrollTop = newMessagesContainer.scrollHeight;
      } else {
        newMessagesContainer.scrollTop = scrollPosition;
      }
    }
  }
  
  // Show add member modal
  function showAddMemberModal() {
    // Create modal element
    const modal = document.createElement('div');
    modal.className = 'add-member-modal';
    
    // Add styles
    const modalStyle = document.createElement('style');
    modalStyle.textContent = `
      .add-member-modal {
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

      .modal-backdrop {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: -1;
      }

      .add-member-content {
        background: white;
        border-radius: 1rem;
        width: 100%;
        max-width: 500px;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      }

      .add-member-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1.5rem;
        border-bottom: 1px solid #e2e8f0;
      }

      .add-member-header h2 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: #1e293b;
      }

      .modal-close {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #64748b;
        padding: 0.5rem;
        border-radius: 0.5rem;
        transition: all 0.2s;
      }

      .modal-close:hover {
        background: #f1f5f9;
        color: #334155;
      }

      .add-member-body {
        padding: 1.5rem;
      }

      .search-section {
        margin-bottom: 1.5rem;
      }

      .search-input {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #cbd5e1;
        border-radius: 0.5rem;
        font-size: 0.875rem;
      }

      .search-input:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
      }

      .search-results {
        margin-top: 1rem;
      }

      .search-results h3 {
        margin: 0 0 0.75rem 0;
        font-size: 1rem;
        font-weight: 600;
        color: #334155;
      }

      .user-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        max-height: 300px;
        overflow-y: auto;
      }

      .user-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem;
        border: 1px solid #e2e8f0;
        border-radius: 0.5rem;
      }

      .user-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        object-fit: cover;
      }

      .user-info {
        flex: 1;
      }

      .user-name {
        font-weight: 600;
        color: #1e293b;
        font-size: 0.875rem;
        margin: 0 0 0.25rem 0;
      }

      .user-meta {
        color: #64748b;
        font-size: 0.75rem;
        margin: 0;
      }

      .add-btn {
        background: #667eea;
        color: white;
        border: none;
        padding: 0.5rem 0.75rem;
        border-radius: 0.5rem;
        cursor: pointer;
        font-size: 0.75rem;
        font-weight: 500;
        transition: all 0.2s;
      }

      .add-btn:hover {
        background: #5a67d8;
      }

      .add-btn.added {
        background: #10b981;
      }

      .add-btn.added:hover {
        background: #059669;
      }

      .search-empty {
        text-align: center;
        padding: 2rem;
        color: #64748b;
      }

      .search-loading {
        text-align: center;
        padding: 2rem;
        color: #64748b;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
      }

      .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        margin-top: 1.5rem;
      }

      .cancel-btn {
        background: #f1f5f9;
        color: #334155;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 0.5rem;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s;
      }

      .cancel-btn:hover {
        background: #e2e8f0;
      }

      .done-btn {
        background: #667eea;
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 0.5rem;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s;
      }

      .done-btn:hover {
        background: #5a67d8;
      }
    `;
    
    if (!document.head.querySelector('#add-member-modal-styles')) {
      modalStyle.id = 'add-member-modal-styles';
      document.head.appendChild(modalStyle);
    }
    
    modal.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="add-member-content">
        <div class="add-member-header">
          <h2>Add Members to Group</h2>
          <button class="modal-close">✕</button>
        </div>
        
        <div class="add-member-body">
          <div class="search-section">
            <input type="text" class="search-input" placeholder="Search for users to add...">
          </div>
          
          <div class="search-results">
            <h3>Search Results</h3>
            <div class="user-list">
              <div class="search-empty">
                <p>Search for users to add to the group</p>
              </div>
            </div>
          </div>
          
          <div class="modal-actions">
            <button class="cancel-btn">Cancel</button>
            <button class="done-btn">Done</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Get elements
    const modalBackdrop = modal.querySelector('.modal-backdrop') as HTMLElement;
    const modalClose = modal.querySelector('.modal-close') as HTMLButtonElement;
    const searchInput = modal.querySelector('.search-input') as HTMLInputElement;
    const userList = modal.querySelector('.user-list') as HTMLElement;
    const cancelBtn = modal.querySelector('.cancel-btn') as HTMLButtonElement;
    const doneBtn = modal.querySelector('.done-btn') as HTMLButtonElement;
    
    // Close modal
    function closeAddMemberModal() {
      modal.remove();
    }
    
    // Search for users
    let searchTimeout: NodeJS.Timeout;
    let isSearching = false;
    let searchResults: User[] = [];
    
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      
      const query = searchInput.value.trim();
      
      if (!query) {
        userList.innerHTML = `
          <div class="search-empty">
            <p>Search for users to add to the group</p>
          </div>
        `;
        return;
      }
      
      userList.innerHTML = `
        <div class="search-loading">
          <div class="loading-spinner"></div>
          <p>Searching...</p>
        </div>
      `;
      
      isSearching = true;
      
      searchTimeout = setTimeout(async () => {
        try {
          const authState = authManager.getAuthState();
          if (!authState.isAuthenticated || !authState.currentUser) return;
          
          // Get current member IDs
          const currentMemberIds = groupMembers.map(member => member.user_id);
          
          // Search for users not already in the group
          const { data: users, error } = await supabase
            .from('profiles')
            .select('*')
            .not('id', 'in', `(${currentMemberIds.join(',')})`)
            .ilike('name', `%${query}%`)
            .limit(10);
          
          if (error) throw error;
          
          searchResults = users || [];
          
          if (searchResults.length === 0) {
            userList.innerHTML = `
              <div class="search-empty">
                <p>No users found matching "${query}"</p>
              </div>
            `;
            return;
          }
          
          userList.innerHTML = searchResults.map(user => `
            <div class="user-item">
              <img src="${user.avatar_url || 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'}" alt="${user.name}" class="user-avatar">
              <div class="user-info">
                <h3 class="user-name">${user.name}</h3>
                <p class="user-meta">Traveler</p>
              </div>
              <button class="add-btn" data-user-id="${user.id}">Add</button>
            </div>
          `).join('');
          
          // Add event listeners for add buttons
          const addButtons = userList.querySelectorAll('.add-btn');
          addButtons.forEach(btn => {
            btn.addEventListener('click', async () => {
              const userId = btn.getAttribute('data-user-id');
              if (userId) {
                try {
                  // Add member to group
                  await addMember(userId);
                  
                  // Update button
                  btn.textContent = 'Added';
                  btn.classList.add('added');
                  btn.disabled = true;
                } catch (error) {
                  console.error('Error adding member:', error);
                  alert('Failed to add member. Please try again.');
                }
              }
            });
          });
          
        } catch (error) {
          console.error('Error searching users:', error);
          userList.innerHTML = `
            <div class="search-empty">
              <p>Error searching users. Please try again.</p>
            </div>
          `;
        } finally {
          isSearching = false;
        }
      }, 500);
    });
    
    // Event listeners
    modalBackdrop.addEventListener('click', closeAddMemberModal);
    modalClose.addEventListener('click', closeAddMemberModal);
    cancelBtn.addEventListener('click', closeAddMemberModal);
    doneBtn.addEventListener('click', closeAddMemberModal);
    
    // Focus search input
    searchInput.focus();
  }
  
  // Scroll to bottom of messages container
  function scrollToBottom() {
    const messagesContainer = container.querySelector('.messages-container');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
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
  
  // Initial load
  loadGroupChatData();
  
  // Clean up subscription when component is removed
  container.addEventListener('remove', () => {
    if (subscription) {
      supabase.removeChannel(subscription);
      subscription = null;
    }
  });
  
  return container;
}