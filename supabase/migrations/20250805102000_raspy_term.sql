/*
  # Payment System Schema

  1. New Tables
    - `plans`
      - Available subscription plans with business types
    - `user_subscriptions`
      - User subscription records with payment status
    - `business_domains`
      - Custom domains for businesses
    - `domain_users`
      - Users associated with specific domains

  2. Security
    - Enable RLS on all tables
    - Policies for subscription and domain access
*/

-- Plans Table
CREATE TABLE IF NOT EXISTS plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  name text NOT NULL,
  business_type text NOT NULL CHECK (business_type IN ('mechanic', 'auto_parts', 'supermarket', 'clothing', 'food', 'restaurant', 'pharmacy', 'construction')),
  description text,
  features text[] DEFAULT '{}',
  price decimal(10,2) NOT NULL,
  billing_period text DEFAULT 'monthly' CHECK (billing_period IN ('monthly', 'yearly')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive'))
);

ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Plans are viewable by everyone"
  ON plans
  FOR SELECT
  TO authenticated
  USING (status = 'active');

-- User Subscriptions Table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  plan_id uuid REFERENCES plans(id) NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'cancelled', 'expired')),
  payment_method text,
  payment_id text,
  starts_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  auto_renew boolean DEFAULT true
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

-- Business Domains Table
CREATE TABLE IF NOT EXISTS business_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  subscription_id uuid REFERENCES user_subscriptions(id) NOT NULL,
  domain text UNIQUE NOT NULL,
  business_name text NOT NULL,
  business_type text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended')),
  ssl_enabled boolean DEFAULT false,
  custom_logo text,
  custom_colors jsonb DEFAULT '{}'
);

ALTER TABLE business_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own domains"
  ON business_domains
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own domains"
  ON business_domains
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own domains"
  ON business_domains
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Domain Users Table (for multi-user access per domain)
CREATE TABLE IF NOT EXISTS domain_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  domain_id uuid REFERENCES business_domains(id) NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  role text DEFAULT 'employee' CHECK (role IN ('owner', 'admin', 'employee')),
  permissions jsonb DEFAULT '{}',
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  invited_by uuid REFERENCES auth.users(id),
  UNIQUE(domain_id, user_id)
);

ALTER TABLE domain_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view domain users for their domains"
  ON domain_users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_domains bd 
      WHERE bd.id = domain_id AND bd.user_id = auth.uid()
    ) OR user_id = auth.uid()
  );

-- Insert sample plans
INSERT INTO plans (name, business_type, description, features, price, billing_period) VALUES
('Oficina Básica', 'mechanic', 'Plano básico para oficinas mecânicas', ARRAY['Gestão de OS', 'Controle de Estoque', 'Relatórios Básicos'], 99.90, 'monthly'),
('Oficina Pro', 'mechanic', 'Plano completo para oficinas mecânicas', ARRAY['Gestão de OS', 'Controle de Estoque', 'Relatórios Avançados', 'App Mobile', 'Integração WhatsApp'], 199.90, 'monthly'),
('Auto Peças Básico', 'auto_parts', 'Plano básico para lojas de auto peças', ARRAY['Gestão de Produtos', 'Controle de Estoque', 'Vendas'], 89.90, 'monthly'),
('Auto Peças Pro', 'auto_parts', 'Plano completo para lojas de auto peças', ARRAY['Gestão de Produtos', 'Controle de Estoque', 'Vendas', 'E-commerce', 'Relatórios Avançados'], 179.90, 'monthly'),
('Supermercado', 'supermarket', 'Sistema completo para supermercados', ARRAY['PDV', 'Gestão de Produtos', 'Controle de Estoque', 'Relatórios'], 299.90, 'monthly'),
('Loja de Roupas', 'clothing', 'Sistema para lojas de roupas', ARRAY['Gestão de Produtos', 'Controle de Estoque', 'Vendas', 'Grades de Tamanho'], 149.90, 'monthly'),
('Restaurante', 'restaurant', 'Sistema para restaurantes', ARRAY['Cardápio Digital', 'Pedidos Online', 'Gestão de Mesas', 'Delivery'], 199.90, 'monthly'),
('Farmácia', 'pharmacy', 'Sistema para farmácias', ARRAY['Controle de Medicamentos', 'Receitas', 'Estoque', 'Relatórios'], 179.90, 'monthly');