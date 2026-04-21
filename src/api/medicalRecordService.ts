import axiosInstance from './axiosInstance';

export interface MedicalRecordResponse {
  id: number;
  appointmentId: number;
  doctorId: number;
  doctorName: string;
  patientId: number;
  patientName: string;
  diagnosis: string;
  prescription: string | null;
  notes: string | null;
  recordDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMedicalRecordRequest {
  patientId: number;
  appointmentId?: number;
  diagnosis: string;
  prescription: string;
  notes?: string;
}

export const medicalRecordService = {
  getPatientRecords: async (patientId: number): Promise<MedicalRecordResponse[]> => {
    const response = await axiosInstance.get<MedicalRecordResponse[]>(`/medical-records/patient/${patientId}`);
    return response.data;
  },

  getDoctorRecords: async (doctorId: number): Promise<MedicalRecordResponse[]> => {
    const response = await axiosInstance.get<MedicalRecordResponse[]>(`/medical-records/doctor/${doctorId}`);
    return response.data;
  },

  createMedicalRecord: async (payload: CreateMedicalRecordRequest): Promise<MedicalRecordResponse> => {
    const response = await axiosInstance.post<MedicalRecordResponse>(`/medical-records`, payload);
    return response.data;
  },
};
