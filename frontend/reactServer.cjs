// Import the necessary modules
const express = require('express');
const path = require('path');

// Initialize the Express application
const app = express();

// Configuration constants
const PORT = 5190;
// Define the path to the static assets (the built React app)
const BUILD_PATH = path.join(__dirname, 'dist');

// Middleware to serve static files from the 'dist' directory
app.use(express.static(BUILD_PATH));

// Catch-all route handler for client-side routing
// This is crucial for single-page applications (SPAs)
app.get('*', (req, res) => {
    res.sendFile(path.join(BUILD_PATH, 'index.html'));
});
.
app.listen(PORT, () => {
    // The console output is updated to reflect that the server is listening on the specified port.
    console.log(`Frontend Static Server running on port ${PORT}`);
    console.log(`Serving files from: ${BUILD_PATH}`);
    console.log(`Access the application via: http://<your_server_hostname_or_IP_address>:${PORT}`);
});