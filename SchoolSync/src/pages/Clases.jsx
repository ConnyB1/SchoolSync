// proyecto/SchoolSync/src/pages/Clases.jsx
import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import Sidebar from './sidebar';
import { PlusIcon, UserPlusIcon, DocumentArrowUpIcon } from '@heroicons/react/24/solid';

// ... (ClassCard, CreateClassModal, JoinClassModal, ImportClassesModal no cambian)...

const Clases = () => {
  const { user, isAuthenticated, isLoading, getAccessTokenSilently } = useAuth0();
  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true); // Inicia como true si isAuthenticated es true
  const [error, setError] = useState(null);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setJoinModalOpen] = useState(false);
  const [isImportModalOpen, setImportModalOpen] = useState(false);

  const namespace = 'https://schoolsync.example.com/';
  const userRoles = isAuthenticated && user ? user[`${namespace}roles`] || [] : [];
  const esMaestro = userRoles.includes('maestro');
  const esAlumno = userRoles.includes('alumno');

  const fetchClasses = async () => {
    if (!isAuthenticated) {
      setLoadingClasses(false);
      setError("Usuario no autenticado."); // Mensaje claro si no está autenticado
      return;
    }
    setLoadingClasses(true);
    setError(null); // Limpiar errores previos

    try {
      console.log("Intentando obtener token para /api/classes...");
      const token = await getAccessTokenSilently();
      
      if (!token) {
        console.error("No se pudo obtener el token de acceso.");
        throw new Error("No se pudo obtener el token de acceso. Intenta iniciar sesión de nuevo.");
      }
      console.log("Token obtenido:", token ? token.substring(0, 20) + "..." : "No hay token");

      const response = await fetch('http://localhost:3000/api/classes', {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Respuesta del servidor para /api/classes:", response.status, response.statusText);

      if (!response.ok) {
        let errorMsg = `Error HTTP: ${response.status} ${response.statusText}`;
        try {
          const errData = await response.json();
          console.error("Cuerpo del error del servidor:", errData);
          errorMsg = errData.message || JSON.stringify(errData);
        } catch (jsonError) {
          console.error("No se pudo parsear el cuerpo del error como JSON.");
          // Usar el status text si no hay cuerpo JSON
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      console.log("Clases recibidas:", data);
      setClasses(data);
    } catch (e) {
      console.error("Error detallado en fetchClasses:", e);
      setError(e.message || "Ocurrió un error desconocido al cargar las clases.");
    } finally {
      setLoadingClasses(false);
    }
  };

  useEffect(() => {
    if (isLoading) { // Si Auth0 está cargando, no hagas nada aún
      setLoadingClasses(true);
      return;
    }
    if (isAuthenticated) {
      console.log("Usuario autenticado, llamando a fetchClasses...");
      fetchClasses();
    } else {
      console.log("Usuario no autenticado, no se llamará a fetchClasses.");
      setLoadingClasses(false); // Deja de cargar si no está autenticado
      // Podrías querer limpiar las clases si el usuario cierra sesión: setClasses([]);
      // O manejar la redirección al login aquí si es necesario
    }
  }, [isAuthenticated, isLoading, getAccessTokenSilently]); // getAccessTokenSilently se añade como dependencia por si cambia


  const handleCreateClass = async (classData) => {
    if (!isAuthenticated) { alert("Debes iniciar sesión para crear clases."); return; }
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch('http://localhost:3000/api/classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(classData),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'No se pudo crear la clase');
      }
      fetchClasses();
    } catch (e) {
      console.error("Error creating class:", e);
      alert(`Error: ${e.message}`);
    }
  };

  const handleJoinClass = async (accessCode) => {
    if (!isAuthenticated) { alert("Debes iniciar sesión para unirte a clases."); return; }
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch('http://localhost:3000/api/classes/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ accessCode }),
      });
      if (!response.ok) {
         const errData = await response.json();
        throw new Error(errData.message || 'No se pudo unir a la clase');
      }
      fetchClasses();
    } catch (e) {
      console.error("Error joining class:", e);
      alert(`Error: ${e.message}`);
    }
  };
  
  const handleImportClasses = async (file) => {
    if (!isAuthenticated) { alert("Debes iniciar sesión para importar clases."); return; }
    const formData = new FormData();
    formData.append('file', file);
    try {
        const token = await getAccessTokenSilently();
        const response = await fetch('http://localhost:3000/api/classes/import', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || 'Error importando clases.');
        }
        alert(`Importación completada: ${result.created} creadas, ${result.updated} actualizadas. Errores: ${result.errors?.length || 0}`);
        if (result.errors && result.errors.length > 0) {
            console.error("Errores de importación:", result.errors);
        }
        fetchClasses();
    } catch (e) {
        console.error("Error importing classes:", e);
        alert(`Error importando: ${e.message}`);
    }
  };

  if (isLoading && !isAuthenticated) return <div className="flex items-center justify-center min-h-screen">Cargando sesión...</div>;
  // Mensaje si no está autenticado y Auth0 ya terminó de cargar:
  if (!isAuthenticated && !isLoading) return (
    <div className="flex min-h-screen w-full bg-gray-100">
      <Sidebar />
      <div className="flex-1 p-8 text-center">
        <p>Por favor, inicia sesión para ver tus clases.</p>
        {/* Aquí podrías añadir un botón de login si tu <App> no lo maneja globalmente */}
      </div>
    </div>
  );
  
  // ... (resto del JSX para mostrar clases, modales, etc. no cambia) ...
  return (
    <div className="flex min-h-screen w-full bg-gray-100">
      <Sidebar />
      <div className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Mis Clases</h1>
          <div className="flex space-x-2">
            {esMaestro && (
              <>
                <button
                  onClick={() => setCreateModalOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md shadow-md flex items-center"
                >
                  <PlusIcon className="h-5 w-5 mr-2" /> Crear Clase
                </button>
                <button
                  onClick={() => setImportModalOpen(true)}
                  className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-md shadow-md flex items-center"
                >
                  <DocumentArrowUpIcon className="h-5 w-5 mr-2" /> Importar Clases
                </button>
              </>
            )}
            {esAlumno && (
                <button
                 onClick={() => setJoinModalOpen(true)}
                 className="bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-md shadow-md flex items-center"
                >
                   <UserPlusIcon className="h-5 w-5 mr-2" /> Unirse a Clase
                </button>
            )}
          </div>
        </header>

        {loadingClasses && <p>Cargando clases...</p>}
        {error && <p className="text-red-500">Error al cargar clases: {error}</p>}

        {!loadingClasses && !error && classes.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {classes.map((cls) => (
              <ClassCard
                key={cls.id}
                name={cls.name}
                teacherName={cls.teacher?.Nombre || cls.teacher?.email || 'N/A'}
                studentCount={cls.students?.length || 0}
                accessCode={cls.accessCode}
                userRole={esMaestro ? 'maestro' : 'alumno'}
              />
            ))}
          </div>
        )}
        {!loadingClasses && !error && classes.length === 0 && (
          <div className="text-center py-10">
            <img src="/empty_classroom.svg" alt="Aula vacía" className="mx-auto h-40 mb-4" />
            <p className="text-gray-600">
              {esMaestro ? "Aún no has creado ninguna clase." : "Aún no te has unido a ninguna clase."}
            </p>
          </div>
        )}
      </div>
      <CreateClassModal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} onCreate={handleCreateClass} />
      <JoinClassModal isOpen={isJoinModalOpen} onClose={() => setJoinModalOpen(false)} onJoin={handleJoinClass} />
      <ImportClassesModal isOpen={isImportModalOpen} onClose={() => setImportModalOpen(false)} onImport={handleImportClasses} />
    </div>
  );
};

export default Clases;