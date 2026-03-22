import { useState, useEffect, useCallback } from 'react';

interface AuthState {
  token: string | null;
  username: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

export function useAuth() {
  const [auth, setAuth] = useState<AuthState>({
    token: localStorage.getItem('admin_token'),
    username: localStorage.getItem('admin_username'),
    isAuthenticated: false,
    loading: true,
  });

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      setAuth(prev => ({ ...prev, loading: false }));
      return;
    }
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Invalid token');
      })
      .then(data => {
        setAuth({ token, username: data.username, isAuthenticated: true, loading: false });
      })
      .catch(() => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_username');
        setAuth({ token: null, username: null, isAuthenticated: false, loading: false });
      });
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Login failed');
    }
    const data = await res.json();
    localStorage.setItem('admin_token', data.token);
    localStorage.setItem('admin_username', data.username);
    setAuth({ token: data.token, username: data.username, isAuthenticated: true, loading: false });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_username');
    setAuth({ token: null, username: null, isAuthenticated: false, loading: false });
  }, []);

  const authFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('admin_token');
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        ...(options.body && typeof options.body === 'string' ? { 'Content-Type': 'application/json' } : {}),
      },
    });
  }, []);

  return { ...auth, login, logout, authFetch };
}
