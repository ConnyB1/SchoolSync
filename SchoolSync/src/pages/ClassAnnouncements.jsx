// proyecto/SchoolSync/src/pages/ClassAnnouncements.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';

const ClassAnnouncements = ({ classId, isTeacher }) => {
  const { token, user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newAnnouncementTitle, setNewAnnouncementTitle] = useState('');
  const [newAnnouncementContent, setNewAnnouncementContent] = useState('');
  const [creatingAnnouncement, setCreatingAnnouncement] = useState(false);
  const [createError, setCreateError] = useState(null);

  const fetchAnnouncements = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/announcements/class/${classId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch announcements.');
      }
      const data = await response.json();
      setAnnouncements(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && classId) {
      fetchAnnouncements();
    }
  }, [token, classId]);

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    setCreatingAnnouncement(true);
    setCreateError(null);
    try {
      const response = await fetch(`${API_URL}/announcements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newAnnouncementTitle,
          content: newAnnouncementContent,
          classId: classId,
          // Assuming the backend extracts senderId from the token
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to create announcement.' }));
        throw new Error(errorData.message || 'Failed to create announcement.');
      }
      setNewAnnouncementTitle('');
      setNewAnnouncementContent('');
      await fetchAnnouncements(); // Refresh list
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreatingAnnouncement(false);
    }
  };

  return (
    <div className="space-y-6">
      {isTeacher && (
        <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Crear Nuevo Anuncio</h3>
          <form onSubmit={handleCreateAnnouncement} className="space-y-4">
            <div>
              <label htmlFor="announcementTitle" className="block text-sm font-medium text-gray-700">Título</label>
              <input
                type="text"
                id="announcementTitle"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={newAnnouncementTitle}
                onChange={(e) => setNewAnnouncementTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="announcementContent" className="block text-sm font-medium text-gray-700">Contenido</label>
              <textarea
                id="announcementContent"
                rows="3"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={newAnnouncementContent}
                onChange={(e) => setNewAnnouncementContent(e.target.value)}
                required
              ></textarea>
            </div>
            {createError && <p className="text-red-500 text-sm">{createError}</p>}
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50"
              disabled={creatingAnnouncement}
            >
              {creatingAnnouncement ? 'Publicando...' : 'Publicar Anuncio'}
            </button>
          </form>
        </div>
      )}

      <h2 className="text-2xl font-semibold text-gray-800">Anuncios de la Clase</h2>
      {loading && <p>Cargando anuncios...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      {!loading && !error && announcements.length === 0 && (
        <p className="text-gray-600">No hay anuncios para esta clase.</p>
      )}
      <div className="space-y-4">
        {announcements.map((announcement) => (
          <div key={announcement.id} className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-bold text-gray-900">{announcement.title}</h3>
            <p className="text-gray-700 mt-2">{announcement.content}</p>
            {/* FIXED: Cambiado de sender a author y timestamp a createdAt */}
            <p className="text-sm text-gray-500 mt-2">Publicado por {announcement.author?.firstName || 'Desconocido'} el {new Date(announcement.createdAt).toLocaleDateString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClassAnnouncements;