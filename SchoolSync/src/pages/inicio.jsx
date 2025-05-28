// proyecto/SchoolSync/src/pages/inicio.jsx
import React, { useState, useEffect } from 'react';
import Sidebar from './sidebar'; 
import { useAuth } from '../context/AuthContext'; 
import AnnouncementCard from '../components/anuncios'; 

const Inicio = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [error, setError] = useState(null);
  const { token, isAuthenticated, isLoading: authLoading } = useAuth();
  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

  useEffect(() => {
    if (authLoading) {
      return; 
    }

    if (!isAuthenticated) {
      setLoadingAnnouncements(false);
      setAnnouncements([]);
      return;
    }

    const fetchAnnouncements = async () => {
      setLoadingAnnouncements(true);
      setError(null);
      try {
        if (!token) {
            throw new Error("Token de autenticación no encontrado.");
        }
        let fetchUrl;
        if (API_BASE_URL.endsWith('/api')) {
          fetchUrl = `${API_BASE_URL}/announcements`;
        } else {
          fetchUrl = `${API_BASE_URL}/api/announcements`;
        }
        
        console.log("Fetching announcements from URL:", fetchUrl);

        const response = await fetch(fetchUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
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

    if (isAuthenticated && token) {
        fetchAnnouncements();
    }
  }, [isAuthenticated, token, authLoading, API_BASE_URL]);

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
          <p>Por favor, inicia sesión para ver los anuncios.</p>
        </div>
      </div>
    );
  }

  // No mostramos "Cargando anuncios..." si no hay autenticación o token,
  // ya que la carga ni siquiera comenzará.
  // El return de arriba ya maneja !isAuthenticated.
  // Solo mostramos "Cargando anuncios..." si estamos autenticados y el token existe.
  if (isAuthenticated && token && loadingAnnouncements) { 
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
    <div className="flex min-h-screen w-full bg-gray-100"> {/* Quitamos h-full aquí para que el contenido determine la altura */}
      <Sidebar />

      <main className="flex-1 p-8">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8"> 
          <h1 className="text-3xl font-bold text-gray-800 mb-4 sm:mb-0">Anuncios</h1>
        </header>
        <div className="flex-1 max-w-5xl mx-auto p-5 flex flex-col overflow-hidden"> {/* Se añade overflow-hidden para contener el scroll del hijo */}

          {/* Contenedor para el estado de error y sin anuncios */}
          <div className="flex-shrink-0">
            {error && <p className="text-red-500">Error al cargar anuncios: {error}</p>}
            {!loadingAnnouncements && !error && announcements.length === 0 && (
              <div className="text-center py-10">
                <p className="text-gray-600">No hay anuncios disponibles en este momento.</p>
              </div>
            )}
          </div>

          {/* CAMBIO: Contenedor de la lista de anuncios con scroll */}
          {/* flex-grow para que ocupe el espacio disponible, overflow-y-auto para el scroll vertical */}
          <div className="flex-auto overflow-y-auto custom-scrollbar"> {/* custom-scrollbar si quieres estilos personalizados de scroll */}
            {!loadingAnnouncements && !error && announcements.length > 0 && (
              // CAMBIO: De grid a flex flex-col para una lista vertical de tarjetas a ancho completo
              // pb-6 para padding al final de la lista scrolleable
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12 pb-6"> 
                {announcements.map((announcement) => (
                  <AnnouncementCard
                    key={announcement.id} 
                    title={announcement.title}
                    description={announcement.content} 
                    // Las props buttonText y onButtonClick ya no se pasan
                  />
                ))}
              </div>
            )}
          </div>

          <footer className="border-t border-gray-200 py-8 text-center text-gray-600 mt-auto flex-shrink-0"> {/* flex-shrink-0 para que no se encoja */}
            <p>© 2025 Schoolsync</p>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default Inicio;