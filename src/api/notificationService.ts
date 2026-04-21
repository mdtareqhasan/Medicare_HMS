import axiosInstance from './axiosInstance';

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  link: string | null;
  created_at: string;
}

export const notificationService = {
  getNotifications: async (): Promise<NotificationItem[]> => {
    const response = await axiosInstance.get<NotificationItem[]>('/notifications');
    return response.data;
  },

  markAllRead: async (): Promise<void> => {
    await axiosInstance.put('/notifications/mark-all-read');
  },

  markRead: async (id: number): Promise<void> => {
    await axiosInstance.put(`/notifications/${id}/mark-read`);
  },
};