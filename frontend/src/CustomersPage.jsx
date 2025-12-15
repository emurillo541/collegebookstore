import React, { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react'; 
import './CustomersPage.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function CustomersPage() {
    
    const { getAccessTokenSilently } = useAuth0(); 

    // State to store list of customers fetched from backend
    const [customers, setCustomers] = useState([]);
    const [isLoading, setIsLoading] = useState(true); // Loading indicator
    const [error, setError] = useState(null); // Error state

    // State for adding a new customer
    const [newCustomer, setNewCustomer] = useState({
        firstName: '',
        lastName: '',
        custEmail: '',
        addressLine1: '',
        addressLine2: '',
        custZip: '',
    });

    // Editing state and data
    const [isEditing, setIsEditing] = useState(false);
    const [editCustomerData, setEditCustomerData] = useState(null);

    // Function to fetch all customers from backend (READ operation)
    const fetchCustomers = async () => {
        setIsLoading(true);
        setError(null);
        try {
            
            const accessToken = await getAccessTokenSilently();

            
            const res = await fetch(`${API_BASE_URL}/customers`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            if (!res.ok) {
                
                throw new Error(`HTTP error! Status: ${res.status}. Unauthorized or Forbidden.`);
            }
            
            const data = await res.json();
            setCustomers(data);
            setIsLoading(false);
            return data;
        } catch (err) {
            console.error("Error fetching customers:", err);
            // Display a user-friendly error if authentication failed
            setError(err.message.includes('401') || err.message.includes('403')
                ? "Authentication failed. Please log out and log back in."
                : `Error loading data: ${err.message}`
            );
            setIsLoading(false);
            return [];
        }
    };

    // Fetch customers when component mounts
    useEffect(() => {
        
        if (API_BASE_URL) {
            fetchCustomers();
        } else {
            setError("API Base URL is not configured. Check your VITE_API_BASE_URL environment variable.");
            setIsLoading(false);
        }
    }, [API_BASE_URL, getAccessTokenSilently]); // Dependency array: fetch on mount and on token/URL change

    // Handle input changes for adding new customer 
    const handleChange = (e) => {
        const { name, value } = e.target;
        setNewCustomer(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    // Handle input changes for editing existing customer 
    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditCustomerData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    // Submit new customer to backend (CREATE operation)
    const handleSubmit = async (e) => {
        e.preventDefault();

        const customerData = {
            firstName: newCustomer.firstName,
            lastName: newCustomer.lastName,
            custEmail: newCustomer.custEmail,
            addressLine1: newCustomer.addressLine1,
            addressLine2: newCustomer.addressLine2 || null,
            custZip: newCustomer.custZip,
        };

        try {
            const accessToken = await getAccessTokenSilently(); 

            const response = await fetch(`${API_BASE_URL}/customers`, { 
                method: 'POST',
                
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`, 
                },
                body: JSON.stringify(customerData),
            });

            if (!response.ok) {
                throw new Error(`Failed to add customer: ${response.statusText}`);
            }

            // Clear form and refresh customer list
            setNewCustomer({ firstName: '', lastName: '', custEmail: '', addressLine1: '', addressLine2: '', custZip: '' });
            alert("Customer added successfully!");
            fetchCustomers();

        } catch (error) {
            console.error("Error submitting new customer:", error);
            alert(`Error adding customer: ${error.message}`);
        }
    };

    // Submit edits for existing customer (UPDATE operation)
    const handleEditSubmit = async (e) => {
        e.preventDefault();

        const updateData = {
            firstName: editCustomerData.firstName,
            lastName: editCustomerData.lastName,
            custEmail: editCustomerData.custEmail,
            addressLine1: editCustomerData.addressLine1,
            addressLine2: editCustomerData.addressLine2 || null,
            custZip: editCustomerData.custZip,
        };

        try {
            const accessToken = await getAccessTokenSilently(); 
            
            const response = await fetch(`${API_BASE_URL}/customers/${editCustomerData.customerID}`, { 
                method: 'PUT',
                
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`, 
                },
                body: JSON.stringify(updateData),
            });

            if (!response.ok) {
                throw new Error(`Failed to update customer: ${response.statusText}`);
            }

            alert(`Customer ID ${editCustomerData.customerID} updated successfully!`);
            setIsEditing(false);
            setEditCustomerData(null);
            fetchCustomers(); // Refresh customer list

        } catch (error) {
            console.error("Error updating customer:", error);
            alert(`Error updating customer: ${error.message}`);
        }
    };

    // Initialize editing mode with selected customer's data 
    const startEdit = (customer) => {
        setIsEditing(true);
        setEditCustomerData({
            customerID: customer.customerID,
            firstName: customer.firstName,
            lastName: customer.lastName,
            custEmail: customer.custEmail,
            addressLine1: customer.addressLine1,
            addressLine2: customer.addressLine2 || '',
            custZip: customer.custZip,
        });
    };

    // Delete a customer after confirmation (DELETE operation)
    const handleDelete = async (customerID) => {
        if (!window.confirm(`Are you sure you want to delete Customer ID ${customerID}? This action cannot be undone.`)) {
            return;
        }

        try {
            const accessToken = await getAccessTokenSilently(); 

            const response = await fetch(`${API_BASE_URL}/customers/${customerID}`, { 
                method: 'DELETE',
                
                headers: {
                    Authorization: `Bearer ${accessToken}`, 
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to delete customer: ${response.statusText}`);
            }

            alert(`Customer ID ${customerID} deleted successfully.`);
            setCustomers(customers.filter(c => c.customerID !== customerID));

        } catch (error) {
            console.error("Error deleting customer:", error);
            alert(`Error deleting customer: ${error.message}`);
        }
    };

    if (isLoading) {
        return <div className="customers-page"><h1>Customer Management</h1><p>Loading customer data...</p></div>;
    }

    if (error) {
        return <div className="customers-page"><h1>Customer Management</h1><p>Error: Could not load data. **{error}**</p></div>;
    }

    return (
        <div className="customers-page">
            <h1>Customer Management (Full CRUD)</h1>

            {/* Form section: add new or edit existing customer */}
            <section className="form-section">
                {isEditing ? (
                    // ... (Edit form JSX) ...
                    <div className="edit-form-section">
                        <h2> 📝 Edit Customer ID: {editCustomerData.customerID}</h2>
                        <form id="edit-customer-form" onSubmit={handleEditSubmit} className="customer-form-grid">
                            {/* Form fields for editing */}
                            <div className="form-group">
                                <label htmlFor="firstName">First Name:</label>
                                <input type="text" id="firstName" name="firstName" required
                                    value={editCustomerData.firstName} onChange={handleEditChange} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="lastName">Last Name:</label>
                                <input type="text" id="lastName" name="lastName" required
                                    value={editCustomerData.lastName} onChange={handleEditChange} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="custEmail">Email:</label>
                                <input type="email" id="custEmail" name="custEmail" required
                                    value={editCustomerData.custEmail} onChange={handleEditChange} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="addressLine1">Address Line 1:</label>
                                <input type="text" id="addressLine1" name="addressLine1" required
                                    value={editCustomerData.addressLine1} onChange={handleEditChange} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="addressLine2">Address Line 2:</label>
                                <input type="text" id="addressLine2" name="addressLine2"
                                    value={editCustomerData.addressLine2} onChange={handleEditChange} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="custZip">Zip:</label>
                                <input type="text" id="custZip" name="custZip" maxLength="5" required
                                    value={editCustomerData.custZip} onChange={handleEditChange} />
                            </div>
                            <div className="form-actions">
                                <button type="submit" className="edit-btn">Save Changes</button>
                                <button type="button" onClick={() => setIsEditing(false)}>Cancel Edit</button>
                            </div>
                        </form>
                    </div>
                ) : (
                    // ... (Add form JSX) ...
                    <div className="add-form-section">
                        <h2> Add New Customer</h2>
                        <form id="add-customer-form" onSubmit={handleSubmit} className="customer-form-grid">
                            {/* Form fields for adding new customer */}
                            <div className="form-group">
                                <label htmlFor="firstName">First Name:</label>
                                <input type="text" id="firstName" name="firstName" required value={newCustomer.firstName} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="lastName">Last Name:</label>
                                <input type="text" id="lastName" name="lastName" required value={newCustomer.lastName} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="custEmail">Email:</label>
                                <input type="email" id="custEmail" name="custEmail" required value={newCustomer.custEmail} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="addressLine1">Address Line 1:</label>
                                <input type="text" id="addressLine1" name="addressLine1" required value={newCustomer.addressLine1} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="addressLine2">Address Line 2:</label>
                                <input type="text" id="addressLine2" name="addressLine2" value={newCustomer.addressLine2} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="custZip">Zip:</label>
                                <input type="text" id="custZip" name="custZip" maxLength="5" required value={newCustomer.custZip} onChange={handleChange} />
                            </div>
                            <button type="submit" className="add-btn">Add Customer</button>
                        </form>
                    </div>
                )}
            </section>

            <hr />
            
            {/* Table section to browse existing customers */}
            <section className="browse-table-section">
                <h2>Current Customers</h2>
                {customers.length === 0 ? (
                    <p>No customers found.</p>
                ) : (
                    <table className="customers-table">
                        <thead>
                            <tr>
                                <th>Customer ID</th> 
                                <th>First Name</th>
                                <th>Last Name</th>
                                <th>Customer Email</th> 
                                <th>Address 1</th>
                                <th>Address 2</th>
                                <th>Zip Code</th> 
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customers.map(c => (
                                <tr key={c.customerID}>
                                    <td>{c.customerID}</td>
                                    <td>{c.firstName}</td>
                                    <td>{c.lastName}</td>
                                    <td>{c.custEmail}</td>
                                    <td>{c.addressLine1}</td>
                                    <td>{c.addressLine2 || '-'}</td>
                                    <td>{c.custZip}</td>
                                    
                                    <td>
                                        {/* Buttons for edit/delete actions */}
                                        <div className="action-buttons-container"> 
                                            <button
                                                onClick={() => startEdit(c)}
                                                disabled={isEditing && editCustomerData.customerID !== c.customerID}
                                                className="customer-action-btn edit-btn" 
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(c.customerID)}
                                                className="customer-action-btn delete-btn" 
                                            >
                                                Delete
                                            </button>
                                        </div>
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

export default CustomersPage;