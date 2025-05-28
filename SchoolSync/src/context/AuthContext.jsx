import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config'; // Asegúrate que esta ruta y variable sean correctas

// 1. Crear el Contexto y EXPORTARLO (si necesitas acceder al Context directamente en algún caso raro)
export const AuthContext = createContext(null);

// 2. Crear y EXPORTAR el hook personalizado 'useAuth'
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        // Este error ayuda a asegurar que useAuth se usa dentro de un AuthProvider
        throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
    }
    return context;
};

// 3. Crear y EXPORTAR el AuthProvider
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token')); // Inicializar token desde localStorage
    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token')); // Booleano basado en token
    const [isLoading, setIsLoading] = useState(true);
    const [authError, setAuthError] = useState(null);
    const navigate = useNavigate();

    const fetchUserProfile = useCallback(async (currentToken) => {
        if (!currentToken) {
            setUser(null);
            setIsAuthenticated(false);
            setToken(null); // Limpiar token también del estado
            localStorage.removeItem('token'); // Limpiar token del localStorage
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
                let message = "Error al obtener perfil.";
                if (response.status === 401) {
                    message = "Token inválido o expirado. Por favor, inicia sesión de nuevo.";
                    console.log("Token inválido o expirado al intentar cargar perfil.");
                } else {
                    try {
                        const errorData = await response.json();
                        message = errorData.message || message;
                    } catch (e) { /* Mantener mensaje por defecto si no hay JSON */ }
                }
                setAuthError(message);
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
    }, [API_URL]); // Quité navigate de las dependencias si no se usa directamente aquí.

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            // No es necesario setToken aquí si ya se inicializó desde localStorage.
            // Si el token es inválido, fetchUserProfile lo limpiará.
            fetchUserProfile(storedToken);
        } else {
            // Estado inicial si no hay token
            setUser(null);
            setIsAuthenticated(false);
            setIsLoading(false);
            setToken(null); // Asegurar que el token en estado también esté null
        }
    }, [fetchUserProfile]); // fetchUserProfile es la única dependencia necesaria aquí

    const login = async (email, password) => {
        setIsLoading(true);
        setAuthError(null);
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            // Siempre intenta parsear como JSON, pero maneja si el cuerpo está vacío o no es JSON en caso de error
            const data = await response.json().catch(() => null); 

            if (response.ok && data && data.accessToken) {
                localStorage.setItem('token', data.accessToken);
                setToken(data.accessToken);
                // fetchUserProfile establecerá setUser y setIsAuthenticated
                await fetchUserProfile(data.accessToken); 
                navigate('/inicio');
                return { success: true, user: data.user };
            } else {
                const errorMessage = data?.message || 'Error al iniciar sesión. Verifica tus credenciales.';
                setAuthError(errorMessage);
                return { success: false, message: errorMessage };
            }
        } catch (error) {
            console.error("Error en login:", error);
            const networkErrorMessage = error.message || 'Error de red al intentar iniciar sesión.';
            setAuthError(networkErrorMessage);
            return { success: false, message: networkErrorMessage };
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
                headers: { 'Content-Type': 'application/json' }, // Asumiendo que envías JSON (sin foto)
                body: JSON.stringify(userData),
            });
            const data = await response.json().catch(() => null);

            // Asumo que el registro no auto-loguea ni devuelve token, sino un mensaje.
            // Si devuelve token y quieres auto-loguear, ajusta como en login.
            if (response.ok) {
                // Aquí no establecemos token ni usuario, el usuario deberá loguearse después.
                return { success: true, message: data?.message || "Registro exitoso. Por favor, inicia sesión." };
            } else {
                const errorMessage = data?.message || `Error al registrarse (status: ${response.status})`;
                setAuthError(errorMessage);
                return { success: false, message: errorMessage };
            }
        } catch (error) {
            console.error("Error en la petición de registro:", error);
            const networkErrorMessage = error.message || 'Error de red al intentar registrarse.';
            setAuthError(networkErrorMessage);
            return { success: false, message: networkErrorMessage };
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
        navigate('/login'); // O a donde quieras redirigir después del logout
    }, [navigate]);

    const value = {
        user,
        token,
        isAuthenticated,
        isLoading,
        authError,
        setAuthError, // Exportar setError si es necesario en los componentes
        login,
        register,
        logout,
        setUser, // Exportar setUser si necesitas modificar el usuario desde fuera (cuidado con esto)
        fetchUserProfile // Exportar si necesitas recargar el perfil manualmente
    };

    return (
        <AuthContext.Provider value={value}>
            {/* Renderizar children solo cuando no esté cargando la sesión inicial puede ser una buena práctica
                para evitar flashes de contenido no autenticado, pero depende de tu UX.
                Si isLoading es true al inicio y luego se resuelve, esto es útil.
            */}
            {/* {!isLoading ? children : null}  // O un spinner de carga global */}
            {children} 
        </AuthContext.Provider>
    );
};