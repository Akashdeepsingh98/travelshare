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
  }

  private async setCurrentUser(userId: string) {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

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
      this.authState = {
        isAuthenticated: false,
        currentUser: null,
        loading: false
      };
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
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  async logout(): Promise<void> {
    await supabase.auth.signOut();
  }

  onAuthChange(callback: (authState: AuthState) => void): void {
    this.listeners.push(callback);
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => callback(this.getAuthState()));
  }
}

export const authManager = new AuthManager();