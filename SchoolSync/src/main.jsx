// proyecto/SchoolSync/src/main.jsx
import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext';
import { ToastContainer } from 'react-toastify'; // Importa ToastContainer aquí
import 'react-toastify/dist/ReactToastify.css'; // Importa los estilos de Toastify aquí

const rootElement = document.getElementById('root');
const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <BrowserRouter> {/* Este es el ÚNICO Router en toda tu aplicación */}
      <AuthProvider> 
        <App />
      </AuthProvider>
    </BrowserRouter>
    {/* ToastContainer debe estar aquí, fuera del BrowserRouter pero dentro del StrictMode */}
    <ToastContainer position="bottom-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
  </StrictMode>,
);