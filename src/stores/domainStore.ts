import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface BusinessDomain {
  id: string;
  user_id: string;
  subscription_id: string;
  domain: string;
  business_name: string;
  business_type: string;
  status: 'pending' | 'active' | 'suspended';
  ssl_enabled: boolean;
  custom_logo?: string;
  custom_colors: Record<string, string>;
  created_at: string;
}

export interface DomainUser {
  id: string;
  domain_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'employee';
  permissions: Record<string, boolean>;
  status: 'active' | 'inactive';
  invited_by?: string;
  created_at: string;
}

interface DomainState {
  currentDomain: BusinessDomain | null;
  domainUsers: DomainUser[];
  loading: boolean;
  error: string | null;
  fetchCurrentDomain: () => Promise<void>;
  createDomain: (domainData: Partial<BusinessDomain>) => Promise<void>;
  updateDomain: (id: string, updates: Partial<BusinessDomain>) => Promise<void>;
  fetchDomainUsers: (domainId: string) => Promise<void>;
  inviteUser: (domainId: string, email: string, role: string) => Promise<void>;
}

export const useDomainStore = create<DomainState>((set, get) => ({
  currentDomain: null,
  domainUsers: [],
  loading: false,
  error: null,

  fetchCurrentDomain: async () => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Check if accessing via custom domain
      const hostname = window.location.hostname;
      let query = supabase.from('business_domains').select('*');
      
      if (hostname !== 'localhost' && !hostname.includes('vercel.app')) {
        // Custom domain access
        query = query.eq('domain', hostname);
      } else {
        // Default domain access
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query.single();

      if (error && error.code !== 'PGRST116') throw error;
      set({ currentDomain: data as BusinessDomain });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  createDomain: async (domainData: Partial<BusinessDomain>) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('business_domains')
        .insert({
          ...domainData,
          user_id: user.id,
        });

      if (error) throw error;
      await get().fetchCurrentDomain();
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  updateDomain: async (id: string, updates: Partial<BusinessDomain>) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('business_domains')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      await get().fetchCurrentDomain();
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  fetchDomainUsers: async (domainId: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('domain_users')
        .select('*')
        .eq('domain_id', domainId)
        .eq('status', 'active');

      if (error) throw error;
      set({ domainUsers: data as DomainUser[] });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  inviteUser: async (domainId: string, email: string, role: string) => {
    set({ loading: true, error: null });
    try {
      // This would typically send an invitation email
      // For now, we'll just create a pending invitation
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // In a real implementation, you'd send an email invitation
      // and create the domain_user record when they accept
      
      set({ error: 'Funcionalidade de convite será implementada em breve' });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },
}));