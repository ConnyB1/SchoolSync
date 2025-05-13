import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.jsx';                   
import { Auth0Provider } from '@auth0/auth0-react'; 

const auth0Domain = 'thebigmou.us.auth0.com';
const auth0ClientId = 'HzboByDK0egBiGaIhwzfTz3GWOEZeVdO';
const auth0Audience = 'https://thebigmou.us.auth0.com/api/v2/';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter> 
      <Auth0Provider
        domain={auth0Domain}
        clientId={auth0ClientId}
        authorizationParams={{
          redirect_uri: window.location.origin,
          audience: auth0Audience,
        }}
      >
        <App /> 
      </Auth0Provider>
    </BrowserRouter> 
  </StrictMode>,
);