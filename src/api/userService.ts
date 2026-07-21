import axiosInstance from './axiosInstance';

export interface UserResponse {
  id: number;
  username: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

export interface UserProfileDetail {
  id: number;
  username: string;
  email: string;
  role: string;
  avatarUrl?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  specialization?: string;
  degrees?: string;
  education?: string;
  experienceYears?: number;
  experienceDetails?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PublicDoctorProfile {
  id: number;
  fullName: string;
  avatarUrl?: string | null;
  specialization?: string | null;
  degrees?: string | null;
  education?: string | null;
  experienceYears?: number | null;
  experienceDetails?: string | null;
  address?: string | null;
}

export const userService = {
  getAllUsers: async (): Promise<UserResponse[]> => {
    const response = await axiosInstance.get<UserResponse[]>('/admin/users');
    return response.data;
  },

  getUserById: async (id: number): Promise<UserProfileDetail> => {
    const response = await axiosInstance.get<UserProfileDetail>(`/admin/users/${id}`);
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
    fullName?: string;
    phone?: string;
    gender?: string;
    specialization?: string;
    degrees?: string;
    education?: string;
    experienceYears?: number;
    experienceDetails?: string;
    address?: string;
    avatarUrl?: string;
  }): Promise<void> => {
    await axiosInstance.post('/admin/users', payload);
  },

  getDoctors: async (): Promise<UserResponse[]> => {
    const response = await axiosInstance.get<UserResponse[]>('/users/doctors');
    return response.data;
  },

  getPublicDoctors: async (): Promise<PublicDoctorProfile[]> => {
    const response = await axiosInstance.get<PublicDoctorProfile[]>('/public/doctors');
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
    specialization?: string;
    degrees?: string;
    education?: string;
    experience_years?: number;
    experience_details?: string;
    avatar_url?: string;
    emergency_contact_name?: string | null;
    emergency_contact_phone?: string | null;
    emergency_contact_relation?: string | null;
    insurance_provider?: string | null;
    insurance_policy_number?: string | null;
  }): Promise<any> => {
    const response = await axiosInstance.put<any>(`/users/${userId}/profile`, data);
    return response.data;
  },

  uploadFile: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axiosInstance.post<{ url: string }>('/v1/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.url;
  },
};
