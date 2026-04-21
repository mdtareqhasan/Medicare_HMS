/**
 * EXAMPLE: How to use the API hooks with TanStack Query
 * 
 * This file demonstrates the migration from Supabase to Axios
 */

// ============== EXAMPLE 1: Login ==============
import { useLogin } from '@/api/useAuthQueries';

function LoginExample() {
  const loginMutation = useLogin();

  const handleLogin = async () => {
    try {
      const response = await loginMutation.mutateAsync({
        username: 'john_doe',
        password: 'password123',
      });
      // login successful, continue flow
      // Token is automatically stored in localStorage
      // Redirect to dashboard or home page
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <button onClick={handleLogin} disabled={loginMutation.isPending}>
      {loginMutation.isPending ? 'Logging in...' : 'Login'}
    </button>
  );
}

// ============== EXAMPLE 2: Get My Appointments ==============
import { useMyAppointments } from '@/api/useAppointmentQueries';

function MyAppointmentsExample() {
  const { data: appointments, isLoading, error } = useMyAppointments();

  if (isLoading) return <div>Loading appointments...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>My Appointments</h2>
      <ul>
        {appointments?.map((apt) => (
          <li key={apt.id}>
            {apt.appointmentDate} - {apt.doctor.username} ({apt.status})
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============== EXAMPLE 3: Book Appointment ==============
import { useBookAppointment } from '@/api/useAppointmentQueries';

function BookAppointmentExample() {
  const bookAppointmentMutation = useBookAppointment();

  const handleBook = async () => {
    try {
      const newAppointment = await bookAppointmentMutation.mutateAsync({
        doctorId: 5,
        appointmentDate: new Date(2026, 3, 15, 10, 30).toISOString(),
        notes: 'Regular checkup',
      });
      // Appointment booked, query cache updates automatically
    } catch (error) {
      console.error('Failed to book appointment:', error);
    }
  };

  return (
    <button
      onClick={handleBook}
      disabled={bookAppointmentMutation.isPending}
    >
      {bookAppointmentMutation.isPending ? 'Booking...' : 'Book Appointment'}
    </button>
  );
}

// ============== EXAMPLE 4: Doctor Schedule ==============
import { useDoctorSchedule } from '@/api/useAppointmentQueries';

function DoctorScheduleExample({ doctorId }: { doctorId: number }) {
  const { data: schedule, isLoading, error } = useDoctorSchedule(doctorId);

  if (isLoading) return <div>Loading schedule...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>Doctor Schedule</h2>
      <ul>
        {schedule?.map((apt) => (
          <li key={apt.id}>
            {apt.appointmentDate} - {apt.patient.username} ({apt.status})
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============== EXAMPLE 5: Admin - All Appointments ==============
import { useAllAppointments, useUpdateAppointmentStatus } from '@/api/useAppointmentQueries';

function AdminAppointmentsExample() {
  const { data: appointments, isLoading } = useAllAppointments();
  const updateStatusMutation = useUpdateAppointmentStatus();

  const handleStatusChange = (appointmentId: number, newStatus: string) => {
    updateStatusMutation.mutate({ appointmentId, status: newStatus });
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h2>All Appointments (Admin View)</h2>
      <table>
        <thead>
          <tr>
            <th>Patient</th>
            <th>Doctor</th>
            <th>Date</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {appointments?.map((apt) => (
            <tr key={apt.id}>
              <td>{apt.patient.username}</td>
              <td>{apt.doctor.username}</td>
              <td>{apt.appointmentDate}</td>
              <td>{apt.status}</td>
              <td>
                <select
                  value={apt.status}
                  onChange={(e) => handleStatusChange(apt.id, e.target.value)}
                >
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export {
  LoginExample,
  MyAppointmentsExample,
  BookAppointmentExample,
  DoctorScheduleExample,
  AdminAppointmentsExample,
};