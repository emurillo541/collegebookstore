const express = require('express');
const path = require('path');

const app = express();

const PORT = process.env.PORT || 5190; 

const BUILD_PATH = path.join(__dirname, 'dist');

app.use(express.static(BUILD_PATH));
app.get('*', (req, res) => {
    res.sendFile(path.join(BUILD_PATH, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Frontend Static Server running on port ${PORT}`);
    console.log(`Serving files from: ${BUILD_PATH}`);
    console.log(`Access the application via: http://<your_server_hostname_or_IP_address>:${PORT}`);
});
