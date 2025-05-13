import { useAuth0 } from '@auth0/auth0-react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/login';
import Inicio from './pages/inicio';
import Clases from './pages/Clases';
const namespace = "https://thebigmou.us.auth0.com/"; // O el namespace que uses para roles

function App() {
  const { isAuthenticated, user, isLoading } = useAuth0();

  if (isLoading) return <div>Cargando...</div>;

  const userRoles = isAuthenticated && user ? user[`${namespace}roles`] || [] : [];
  const esAdmin = userRoles.includes('admin');
  const esMaestro = userRoles.includes('maestro');
  const esAlumno = userRoles.includes('alumno');

  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/clases" element={<Clases />} />
      <Route path="/inicio" element={
        isAuthenticated ? <Inicio esAdmin={esAdmin} esMaestro={esMaestro} esAlumno={esAlumno} /> : <Navigate to="/" />
      } />
      
      
    </Routes>
  );
}

export default App;