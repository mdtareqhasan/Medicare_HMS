import axiosInstance from './axiosInstance';

export interface Appointment {
  id: number;
  patient: {
    id: number;
    username: string;
    email: string;
  };
  doctor: {
    id: number;
    username: string;
    email: string;
  };
  appointmentDate: string;
  status: 'SCHEDULED' | 'UPCOMING' | 'RESCHEDULED' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  createdAt: string;
}

export interface AppointmentRequest {
  doctorId: number;
  patientId?: number;
  appointmentDate: string;
  notes?: string;
}

export const appointmentService = {
  // Patient/Doctor/Admin: Book an appointment
  bookAppointment: async (data: AppointmentRequest): Promise<Appointment> => {
    const response = await axiosInstance.post<Appointment>('/appointments/book', data);
    return response.data;
  },

  // Patient: Get my appointments
  getMyAppointments: async (): Promise<Appointment[]> => {
    const response = await axiosInstance.get<Appointment[]>('/appointments/my');
    return response.data;
  },

  // Doctor: Get my schedule
  getDoctorSchedule: async (doctorId: number): Promise<Appointment[]> => {
    const response = await axiosInstance.get<Appointment[]>(`/appointments/doctor/${doctorId}`);
    return response.data;
  },
  // Get appointments for any patient (admin/doctor/nurse) or own patient (patient)
  getPatientAppointments: async (patientId: number): Promise<Appointment[]> => {
    const response = await axiosInstance.get<Appointment[]>(`/appointments/patient/${patientId}`);
    return response.data;
  },
  // Admin: Get all appointments
  getAllAppointments: async (): Promise<Appointment[]> => {
    const response = await axiosInstance.get<Appointment[]>('/appointments/all');
    return response.data;
  },

  // Update appointment status
  updateAppointmentStatus: async (appointmentId: number, status: string): Promise<Appointment> => {
    const response = await axiosInstance.put<Appointment>(
      `/appointments/${appointmentId}/status`,
      null,
      { params: { status } }
    );
    return response.data;
  },

  // Reschedule appointment
  rescheduleAppointment: async (appointmentId: number, appointmentDate: string): Promise<Appointment> => {
    const response = await axiosInstance.patch<Appointment>(
      `/appointments/${appointmentId}/reschedule`,
      { new_date: appointmentDate }
    );
    return response.data;
  },

  // Complete appointment (and create medical record)
  completeAppointment: async (
    appointmentId: number,
    data: { diagnosis: string; prescription: string; notes: string }
  ): Promise<Appointment> => {
    const response = await axiosInstance.patch<Appointment>(
      `/appointments/${appointmentId}/complete`,
      data
    );
    return response.data;
  },

  // Cancel appointment
  cancelAppointment: async (appointmentId: number): Promise<void> => {
    await axiosInstance.patch(`/appointments/${appointmentId}/cancel`);
  },

  // Get available slots for a doctor on a specific date
  getDoctorSlots: async (doctorId: number, date: string): Promise<string[]> => {
    const response = await axiosInstance.get<string[]>(`/appointments/doctor/${doctorId}/slots?date=${date}`);
    return response.data;
  },
};