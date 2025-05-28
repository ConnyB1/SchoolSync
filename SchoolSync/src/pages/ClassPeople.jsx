// proyecto/SchoolSync/src/pages/ClassPeople.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';

const ClassPeople = ({ classId }) => {
  const { token, user } = useAuth();
  const [people, setPeople] = useState({ teachers: [], students: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchClassPeople = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_URL}/classes/${classId}/members`, { // Assuming an endpoint for class members
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch class members.');
        }
        const data = await response.json();
        // Assuming the backend returns an object with teachers and students arrays
        setPeople({
          teachers: data.teachers || [],
          students: data.students || [],
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (token && classId) {
      fetchClassPeople();
    }
  }, [token, classId]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800">Personas en la Clase</h2>

      {loading && <p>Cargando miembros de la clase...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}

      {!loading && !error && (
        <>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Profesores</h3>
            {people.teachers.length === 0 ? (
              <p className="text-gray-600">No hay profesores en esta clase.</p>
            ) : (
              <ul className="list-disc list-inside space-y-1">
                {people.teachers.map((teacher) => (
                  <li key={teacher.id} className="text-gray-700">
                    {teacher.firstName} {teacher.lastName} ({teacher.email})
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Estudiantes</h3>
            {people.students.length === 0 ? (
              <p className="text-gray-600">No hay estudiantes en esta clase.</p>
            ) : (
              <ul className="list-disc list-inside space-y-1">
                {people.students.map((student) => (
                  <li key={student.id} className="text-gray-700">
                    {student.firstName} {student.lastName} ({student.email})
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ClassPeople;