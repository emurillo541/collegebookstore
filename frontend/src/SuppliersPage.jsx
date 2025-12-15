import React, { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import './SuppliersPage.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function SuppliersPage() {
    // Destructure the method needed to fetch the JWT access token
    const { getAccessTokenSilently } = useAuth0();

    const [suppliers, setSuppliers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // State for the new supplier input fields
    const [newSupplier, setNewSupplier] = useState({
        companyName: '',
        contactName: '',
        email: '',
        phone: '',
    });

    // State to manage the editing process
    const [isEditing, setIsEditing] = useState(false);
    const [editSupplierData, setEditSupplierData] = useState(null);

    // Fetches all supplier records from the backend (GET)
    const fetchSuppliers = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const accessToken = await getAccessTokenSilently();

            const res = await fetch(`${API_BASE_URL}/suppliers`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            
            if (!res.ok) {
                 const errorData = await res.json();
                 throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
            }

            const data = await res.json();
            setSuppliers(data);
            setIsLoading(false);
        } catch (err) {
            console.error("Error fetching suppliers:", err);
            setError(err.message);
            setIsLoading(false);
        }
    };

    // Load data on component mount
    useEffect(() => {
        if (API_BASE_URL) {
             fetchSuppliers();
        } else {
             alert("API Base URL is not configured.");
        }
    }, [getAccessTokenSilently]);

    // Handles input changes for the "Add New Supplier" form (No changes needed here)
    const handleChange = (e) => {
        const { name, value } = e.target;
        setNewSupplier(prev => ({ ...prev, [name]: value }));
    };

    // Handles input changes for the "Edit Supplier" form (No changes needed here)
    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditSupplierData(prev => ({ ...prev, [name]: value }));
    };

    // Sends a POST request to create a new supplier record (CREATE)
    const handleSubmit = async (e) => {
        e.preventDefault();
        const supplierData = {
            companyName: newSupplier.companyName,
            contactName: newSupplier.contactName,
            supplierEmail: newSupplier.email,
            phone: newSupplier.phone,
        };
        try {
            const accessToken = await getAccessTokenSilently();

            const response = await fetch(`${API_BASE_URL}/suppliers`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify(supplierData),
            });

            if (!response.ok) {
                 const errorData = await response.json();
                 throw new Error(errorData.error || `Failed to add supplier: ${response.statusText}`);
            }
            setNewSupplier({ companyName: '', contactName: '', email: '', phone: '' });
            alert("Supplier added successfully!");
            fetchSuppliers(); 
        } catch (error) {
            console.error("Error submitting new supplier:", error);
            alert(`Error adding supplier: ${error.message}`);
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        const updateData = {
            companyName: editSupplierData.companyName,
            contactName: editSupplierData.contactName,
            supplierEmail: editSupplierData.supplierEmail,
            phone: editSupplierData.phone,
        };
        try {
            const accessToken = await getAccessTokenSilently();

            const response = await fetch(`${API_BASE_URL}/suppliers/${editSupplierData.supplierID}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify(updateData),
            });

            if (!response.ok) {
                 const errorData = await response.json();
                 throw new Error(errorData.error || `Failed to update supplier: ${response.statusText}`);
            }
            alert(`Supplier ID ${editSupplierData.supplierID} updated successfully!`);
            // Close the edit form
            setIsEditing(false);
            setEditSupplierData(null);
            fetchSuppliers(); 
        } catch (error) {
            console.error("Error updating supplier:", error);
            alert(`Error updating supplier: ${error.message}`);
        }
    };

    
    const startEdit = (supplier) => {
        setIsEditing(true);
        setEditSupplierData({
            supplierID: supplier.supplierID,
            companyName: supplier.companyName,
            contactName: supplier.contactName || '',
            supplierEmail: supplier.supplierEmail || supplier.email || '',
            phone: supplier.phone || '',
        });
    };

    // Sends a DELETE request to remove a supplier record (DELETE)
    const handleDelete = async (supplierID) => {
        if (!window.confirm(`Are you sure you want to delete Supplier ID ${supplierID}? This will prevent future reorders from this supplier.`)) return;

        try {
            
            const accessToken = await getAccessTokenSilently();

            
            const response = await fetch(`${API_BASE_URL}/suppliers/${supplierID}`, { 
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            if (!response.ok) {
                 const errorData = await response.json();
                 throw new Error(errorData.error || `Failed to delete supplier: ${response.statusText}`);
            }
            
            alert(`Supplier ID ${supplierID} deleted successfully.`);
            // Update state immediately to reflect the deletion
            setSuppliers(suppliers.filter(s => s.supplierID !== supplierID));
        } catch (error) {
            console.error("Error deleting supplier:", error);
            alert(`Error deleting supplier: ${error.message}`);
        }
    };


    if (isLoading) return <div className="page-container suppliers-page"><h1>Supplier Management</h1><p>Loading supplier data...</p></div>;
    if (error) return <div className="page-container suppliers-page"><h1>Supplier Management</h1><p>Error: Could not load data. {error}</p></div>;

    return (
        <div className="page-container suppliers-page">
            <h1>Supplier Management (Full CRUD)</h1>

            <section className="form-section">
                {isEditing ? (
                    <div className="edit-form-section">
                        <h2>📝 Edit Supplier ID: {editSupplierData.supplierID}</h2>
                        <form id="edit-supplier-form" onSubmit={handleEditSubmit}>
                            <div className="form-grid">
                                <label htmlFor="companyName">Company Name:</label>
                                <input type="text" id="companyName" name="companyName" required value={editSupplierData.companyName} onChange={handleEditChange} />

                                <label htmlFor="contactName">Contact Name:</label>
                                <input type="text" id="contactName" name="contactName" required value={editSupplierData.contactName} onChange={handleEditChange} />

                                <label htmlFor="supplierEmail">Email:</label>
                                <input type="email" id="supplierEmail" name="supplierEmail" required value={editSupplierData.supplierEmail} onChange={handleEditChange} />

                                <label htmlFor="phone">Phone:</label>
                                <input type="tel" id="phone" name="phone" value={editSupplierData.phone} onChange={handleEditChange} />
                            </div>
                            <div className="form-actions">
                                <button type="submit">Save Changes</button>
                                <button type="button" onClick={() => setIsEditing(false)}>Cancel Edit</button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <div className="add-form-section">
                        <h2>Add New Supplier</h2>
                        <form id="add-supplier-form" onSubmit={handleSubmit}>
                            <div className="form-grid">
                                <label htmlFor="companyName">Company Name:</label>
                                <input type="text" id="companyName" name="companyName" required value={newSupplier.companyName} onChange={handleChange} />

                                <label htmlFor="contactName">Contact Name:</label>
                                <input type="text" id="contactName" name="contactName" required value={newSupplier.contactName} onChange={handleChange} />

                                <label htmlFor="email">Email:</label>
                                <input type="email" id="email" name="email" required value={newSupplier.email} onChange={handleChange} />

                                <label htmlFor="phone">Phone:</label>
                                <input type="tel" id="phone" name="phone" value={newSupplier.phone} onChange={handleChange} />
                            </div>
                            <div className="form-actions">
                                <button type="submit">Add Supplier</button>
                            </div>
                        </form>
                    </div>
                )}
            </section>

            <hr />

            <section className="browse-table-section">
                <h2>Current List of Suppliers</h2>
                {suppliers.length === 0 ? <p>No supplier records found.</p> : (
                    <table className="suppliers-table">
                        <thead>
                            <tr>
                                <th>Supplier ID</th>
                                <th>Company Name</th>
                                <th>Contact Name</th>
                                <th>Phone</th>
                                <th>Supplier Email</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {suppliers.map(s => (
                                <tr key={s.supplierID}>
                                    <td>{s.supplierID}</td>
                                    <td>{s.companyName}</td>
                                    <td>{s.contactName || '-'}</td>
                                    <td>{s.phone || '-'}</td>
                                    <td>{s.supplierEmail || s.email || '-'}</td>
                                    <td>
                                        <button onClick={() => startEdit(s)} disabled={isEditing && editSupplierData.supplierID !== s.supplierID}>Edit</button>
                                        <button onClick={() => handleDelete(s.supplierID)} className="delete-btn">Delete</button>
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

export default SuppliersPage;