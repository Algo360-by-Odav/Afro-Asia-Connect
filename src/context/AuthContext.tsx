"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

// Utility function to get cookie value by name
const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(';').shift();
    return cookieValue || null;
  }
  return null;
};

interface User {
  id: number; // Backend returns number, not string
  email: string;
  firstName?: string;
  lastName?: string;
  isAdmin?: boolean; // Backend uses isAdmin field
  user_type?: string; // Added user_type
  role?: string; // Added role field for compatibility
  // Add other user properties as needed
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>; // To refresh user data
  // signup: (userData: any) => Promise<void>; // Placeholder for signup
}

// Helper to decode JWT payload without verification (client-side)
const decodeJwtPayload = (token: string): Record<string, unknown> => {
  try {
    const payload = token.split('.')[1];
    // Pad base64 string if necessary
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.warn('Failed to decode JWT payload', e);
    return {};
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Set hydration flag first
    setIsHydrated(true);
    
    // Attempt to load token and user from localStorage or cookies
    const initializeAuth = async () => {
      setIsLoading(true);
      let storedToken = null;
      
      // Only access localStorage on client side
      if (typeof window !== 'undefined') {
        storedToken = localStorage.getItem('token');
      }
      
      // If no token in localStorage, check cookies as fallback
      if (!storedToken) {
        const cookieToken = getCookie('token');
        if (cookieToken) {
          storedToken = cookieToken;
          // Sync token back to localStorage (only on client side)
          if (typeof window !== 'undefined') {
            localStorage.setItem('token', cookieToken);
          }
        }
      }
      
      let storedUserStr = null;
      if (typeof window !== 'undefined') {
        storedUserStr = localStorage.getItem('user');
      }
      if (storedUserStr) {
        try {
          const parsedUser: User = JSON.parse(storedUserStr);
          // Ensure user_type is normalized
          if (!parsedUser.user_type) {
          // attempt to derive from stored token
          const decoded = storedToken ? decodeJwtPayload(storedToken) : {};
          parsedUser.user_type = (decoded as any)?.user_type || (decoded as any)?.role || undefined;
          parsedUser.role = (decoded as any)?.role || (decoded as any)?.user_type || undefined;
        } else {
          parsedUser.role = parsedUser.role || parsedUser.user_type;
        }
          setUser(parsedUser);
        } catch (e) {
          console.warn('Failed to parse stored user JSON:', e);
          localStorage.removeItem('user');
        }
      }
      // In a real app, you would validate the token with the backend here
      // and fetch user details if the token is valid.
      if (storedToken) {
        setToken(storedToken);
        // For now, let's assume if a token exists, we can fetch the user
        // You'll need to implement the actual API call in fetchUser
        try {
          // Placeholder: fetch user data based on token
          // const userData = await fetch('/api/auth/me', { headers: { 'Authorization': `Bearer ${storedToken}`}}).then(res => res.json());
          // if (userData && userData.user) setUser(userData.user);
          // For now, setting a dummy user if token exists
          // setUser({ id: '1', email: 'test@example.com', firstName: 'Test' }); 
        } catch (error) {
          console.error('Failed to fetch user on init:', error);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token'); // Clear invalid token
          }
          setToken(null);
          setUser(null);
        }
      } else {
        // If no token, ensure user is null
        setUser(null);
      }
      setIsLoading(false);
    };
    initializeAuth();
  }, []);

  const login = async (tokenValue: string, userData: User): Promise<void> => {
    return new Promise<void>((resolve) => {
      setIsLoading(true);
      console.log('AuthContext: login called with token and user data');
      
      setToken(tokenValue);
      // Normalize user_type to lowercase (if provided) to maintain consistent role checks across the app
      let roleValue = (userData.user_type ?? (userData as any).role) as string | undefined;
      if (!roleValue) {
        const decoded = decodeJwtPayload(tokenValue);
        roleValue = (decoded.user_type ?? decoded.role) as string | undefined;
      }
      const normalizedUser: User = {
        ...userData,
        user_type: roleValue || undefined,
        role: roleValue || undefined, // Preserve original role case
      };
      setUser(normalizedUser);
      // Persist to localStorage for page refreshes (only on client side)
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(normalizedUser));
        localStorage.setItem('token', tokenValue);
      }
      
      // Also set token in cookies for middleware access
      document.cookie = `token=${tokenValue}; path=/; max-age=${5 * 60 * 60}; SameSite=Strict; Secure=${window.location.protocol === 'https:'}`;
      
      setIsLoading(false);
      
      // Resolve the promise after a small delay to ensure state is updated
      setTimeout(() => {
        console.log('AuthContext: login state updated, resolving promise');
        resolve();
      }, 50);
    });
  };

  const logout = () => {
    setIsLoading(true);
    // Placeholder: Replace with actual API call to invalidate token on backend
    console.log('AuthContext: logout called');
    setUser(null);
    setToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    
    // Clear token cookie
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict';
    
    router.push('/auth'); // Redirect to auth page
    setIsLoading(false);
  };

  const fetchUser = async () => {
    // This function refreshes user data from the backend
    console.log('AuthContext: fetchUser called');
    let currentToken = null;
    if (typeof window !== 'undefined') {
      currentToken = localStorage.getItem('token');
    }
    if (!currentToken) {
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${currentToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        console.log('AuthContext: Fresh user data received:', data);
        if (data.user) {
          const normalizedUser: User = {
            ...data.user,
            user_type: data.user.role || data.user.user_type,
            role: data.user.role || data.user.user_type,
          };
          setUser(normalizedUser);
          // Update localStorage with fresh data
          if (typeof window !== 'undefined') {
            localStorage.setItem('user', JSON.stringify(normalizedUser));
          }
        }
      } else {
        console.error('Failed to fetch user, token might be invalid');
        logout(); // Token is invalid or expired, log out user
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      // Don't logout on network errors, just log the error
    }
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, fetchUser }}>
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
