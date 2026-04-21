import axiosInstance from './axiosInstance';

export const doctorAvailabilityService = {
  // গেট মেথড
  getAvailability: async (doctorId: number) => {
    const response = await axiosInstance.get(`/doctor-availability/${doctorId}`);
    return response.data;
  },

  // বাল্ক সেভ মেথড - এটি ব্যাকএন্ডের @PutMapping("/bulk/{doctorId}") কল করবে
  saveAvailabilityBulk: async (doctorId: number, data: any[]) => {
    const response = await axiosInstance.put(`/doctor-availability/bulk/${doctorId}`, data);
    return response.data;
  }
};