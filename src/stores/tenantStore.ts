import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface BusinessTenant {
  id: string;
  subscription_id: string;
  owner_id: string;
  business_name: string;
  business_slug: string;
  segment_id: string;
  subdomain: string;
  custom_domain?: string;
  domain_verified: boolean;
  logo_url?: string;
  brand_colors: Record<string, string>;
  settings: Record<string, any>;
  status: 'active' | 'suspended' | 'cancelled';
  created_at: string;
}

export interface TenantUser {
  id: string;
  tenant_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'manager' | 'employee';
  permissions: Record<string, boolean>;
  status: 'active' | 'inactive' | 'pending';
  invited_by?: string;
  invited_at?: string;
  joined_at?: string;
  created_at: string;
}

interface TenantState {
  currentTenant: BusinessTenant | null;
  tenantUsers: TenantUser[];
  userRole: string | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchCurrentTenant: () => Promise<void>;
  createTenant: (tenantData: Partial<BusinessTenant>) => Promise<void>;
  updateTenant: (id: string, updates: Partial<BusinessTenant>) => Promise<void>;
  fetchTenantUsers: (tenantId: string) => Promise<void>;
  inviteUser: (tenantId: string, email: string, role: string) => Promise<void>;
  updateUserRole: (userId: string, role: string) => Promise<void>;
  removeUser: (userId: string) => Promise<void>;
  checkDomainAvailability: (domain: string) => Promise<boolean>;
  verifyCustomDomain: (domain: string) => Promise<boolean>;
}

export const useTenantStore = create<TenantState>((set, get) => ({
  currentTenant: null,
  tenantUsers: [],
  userRole: null,
  loading: false,
  error: null,

  fetchCurrentTenant: async () => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // For localhost development, always get user's tenant
      // In production, this would check subdomain/custom domain
      const query = supabase.from('business_tenants')
        .select('*')
        .eq('owner_id', user.id);

      const { data: tenant, error: tenantError } = await query.single();

      if (tenantError && tenantError.code !== 'PGRST116') throw tenantError;

      if (tenant) {
        // Check user role in this tenant
        const { data: tenantUser } = await supabase
          .from('tenant_users')
          .select('role')
          .eq('tenant_id', tenant.id)
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single();

        set({ 
          currentTenant: tenant as BusinessTenant,
          userRole: tenantUser?.role || (tenant.owner_id === user.id ? 'owner' : null)
        });
      }
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  createTenant: async (tenantData: Partial<BusinessTenant>) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Generate unique subdomain
      const baseSlug = tenantData.business_name?.toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .substring(0, 20) || 'empresa';
      
      let subdomain = baseSlug;
      let counter = 1;
      
      // Check subdomain availability
      while (true) {
        const { data: existing } = await supabase
          .from('business_tenants')
          .select('id')
          .eq('subdomain', subdomain)
          .single();
        
        if (!existing) break;
        subdomain = `${baseSlug}${counter}`;
        counter++;
      }

      const { error } = await supabase
        .from('business_tenants')
        .insert({
          ...tenantData,
          owner_id: user.id,
          business_slug: subdomain,
          subdomain: subdomain,
        });

      if (error) throw error;
      
      // Create owner record in tenant_users
      const { data: newTenant } = await supabase
        .from('business_tenants')
        .select('id')
        .eq('subdomain', subdomain)
        .single();

      if (newTenant) {
        await supabase
          .from('tenant_users')
          .insert({
            tenant_id: newTenant.id,
            user_id: user.id,
            role: 'owner',
            status: 'active',
            joined_at: new Date().toISOString(),
          });
      }

      await get().fetchCurrentTenant();
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  updateTenant: async (id: string, updates: Partial<BusinessTenant>) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('business_tenants')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      await get().fetchCurrentTenant();
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  fetchTenantUsers: async (tenantId: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('tenant_users')
        .select(`
          *,
          user:auth.users(email)
        `)
        .eq('tenant_id', tenantId)
        .order('created_at');

      if (error) throw error;
      set({ tenantUsers: (data || []) as unknown as TenantUser[] });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  inviteUser: async (tenantId: string, email: string, role: string) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Check if user exists
      const { data: existingUser } = await supabase
        .from('auth.users')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser) {
        // Add existing user to tenant
        const { error } = await supabase
          .from('tenant_users')
          .insert({
            tenant_id: tenantId,
            user_id: existingUser.id,
            role: role,
            status: 'active',
            invited_by: user.id,
            invited_at: new Date().toISOString(),
            joined_at: new Date().toISOString(),
          });

        if (error) throw error;
      } else {
        // Create invitation record for new user
        // In a real implementation, you'd send an email invitation
        set({ error: 'Usuário não encontrado. Convide-o para se cadastrar primeiro.' });
        return;
      }

      await get().fetchTenantUsers(tenantId);
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  updateUserRole: async (userId: string, role: string) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('tenant_users')
        .update({ role })
        .eq('id', userId);

      if (error) throw error;
      
      const { currentTenant } = get();
      if (currentTenant) {
        await get().fetchTenantUsers(currentTenant.id);
      }
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  removeUser: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('tenant_users')
        .update({ status: 'inactive' })
        .eq('id', userId);

      if (error) throw error;
      
      const { currentTenant } = get();
      if (currentTenant) {
        await get().fetchTenantUsers(currentTenant.id);
      }
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  checkDomainAvailability: async (domain: string) => {
    try {
      const { data } = await supabase
        .from('business_tenants')
        .select('id')
        .or(`subdomain.eq.${domain},custom_domain.eq.${domain}`)
        .single();

      return !data; // Available if no data found
    } catch {
      return true; // Available if error (likely not found)
    }
  },

  verifyCustomDomain: async (domain: string) => {
    try {
      // In a real implementation, you'd check DNS records
      // For now, we'll simulate domain verification
      const response = await fetch(`https://${domain}`, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  },
}));