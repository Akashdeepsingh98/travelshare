import { Community } from '../types';
import { authManager } from '../auth';
import { supabase } from '../lib/supabase';
import { showAuthModal } from './AuthModal';

export function createCommunitiesPage(
  onNavigateBack: () => void,
  onCommunityClick: (communityId: string) => void,
  onCreateCommunity: () => void
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'communities-page';
  
  let userCommunities: Community[] = [];
  let publicCommunities: Community[] = [];
  let isLoading = false;
  
  async function loadCommunities() {
    const authState = authManager.getAuthState();
    if (!authState.isAuthenticated || !authState.currentUser) {
      renderCommunitiesPage();
      return;
    }
    
    isLoading = true;
    renderCommunitiesPage();
    
    try {
      // Load user's communities
      const { data: userCommunitiesData, error: userError } = await supabase
        .from('community_members')
        .select(`
          community_id,
          role,
          communities!inner(
            id,
            name,
            description,
            created_by,
            is_private,
            created_at,
            creator:profiles!communities_created_by_fkey(*)
          )
        `)
        .eq('user_id', authState.currentUser.id);
      
      if (userError) throw userError;
      
      userCommunities = userCommunitiesData?.map(item => ({
        ...item.communities,
        user_role: item.role
      })) || [];
      
      // Load public communities (excluding ones user is already in)
      const userCommunityIds = userCommunities.map(c => c.id);
      let publicQuery = supabase
        .from('communities')
        .select(`
          *,
          creator:profiles!communities_created_by_fkey(*)
        `)
        .eq('is_private', false)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (userCommunityIds.length > 0) {
        publicQuery = publicQuery.not('id', 'in', `(${userCommunityIds.join(',')})`);
      }
      
      const { data: publicCommunitiesData, error: publicError } = await publicQuery;
      
      if (publicError) throw publicError;
      
      publicCommunities = publicCommunitiesData || [];
      
      // Get member counts for all communities
      const allCommunityIds = [...userCommunities.map(c => c.id), ...publicCommunities.map(c => c.id)];
      if (allCommunityIds.length > 0) {
        const { data: memberCounts } = await supabase
          .from('community_members')
          .select('community_id')
          .in('community_id', allCommunityIds);
        
        const countMap = memberCounts?.reduce((acc, member) => {
          acc[member.community_id] = (acc[member.community_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {};
        
        userCommunities = userCommunities.map(c => ({ ...c, member_count: countMap[c.id] || 0 }));
        publicCommunities = publicCommunities.map(c => ({ ...c, member_count: countMap[c.id] || 0 }));
      }
      
    } catch (error) {
      console.error('Error loading communities:', error);
    } finally {
      isLoading = false;
      renderCommunitiesPage();
    }
  }
  
  function renderCommunitiesPage() {
    const authState = authManager.getAuthState();
    
    container.innerHTML = `
      <div class="communities-page-header">
        <button class="back-btn">← Back</button>
        <h1>🏘️ Travel Communities</h1>
        ${authState.isAuthenticated ? `
          <button class="create-community-btn">+ Create Community</button>
        ` : ''}
      </div>
      
      <div class="communities-page-content">
        ${!authState.isAuthenticated ? `
          <div class="communities-login-prompt">
            <div class="login-prompt-content">
              <div class="login-prompt-icon">🏘️</div>
              <h3>Join Travel Communities</h3>
              <p>Connect with fellow travelers, share experiences, and discover new destinations together!</p>
              <button class="communities-login-btn">Get Started</button>
            </div>
          </div>
        ` : isLoading ? `
          <div class="communities-loading">
            <div class="loading-spinner">Loading communities...</div>
          </div>
        ` : `
          ${userCommunities.length > 0 ? `
            <div class="communities-section">
              <h2>Your Communities</h2>
              <div class="communities-grid">
                ${userCommunities.map(community => createCommunityCard(community, true)).join('')}
              </div>
            </div>
          ` : ''}
          
          <div class="communities-section">
            <h2>Discover Communities</h2>
            ${publicCommunities.length > 0 ? `
              <div class="communities-grid">
                ${publicCommunities.map(community => createCommunityCard(community, false)).join('')}
              </div>
            ` : `
              <div class="empty-communities">
                <div class="empty-communities-content">
                  <div class="empty-communities-icon">🌍</div>
                  <h3>No public communities yet</h3>
                  <p>Be the first to create a travel community and start connecting with fellow adventurers!</p>
                </div>
              </div>
            `}
          </div>
        `}
      </div>
    `;
    
    setupEventListeners();
  }
  
  function createCommunityCard(community: Community, isUserMember: boolean): string {
    const timeAgo = getTimeAgo(new Date(community.created_at));
    const creatorName = community.creator?.name || 'Unknown';
    const memberText = community.member_count === 1 ? 'member' : 'members';
    
    return `
      <div class="community-card ${isUserMember ? 'user-member' : ''}" data-community-id="${community.id}">
        <div class="community-card-header">
          <div class="community-info">
            <h3 class="community-name">${community.name}</h3>
            <p class="community-description">${community.description || 'No description'}</p>
          </div>
          <div class="community-privacy">
            ${community.is_private ? `
              <span class="privacy-badge private">🔒 Private</span>
            ` : `
              <span class="privacy-badge public">🌍 Public</span>
            `}
          </div>
        </div>
        
        <div class="community-card-body">
          <div class="community-meta">
            <span class="meta-item">
              <span class="meta-icon">👥</span>
              <span class="meta-text">${community.member_count || 0} ${memberText}</span>
            </span>
            <span class="meta-item">
              <span class="meta-icon">👤</span>
              <span class="meta-text">Created by ${creatorName}</span>
            </span>
            <span class="meta-item">
              <span class="meta-icon">📅</span>
              <span class="meta-text">${timeAgo}</span>
            </span>
          </div>
          
          ${community.user_role ? `
            <div class="user-role-badge">
              <span class="role-badge ${community.user_role}">${community.user_role === 'admin' ? '👑 Admin' : '👤 Member'}</span>
            </div>
          ` : ''}
        </div>
        
        <div class="community-card-actions">
          <button class="view-community-btn" data-community-id="${community.id}">
            ${isUserMember ? 'View Community' : 'Learn More'}
          </button>
          ${!isUserMember && !community.is_private ? `
            <button class="join-community-btn" data-community-id="${community.id}">
              Join Community
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }
  
  function setupEventListeners() {
    const authState = authManager.getAuthState();
    
    // Back button
    const backBtn = container.querySelector('.back-btn') as HTMLButtonElement;
    backBtn.addEventListener('click', onNavigateBack);
    
    // Create community button
    const createBtn = container.querySelector('.create-community-btn') as HTMLButtonElement;
    createBtn?.addEventListener('click', onCreateCommunity);
    
    // Login button
    const loginBtn = container.querySelector('.communities-login-btn') as HTMLButtonElement;
    loginBtn?.addEventListener('click', showAuthModal);
    
    // Community card clicks
    const communityCards = container.querySelectorAll('.community-card');
    communityCards.forEach(card => {
      card.addEventListener('click', (e) => {
        // Don't trigger if clicking on action buttons
        if ((e.target as HTMLElement).closest('.community-card-actions')) return;
        
        const communityId = card.getAttribute('data-community-id')!;
        onCommunityClick(communityId);
      });
    });
    
    // View community buttons
    const viewBtns = container.querySelectorAll('.view-community-btn');
    viewBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const communityId = (btn as HTMLButtonElement).dataset.communityId!;
        onCommunityClick(communityId);
      });
    });
    
    // Join community buttons
    const joinBtns = container.querySelectorAll('.join-community-btn');
    joinBtns.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const communityId = (btn as HTMLButtonElement).dataset.communityId!;
        await handleJoinCommunity(communityId);
      });
    });
  }
  
  async function handleJoinCommunity(communityId: string) {
    const authState = authManager.getAuthState();
    if (!authState.isAuthenticated || !authState.currentUser) {
      showAuthModal();
      return;
    }
    
    try {
      const { error } = await supabase
        .from('community_members')
        .insert({
          community_id: communityId,
          user_id: authState.currentUser.id,
          role: 'member'
        });
      
      if (error) throw error;
      
      // Reload communities to update the UI
      await loadCommunities();
      
    } catch (error) {
      console.error('Error joining community:', error);
      alert('Failed to join community. Please try again.');
    }
  }
  
  function getTimeAgo(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
  }
  
  // Initial load
  loadCommunities();
  
  // Listen for auth changes
  authManager.onAuthChange(() => {
    loadCommunities();
  });
  
  return container;
}