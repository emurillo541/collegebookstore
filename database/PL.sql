USE `collegebookstore-db`;

DELIMITER //

-- ============================================================== 
-- Stored Procedure to Completely Reset and Re-seed the Database
-- (Uses Dynamic SQL for robust execution of DDL)
-- ==============================================================

DROP PROCEDURE IF EXISTS ResetBookstore //

CREATE PROCEDURE ResetBookstore()
BEGIN
    
    SET FOREIGN_KEY_CHECKS = 0;

    -- ===========================
    -- Drop Tables (Using Dynamic SQL for robust execution inside a routine)
    -- ===========================
    -- Drop tables in dependency order
    SET @drop_stmts = '
        DROP TABLE IF EXISTS SalesDetail, Sales, Reorders, Merchandise, Suppliers, Employees, Customers;
    ';
    PREPARE stmt FROM @drop_stmts;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;

    -- ===========================
    -- Recreate Database Schema
    -- ===========================
    CREATE TABLE Customers (
        customerID INT AUTO_INCREMENT PRIMARY KEY,
        firstName VARCHAR(50) NOT NULL,
        lastName VARCHAR(50) NOT NULL,
        custEmail VARCHAR(100) UNIQUE NOT NULL,
        addressLine1 VARCHAR(100) NOT NULL,
        addressLine2 VARCHAR(100),
        custZip CHAR(5)
    );

    CREATE TABLE Employees (
        employeeID INT AUTO_INCREMENT PRIMARY KEY,
        firstName VARCHAR(50) NOT NULL,
        lastName VARCHAR(50) NOT NULL,
        email VARCHAR(100) UNIQUE,
        hireDate DATE
    );

    CREATE TABLE Suppliers (
        supplierID INT AUTO_INCREMENT PRIMARY KEY,
        companyName VARCHAR(100) NOT NULL,
        contactName VARCHAR(100),
        supplierEmail VARCHAR(100),
        phone VARCHAR(20)
    );

    CREATE TABLE Merchandise (
        itemID INT AUTO_INCREMENT PRIMARY KEY,
        itemName VARCHAR(150) NOT NULL,
        ISBN CHAR(13),
        price DECIMAL(10,2) NOT NULL,
        supplierID INT,
        itemQuantity INT,
        FOREIGN KEY (supplierID) REFERENCES Suppliers(supplierID)
            ON UPDATE CASCADE
            ON DELETE SET NULL
    );

    CREATE TABLE Sales (
        salesID INT AUTO_INCREMENT PRIMARY KEY,
        customerID INT NOT NULL,
        employeeID INT,
        orderDate DATETIME DEFAULT CURRENT_TIMESTAMP,
        totalAmount DECIMAL(10,2),
        FOREIGN KEY (customerID) REFERENCES Customers(customerID)
            ON UPDATE CASCADE
            ON DELETE CASCADE,
        FOREIGN KEY (employeeID) REFERENCES Employees(employeeID)
            ON UPDATE CASCADE
            ON DELETE SET NULL
    );

    CREATE TABLE SalesDetail (
        salesDetailID INT AUTO_INCREMENT PRIMARY KEY,
        salesID INT NOT NULL,
        itemID INT NOT NULL,
        itemQuantity INT NOT NULL,
        priceEach DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (salesID) REFERENCES Sales(salesID)
            ON UPDATE CASCADE
            ON DELETE CASCADE,
        FOREIGN KEY (itemID) REFERENCES Merchandise(itemID)
            ON UPDATE CASCADE
            ON DELETE CASCADE
    );

    CREATE TABLE Reorders (
        reorderID INT AUTO_INCREMENT PRIMARY KEY,
        supplierID INT,
        itemID INT,
        reorderDate DATETIME DEFAULT CURRENT_TIMESTAMP,
        quantity INT NOT NULL,
        status ENUM('pending','ordered','received','cancelled') NOT NULL DEFAULT 'pending',
        FOREIGN KEY (supplierID) REFERENCES Suppliers(supplierID)
            ON UPDATE CASCADE
            ON DELETE SET NULL,
        FOREIGN KEY (itemID) REFERENCES Merchandise(itemID)
            ON UPDATE CASCADE
            ON DELETE SET NULL
    );

    -- ===========================
    -- Insert Initial Data
    -- ===========================
    INSERT INTO Customers (firstName, lastName, custEmail, addressLine1, addressLine2, custZip)
    VALUES
        ('John', 'Doe', 'johndoe@email.com', '123 Main St', NULL, '20814'),
        ('Jane', 'Smith', 'janesmith@email.com', '456 Oak Ave', 'Apt 3B', '20815'),
        ('Michael', 'Brown', 'mbrown@email.com', '789 Elm Blvd', NULL, '20817'),
        ('Emily', 'Davis', 'edavis@email.com', '101 Pine Rd', NULL, '20816'),
        ('Robert', 'Wilson', 'rwilson@email.com', '202 Maple Ct', NULL, '20818');

    INSERT INTO Employees (firstName, lastName, email, hireDate)
    VALUES
        ('Alice', 'Taylor', 'alice.taylor@store.com', '2020-05-01'),
        ('Brian', 'Adams', 'brian.adams@store.com', '2019-11-12'),
        ('Carla', 'Nguyen', 'carla.nguyen@store.com', '2021-03-20'),
        ('David', 'Lopez', 'david.lopez@store.com', '2022-07-15'),
        ('Evelyn', 'Carter', 'evelyn.carter@store.com', '2018-01-30');

    INSERT INTO Suppliers (companyName, contactName, supplierEmail, phone)
    VALUES
        ('BookWorld Distributors', 'Tom Harris', 'tom@bookworld.com', '301-555-1000'),
        ('PrintWorks Inc.', 'Sara White', 'sara@printworks.com', '301-555-2000'),
        ('EduText Supplies', 'Mark Lee', 'mark@edutext.com', '301-555-3000'),
        ('Novelty Books', 'Linda Kim', 'linda@noveltybooks.com', '301-555-4000'),
        ('Ink & Paper Co.', 'George Allen', 'george@inkpaper.com', '301-555-5000');

    INSERT INTO Merchandise (itemName, ISBN, price, supplierID, itemQuantity)
    VALUES
        ('The Great Gatsby', '9780743273565', 10.99, 1, 50),
        ('Data Science 101', '9780134845623', 49.99, 3, 30),
        ('Python Programming', '9781492051367', 39.95, 2, 25),
        ('History of Art', '9780205685174', 59.99, 4, 20),
        ('Children''s Fairy Tales', '9780141329019', 14.50, 5, 40);

    INSERT INTO Sales (customerID, employeeID, orderDate, totalAmount)
    VALUES
        (1, 1, '2025-10-10 14:30:00', 60.94),
        (2, 3, '2025-10-11 09:15:00', 39.95),
        (3, 2, '2025-10-12 17:45:00', 24.99),
        (4, 4, '2025-10-13 11:00:00', 120.98),
        (5, 1, '2025-10-14 16:30:00', 14.50);

    INSERT INTO SalesDetail (salesID, itemID, itemQuantity, priceEach)
    VALUES
        (1, 1, 2, 10.99),
        (1, 3, 1, 39.95),
        (2, 3, 1, 39.95),
        (3, 5, 1, 14.50),
        (4, 4, 2, 59.99),
        (5, 5, 1, 14.50);

    INSERT INTO Reorders (supplierID, itemID, reorderDate, quantity, status)
    VALUES
        (1, 1, '2025-10-01 10:00:00', 100, 'received'),
        (2, 3, '2025-10-05 14:30:00', 50, 'pending'),
        (3, 2, '2025-10-07 09:00:00', 30, 'received'),
        (4, 4, '2025-10-10 11:45:00', 20, 'pending'),
        (5, 5, '2025-10-12 13:30:00', 40, 'received');

    -- Re-enable foreign key checks
    SET FOREIGN_KEY_CHECKS = 1;

