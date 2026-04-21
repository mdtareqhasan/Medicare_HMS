import axiosInstance from './axiosInstance';

export interface LoginCredentials {
  username?: string;
  email?: string;
  password: string;
}

export interface SignupCredentials {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  type: string;
  id: number;
  username: string;
  email: string;
  role: string;
}

const TOKEN_KEY = 'authToken';
const ROLE_KEY = 'userRole';
const USER_KEY = 'user';

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await axiosInstance.post<AuthResponse>('/auth/login', credentials);
    if (response.data.token) {
      localStorage.setItem(TOKEN_KEY, response.data.token);
      localStorage.setItem(ROLE_KEY, response.data.role.toLowerCase());
      localStorage.setItem(USER_KEY, JSON.stringify(response.data));
    }
    return response.data;
  },

  register: async (credentials: SignupCredentials): Promise<void> => {
    await axiosInstance.post('/auth/register', credentials);
  },

  logout: (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
    localStorage.removeItem(USER_KEY);
  },

  getCurrentUser: (): AuthResponse | null => {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },

  refreshToken: async (): Promise<AuthResponse> => {
    const response = await axiosInstance.post<AuthResponse>('/auth/refresh');
    if (response.data.token) {
      localStorage.setItem(TOKEN_KEY, response.data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(response.data));
    }
    return response.data;
  },
};