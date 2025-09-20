import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, AuthResponse, LoginRequest, CreateUserRequest, ApiResponse } from '../../../shared/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: CreateUserRequest) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const apiCall = async <T,>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> => {
    const response = await fetch(`/api${endpoint}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    // Check if response has content before parsing
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Response is not JSON:', response.status, response.statusText);
      throw new Error(`Server returned non-JSON response: ${response.status} ${response.statusText}`);
    }

    // Check for empty response
    const text = await response.text();
    if (!text) {
      console.error('Empty response from server');
      throw new Error('Server returned empty response');
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error('Failed to parse JSON:', text);
      throw new Error('Invalid JSON response from server');
    }

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  };

  const login = async (credentials: LoginRequest): Promise<void> => {
    try {
      setLoading(true);
      const response = await apiCall<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      if (response.success && response.data) {
        setUser(response.data.user);
        // Clear hash to return to main page
        window.location.hash = '';
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: CreateUserRequest): Promise<void> => {
    try {
      setLoading(true);
      const response = await apiCall<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      if (response.success && response.data) {
        setUser(response.data.user);
        // Clear hash to return to main page
        window.location.hash = '';
      } else {
        throw new Error(response.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      await apiCall('/auth/logout', {
        method: 'POST',
      });
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Clear user even if logout request fails
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const checkAuth = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await apiCall<User>('/auth/me');

      if (response.success && response.data) {
        setUser(response.data);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useRequireAuth(): AuthContextType {
  const auth = useAuth();
  
  useEffect(() => {
    if (!auth.loading && !auth.user) {
      // Redirect to login or show login modal
      console.warn('Authentication required');
    }
  }, [auth.loading, auth.user]);
  
  return auth;
}