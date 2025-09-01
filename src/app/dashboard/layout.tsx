'use client';
'use client';

import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { usePlanStore } from '@/stores/planStore';
import { useTenantStore } from '@/stores/tenantStore';
import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, checkUser } = useAuthStore();
  const { currentSubscription, fetchCurrentSubscription } = usePlanStore();
  const { currentTenant, fetchCurrentTenant } = useTenantStore();
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      await checkUser();
    };
    initAuth();
  }, [checkUser]);

  useEffect(() => {
    if (user) {
      fetchCurrentSubscription();
      fetchCurrentTenant();
    }
  }, [user, fetchCurrentSubscription, fetchCurrentTenant]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Check if user has active subscription
  if (!loading && user && !currentSubscription) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Assinatura Necessária</h2>
          <p className="text-gray-600 mb-6">Você precisa de uma assinatura ativa para acessar o dashboard.</p>
          <button
            onClick={() => router.push('/planos')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Escolher Plano
          </button>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </Suspense>
  );
}