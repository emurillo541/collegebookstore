import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite configuration reference: https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Custom server configuration for development environment
  server: {
    // Set the development server port
    port: 5190, 
    
    // Bind to all network interfaces to allow external access
    host: true,
    
    // Explicitly allow the host to avoid security errors in specific environments
    allowedHosts: ['classwork.engr.oregonstate.edu'],
    
    // Serve index.html for all non-static routes to enable React Router
    historyApiFallback: true,
  }
})