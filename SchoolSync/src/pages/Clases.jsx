import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import Sidebar from './sidebar';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const ClassCard = ({ name, teacherName, studentCount, accessCode, userRole }) => (
  <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
    <h3 className="text-xl font-semibold text-gray-800 mb-2">{name}</h3>
    <p className="text-gray-600 mb-1">Profesor: {teacherName}</p>
    <p className="text-gray-600 mb-3">Estudiantes: {studentCount}</p>
    {userRole === 'Profesor' && (
      <p className="text-sm text-gray-500">Código de acceso: {accessCode}</p>
    )}
  </div>
);

const CreateClassForm = ({ onSubmit, onClose }) => {
  const [className, setClassName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ name: className });
    setClassName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-96">
        <h2 className="text-2xl font-bold mb-4">Crear Nueva Clase</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            placeholder="Nombre de la clase"
            className="w-full p-2 border rounded mb-4"
            required
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Crear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const JoinClassForm = ({ onSubmit, onClose }) => {
  const [accessCode, setAccessCode] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(accessCode);
    setAccessCode('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-96">
        <h2 className="text-2xl font-bold mb-4">Unirse a una Clase</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value)}
            placeholder="Código de acceso"
            className="w-full p-2 border rounded mb-4"
            required
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600"
            >
              Unirse
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Clases = () => {
  const { user, isAuthenticated, getAccessTokenSilently } = useAuth0();
  const [classes, setClasses] = useState([]);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setJoinModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const namespace = 'https://schoolsync.example.com/';
  const userRoles = isAuthenticated && user ? user[`${namespace}roles`] || [] : [];
  const isTeacher = userRoles.includes('Profesor');
  const isStudent = userRoles.includes('Alumno');
  const isParent = userRoles.includes('Padre');

  const fetchClasses = async () => {
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`${API_URL}/classes`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      const data = await response.json();
      setClasses(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchClasses();
    }
  }, [isAuthenticated]);

  const handleCreateClass = async (classData) => {
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`${API_URL}/classes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(classData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      fetchClasses();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleJoinClass = async (accessCode) => {
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`${API_URL}/classes/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ accessCode })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      fetchClasses();
    } catch (error) {
      setError(error.message);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen w-full bg-gray-100">
        <Sidebar />
        <div className="flex-1 p-8 text-center">
          <p>Por favor, inicia sesión para ver tus clases.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-gray-100">
      <Sidebar />
      <div className="flex-1 p-8">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Mis Clases</h1>
          <div className="flex space-x-2">
            {isTeacher && (
              <button
                onClick={() => setCreateModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md shadow-md flex items-center"
              >
                <span className="mr-2">+</span> Crear Clase
              </button>
            )}
            {(isStudent || isParent) && (
              <button
                onClick={() => setJoinModalOpen(true)}
                className="bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-md shadow-md flex items-center"
              >
                <span className="mr-2">+</span> Unirse a Clase
              </button>
            )}
          </div>
        </header>

        {loading && <p>Cargando clases...</p>}
        {error && <p className="text-red-500">Error: {error}</p>}

        {!loading && !error && classes.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {classes.map((cls) => (
              <ClassCard
                key={cls.id}
                name={cls.name}
                teacherName={cls.teacher?.name || 'N/A'}
                studentCount={cls.students?.length || 0}
                accessCode={cls.accessCode}
                userRole={isTeacher ? 'Profesor' : isStudent ? 'Alumno' : 'Padre'}
              />
            ))}
          </div>
        )}

        {!loading && !error && classes.length === 0 && (
          <div className="text-center py-10">
            <p className="text-gray-600">
              {isTeacher 
                ? "Aún no has creado ninguna clase." 
                : "Aún no te has unido a ninguna clase."}
            </p>
          </div>
        )}

        {isCreateModalOpen && (
          <CreateClassForm 
            onSubmit={handleCreateClass}
            onClose={() => setCreateModalOpen(false)}
          />
        )}

        {isJoinModalOpen && (
          <JoinClassForm
            onSubmit={handleJoinClass}
            onClose={() => setJoinModalOpen(false)}
          />
        )}
      </div>
    </div>
  );
};

export default Clases;