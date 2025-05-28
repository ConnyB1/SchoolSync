// proyecto/SchoolSync/src/pages/Clases.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';
import Sidebar from './sidebar';
import ClassImportForm from '../components/ClassImportForm'; // Keep this import as it's a separate file
import { PlusIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline'; // Import new icons

// --- Componente ClassCard (Defined locally) ---
const ClassCard = ({ name, teacherName, studentCount, accessCode, userRole }) => (
  <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
    <h3 className="text-xl font-semibold text-gray-800 mb-2">{name}</h3>
    <p className="text-gray-600 mb-1">Profesor: {teacherName || 'N/A'}</p>
    <p className="text-gray-600 mb-3">Estudiantes: {studentCount || 0}</p>
    {userRole === 'Profesor' && accessCode && (
      <p className="text-sm text-gray-500">Código de acceso: {accessCode}</p>
    )}
  </div>
);

// --- Componente CreateClassForm (Defined locally) ---
const CreateClassForm = ({ onSubmit, onClose, isLoading }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('El nombre de la clase es obligatorio.');
      return;
    }
    onSubmit({ name, description });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Crear Nueva Clase</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="className" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la Clase <span className="text-red-500">*</span>
            </label>
            <input
              id="className"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Matemáticas Avanzadas"
              className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="classDescription" className="block text-sm font-medium text-gray-700 mb-1">
              Descripción (Opcional)
            </label>
            <textarea
              id="classDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Curso enfocado en cálculo integral y álgebra lineal..."
              rows="3"
              className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? 'Creando...' : 'Crear Clase'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Componente JoinClassForm (Defined locally) ---
const JoinClassForm = ({ onSubmit, onClose, isLoading }) => {
  const [accessCode, setAccessCode] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // APLICAR .trim() AQUÍ ANTES DE ENVIAR
    const trimmedAccessCode = accessCode.trim(); // <--- CAMBIO CLAVE
    if (!trimmedAccessCode) { // Validar después de recortar
      alert('El código de acceso es obligatorio.');
      return;
    }
    onSubmit(trimmedAccessCode); // <--- USAR EL CÓDIGO RECORTADO
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Unirse a una Clase</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="accessCode" className="block text-sm font-medium text-gray-700 mb-1">
              Código de Acceso <span className="text-red-500">*</span>
            </label>
            <input
              id="accessCode"
              type="text"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              placeholder="Ingresa el código de la clase"
              className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
              required
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-teal-500 rounded-md hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50"
            >
              {isLoading ? 'Uniéndose...' : 'Unirse'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


// --- Componente Principal Clases ---
const Clases = () => {
  const { user, isAuthenticated, isLoading: authLoading, token } = useAuth();
  const [classes, setClasses] = useState([]);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setJoinModalOpen] = useState(false);
  const [showImportClassesModal, setShowImportClassesModal] = useState(false); // New state for import modal
  const [pageLoading, setPageLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [operationError, setOperationError] = useState(null); // setOperationError is defined here

  const userRoles = isAuthenticated && user ? user.roles || [] : [];
  const isTeacher = userRoles.includes("Profesor");
  const isStudent = userRoles.includes("Alumno");

  const fetchClasses = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setPageLoading(false);
      setClasses([]);
      return;
    }
    setPageLoading(true);
    setOperationError(null);
    try {
      const response = await fetch(`${API_URL}/classes`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Error HTTP: ${response.status} ${response.statusText}` }));
        throw new Error(errorData.message || `Error HTTP: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      setClasses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching classes:", err);
      setOperationError(err.message);
      setClasses([]);
    } finally {
      setPageLoading(false);
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    if (authLoading) {
        setPageLoading(true);
        return;
    }
    fetchClasses();
  }, [authLoading, fetchClasses]);

  const handleCreateClass = async (classData) => {
    if (!isTeacher) {
      setOperationError("Solo los profesores pueden crear clases.");
      return;
    }
    setActionLoading(true);
    setOperationError(null);
    try {
      if (!token) throw new Error("No autenticado o token no disponible.");
      const response = await fetch(`${API_URL}/classes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(classData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Error HTTP: ${response.status} ${response.statusText}` }));
        throw new Error(errorData.message || `Error HTTP: ${response.status} ${response.statusText}`);
      }
      
      setCreateModalOpen(false);
      fetchClasses();
    } catch (err) {
      console.error("Error creating class:", err);
      setOperationError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinClass = async (accessCode) => { // accessCode ya viene recortado de JoinClassForm
    setActionLoading(true);
    setOperationError(null);
    try {
      if (!token) throw new Error("No autenticado o token no disponible.");
      const response = await fetch(`${API_URL}/classes/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ classCode: accessCode }), // accessCode ya está recortado
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Error HTTP: ${response.status} ${response.statusText}` }));
        throw new Error(errorData.message || `Error HTTP: ${response.status} ${response.statusText}`);
      }
      
      setJoinModalOpen(false);
      fetchClasses();
    } catch (err) {
      console.error("Error joining class:", err);
      setOperationError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleImportClassesSuccess = () => {
    setShowImportClassesModal(false);
    fetchClasses(); // Refresh class list after import
  };


  if (authLoading) {
    return (
      <div className="flex min-h-screen w-full bg-gray-100">
        <Sidebar />
        <div className="flex-1 p-8 text-center">
          <p>Cargando autenticación...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen w-full bg-gray-100">
        <Sidebar />
        <div className="flex-1 p-8 text-center">
          <p className="text-xl text-gray-700">Por favor, inicia sesión para ver y gestionar tus clases.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-gray-100 font-sans">
      <Sidebar />
      <main className="flex-1 p-8">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4 sm:mb-0">Mis Clases</h1>
          <div className="flex space-x-3">
            {isTeacher && (
              <button
                onClick={() => {
                  setOperationError(null); // This is defined in the current scope
                  setCreateModalOpen(true);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md shadow-md transition-colors duration-150 flex items-center"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Crear Clase
              </button>
            )}
            {isStudent && (
              <button
                onClick={() => {
                  setOperationError(null); // This is defined in the current scope
                  setJoinModalOpen(true);
                }}
                className="bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-md shadow-md transition-colors duration-150 flex items-center"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Unirse a Clase
              </button>
            )}
            {isTeacher && ( // Only teachers can see the import button
              <button
                onClick={() => {
                  setOperationError(null); // This is defined in the current scope
                  setShowImportClassesModal(true);
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-md shadow-md transition-colors duration-150 flex items-center"
              >
                <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
                Importar Clases
              </button>
            )}
          </div>
        </header>

        {pageLoading && (
          <div className="text-center py-10">
            <p className="text-lg text-gray-600">Cargando clases...</p>
          </div>
        )}

        {operationError && !actionLoading && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{operationError}</span>
          </div>
        )}

        {!pageLoading && !operationError && classes.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {classes.map((cls) => (
              <Link to={`/clases/${cls.id}`} key={cls.id}>
                <ClassCard
                  name={cls.name}
                  teacherName={cls.teacher?.firstName ? `${cls.teacher.firstName} ${cls.teacher.lastName || ''}`.trim() : 'N/A'}
                  studentCount={cls.studentEnrollments?.length || 0}
                  accessCode={cls.classCode}
                  userRole={isTeacher ? 'Profesor' : isStudent ? 'Alumno' : ''}
                />
              </Link>
            ))}
          </div>
        )}

        {!pageLoading && !operationError && classes.length === 0 && (
          <div className="text-center py-16">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9.75 21H3.75A1.75 1.75 0 012 19.25V4.75A1.75 1.75 0 013.75 3h10.5A1.75 1.75 0 0116 4.75v5.5M14 14.5l1.04-1.04a1.75 1.75 0 012.478 0l.96.96M19 18v1.25A1.75 1.75 0 0117.25 21h-3.5M19 18h1.25a1.75 1.75 0 001.75-1.75v-1.5a1.75 1.75 0 00-1.75-1.75H19M19 18v-2.25m0 0a1.75 1.75 0 00-1.75-1.75h-1.5A1.75 1.75 0 0014 15.75v1.5c0 .414.168.789.439 1.061"
              />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              {isTeacher ? "Aún no has creado ninguna clase" : "Aún no estás en ninguna clase"}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {isTeacher ? "Comienza creando tu primera clase para organizar tus cursos y alumnos." : "Únete a una clase usando un código de acceso o espera a que te asignen."}
            </p>
          </div>
        )}

        {isCreateModalOpen && (
          <CreateClassForm
            onSubmit={handleCreateClass}
            onClose={() => {
              setCreateModalOpen(false);
              setOperationError(null);
            }}
            isLoading={actionLoading}
          />
        )}

        {isJoinModalOpen && (
          <JoinClassForm
            onSubmit={handleJoinClass}
            onClose={() => {
              setJoinModalOpen(false);
              setOperationError(null);
            }}
            isLoading={actionLoading}
          />
        )}
        {showImportClassesModal && (
          <ClassImportForm
            onClose={() => setShowImportClassesModal(false)}
            onImportSuccess={handleImportClassesSuccess}
          />
        )}
      </main>
    </div>
  );
};

export default Clases;