END //

-- ============================================================== 
-- CUD Procedures for Managing Individual Tables
-- ==============================================================

-- --------------------------
-- Customer Procedures
-- --------------------------
DROP PROCEDURE IF EXISTS CreateCustomer //
CREATE PROCEDURE CreateCustomer(
    IN p_firstName VARCHAR(50),
    IN p_lastName VARCHAR(50),
    IN p_custEmail VARCHAR(100),
    IN p_addressLine1 VARCHAR(100),
    IN p_addressLine2 VARCHAR(100),
    IN p_custZip CHAR(5)
)
BEGIN
    INSERT INTO Customers(firstName, lastName, custEmail, addressLine1, addressLine2, custZip)
    VALUES (p_firstName, p_lastName, p_custEmail, p_addressLine1, p_addressLine2, p_custZip);
END //

DROP PROCEDURE IF EXISTS UpdateCustomer //
CREATE PROCEDURE UpdateCustomer(
    IN p_customerID INT,
    IN p_firstName VARCHAR(50),
    IN p_lastName VARCHAR(50),
    IN p_custEmail VARCHAR(100),
    IN p_addressLine1 VARCHAR(100),
    IN p_addressLine2 VARCHAR(100),
    IN p_custZip CHAR(5)
)
BEGIN
    UPDATE Customers
    SET firstName = p_firstName,
        lastName = p_lastName,
        custEmail = p_custEmail,
        addressLine1 = p_addressLine1,
        addressLine2 = p_addressLine2,
        custZip = p_custZip
    WHERE customerID = p_customerID;
