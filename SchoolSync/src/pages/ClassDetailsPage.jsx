// proyecto/SchoolSync/src/pages/ClassDetailsPage.jsx (SIN CAMBIOS)
import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { API_URL } from '../config';
import Sidebar from './sidebar';
import ClassAnnouncements from './ClassAnnouncements';
import ClassAssignments from './ClassAssignments';
import ClassPeople from './ClassPeople';
import {Tabs, Tab, Card, CardBody} from "@heroui/react";


const classTabs = [
  {
    id: "anuncios",
    label: "Anuncios",
    content: (classId, isTeacherOfClass) => (
      <ClassAnnouncements classId={classId} isTeacher={isTeacherOfClass} />
    ),
  },
  {
    id: "tareas",
    label: "Tareas",
    content: (classId, isTeacherOfClass) => (
      <ClassAssignments classId={classId} isTeacher={isTeacherOfClass} />
    ),
  },
  {
    id: "personas",
    label: "Personas",
    content: (classId) => (
      <ClassPeople classId={classId} />
    ),
  },
];
function ClassDetailsPage() {
  const { classId } = useParams();
  const { token, user } = useContext(AuthContext);
  const [classDetails, setClassDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('anuncios');

  useEffect(() => {
    const fetchClassDetails = async () => {
      if (!token || !classId) {
        setLoading(false);
        if (!classId) setError("ID de clase no encontrado en la URL.");
        return;
      }
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/classes/${classId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: "Error desconocido al obtener detalles de la clase." }));
          throw new Error(errorData.message || `Error al cargar la clase: ${response.status}`);
        }
        const data = await response.json();
        setClassDetails(data);
        setError('');
      } catch (err) {
        console.error("Error fetching class details:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchClassDetails();
  }, [classId, token]);

  const isTeacherOfClass = user && classDetails && classDetails.teacher?.id === user?.id;
  // Acceder a enrollment.user?.id para verificar si el usuario está matriculado
  const isStudentOfClass = user && classDetails && classDetails.studentEnrollments
    ?.filter(Boolean)
    .some(enrollment => enrollment.user?.id === user?.id);

  const canManageClass = isTeacherOfClass || user?.roles.includes('Administrador'); 


  if (loading) return <div className="p-4 text-center">Cargando detalles de la clase...</div>;
  if (error) return <div className="p-4 text-center text-red-500">Error: {error}</div>;
  if (!classDetails) return <div className="p-4 text-center">No se encontraron detalles de la clase. Puede que el ID sea incorrecto o no tengas acceso.</div>;


  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-8 bg-white shadow-md rounded-lg mx-4 my-4 overflow-y-auto">
        {
          <>
            <div className="dark:bg-gray-800 text-white p-6 rounded-lg shadow-md mb-6">
              <h1 className="text-3xl font-bold">{classDetails.name}</h1>
              <p className="text-lg">{classDetails.description || 'Sin descripción.'}</p>
              {classDetails.teacher && (
                <p className="mt-2">Profesor: {classDetails.teacher.firstName} {classDetails.teacher.lastName}</p>
              )}
              <p className="mt-1 text-sm">Código de clase: {classDetails.classCode}</p>
            </div>

            <div className="mb-6 border-b border-gray-300">
              <Tabs
                aria-label="Tabs de clase"
                selectedKey={activeTab}
                onSelectionChange={setActiveTab}
                items={classTabs}
              >
                {(item) => (
                  <Tab key={item.id} title={item.label}>
                    <Card>
                      <CardBody>
                        {item.id === "personas"
                          ? item.content(classId)
                          : item.content(classId, isTeacherOfClass)}
                      </CardBody>
                    </Card>
                  </Tab>
                )}
              </Tabs>
            </div>
          
          </>
        }
      </main>
    </div>
  );
}

export default ClassDetailsPage;