// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Asegúrate que la ruta sea correcta

/**
 * Componente de Ruta Protegida.
 *
 * Este componente envuelve las rutas que requieren autenticación.
 * - Muestra un estado de carga mientras se verifica la autenticación.
 * - Si el usuario no está autenticado, lo redirige a la página de inicio de sesión (o la ruta que especifiques).
 * - Si el usuario está autenticado, renderiza el contenido de la ruta protegida (ya sea `children` o un `Outlet` para rutas anidadas).
 *
 * @param {object} props
 * @param {React.ReactNode} [props.children] - Componentes hijos directos para renderizar si está autenticado.
 * Si no se proveen hijos, se usará <Outlet /> para rutas anidadas.
 * @returns {React.ReactElement | null}
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation(); // Para recordar la ruta a la que el usuario intentaba acceder

  if (isLoading) {
    // Muestra un indicador de carga mientras se determina el estado de autenticación.
    // Puedes personalizar este indicador como prefieras.
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="text-xl font-semibold text-gray-700">
          Cargando página...
        </div>
        {/* O un spinner más elaborado:
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        */}
      </div>
    );
  }

  if (!isAuthenticated) {
    // Si el usuario no está autenticado, redirige a la página de inicio de sesión.
    // Se usa `replace` para que el usuario no pueda volver a la ruta protegida con el botón "atrás" del navegador.
    // Se guarda la ruta original en `state.from` para poder redirigir al usuario de vuelta después del login.
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Si el usuario está autenticado, renderiza los componentes hijos o un <Outlet />.
  // <Outlet /> se usa si este ProtectedRoute envuelve un conjunto de rutas anidadas definidas en App.jsx.
  return children ? children : <Outlet />;
};

export default ProtectedRoute;