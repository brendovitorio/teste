'use client';

import React, { useEffect } from 'react';
import { BarChart3, TrendingUp, Users2, Building2, Clock, DollarSign } from 'lucide-react';
import { useReportStore } from '@/stores/reportStore';

const Reports = () => {
  const { data, loading, error, fetchReportData } = useReportStore();

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const stats = [
    {
      icon: Building2,
      label: 'Empresas Ativas',
      value: data.activeCompanies,
      total: data.totalCompanies,
    },
    {
      icon: Users2,
      label: 'Funcionários Ativos',
      value: data.activeEmployees,
      total: data.totalEmployees,
    },
    {
      icon: TrendingUp,
      label: 'Serviços Ativos',
      value: data.activeServices,
      total: data.totalServices,
    },
    {
      icon: Clock,
      label: 'Total de Horas',
      value: data.totalHours.toFixed(1),
    },
    {
      icon: DollarSign,
      label: 'Receita Total',
      value: new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(data.totalRevenue),
    },
  ];

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Relatórios</h1>
          <p className="text-gray-600">Visão geral e métricas do sistema</p>
        </div>
        <button
          onClick={() => fetchReportData()}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <BarChart3 size={20} />
          Atualizar Dados
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-lg p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <stat.icon className="text-blue-500" size={24} />
              <span className="text-xs font-medium text-gray-500">
                {stat.total ? `${stat.value} / ${stat.total}` : ''}
              </span>
            </div>
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-2xl font-semibold text-gray-800 mt-1">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Registros Recentes
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-2">Data</th>
                  <th className="px-4 py-2">Funcionário</th>
                  <th className="px-4 py-2">Empresa</th>
                  <th className="px-4 py-2">Serviço</th>
                  <th className="px-4 py-2">Horas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.recentTimesheets.map((timesheet) => (
                  <tr key={timesheet.id} className="text-sm">
                    <td className="px-4 py-2 whitespace-nowrap">
                      {new Date(timesheet.date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {timesheet.employee_name}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {timesheet.company_name}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {timesheet.service_name}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {timesheet.hours}h
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Distribuição de Horas por Serviço
          </h2>
          <div className="space-y-4">
            {data.topServices.map((service, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      {service.service_name}
                    </span>
                    <span className="text-sm text-gray-500">
                      {service.total_hours}h
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${(service.total_hours / data.totalHours) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;