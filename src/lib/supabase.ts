import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please connect to Supabase first.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          avatar_url: string | null
          created_at: string | null
          is_approved: boolean | null
          approved_at: string | null
          approved_by: string | null
        }
        Insert: {
          id: string
          name: string
          avatar_url?: string | null
          created_at?: string | null
          is_approved?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
        }
        Update: {
          id?: string
          name?: string
          avatar_url?: string | null
          created_at?: string | null
          is_approved?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
        }
      }
      posts: {
        Row: {
          id: string
          user_id: string
          location: string
          content: string
          image_url: string | null
          created_at: string | null
          likes_count: number | null
          media_urls: any | null
          media_types: any | null
          latitude: number | null
          longitude: number | null
        }
        Insert: {
          id?: string
          user_id: string
          location: string
          content: string
          image_url?: string | null
          created_at?: string | null
          likes_count?: number | null
          media_urls?: any | null
          media_types?: any | null
          latitude?: number | null
          longitude?: number | null
        }
        Update: {
          id?: string
          user_id?: string
          location?: string
          content?: string
          image_url?: string | null
          created_at?: string | null
          likes_count?: number | null
          media_urls?: any | null
          media_types?: any | null
          latitude?: number | null
          longitude?: number | null
        }
      }
      post_likes: {
        Row: {
          id: string
          post_id: string
          user_id: string
          created_at: string | null
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          created_at?: string | null
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          created_at?: string | null
        }
      }
      comments: {
        Row: {
          id: string
          post_id: string
          user_id: string
          content: string
          created_at: string | null
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          content: string
          created_at?: string | null
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          content?: string
          created_at?: string | null
        }
      }
      follows: {
        Row: {
          id: string
          follower_id: string
          following_id: string
          created_at: string | null
        }
        Insert: {
          id?: string
          follower_id: string
          following_id: string
          created_at?: string | null
        }
        Update: {
          id?: string
          follower_id?: string
          following_id?: string
          created_at?: string | null
        }
      }
      mcp_servers: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          endpoint: string
          api_key: string | null
          is_active: boolean | null
          category: string
          capabilities: any | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          endpoint: string
          api_key?: string | null
          is_active?: boolean | null
          category: string
          capabilities?: any | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          endpoint?: string
          api_key?: string | null
          is_active?: boolean | null
          category?: string
          capabilities?: any | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      mini_apps: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          app_url: string
          icon_url: string | null
          category: string
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          app_url: string
          icon_url?: string | null
          category: string
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          app_url?: string
          icon_url?: string | null
          category?: string
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
    }
  }
}