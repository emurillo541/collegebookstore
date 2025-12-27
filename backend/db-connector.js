const mysql = require('mysql2/promise');
const pool = mysql.createPool({
    waitForConnections: true,
    connectionLimit: 10,
    host: process.env.DB_HOST,
    user: process.env.DB_USER, 
    password: process.env.DB_PASSWORD, 
    database: process.env.DB_NAME, 
    port: process.env.DB_PORT || 3306 
});

pool.getConnection()
    .then(connection => {
        console.log("Database connection successful! Pool created.");
        connection.release(); 
    })
    .catch(error => {
        console.error("\n*** FATAL ERROR: Database Connection Failed! ***");
        console.error(`\tError connecting to host: ${process.env.DB_HOST}`);
        console.error(`\tError Message: ${error.message}\n`);
    });

module.exports = pool;
