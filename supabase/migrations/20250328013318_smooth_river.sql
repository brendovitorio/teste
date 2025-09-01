/*
  # Initial Schema Setup for Business Management System

  1. New Tables
    - `companies`
      - Company information including name, segment, contact details
    - `services`
      - Services offered to companies
    - `employees`
      - Employee records with personal and professional information
    - `service_assignments`
      - Links employees to services and companies
    - `timesheets`
      - Records hours worked by employees on services

  2. Security
    - Enable RLS on all tables
    - Policies for authenticated users to manage their data
*/

-- Companies Table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  name text NOT NULL,
  segment text NOT NULL,
  employees_count integer DEFAULT 0,
  contact_phone text,
  contact_email text,
  address text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  user_id uuid REFERENCES auth.users(id)
);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own companies"
  ON companies
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own companies"
  ON companies
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own companies"
  ON companies
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Services Table
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  name text NOT NULL,
  description text,
  hourly_rate decimal(10,2) NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  user_id uuid REFERENCES auth.users(id)
);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own services"
  ON services
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own services"
  ON services
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own services"
  ON services
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Employees Table
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  position text NOT NULL,
  hire_date date NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  user_id uuid REFERENCES auth.users(id)
);

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own employees"
  ON employees
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own employees"
  ON employees
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own employees"
  ON employees
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Service Assignments Table
CREATE TABLE IF NOT EXISTS service_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  service_id uuid REFERENCES services(id) NOT NULL,
  company_id uuid REFERENCES companies(id) NOT NULL,
  employee_id uuid REFERENCES employees(id) NOT NULL,
  start_date date NOT NULL,
  end_date date,
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  user_id uuid REFERENCES auth.users(id)
);

ALTER TABLE service_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own service assignments"
  ON service_assignments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own service assignments"
  ON service_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own service assignments"
  ON service_assignments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Timesheets Table
CREATE TABLE IF NOT EXISTS timesheets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  assignment_id uuid REFERENCES service_assignments(id) NOT NULL,
  date date NOT NULL,
  hours decimal(5,2) NOT NULL CHECK (hours > 0),
  description text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  user_id uuid REFERENCES auth.users(id)
);

ALTER TABLE timesheets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own timesheets"
  ON timesheets
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own timesheets"
  ON timesheets
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own timesheets"
  ON timesheets
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);