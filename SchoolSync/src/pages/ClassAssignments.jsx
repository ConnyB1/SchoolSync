// proyecto/SchoolSync/src/pages/ClassAssignments.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // FIXED: Importar Link
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';

// Temporary AssignmentForm component (for creating/editing assignments)
const AssignmentForm = ({ assignment = null, onSubmit, onCancel, isLoading }) => {
  const [title, setTitle] = useState(assignment ? assignment.title : '');
  const [description, setDescription] = useState(assignment ? assignment.description : '');
  const [dueDate, setDueDate] = useState(assignment ? assignment.dueDate.split('T')[0] : '');
  const [selectedFile, setSelectedFile] = useState(null); // New state for file input

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('dueDate', dueDate);
    if (selectedFile) {
      formData.append('file', selectedFile); // Append the file to FormData
    }
    onSubmit(formData, assignment ? assignment.id : null); // Pass formData and assignment ID
  };

  return (
    <div className="bg-gray-50 p-6 rounded-lg shadow-inner mb-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">{assignment ? 'Editar Tarea' : 'Crear Nueva Tarea'}</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="assignmentTitle" className="block text-sm font-medium text-gray-700">Título</label>
          <input
            type="text"
            id="assignmentTitle"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="assignmentDescription" className="block text-sm font-medium text-gray-700">Descripción</label>
          <textarea
            id="assignmentDescription"
            rows="3"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          ></textarea>
        </div>
        <div>
          <label htmlFor="assignmentDueDate" className="block text-sm font-medium text-gray-700">Fecha de Entrega</label>
          <input
            type="date"
            id="assignmentDueDate"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="assignmentFile" className="block text-sm font-medium text-gray-700">Adjuntar Archivo (Opcional)</label>
          <input
            type="file"
            id="assignmentFile"
            onChange={handleFileChange}
            className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-md cursor-pointer bg-gray-50 focus:outline-none"
          />
          {selectedFile && <p className="mt-2 text-sm text-gray-500">Archivo seleccionado: {selectedFile.name}</p>}
        </div>
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'Guardando...' : (assignment ? 'Guardar Cambios' : 'Crear Tarea')}
          </button>
        </div>
      </form>
    </div>
  );
};


const ClassAssignments = ({ classId, isTeacher }) => {
  const { token, user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  const fetchAssignments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/assignments/class/${classId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch assignments.');
      }
      const data = await response.json();
      setAssignments(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && classId) {
      fetchAssignments();
    }
  }, [token, classId]);

  const handleCreateAssignment = async (formData) => {
    setFormLoading(true);
    setFormError(null);
    try {
      // Append classId to FormData
      formData.append('classId', classId);

      const response = await fetch(`${API_URL}/assignments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // 'Content-Type': 'multipart/form-data' is set automatically by browser for FormData
        },
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to create assignment.' }));
        throw new Error(errorData.message || 'Failed to create assignment.');
      }
      setShowCreateForm(false);
      await fetchAssignments();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateAssignment = async (formData, assignmentId) => {
    setFormLoading(true);
    setFormError(null);
    try {
      // You might need a separate endpoint or logic for updating files.
      // For simplicity, this this example just updates assignment metadata.
      // If `file` is in formData, you'll need a backend that handles multipart for PATCH.
      const response = await fetch(`${API_URL}/assignments/${assignmentId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          // 'Content-Type' will be automatically set to multipart/form-data if FormData has a file
        },
        body: formData, // Send FormData for updates too
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to update assignment.' }));
        throw new Error(errorData.message || 'Failed to update assignment.');
      }
      setEditingAssignment(null);
      await fetchAssignments();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  // Placeholder for student assignment submission
  const handleStudentSubmitAssignment = (assignmentId) => {
    alert(`Estudiante: Subir/Modificar tarea ${assignmentId} (Funcionalidad pendiente)`);
    // Here you would implement file upload logic and update backend
  };

  // Placeholder for teacher review/grading
  const handleTeacherReviewAssignment = (assignmentId) => {
    alert(`Profesor: Revisar/Calificar tarea ${assignmentId} (Funcionalidad pendiente)`);
    // Here you would implement review/grading logic and update backend
  };


  return (
    <div className="space-y-6">
      {isTeacher && (
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50"
          disabled={showCreateForm || editingAssignment !== null}
        >
          Crear Nueva Tarea
        </button>
      )}

      {showCreateForm && (
        <AssignmentForm
          onSubmit={handleCreateAssignment}
          onCancel={() => { setShowCreateForm(false); setFormError(null); }}
          isLoading={formLoading}
        />
      )}

      {editingAssignment && (
        <AssignmentForm
          assignment={editingAssignment}
          onSubmit={handleUpdateAssignment}
          onCancel={() => { setEditingAssignment(null); setFormError(null); }}
          isLoading={formLoading}
        />
      )}

      {formError && <p className="text-red-500 text-sm">{formError}</p>}

      <h2 className="text-2xl font-semibold text-gray-800">Tareas de la Clase</h2>
      {loading && <p>Cargando tareas...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      {!loading && !error && assignments.length === 0 && (
        <p className="text-gray-600">No hay tareas para esta clase.</p>
      )}
      <div className="space-y-4">
        {assignments.map((assignment) => (
          <div key={assignment.id} className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-bold text-gray-900">{assignment.title}</h3>
            <p className="text-gray-700 mt-2">{assignment.description}</p>
            <p className="text-sm text-gray-500 mt-2">Fecha de Entrega: {new Date(assignment.dueDate).toLocaleDateString()}</p>

            <div className="mt-3 flex space-x-2">
              {isTeacher ? (
                <>
                  {/* FIXED: Botón de editar eliminado, ya que se moverá a una página de detalle de tarea */}
                  {/* <button
                    onClick={() => setEditingAssignment(assignment)}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    Editar
                  </button> */}
                  <button
                    onClick={() => handleTeacherReviewAssignment(assignment.id)}
                    className="px-3 py-1 text-sm bg-purple-500 text-white rounded-md hover:bg-purple-600"
                  >
                    Revisar
                  </button>
                </>
              ) : (
                // FIXED: El botón de "Subir/Modificar Tarea" ahora será un enlace a la página de detalle de la tarea
                <Link
                  to={`/clases/${classId}/tareas/${assignment.id}`} // Enlace a la nueva página
                  className="px-3 py-1 text-sm bg-green-500 text-white rounded-md hover:bg-green-600"
                >
                  Ver/Subir Tarea
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClassAssignments;