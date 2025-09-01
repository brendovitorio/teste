'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Building2, LayoutDashboard, Users2, ClipboardList, BarChart3, Settings, LogOut } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useTenantStore } from '../stores/tenantStore';

const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuthStore();
  const { currentTenant } = useTenantStore();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Users2, label: 'Funcionários', path: '/funcionarios' },
    { icon: BarChart3, label: 'Relatórios', path: '/relatorios' },
    { icon: Settings, label: 'Configurações', path: '/configuracoes' },
  ];

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth/login');
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 p-4 flex flex-col">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-blue-600">
          {currentTenant?.business_name || 'SistemaX'}
        </h1>
        {currentTenant && (
          <p className="text-sm text-gray-500">
            {process.env.NODE_ENV === 'development' 
              ? 'Desenvolvimento Local' 
              : `${currentTenant.subdomain}.sistemax.com`
            }
          </p>
        )}
      </div>
      
      <nav className="flex-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <button
        onClick={handleSignOut}
        className="flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors mt-auto"
      >
        <LogOut size={20} />
        <span>Sair</span>
      </button>
    </div>
  );
};

export default Sidebar;