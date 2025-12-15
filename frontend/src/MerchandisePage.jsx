import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import './Merchandise.css';


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function MerchandisePage() {
    
    const { getAccessTokenSilently } = useAuth0();

    // State to hold merchandise items
    const [products, setProducts] = useState([]);
    // State to hold suppliers
    const [suppliers, setSuppliers] = useState([]);
    // Loading and error state
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // State for creating a new merchandise item
    const [newItem, setNewItem] = useState({
        itemName: '',
        supplierID: '',
        itemQuantity: '',
        price: '',
        ISBN: ''  // optional
    });

    // State for editing an existing merchandise item
    const [editItem, setEditItem] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    // Fetch merchandise and suppliers simultaneously (READ operation)
    const fetchMerchandiseAndSuppliers = async () => {
        setIsLoading(true);
        setError(null);
        try {
            
            const accessToken = await getAccessTokenSilently();
            
            const authHeaders = {
                Authorization: `Bearer ${accessToken}`,
            };

            // Fetch both data sets in parallel with authentication headers
            const [merchResponse, supplierResponse] = await Promise.all([
                
                fetch(`${API_BASE_URL}/merchandise`, { headers: authHeaders }),
                
                fetch(`${API_BASE_URL}/suppliers`, { headers: authHeaders })
            ]);

            if (!merchResponse.ok || !supplierResponse.ok) {
                // If the token is bad, this will throw an error
                throw new Error(`Data fetch failed. Merch Status: ${merchResponse.status}. Suppliers Status: ${supplierResponse.status}. Authentication may have failed.`);
            }

            const merchData = await merchResponse.json();
            const supplierData = await supplierResponse.json();

            setProducts(merchData);
            setSuppliers(supplierData);

        } catch (err) {
            console.error("Error fetching data:", err);
            setError(`Error loading data. Check if you are logged in and the API is running. Details: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch data on initial render
    useEffect(() => {
        if (API_BASE_URL) {
            fetchMerchandiseAndSuppliers();
        } else {
            setError("API Base URL is not configured.");
            setIsLoading(false);
        }
    }, [API_BASE_URL, getAccessTokenSilently]); // Dependency array includes the Auth0 token function

    // Helper to get supplier name by ID 
    const getSupplierName = (supplierID) => {
        const supplier = suppliers.find(s => s.supplierID === supplierID);
        return supplier ? supplier.companyName : 'Unknown Supplier';
    };

    // Convert input values to proper types (int/float) 
    const handleValueConversion = (name, value) => {
        if (name === 'itemQuantity' || name === 'supplierID') {
            return value === '' ? '' : parseInt(value, 10);
        } else if (name === 'price') {
            return value === '' ? '' : parseFloat(value);
        }
        return value;
    };

    // Handle input changes for new item 
    const handleNewChange = (e) => {
        const { name, value } = e.target;
        setNewItem(prev => ({
            ...prev,
            [name]: handleValueConversion(name, value)
        }));
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditItem(prev => ({
            ...prev,
            [name]: handleValueConversion(name, value)
        }));
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();

        if (!newItem.itemName || !newItem.supplierID || isNaN(newItem.itemQuantity) || isNaN(newItem.price)) {
            alert("Please fill in all fields with valid data (Quantity and Price must be numbers).");
            return;
        }
        if (newItem.price <= 0) {
            alert("Price must be greater than 0.");
            return;
        }

        try {
            const accessToken = await getAccessTokenSilently(); 

            const response = await fetch(`${API_BASE_URL}/merchandise/add`, { 
                method: 'POST',
                
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`, 
                },
                body: JSON.stringify({
                    ...newItem,
                    ISBN: newItem.ISBN || null
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Failed to create merchandise item: ${response.statusText}`);
            }

            alert("Merchandise item added successfully!");
            setNewItem({ itemName: '', supplierID: '', itemQuantity: '', price: '', ISBN: '' });
            fetchMerchandiseAndSuppliers();
        } catch (error) {
            console.error("Error submitting new item:", error);
            alert(`Error adding item: ${error.message}`);
        }
    };

    // Start editing selected item (No change)
    const handleEditStart = (item) => {
        setEditItem({
            ...item,
            supplierID: item.supplierID != null ? item.supplierID.toString() : '',
            
            itemQuantity: item.quantityAvailable != null ? item.quantityAvailable.toString() : '',
            price: item.price != null ? item.price.toString() : '',
            ISBN: item.ISBN || ''
        });
        setIsEditing(true);
    };

    // Cancel editing 
    const handleEditCancel = () => {
        setIsEditing(false);
        setEditItem(null);
    };

    // Submit updated item (UPDATE operation)
    const handleUpdateSubmit = async (e) => {
        e.preventDefault();

        if (!editItem || !editItem.itemID) return;
        const updateData = {
            
            itemName: editItem.itemName,
            supplierID: parseInt(editItem.supplierID, 10),
            itemQuantity: parseInt(editItem.itemQuantity, 10), 
            price: parseFloat(editItem.price),
            ISBN: editItem.ISBN || null
        };

        if (isNaN(updateData.itemQuantity) || isNaN(updateData.price) || updateData.price <= 0) {
            alert("Quantity must be a number and Price must be greater than 0.");
            return;
        }

        try {
            const accessToken = await getAccessTokenSilently(); 

            const response = await fetch(`${API_BASE_URL}/merchandise/${editItem.itemID}`, { 
                method: 'PUT',
               
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`, 
                },
                body: JSON.stringify(updateData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Failed to update merchandise item: ${response.statusText}`);
            }

            alert(`Item ID ${editItem.itemID} updated successfully!`);
            handleEditCancel();
            fetchMerchandiseAndSuppliers();
        } catch (error) {
            console.error("Error updating item:", error);
            alert(`Error updating item: ${error.message}`);
        }
    };

    // Delete an item (DELETE operation)
    const handleDelete = async (itemID) => {
        if (!window.confirm(`Are you sure you want to delete Merchandise Item ID ${itemID}? This will permanently remove it from inventory.`)) {
            return;
        }

        try {
            const accessToken = await getAccessTokenSilently(); 

            const response = await fetch(`${API_BASE_URL}/merchandise/${itemID}`, { 
                method: 'DELETE',
                
                headers: {
                    Authorization: `Bearer ${accessToken}`, 
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Failed to delete merchandise item: ${response.statusText}`);
            }

            alert(`Merchandise Item ID ${itemID} deleted successfully.`);
            fetchMerchandiseAndSuppliers();
        } catch (error) {
            console.error("Error deleting item:", error);
            alert(`Error deleting item: ${error.message}`);
        }
    };

    // Show loading state
    if (isLoading) {
        return <div className="merchandise-page"><h1>Inventory Management</h1><p>Loading inventory and supplier data...</p></div>;
    }

    // Show error if fetch failed
    if (error) {
        return <div className="merchandise-page"><h1>Inventory Management</h1><p>Error: Could not load data. **{error}**</p></div>;
    }

    return (
        <div className="merchandise-page page-container">
            <h1>🛍️ Inventory Management (CRUD)</h1>
            <p>This page manages all merchandise items in stock, their price, and current quantity.</p>

            {/* Form to add new item */}
            {!isEditing && (
                <section className="add-item-section">
                    <h2>Add New Item</h2>
                    <form id="add-item-form" onSubmit={handleCreateSubmit}>
                        <div className="form-grid">
                            <label htmlFor="itemName">Item Name:</label>
                            <input type="text" id="itemName" name="itemName" required
                                value={newItem.itemName} onChange={handleNewChange} />

                            <label htmlFor="supplierID">Supplier:</label>
                            <select id="supplierID" name="supplierID" required
                                value={newItem.supplierID} onChange={handleNewChange}>
                                <option value="">-- Select Supplier --</option>
                                {suppliers.map(sup => (
                                    <option key={sup.supplierID} value={sup.supplierID}>{sup.companyName}</option>
                                ))}
                            </select>

                            <label htmlFor="itemQuantity">Quantity in Stock:</label>
                            <input type="number" id="itemQuantity" name="itemQuantity" required min="0"
                                value={newItem.itemQuantity} onChange={handleNewChange} />

                            <label htmlFor="price">Price:</label>
                            <input type="number" id="price" name="price" required min="0.01" step="0.01"
                                value={newItem.price} onChange={handleNewChange} />

                            <label htmlFor="ISBN">ISBN:</label>
                            <input type="text" id="ISBN" name="ISBN"
                                value={newItem.ISBN} onChange={handleNewChange} />
                        </div>
                        <button type="submit">Add Item</button>
                    </form>
                </section>
            )}

            {/* Form to edit existing item */}
            {isEditing && editItem && (
                <section className="edit-item-section">
                    <h2>Edit Item ID: {editItem.itemID}</h2>
                    <form id="edit-item-form" onSubmit={handleUpdateSubmit}>
                        <div className="form-grid">
                            <label htmlFor="editItemName">Item Name:</label>
                            <input type="text" id="editItemName" name="itemName" required
                                value={editItem.itemName} onChange={handleEditChange} />

                            <label htmlFor="editSupplierID">Supplier:</label>
                            <select id="editSupplierID" name="supplierID" required
                                value={editItem.supplierID} onChange={handleEditChange}>
                                <option value="">-- Select Supplier --</option>
                                {suppliers.map(sup => (
                                    <option key={sup.supplierID} value={sup.supplierID}>{sup.companyName}</option>
                                ))}
                            </select>

                            <label htmlFor="editItemQuantity">Quantity in Stock:</label>
                            <input type="number" id="editItemQuantity" name="itemQuantity" required min="0"
                                value={editItem.itemQuantity} onChange={handleEditChange} />

                            <label htmlFor="editPrice">Price:</label>
                            <input type="number" id="editPrice" name="price" required min="0.01" step="0.01"
                                value={editItem.price} onChange={handleEditChange} />

                            <label htmlFor="editISBN">ISBN:</label>
                            <input type="text" id="editISBN" name="ISBN"
                                value={editItem.ISBN} onChange={handleEditChange} />
                        </div>
                        <div className="form-actions">
                            <button type="submit">Save Changes</button>
                            <button type="button" onClick={handleEditCancel} className="cancel-btn">Cancel</button>
                        </div>
                    </form>
                </section>
            )}

            <hr/>

            {/* Table showing current inventory */}
            <section className="merchandise-table-section">
                <h2>Current Inventory ({products.length})</h2>

                {products.length === 0 ? (
                    <p>No merchandise items found.</p>
                ) : (
                    <table className="merchandise-table">
                        <thead>
                            <tr>
                                <th>Item ID</th>
                                <th>Name</th>
                                <th>Supplier</th>
                                <th>Quantity</th>
                                <th>Price</th>
                                <th>ISBN</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map(item => (
                                <tr key={item.itemID}>
                                    <td>{item.itemID}</td>
                                    <td>{item.itemName}</td>
                                    <td>{getSupplierName(item.supplierID)}</td>
                                    <td className={item.quantityAvailable === 0 ? 'low-stock' : ''}>{item.quantityAvailable}</td>
                                    <td>${parseFloat(item.price).toFixed(2)}</td>
                                    <td>{item.ISBN}</td>
                                    <td>
                                        <button
                                            onClick={() => handleEditStart(item)}
                                            className="edit-btn"
                                            disabled={isEditing && editItem.itemID !== item.itemID}>
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.itemID)}
                                            className="delete-btn"
                                            disabled={isEditing}>
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

export default MerchandisePage;