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
}

export interface Post {
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

// Profile Context for AI
export interface ProfileContext {
  id: string;
  name: string;
  avatar_url: string | null;
  created_at: string;
  is_approved?: boolean;
  posts_count: number;
  followers_count: number;
  following_count: number;
  mini_apps_count: number;
  recent_posts?: Post[];
  mini_apps?: MiniApp[];
}