const db = require('./db-connector.js');
const express = require('express');
const cors = require('cors'); 
const { jwtCheck } = require('./auth-middleware');
const app = express();
const PORT = process.env.PORT || 3066; 

const allowedOrigins = [
    process.env.FRONTEND_URL 
];

// Configure and apply the CORS middleware
app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (e.g., Postman)
        if (!origin) return callback(null, true);
        
        if (origin.endsWith('.vercel.app')) {
            return callback(null, true);
        }
        
        
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        
        const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
        return callback(new Error(msg), false);
    },
    credentials: true
}));

// Middleware to parse incoming JSON request bodies
app.use(express.json());

// --- Database Utility Routes ---

// GET route to reset the entire database using a stored procedure
app.get('/reset-db', async (req, res) => {
    try {
        await db.query('CALL ResetBookstore();');
        res.status(200).json({ message: 'Database has been reset successfully!' });
    } catch (error) {
        console.error('Error executing ResetBookstore procedure:', error);
        res.status(500).json({ error: 'Failed to reset database.' });
    }
});

// ======================================================
// CUSTOMERS (CRUD)
// ======================================================

// GET: Retrieve all customer records
app.get('/customers', async (req, res) => {
    const query = 
        "SELECT customerID, firstName, lastName, custEmail, addressLine1, addressLine2, custZip FROM Customers ORDER BY lastName, firstName;";
    
    try {
        const results = await db.query(query);
        // Handle both database return types to ensure the rows array is returned
        const rows = Array.isArray(results) && Array.isArray(results[0]) ? results[0] : results;
        res.status(200).json(rows);
    } catch (error) {
        console.error('CUSTOMER ROUTE CRITICAL ERROR:', error); 
        res.status(500).json({ error: 'Database error fetching customer data.' });
    }
});

// POST: Add a new customer record
app.post('/customers', async (req, res) => {
    const { firstName, lastName, custEmail, addressLine1, addressLine2, custZip } = req.body;
    const query = 
        "INSERT INTO Customers (firstName, lastName, custEmail, addressLine1, addressLine2, custZip) VALUES (?, ?, ?, ?, ?, ?);";

    // Use null for any optional fields that were left empty
    const values = [
        firstName || null,
        lastName || null,
        custEmail || null,
        addressLine1 || null,
        addressLine2 || null,
        custZip || null
    ];

    try {
        const [result] = await db.query(query, values);
        res.status(201).json({ customerID: result.insertId, message: "Customer added successfully." });
    } catch (error) {
        console.error('Error creating customer:', error);
        res.status(500).json({ error: 'Database error creating customer.' });
    }
});


// PUT: Update an existing customer record by ID
app.put('/customers/:customerID', async (req, res) => {
    const customerID = Number(req.params.customerID); // ensure ID is numeric
    const { firstName, lastName, custEmail, addressLine1, addressLine2, custZip } = req.body;
    const query = 
        "UPDATE Customers SET firstName = ?, lastName = ?, custEmail = ?, addressLine1 = ?, addressLine2 = ?, custZip = ? WHERE customerID = ?;"; 

    const values = [firstName || null, lastName || null, custEmail || null, addressLine1 || null, addressLine2 || null, custZip || null, customerID];

    try {
        const [result] = await db.query(query, values);
        res.status(200).json({ message: "Customer updated successfully." });
    } catch (error) {
        console.error('Error updating customer:', error);
        res.status(500).json({ error: 'Database error updating customer.' });
    }
});


// DELETE: Remove a customer record by ID
app.delete('/customers/:customerID', async (req, res) => {
    const query = `DELETE FROM Customers WHERE customerID = ?;`;
    try {
        const [result] = await db.query(query, [req.params.customerID]);
        res.status(200).json({ message: "Customer deleted successfully." });
    } catch (error) {
        console.error('Error deleting customer:', error);
        res.status(500).json({ error: 'Database error deleting customer.' });
    }
});

// ======================================================
// EMPLOYEES (CRUD)
// ======================================================

// GET: Retrieve all employee records
app.get('/employees', async (req, res) => {
    const query = 
        "SELECT employeeID, firstName, lastName, email, hireDate FROM Employees ORDER BY lastName, firstName;"; 

    try {
        const [results] = await db.query(query);
        res.status(200).json(results);
    } catch (error) {
        console.error('Error fetching employees:', error);
        res.status(500).json({ error: 'Database error fetching employee data.' });
    }
});

