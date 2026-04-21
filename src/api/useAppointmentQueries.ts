import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { appointmentService, Appointment, AppointmentRequest } from './appointmentService';

// Query keys for React Query
export const appointmentKeys = {
  all: ['appointments'] as const,
  myAppointments: ['appointments', 'my'] as const,
  doctorSchedule: (doctorId: number) => ['appointments', 'doctor', doctorId] as const,
  allAppointments: ['appointments', 'all'] as const,
};

// Queries
export const useMyAppointments = () => {
  return useQuery({
    queryKey: appointmentKeys.myAppointments,
    queryFn: () => appointmentService.getMyAppointments(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useDoctorSchedule = (doctorId: number) => {
  return useQuery({
    queryKey: appointmentKeys.doctorSchedule(doctorId),
    queryFn: () => appointmentService.getDoctorSchedule(doctorId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useAllAppointments = () => {
  return useQuery({
    queryKey: appointmentKeys.allAppointments,
    queryFn: () => appointmentService.getAllAppointments(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Mutations
export const useBookAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AppointmentRequest) => appointmentService.bookAppointment(data),
    onSuccess: () => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: appointmentKeys.myAppointments });
      queryClient.invalidateQueries({ queryKey: appointmentKeys.allAppointments });
    },
  });
};

export const useUpdateAppointmentStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ appointmentId, status }: { appointmentId: number; status: string }) =>
      appointmentService.updateAppointmentStatus(appointmentId, status),
    onSuccess: () => {
      // Invalidate all appointment queries
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
    },
  });
};

export const useCancelAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (appointmentId: number) => appointmentService.cancelAppointment(appointmentId),
    onSuccess: () => {
      // Invalidate all appointment queries
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
    },
  });
};