import React, { useState, useEffect } from 'react';
import Sidebar from './sidebar';
import { useAuth0 } from '@auth0/auth0-react';

const Inicio = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const fetchAnnouncements = async () => {
      try {
        const token = await getAccessTokenSilently();
        const response = await fetch('http://localhost:3000/api/announcements', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setAnnouncements(data);
      } catch (e) {
        setError(e.message);
        console.error("Error fetching announcements:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, [isAuthenticated, getAccessTokenSilently]);

  if (!isAuthenticated && !loading) {
    return (
      <div className="flex min-h-screen w-full bg-gray-100 h-full">
        <Sidebar />
        <div className="flex-1 max-w-5xl mx-auto p-5 text-center">
          <p>Por favor, inicia sesión para ver los anuncios.</p>
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
        {loading && <p>Cargando anuncios...</p>}
        {error && <p className="text-red-500">Error al cargar anuncios: {error}</p>}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {announcements.map((announcement, index) => (
              <div key={announcement.id || index} className="bg-white rounded-md shadow-md overflow-hidden">
                {announcement.imageUrl && (
                  <img src={announcement.imageUrl} alt={announcement.title} className="w-full h-32 object-cover" />
                )}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{announcement.title}</h3>
                  <p className="text-gray-600 text-sm">{announcement.description}</p>
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