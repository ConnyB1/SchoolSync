import React, { useState, useEffect } from 'react';
import Sidebar from './sidebar';
// import { useAuth0 } from '@auth0/auth0-react'; // Ya no se usa Auth0 aquí
import { useAuth } from '../context/AuthContext'; // Usa tu AuthContext

const Inicio = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true); // Renombrado para claridad
  const [error, setError] = useState(null);
  // const { getAccessTokenSilently, isAuthenticated, isLoading: authLoading } = useAuth0(); // Ya no se usa Auth0
  const { token, isAuthenticated, isLoading: authLoading } = useAuth(); // Usa tu AuthContext

  // API_BASE_URL debería venir de una variable de entorno o configuración,
  // pero tu AuthContext ya usa una. Considera centralizar esto.
  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

  useEffect(() => {
    if (authLoading) { // isLoading de tu AuthContext
      return; 
    }

    if (!isAuthenticated) { // isAuthenticated de tu AuthContext
      setLoadingAnnouncements(false);
      setAnnouncements([]);
      return;
    }

    const fetchAnnouncements = async () => {
      setLoadingAnnouncements(true);
      setError(null);
      try {
        // const token = await getAccessTokenSilently(); // No es necesario si tienes el token de tu AuthContext
        if (!token) { // Verifica que el token exista
            throw new Error("Token de autenticación no encontrado.");
        }
        const response = await fetch(`${API_BASE_URL}/api/announcements`, { // Añadido /api
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`, // Usa el token de tu AuthContext
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          let errorData = `HTTP error! status: ${response.status}`;
          try {
            const errJson = await response.json();
            errorData += ` - ${errJson.message || JSON.stringify(errJson)}`;
          } catch (e) {
            try {
                const errText = await response.text();
                errorData += ` - ${errText}`;
            } catch (textErr) {
                errorData += ' (Could not read error response body)';
            }
          }
          throw new Error(errorData);
        }
        const data = await response.json();
        setAnnouncements(data);
      } catch (e) {
        setError(e.message);
        console.error("Error fetching announcements:", e);
      } finally {
        setLoadingAnnouncements(false);
      }
    };

    if (isAuthenticated && token) { // Asegúrate que el token también esté presente
        fetchAnnouncements();
    }
  // API_BASE_URL no necesita estar en las dependencias si no cambia.
  // }, [isAuthenticated, getAccessTokenSilently, authLoading, API_BASE_URL]); 
  }, [isAuthenticated, token, authLoading]); // Dependencias actualizadas

  // La lógica de renderizado condicional (authLoading, !isAuthenticated, loadingAnnouncements) permanece similar
  // pero ahora usa las variables de tu AuthContext.
  if (authLoading) {
    return (
      <div className="flex min-h-screen w-full bg-gray-100 h-full">
        <Sidebar />
        <div className="flex-1 max-w-5xl mx-auto p-5 text-center">
          <p>Cargando sesión...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !authLoading) {
    return (
      <div className="flex min-h-screen w-full bg-gray-100 h-full">
        <Sidebar />
        <div className="flex-1 max-w-5xl mx-auto p-5 text-center">
          {/* Podrías redirigir a login aquí o mostrar un mensaje */}
          <p>Por favor, inicia sesión para ver los anuncios.</p>
        </div>
      </div>
    );
  }

  if (loadingAnnouncements) { // Usar la variable renombrada
    return (
      <div className="flex min-h-screen w-full bg-gray-100 h-full">
        <Sidebar />
        <div className="flex-1 max-w-5xl mx-auto p-5 text-center">
          <p>Cargando anuncios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-gray-100 h-full">
      <Sidebar />
      <div className="flex-1 max-w-5xl mx-auto p-5 overflow-y-auto">
        <header className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800">Anuncios</h2>
        </header>

        {error && <p className="text-red-500">Error al cargar anuncios: {error}</p>}

        {!loadingAnnouncements && !error && announcements.length === 0 && (
          <div className="text-center py-10">
            <p className="text-gray-600">No hay anuncios disponibles en este momento.</p>
          </div>
        )}

        {!loadingAnnouncements && !error && announcements.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {announcements.map((announcement) => (
              <div key={announcement.id} className="bg-white rounded-md shadow-md overflow-hidden">
                {announcement.imageUrl && (
                  <img src={announcement.imageUrl} alt={announcement.title} className="w-full h-32 object-cover" />
                )}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{announcement.title}</h3>
                  <p className="text-gray-600 text-sm">{announcement.content}</p>
                  <button className="text-indigo-500 text-sm mt-2 hover:underline">Leer más</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <footer className="border-t border-gray-200 py-8 text-center text-gray-600 mt-auto">
          <p>© 2025 Schoolsync</p>
        </footer>
      </div>
    </div>
  );
};

export default Inicio;