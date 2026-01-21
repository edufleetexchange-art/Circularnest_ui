import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthContextType, User } from '../types';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      
      if (token) {
        try {
          const response = await api.getMe();
          
          if (response.success && response.user) {
            const userData = response.user;
            setUser({
              id: userData.id,
              email: userData.email,
              role: userData.role,
              institutionName: userData.institutionName,
              phone: userData.phone,
              address: userData.address,
              city: userData.city,
              state: userData.state,
              pincode: userData.pincode,
              contactPerson: userData.contactPerson,
              createdAt: userData.createdAt
            });
          } else {
            // Token invalid, clear it
            localStorage.removeItem('auth_token');
            setUser(null);
          }
        } catch (apiError) {
          console.error('API call failed:', apiError);
          // Clear invalid token and set user to null
          localStorage.removeItem('auth_token');
          setUser(null);
        }
      } else {
        // No token, user is not logged in
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('auth_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await api.login(email, password);

      if (!response.success) {
        throw new Error(response.message || 'Login failed');
      }

      const userData = response.user;
      const user: User = {
        id: userData.id,
        email: userData.email,
        role: userData.role,
        institutionName: userData.institutionName,
        phone: userData.phone,
        address: userData.address,
        city: userData.city,
        state: userData.state,
        pincode: userData.pincode,
        contactPerson: userData.contactPerson,
        createdAt: userData.createdAt
      };

      setUser(user);
      localStorage.setItem('auth_token', response.token);
      toast.success('Login successful!');
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
      throw error;
    }
  };

  const signup = async (email: string, password: string, role: 'admin' | 'user', institutionName?: string) => {
    try {
      // Only allow user role registration
      if (role === 'admin') {
        throw new Error('Admin registration is disabled. Only institution owners can register.');
      }

      const response = await api.signup({
        email,
        password,
        role: 'user',
        institutionName
      });

      if (!response.success) {
        throw new Error(response.message || 'Signup failed');
      }

      toast.success('Account created! Please login.');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Signup failed';
      toast.error(message);
      throw new Error(message);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_token');
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };