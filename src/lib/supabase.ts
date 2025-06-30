import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

console.log('[DEBUG] Initializing Supabase client with:', { 
  hasUrl: !!supabaseUrl, 
  hasKey: !!supabaseAnonKey,
  urlLength: supabaseUrl?.length || 0,
  keyLength: supabaseAnonKey?.length || 0
});

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please connect to Supabase first.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    fetch: (...args) => {
      console.log('[DEBUG] Supabase fetch called with URL:', args[0]);
      return fetch(...args, {
        headers: {
          ...corsHeaders
        }
      });
    }
  }
})

// Add debug listener for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  console.log(`[DEBUG] Supabase auth state changed: ${event}`, { 
    hasSession: !!session,
    userId: session?.user?.id
  });
});

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
      communities: {
        Row: {
          id: string
          name: string
          description: string | null
          created_by: string
          is_private: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_by: string
          is_private?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_by?: string
          is_private?: boolean
          created_at?: string
        }
      }
      community_members: {
        Row: {
          id: string
          community_id: string
          user_id: string
          role: string
          joined_at: string
        }
        Insert: {
          id?: string
          community_id: string
          user_id: string
          role?: string
          joined_at?: string
        }
        Update: {
          id?: string
          community_id?: string
          user_id?: string
          role?: string
          joined_at?: string
        }
      }
      community_shared_posts: {
        Row: {
          id: string
          community_id: string
          post_id: string
          shared_by: string
          shared_at: string
        }
        Insert: {
          id?: string
          community_id: string
          post_id: string
          shared_by: string
          shared_at?: string
        }
        Update: {
          id?: string
          community_id?: string
          post_id?: string
          shared_by?: string
          shared_at?: string
        }
      }
      travel_guides: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          destination: string;
          cover_image_url: string | null;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        }
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          destination: string;
          cover_image_url?: string | null;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        }
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          destination?: string;
          cover_image_url?: string | null;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        }
      }
      guide_content_items: {
        Row: {
          id: string;
          guide_id: string;
          content_type: string;
          item_id: string;
          order_position: number;
          notes: string | null;
          created_at: string;
        }
        Insert: {
          id?: string;
          guide_id: string;
          content_type: string;
          item_id: string;
          order_position: number;
          notes?: string | null;
          created_at?: string;
        }
        Update: {
          id?: string;
          guide_id?: string;
          content_type?: string;
          item_id?: string;
          order_position?: number;
          notes?: string | null;
          created_at?: string;
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
      itineraries: {
        Row: {
          id: string
          user_id: string
          title: string
          destination: string
          start_date: string | null
          end_date: string | null
          budget: string | null
          preferences: any | null
          notes: string | null
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          destination: string
          start_date?: string | null
          end_date?: string | null
          budget?: string | null
          preferences?: any | null
          notes?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          destination?: string
          start_date?: string | null
          end_date?: string | null
          budget?: string | null
          preferences?: any | null
          notes?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      itinerary_items: {
        Row: {
          id: string
          itinerary_id: string
          day: number
          time: string | null
          title: string
          description: string | null
          location: string | null
          category: string | null
          cost: number | null
          notes: string | null
          order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          itinerary_id: string
          day: number
          time?: string | null
          title: string
          description?: string | null
          location?: string | null
          category?: string | null
          cost?: number | null
          notes?: string | null
          order: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          itinerary_id?: string
          day?: number
          time?: string | null
          title?: string
          description?: string | null
          location?: string | null
          category?: string | null
          cost?: number | null
          notes?: string | null
          order?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}