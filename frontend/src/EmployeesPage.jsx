import React, { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import './EmployeesPage.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function EmployeesPage() {
   
    const { getAccessTokenSilently } = useAuth0();

    // State to hold employees fetched from backend
    const [employees, setEmployees] = useState([]);
    const [isLoading, setIsLoading] = useState(true); // Loading indicator
    const [error, setError] = useState(null); // Error message if fetch fails

    // State for adding a new employee
    const [newEmployee, setNewEmployee] = useState({
        firstName: '',
        lastName: '',
        email: '',
        hireDate: '',
    });

    // State for editing an existing employee
    const [isEditing, setIsEditing] = useState(false);
    const [editEmployeeData, setEditEmployeeData] = useState(null);

    // Fetch all employees from backend (READ operation)
    const fetchEmployees = async () => {
        setIsLoading(true);
        setError(null);
        try {
            
            const accessToken = await getAccessTokenSilently();

        
            const res = await fetch(`${API_BASE_URL}/employees`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            if (!res.ok) {
                // If the token is bad, this will throw an error
                throw new Error(`HTTP error! status: ${res.status}. Authentication may have failed.`);
            }

            const data = await res.json();
            setEmployees(data);
            setIsLoading(false);
        } catch (err) {
            console.error("Error fetching employees:", err);
            setError(`Error loading data. Check if you are logged in and the API is running. Details: ${err.message}`);
            setIsLoading(false);
        }
    };

    // Fetch employees when component mounts
    useEffect(() => {
        if (API_BASE_URL) {
            fetchEmployees();
        } else {
            setError("API Base URL is not configured.");
            setIsLoading(false);
        }
    }, [API_BASE_URL, getAccessTokenSilently]); // Dependency array includes the Auth0 token function

    // Handle form input changes for adding a new employee 
    const handleChange = (e) => {
        const { name, value } = e.target;
        setNewEmployee(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    // Handle form input changes for editing an existing employee 
    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditEmployeeData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    // Submit new employee to backend (CREATE operation)
    const handleSubmit = async (e) => {
        e.preventDefault();

        const employeeData = {
            firstName: newEmployee.firstName,
            lastName: newEmployee.lastName,
            email: newEmployee.email,
            hireDate: newEmployee.hireDate,
        };

        try {
            const accessToken = await getAccessTokenSilently(); 

            const response = await fetch(`${API_BASE_URL}/employees`, { 
                method: 'POST',
                
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`, 
                },
                body: JSON.stringify(employeeData),
            });

            if (!response.ok) {
                throw new Error(`Failed to add employee: ${response.statusText}`);
            }

            // Clear form and refresh employee list
            setNewEmployee({ firstName: '', lastName: '', email: '', hireDate: '' });
            alert("Employee added successfully!");
            fetchEmployees();

        } catch (error) {
            console.error("Error submitting new employee:", error);
            alert(`Error adding employee: ${error.message}`);
        }
    };

    // Submit edits for an existing employee (UPDATE operation)
    const handleEditSubmit = async (e) => {
        e.preventDefault();

        const updateData = {
            firstName: editEmployeeData.firstName,
            lastName: editEmployeeData.lastName,
            email: editEmployeeData.email,
            hireDate: editEmployeeData.hireDate,
        };

        try {
            const accessToken = await getAccessTokenSilently(); 

            const response = await fetch(`${API_BASE_URL}/employees/${editEmployeeData.employeeID}`, { 
                method: 'PUT',
                
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`, 
                },
                body: JSON.stringify(updateData),
            });

            if (!response.ok) {
                throw new Error(`Failed to update employee: ${response.statusText}`);
            }

            alert(`Employee ID ${editEmployeeData.employeeID} updated successfully!`);
            setIsEditing(false);
            setEditEmployeeData(null);
            fetchEmployees();

        } catch (error) {
            console.error("Error updating employee:", error);
            alert(`Error updating employee: ${error.message}`);
        }
    };

    // Prepare form for editing selected employee 
    const startEdit = (employee) => {
        setIsEditing(true);
        // Format date to yyyy-mm-dd for date input field
        const formattedDate = new Date(employee.hireDate).toISOString().substring(0, 10);

        setEditEmployeeData({
            employeeID: employee.employeeID,
            firstName: employee.firstName,
            lastName: employee.lastName,
            email: employee.email,
            hireDate: formattedDate,
        });
    };

    // Delete an employee after confirmation (DELETE operation)
    const handleDelete = async (employeeID) => {
        if (!window.confirm(`Are you sure you want to delete Employee ID ${employeeID}? This action cannot be undone.`)) {
            return;
        }

        try {
            const accessToken = await getAccessTokenSilently(); 

            const response = await fetch(`${API_BASE_URL}/employees/${employeeID}`, { 
                method: 'DELETE',
                
                headers: {
                    Authorization: `Bearer ${accessToken}`, 
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to delete employee: ${response.statusText}`);
            }

            alert(`Employee ID ${employeeID} deleted successfully.`);
            setEmployees(employees.filter(e => e.employeeID !== employeeID));

        } catch (error) {
            console.error("Error deleting employee:", error);
            alert(`Error deleting employee: ${error.message}`);
        }
    };

    // Show loading indicator while fetching data
    if (isLoading) {
        return <div className="page-container employees-page"><h1>Employee Management</h1><p>Loading employee data...</p></div>;
    }

    // Show error message if fetching fails
    if (error) {
        return <div className="page-container employees-page"><h1>Employee Management</h1><p>Error: Could not load data. **{error}**</p></div>;
    }

    return (
        <div className="page-container employees-page">
            <h1>Employee Management (Full CRUD)</h1>

            {/* Form section for adding or editing employees */}
            <section className="form-section">
                {isEditing ? (
                    // ... (Edit form JSX) ...
                    <div className="edit-form-section">
                        <h2> 📝 Edit Employee ID: {editEmployeeData.employeeID}</h2>
                        <form id="edit-employee-form" onSubmit={handleEditSubmit}>
                            {/* Input fields for editing employee */}
                            <label htmlFor="firstName">First Name:</label>
                            <input type="text" id="firstName" name="firstName" required
                                value={editEmployeeData.firstName} onChange={handleEditChange} />

                            <label htmlFor="lastName">Last Name:</label>
                            <input type="text" id="lastName" name="lastName" required
                                value={editEmployeeData.lastName} onChange={handleEditChange} />

                            <label htmlFor="email">Email:</label>
                            <input type="email" id="email" name="email" required
                                value={editEmployeeData.email} onChange={handleEditChange} />

                            <label htmlFor="hireDate">Hire Date:</label>
                            <input type="date" id="hireDate" name="hireDate" required
                                value={editEmployeeData.hireDate} onChange={handleEditChange} />

                            <div className="form-actions">
                                <button type="submit">Save Changes</button>
                                <button type="button" onClick={() => setIsEditing(false)}>Cancel Edit</button>
                            </div>
                        </form>
                    </div>
                ) : (
                    // ... (Add form JSX) ...
                    <div className="add-form-section">
                        <h2> Add New Employee</h2>
                        <form id="add-employee-form" onSubmit={handleSubmit}>
                            {/* Input fields for adding employee */}
                            <label htmlFor="firstName">First Name:</label>
                            <input type="text" id="firstName" name="firstName" required value={newEmployee.firstName} onChange={handleChange} />

                            <label htmlFor="lastName">Last Name:</label>
                            <input type="text" id="lastName" name="lastName" required value={newEmployee.lastName} onChange={handleChange} />

                            <label htmlFor="email">Email:</label>
                            <input type="email" id="email" name="email" required value={newEmployee.email} onChange={handleChange} />

                            <label htmlFor="hireDate">Hire Date:</label>
                            <input type="date" id="hireDate" name="hireDate" required value={newEmployee.hireDate} onChange={handleChange} />
                            <button type="submit">Add Employee</button>
                        </form>
                    </div>
                )}
            </section>

            <hr />

            {/* Table section to view current employees */}
            <section className="browse-table-section">
                <h2>Current Employees</h2>
                {employees.length === 0 ? (
                    <p>No employee records found.</p>
                ) : (
                    <table className="employees-table">
                        <thead>
                            <tr>
                                <th>Employee ID</th>
                                <th>First Name</th>
                                <th>Last Name</th>
                                <th>Email</th>
                                <th>Hire Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.map(e => (
                                <tr key={e.employeeID}>
                                    <td>{e.employeeID}</td>
                                    <td>{e.firstName}</td>
                                    <td>{e.lastName}</td>
                                    <td>{e.email}</td>
                                    <td>{new Date(e.hireDate).toLocaleDateString()}</td>
                                    <td>
                                        {/* Buttons for editing or deleting employee */}
                                        <button
                                            onClick={() => startEdit(e)}
                                            disabled={isEditing && editEmployeeData.employeeID !== e.employeeID}
                                            className="employee-action-btn edit-btn"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(e.employeeID)}
                                            className="employee-action-btn delete-btn">
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>
        </div>
    );
}

export default EmployeesPage;