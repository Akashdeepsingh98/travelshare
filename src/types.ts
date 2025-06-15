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