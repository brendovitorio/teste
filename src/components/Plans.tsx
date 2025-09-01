'use client';
'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Star, Zap, ArrowRight } from 'lucide-react';
import { usePlanStore } from '@/stores/planStore';

const Plans = () => {
  const router = useRouter();
  const { 
    segments, 
    plans, 
    selectedSegment, 
    loading, 
    error, 
    fetchSegments, 
    fetchPlans, 
    selectSegment, 
    selectPlan 
  } = usePlanStore();
  
  const [step, setStep] = useState<'segment' | 'plan'>('segment');

  useEffect(() => {
    fetchSegments();
  }, [fetchSegments]);

  const handleSegmentSelect = useCallback((segment: any) => {
    selectSegment(segment);
    setStep('plan');
  }, [selectSegment]);

  const handlePlanSelect = useCallback((plan: any) => {
    selectPlan(plan);
    router.push('/checkout');
  }, [selectPlan, router]);

  const handleBackToSegments = useCallback(() => {
    setStep('segment');
  }, []);

  const filteredPlans = useMemo(() => {
    return plans.filter(plan => plan.status === 'active');
  }, [plans]);

  if (loading && segments.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-6">
        {step === 'segment' && (
          <>
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Escolha o Segmento do seu Negócio
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Selecione o tipo de empreendimento para ver os planos personalizados para seu negócio.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {segments.map((segment) => (
                <div
                  key={segment.id}
                  onClick={() => handleSegmentSelect(segment)}
                  className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 hover:border-blue-500 transition-all duration-300 hover:shadow-xl cursor-pointer p-8 text-center"
                >
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">{getSegmentIcon(segment.icon)}</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{segment.name}</h3>
                  <p className="text-gray-600 mb-4">{segment.description}</p>
                  <div className="flex items-center justify-center text-blue-600 font-medium">
                    Ver Planos
                    <ArrowRight size={16} className="ml-1" />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {step === 'plan' && selectedSegment && (
          <>
            <div className="text-center mb-8">
              <button
                onClick={handleBackToSegments}
                className="text-blue-600 hover:text-blue-800 mb-4 flex items-center mx-auto"
              >
                ← Voltar aos Segmentos
              </button>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Planos para {selectedSegment.name}
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Escolha o plano ideal para o seu {selectedSegment.name.toLowerCase()}.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {filteredPlans.map((plan, index) => (
                <div
                  key={plan.id}
                  className={`bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl ${
                    index === 1 ? 'border-blue-500 relative scale-105' : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {index === 1 && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <div className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                        <Star size={16} />
                        Mais Popular
                      </div>
                    </div>
                  )}

                  <div className="p-8">
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                      <p className="text-gray-600 mb-4">{plan.description}</p>
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-4xl font-bold text-gray-900">
                          R$ {plan.price.toFixed(2).replace('.', ',')}
                        </span>
                        <span className="text-gray-500">/mês</span>
                      </div>
                      {plan.trial_days > 0 && (
                        <p className="text-sm text-green-600 mt-2">
                          {plan.trial_days} dias grátis
                        </p>
                      )}
                    </div>

                    <div className="space-y-3 mb-8">
                      {plan.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center gap-3">
                          <Check className="text-green-500 flex-shrink-0" size={20} />
                          <span className="text-gray-700">{feature}</span>
                        </div>
                      ))}
                      <div className="flex items-center gap-3">
                        <Check className="text-green-500 flex-shrink-0" size={20} />
                        <span className="text-gray-700">
                          Até {plan.max_users === 999 ? 'ilimitados' : plan.max_users} usuários
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handlePlanSelect(plan)}
                      className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                        index === 1
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                      }`}
                    >
                      {index === 1 ? (
                        <span className="flex items-center justify-center gap-2">
                          <Zap size={20} />
                          Começar Agora
                        </span>
                      ) : (
                        'Selecionar Plano'
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="text-center mt-16">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Precisa de algo personalizado?
            </h3>
            <p className="text-gray-600 mb-6">
              Entre em contato conosco para criar um plano sob medida para seu negócio.
            </p>
            <button className="bg-gray-900 text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors">
              Falar com Especialista
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const getSegmentIcon = (icon: string) => {
  const icons: Record<string, string> = {
    'wrench': '🔧',
    'heart': '❤️',
    'scissors': '✂️',
    'utensils': '🍽️',
    'shirt': '👕',
    'pill': '💊',
    'car': '🚗',
    'shopping-cart': '🛒',
  };
  return icons[icon] || '🏢';
};

export default Plans;