// POST: Add a new employee record
app.post('/employees', async (req, res) => {
    const { firstName, lastName, email, hireDate } = req.body;
    const query = 
        "INSERT INTO Employees (firstName, lastName, email, hireDate) VALUES (?, ?, ?, ?);";
        
    const values = [firstName, lastName, email, hireDate];

    try {
        const [result] = await db.query(query, values);
        res.status(201).json({ employeeID: result.insertId, message: "Employee added successfully." });
    } catch (error) {
        console.error('Error creating employee:', error);
        res.status(500).json({ error: 'Database error creating employee.' });
    }
});

// PUT: Update an existing employee record by ID
app.put('/employees/:id', async (req, res) => {
    const employeeID = req.params.id;
    const { firstName, lastName, email, hireDate } = req.body;
    const query = 
        "UPDATE Employees SET firstName = ?, lastName = ?, email = ?, hireDate = ? WHERE employeeID = ?;";
        
    const values = [firstName, lastName, email, hireDate, employeeID];

    try {
        const [result] = await db.query(query, values);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Employee not found.' });
        }

        res.status(200).json({ message: 'Employee updated successfully.' });
    } catch (error) {
        console.error('Error updating employee:', error);
        res.status(500).json({ error: 'Database error updating employee.' });
    }
});

// DELETE: Remove an employee record by ID
app.delete('/employees/:employeeID', async (req, res) => {
    const query = `DELETE FROM Employees WHERE employeeID = ?;`;
    try {
        await db.query(query, [req.params.employeeID]);
        res.status(200).json({ message: "Employee deleted successfully." });
    } catch (error) {
        console.error('Error deleting employee:', error);
        res.status(500).json({ error: 'Database error deleting employee.' });
    }
});

// ======================================================
// SUPPLIERS (CRUD)
// ======================================================

// GET: Retrieve all supplier records
app.get('/suppliers', async (req, res) => {
    const query = 
        "SELECT supplierID, companyName, contactName, supplierEmail, phone FROM Suppliers ORDER BY companyName;";
    try {
        const [results] = await db.query(query);
        res.status(200).json(results);
    } catch (error) {
        console.error('Error fetching suppliers:', error);
        res.status(500).json({ error: 'Database error fetching supplier data.' });
    }
});

// POST: Add a new supplier record
app.post('/suppliers', async (req, res) => {
    const { companyName, contactName, supplierEmail, phone } = req.body;
    const query = 
        "INSERT INTO Suppliers (companyName, contactName, supplierEmail, phone) VALUES (?, ?, ?, ?);";
    const values = [companyName, contactName, supplierEmail, phone];

    try {
        const [result] = await db.query(query, values);
        res.status(201).json({ supplierID: result.insertId, message: 'Supplier added successfully.' });
    } catch (error) {
        console.error('Error creating supplier:', error);
        res.status(500).json({ error: 'Database error creating supplier.' });
    }
});

// PUT: Update an existing supplier record by ID
app.put('/suppliers/:id', async (req, res) => {
    const { id } = req.params;
    const { companyName, contactName, supplierEmail, phone } = req.body;
    const query = 
        "UPDATE Suppliers SET companyName = ?, contactName = ?, supplierEmail = ?, phone = ? WHERE supplierID = ?;";
    const values = [companyName, contactName, supplierEmail, phone, id];

    try {
        const [result] = await db.query(query, values);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: `Supplier ID ${id} not found.` });
        }
        res.status(200).json({ message: 'Supplier updated successfully.' });
    } catch (error) {
        console.error('Error updating supplier:', error);
        res.status(500).json({ error: 'Database error updating supplier.' });
    }
});

// DELETE: Remove a supplier record by ID
app.delete('/suppliers/:id', async (req, res) => {
    const { id } = req.params;
    const query = `DELETE FROM Suppliers WHERE supplierID = ?`;
    try {
        const [result] = await db.query(query, [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: `Supplier ID ${id} not found.` });
        }
        res.status(200).json({ message: 'Supplier deleted successfully.' });
    } catch (error) {
        console.error('Error deleting supplier:', error);
        res.status(500).json({ error: 'Database error deleting supplier.' });
    }
});

// ======================================================
// MERCHANDISE (CRUD)
// ======================================================

