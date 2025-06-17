import { supabase } from './lib/supabase';
import { User, AuthState } from './types';

class AuthManager {
  private authState: AuthState = {
    isAuthenticated: false,
    currentUser: null,
    loading: true
  };

  private listeners: Array<(authState: AuthState) => void> = [];

  constructor() {
    this.init();
  }

  private async init() {
    try {
      // Test Supabase connection first
      const { error: connectionError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);

      if (connectionError) {
        console.error('Supabase connection test failed:', connectionError);
        this.handleConnectionError(connectionError);
        return;
      }

      // Get initial session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        await this.setCurrentUser(session.user.id);
      } else {
        this.authState = {
          isAuthenticated: false,
          currentUser: null,
          loading: false
        };
        this.notifyListeners();
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await this.setCurrentUser(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          this.authState = {
            isAuthenticated: false,
            currentUser: null,
            loading: false
          };
          this.notifyListeners();
        }
      });
    } catch (error) {
      console.error('Error initializing auth:', error);
      this.handleConnectionError(error);
    }
  }

  private handleConnectionError(error: any) {
    console.error('Connection error details:', error);
    
    // Provide detailed error information
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      console.error('Network error - this is likely a CORS issue. Please check your Supabase project settings.');
      console.error('Make sure to add http://localhost:5173 to your Supabase project\'s allowed origins.');
      console.error('Go to: Supabase Dashboard > Authentication > Settings > Site URL');
    }
    
    this.authState = {
      isAuthenticated: false,
      currentUser: null,
      loading: false
    };
    this.notifyListeners();
  }

  private async setCurrentUser(userId: string) {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        
        // Handle specific error cases
        if (error.code === 'PGRST116') {
          // No rows returned - profile doesn't exist
          console.error('User profile not found. This might happen if the profile creation trigger failed.');
        }
        
        throw error;
      }

      this.authState = {
        isAuthenticated: true,
        currentUser: {
          id: profile.id,
          name: profile.name,
          avatar_url: profile.avatar_url
        },
        loading: false
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      this.handleConnectionError(error);
    }
    
    this.notifyListeners();
  }

  async refreshCurrentUser(): Promise<void> {
    if (this.authState.currentUser) {
      await this.setCurrentUser(this.authState.currentUser.id);
    }
  }

  getAuthState(): AuthState {
    return { ...this.authState };
  }

  isAuthenticated(): boolean {
    return this.authState.isAuthenticated;
  }

  getCurrentUser(): User | null {
    return this.authState.currentUser;
  }

  async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        return { 
          success: false, 
          error: 'Connection failed. Please check your internet connection and ensure your Supabase project allows requests from this domain.' 
        };
      }
      
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  async signup(name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name
          }
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Signup error:', error);
      
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        return { 
          success: false, 
          error: 'Connection failed. Please check your internet connection and ensure your Supabase project allows requests from this domain.' 
        };
      }
      
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  async logout(): Promise<void> {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  onAuthChange(callback: (authState: AuthState) => void): void {
    this.listeners.push(callback);
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => callback(this.getAuthState()));
  }
}

export const authManager = new AuthManager();