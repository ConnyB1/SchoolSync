// proyecto/SchoolSync/src/pages/ClassAssignments.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';
import { DatePicker } from "@heroui/react"; // Importar DatePicker de HeroUI
import { parseDate, today, getLocalTimeZone } from '@internationalized/date'; // Importar utilidades de fecha

// Componente para el formulario de creación/edición de tareas
const AssignmentForm = ({ assignment = null, onSubmit, onCancel, isLoading }) => {
  const [title, setTitle] = useState(assignment ? assignment.title : '');
  const [description, setDescription] = useState(assignment ? assignment.description : '');
  
  // dueDate state sigue almacenando la fecha como 'YYYY-MM-DD' o string vacío
  const [dueDate, setDueDate] = useState(() => {
    if (assignment && assignment.dueDate) {
      try {
        // Validar que assignment.dueDate sea un string YYYY-MM-DD antes de parsear
        if (typeof assignment.dueDate === 'string' && assignment.dueDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const dateObj = parseDate(assignment.dueDate); // Usar parseDate para coherencia
          return dateObj.toString(); // Almacenar como YYYY-MM-DD
        }
      } catch (e) {
        console.error("Error parsing dueDate for form initialization:", assignment.dueDate, e);
      }
    }
    return ''; // Default a vacío si no hay fecha o es inválida
  });

  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('dueDate', dueDate); // Se envía como YYYY-MM-DD
    if (selectedFile) {
      formData.append('file', selectedFile);
    }
    onSubmit(formData, assignment ? assignment.id : null);
  };

  // --- Funciones para manejar la conversión de fechas para HeroUI DatePicker ---
  // Convierte 'YYYY-MM-DD' string a objeto CalendarDate de @internationalized/date
  const stringToCalendarDate = (dateString) => {
    if (!dateString) return null;
    try {
      return parseDate(dateString);
    } catch (error) {
      console.error("Error parsing date string to CalendarDate:", dateString, error);
      return null;
    }
  };

  // Convierte objeto CalendarDate (o similar de @internationalized/date) a 'YYYY-MM-DD' string
  const calendarDateToString = (dateObj) => {
    if (!dateObj) return '';
    // El objeto DateValue de @internationalized/date tiene un método toString()
    // que devuelve el formato 'YYYY-MM-DD'.
    try {
      return dateObj.toString();
    } catch (error) {
      console.error("Error converting CalendarDate to string:", dateObj, error);
      return '';
    }
  };
  // --- Fin de funciones de conversión ---

  return (
    <div className="bg-gray-50 p-6 rounded-lg shadow-inner mb-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">{assignment ? 'Editar Tarea' : 'Crear Nueva Tarea'}</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="assignmentTitle" className="block text-sm font-medium text-gray-700">Título</label>
          <input
            type="text"
            id="assignmentTitle"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="assignmentDescription" className=" text-gray-900 block text-sm font-medium ">Descripción</label>
          <textarea
            id="assignmentDescription"
            rows="3"
            className="mt-1 block w-full px-3 py-2 border text-gray-900 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          ></textarea>
        </div>
        
        <div>
          <DatePicker
            label="Fecha de Entrega (YYYY-MM-DD)"
            value={stringToCalendarDate(dueDate)}
            onChange={(newDateObj) => setDueDate(calendarDateToString(newDateObj))}
            isRequired
            minValue={today(getLocalTimeZone())}
            placeholderValue={today(getLocalTimeZone())}
            className="w-full bg-white" 
            classNames={{
              label: "text-gray-900", 
              inputWrapper: "bg-white  text-gray-900 ", 
              input: "text-gray-900 placeholder-gray-500 dark:placeholder-gray-400", 
              button: "text-white bg-white hover:bg-gray-200 p-2 rounded-md",
              popoverContent: "bg-white  text-gray-900 shadow-lg rounded-lg",
              calendarHeaderButton: "bg-white rounded text-gray-900", 
            }}
            
            popoverProps={{
              className: "shadow-lg rounded-lg"
            }}
          />
        </div>

        <div>
          <label htmlFor="assignmentFile" className="block text-sm font-medium text-gray-700">Adjuntar Archivo (Opcional)</label>
          <input
            type="file"
            id="assignmentFile"
            onChange={handleFileChange}
            className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-md cursor-pointer bg-gray-50 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
          {selectedFile && <p className="mt-2 text-sm text-gray-500">Archivo seleccionado: {selectedFile.name}</p>}
        </div>
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-white bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={isLoading}
          >
            {isLoading ? 'Guardando...' : (assignment ? 'Guardar Cambios' : 'Crear Tarea')}
          </button>
        </div>
      </form>
    </div>
  );
};


