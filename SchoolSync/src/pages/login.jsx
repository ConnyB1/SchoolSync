// src/pages/login.jsx
import React, { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const { loginWithRedirect, isAuthenticated, isLoading, error, user } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      // Una vez autenticado, puedes verificar si el rol ya está en el token o perfil del usuario
      // y redirigir en consecuencia o realizar acciones post-registro.
      console.log('Usuario autenticado:', user);
      navigate('/inicio'); // Redirige a la página de inicio
    }
  }, [isLoading, isAuthenticated, navigate, user]);

  const handleLogin = () => {
    loginWithRedirect({
      appState: { targetUrl: '/inicio' }, // Opcional: para redirigir después del login
      // screen_hint: 'login', // Sugiere a Auth0 mostrar la pantalla de login
    });
  };

  const handleRegister = (role) => {
    loginWithRedirect({
      appState: { targetUrl: '/inicio', role: role }, // Pasamos el rol en appState
      screen_hint: 'signup', // Sugiere a Auth0 mostrar la pantalla de registro
      // También puedes pasar el rol directamente en authorizationParams,
      // que podría ser leído por una Regla en el objeto `context.request.query`
      // o `context.request.body` dependiendo de cómo Auth0 lo maneje.
      // Es más robusto usar appState para información que tu app necesita post-login.
      // Si quieres que la Regla lo use *durante* la transacción de login/signup,
      // necesitarás explorar cómo enviar metadata o un custom parameter.
      // Una forma es usar `customState` en las opciones de `loginWithRedirect`
      // que luego Auth0 puede pasar a las reglas en `context.protocol === 'redirect-callback'`
      // bajo `context.request.query.state` (después de decodificar el state).
      // Auth0 usa `appState` para pasar estado a la aplicación después de la redirección.
      // Para pasar datos *a* la regla durante el signup, una mejor forma es usar un
      // Hook "Pre User Registration" si tienes un flujo de registro más personalizado,
      // o configurar tu formulario de Auth0 (si usas el Universal Login personalizable)
      // para incluir un campo de selección de rol que se guarde en `user_metadata`.

      // Para este ejemplo, nos enfocaremos en `appState` y luego, en la Regla,
      // si es el primer login, consultaremos este `appState` o, idealmente,
      // tu aplicación, después del login, haría una llamada a tu backend
      // para finalizar el registro con el rol (si la Regla no pudo hacerlo).
      // ---
      // Estrategia Simplificada para la Regla:
      // Pasaremos el rol en un parámetro de pantalla (screen_hint) o un custom param
      // que la Regla pueda recoger. El `initialScreen` y `mode` son ejemplos.
      // Auth0 tiene `customParameters` como opción para Universal Login.
      // Pero la forma más confiable de pasar datos a la regla es que la regla los infiera
      // o que tu UI de registro personalizada (si la tienes) los envíe a user_metadata.

      // Alternativa más directa para Reglas (si Auth0 lo permite en el Universal Login):
      // Algunos parámetros se pueden añadir al query string de la autorización
      // y la regla puede leer `context.request.query.nombre_parametro_rol`.
      authorizationParams: {
        screen_hint: 'signup',

      },
      appState: { targetUrl: '/inicio', role: role } // El rol se usará post-login en tu app
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div>Cargando sesión...</div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md text-center">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            Bienvenido a SchoolSync
          </h2>
          <p className="mt-2 text-gray-600">
            Selecciona una opción para continuar.
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleLogin}
            className="w-full px-4 py-2 font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Iniciar Sesión
          </button>

          <p className="text-sm text-gray-500">¿Eres nuevo? Regístrate como:</p>

          <button
            onClick={() => handleRegister('alumno')}
            className="w-full px-4 py-2 font-medium text-indigo-700 bg-indigo-100 border border-indigo-300 rounded-md shadow-sm hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400"
          >
            Registrarse como Alumno
          </button>
          <button
            onClick={() => handleRegister('maestro')}
            className="w-full px-4 py-2 font-medium text-teal-700 bg-teal-100 border border-teal-300 rounded-md shadow-sm hover:bg-teal-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-400"
          >
            Registrarse como Maestro
          </button>
          <button
            onClick={() => handleRegister('padre')}
            className="w-full px-4 py-2 font-medium text-purple-700 bg-purple-100 border border-purple-300 rounded-md shadow-sm hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-400"
          >
            Registrarse como Padre de Familia
          </button>
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-600">
            Error de autenticación: {error.message}. Revisa la consola para más detalles.
          </p>
        )}
      </div>
    </div>
  );
};

export default Login;