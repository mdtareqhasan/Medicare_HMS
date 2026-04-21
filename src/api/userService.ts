import axiosInstance from './axiosInstance';

export interface UserResponse {
  id: number;
  username: string;
  email: string;
  role: string;
}

export const userService = {
  getAllUsers: async (): Promise<UserResponse[]> => {
    const response = await axiosInstance.get<UserResponse[]>('/admin/users');
    return response.data;
  },

  updateUserRole: async (id: number, role: string): Promise<UserResponse> => {
    const response = await axiosInstance.put<UserResponse>(`/admin/users/${id}/role`, null, {
      params: { role },
    });
    return response.data;
  },

  createUser: async (payload: {
    username: string;
    email: string;
    password: string;
    role: string;
  }): Promise<void> => {
    await axiosInstance.post('/admin/users', payload);
  },

  getDoctors: async (): Promise<UserResponse[]> => {
    const response = await axiosInstance.get<UserResponse[]>('/users/doctors');
    return response.data;
  },

  getPatients: async (): Promise<UserResponse[]> => {
    const response = await axiosInstance.get<UserResponse[]>('/users/patients');
    return response.data;
  },

  deleteUser: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/admin/users/${id}`);
  },

  updateProfile: async (userId: number, data: {
    full_name?: string;
    age?: number | null;
    gender?: string | null;
    phone?: string | null;
    address?: string | null;
    date_of_birth?: string | null;
    blood_group?: string | null;
    emergency_contact_name?: string | null;
    emergency_contact_phone?: string | null;
    emergency_contact_relation?: string | null;
    insurance_provider?: string | null;
    insurance_policy_number?: string | null;
  }): Promise<any> => {
    const response = await axiosInstance.put<any>(`/users/${userId}/profile`, data);
    return response.data;
  },
};