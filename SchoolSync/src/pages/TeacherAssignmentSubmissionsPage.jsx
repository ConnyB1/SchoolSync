// proyecto/SchoolSync/src/pages/TeacherAssignmentSubmissionsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';
import Sidebar from './sidebar';
import { AcademicCapIcon, DocumentTextIcon, UserIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const TeacherAssignmentSubmissionsPage = () => {
  const { classId, assignmentId } = useParams();
  const { token, isAuthenticated, user } = useAuth();
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gradeInput, setGradeInput] = useState({}); // Almacena calificaciones por submissionId
  const [feedbackInput, setFeedbackInput] = useState({}); // Almacena comentarios por submissionId
  const [gradingLoading, setGradingLoading] = useState({}); // Estado de carga para cada acción de calificación

  const isTeacherOrAdmin = user?.roles.includes("Profesor") || user?.roles.includes("Admin");

  const fetchAssignmentAndSubmissions = useCallback(async () => {
    if (!isAuthenticated || !token || !isTeacherOrAdmin) {
      setLoading(false);
      setError("No autorizado para ver esta página.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // 1. Obtener detalles de la tarea (si es necesario)
      const assignmentResponse = await fetch(`${API_URL}/assignments/${assignmentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!assignmentResponse.ok) {
        const errData = await assignmentResponse.json();
        throw new Error(errData.message || 'Error al cargar los detalles de la tarea.');
      }
      const assignmentData = await assignmentResponse.json();
      setAssignment(assignmentData);

      // 2. Obtener todas las entregas para esta tarea
      const submissionsResponse = await fetch(`${API_URL}/assignments/${assignmentId}/submissions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!submissionsResponse.ok) {
        const errData = await submissionsResponse.json();
        throw new Error(errData.message || 'Error al cargar las entregas.');
      }
      const submissionsData = await submissionsResponse.json();
      setSubmissions(submissionsData);

      // Inicializar los inputs de calificación y comentarios
      const initialGradeInputs = {};
      const initialFeedbackInputs = {};
      submissionsData.forEach(submission => {
        initialGradeInputs[submission.id] = submission.grade || '';
        initialFeedbackInputs[submission.id] = submission.feedback || '';
      });
      setGradeInput(initialGradeInputs);
      setFeedbackInput(initialFeedbackInputs);

    } catch (err) {
      console.error("Error fetching assignment or submissions:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [assignmentId, isAuthenticated, token, isTeacherOrAdmin]);

  useEffect(() => {
    fetchAssignmentAndSubmissions();
  }, [fetchAssignmentAndSubmissions]);

  const handleGradeChange = (submissionId, value) => {
    setGradeInput(prev => ({ ...prev, [submissionId]: value }));
  };

  const handleFeedbackChange = (submissionId, value) => {
    setFeedbackInput(prev => ({ ...prev, [submissionId]: value }));
  };

  const submitGrade = async (submissionId) => {
    const grade = parseFloat(gradeInput[submissionId]);
    const feedback = feedbackInput[submissionId];

    if (isNaN(grade) || grade < 1 || grade > 100) {
      setError("La calificación debe ser un número entre 1 y 100.");
      return;
    }

    setGradingLoading(prev => ({ ...prev, [submissionId]: true }));
    setError(null);
    try {
      const response = await fetch(`${API_URL}/assignments/submissions/${submissionId}/grade`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ grade, feedback }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Error al calificar la entrega.');
      }

      // Actualizar el estado de la entrega específica con la nueva calificación/comentarios
      const updatedSubmission = await response.json();
      setSubmissions(prevSubmissions => 
        prevSubmissions.map(sub => sub.id === updatedSubmission.id ? updatedSubmission : sub)
      );
      alert('Calificación guardada exitosamente!'); // Puedes reemplazar esto con un toast

    } catch (err) {
      console.error("Error submitting grade:", err);
      setError(err.message);
      alert(`Error al calificar: ${err.message}`); // Puedes reemplazar esto con un toast
    } finally {
      setGradingLoading(prev => ({ ...prev, [submissionId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen w-full bg-gray-100">
        <Sidebar />
        <div className="flex-1 p-8 text-center">
          <p className="text-lg text-gray-600">Cargando entregas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen w-full bg-gray-100">
        <Sidebar />
        <div className="flex-1 p-8 text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isTeacherOrAdmin) {
    return (
      <div className="flex min-h-screen w-full bg-gray-100">
        <Sidebar />
        <div className="flex-1 p-8 text-center">
          <p className="text-xl text-gray-700">No tienes permiso para ver esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-gray-100 font-sans">
      <Sidebar />
      <main className="flex-1 p-8">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4 sm:mb-0">
            Entregas de Tarea: {assignment?.title}
          </h1>
          <p className="text-gray-600">
            Clase: {assignment?.class?.name}
          </p>
          <Link 
            to={`/clases/${classId}/assignments`} 
            className="ml-auto bg-gray-200 hover:bg-gray-300 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-150"
          >
            Volver a Tareas
          </Link>
        </header>

        {submissions.length === 0 ? (
          <div className="text-center py-16">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              Aún no hay entregas para esta tarea.
            </h3>
          </div>
        ) : (
          <div className="space-y-6">
            {submissions.map((submission) => (
              <div key={submission.id} className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <div className="flex items-center mb-4">
                  <UserIcon className="h-6 w-6 text-gray-500 mr-3" />
                  <h3 className="text-xl font-semibold text-gray-800">
                    {submission.student?.firstName} {submission.student?.lastName}
                  </h3>
                  {submission.grade !== null && (
                    <span className={`ml-auto px-3 py-1 rounded-full text-sm font-bold ${
                      submission.grade >= 70 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      Calificación: {submission.grade}/100
                    </span>
                  )}
                </div>
                <p className="text-gray-600 mb-2">
                  <span className="font-medium">Fecha de Entrega:</span>{' '}
                  {new Date(submission.submissionDate).toLocaleString()}
                </p>

                {/* Descripción de la tarea (se toma del estado `assignment`) */}
                {assignment?.description && (
                  <p className="text-gray-700 mb-4">
                    <span className="font-medium">Descripción de la Tarea:</span> {assignment.description}
                  </p>
                )}

                {submission.filePath && (
                  <div className="mb-4">
                    <span className="font-medium text-gray-700 block mb-1">Archivo Subido:</span>
                    <a
                      href={`${API_URL}/uploads/${submission.filePath}`} // Usar la URL correcta para archivos estáticos
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center"
                    >
                      <DocumentTextIcon className="h-5 w-5 mr-2" />
                      Descargar Archivo ({submission.filePath.split('/').pop()})
                    </a>
                  </div>
                )}
                
                {/* Sección de Calificación */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">Calificar Entrega</h4>
                  <div className="mb-3">
                    <label htmlFor={`grade-${submission.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                      Calificación (1-100)
                    </label>
                    <input
                      id={`grade-${submission.id}`}
                      type="number"
                      min="1"
                      max="100"
                      value={gradeInput[submission.id] || ''}
                      onChange={(e) => handleGradeChange(submission.id, e.target.value)}
                      className="w-full sm:w-32 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Ej: 85"
                    />
                  </div>
                  <div className="mb-4">
                    <label htmlFor={`feedback-${submission.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                      Comentarios
                    </label>
                    <textarea
                      id={`feedback-${submission.id}`}
                      rows="3"
                      value={feedbackInput[submission.id] || ''}
                      onChange={(e) => handleFeedbackChange(submission.id, e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Añade comentarios sobre la entrega..."
                    ></textarea>
                  </div>
                  <button
                    onClick={() => submitGrade(submission.id)}
                    disabled={gradingLoading[submission.id]}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    {gradingLoading[submission.id] ? 'Guardando...' : 'Guardar Calificación'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default TeacherAssignmentSubmissionsPage;