// GET: Retrieve all merchandise items, including the associated supplier name
app.get('/merchandise', async (req, res) => {
    const query = 
"SELECT M.itemID, M.itemName, M.ISBN, CAST(M.price AS DECIMAL(10,2)) AS price, M.itemQuantity AS quantityAvailable, M.supplierID, S.companyName AS supplierName FROM Merchandise M LEFT JOIN Suppliers S ON M.supplierID = S.supplierID ORDER BY M.itemName;"; 

    try {
        const [results] = await db.query(query);
        res.status(200).json(results);
    } catch (error) {
        console.error('Error fetching merchandise:', error);
        res.status(500).json({ error: 'Database error fetching merchandise.' });
    }
});

// POST: Add a new merchandise item
app.post('/merchandise/add', async (req, res) => {
    const { itemName, ISBN, price, supplierID, itemQuantity } = req.body;
    const query = 
"INSERT INTO Merchandise (itemName, ISBN, price, supplierID, itemQuantity) VALUES (?, ?, ?, ?, ?);";

    const values = [itemName, ISBN || null, price, supplierID || null, itemQuantity];

    try {
        const [result] = await db.query(query, values);
        res.status(201).json({ itemID: result.insertId, message: "Merchandise added successfully." });
    } catch (error) {
        console.error('Error creating merchandise:', error);
        res.status(500).json({ error: 'Database error creating merchandise.' });
    }
});

// PUT: Update an existing merchandise item by ID
app.put('/merchandise/:itemID', async (req, res) => {
    const { itemID } = req.params;
    const { itemName, ISBN, price, supplierID, itemQuantity } = req.body;
    const query = 
"UPDATE Merchandise SET itemName = ?, ISBN = ?, price = ?, supplierID = ?, itemQuantity = ? WHERE itemID = ?;";

    const values = [itemName, ISBN || null, price, supplierID || null, itemQuantity, itemID];

    try {
        const [result] = await db.query(query, values);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Merchandise not found.' });
        }
        res.status(200).json({ message: 'Merchandise updated successfully.' });
    } catch (error) {
        console.error('Error updating merchandise:', error);
        res.status(500).json({ error: 'Database error updating merchandise.' });
    }
});

// DELETE: Remove a merchandise item by ID
app.delete('/merchandise/:itemID', async (req, res) => {
    const query = `DELETE FROM Merchandise WHERE itemID = ?;`;
    try {
        await db.query(query, [req.params.itemID]);
        res.status(200).json({ message: "Merchandise deleted successfully." });
    } catch (error) {
        console.error('Error deleting merchandise:', error);
        res.status(500).json({ error: 'Database error deleting merchandise.' });
    }
});

// ======================================================
// SALES (Header)
// ======================================================

// GET: Retrieve all sales records with customer and employee names
app.get('/sales', async (req, res) => {
    const query = 
"SELECT S.salesID, S.orderDate, S.totalAmount, S.customerID, S.employeeID, CONCAT(C.firstName, ' ', C.lastName) AS customerName, CONCAT(E.firstName, ' ', E.lastName) AS employeeName FROM Sales S JOIN Customers C ON S.customerID = C.customerID LEFT JOIN Employees E ON S.employeeID = E.employeeID ORDER BY S.orderDate DESC"; 

    try {
        const results = await db.query(query);
        const rows = Array.isArray(results) && Array.isArray(results[0]) ? results[0] : results;
        res.status(200).json(rows); 
    } catch (error) {
        console.error('Error fetching sales:', error);
        res.status(500).json({ error: 'Database error fetching sales data. Check JOIN conditions and column names.' });
    }
});

