import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface Company {
  id: string;
  name: string;
  segment: string;
  employees_count: number;
  contact_phone: string;
  contact_email: string;
  address: string;
  status: 'active' | 'inactive';
  created_at: string;
}

interface CompanyState {
  companies: Company[];
  loading: boolean;
  error: string | null;
  fetchCompanies: () => Promise<void>;
  createCompany: (company: Omit<Company, 'id' | 'created_at'>) => Promise<void>;
  updateCompany: (id: string, company: Partial<Company>) => Promise<void>;
  deleteCompany: (id: string) => Promise<void>;
}

export const useCompanyStore = create<CompanyState>((set) => ({
  companies: [],
  loading: false,
  error: null,
  fetchCompanies: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ companies: data as Company[] });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },
  createCompany: async (company) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('companies')
        .insert([{ ...company, user_id: user.id }]);

      if (error) throw error;
      const store = useCompanyStore.getState();
      store.fetchCompanies();
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },
  updateCompany: async (id, company) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('companies')
        .update(company)
        .eq('id', id);

      if (error) throw error;
      const store = useCompanyStore.getState();
      store.fetchCompanies();
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },
  deleteCompany: async (id) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id);

      if (error) throw error;
      const store = useCompanyStore.getState();
      store.fetchCompanies();
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },
}));