/*
  # Multi-Tenant System with Domain-Based Access

  1. New Tables
    - `business_segments` - Available business segments
    - `subscription_plans` - Plans available for each segment
    - `user_subscriptions` - User subscription records
    - `business_tenants` - Tenant information with domain mapping
    - `tenant_users` - Users with access to specific tenants
    - `tenant_permissions` - Role-based permissions
    - `payment_webhooks` - Payment confirmation logs
    - `activity_logs` - User activity tracking

  2. Security
    - Enable RLS on all tables
    - Multi-tenant isolation by tenant_id
    - Domain-based access control
*/

-- Business Segments
CREATE TABLE IF NOT EXISTS business_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  icon text,
  features jsonb DEFAULT '{}',
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive'))
);

ALTER TABLE business_segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business segments are viewable by everyone"
  ON business_segments
  FOR SELECT
  TO authenticated
  USING (status = 'active');

-- Subscription Plans
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  segment_id uuid REFERENCES business_segments(id) NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  features text[] DEFAULT '{}',
  price decimal(10,2) NOT NULL,
  billing_period text DEFAULT 'monthly' CHECK (billing_period IN ('monthly', 'yearly')),
  trial_days integer DEFAULT 0,
  max_users integer DEFAULT 1,
  max_storage_gb integer DEFAULT 1,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  UNIQUE(segment_id, slug)
);

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Plans are viewable by everyone"
  ON subscription_plans
  FOR SELECT
  TO authenticated
  USING (status = 'active');

-- User Subscriptions
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  plan_id uuid REFERENCES subscription_plans(id) NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'cancelled', 'expired', 'trial')),
  payment_method text,
  payment_id text,
  starts_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  trial_ends_at timestamptz,
  auto_renew boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'
);

ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscriptions"
  ON user_subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions"
  ON user_subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions"
  ON user_subscriptions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Business Tenants
CREATE TABLE IF NOT EXISTS business_tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  subscription_id uuid REFERENCES user_subscriptions(id) NOT NULL,
  owner_id uuid REFERENCES auth.users(id) NOT NULL,
  business_name text NOT NULL,
  business_slug text UNIQUE NOT NULL,
  segment_id uuid REFERENCES business_segments(id) NOT NULL,
  subdomain text UNIQUE NOT NULL,
  custom_domain text UNIQUE,
  domain_verified boolean DEFAULT false,
  logo_url text,
  brand_colors jsonb DEFAULT '{}',
  settings jsonb DEFAULT '{}',
  status text DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled'))
);

ALTER TABLE business_tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant owners can view their tenants"
  ON business_tenants
  FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Tenant owners can insert their tenants"
  ON business_tenants
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Tenant owners can update their tenants"
  ON business_tenants
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id);

-- Tenant Users (Multi-user access per tenant)
CREATE TABLE IF NOT EXISTS tenant_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  tenant_id uuid REFERENCES business_tenants(id) NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  role text DEFAULT 'employee' CHECK (role IN ('owner', 'admin', 'manager', 'employee')),
  permissions jsonb DEFAULT '{}',
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  invited_by uuid REFERENCES auth.users(id),
  invited_at timestamptz,
  joined_at timestamptz,
  UNIQUE(tenant_id, user_id)
);

ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tenant users for their tenants"
  ON tenant_users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_tenants bt 
      WHERE bt.id = tenant_id AND bt.owner_id = auth.uid()
    ) OR user_id = auth.uid()
  );

CREATE POLICY "Tenant owners can manage tenant users"
  ON tenant_users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_tenants bt 
      WHERE bt.id = tenant_id AND bt.owner_id = auth.uid()
    )
  );

-- Payment Webhooks
CREATE TABLE IF NOT EXISTS payment_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  subscription_id uuid REFERENCES user_subscriptions(id),
  provider text NOT NULL,
  event_type text NOT NULL,
  payment_id text NOT NULL,
  status text NOT NULL,
  amount decimal(10,2),
  currency text DEFAULT 'BRL',
  metadata jsonb DEFAULT '{}',
  processed boolean DEFAULT false,
  processed_at timestamptz
);

