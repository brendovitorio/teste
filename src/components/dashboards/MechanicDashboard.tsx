'use client';

import React from 'react';
import { PenTool as Tool, Clock, Users2, TrendingUp, Wrench, BarChart3, Calendar, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const mockData = {
  monthlyRevenue: [
    { month: '2025-01', revenue: 35000 },
    { month: '2025-02', revenue: 38000 },
    { month: '2025-03', revenue: 42000 },
    { month: '2025-04', revenue: 45000 },
  ],
  topServices: [
    { name: 'Revisão Completa', count: 45, revenue: 15000 },
    { name: 'Troca de Óleo', count: 120, revenue: 12000 },
    { name: 'Alinhamento', count: 85, revenue: 8500 },
    { name: 'Freios', count: 65, revenue: 13000 },
  ],
};

const MechanicDashboard = () => {
  const stats = [
    {
      icon: Tool,
      label: 'Serviços em Andamento',
      value: '12',
      trend: '+5%',
      color: 'text-blue-600',
    },
    {
      icon: Clock,
      label: 'Tempo Médio de Serviço',
      value: '2.5h',
      trend: '-10%',
      color: 'text-green-600',
    },
    {
      icon: Users2,
      label: 'Clientes Atendidos',
      value: '128',
      trend: '+8%',
      color: 'text-purple-600',
    },
    {
      icon: Wrench,
      label: 'Taxa de Retorno',
      value: '2.3%',
      trend: '-15%',
      trendDown: true,
      color: 'text-orange-600',
    },
  ];

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard - Mecânica</h1>
          <p className="text-gray-600">Visão geral do seu negócio</p>
        </div>
        <div className="flex gap-4">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            <Calendar size={20} />
            {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <BarChart3 size={20} />
            Relatório Completo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-lg p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg bg-opacity-10 ${stat.color} bg-current`}>
                <stat.icon className={stat.color} size={24} />
              </div>
              <span className={`text-sm font-medium ${
                stat.trendDown ? 'text-red-600' : 'text-green-600'
              }`}>
                {stat.trend}
              </span>
            </div>
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-2xl font-semibold text-gray-800 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">Receita Mensal</h2>
          </div>
          <div className="p-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={mockData.monthlyRevenue}
                  margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickFormatter={(value) => {
                      const [year, month] = value.split('-');
                      const date = new Date(parseInt(year), parseInt(month) - 1);
                      return date.toLocaleDateString('pt-BR', { month: 'short' });
                    }}
                  />
                  <YAxis
                    tickFormatter={(value) =>
                      new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                        notation: 'compact',
                      }).format(value)
                    }
                  />
                  <Tooltip
                    formatter={(value: any) =>
                      new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(value)
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#2563eb"
                    fill="#3b82f6"
                    fillOpacity={0.1}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">Serviços Mais Realizados</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {mockData.topServices.map((service, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">
                        {service.name}
                      </span>
                      <span className="text-sm text-gray-500">
                        {service.count} serviços
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${(service.revenue / mockData.topServices[0].revenue) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(service.revenue)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">Serviços em Andamento</h2>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="pb-3">OS</th>
                    <th className="pb-3">Cliente</th>
                    <th className="pb-3">Serviço</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr className="text-sm">
                    <td className="py-3">#12345</td>
                    <td className="py-3">João Silva</td>
                    <td className="py-3">Revisão Completa</td>
                    <td className="py-3">
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                        Em Andamento
                      </span>
                    </td>
                  </tr>
                  <tr className="text-sm">
                    <td className="py-3">#12344</td>
                    <td className="py-3">Maria Santos</td>
                    <td className="py-3">Troca de Óleo</td>
                    <td className="py-3">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                        Finalizado
                      </span>
                    </td>
                  </tr>
                  <tr className="text-sm">
                    <td className="py-3">#12343</td>
                    <td className="py-3">Pedro Oliveira</td>
                    <td className="py-3">Alinhamento</td>
                    <td className="py-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        Aguardando Peças
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">Alertas de Manutenção</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {[
                { 
                  title: 'Elevador Hidráulico #2',
                  description: 'Manutenção preventiva necessária',
                  priority: 'high'
                },
                { 
                  title: 'Compressor de Ar',
                  description: 'Verificar pressão do sistema',
                  priority: 'medium'
                },
                { 
                  title: 'Scanner Diagnóstico',
                  description: 'Atualização de software disponível',
                  priority: 'low'
                },
              ].map((alert, index) => (
                <div key={index} className="flex items-start gap-4 p-4 rounded-lg bg-gray-50">
                  <div className={`p-2 rounded-full ${
                    alert.priority === 'high' 
                      ? 'bg-red-100 text-red-600'
                      : alert.priority === 'medium'
                      ? 'bg-yellow-100 text-yellow-600'
                      : 'bg-blue-100 text-blue-600'
                  }`}>
                    <AlertTriangle size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">{alert.title}</h3>
                    <p className="text-sm text-gray-500">{alert.description}</p>
                  </div>
                  <button className="px-3 py-1 text-sm text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50">
                    Verificar
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MechanicDashboard;