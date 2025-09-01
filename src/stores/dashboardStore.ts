import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

interface MonthlyRevenue {
  month: string;
  revenue: number;
  percentageChange: number;
}

interface DashboardState {
  monthlyRevenue: MonthlyRevenue[];
  totalRevenue: number;
  loading: boolean;
  error: string | null;
  fetchMonthlyRevenue: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  monthlyRevenue: [],
  totalRevenue: 0,
  loading: false,
  error: null,
  fetchMonthlyRevenue: async () => {
    set({ loading: true, error: null });
    try {
      const { data: timesheets, error } = await supabase
        .from('timesheets')
        .select(`
          date,
          hours,
          service_assignments (
            services (
              hourly_rate
            )
          )
        `)
        .order('date', { ascending: true });

      if (error) throw error;

      const revenueByMonth = new Map<string, number>();
      let totalRevenue = 0;

      timesheets.forEach((timesheet: any) => {
        const date = new Date(timesheet.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const revenue = timesheet.hours * timesheet.service_assignments.services.hourly_rate;
        
        const currentRevenue = revenueByMonth.get(monthKey) || 0;
        revenueByMonth.set(monthKey, currentRevenue + revenue);
        totalRevenue += revenue;
      });

      // Convert to array and calculate percentage changes
      const monthlyRevenue = Array.from(revenueByMonth.entries())
        .map(([month, revenue], index, array) => {
          let percentageChange = 0;
          
          if (index > 0) {
            const previousRevenue = array[index - 1][1];
            percentageChange = ((revenue - previousRevenue) / previousRevenue) * 100;
          }

          return {
            month,
            revenue,
            percentageChange,
          };
        });

      set({ 
        monthlyRevenue,
        totalRevenue,
        loading: false 
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
}));