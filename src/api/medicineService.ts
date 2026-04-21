import axiosInstance from './axiosInstance';

export interface Medicine { id: number; name: string; generic_name?: string | null; category?: string | null; manufacturer?: string | null; price: number; stock_quantity: number; unit?: string | null; expiry_date?: string | null; }

export const medicineService = {
  getAll: async () => {
    const response = await axiosInstance.get<Medicine[]>('/pharmacy');
    return response.data;
  },
  getLowStock: async () => {
    const response = await axiosInstance.get<Medicine[]>('/pharmacy/low-stock');
    return response.data;
  },
  create: async (medicine: Partial<Medicine>) => {
    const response = await axiosInstance.post<Medicine>('/pharmacy', medicine);
    return response.data;
  },
  update: async (id: number, medicine: Partial<Medicine>) => {
    const response = await axiosInstance.put<Medicine>(`/pharmacy/${id}`, medicine);
    return response.data;
  },
  delete: async (id: number) => {
    const response = await axiosInstance.delete(`/pharmacy/${id}`);
    return response.data;
  },
  dispense: async (id: number, quantity: number) => {
    const response = await axiosInstance.post<Medicine>(`/pharmacy/${id}/dispense`, undefined, { params: { quantity } });
    return response.data;
  },
};