ALTER TABLE payment_webhooks ENABLE ROW LEVEL SECURITY;

-- Activity Logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  tenant_id uuid REFERENCES business_tenants(id) NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  action text NOT NULL,
  resource_type text,
  resource_id text,
  details jsonb DEFAULT '{}',
  ip_address inet,
  user_agent text
);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view activity logs for their tenants"
  ON activity_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_tenants bt 
      WHERE bt.id = tenant_id AND bt.owner_id = auth.uid()
    ) OR 
    EXISTS (
      SELECT 1 FROM tenant_users tu 
      WHERE tu.tenant_id = activity_logs.tenant_id AND tu.user_id = auth.uid() AND tu.status = 'active'
    )
  );

-- Insert sample business segments
INSERT INTO business_segments (name, slug, description, icon, features) VALUES
('Oficina Mecânica', 'oficina', 'Sistema completo para oficinas mecânicas', 'wrench', '{"dashboard": "mechanic", "modules": ["os", "inventory", "customers", "reports"]}'),
('Pet Shop', 'petshop', 'Gestão completa para pet shops', 'heart', '{"dashboard": "petshop", "modules": ["pets", "services", "products", "appointments"]}'),
('Salão de Beleza', 'salao', 'Sistema para salões de beleza e estética', 'scissors', '{"dashboard": "salon", "modules": ["appointments", "services", "products", "customers"]}'),
('Restaurante', 'restaurante', 'Gestão completa para restaurantes', 'utensils', '{"dashboard": "restaurant", "modules": ["menu", "orders", "delivery", "tables"]}'),
('Loja de Roupas', 'roupas', 'Sistema para lojas de roupas e moda', 'shirt', '{"dashboard": "clothing", "modules": ["products", "inventory", "sales", "customers"]}'),
('Farmácia', 'farmacia', 'Sistema para farmácias e drogarias', 'pill', '{"dashboard": "pharmacy", "modules": ["medicines", "prescriptions", "inventory", "sales"]}'),
('Auto Peças', 'autopecas', 'Gestão para lojas de auto peças', 'car', '{"dashboard": "autoparts", "modules": ["products", "inventory", "sales", "compatibility"]}'),
('Supermercado', 'supermercado', 'Sistema para supermercados e mercearias', 'shopping-cart', '{"dashboard": "supermarket", "modules": ["products", "inventory", "pos", "suppliers"]}');

-- Insert sample plans for each segment
INSERT INTO subscription_plans (segment_id, name, slug, description, features, price, trial_days, max_users) 
SELECT 
  bs.id,
  'Básico',
  'basico',
  'Plano básico com funcionalidades essenciais',
  ARRAY['Dashboard', 'Cadastros básicos', 'Relatórios simples', 'Suporte por email'],
  99.90,
  7,
  3
FROM business_segments bs;

INSERT INTO subscription_plans (segment_id, name, slug, description, features, price, trial_days, max_users) 
SELECT 
  bs.id,
  'Profissional',
  'profissional',
  'Plano completo para negócios em crescimento',
  ARRAY['Todas funcionalidades básicas', 'Relatórios avançados', 'Integração WhatsApp', 'App mobile', 'Suporte prioritário'],
  199.90,
  14,
  10
FROM business_segments bs;

INSERT INTO subscription_plans (segment_id, name, slug, description, features, price, trial_days, max_users) 
SELECT 
  bs.id,
  'Avançado',
  'avancado',
  'Plano premium com recursos ilimitados',
  ARRAY['Todas funcionalidades', 'Usuários ilimitados', 'Domínio próprio', 'API personalizada', 'Suporte 24/7', 'Consultoria'],
  399.90,
  30,
  999
FROM business_segments bs;