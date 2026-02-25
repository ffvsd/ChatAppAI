import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { apiService } from '../services/apiService';
import { User, UserType, AuthState } from '../types';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  loginAsTemporary: (displayName: string, fcmToken?: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const checkAuth = useCallback(async () => {
    const token = apiService.getToken();
    if (!token) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      const user = await apiService.getMe();
      setState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      apiService.logout();
      setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email: string, password: string) => {
    const { user, accessToken } = await apiService.login(email, password);
    setState({
      user,
      token: accessToken,
      isAuthenticated: true,
      isLoading: false,
    });
  };

  const register = async (email: string, password: string, displayName: string) => {
    const { user, accessToken } = await apiService.register(email, password, displayName);
    setState({
      user,
      token: accessToken,
      isAuthenticated: true,
      isLoading: false,
    });
  };

  const loginAsTemporary = async (displayName: string, fcmToken?: string) => {
    const { user, accessToken } = await apiService.createTemporaryUser(displayName, fcmToken);
    setState({
      user,
      token: accessToken,
      isAuthenticated: true,
      isLoading: false,
    });
  };

  const logout = () => {
    apiService.logout();
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, loginAsTemporary, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
