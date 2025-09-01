'use client';
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CreditCard, Shield, Check, AlertCircle } from 'lucide-react';
import { usePlanStore } from '@/stores/planStore';
import { useTenantStore } from '@/stores/tenantStore';

const Checkout = () => {
  const router = useRouter();
  const { selectedPlan, selectedSegment, createSubscription, loading } = usePlanStore();
  const { createTenant, checkDomainAvailability } = useTenantStore();
  
  const [step, setStep] = useState(1);
  const [domainAvailable, setDomainAvailable] = useState<boolean | null>(null);
  const [formData, setFormData] = useState({
    // Business Info
    businessName: '',
    subdomain: '',
    
    // Payment Info
    paymentMethod: 'credit_card',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: '',
    
    // Billing Info
    email: '',
    phone: '',
    document: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
  });

  useEffect(() => {
    if (!selectedPlan || !selectedSegment) {
      router.push('/planos');
      return;
    }
  }, [selectedPlan, selectedSegment, router]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Check domain availability when subdomain changes
    if (name === 'subdomain' && value.length > 2) {
      checkDomainAvailability(value).then(setDomainAvailable);
    }
  }, [checkDomainAvailability]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan || !selectedSegment) return;

    try {
      // Simulate payment processing
      const paymentData = {
        method: formData.paymentMethod,
        id: `payment_${Date.now()}`,
        amount: selectedPlan.price,
      };

      // Create subscription
      await createSubscription(selectedPlan.id, paymentData);

      // Create tenant
      await createTenant({
        business_name: formData.businessName,
        segment_id: selectedSegment.id,
        subscription_id: '', // This would be set after subscription creation
        settings: {
          contact_email: formData.email,
          contact_phone: formData.phone,
        },
      });

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Payment error:', error);
    }
  }, [selectedPlan, selectedSegment, createSubscription, createTenant, formData, router]);

  const orderSummary = useMemo(() => {
    if (!selectedPlan || !selectedSegment) return null;
    
    return {
      segment: selectedSegment.name,
      plan: selectedPlan.name,
      price: selectedPlan.price,
      trial: selectedPlan.trial_days,
      features: selectedPlan.features
    };
  }, [selectedPlan, selectedSegment]);

  if (!selectedPlan || !selectedSegment) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push('/planos')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft size={20} />
            Voltar aos Planos
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Resumo do Pedido
              </h3>
              
              {orderSummary && (
                <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Segmento</span>
                    <span className="font-medium">{orderSummary.segment}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Plano</span>
                    <span className="font-medium">{orderSummary.plan}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Período</span>
                  <span className="font-medium">Mensal</span>
                </div>

                  {orderSummary.trial > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Teste Grátis</span>
                      <span>{orderSummary.trial} dias</span>
                  </div>
                )}
                
                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                      <span>R$ {orderSummary.price.toFixed(2).replace('.', ',')}/mês</span>
                  </div>
                </div>
                </div>
              )}

              <div className="mt-6 space-y-2">
                <h4 className="font-medium text-gray-900">Recursos Inclusos:</h4>
                {orderSummary?.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                    <Check size={16} className="text-green-500" />
                    {feature}
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-center gap-2 text-sm text-gray-500">
                <Shield size={16} />
                Pagamento 100% seguro
              </div>
            </div>
          </div>

          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border">
              {/* Steps */}
              <div className="border-b p-6">
                <div className="flex items-center justify-between">
                  <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'
                    }`}>
                      1
                    </div>
                    <span>Informações do Negócio</span>
                  </div>
                  
                  <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'
                    }`}>
                      2
                    </div>
                    <span>Pagamento</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                {step === 1 && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Informações do seu {selectedSegment.name}
                    </h3>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nome do Negócio
                        </label>
                        <input
                          type="text"
                          name="businessName"
                          value={formData.businessName}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Subdomínio
                        </label>
                        <div className="flex">
                          <input
                            type="text"
                            name="subdomain"
                            value={formData.subdomain}
                            onChange={handleInputChange}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="meudominio"
                            required
                          />
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          Em desenvolvimento: acesso via /dashboard
                        </p>
                        {domainAvailable === false && (
                          <div className="flex items-center gap-1 text-red-600 text-sm mt-1">
                            <AlertCircle size={14} />
                            Nome não disponível
                          </div>
                        )}
                        {domainAvailable === true && (
                          <div className="flex items-center gap-1 text-green-600 text-sm mt-1">
                            <Check size={14} />
                            Nome disponível
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Telefone
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      disabled={!domainAvailable}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Continuar para Pagamento
                    </button>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <CreditCard size={20} />
                      Informações de Pagamento
                    </h3>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Método de Pagamento
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="credit_card"
                            checked={formData.paymentMethod === 'credit_card'}
                            onChange={handleInputChange}
                            className="mr-2"
                          />
                          <CreditCard size={20} className="mr-2" />
                          Cartão de Crédito
                        </label>
                        <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="pix"
                            checked={formData.paymentMethod === 'pix'}
                            onChange={handleInputChange}
                            className="mr-2"
                          />
                          <span className="mr-2">📱</span>
                          PIX
                        </label>
                      </div>
                    </div>
                    
                    {formData.paymentMethod === 'credit_card' && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Número do Cartão
                          </label>
                          <input
                            type="text"
                            name="cardNumber"
                            value={formData.cardNumber}
                            onChange={handleInputChange}
                            placeholder="1234 5678 9012 3456"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          />
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                          <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Validade
                            </label>
                            <input
                              type="text"
                              name="expiryDate"
                              value={formData.expiryDate}
                              onChange={handleInputChange}
                              placeholder="MM/AA"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              CVV
                            </label>
                            <input
                              type="text"
                              name="cvv"
                              value={formData.cvv}
                              onChange={handleInputChange}
                              placeholder="123"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              required
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nome no Cartão
                          </label>
                          <input
                            type="text"
                            name="cardName"
                            value={formData.cardName}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          />
                        </div>
                      </div>
                    )}

                    {formData.paymentMethod === 'pix' && (
                      <div className="text-center p-6 bg-blue-50 rounded-lg">
                        <p className="text-gray-700 mb-2">
                          Após confirmar, você receberá o código PIX para pagamento.
                        </p>
                        <p className="text-sm text-gray-500">
                          O acesso será liberado automaticamente após a confirmação do pagamento.
                        </p>
                      </div>
                    )}

                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Voltar
                      </button>
                      
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {loading ? 'Processando...' : 'Finalizar Pagamento'}
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;