import axiosInstance from './axiosInstance';

export interface DashboardStats {
  totalPatients: number;
  totalDoctors: number;
  totalAppointments: number;
  appointmentsToday: number;
  totalRevenue: number;
}

export const dashboardService = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await axiosInstance.get<DashboardStats>('/admin/dashboard-stats');
    return response.data;
  },
};
