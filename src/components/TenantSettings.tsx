'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Globe, Palette, Upload, Save, Check, AlertCircle } from 'lucide-react';
import { useTenantStore } from '@/stores/tenantStore';
import { usePlanStore } from '@/stores/planStore';

const TenantSettings = () => {
  const { 
    currentTenant, 
    userRole,
    loading, 
    error, 
    updateTenant,
    checkDomainAvailability,
    verifyCustomDomain
  } = useTenantStore();
  
  const { currentSubscription } = usePlanStore();

  const [settings, setSettings] = useState({
    business_name: '',
    custom_domain: '',
    logo_url: '',
    brand_colors: {
      primary: '#3B82F6',
      secondary: '#10B981',
      accent: '#F59E0B'
    },
    settings: {
      timezone: 'America/Sao_Paulo',
      language: 'pt-BR',
      notifications: {
        email: true,
        sms: false,
        push: true
      }
    }
  });

  const [domainStatus, setDomainStatus] = useState<'checking' | 'available' | 'unavailable' | 'verified' | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentTenant) {
      setSettings({
        business_name: currentTenant.business_name,
        custom_domain: currentTenant.custom_domain || '',
        logo_url: currentTenant.logo_url || '',
        brand_colors: (currentTenant.brand_colors as { primary: string; secondary: string; accent: string; }) || {
          primary: '#3B82F6',
          secondary: '#10B981',
          accent: '#F59E0B'
        },
        settings: (currentTenant.settings as { timezone: string; language: string; notifications: { email: boolean; sms: boolean; push: boolean; }; }) || {
          timezone: 'America/Sao_Paulo',
          language: 'pt-BR',
          notifications: {
            email: true,
            sms: false,
            push: true
          }
        }
      });
    }
  }, [currentTenant]);

  const handleInputChange = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedChange = (parent: string, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [parent]: {
        ...(prev[parent as keyof typeof prev] as any),
        [field]: value
      }
    }));
  };

  const handleDomainCheck = async (domain: string) => {
    if (!domain) return;
    
    setDomainStatus('checking');
    try {
      const available = await checkDomainAvailability(domain);
      setDomainStatus(available ? 'available' : 'unavailable');
    } catch {
      setDomainStatus('unavailable');
    }
  };

  const handleDomainVerify = async () => {
    if (!settings.custom_domain) return;
    
    setDomainStatus('checking');
    try {
      const verified = await verifyCustomDomain(settings.custom_domain);
      setDomainStatus(verified ? 'verified' : 'unavailable');
    } catch {
      setDomainStatus('unavailable');
    }
  };

  const handleSave = async () => {
    if (!currentTenant) return;
    
    setSaving(true);
    try {
      await updateTenant(currentTenant.id, {
        business_name: settings.business_name,
        custom_domain: settings.custom_domain || undefined,
        logo_url: settings.logo_url || undefined,
        brand_colors: settings.brand_colors,
        settings: settings.settings
      });
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const canEditSettings = userRole === 'owner' || userRole === 'admin';
  const canUseCustomDomain = currentSubscription?.plan?.slug === 'avancado';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentTenant) {
    return (
      <div className="p-8">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
          Nenhum negócio encontrado.
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Configurações</h1>
          <p className="text-gray-600">Personalize seu negócio e sistema</p>
        </div>
        {canEditSettings && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Save size={20} />
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Business Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Settings size={20} />
            Informações do Negócio
          </h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Negócio
              </label>
              <input
                type="text"
                value={settings.business_name}
                onChange={(e) => handleInputChange('business_name', e.target.value)}
                disabled={!canEditSettings}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subdomínio Atual
              </label>
              <div className="flex">
                <span className="px-3 py-2 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-sm text-gray-600">
                  {currentTenant.subdomain}
                </span>
                <span className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-r-lg text-sm text-gray-600">
                  .sistemax.com
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Domain Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Globe size={20} />
            Domínio Personalizado
          </h2>
          
          {!canUseCustomDomain && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg mb-4">
              <p className="text-sm">
                {process.env.NODE_ENV === 'development' 
                  ? 'Domínio personalizado funciona apenas em produção (plano Avançado).'
                  : 'Domínio personalizado disponível apenas no plano Avançado.'
                } 
                <a href="/planos" className="underline ml-1">Fazer upgrade</a>
              </p>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Domínio Personalizado
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={settings.custom_domain}
                  onChange={(e) => {
                    handleInputChange('custom_domain', e.target.value);
                    if (e.target.value) {
                      handleDomainCheck(e.target.value);
                    }
                  }}
                  placeholder="painel.meudominio.com.br"
                  disabled={!canEditSettings || !canUseCustomDomain}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                />
                {settings.custom_domain && canUseCustomDomain && (
                  <button
                    onClick={handleDomainVerify}
                    disabled={domainStatus === 'checking'}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {domainStatus === 'checking' ? 'Verificando...' : 'Verificar'}
                  </button>
                )}
              </div>
              
              {domainStatus && (
                <div className={`flex items-center gap-2 mt-2 text-sm ${
                  domainStatus === 'verified' || domainStatus === 'available' 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {domainStatus === 'verified' || domainStatus === 'available' ? (
                    <Check size={16} />
                  ) : (
                    <AlertCircle size={16} />
                  )}
                  {domainStatus === 'verified' && 'Domínio verificado e ativo'}
                  {domainStatus === 'available' && 'Domínio disponível'}
                  {domainStatus === 'unavailable' && 'Domínio não disponível ou não configurado'}
                </div>
              )}
            </div>
            
            {canUseCustomDomain && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
                <p className="text-sm font-medium mb-1">Configuração DNS:</p>
                <p className="text-sm">
                  Adicione um registro CNAME apontando para: <code className="bg-white px-1 rounded">{currentTenant.subdomain}.sistemax.com</code>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Brand Customization */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Palette size={20} />
            Personalização Visual
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logo
              </label>
              <div className="flex items-center gap-4">
                {settings.logo_url && (
                  <img 
                    src={settings.logo_url} 
                    alt="Logo" 
                    className="w-12 h-12 object-contain rounded border"
                  />
                )}
                <button
                  disabled={!canEditSettings}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  <Upload size={16} />
                  Fazer Upload
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cores da Marca
              </label>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={settings.brand_colors.primary}
                    onChange={(e) => handleNestedChange('brand_colors', 'primary', e.target.value)}
                    disabled={!canEditSettings}
                    className="w-8 h-8 rounded border disabled:opacity-50"
                  />
                  <span className="text-sm text-gray-600">Cor Primária</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={settings.brand_colors.secondary}
                    onChange={(e) => handleNestedChange('brand_colors', 'secondary', e.target.value)}
                    disabled={!canEditSettings}
                    className="w-8 h-8 rounded border disabled:opacity-50"
                  />
                  <span className="text-sm text-gray-600">Cor Secundária</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={settings.brand_colors.accent}
                    onChange={(e) => handleNestedChange('brand_colors', 'accent', e.target.value)}
                    disabled={!canEditSettings}
                    className="w-8 h-8 rounded border disabled:opacity-50"
                  />
                  <span className="text-sm text-gray-600">Cor de Destaque</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* System Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Configurações do Sistema
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fuso Horário
              </label>
              <select
                value={settings.settings.timezone}
                onChange={(e) => handleNestedChange('settings', 'timezone', e.target.value)}
                disabled={!canEditSettings}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
              >
                <option value="America/Sao_Paulo">São Paulo (GMT-3)</option>
                <option value="America/Manaus">Manaus (GMT-4)</option>
                <option value="America/Rio_Branco">Rio Branco (GMT-5)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Idioma
              </label>
              <select
                value={settings.settings.language}
                onChange={(e) => handleNestedChange('settings', 'language', e.target.value)}
                disabled={!canEditSettings}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
              >
                <option value="pt-BR">Português (Brasil)</option>
                <option value="en-US">English (US)</option>
                <option value="es-ES">Español</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantSettings;