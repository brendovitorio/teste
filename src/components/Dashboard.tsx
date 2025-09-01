'use client';
'use client';

import React, { useEffect, useMemo } from 'react';
import { usePlanStore } from '@/stores/planStore';
import MechanicDashboard from '@/components/dashboards/MechanicDashboard';
import AutoPartsDashboard from '@/components/dashboards/AutoPartsDashboard';
import { BarChart3, Building2, Users2, ClipboardList } from 'lucide-react';

const Dashboard = () => {
  const { currentSubscription, loading, fetchCurrentSubscription } = usePlanStore();

  useEffect(() => {
    fetchCurrentSubscription();
  }, [fetchCurrentSubscription]);

  const dashboardStats = useMemo(() => [
    {
      icon: Building2,
      label: 'Total de Empresas',
      value: '0',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      icon: Users2,
      label: 'Total de Funcionários',
      value: '0',
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      icon: ClipboardList,
      label: 'Total de Serviços',
      value: '0',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      icon: BarChart3,
      label: 'Receita Total',
      value: 'R$ 0,00',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ], []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If user has a specific business plan, show specialized dashboard
  if (currentSubscription?.plan?.segment?.slug === 'oficina') {
    return <MechanicDashboard />;
  }

  if (currentSubscription?.plan?.segment?.slug === 'autopecas') {
    return <AutoPartsDashboard />;
  }

  // Default generic dashboard
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-600">Visão geral do seu negócio</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {dashboardStats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={stat.color} size={24} />
              </div>
            </div>
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-2xl font-semibold text-gray-800 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Bem-vindo ao BizManager
        </h2>
        <p className="text-gray-600 mb-4">
          Comece cadastrando suas empresas, funcionários e serviços para ter uma visão completa do seu negócio.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border border-gray-200 rounded-lg">
            <Building2 className="text-blue-600 mb-2" size={24} />
            <h3 className="font-medium text-gray-800">Cadastre Empresas</h3>
            <p className="text-sm text-gray-600">Adicione as empresas que você atende</p>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <Users2 className="text-green-600 mb-2" size={24} />
            <h3 className="font-medium text-gray-800">Gerencie Funcionários</h3>
            <p className="text-sm text-gray-600">Controle sua equipe de trabalho</p>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <ClipboardList className="text-purple-600 mb-2" size={24} />
            <h3 className="font-medium text-gray-800">Configure Serviços</h3>
            <p className="text-sm text-gray-600">Defina os serviços que você oferece</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;