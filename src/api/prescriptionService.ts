import axiosInstance from "./axiosInstance";

export interface MedicineItem {
  name: string;
  dosage?: string;
  duration?: string;
  instructions?: string;
}

export interface PrescriptionRecord {
  id: number;
  patientId: number;
  doctorId: number;
  doctorName: string;
  medicines: string | MedicineItem[];
  notes: string | null;
  status: string; // Normalized to lowercase: "pending", "dispensed", "cancelled"
  appointmentId?: number | null;
  createdAt: string;
  updatedAt: string;
  labTests?: string[];
}

export interface CreatePrescriptionPayload {
  patientId: number;
  diagnosis: string;
  medicines: MedicineItem[];
  labTests: string[];
  notes?: string;
  appointmentId?: number;
}

// Normalize status from backend (UPPERCASE) to frontend (lowercase)
const normalizeStatus = (status: string): string => {
  return status?.toLowerCase() || 'pending';
};

const normalizePrescription = (p: any): PrescriptionRecord => ({
  ...p,
  status: normalizeStatus(p.status),
  medicines: typeof p.medicines === 'string' ? p.medicines : p.medicines,
});

export const prescriptionService = {
  create: async (payload: CreatePrescriptionPayload): Promise<PrescriptionRecord> => {
    const response = await axiosInstance.post<any>("/prescriptions", payload);
    return normalizePrescription(response.data);
  },

  getPatientPrescriptions: async (patientId: number): Promise<PrescriptionRecord[]> => {
    const response = await axiosInstance.get<any[]>(`/prescriptions/patient/${patientId}`);
    return response.data.map(normalizePrescription);
  },

  getDoctorPrescriptions: async (): Promise<PrescriptionRecord[]> => {
    const response = await axiosInstance.get<any[]>("/prescriptions/doctor");
    return response.data.map(normalizePrescription);
  },

  getPending: async (): Promise<PrescriptionRecord[]> => {
    const response = await axiosInstance.get<any[]>("/prescriptions/pending");
    return response.data.map(normalizePrescription);
  },

  getDispensed: async (): Promise<PrescriptionRecord[]> => {
    const response = await axiosInstance.get<any[]>("/prescriptions/dispensed");
    return response.data.map(normalizePrescription);
  },

  dispense: async (prescriptionId: number): Promise<PrescriptionRecord> => {
    const response = await axiosInstance.put<any>(`/prescriptions/${prescriptionId}/dispense`);
    return normalizePrescription(response.data);
  },
};
