// proyecto/SchoolSync/src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom'; // Elimina 'BrowserRouter as Router' de aquí
import React from 'react';
import Login from './pages/login';
import Register from './pages/Register';
import Inicio from './pages/inicio';
import Clases from './pages/Clases';
import ClassDetailsPage from './pages/ClassDetailsPage';
import AssignmentDetailPage from './pages/AssignmentDetailPage';
import TeacherAssignmentSubmissionsPage from './pages/TeacherAssignmentSubmissionsPage';
import ChatPage from './pages/ChatPage';
import UserProfile from './pages/UserProfile';
//import AnunciosFeed from './components/AnunciosFeed'
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  const { isAuthenticated, isLoading: authIsLoading, user } = useAuth();

  if (authIsLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="text-xl font-semibold text-gray-700">
          Inicializando aplicación...
        </div>
      </div>
    );
  }

  return (
    // ¡HEMOS ELIMINADO EL <Router> DE AQUÍ!
    <Routes>
      {/* Rutas públicas: accesibles sin autenticación */}
      <Route
        path="/"
        element={!isAuthenticated ? <Login /> : <Navigate to="/inicio" replace />}
      />
      <Route
        path="/register"
        element={!isAuthenticated ? <Register /> : <Navigate to="/inicio" replace />}
      />

      {/* Grupo de rutas protegidas: solo accesibles si el usuario está autenticado */}
      {/* ProtectedRoute actúa como un layout que verifica la autenticación y renderiza el Outlet */}
      <Route element={<ProtectedRoute />}>
        <Route path="/inicio" element={<Inicio />} />
        <Route path="/clases" element={<Clases />} />
        
        {/* ClassDetailsPage ya no tiene rutas anidadas directamente aquí. */}
        {/* Maneja su propia navegación interna con pestañas (activeTab). */}
        <Route path="/clases/:classId" element={<ClassDetailsPage />} />
        
        {/* Rutas de detalle de tareas y entregas, no anidadas bajo ClassDetailsPage */}
        <Route path="/clases/:classId/tareas/:assignmentId" element={<AssignmentDetailPage />} /> 
        
        
        <Route 
          path="/clases/:classId/tareas/:assignmentId/submissions" 
          element={<TeacherAssignmentSubmissionsPage />} 
        />

        {/* Rutas de chat */}
        <Route path="/ChatPage" element={<ChatPage />} /> {/* Ruta general para el chat */}
        <Route path="/ChatPage/:roomId" element={<ChatPage />} /> {/* Ruta para salas de chat específicas */}
        
        {/* Rutas de perfil y anuncios generales */}
        <Route path="/perfil" element={<UserProfile />} />
        {/*</Routes>Route path="/anuncios" element={<AnunciosFeed />} />*/}
      </Route>

      {/* Ruta comodín para manejar rutas no encontradas */}
      <Route path="*" element={<div>Página no encontrada (404)</div>} />
    </Routes>
    // ¡HEMOS ELIMINADO EL <ToastContainer> DE AQUÍ!
  );
}

export default App;