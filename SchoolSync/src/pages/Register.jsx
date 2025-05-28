// proyecto/SchoolSync/src/pages/Register.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; // Ajusta la ruta si es necesario
import { useNavigate, Link } from 'react-router-dom';
import Logo from '../assets/Logo.png';

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

        if (result && result.success) {
            alert('Registro exitoso. Por favor, inicia sesión.');
            navigate('/');
        } else {
            setPageError(result?.error || authError || 'Error desconocido durante el registro.');
        }
    };
    
    useEffect(() => {
        const hasMeaningfulChange = Object.keys(formData).some(key => {
            const value = formData[key];
            if (key === 'roles') return value[0] !== UserRole.Alumno;
            return typeof value === 'string' && value.trim() !== '';
        });

        if (hasMeaningfulChange) {
           setPageError('');
           if (setError) setError(null);
        }
    }, [formData, setError]);

    return (
        <section className="bg-white dark:bg-gray-900">
            <div className="container flex items-center justify-center min-h-screen px-6 mx-auto py-8">
                <form className="w-full max-w-md" onSubmit={handleSubmit}>
                    <div className="flex justify-center mx-auto">
                        <img src={Logo} alt="Logo" className="h-16 w-auto" />
                    </div>

                    <div className="flex items-center justify-center mt-6">
                        <Link to="/" className="w-1/3 pb-4 font-medium text-center text-gray-500 capitalize border-b dark:border-gray-600 dark:text-gray-300">
                            sign in
                        </Link>
                        <span className="w-1/3 pb-4 font-medium text-center text-gray-800 capitalize border-b-2 border-blue-500 dark:border-blue-400 dark:text-white">
                            sign up
                        </span>
                    </div>

                    {/* First Name */}
                    <div className="relative flex items-center mt-8">
                        <span className="absolute">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mx-3 text-gray-300 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </span>
                        <input
                            type="text"
                            name="firstName"
                            id="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            required
                            className="block w-full py-3 text-gray-700 bg-white border rounded-lg px-11 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 dark:focus:border-blue-300 focus:ring-blue-300 focus:outline-none focus:ring focus:ring-opacity-40"
                            placeholder="Nombre"
                        />
                    </div>

                    {/* Last Name */}
                    <div className="relative flex items-center mt-4">
                        <span className="absolute">
                             <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mx-3 text-gray-300 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </span>
                        <input
                            type="text"
                            name="lastName"
                            id="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            className="block w-full py-3 text-gray-700 bg-white border rounded-lg px-11 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 dark:focus:border-blue-300 focus:ring-blue-300 focus:outline-none focus:ring focus:ring-opacity-40"
                            placeholder="Apellido (Opcional)"
                        />
                    </div>
                    
                    <label htmlFor="dropzone-file-disabled" className="flex flex-col items-center px-3 py-3 mx-auto mt-6 text-center bg-white border-2 border-dashed rounded-lg cursor-not-allowed opacity-50 dark:border-gray-600 dark:bg-gray-900">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-300 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        <h2 className="mx-3 text-gray-400">Foto de Perfil (No habilitado)</h2>
                        <input id="dropzone-file-disabled" type="file" className="hidden" disabled />
                    </label>

                    {/* Email */}
                    <div className="relative flex items-center mt-6">
                        <span className="absolute">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mx-3 text-gray-300 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </span>
                        <input
                            type="email"
                            name="email"
                            id="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            autoComplete="email"
                            className="block w-full py-3 text-gray-700 bg-white border rounded-lg px-11 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 dark:focus:border-blue-300 focus:ring-blue-300 focus:outline-none focus:ring focus:ring-opacity-40"
                            placeholder="Correo Electrónico"
                        />
                    </div>

                    {/* Password */}
                    <div className="relative flex items-center mt-4">
                        <span className="absolute">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mx-3 text-gray-300 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </span>
                        <input
                            type="password"
                            name="password"
                            id="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            minLength="8"
                            className="block w-full py-3 text-gray-700 bg-white border rounded-lg px-11 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 dark:focus:border-blue-300 focus:ring-blue-300 focus:outline-none focus:ring focus:ring-opacity-40"
                            placeholder="Contraseña (mín. 8 caracteres)"
                        />
                    </div>
                    
                    {/* Confirm Password */}
                    <div className="relative flex items-center mt-4">
                        <span className="absolute">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mx-3 text-gray-300 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </span>
                        <input
                            type="password"
                            name="confirmPassword"
                            id="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            className="block w-full py-3 text-gray-700 bg-white border rounded-lg px-11 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 dark:focus:border-blue-300 focus:ring-blue-300 focus:outline-none focus:ring focus:ring-opacity-40"
                            placeholder="Confirmar Contraseña"
                        />
                    </div>

                    {/* Selector de Rol */}
                    <div className="mt-4">
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Registrado como:</label>
                        <select
                            id="role"
                            name="roles" // El nombre debe coincidir con la clave en formData
                            value={formData.roles[0]} // Acceder al primer elemento ya que roles es un array
                            onChange={handleRoleChange}
                            className="block w-full py-3 text-gray-700 bg-white border rounded-lg px-3 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 dark:focus:border-blue-300 focus:ring-blue-300 focus:outline-none focus:ring focus:ring-opacity-40"
                        >
                            <option value={UserRole.Alumno}>Alumno</option>
                            <option value={UserRole.Profesor}>Profesor</option>
                            <option value={UserRole.Padre}>Padre de Familia</option>
                        </select>
                    </div>

                    {(pageError || authError) && (
                        <p className="mt-4 text-sm text-red-600 text-center">{pageError || authError}</p>
                    )}

                    <div className="mt-6">
                        <button
                            type="submit"
                            disabled={authIsLoading}
                            className="w-full px-6 py-3 text-sm font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-blue-500 rounded-lg hover:bg-blue-400 focus:outline-none focus:ring focus:ring-blue-300 focus:ring-opacity-50 disabled:opacity-50"
                        >
                            {authIsLoading ? 'Registrando...' : 'Registrarse'}
                        </button>
                    </div>
                </form>
            </div>
        </section>
    );
};

export default Register;