const ClassAssignments = () => {
  const { classId } = useParams();
  const { token, user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  // Corrección para verificar roles como array
  const isTeacherOrAdmin = user?.roles?.includes("Profesor") || user?.roles?.includes("Admin");

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/assignments/class/${classId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'No se pudieron cargar las tareas.' }));
        throw new Error(errorData.message || 'No se pudieron cargar las tareas.');
      }
      const data = await response.json();
      setAssignments(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, classId]);

  useEffect(() => {
    if (token && classId) {
      fetchAssignments();
    }
  }, [fetchAssignments, token, classId]);

  const handleCreateAssignment = async (formData) => {
    setFormLoading(true);
    setFormError(null);
    try {
      formData.append('classId', classId);

      const response = await fetch(`${API_URL}/assignments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // No 'Content-Type': 'multipart/form-data' aquí; el navegador lo establece con el boundary correcto para FormData
        },
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error al crear la tarea.' }));
        throw new Error(errorData.message || 'Error al crear la tarea.');
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
      const response = await fetch(`${API_URL}/assignments/${assignmentId}`, {
        method: 'PATCH', // O 'PUT' dependiendo de tu API para actualizaciones con FormData
        headers: {
          'Authorization': `Bearer ${token}`,
          // No 'Content-Type' aquí tampoco
        },
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error al actualizar la tarea.' }));
        throw new Error(errorData.message || 'Error al actualizar la tarea.');
      }
      setEditingAssignment(null);
      await fetchAssignments();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
      return;
    }
    try {
      const response = await fetch(`${API_URL}/assignments/${assignmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error al eliminar la tarea.' }));
        throw new Error(errorData.message || 'Error al eliminar la tarea.');
      }
      await fetchAssignments();
    } catch (err) {
      setError(err.message); 
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha no especificada';
    try {
      // Asumimos que dateString es 'YYYY-MM-DD'
      // Necesitamos añadir la hora para que new Date() no tenga problemas de zona horaria al convertir solo fecha.
      // O mejor, parsear con @internationalized/date para consistencia si se muestra.
      // Para toLocaleDateString, es más seguro construir el objeto Date con la zona horaria local implícita.
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(year, month - 1, day); // Mes es 0-indexado

      if (isNaN(date.getTime())) {
        return 'Fecha inválida';
      }
      return date.toLocaleDateString('es-ES', { 
        year: 'numeric', month: 'long', day: 'numeric' 
      });
    } catch (e) {
      console.error("Error formatting date:", dateString, e);
      return 'Error en fecha';
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">Tareas de la Clase</h2>
        {isTeacherOrAdmin && (
          <button
            onClick={() => { setShowCreateForm(true); setEditingAssignment(null); setFormError(null); }}
            className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-70"
            disabled={showCreateForm || editingAssignment !== null}
          >
            Crear / Subir Tarea
          </button>
        )}
      </div>
      
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

      {formError && <p className="my-3 text-center text-red-600 bg-red-100 p-3 rounded-md">{formError}</p>}

      {loading && <p className="text-center text-gray-600">Cargando tareas...</p>}
      {error && !loading && <p className="text-center text-red-600 bg-red-100 p-3 rounded-md">Error: {error}</p>}
      
      {!loading && !error && assignments.length === 0 && (
        <div className="text-center py-10">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay tareas</h3>
          <p className="mt-1 text-sm text-gray-500">
            {isTeacherOrAdmin ? "Comienza creando una nueva tarea." : "Aún no hay tareas asignadas para esta clase."}
          </p>
        </div>
      )}

      {!loading && !error && assignments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments.map((assignment) => (
            <div key={assignment.id} className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 flex flex-col justify-between">
              <div>
                <h3 className="text-3xl font-bold text-gray-900 mb-2">{assignment.title}</h3>
                <p className="text-base text-gray-900 mb-3 line-clamp-3">{assignment.description}</p>
                {assignment.fileUrl && (
                  <p className="text-base text-gray-900 mb-1">
                    Archivo adjunto: <a href={`${API_URL}${assignment.fileUrl}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 hover:underline font-medium">Ver archivo</a>
                  </p>
                )}
                <p className="text-base text-gray-900 mb-3">
                  Fecha de Entrega: <span className="text-base font-medium text-gray-900">{formatDate(assignment.dueDate)}</span>
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                {isTeacherOrAdmin ? (
                  <div className="flex flex-wrap gap-2 justify-start">
                    <button
                      onClick={() => { setEditingAssignment(assignment); setShowCreateForm(false); setFormError(null); }}
                      className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Editar
                    </button>
                    
                    <button
                      onClick={() => handleDeleteAssignment(assignment.id)}
                      className="px-4 py-2 text-xs font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                      Eliminar
                    </button>
                  </div>
                ) : (
                  <Link
                  to={`/clases/${classId}/tareas/${assignment.id}`}
                  className="relative group inline-block p-px font-semibold leading-6 text-white bg-gray-800 shadow-2xl cursor-pointer rounded-xl shadow-zinc-900 transition-transform duration-300 ease-in-out hover:scale-105 active:scale-95"
                >
                  <span
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-teal-400 via-blue-500 to-purple-500 p-[2px] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  ></span>
                  <span className="relative z-10 block px-6 py-3 rounded-xl bg-gray-950">
                    <div className="relative z-10 flex items-center space-x-2">
                      <span className="transition-all text-white text-w duration-500 group-hover:translate-x-1">
                        Ver/Subir Tarea
                      </span>
                      <svg
                        className="w-6 h-6 transition-transform duration-500 group-hover:translate-x-1"
                        aria-hidden="true"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          clipRule="evenodd"
                          d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
                          fillRule="evenodd"
                        ></path>
                      </svg>
                    </div>
                  </span>
                </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClassAssignments;