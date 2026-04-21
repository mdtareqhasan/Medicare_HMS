/**
 * API Layer Index
 * Central export point for all API services and hooks
 */

// Services
export { authService } from './authService';
export type { LoginCredentials, SignupCredentials, AuthResponse } from './authService';

export { appointmentService } from './appointmentService';
export type { Appointment, AppointmentRequest } from './appointmentService';

export { prescriptionService } from './prescriptionService';
export type { PrescriptionRecord, MedicineItem, CreatePrescriptionPayload } from './prescriptionService';

export { labReportService } from './labReportService';
export type { LabReportItem } from './labReportService';

// Hooks
export {
  useLogin,
  useRegister,
  useLogout,
  useCurrentUser,
  authKeys,
} from './useAuthQueries';

export {
  useMyAppointments,
  useDoctorSchedule,
  useAllAppointments,
  useBookAppointment,
  useUpdateAppointmentStatus,
  useCancelAppointment,
  appointmentKeys,
} from './useAppointmentQueries';

// Instance
export { default as axiosInstance } from './axiosInstance';