import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './App.css'
import App from './App.jsx'
import { Auth0Provider } from '@auth0/auth0-react' 

// Get the root DOM element where the React application will be mounted
const rootElement = document.getElementById('root');

// Create a React root instance from the root DOM element
const root = createRoot(rootElement);

// Render the main React application component (App) into the root
root.render(
  <StrictMode>
    <Auth0Provider
        
        domain={import.meta.env.VITE_AUTH0_DOMAIN} 
        
        clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
        authorizationParams={{
            
            redirect_uri: window.location.origin,
            
            audience: import.meta.env.VITE_AUTH0_AUDIENCE 
        }}
    >
      <App />
    </Auth0Provider>
  </StrictMode>,
)