
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; // Ajusta la ruta si es necesario
import { useNavigate, Link } from 'react-router-dom';
import LoginBg from '../assets/login-background.png'; // Asegúrate de que esta ruta es correcta y que la imagen existe en src/assets
import Logo from '../assets/Logo.png'; // Asegúrate de que esta ruta es correcta y que la imagen existe en src/assets
const Login = () => {
    const navigate = useNavigate();
    const { login, isLoading: authIsLoading, error: authError, setError, isAuthenticated } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [pageError, setPageError] = useState('');

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/inicio', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setPageError('');
        if (setError) setError(null);

        const result = await login(email, password);
        if (!result || !result.success) {
            setPageError(result?.error || authError || 'Error desconocido al iniciar sesión.');
        }
    };

    useEffect(() => {
        if (email || password) {
            setPageError('');
            if (setError) setError(null);
        }
    }, [email, password, setError]);

    return (
        <div className="flex items-center justify-center min-h-screen px-4 py-8 bg-gray-100 dark:bg-gray-900">
            <div className="flex w-full max-w-sm mx-auto overflow-hidden bg-white rounded-lg shadow-lg dark:bg-gray-800 lg:max-w-4xl">
                {/* Sección de Imagen (visible en LG) */}
                <div
                    className="hidden bg-cover lg:block lg:w-1/2"
                    style={{
                        backgroundImage: `url(${LoginBg})`, 
                    }}
                ></div>

                {/* Sección del Formulario */}
                <div className="w-full px-6 py-8 md:px-8 lg:w-1/2">
                    <div className="flex justify-center mx-auto">
                        <img src={Logo} alt="Logo" className="h-16 w-auto" />
                    </div>

                    <p className="mt-3 text-xl text-center text-gray-600 dark:text-gray-200">
                        Welcome back!
                    </p>

                    {/* Divisores visuales, sin cambios */}
                    <div className="flex items-center justify-between mt-4">
                        <span className="w-1/5 border-b dark:border-gray-600 lg:w-1/4"></span>
                        <span className="w-1/5 border-b dark:border-gray-600 lg:w-1/4"></span>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="mt-4">
                            <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-200" htmlFor="LoggingEmailAddress">Correo</label>
                            <input
                                id="LoggingEmailAddress"
                                className="block w-full px-4 py-2 text-gray-700 bg-white border rounded-lg dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 focus:ring-opacity-40 dark:focus:border-blue-300 focus:outline-none focus:ring focus:ring-blue-300"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                            />
                        </div>

                        <div className="mt-4">
                            {/* El label original tenía htmlFor="LoggingEmailAddress", debería ser único o apuntar a 'loggingPassword' */}
                            <label className="block mb-2 text-sm font-medium text-gray-600 dark:text-gray-200" htmlFor="loggingPassword">Contraseña</label>
                            <input
                                id="loggingPassword"
                                className="block w-full px-4 py-2 text-gray-700 bg-white border rounded-lg dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 focus:ring-opacity-40 dark:focus:border-blue-300 focus:outline-none focus:ring focus:ring-blue-300"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                            />
                        </div>

                        {(pageError || authError) && (
                            <p className="mt-3 text-sm text-center text-red-600">
                                {pageError || authError}
                            </p>
                        )}

                        <div className="mt-6">
                            <button
                                type="submit"
                                disabled={authIsLoading}
                                className="w-full px-6 py-3 text-sm font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-gray-800 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring focus:ring-gray-300 focus:ring-opacity-50 disabled:opacity-50"
                            >
                                {authIsLoading ? 'Signing In...' : 'Sign In'}
                            </button>
                        </div>
                    </form>

                    <div className="flex items-center justify-between mt-4">
                        <span className="w-1/5 border-b dark:border-gray-600 md:w-1/4"></span>
                        <Link to="/register" className="text-xs text-gray-500 uppercase dark:text-gray-400 hover:underline">
                            or sign up
                        </Link>
                        <span className="w-1/5 border-b dark:border-gray-600 md:w-1/4"></span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;