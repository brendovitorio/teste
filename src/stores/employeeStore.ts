import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  position: string;
  hire_date: string;
  status: 'active' | 'inactive';
  created_at: string;
}

interface EmployeeState {
  employees: Employee[];
  loading: boolean;
  error: string | null;
  fetchEmployees: () => Promise<void>;
  createEmployee: (employee: Omit<Employee, 'id' | 'created_at'>) => Promise<void>;
  updateEmployee: (id: string, employee: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
}

export const useEmployeeStore = create<EmployeeState>((set) => ({
  employees: [],
  loading: false,
  error: null,
  fetchEmployees: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ employees: data as Employee[] });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },
  createEmployee: async (employee) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('employees')
        .insert([{ ...employee, user_id: user.id }]);

      if (error) throw error;
      const store = useEmployeeStore.getState();
      store.fetchEmployees();
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },
  updateEmployee: async (id, employee) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('employees')
        .update(employee)
        .eq('id', id);

      if (error) throw error;
      const store = useEmployeeStore.getState();
      store.fetchEmployees();
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },
  deleteEmployee: async (id) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);

      if (error) throw error;
      const store = useEmployeeStore.getState();
      store.fetchEmployees();
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },
}));