import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './sidebar';
import { API_URL } from '../config';

const AssignmentDetailPage = () => {
  const { classId, assignmentId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [assignment, setAssignment] = useState(null);
  const [loadingAssignment, setLoadingAssignment] = useState(true);
  const [assignmentError, setAssignmentError] = useState(null);

  const [submissionFile, setSubmissionFile] = useState(null);
  const [submissionMessage, setSubmissionMessage] = useState('');
  const [loadingSubmission, setLoadingSubmission] = useState(false);
  const [submissionError, setSubmissionError] = useState(null);
  const [submissionSuccess, setSubmissionSuccess] = useState(null);

  const isTeacherOfClass = user && assignment && assignment.teacher?.id === user?.id;
  const isStudentOfClass = user && assignment && !isTeacherOfClass;

  useEffect(() => {
    const fetchAssignment = async () => {
      setLoadingAssignment(true);
      setAssignmentError(null);
      try {
        const response = await fetch(`${API_URL}/assignments/${assignmentId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Error desconocido al cargar la tarea.' }));
          throw new Error(errorData.message || `Error al cargar la tarea: ${response.status}`);
        }
        const data = await response.json();
        setAssignment(data);
      } catch (err) {
        console.error("Error fetching assignment:", err);
        setAssignmentError(err.message);
      } finally {
        setLoadingAssignment(false);
      }
    };

    if (token && classId && assignmentId) {
      fetchAssignment();
    }
  }, [token, classId, assignmentId]);

  const handleFileChange = (e) => {
    setSubmissionFile(e.target.files[0]);
    setSubmissionError(null);
    setSubmissionSuccess(null);
  };

  const handleSubmitAssignment = async (e) => {
    e.preventDefault();
    if (!submissionFile) {
      setSubmissionError('Por favor, selecciona un archivo para subir.');
      return;
    }

    setLoadingSubmission(true);
    setSubmissionError(null);
    setSubmissionSuccess(null);

    const formData = new FormData();
    formData.append('file', submissionFile);
    formData.append('message', submissionMessage);
    try {
      const response = await fetch(`${API_URL}/assignments/${assignment.id}/submit`, { // Endpoint de ejemplo
        method: 'POST', 
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido.' }));
        throw new Error(errorData.message || `Error al subir la tarea: ${response.status}`);
      }

      setSubmissionSuccess('Tarea enviada exitosamente.');
      setSubmissionFile(null);
      setSubmissionMessage('');
    } catch (err) {
      setSubmissionError(err.message);
    } finally {
      setLoadingSubmission(false);
    }
  };

  if (loadingAssignment) return <div className="p-4 text-center">Cargando detalles de la tarea...</div>;
  if (assignmentError) return <div className="p-4 text-center text-red-500">Error: {assignmentError}</div>;
  if (!assignment) return <div className="p-4 text-center">Tarea no encontrada o no tienes acceso.</div>;

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-8 bg-white shadow-md rounded-lg mx-4 my-4 overflow-y-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate(`/clases/${classId}`)}
            className="mb-4 px-4 py-2 bg-gray-200 text-white rounded-md hover:bg-gray-300"
          >
            &larr; Volver a la Clase
          </button>
          <h1 className="text-7xl font-bold text-gray-800">{assignment.title}</h1>
          <p className="text-3xl text-gray-600 mt-2">{assignment.description}</p>
          <p className="text-2xl  text-gray-500 mt-2">Fecha de Entrega: {new Date(assignment.dueDate).toLocaleDateString()}</p>
          <p className="text-2xl text-gray-500">
            Publicado por: {assignment.teacher?.firstName} {assignment.teacher?.lastName}
          </p>
          {assignment.assignmentFileUrl && (
            <div className="mt-4">
              <h3 className="font-semibold text-lg text-gray-700">Archivo Adjunto:</h3>
              <a 
                href={assignment.assignmentFileUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-600 text-lg hover:underline"
              >
                Descargar {assignment.assignmentFileUrl.split('/').pop()}
              </a>
            </div>
          )}
        </div>

        {isStudentOfClass && (
          <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Subir/Modificar Entrega</h2>
            <form onSubmit={handleSubmitAssignment} className="space-y-4">
              <div>
                <label htmlFor="submissionFile" className="block text-sm font-medium text-gray-700">
                  Archivo de Entrega
                </label>
                <input
                  type="file"
                  id="submissionFile"
                  onChange={handleFileChange}
                  className="text-lg mt-1 block w-full  text-gray-900 border border-gray-300 rounded-md cursor-pointer bg-gray-50 focus:outline-none"
                  required
                />
                {submissionFile && <p className="mt-2 text-sm text-gray-500">Archivo seleccionado: {submissionFile.name}</p>}
              </div>
              <div>
                <label htmlFor="submissionMessage" className="text-lg block font-medium text-gray-700">
                  Mensaje
                </label>
                <textarea
                  id="submissionMessage"
                  rows="3"
                  value={submissionMessage}
                  onChange={(e) => setSubmissionMessage(e.target.value)}
                  className="text-lg mt-1 block w-full px-3 py-2 border text-gray-700 border-gray-300 rounded-md shadow-sm"
                ></textarea>
              </div>
              {submissionError && <p className="text-red-500 text-sm">{submissionError}</p>}
              {submissionSuccess && <p className="text-green-600 text-sm">{submissionSuccess}</p>}
              <button
                type="submit"
                className="px-4 py-2 text-lg bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50"
                disabled={loadingSubmission}
              >
                {loadingSubmission ? 'Subiendo...' : 'Enviar Tarea'}
              </button>
            </form>
          </div>
        )}

        {isTeacherOfClass && (
          <div className="bg-gray-50 p-6 rounded-lg shadow-inner mt-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Entregas de Alumnos</h2>
            <p className="text-gray-600">Aquí se mostrarán las entregas de los alumnos y las opciones para calificar.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default AssignmentDetailPage;