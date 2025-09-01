import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface ReportData {
  totalCompanies: number;
  activeCompanies: number;
  totalEmployees: number;
  activeEmployees: number;
  totalServices: number;
  activeServices: number;
  totalHours: number;
  totalRevenue: number;
  recentTimesheets: {
    id: string;
    date: string;
    hours: number;
    description: string;
    employee_name: string;
    company_name: string;
    service_name: string;
  }[];
  topServices: {
    service_name: string;
    total_hours: number;
    total_revenue: number;
  }[];
  topCompanies: {
    company_name: string;
    total_services: number;
    total_hours: number;
  }[];
}

interface ReportState {
  data: ReportData | null;
  loading: boolean;
  error: string | null;
  fetchReportData: () => Promise<void>;
}

export const useReportStore = create<ReportState>((set) => ({
  data: null,
  loading: false,
  error: null,
  fetchReportData: async () => {
    set({ loading: true, error: null });
    try {
      // Fetch companies statistics
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('id, status');
      if (companiesError) throw companiesError;

      // Fetch employees statistics
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('id, status');
      if (employeesError) throw employeesError;

      // Fetch services statistics
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('id, status');
      if (servicesError) throw servicesError;

      // Fetch timesheets with related data
      const { data: timesheetsData, error: timesheetsError } = await supabase
        .from('timesheets')
        .select(`
          id,
          date,
          hours,
          description,
          service_assignments (
            employees (first_name, last_name),
            companies (name),
            services (name, hourly_rate)
          )
        `)
        .order('date', { ascending: false })
        .limit(10);
      if (timesheetsError) throw timesheetsError;

      // Calculate statistics
      const totalCompanies = companiesData.length;
      const activeCompanies = companiesData.filter(c => c.status === 'active').length;
      const totalEmployees = employeesData.length;
      const activeEmployees = employeesData.filter(e => e.status === 'active').length;
      const totalServices = servicesData.length;
      const activeServices = servicesData.filter(s => s.status === 'active').length;

      // Transform timesheets data
      const recentTimesheets = timesheetsData.map((timesheet: any) => ({
        id: timesheet.id,
        date: timesheet.date,
        hours: timesheet.hours,
        description: timesheet.description,
        employee_name: `${timesheet.service_assignments.employees.first_name} ${timesheet.service_assignments.employees.last_name}`,
        company_name: timesheet.service_assignments.companies.name,
        service_name: timesheet.service_assignments.services.name,
      }));

      // Calculate total hours and revenue
      const totalHours = timesheetsData.reduce((acc: number, curr: any) => acc + curr.hours, 0);
      const totalRevenue = timesheetsData.reduce((acc: number, curr: any) => 
        acc + (curr.hours * curr.service_assignments.services.hourly_rate), 0);

      set({
        data: {
          totalCompanies,
          activeCompanies,
          totalEmployees,
          activeEmployees,
          totalServices,
          activeServices,
          totalHours,
          totalRevenue,
          recentTimesheets,
          topServices: [], // To be implemented with more complex queries
          topCompanies: [], // To be implemented with more complex queries
        },
        loading: false,
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
}));