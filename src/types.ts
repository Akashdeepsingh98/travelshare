export interface User {
  id: string;
  name: string;
  avatar_url: string | null;
  email?: string;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: User;
}

export interface MediaItem {
  url: string;
  type: 'image' | 'video';
  userContext?: UserContext;
}

export interface Post {
export interface UserContext {
  id: string;
  name?: string;
}

  id: string;
  user_id: string;
  location: string;
  content: string;
  image_url?: string; // Keep for backward compatibility
  media_urls?: string[];
  media_types?: string[];
  created_at: string;
  likes_count: number;
  user?: User;
  comments?: Comment[];
  user_has_liked?: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  currentUser: User | null;
  loading: boolean;
}

// MCP Types
export interface MCPServer {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  apiKey?: string;
  isActive: boolean;
  category: 'restaurant' | 'hotel' | 'flight' | 'taxi' | 'mall' | 'attraction' | 'general';
  capabilities: string[];
  created_at: string;
  user_id: string;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
}

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface MCPPrompt {
  name: string;
  description?: string;
  arguments?: any[];
}

export interface MCPServerCapabilities {
  tools?: MCPTool[];
  resources?: MCPResource[];
  prompts?: MCPPrompt[];
}

export interface MCPRequest {
  method: string;
  params?: any;
}

export interface MCPResponse {
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

// Mini App Types
export interface MiniApp {
  id: string;
  user_id: string;
  name: string;
  description: string;
  app_url: string;
  icon_url: string;
  category: 'transportation' | 'food' | 'shopping' | 'entertainment' | 'travel' | 'business' | 'other';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AppCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
}

// Community Types
export interface Community {
  id: string;
  name: string;
  description: string;
  created_by: string;
  is_private: boolean;
  created_at: string;
  creator?: User;
  member_count?: number;
  user_role?: 'admin' | 'member' | null;
}

export interface CommunityMember {
  id: string;
  community_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  user?: User;
}

export interface CommunitySharedPost {
  id: string;
  community_id: string;
  post_id: string;
  shared_by: string;
  shared_at: string;
  post?: Post;
  shared_by_user?: User;
}

// Itinerary Types
export interface Itinerary {
  id: string;
  user_id: string;
  title: string;
  destination: string;
  start_date?: string;
  end_date?: string;
  budget?: string;
  preferences?: string[];
  notes?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  items?: ItineraryItem[];
  user?: User;
}

// Direct Message Types
export interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  updated_at: string;
  other_user?: User;
  last_message?: Message;
  unread_count?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content?: string;
  created_at: string;
  read_at?: string;
  shared_post_id?: string;
  sender?: User;
  shared_post?: Post;
}

export interface ItineraryItem {
  id: string;
  itinerary_id: string;
  day: number;
  time?: string;
  title: string;
  description?: string;
  location?: string;
  category?: 'accommodation' | 'activity' | 'food' | 'transportation' | 'other';
  cost?: number;
  notes?: string;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface ItineraryPreference {
  id: string;
  label: string;
  icon: string;
}

export interface ItineraryGenerationRequest {
  destination: string;
  startDate?: string;
  endDate?: string;
  budget?: string;
  preferences: string[];
  notes?: string;
  userId: string;
}