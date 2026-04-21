import axiosInstance from './axiosInstance';

export interface ProfilePayload {
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  address?: string | null;
  dateOfBirth?: string | null;
  gender?: 'male' | 'female' | 'other' | null;
  bloodGroup?: string | null;
  emergencyName?: string | null;
  emergencyPhone?: string | null;
  emergencyRelation?: string | null;
  avatarUrl?: string | null;
}

export interface ProfileResponse extends ProfilePayload {
  id: number;
  userId: number;
  avatarUrl?: string | null;
}

export const profileService = {
  getProfile: async (): Promise<ProfileResponse> => {
    const response = await axiosInstance.get<ProfileResponse>('/profile');
    return response.data;
  },

  updateProfile: async (payload: ProfilePayload): Promise<ProfileResponse> => {
    const response = await axiosInstance.put<ProfileResponse>('/profile', payload);
    return response.data;
  },

  uploadAvatar: async (file: File): Promise<{ avatarUrl: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axiosInstance.put('/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};