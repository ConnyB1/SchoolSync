// proyecto/SchoolSync/src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config'; //

// 1. AuthContext se crea UNA SOLA VEZ a nivel de módulo y se EXPORTA.
export const AuthContext = createContext(null);

// 2. useAuth hook utiliza el AuthContext definido arriba.
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const navigate = useNavigate();

  // No debe haber otra declaración de AuthContext = createContext(null) aquí dentro.

  const fetchUserProfile = useCallback(async (currentToken) => {
    if (!currentToken) {
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      setAuthError(null); 
      return;
    }
    setIsLoading(true); 
    try {
      const response = await fetch(`${API_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setIsAuthenticated(true);
        setAuthError(null); 
      } else {
        localStorage.removeItem('token');
        setToken(null); 
        setUser(null);
        setIsAuthenticated(false);
        const errorData = await response.json().catch(() => ({ message: "Error al obtener perfil." })); 
        const message = response.status === 401 
          ? "Token inválido o expirado. Por favor, inicia sesión de nuevo." 
          : errorData.message;
        setAuthError(message);
        if (response.status === 401) console.log("Token inválido o expirado.");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      setAuthError("Error de conexión al cargar el perfil. Inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      fetchUserProfile(storedToken);
    } else {
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  }, [fetchUserProfile]);

  const login = async (email, password) => {
    setIsLoading(true);
    setAuthError(null); 
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok && data.accessToken) {
        localStorage.setItem('token', data.accessToken);
        setToken(data.accessToken);
        await fetchUserProfile(data.accessToken); 
        navigate('/inicio');
        return { success: true, user: data.user }; 
      } else {
        setAuthError(data.message || 'Error al iniciar sesión. Verifica tus credenciales.');
        return { success: false, message: data.message || 'Error al iniciar sesión' };
      }
    } catch (error) {
      console.error("Error en login:", error);
      setAuthError(error.message || 'Error de red al intentar iniciar sesión.');
      return { success: false, message: error.message || 'Error de red' };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      const data = await response.json();
      if (response.ok && data.accessToken) {
        localStorage.setItem('token', data.accessToken);
        setToken(data.accessToken);
        await fetchUserProfile(data.accessToken);
        navigate('/inicio');
        return { success: true, user: data.user }; 
      } else {
        setAuthError(data.message || 'Error al registrarse.');
        return { success: false, message: data.message || 'Error al registrarse' };
      }
    } catch (error) {
      console.error("Error en registro:", error);
      setAuthError(error.message || 'Error de red al intentar registrarse.');
      return { success: false, message: error.message || 'Error de red' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setAuthError(null); 
    console.log("Usuario deslogueado.");
    navigate('/login');
  }, [navigate]); 


  const value = {
    user,
    token,
    isAuthenticated,
    isLoading,
    authError,     
    setAuthError,  
    login,
    register,
    logout,
    setUser,       
    fetchUserProfile 
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};