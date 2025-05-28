import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/login'; 
import Register from './pages/Register'; 
import Inicio from './pages/inicio'; 
import Clases from './pages/Clases'; 
import UserProfile from './pages/UserProfile';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ChatPage from './pages/ChatPage';
import ClassDetailsPage from './pages/ClassDetailsPage'; 
import AssignmentDetailPage from './pages/AssignmentDetailPage';

function App() {
  const { isAuthenticated, isLoading: authIsLoading } = useAuth();

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
    <Routes>
      <Route
        path="/"
        element={!isAuthenticated ? <Login /> : <Navigate to="/inicio" replace />}
      />
      <Route
        path="/register"
        element={!isAuthenticated ? <Register /> : <Navigate to="/inicio" replace />}
      />
      <Route element={<ProtectedRoute />}>
      <Route path="/inicio" element={<ProtectedRoute><Inicio /></ProtectedRoute>} />
      <Route path="/clases" element={<ProtectedRoute><Clases /></ProtectedRoute>} />
      <Route path="/clases/:classId" element={<ProtectedRoute><ClassDetailsPage /></ProtectedRoute>} />
      <Route path="/clases/:classId/tareas/:assignmentId" element={<AssignmentDetailPage />} /> 
      <Route path="/perfil" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
      <Route path="/ChatPage" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
      <Route path="/chat/:roomId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<div>Página no encontrada (404)</div>} />
    </Routes>
  );
}

export default App;