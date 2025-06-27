import './style.css';
import { Post, Comment } from './types';
import { authManager } from './auth';
import { createHeader } from './components/Header';
import { createPostForm } from './components/CreatePost';
import { createPostCard } from './components/PostCard';
import { createAuthModal } from './components/AuthModal';
import { createProfilePage } from './components/ProfilePage';
import { createExplorePage } from './components/ExplorePage';
import { createPostViewer } from './components/PostViewer';
import { createFollowingPage } from './components/FollowingPage';
import { createFollowersPage } from './components/FollowersPage';
import { createAIPage } from './components/AIPage';
import { createItineraryPage } from './components/ItineraryPage';
import { createAboutPage } from './components/AboutPage';
import { createBoltBadge } from './components/BoltBadge';
import { createCommunitiesPage } from './components/CommunitiesPage';
import { createCommunityDetailPage } from './components/CommunityDetailPage';
import { createCreateCommunityModal } from './components/CreateCommunityModal';
import { createSharePostModal } from './components/SharePostModal';
import { createPostHeatmapPage } from './components/PostHeatmapPage';
import { formatItineraryAsPlainText } from './utils/formatters';
import { supabase } from './lib/supabase';
import { testSupabaseConnection, displayConnectionDiagnostics } from './utils/connection-test';

type AppView = 'feed' | 'profile' | 'explore' | 'post-viewer' | 'following' | 'followers' | 'ai-chat' | 'about' | 'communities' | 'community-detail' | 'itineraries' | 'itinerary-detail' | 'heatmap';

interface ViewData {
  userId?: string;
  userName?: string;
  communityId?: string;
  itineraryId?: string;
  locationQuery?: string;
}

class TravelSocialApp {
  private posts: Post[] = [];
  private appContainer: HTMLElement;
  private currentView: AppView = 'feed';
  private postViewerData: { post: Post; allPosts: Post[] } | null = null;
  private viewData: ViewData = {};
  private boltBadge: HTMLElement;
  private aiChatContextPost: Post | null = null;
  private aiChatUserContext: { id: string; name: string } | null = null;

  constructor() {
    this.appContainer = document.querySelector('#app')!;
    this.boltBadge = createBoltBadge();
    this.init();
  }

  private navigateToExplore(locationQuery?: string) {
    this.viewData = { locationQuery };
    this.currentView = 'explore';
    this.postViewerData = null;
    window.location.hash = 'explore';
    this.render();
  }

  private closePostViewer() {
    this.currentView = 'feed';
    this.postViewerData = null;
    this.render();
  }

  // Initialize the app
  new TravelSocialApp();
}