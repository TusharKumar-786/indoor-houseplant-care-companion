import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, confirmPassword?: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('plantcare_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      localStorage.removeItem('plantcare_user');
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('plantcare_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const verifyUser = async () => {
      const savedToken = localStorage.getItem('plantcare_token');
      if (savedToken) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.data.user);
          localStorage.setItem('plantcare_user', JSON.stringify(res.data.data.user));
        } catch (err: any) {
          // Clear session strictly on 401 Unauthorized; keep session on network drops, 429 rate limits, or 5xx server issues
          if (err.response && err.response.status === 401) {
            localStorage.removeItem('plantcare_token');
            localStorage.removeItem('plantcare_user');
            setUser(null);
            setToken(null);
          }
        }
      }
      setIsLoading(false);
    };

    verifyUser();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const { user: loggedInUser, token: authToken } = res.data.data;
    setUser(loggedInUser);
    setToken(authToken);
    localStorage.setItem('plantcare_token', authToken);
    localStorage.setItem('plantcare_user', JSON.stringify(loggedInUser));
  };

  const register = async (name: string, email: string, password: string, confirmPassword?: string) => {
    const res = await api.post('/auth/register', { name, email, password, confirmPassword });
    const { user: newUser, token: authToken } = res.data.data;
    setUser(newUser);
    setToken(authToken);
    localStorage.setItem('plantcare_token', authToken);
    localStorage.setItem('plantcare_user', JSON.stringify(newUser));
  };

  const logout = () => {
    localStorage.removeItem('plantcare_token');
    localStorage.removeItem('plantcare_user');
    setUser(null);
    setToken(null);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('plantcare_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
