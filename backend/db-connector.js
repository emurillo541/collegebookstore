const mysql = require('mysql2/promise');
const pool = mysql.createPool({
    waitForConnections: true,
    connectionLimit: 10,
    host: process.env.DB_HOST,
    user: process.env.DB_USER, 
    password: process.env.DB_PASSWORD, 
<<<<<<< HEAD
    database: process.env.DB_NAME,
=======
    database: process.env.DB_DATABASE,
>>>>>>> f70325c19ffb9bbf29d35452f9d6ab9cf1fdcca6
    port: process.env.DB_PORT || 3306 
});

pool.getConnection()
    .then(connection => {
        console.log("Database connection successful! Pool created.");
<<<<<<< HEAD
        connection.release(); 
=======
        connection.release(); // Release the connection immediately
>>>>>>> f70325c19ffb9bbf29d35452f9d6ab9cf1fdcca6
    })
    .catch(error => {
        console.error("\n*** FATAL ERROR: Database Connection Failed! ***");
        console.error(`\tError connecting to host: ${process.env.DB_HOST}`);
        console.error(`\tError Message: ${error.message}\n`);
    });

module.exports = pool;