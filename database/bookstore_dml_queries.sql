-- bookstore_dml_queries.sql
-- Sample Data Population for Bookstore Database

CALL ResetBookstore();

SET FOREIGN_KEY_CHECKS = 0;


SET @customerID1 = 1;
SET @customerID2 = 2;
SET @customerID3 = 3;
SET @customerID4 = 4;
SET @customerID5 = 5;

SET @employeeID1 = 1;
SET @employeeID2 = 2;
SET @employeeID3 = 3;
SET @employeeID4 = 4;
SET @employeeID5 = 5;

SET @supplierID1 = 1;
SET @supplierID2 = 2;
SET @supplierID3 = 3;
SET @supplierID4 = 4;
SET @supplierID5 = 5;

SET @itemID1 = 1;
SET @itemID2 = 2;
SET @itemID3 = 3;
SET @itemID4 = 4;
SET @itemID5 = 5;

-- --- Data Population: Sales (Orders) ---
-- These must be inserted in the DML script to establish the primary sales records.
INSERT INTO Sales (customerID, employeeID, orderDate, totalAmount)
VALUES (@customerID1, @employeeID1, '2025-10-10 14:30:00', 0.00);
SET @salesID1 = LAST_INSERT_ID();

INSERT INTO Sales (customerID, employeeID, orderDate, totalAmount)
VALUES (@customerID2, @employeeID3, '2025-10-11 09:15:00', 0.00);
SET @salesID2 = LAST_INSERT_ID();

INSERT INTO Sales (customerID, employeeID, orderDate, totalAmount)
VALUES (@customerID3, @employeeID2, '2025-10-12 17:45:00', 0.00);
SET @salesID3 = LAST_INSERT_ID();

INSERT INTO Sales (customerID, employeeID, orderDate, totalAmount)
VALUES (@customerID4, @employeeID4, '2025-10-13 11:00:00', 0.00);
SET @salesID4 = LAST_INSERT_ID();

INSERT INTO Sales (customerID, employeeID, orderDate, totalAmount)
VALUES (@customerID5, @employeeID1, '2025-10-14 16:30:00', 0.00);
SET @salesID5 = LAST_INSERT_ID();


-- --- Data Population: SalesDetail (Line Items) ---
INSERT INTO SalesDetail (salesID, itemID, itemQuantity, priceEach)
VALUES (@salesID1, @itemID1, 2, 10.99);

INSERT INTO SalesDetail (salesID, itemID, itemQuantity, priceEach)
VALUES (@salesID1, @itemID3, 1, 39.95);

INSERT INTO SalesDetail (salesID, itemID, itemQuantity, priceEach)
VALUES (@salesID2, @itemID3, 1, 39.95);

INSERT INTO SalesDetail (salesID, itemID, itemQuantity, priceEach)
VALUES (@salesID3, @itemID5, 1, 14.50);

INSERT INTO SalesDetail (salesID, itemID, itemQuantity, priceEach)
VALUES (@salesID4, @itemID4, 2, 59.99);

INSERT INTO SalesDetail (salesID, itemID, itemQuantity, priceEach)
VALUES (@salesID5, @itemID5, 1, 14.50);


-- Recalculate and update the totalAmount in the Sales table now that line items exist
-- This UPDATE is the final step for sales data integrity.
UPDATE Sales s
JOIN (
    SELECT salesID, SUM(itemQuantity * priceEach) AS totalAmt
    FROM SalesDetail
    GROUP BY salesID
) sd ON s.salesID = sd.salesID
SET s.totalAmount = sd.totalAmt;


-- --- Data Population: Reorders ---
INSERT INTO Reorders (supplierID, itemID, reorderDate, quantity, status)
VALUES (@supplierID1, @itemID1, '2025-10-01 10:00:00', 100, 'received');

INSERT INTO Reorders (supplierID, itemID, reorderDate, quantity, status)
VALUES (@supplierID2, @itemID3, '2025-10-05 14:30:00', 50, 'pending');

INSERT INTO Reorders (supplierID, itemID, reorderDate, quantity, status)
VALUES (@supplierID3, @itemID2, '2025-10-07 09:00:00', 30, 'received');

INSERT INTO Reorders (supplierID, itemID, reorderDate, quantity, status)
VALUES (@supplierID4, @itemID4, '2025-10-10 11:45:00', 20, 'pending');

INSERT INTO Reorders (supplierID, itemID, reorderDate, quantity, status)
VALUES (@supplierID5, @itemID5, '2025-10-12 13:30:00', 40, 'received');

SET FOREIGN_KEY_CHECKS = 1;