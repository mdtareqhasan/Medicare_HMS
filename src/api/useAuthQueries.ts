import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService, LoginCredentials, SignupCredentials, AuthResponse } from './authService';

export const authKeys = {
  all: ['auth'] as const,
  currentUser: ['auth', 'currentUser'] as const,
};

export const useCurrentUser = () => {
  return useQuery({
    queryKey: authKeys.currentUser,
    queryFn: () => authService.getCurrentUser(),
    staleTime: Infinity, // Never stale
  });
};

export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authService.login(credentials),
    onSuccess: (data: AuthResponse) => {
      // Update the current user query
      queryClient.setQueryData(authKeys.currentUser, data);
    },
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: (credentials: SignupCredentials) => authService.register(credentials),
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      authService.logout();
      return Promise.resolve();
    },
    onSuccess: () => {
      // Clear all queries
      queryClient.clear();
    },
  });
};