END //

DROP PROCEDURE IF EXISTS DeleteCustomer //
CREATE PROCEDURE DeleteCustomer(IN p_customerID INT)
BEGIN
    DELETE FROM Customers WHERE customerID = p_customerID;
END //

-- --------------------------
-- Employee Procedures
-- --------------------------
DROP PROCEDURE IF EXISTS CreateEmployee //
CREATE PROCEDURE CreateEmployee(
    IN p_firstName VARCHAR(50),
    IN p_lastName VARCHAR(50),
    IN p_email VARCHAR(100),
    IN p_hireDate DATE
)
BEGIN
    INSERT INTO Employees(firstName, lastName, email, hireDate)
    VALUES(p_firstName, p_lastName, p_email, p_hireDate);
END //

DROP PROCEDURE IF EXISTS UpdateEmployee //
CREATE PROCEDURE UpdateEmployee(
    IN p_employeeID INT,
    IN p_firstName VARCHAR(50),
    IN p_lastName VARCHAR(50),
    IN p_email VARCHAR(100),
    IN p_hireDate DATE
)
BEGIN
    UPDATE Employees
    SET firstName = p_firstName,
        lastName = p_lastName,
        email = p_email,
        hireDate = p_hireDate
    WHERE employeeID = p_employeeID;
END //

DROP PROCEDURE IF EXISTS DeleteEmployee //
CREATE PROCEDURE DeleteEmployee(IN p_employeeID INT)
BEGIN
    DELETE FROM Employees WHERE employeeID = p_employeeID;
END //

-- --------------------------
-- Supplier Procedures
-- --------------------------
DROP PROCEDURE IF EXISTS CreateSupplier //
CREATE PROCEDURE CreateSupplier(
    IN p_companyName VARCHAR(100),
    IN p_contactName VARCHAR(100),
    IN p_supplierEmail VARCHAR(100),
    IN p_phone VARCHAR(20)
)
BEGIN
    INSERT INTO Suppliers(companyName, contactName, supplierEmail, phone)
    VALUES(p_companyName, p_contactName, p_supplierEmail, p_phone);
END //

DROP PROCEDURE IF EXISTS UpdateSupplier //
CREATE PROCEDURE UpdateSupplier(
    IN p_supplierID INT,
    IN p_companyName VARCHAR(100),
    IN p_contactName VARCHAR(100),
    IN p_supplierEmail VARCHAR(100),
    IN p_phone VARCHAR(20)
)
BEGIN
    UPDATE Suppliers
    SET companyName = p_companyName,
        contactName = p_contactName,
        supplierEmail = p_supplierEmail,
        phone = p_phone
    WHERE supplierID = p_supplierID;
END //

DROP PROCEDURE IF EXISTS DeleteSupplier //
CREATE PROCEDURE DeleteSupplier(IN p_supplierID INT)
BEGIN
    DELETE FROM Suppliers WHERE supplierID = p_supplierID;
END //

-- --------------------------
-- Merchandise Procedures
-- --------------------------
DROP PROCEDURE IF EXISTS CreateMerchandise //
CREATE PROCEDURE CreateMerchandise(
    IN p_itemName VARCHAR(150),
    IN p_ISBN CHAR(13),
    IN p_price DECIMAL(10,2),
    IN p_supplierID INT,
    IN p_itemQuantity INT
)
BEGIN
    INSERT INTO Merchandise(itemName, ISBN, price, supplierID, itemQuantity)
    VALUES(p_itemName, p_ISBN, p_price, p_supplierID, p_itemQuantity);
END //

DROP PROCEDURE IF EXISTS UpdateMerchandise //
CREATE PROCEDURE UpdateMerchandise(
    IN p_itemID INT,
    IN p_itemName VARCHAR(150),
    IN p_ISBN CHAR(13),
    IN p_price DECIMAL(10,2),
    IN p_supplierID INT,
    IN p_itemQuantity INT
)
BEGIN
    UPDATE Merchandise
    SET itemName = p_itemName,
        ISBN = p_ISBN,
        price = p_price,
        supplierID = p_supplierID,
        itemQuantity = p_itemQuantity
    WHERE itemID = p_itemID;
