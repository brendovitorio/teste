/*
  # Exemplo de como fica o banco após compra de plano

  Este arquivo mostra o fluxo completo de dados quando um cliente:
  1. Escolhe um segmento (ex: Oficina Mecânica)
  2. Seleciona um plano (ex: Profissional)
  3. Realiza o pagamento
  4. Recebe acesso ao sistema

  IMPORTANTE: Este é apenas um exemplo para demonstração
*/

-- 1. DADOS INICIAIS (já existem no sistema)

-- Segmento escolhido pelo cliente
SELECT * FROM business_segments WHERE slug = 'oficina';
/*
id: 550e8400-e29b-41d4-a716-446655440001
name: 'Oficina Mecânica'
slug: 'oficina'
description: 'Sistema completo para oficinas mecânicas'
icon: 'wrench'
features: {"dashboard": "mechanic", "modules": ["os", "inventory", "customers", "reports"]}
status: 'active'
*/

-- Plano escolhido pelo cliente
SELECT * FROM subscription_plans WHERE segment_id = '550e8400-e29b-41d4-a716-446655440001' AND slug = 'profissional';
/*
id: 550e8400-e29b-41d4-a716-446655440002
segment_id: 550e8400-e29b-41d4-a716-446655440001
name: 'Profissional'
slug: 'profissional'
description: 'Plano completo para negócios em crescimento'
features: ['Todas funcionalidades básicas', 'Relatórios avançados', 'Integração WhatsApp', 'App mobile', 'Suporte prioritário']
price: 199.90
billing_period: 'monthly'
trial_days: 14
max_users: 10
max_storage_gb: 50
status: 'active'
*/

-- 2. APÓS O CLIENTE PREENCHER O CHECKOUT E PAGAR

-- A) Criação da assinatura
INSERT INTO user_subscriptions (
  user_id,
  plan_id,
  status,
  payment_method,
  payment_id,
  starts_at,
  expires_at,
  trial_ends_at,
  auto_renew
) VALUES (
  '550e8400-e29b-41d4-a716-446655440003', -- ID do usuário logado
  '550e8400-e29b-41d4-a716-446655440002', -- ID do plano escolhido
  'trial',                                  -- Status inicial (trial por 14 dias)
  'credit_card',                           -- Método de pagamento
  'pi_1234567890',                         -- ID do pagamento (Stripe/MP)
  '2025-01-15 10:00:00',                   -- Data de início
  '2025-02-15 10:00:00',                   -- Data de expiração (1 mês)
  '2025-01-29 10:00:00',                   -- Fim do trial (14 dias)
  true                                     -- Renovação automática
);

-- B) Criação do tenant (negócio do cliente)
INSERT INTO business_tenants (
  subscription_id,
  owner_id,
  business_name,
  business_slug,
  segment_id,
  subdomain,
  custom_domain,
  domain_verified,
  logo_url,
  brand_colors,
  settings,
  status
) VALUES (
  '550e8400-e29b-41d4-a716-446655440004', -- ID da assinatura criada acima
  '550e8400-e29b-41d4-a716-446655440003', -- ID do usuário (owner)
  'Oficina do João',                        -- Nome do negócio
  'oficina-do-joao',                       -- Slug único
  '550e8400-e29b-41d4-a716-446655440001', -- ID do segmento (oficina)
  'oficina-do-joao',                       -- Subdomínio (oficina-do-joao.sistemax.com)
  'painel.oficinadojoao.com.br',          -- Domínio personalizado (opcional)
  false,                                   -- Domínio ainda não verificado
  null,                                    -- Logo será enviado depois
  '{"primary": "#3B82F6", "secondary": "#10B981", "accent": "#F59E0B"}', -- Cores padrão
  '{"timezone": "America/Sao_Paulo", "language": "pt-BR", "notifications": {"email": true}}', -- Configurações
  'active'                                 -- Status ativo
);

-- C) Criação do usuário owner no tenant
INSERT INTO tenant_users (
  tenant_id,
  user_id,
  role,
  permissions,
  status,
  invited_by,
  invited_at,
  joined_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440005', -- ID do tenant criado acima
  '550e8400-e29b-41d4-a716-446655440003', -- ID do usuário
  'owner',                                  -- Role de proprietário
  '{"all": true}',                         -- Todas as permissões
  'active',                                -- Status ativo
  null,                                    -- Não foi convidado (é o owner)
  null,                                    -- Não foi convidado
  '2025-01-15 10:00:00'                   -- Data de entrada (agora)
);

-- D) Log do webhook de pagamento
INSERT INTO payment_webhooks (
  subscription_id,
  provider,
  event_type,
  payment_id,
  status,
  amount,
  currency,
  metadata,
  processed,
  processed_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440004', -- ID da assinatura
  'stripe',                                 -- Provedor de pagamento
  'payment_intent.succeeded',              -- Tipo do evento
  'pi_1234567890',                         -- ID do pagamento
  'succeeded',                             -- Status do pagamento
  199.90,                                  -- Valor pago
  'BRL',                                   -- Moeda
  '{"customer_email": "joao@oficina.com", "plan": "profissional"}', -- Metadados
  true,                                    -- Processado
  '2025-01-15 10:05:00'                   -- Data de processamento
);

-- E) Log de atividade inicial
INSERT INTO activity_logs (
  tenant_id,
  user_id,
  action,
  resource_type,
  resource_id,
  details,
  ip_address,
  user_agent
) VALUES (
  '550e8400-e29b-41d4-a716-446655440005', -- ID do tenant
  '550e8400-e29b-41d4-a716-446655440003', -- ID do usuário
  'tenant_created',                        -- Ação realizada
  'business_tenant',                       -- Tipo do recurso
  '550e8400-e29b-41d4-a716-446655440005', -- ID do recurso
  '{"business_name": "Oficina do João", "plan": "profissional", "segment": "oficina"}', -- Detalhes
  '192.168.1.100',                        -- IP do cliente
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' -- User agent
);

-- 3. RESULTADO FINAL - COMO FICA O BANCO

-- Consulta para ver todos os dados do cliente após a compra:
SELECT 
  bt.business_name,
  bt.subdomain || '.sistemax.com' as access_url,
  bt.custom_domain,
  bs.name as segment_name,
  sp.name as plan_name,
  sp.price,
  us.status as subscription_status,
  us.trial_ends_at,
  us.expires_at,
  tu.role as user_role
FROM business_tenants bt
JOIN business_segments bs ON bt.segment_id = bs.id
JOIN user_subscriptions us ON bt.subscription_id = us.id
JOIN subscription_plans sp ON us.plan_id = sp.id
JOIN tenant_users tu ON bt.id = tu.tenant_id
WHERE bt.owner_id = '550e8400-e29b-41d4-a716-446655440003';

/*
RESULTADO:
business_name: 'Oficina do João'
access_url: 'oficina-do-joao.sistemax.com'
custom_domain: 'painel.oficinादojoao.com.br'
segment_name: 'Oficina Mecânica'
plan_name: 'Profissional'
price: 199.90
subscription_status: 'trial'
trial_ends_at: '2025-01-29 10:00:00'
expires_at: '2025-02-15 10:00:00'
user_role: 'owner'
*/