// POST: Create a new sale, insert line items, and update inventory using a transaction
app.post('/sales', async (req, res) => {
    const { customerID, employeeID, lineItems } = req.body; 

    if (!lineItems || lineItems.length === 0) {
        return res.status(400).json({ error: "At least one line item is required." });
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // Calculate total from line items
        const total = lineItems.reduce((sum, item) => {
            return sum + (item.quantity * item.priceEach);
        }, 0);

        // Insert sale with calculated total
        const saleInsertQuery = `INSERT INTO Sales (customerID, employeeID, totalAmount) VALUES (?, ?, ?);`;
        const [saleResult] = await connection.query(saleInsertQuery, [customerID, employeeID, total]);
        const newSalesID = saleResult.insertId;

        // Insert line items and update inventory (No change needed, these are single lines)
        const detailInsertQuery = `INSERT INTO SalesDetail (salesID, itemID, itemQuantity, priceEach) VALUES (?, ?, ?, ?);`;
        const inventoryUpdateQuery = `UPDATE Merchandise SET itemQuantity = itemQuantity - ? WHERE itemID = ?;`;

        for (const item of lineItems) {
            await connection.query(detailInsertQuery, [newSalesID, item.itemID, item.quantity, item.priceEach]);
            await connection.query(inventoryUpdateQuery, [item.quantity, item.itemID]);
        }

        await connection.commit();
        res.status(201).json({ message: "Sale processed successfully.", salesID: newSalesID, totalAmount: total });

    } catch (error) {
        await connection.rollback();
        console.error("Error processing new sale:", error);
        res.status(500).json({ error: "Failed to process sale.", details: error.message });
    } finally {
        connection.release();
    }
});

// PUT: Update the customerID and/or employeeID on a sale record
app.put('/sales/:salesID', async (req, res) => {
    const { salesID } = req.params;
    const { customerID, employeeID } = req.body;

    if (!customerID) return res.status(400).json({ error: "customerID is required." });

    const query = `UPDATE Sales SET customerID = ?, employeeID = ? WHERE salesID = ?;`;

    try {
        const [result] = await db.query(query, [customerID, employeeID || null, salesID]);
        if (result.affectedRows === 0) return res.status(404).json({ error: "Sale not found." });
        res.status(200).json({ message: "Sale updated successfully." });
    } catch (error) {
        console.error("Error updating sale:", error);
        res.status(500).json({ error: "Failed to update sale." });
    }
});

// DELETE: Delete/Cancel a sale record
app.delete('/sales/:salesID', async (req, res) => {
    const query = `DELETE FROM Sales WHERE salesID = ?;`;
    try {
        await db.query(query, [req.params.salesID]);
        res.status(200).json({ message: "Sale cancelled successfully." });
    } catch (error) {
        console.error('Error cancelling sale:', error);
        res.status(500).json({ error: 'Database error cancelling sale.' });
    }
});

// ======================================================
// SALES DETAIL (Line Items)
// ======================================================

// GET: Retrieve all line items for a specific sale (by salesID)
app.get('/salesdetail/:salesID', async (req, res) => {
    const query = 
"SELECT SD.salesDetailID, M.itemName, M.ISBN, SD.itemQuantity, SD.priceEach, (SD.itemQuantity * SD.priceEach) AS lineTotal, SD.itemID FROM SalesDetail SD JOIN Merchandise M ON SD.itemID = M.itemID WHERE SD.salesID = ? ORDER BY SD.salesDetailID"; 

    try {
        const [results] = await db.query(query, [req.params.salesID]);
        res.status(200).json(results);
    } catch (error) {
        console.error('Error fetching sales details:', error);
        res.status(500).json({ error: 'Database error fetching sales detail data.' });
    }
});

// POST: Add a new line item to an existing sale
app.post('/salesdetail', async (req, res) => {
    const { salesID, itemID, itemQuantity, priceEach } = req.body;
    const insertQuery = 
        "INSERT INTO SalesDetail (salesID, itemID, itemQuantity, priceEach) VALUES (?, ?, ?, ?);";    
    const inventoryQuery = 
        "UPDATE Merchandise SET itemQuantity = itemQuantity - ? WHERE itemID = ?;";    
    
    try {
        await db.query(insertQuery, [salesID, itemID, itemQuantity, priceEach]);
        await db.query(inventoryQuery, [itemQuantity, itemID]);
        
        res.status(201).json({ message: "Line item added and inventory updated successfully." });
    } catch (error) {
        console.error('Error adding sales detail and updating inventory:', error);
        res.status(500).json({ error: 'Database error adding item to sale.' });
    }
});

