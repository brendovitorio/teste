import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  checkUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  signIn: async (email, password) => {
    set({ loading: true });
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      set({ loading: false });
      throw error;
    }

    // data.user já vem preenchido se login válido
    set({ user: data.user, loading: false });
  },

  signUp: async (email, password) => {
    set({ loading: true });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) {
      set({ loading: false });
      throw error;
    }
    set({ loading: false });
  },

  signOut: async () => {
    set({ loading: true });
    const { error } = await supabase.auth.signOut();
    if (error) {
      set({ loading: false });
      throw error;
    }
    set({ user: null, loading: false });
  },

  checkUser: async () => {
    set({ loading: true });
    try {
      const { data } = await supabase.auth.getSession();
      set({ user: data.session?.user ?? null, loading: false });
    } catch {
      set({ user: null, loading: false });
    }
  },
}));
