import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface BusinessSegment {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  features: Record<string, any>;
  status: 'active' | 'inactive';
}

export interface SubscriptionPlan {
  id: string;
  segment_id: string;
  name: string;
  slug: string;
  description: string;
  features: string[];
  price: number;
  billing_period: 'monthly' | 'yearly';
  trial_days: number;
  max_users: number;
  max_storage_gb: number;
  status: 'active' | 'inactive';
  segment?: BusinessSegment;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'pending' | 'active' | 'cancelled' | 'expired' | 'trial';
  payment_method?: string;
  payment_id?: string;
  starts_at: string;
  expires_at?: string;
  trial_ends_at?: string;
  auto_renew: boolean;
  plan?: SubscriptionPlan;
}

interface PlanState {
  segments: BusinessSegment[];
  plans: SubscriptionPlan[];
  currentSubscription: UserSubscription | null;
  selectedSegment: BusinessSegment | null;
  selectedPlan: SubscriptionPlan | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchSegments: () => Promise<void>;
  fetchPlans: (segmentId?: string) => Promise<void>;
  fetchCurrentSubscription: () => Promise<void>;
  selectSegment: (segment: BusinessSegment) => void;
  selectPlan: (plan: SubscriptionPlan) => void;
  createSubscription: (planId: string, paymentData: any) => Promise<void>;
  cancelSubscription: (subscriptionId: string) => Promise<void>;
}

export const usePlanStore = create<PlanState>((set, get) => ({
  segments: [],
  plans: [],
  currentSubscription: null,
  selectedSegment: null,
  selectedPlan: null,
  loading: false,
  error: null,

  fetchSegments: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('business_segments')
        .select('*')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      set({ segments: data as BusinessSegment[] });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  fetchPlans: async (segmentId?: string) => {
    set({ loading: true, error: null });
    try {
      let query = supabase
        .from('subscription_plans')
        .select(`
          *,
          segment:business_segments(*)
        `)
        .eq('status', 'active')
        .order('price');

      if (segmentId) {
        query = query.eq('segment_id', segmentId);
      }

      const { data, error } = await query;

      if (error) throw error;
      set({ plans: data as SubscriptionPlan[] });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  fetchCurrentSubscription: async () => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          plan:subscription_plans(
            *,
            segment:business_segments(*)
          )
        `)
        .eq('user_id', user.id)
        .in('status', ['active', 'trial'])
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      set({ currentSubscription: data as UserSubscription });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  selectSegment: (segment: BusinessSegment) => {
    set({ selectedSegment: segment, selectedPlan: null });
    get().fetchPlans(segment.id);
  },

  selectPlan: (plan: SubscriptionPlan) => {
    set({ selectedPlan: plan });
  },

  createSubscription: async (planId: string, paymentData: any) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Get plan details
      const { data: plan } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', planId)
        .single();

      if (!plan) throw new Error('Plano não encontrado');

      // Calculate dates
      const now = new Date();
      const trialEndsAt = plan.trial_days > 0 
        ? new Date(now.getTime() + plan.trial_days * 24 * 60 * 60 * 1000)
        : null;
      
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);

      const { error } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: user.id,
          plan_id: planId,
          status: plan.trial_days > 0 ? 'trial' : 'active',
          payment_method: paymentData.method,
          payment_id: paymentData.id,
          expires_at: expiresAt.toISOString(),
          trial_ends_at: trialEndsAt?.toISOString(),
        });

      if (error) throw error;
      
      // Refresh current subscription
      await get().fetchCurrentSubscription();
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  cancelSubscription: async (subscriptionId: string) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({ 
          status: 'cancelled',
          auto_renew: false 
        })
        .eq('id', subscriptionId);

      if (error) throw error;
      
      // Refresh current subscription
      await get().fetchCurrentSubscription();
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },
}));