// PUT: Update an existing sales detail (line item) and recalculate Sale total (Transaction)
app.put('/salesdetail/:salesDetailID', async (req, res) => {
    const salesDetailID = req.params.salesDetailID;
    const { itemQuantity, priceEach } = req.body;

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // Get the original quantity to calculate inventory change
        const getDetailsQuery = `SELECT salesID, itemID, itemQuantity FROM SalesDetail WHERE salesDetailID = ?;`;
        const [details] = await connection.query(getDetailsQuery, [salesDetailID]);

        if (details.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: "Sales detail not found." });
        }

        const { salesID, itemID, itemQuantity: oldQuantity } = details[0];
        const quantityDelta = itemQuantity - oldQuantity; // new quantity minus old quantity

        // Update SalesDetail
        const updateDetailQuery = `UPDATE SalesDetail SET itemQuantity = ?, priceEach = ? WHERE salesDetailID = ?;`;
        await connection.query(updateDetailQuery, [itemQuantity, priceEach, salesDetailID]);

        // Update inventory (negative delta = increasing inventory, positive delta = decreasing inventory)
        const inventoryUpdateQuery = `UPDATE Merchandise SET itemQuantity = itemQuantity - ? WHERE itemID = ?;`;
        await connection.query(inventoryUpdateQuery, [quantityDelta, itemID]);

        // Recalculate totalAmount for the parent sale
        const updateTotalQuery = 
            "UPDATE Sales SET totalAmount = ( SELECT COALESCE(SUM(itemQuantity * priceEach),0) FROM SalesDetail WHERE salesID = ? ) WHERE salesID = ?;";
        
        await connection.query(updateTotalQuery, [salesID, salesID]);

        await connection.commit();
        res.status(200).json({ message: "Line item updated and sale total recalculated successfully." });

    } catch (error) {
        await connection.rollback();
        console.error('Error updating sales detail:', error);
        res.status(500).json({ error: 'Database error updating sales detail.' });
    } finally {
        connection.release();
    }
});

// DELETE: Remove a sales detail (line item) and revert inventory (Transaction)
app.delete('/salesdetail/:salesDetailID', async (req, res) => {
    const getDetailsQuery = `SELECT itemID, itemQuantity FROM SalesDetail WHERE salesDetailID = ?;`;
    const deleteQuery = `DELETE FROM SalesDetail WHERE salesDetailID = ?;`;
    // Increase inventory because the item is no longer sold
    const inventoryRevertQuery = `UPDATE Merchandise SET itemQuantity = itemQuantity + ? WHERE itemID = ?;`;
    
    const connection = await db.getConnection(); 

    try {
        await connection.beginTransaction();

        // Get details for inventory reversion
        const [details] = await connection.query(getDetailsQuery, [req.params.salesDetailID]);
        if (details.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: "Sales detail not found." });
        }
        const { itemID, itemQuantity } = details[0];

        await connection.query(deleteQuery, [req.params.salesDetailID]);

        // Revert item quantity back to inventory
        await connection.query(inventoryRevertQuery, [itemQuantity, itemID]);

        await connection.commit();
        res.status(200).json({ message: "Sales detail deleted and inventory reverted successfully." });
    } catch (error) {
        await connection.rollback();
        console.error('Error deleting sales detail:', error);
        res.status(500).json({ error: 'Database error deleting sales detail.' });
    } finally {
        connection.release();
    }
});

// ======================================================
// REORDERS (Inventory Management)
// ======================================================

// GET: Retrieve all reorder records
app.get('/reorders', async (req, res) => {
    const query = 
"SELECT R.reorderID, DATE_FORMAT(R.reorderDate, '%Y-%m-%d') AS reorderDate, R.quantity, R.status, M.itemID, M.itemName, R.supplierID, S.companyName AS supplier FROM Reorders R JOIN Merchandise M ON R.itemID = M.itemID LEFT JOIN Suppliers S ON R.supplierID = S.supplierID ORDER BY R.reorderDate DESC;";

    try {
        const [results] = await db.query(query);
        res.status(200).json(results);
    } catch (error) {
        console.error('Error fetching reorders:', error);
        res.status(500).json({ error: 'Database error fetching reorder data.' });
    }
});

// POST: Create a new reorder request
app.post('/reorders', async (req, res) => {
    const { supplierID, itemID, quantity, status } = req.body;
    const validStatuses = ['pending', 'ordered'];
    const statusToSave = status && validStatuses.includes(status.toLowerCase())
        ? status.toLowerCase()
        : 'pending';

    try {
        const insertQuery = "INSERT INTO Reorders (supplierID, itemID, quantity, status) VALUES (?, ?, ?, ?)";
        
        const [result] = await db.query(
            insertQuery,
            [supplierID || null, itemID || null, quantity || 0, statusToSave]
        );
        const selectQuery = "SELECT reorderID, supplierID, itemID, quantity, status FROM Reorders WHERE reorderID = ?";

        // Fetch the newly created row to return
        const [rows] = await db.query(
            selectQuery,
            [result.insertId]
        );

        res.status(201).json({
            reorder: rows[0],
            message: "Reorder created successfully!"
        });
    } catch (error) {
        console.error('Error creating reorder:', error);
        res.status(500).json({ error: 'Database error creating reorder.' });
    }
});