END //

DROP PROCEDURE IF EXISTS DeleteMerchandise //
CREATE PROCEDURE DeleteMerchandise(IN p_itemID INT)
BEGIN
    DELETE FROM Merchandise WHERE itemID = p_itemID;
END //

-- --------------------------
-- Sales Procedures
-- --------------------------
DROP PROCEDURE IF EXISTS CreateSale //
CREATE PROCEDURE CreateSale(
    IN p_customerID INT,
    IN p_employeeID INT,
    IN p_orderDate DATETIME,
    IN p_totalAmount DECIMAL(10,2)
)
BEGIN
    INSERT INTO Sales(customerID, employeeID, orderDate, totalAmount)
    VALUES(p_customerID, p_employeeID, p_orderDate, p_totalAmount);
END //

DROP PROCEDURE IF EXISTS UpdateSale //
CREATE PROCEDURE UpdateSale(
    IN p_salesID INT,
    IN p_customerID INT,
    IN p_employeeID INT,
    IN p_orderDate DATETIME,
    IN p_totalAmount DECIMAL(10,2)
)
BEGIN
    UPDATE Sales
    SET customerID = p_customerID,
        employeeID = p_employeeID,
        orderDate = p_orderDate,
        totalAmount = p_totalAmount
    WHERE salesID = p_salesID;
END //

DROP PROCEDURE IF EXISTS DeleteSale //
CREATE PROCEDURE DeleteSale(IN p_salesID INT)
BEGIN
    DELETE FROM Sales WHERE salesID = p_salesID;
END //

-- --------------------------
-- SalesDetail Procedures
-- --------------------------
DROP PROCEDURE IF EXISTS CreateSalesDetail //
CREATE PROCEDURE CreateSalesDetail(
    IN p_salesID INT,
    IN p_itemID INT,
    IN p_itemQuantity INT,
    IN p_priceEach DECIMAL(10,2)
)
BEGIN
    INSERT INTO SalesDetail(salesID, itemID, itemQuantity, priceEach)
    VALUES(p_salesID, p_itemID, p_itemQuantity, p_priceEach);
END //

DROP PROCEDURE IF EXISTS UpdateSalesDetail //
CREATE PROCEDURE UpdateSalesDetail(
    IN p_salesDetailID INT,
    IN p_salesID INT,
    IN p_itemID INT,
    IN p_itemQuantity INT,
    IN p_priceEach DECIMAL(10,2)
)
BEGIN
    UPDATE SalesDetail
    SET salesID = p_salesID,
        itemID = p_itemID,
        itemQuantity = p_itemQuantity,
        priceEach = p_priceEach
    WHERE salesDetailID = p_salesDetailID;
END //

DROP PROCEDURE IF EXISTS DeleteSalesDetail //
CREATE PROCEDURE DeleteSalesDetail(IN p_salesDetailID INT)
BEGIN
    DELETE FROM SalesDetail WHERE salesDetailID = p_salesDetailID;
END //

-- --------------------------
-- Reorders Procedures
-- --------------------------
DROP PROCEDURE IF EXISTS CreateReorder //
CREATE PROCEDURE CreateReorder(
    IN p_supplierID INT,
    IN p_itemID INT,
    IN p_reorderDate DATETIME,
    IN p_quantity INT,
    IN p_status ENUM('pending','ordered','received','cancelled')
)
BEGIN
    INSERT INTO Reorders(supplierID, itemID, reorderDate, quantity, status)
    VALUES(p_supplierID, p_itemID, p_reorderDate, p_quantity, p_status);
END //

DROP PROCEDURE IF EXISTS UpdateReorder //
CREATE PROCEDURE UpdateReorder(
    IN p_reorderID INT,
    IN p_supplierID INT,
    IN p_itemID INT,
    IN p_reorderDate DATETIME,
    IN p_quantity INT,
    IN p_status ENUM('pending','ordered','received','cancelled')
)
BEGIN
    UPDATE Reorders
    SET supplierID = p_supplierID,
        itemID = p_itemID,
        reorderDate = p_reorderDate,
        quantity = p_quantity,
        status = p_status
    WHERE reorderID = p_reorderID;
END //

DROP PROCEDURE IF EXISTS DeleteReorder //
CREATE PROCEDURE DeleteReorder(IN p_reorderID INT)
BEGIN
    DELETE FROM Reorders WHERE reorderID = p_reorderID;
END //

DELIMITER ;