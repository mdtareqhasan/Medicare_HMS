/**
 * EXAMPLE: Login Component Using New Axios + React Query
 * 
 * Copy this pattern to create your login page with form validation
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLogin } from '@/api/useAuthQueries';
import { toast } from 'sonner';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const loginMutation = useLogin();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const response = await loginMutation.mutateAsync({
        username,
        password,
      });

      toast.success(`Welcome, ${response.username}!`);
      
      // Redirect based on role
      switch (response.role) {
        case 'ADMIN':
          navigate('/admin/dashboard');
          break;
        case 'DOCTOR':
          navigate('/doctor/dashboard');
          break;
        case 'PATIENT':
          navigate('/patient/dashboard');
          break;
        default:
          navigate('/dashboard');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit}>
        <h1>Login</h1>

        <div className="form-group">
          <label>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loginMutation.isPending}
          />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loginMutation.isPending}
          />
        </div>

        <button 
          type="submit" 
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? 'Logging in...' : 'Login'}
        </button>

        {loginMutation.isError && (
          <p className="error">
            Login failed. Please check your credentials.
          </p>
        )}
      </form>
    </div>
  );
}

/**
 * EXAMPLE: Register Component
 */

import { useRegister } from '@/api/useAuthQueries';

export function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const registerMutation = useRegister();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await registerMutation.mutateAsync({
        username,
        email,
        password,
      });

      toast.success('Registration successful! Please login.');
      navigate('/login');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
    }
  };

  return (
    <div className="register-container">
      <form onSubmit={handleSubmit}>
        <h1>Register</h1>

        <div className="form-group">
          <label>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Choose a username"
          />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
          />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
          />
        </div>

        <button 
          type="submit" 
          disabled={registerMutation.isPending}
        >
          {registerMutation.isPending ? 'Registering...' : 'Register'}
        </button>
      </form>
    </div>
  );
}

/**
 * EXAMPLE: Protected Route Component
 * 
 * Wrap routes that require authentication with this component
 */

import { useCurrentUser } from '@/api/useAuthQueries';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { data: user, isLoading } = useCurrentUser();
  const navigate = useNavigate();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <div>Access Denied</div>;
  }

  return <>{children}</>;
}

/**
 * EXAMPLE: Patient Dashboard with Appointments
 */

import { useMyAppointments, useBookAppointment } from '@/api/useAppointmentQueries';

export function PatientDashboard() {
  const { data: appointments, isLoading } = useMyAppointments();
  const bookMutation = useBookAppointment();

  if (isLoading) return <div>Loading appointments...</div>;

  return (
    <div className="dashboard">
      <h1>My Appointments</h1>

      <button 
        onClick={() => {
          // Open booking modal
        }}
      >
        Book New Appointment
      </button>

      <table>
        <thead>
          <tr>
            <th>Doctor</th>
            <th>Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {appointments?.map((apt) => (
            <tr key={apt.id}>
              <td>{apt.doctor.username}</td>
              <td>{new Date(apt.appointmentDate).toLocaleDateString()}</td>
              <td>{apt.status}</td>
              <td>
                {apt.status === 'SCHEDULED' && (
                  <button onClick={() => handleCancel(apt.id)}>
                    Cancel
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  function handleCancel(appointmentId: number) {
    if (window.confirm('Are you sure?')) {
      bookMutation.mutate({ doctorId: 0 } as any); // Use cancel hook instead
    }
  }
}

/**
 * TIPS:
 * 
 * 1. Always wrap your App with <AppProviders> in main.tsx
 * 2. Use useNavigate() for redirects
 * 3. Use toast.success/error for notifications
 * 4. Check isPending state for loading indicators
 * 5. Check isError state for error displays
 * 6. Token automatically added to all requests
 * 7. On 401, user is auto-logged out and redirected
 * 8. React Query cache handles data updates
 */