// PUT: Mark a reorder as 'received' and update merchandise inventory (Transaction)
app.put('/reorders/receive/:reorderID', async (req, res) => {
    const reorderID = req.params.reorderID;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // Get details for the reorder, ensuring it's currently 'ordered'
        const [rows] = await connection.query(
            `SELECT itemID, quantity FROM Reorders WHERE reorderID = ? AND status = 'ordered'`,
            [reorderID]
        );

        if (rows.length === 0) {
            await connection.rollback();
            return res.status(400).json({
                error: "Reorder not found or not in 'ordered' status."
            });
        }

        const { itemID, quantity } = rows[0];

        // Add quantity to inventory
        await connection.query(
            `UPDATE Merchandise SET itemQuantity = itemQuantity + ? WHERE itemID = ?`,
            [quantity, itemID]
        );

        // Update status to 'received'
        await connection.query(
            `UPDATE Reorders SET status = 'received' WHERE reorderID = ?`,
            [reorderID]
        );

        await connection.commit();

        res.status(200).json({
            message: "Reorder marked as received and inventory updated."
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error receiving reorder:', error);
        res.status(500).json({ error: 'Database error receiving reorder.' });
    } finally {
        connection.release();
    }
});


// PUT: Cancel a reorder request if it is 'pending' or 'ordered'
app.put('/reorders/cancel/:reorderID', async (req, res) => {
    const reorderID = req.params.reorderID;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();
        const updateQuery = 
            "UPDATE Reorders SET status = 'cancelled' WHERE reorderID = ? AND (status IN ('pending', 'ordered') OR status IS NULL OR status = '')";
        
        const [updateResult] = await connection.query(
            updateQuery,
            [reorderID]
        );

        if (updateResult.affectedRows === 0) {
            await connection.rollback();
            return res.status(400).json({
                error: "Reorder not found or already received/cancelled."
            });
        }
        const selectQuery = 
            "SELECT reorderID, reorderDate, quantity, status, itemID, supplierID FROM Reorders WHERE reorderID = ?";

        // Fetch the updated row to return
        const [updatedRows] = await connection.query(
            selectQuery,
            [reorderID]
        );

        await connection.commit();

        res.status(200).json({
            reorder: updatedRows[0],
            message: "Reorder cancelled successfully."
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error cancelling reorder:', error);
        res.status(500).json({ error: 'Database error cancelling reorder.' });
    } finally {
        connection.release();
    }
});

// DELETE: Permanently remove a reorder (only if status is 'pending')
app.delete('/reorders/:reorderID', async (req, res) => {
    try {
        const [result] = await db.query(
            `DELETE FROM Reorders WHERE reorderID = ? AND status = 'pending'`,
            [req.params.reorderID]
        );

        if (result.affectedRows === 0) {
            return res.status(400).json({
                error: "Reorder not pending or not found (cannot delete)."
            });
        }

        res.status(200).json({ message: "Pending reorder deleted successfully." });
    } catch (error) {
        console.error('Error deleting reorder:', error);
        res.status(500).json({ error: 'Database error deleting reorder.' });
    }
});

// ---------------------------------------------------------------------------------------------------
// START SERVER FUNCTION AND EXECUTION
// ---------------------------------------------------------------------------------------------------

// Function to check DB connection and start the Express server
async function startServer() {
    try {
        // Test the database connection
        const connection = await db.getConnection(); 
        connection.release();
        console.log("Database connection successful! Starting API server...");

        // Start listening on the specified port
        app.listen(PORT, () => {
            
            console.log(`Express API server running on port ${PORT}`); 
        });

    } catch (err) {
        // Log a fatal error if DB connection fails and exit
        console.error("\n FATAL ERROR: Database Connection Failed!");
        console.error(`\tError Message: ${err.message}\n`);
        process.exit(1); 
    }
}

// Execute the function to start the server
startServer();