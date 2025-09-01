import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface Service {
  id: string;
  name: string;
  description: string;
  hourly_rate: number;
  status: 'active' | 'inactive';
  created_at: string;
}

interface ServiceState {
  services: Service[];
  loading: boolean;
  error: string | null;
  fetchServices: () => Promise<void>;
  createService: (service: Omit<Service, 'id' | 'created_at'>) => Promise<void>;
  updateService: (id: string, service: Partial<Service>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
}

export const useServiceStore = create<ServiceState>((set) => ({
  services: [],
  loading: false,
  error: null,
  fetchServices: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ services: data as Service[] });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },
  createService: async (service) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('services')
        .insert([{ ...service, user_id: user.id }]);

      if (error) throw error;
      const store = useServiceStore.getState();
      store.fetchServices();
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },
  updateService: async (id, service) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('services')
        .update(service)
        .eq('id', id);

      if (error) throw error;
      const store = useServiceStore.getState();
      store.fetchServices();
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },
  deleteService: async (id) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);

      if (error) throw error;
      const store = useServiceStore.getState();
      store.fetchServices();
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },
}));