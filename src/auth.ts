import { supabase } from './lib/supabase';
import { User, AuthState } from './types';
import { testSupabaseConnection, displayConnectionDiagnostics } from './utils/connection-test';

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
      // Get initial session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        await this.handleConnectionError(sessionError);
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
    
    // Enhanced CORS error detection and guidance
    console.error('🚨 Supabase Connection Error - Analyzing issue...');
    
    try {
      const testResult = await testSupabaseConnection();
      if (!testResult.success) {
        console.error('❌ Connection test failed:', testResult.error);
        console.error('📊 Test details:', testResult.details);
        
        // Provide specific CORS guidance
        if (testResult.error?.includes('Failed to fetch') || 
            testResult.error?.includes('Network connectivity') ||
            error?.message?.includes('Failed to fetch')) {
          console.error('');
          console.error('🔧 CORS CONFIGURATION REQUIRED:');
          console.error('This error typically means your Supabase project needs CORS configuration.');
          console.error('');
          console.error('📋 Steps to fix:');
          console.error('1. Go to https://supabase.com/dashboard');
          console.error('2. Select your project');
          console.error('3. Go to Settings → API');
          console.error('4. Under "Configuration", find "CORS"');
          console.error(`5. Add this URL to allowed origins: ${window.location.origin}`);
          console.error('6. Save changes and refresh this page');
          console.error('');
        }
      } else {
        console.log('✅ Connection test passed - issue may be intermittent or resolved');
      }
    } catch (testError) {
      console.error('Failed to run connection test:', testError);
      
      // Even if test fails, provide CORS guidance for fetch errors
      if (error?.message?.includes('Failed to fetch')) {
        console.error('');
        console.error('🔧 LIKELY CORS ISSUE:');
        console.error('The "Failed to fetch" error usually indicates a CORS configuration problem.');
        console.error(`Please add ${window.location.origin} to your Supabase CORS settings.`);
        console.error('Visit: https://supabase.com/dashboard → Your Project → Settings → API → CORS');
        console.error('');
      }
    }
    
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
        console.error('Error fetching user profile:', error.message || error);
        
        // Handle specific error cases
        if (error.code === 'PGRST116') {
          // No rows returned - profile doesn't exist
          console.error('User profile not found. This might happen if the profile creation trigger failed.');
        }
        
        // Don't throw connection errors, handle them gracefully
        if (error.message && error.message.includes('Failed to fetch')) {
          await this.handleConnectionError(error);
          return;
        } else {
          // For other errors, set unauthenticated state instead of throwing
          this.authState = {
            isAuthenticated: false,
            currentUser: null,
            loading: false
          };
          this.notifyListeners();
          return;
        }
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
      
      this.notifyListeners();
    } catch (error) {
      console.error('Error in setCurrentUser:', error instanceof Error ? error.message : error);
      
      // Handle connection errors gracefully
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        await this.handleConnectionError(error);
      } else {
        // For other errors, set unauthenticated state
        this.authState = {
          isAuthenticated: false,
          currentUser: null,
          loading: false
        };
        this.notifyListeners();
      }
    }
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