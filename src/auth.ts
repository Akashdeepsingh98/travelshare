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
      // Test Supabase connection first with a simple health check
      const { error: connectionError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);

      if (connectionError) {
        console.error('Supabase connection test failed:', connectionError);
        await this.handleConnectionError(connectionError);
        return;
      }

      // Get initial session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        await this.handleAuthError(sessionError);
        return;
      }
      
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
      await this.handleConnectionError(error);
    }
  }

  private async handleAuthError(error: any) {
    console.error('Auth error details:', error);
    
    // Check for refresh token errors
    if (error.message && (
      error.message.includes('Invalid Refresh Token') ||
      error.message.includes('refresh_token_not_found') ||
      error.message.includes('Refresh Token Not Found')
    )) {
      console.log('Invalid refresh token detected, clearing session...');
      try {
        // Clear the invalid session
        await supabase.auth.signOut();
      } catch (signOutError) {
        console.error('Error signing out:', signOutError);
      }
    }
    
    this.authState = {
      isAuthenticated: false,
      currentUser: null,
      loading: false
    };
    this.notifyListeners();
  }

  private async handleConnectionError(error: any) {
    console.error('Connection error details:', error);
    
    // Check for refresh token errors first
    if (error && typeof error === 'object' && (
      (error.message && (
        error.message.includes('Invalid Refresh Token') ||
        error.message.includes('refresh_token_not_found') ||
        error.message.includes('Refresh Token Not Found')
      )) ||
      (error.code === 'refresh_token_not_found')
    )) {
      console.log('Invalid refresh token detected in connection error, clearing session...');
      try {
        await supabase.auth.signOut();
      } catch (signOutError) {
        console.error('Error signing out:', signOutError);
      }
    }
    
    // Provide detailed error information for CORS and network issues
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      console.error('🚨 CORS/Network Error Detected');
      console.error('This is likely a CORS configuration issue. To fix this:');
      console.error('1. Go to your Supabase Dashboard');
      console.error('2. Navigate to Authentication > Settings');
      console.error('3. Add "http://localhost:5173" to the Site URL field');
      console.error('4. Save the changes and refresh this page');
      console.error('');
      console.error('Current Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
      console.error('If the URL looks incorrect, check your .env file');
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
      await this.handleConnectionError(error);
      return; // Don't notify listeners if there's an error
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
        // Handle refresh token errors during login
        if (error.message && (
          error.message.includes('Invalid Refresh Token') ||
          error.message.includes('refresh_token_not_found') ||
          error.message.includes('Refresh Token Not Found')
        )) {
          console.log('Invalid refresh token during login, clearing session...');
          try {
            await supabase.auth.signOut();
          } catch (signOutError) {
            console.error('Error signing out during login:', signOutError);
          }
        }
        
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        return { 
          success: false, 
          error: 'Connection failed. Please check the setup instructions in the browser console and ensure your Supabase project is configured correctly.' 
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
          error: 'Connection failed. Please check the setup instructions in the browser console and ensure your Supabase project is configured correctly.' 
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