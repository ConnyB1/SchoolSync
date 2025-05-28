// src/pages/login.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate(); // Aunque el AuthContext maneja la navegación post-login
  const { login, isLoading: authIsLoading, error: authError, setError, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pageError, setPageError] = useState(''); // Para errores específicos de esta página

  // Si ya está autenticado, no debería estar en la página de login
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/inicio', { replace: true });
    }
  }, [isAuthenticated, navigate]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setPageError(''); // Limpiar errores locales
    if (setError) setError(null); // Limpiar errores globales del AuthContext

    const result = await login(email, password);
    if (!result.success) {
      setPageError(result.error || 'Error desconocido al iniciar sesión.');
    }
    // La navegación en caso de éxito ya la maneja el AuthContext.login
  };

  // Limpiar errores si el usuario empieza a escribir de nuevo
  useEffect(() => {
    if (email || password) {
      setPageError('');
      if (setError) setError(null);
    }
  }, [email, password, setError]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-xl">
        <h2 className="text-3xl font-extrabold text-center text-gray-900">
          Iniciar Sesión
        </h2>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 mb-1">
              Correo electrónico
            </label>
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Muestra errores de esta página o del contexto de autenticación */}
          {(pageError || authError) && (
            <p className="text-sm text-red-600 text-center">
              {pageError || authError}
            </p>
          )}

          <div>
            <button
              type="submit"
              disabled={authIsLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {authIsLoading ? 'Iniciando...' : 'Iniciar Sesión'}
            </button>
          </div>
        </form>
        <p className="mt-4 text-sm text-center text-gray-600">
          ¿No tienes una cuenta?{' '}
          <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
            Regístrate aquí
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;