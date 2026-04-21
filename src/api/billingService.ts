import axiosInstance from './axiosInstance';

export interface BillingInvoice { 
  id: number; 
  patientId: number; 
  doctorId?: number | null; 
  doctorFee: string | number; // Handle both string (for precision) and number
  labFee: string | number; 
  pharmacyFee: string | number; 
  totalAmount: string | number; 
  status: string; 
  createdAt: string; 
}

export const billingService = {
  getInvoices: async () => {
    const response = await axiosInstance.get<BillingInvoice[]>('/api/billing');
    return response.data;
  },
  createInvoice: async (payload: { patientId: number; doctorId?: number; doctorFee: number; labFee: number; pharmacyFee: number; }) => {
    const response = await axiosInstance.post<any>('/api/billing', null, { params: payload });
    return response.data;
  },
  markPaid: async (id: number) => {
    const response = await axiosInstance.put(`/api/billing/${id}/pay`);
    return response.data;
  },
};
