# 📚 CollegeBookstore Web Application

A full-stack, secure web application for managing sales, customers, employees, suppliers, merchandise, and reorders for a college bookstore. This project demonstrates expertise across the modern application stack, featuring dedicated cloud services for deployment, security, and data management.

---

## Project Architecture Overview

The application is built on a robust, three-tiered, cloud-native architecture.

| Component | Technology | Role | Deployment Service |
| :--- | :--- | :--- | :--- |
| **Frontend** | React.js (Vite) | User Interface and interaction logic. | **Vercel** |
| **Security/Auth** | **Auth0** | Handles all user identity, authentication, and token management. | **Auth0** |
| **Backend API** | Node.js (Express.js) | Securely exposes CRUD operations and business logic via REST endpoints. | **Render** |
| **Database** | **MySQL** | Persistent, scalable relational data storage. | **AWS RDS** |


---

## Project Functionality

This application supports all core bookstore operations, including:

* **Core Entities:** Managing customers, employees, merchandise, suppliers, Reorders, Sales, and Sales Details.
* **Transactions:** Processing complex sales transactions and detailed line items.
* **Supply Chain:** Managing inventory reorders and supplier integration.
* **Full CRUD functionality** for all entities.
* **Secure Authentication:** User login and access control via Auth0 integration.
* **UI/UX:** Responsive and interactive UI built with React.

---

## Technologies Used

### Frontend (Deployed on Vercel)

* **React.js** (functional components and hooks)
* **Vite.js** (Build tool)

### Backend (Deployed on Render)

* **Node.js** / **Express.js**
* **Auth0 Express Middleware** for token validation and API security.
* **MySQL** (via `mysql2/promise` with connection pooling)

### Database and Infrastructure

* **AWS RDS (MySQL):** Used for a production-grade, highly available database instance.
* **Database Scripts:** Includes dedicated DDL, DML, and Stored Procedures (`PL.sql`).

---

## Security and Database Design

The project employs rigorous security and database design principles:

* **Secure Deployment:** All sensitive data (AWS credentials, Auth0 secrets) are stored exclusively as **Environment Variables** on the Render and Vercel platforms, never in the public codebase (excluded via `.gitignore`).
* **Stored Procedures (`PL.sql`):** Critical business logic, such as data validation and transaction processing, is encapsulated in stored procedures to enhance security and performance.
* **Data Integrity:** The relational schema enforces data integrity through primary keys, foreign keys, and constraints.

---

## Acknowledgements and Code Attribution

Parts of this project, including the foundational database connection setup and some initial React component structures, were inspired by and adapted from the Oregon State University CS340 course materials, specifically *Activity 2 - Connect webapp to database (Individual)*.

Additionally, the comprehensive SQL sample data was generated with assistance from OpenAI's ChatGPT.

I have ensured that all adapted code is properly integrated and tested within the context of this project, and that credit is explicitly given for non-original work to maintain transparency and academic integrity.