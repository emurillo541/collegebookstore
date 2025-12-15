-- =========================
-- DATABASE DEFINITION
-- =========================

-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS `collegebookstore-db`;

-- Switch context to the new database before running any DDL/DML
USE `collegebookstore-db`;

-- =========================
--  DROP TABLES
-- (Order is crucial to avoid foreign key errors)
-- =========================
DROP TABLE IF EXISTS SalesDetail;
DROP TABLE IF EXISTS Sales;
DROP TABLE IF EXISTS Reorders;
DROP TABLE IF EXISTS Merchandise;
DROP TABLE IF EXISTS Employees;
DROP TABLE IF EXISTS Customers;
DROP TABLE IF EXISTS Suppliers;

-- =========================
-- TABLE CREATION
-- =========================

-- Table for customer information
CREATE TABLE Customers (
    customerID INT AUTO_INCREMENT PRIMARY KEY,
    firstName VARCHAR(50) NOT NULL,
    lastName VARCHAR(50) NOT NULL,
    custEmail VARCHAR(100) UNIQUE NOT NULL,
    addressLine1 VARCHAR(100) NOT NULL,
    addressLine2 VARCHAR(100),
    custZip CHAR(5)
);

-- Table for employee records
CREATE TABLE Employees (
    employeeID INT AUTO_INCREMENT PRIMARY KEY,
    firstName VARCHAR(50) NOT NULL,
    lastName VARCHAR(50) NOT NULL,
    -- NOTE: Removed the accidental 'sys_config' typo here
    email VARCHAR(100) UNIQUE,
    hireDate DATE
);

-- Table for book/merchandise suppliers
CREATE TABLE Suppliers (
    supplierID INT AUTO_INCREMENT PRIMARY KEY,
    companyName VARCHAR(100) NOT NULL,
    contactName VARCHAR(100),
    supplierEmail VARCHAR(100),
    phone VARCHAR(20)
);

-- Table for the store's inventory items (books, stationery, etc.)
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

-- Table for sales transactions (the header record)
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

-- Table for individual items sold in a sales transaction (the line items)
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

-- Table for tracking inventory replenishment orders
CREATE TABLE Reorders (
    reorderID INT AUTO_INCREMENT PRIMARY KEY,
    supplierID INT,
    itemID INT,
    reorderDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    quantity INT NOT NULL,
    status ENUM('pending', 'received') DEFAULT 'pending',
    FOREIGN KEY (supplierID) REFERENCES Suppliers(supplierID)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    FOREIGN KEY (itemID) REFERENCES Merchandise(itemID)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

-- =========================
-- INITIAL DATA INSERTION
-- =========================

-- Temporarily disable foreign key checks for bulk data insertion
SET FOREIGN_KEY_CHECKS = 0;

-- Insert five starter customers
INSERT INTO Customers (firstName, lastName, custEmail, addressLine1, addressLine2, custZip)
VALUES
    ('John', 'Doe', 'johndoe@email.com', '123 Main St', NULL, '20814'),
    ('Jane', 'Smith', 'janesmith@email.com', '456 Oak Ave', 'Apt 3B', '20815'),
    ('Michael', 'Brown', 'mbrown@email.com', '789 Elm Blvd', NULL, '20817'),
    ('Emily', 'Davis', 'edavis@email.com', '101 Pine Rd', NULL, '20816'),
    ('Robert', 'Wilson', 'rwilson@email.com', '202 Maple Ct', NULL, '20818');

-- Insert five starter employees
INSERT INTO Employees (firstName, lastName, email, hireDate)
VALUES
    ('Alice', 'Taylor', 'alice.taylor@store.com', '2020-05-01'),
    ('Brian', 'Adams', 'brian.adams@store.com', '2019-11-12'),
    ('Carla', 'Nguyen', 'carla.nguyen@store.com', '2021-03-20'),
    ('David', 'Lopez', 'david.lopez@store.com', '2022-07-15'),
    ('Evelyn', 'Carter', 'evelyn.carter@store.com', '2018-01-30');

-- Insert five starter suppliers
INSERT INTO Suppliers (companyName, contactName, supplierEmail, phone)
VALUES
    ('BookWorld Distributors', 'Tom Harris', 'tom@bookworld.com', '301-555-1000'),
    ('PrintWorks Inc.', 'Sara White', 'sara@printworks.com', '301-555-2000'),
    ('EduText Supplies', 'Mark Lee', 'mark@edutext.com', '301-555-3000'),
    ('Novelty Books', 'Linda Kim', 'linda@noveltybooks.com', '301-555-4000'),
    ('Ink & Paper Co.', 'George Allen', 'george@inkpaper.com', '301-555-5000');

-- Insert five starter merchandise items
INSERT INTO Merchandise (itemName, ISBN, price, supplierID, itemQuantity)
VALUES
    ('The Great Gatsby', '9780743273565', 10.99, 1, 50),
    ('Data Science 101', '9780134845623', 49.99, 3, 30),
    ('Python Programming', '9781492051367', 39.95, 2, 25),
    ('History of Art', '9780205685174', 59.99, 4, 20),
    ('Children''s Fairy Tales', '9780141329019', 14.50, 5, 40);

-- Insert five sales records (header data)
INSERT INTO Sales (customerID, employeeID, orderDate, totalAmount)
VALUES
    (1, 1, '2025-10-10 14:30:00', 60.94),
    (2, 3, '2025-10-11 09:15:00', 39.95),
    (3, 2, '2025-10-12 17:45:00', 24.99),
    (4, 4, '2025-10-13 11:00:00', 120.98),
    (5, 1, '2025-10-14 16:30:00', 14.50);

-- Insert the corresponding sales detail (line items)
INSERT INTO SalesDetail (salesID, itemID, itemQuantity, priceEach)
VALUES
    (1, 1, 2, 10.99),
    (1, 3, 1, 39.95),
    (2, 3, 1, 39.95),
    (3, 5, 1, 14.50),
    (4, 4, 2, 59.99),
    (5, 5, 1, 14.50);

-- Insert inventory reorder records
INSERT INTO Reorders (supplierID, itemID, reorderDate, quantity, status)
VALUES
    (1, 1, '2025-10-01 10:00:00', 100, 'received'),
    (2, 3, '2025-10-05 14:30:00', 50, 'pending'),
    (3, 2, '2025-10-07 09:00:00', 30, 'received'),
    (4, 4, '2025-10-10 11:45:00', 20, 'pending'),
    (5, 5, '2025-10-12 13:30:00', 40, 'received');

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;