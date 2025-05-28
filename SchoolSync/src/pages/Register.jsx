// Asegúrate que este archivo esté en: proyecto/SchoolSync/src/pages/Register.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; // Ajusta la ruta si tu AuthContext está en otro lugar
import { useNavigate, Link } from 'react-router-dom';

const UserRole = {
  Alumno: 'Alumno',
  Profesor: 'Profesor',
  Padre: 'Padre',
};

const Register = () => {
  const navigate = useNavigate();
  const { register, isLoading: authIsLoading, error: authError, setError, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    roles: [UserRole.Alumno],
  });
  const [pageError, setPageError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/inicio', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (e) => {
    setFormData(prev => ({ ...prev, roles: [e.target.value] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPageError('');
    if (setError) setError(null);

    if (formData.password !== formData.confirmPassword) {
      setPageError('Las contraseñas no coinciden.');
      return;
    }
    if (formData.password.length < 8) {
        setPageError('La contraseña debe tener al menos 8 caracteres.');
        return;
    }

    const { confirmPassword, ...userDataToSubmit } = formData;

    const result = await register(userDataToSubmit);
    if (result.success) {
      alert('Registro exitoso. Por favor, inicia sesión.');
      navigate('/');
    } else {
      setPageError(result.error || 'Error desconocido durante el registro.');
    }
  };

  useEffect(() => {
    const hasFormDataChanged = Object.keys(formData).some(key => {
        if (key === 'roles') return false;
        return typeof formData[key] === 'string' && formData[key].length > 0;
    });

    if (hasFormDataChanged) {
       setPageError('');
       if (setError) setError(null);
    }
  }, [formData, setError]);


  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 py-8">
      <div className="w-full max-w-lg p-8 space-y-6 bg-white rounded-lg shadow-xl">
        <h2 className="text-3xl font-extrabold text-center text-gray-900">
          Crear una Cuenta
        </h2>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-black mb-1">Nombre</label> {/* CAMBIO: text-gray-700 a text-black */}
              <input
                id="firstName"
                name="firstName"
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-black" // CAMBIO: añadido text-black
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Tu nombre"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-black mb-1">Apellido (Opcional)</label> {/* CAMBIO: text-gray-700 a text-black */}
              <input
                id="lastName"
                name="lastName"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-black" // CAMBIO: añadido text-black
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Tu apellido"
              />
            </div>
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-black mb-1">Correo electrónico</label> {/* CAMBIO: text-gray-700 a text-black */}
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-black" // CAMBIO: añadido text-black
              value={formData.email}
              onChange={handleChange}
              placeholder="tu@correo.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-black mb-1">Contraseña</label> {/* CAMBIO: text-gray-700 a text-black */}
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength="8"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-black" // CAMBIO: añadido text-black
              value={formData.password}
              onChange={handleChange}
              placeholder="Mínimo 8 caracteres"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-black mb-1">Confirmar Contraseña</label> {/* CAMBIO: text-gray-700 a text-black */}
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-black" // CAMBIO: añadido text-black
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Repite tu contraseña"
            />
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-black mb-1">Registrarse como:</label> {/* CAMBIO: text-gray-700 a text-black */}
            <select
              id="role"
              name="roles"
              value={formData.roles[0]}
              onChange={handleRoleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 mt-1 text-black" // CAMBIO: añadido text-black
            >
              <option value={UserRole.Alumno}>Alumno</option>
              <option value={UserRole.Profesor}>Profesor</option>
              <option value
={UserRole.Padre}>Padre de Familia</option>
            </select>
          </div>

          {(pageError || authError) && (
            <p className="text-sm text-red-600 text-center">{pageError || authError}</p>
          )}

          <div>
            <button
              type="submit"
              disabled={authIsLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {authIsLoading ? 'Registrando...' : 'Crear Cuenta'}
            </button>
          </div>
        </form>
        <p className="mt-4 text-sm text-center text-gray-600">
          ¿Ya tienes una cuenta?{' '}
          <Link to="/" className="font-medium text-indigo-600 hover:text-indigo-500">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;