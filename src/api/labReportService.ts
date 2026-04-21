import axiosInstance from "./axiosInstance";

export interface LabReportItem {
  id: number;
  testName?: string;
  patient?: { id: number; username: string };
  doctor?: { id: number; username: string };
  patientId?: number;
  doctorId?: number;
  result?: string | null;
  fileUrl?: string | null;
  testDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const labReportService = {
  getPatientReports: async (patientId: number): Promise<LabReportItem[]> => {
    const response = await axiosInstance.get<LabReportItem[]>(`/lab/reports/patient/${patientId}`);
    return Array.isArray(response.data) ? response.data : [];
  },

  getDoctorReports: async (doctorId: number): Promise<LabReportItem[]> => {
    const response = await axiosInstance.get<LabReportItem[]>(`/lab/reports/doctor/${doctorId}`);
    return Array.isArray(response.data) ? response.data : [];
  },

  getPendingReports: async (): Promise<LabReportItem[]> => {
    const response = await axiosInstance.get<LabReportItem[]>(`/lab/reports/pending`);
    return Array.isArray(response.data) ? response.data : [];
  },

  getAllReports: async (): Promise<LabReportItem[]> => {
    const response = await axiosInstance.get<LabReportItem[]>(`/lab/reports/all`);
    console.log("Lab reports response:", response.data);
    // Ensure response.data is an array
    const data = Array.isArray(response.data) ? response.data : [];
    return data;
  },

  startTest: async (reportId: number): Promise<LabReportItem> => {
    const response = await axiosInstance.put<LabReportItem>(`/lab/reports/${reportId}/start`);
    return response.data;
  },

  submitResult: async (reportId: number, data: { result: string; fileUrl?: string }): Promise<LabReportItem> => {
    const response = await axiosInstance.put<LabReportItem>(`/lab/reports/${reportId}/submit`, data);
    return response.data;
  },

  uploadReportResult: async (reportId: number, fileUrl: string): Promise<LabReportItem> => {
    const response = await axiosInstance.put<{ report: LabReportItem }>(`/lab/reports/${reportId}/upload`, null, {
      params: { fileUrl },
    });
    return response.data.report;
  },
};
