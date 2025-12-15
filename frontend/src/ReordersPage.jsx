import React, { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import './ReordersPage.css';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function ReordersPage() {
    
    const { getAccessTokenSilently } = useAuth0();

    // State for all reorders fetched from backend
    const [reorders, setReorders] = useState([]);
    // State for filtered reorders based on selected status
    const [filteredReorders, setFilteredReorders] = useState([]);
    // State for current filter selection
    const [filterStatus, setFilterStatus] = useState("All");
    // Loading indicator
    const [isLoading, setIsLoading] = useState(true);
    // Suppliers and items data for dropdowns
    const [suppliers, setSuppliers] = useState([]);
    const [items, setItems] = useState([]);
    // State for new reorder being created
    const [newReorder, setNewReorder] = useState({
        supplierID: "",
        itemID: "",
        quantity: "",
        status: "pending"
    });

    // Fetch all reorders from backend and normalize status (READ operation)
    const fetchReorders = async () => {
        setIsLoading(true);
        try {
            
            const accessToken = await getAccessTokenSilently();
            const authHeaders = {
                Authorization: `Bearer ${accessToken}`,
            };

            
            const res = await fetch(`${API_BASE_URL}/reorders`, { headers: authHeaders });
            
            if (!res.ok) {
                 throw new Error(`Failed to fetch reorders: ${res.status}. Authentication may have failed.`);
            }

            const data = await res.json();
            // Ensure status is lowercase and trimmed for consistency
            const normalizedData = data.map(r => ({
                ...r,
                status: r.status ? r.status.trim().toLowerCase() : ''
            }));
            setReorders(normalizedData);
            filterReorders(normalizedData, filterStatus);
            setIsLoading(false);
        } catch (err) {
            console.error("Error fetching reorders:", err);
            // Handle error state
            setReorders([]);
            setIsLoading(false);
            alert(`Error loading reorders: ${err.message}`);
        }
    };

    // Fetch suppliers and merchandise for dropdown menus (READ operation)
    const fetchDropdownData = async () => {
        try {
            
            const accessToken = await getAccessTokenSilently();
            const authHeaders = {
                Authorization: `Bearer ${accessToken}`,
            };
            
            
            const [supRes, itemRes] = await Promise.all([
                fetch(`${API_BASE_URL}/suppliers`, { headers: authHeaders }),
                fetch(`${API_BASE_URL}/merchandise`, { headers: authHeaders })
            ]);

            if (!supRes.ok || !itemRes.ok) {
                 throw new Error(`Dropdown data fetch failed. Suppliers Status: ${supRes.status}. Items Status: ${itemRes.status}.`);
            }

            const [supData, itemData] = await Promise.all([
                supRes.json(),
                itemRes.json()
            ]);
            setSuppliers(supData);
            setItems(itemData);
        } catch (err) {
            console.error("Error fetching dropdown data:", err);
            
            alert(`Warning: Could not load all supplier/item data for the form. ${err.message}`);
        }
    };

    
    useEffect(() => {
        if (API_BASE_URL) {
            fetchReorders();
            fetchDropdownData();
        } else {
             alert("API Base URL is not configured.");
        }
    }, [getAccessTokenSilently]);


    const filterReorders = (allReorders, statusFilter) => {
        const filterValue = statusFilter.toLowerCase();
        if (filterValue === "all") {
            setFilteredReorders(allReorders);
        } else {
            setFilteredReorders(allReorders.filter(r => r.status && r.status === filterValue));
        }
    };

    // Re-filter whenever reorders or filter status changes 
    useEffect(() => {
        filterReorders(reorders, filterStatus);
    }, [filterStatus, reorders]);

    // Handler for filter dropdown change 
    const handleFilterChange = (e) => setFilterStatus(e.target.value);
    // Refresh reorders data (No change)
    const handleRefresh = () => fetchReorders();

    // Helper to get supplier name by ID 
    const getSupplierName = (supplierID) => {
        const supplier = suppliers.find(s => s.supplierID === supplierID);
        return supplier ? supplier.companyName : 'Unknown Supplier';
    };

    // Helper to get item name by ID 
    const getItemName = (itemID) => {
        const item = items.find(i => i.itemID === itemID);
        return item ? item.itemName : 'Unknown Item';
    };

    // Delete a reorder (DELETE operation)
    const handleDelete = async (reorderID) => {
        if (!window.confirm(`Delete Reorder ID ${reorderID}?`)) return;
        try {
            // 3. NEW: Get the access token
            const accessToken = await getAccessTokenSilently();
            
            
            const response = await fetch(`${API_BASE_URL}/reorders/${reorderID}`, { 
                method: 'DELETE',
                headers: { 
                    Authorization: `Bearer ${accessToken}`, 
                },
            });
            
            if (!response.ok) {
                const errorText = await response.json();
                alert(`Delete Failed: ${errorText.error}. You must CANCEL the order first if the status is corrupted or not 'pending'.`);
                return;
            }
            setReorders(prev => prev.filter(r => r.reorderID !== reorderID));
        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    };

    // Cancel a reorder (change status to 'cancelled') (PUT operation)
    const handleCancelReorder = async (reorderID) => {
        if (!window.confirm(`Are you sure you want to cancel Reorder ID ${reorderID}?`)) return;

        try {
            
            const accessToken = await getAccessTokenSilently();
            
            
            const response = await fetch(`${API_BASE_URL}/reorders/cancel/${reorderID}`, {
                method: "PUT",
                headers: { 
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`, 
                }
            });
            if (!response.ok) {
                const errorData = await response.json();
                alert("Cancellation failed: " + errorData.error);
                return;
            }

            // Update local state immediately
            setReorders(prev => prev.map(r =>
                r.reorderID === reorderID ? { ...r, status: 'cancelled' } : r
            ));
            alert("Reorder cancelled successfully.");
        } catch (err) {
            console.error("Cancellation Error:", err);
            alert("Cancellation failed. Check console for details.");
        }
    };

    // Handle input changes for new reorder form 
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewReorder(prev => ({ ...prev, [name]: value }));
    };

    // Create a new reorder (CREATE operation)
    const handleCreateReorder = async (e) => {
        e.preventDefault();

        if (!newReorder.supplierID || !newReorder.itemID || !newReorder.quantity) {
            alert("All fields are required.");
            return;
        }

        const quantityInt = parseInt(newReorder.quantity, 10);
        if (isNaN(quantityInt) || quantityInt <= 0) {
            alert("Quantity must be a positive number.");
            return;
        }

        try {
            
            const accessToken = await getAccessTokenSilently();
            
            
            const response = await fetch(`${API_BASE_URL}/reorders`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`, 
                },
                body: JSON.stringify({
                    supplierID: parseInt(newReorder.supplierID, 10),
                    itemID: parseInt(newReorder.itemID, 10),
                    quantity: quantityInt,
                    status: newReorder.status.toLowerCase()
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to create reorder");
            }

            const responseData = await response.json();
            // The response should include the full new reorder object, including the reorderID.
            const newReorderObject = responseData.reorder || { ...newReorder, reorderID: Date.now() }; 
            
            setReorders(prev => [...prev, {
                ...newReorderObject,
                status: newReorderObject.status ? newReorderObject.status.trim().toLowerCase() : 'pending' 
            }]);

            alert("New reorder created successfully!");
            // Reset form
            setNewReorder({ supplierID: "", itemID: "", quantity: "", status: "pending" });
        } catch (err) {
            console.error("Error:", err); 
            alert("Database error creating reorder. " + err.message);
        }
    };

    // Mark a reorder as received (updates inventory) (PUT operation)
    const handleMarkReceived = async (reorderID) => {
        if (!window.confirm(`Mark Reorder ID ${reorderID} as received? Inventory will be updated.`)) return;

        const reorder = reorders.find(r => r.reorderID === reorderID);
        if (!reorder) {
            alert("Reorder data not found locally. Please refresh.");
            return;
        }

        try {
            
            const accessToken = await getAccessTokenSilently();
            
            
            const response = await fetch(`${API_BASE_URL}/reorders/receive/${reorderID}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`, 
                },
                body: JSON.stringify({
                    itemID: reorder.itemID,
                    quantity: reorder.quantity
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to mark as received");
            }

            setReorders(prev => prev.map(r =>
                r.reorderID === reorderID ? { ...r, status: 'received' } : r
            ));
            alert(`Reorder ${reorderID} marked as received. Inventory updated.`);
        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    };

    return (
        <div className="page-container reorders-page">
            <h1>📦 Restock Order Management</h1>

            {/* Form to create a new reorder */}
            <section className="new-reorder-form">
                <h2>Create New Reorder</h2>
                <form onSubmit={handleCreateReorder}>
                    <div className="form-grid">
                        <label>Supplier:</label>
                        <select name="supplierID" value={newReorder.supplierID} onChange={handleInputChange} required>
                            <option value="">-- Select Supplier --</option>
                            {suppliers.map(s => (
                                <option key={s.supplierID} value={s.supplierID}>
                                    {s.companyName}
                                </option>
                            ))}
                        </select>

                        <label>Item:</label>
                        <select name="itemID" value={newReorder.itemID} onChange={handleInputChange} required>
                            <option value="">-- Select Item --</option>
                            {items.map(i => (
                                <option key={i.itemID} value={i.itemID}>
                                    {i.itemName}
                                </option>
                            ))}
                        </select>

                        <label>Quantity:</label>
                        <input
                            type="number"
                            name="quantity"
                            min="1"
                            value={String(newReorder.quantity)}
                            onChange={handleInputChange}
                            required
                        />

                        <label>Status:</label>
                        <select name="status" value={newReorder.status} onChange={handleInputChange}>
                            <option value="pending">Pending</option>
                            <option value="ordered">Ordered</option>
                        </select>
                    </div>
                    <button type="submit" className="add-btn">Add Reorder</button>
                </form>
            </section>

            <hr />

            {/* Filter and controls for existing reorders */}
            <h2>Current Reorders</h2>
            <div className="controls-bar">
                <label htmlFor="statusFilter">Filter by Status:</label>
                <select id="statusFilter" value={filterStatus} onChange={handleFilterChange}>
                    <option value="All">All</option>
                    <option value="Pending">Pending</option>
                    <option value="Ordered">Ordered</option>
                    <option value="Received">Received</option>
                    <option value="Cancelled">Cancelled</option>
                </select>
                <button onClick={handleRefresh} className="refresh-btn">⟳ Refresh Data</button>
            </div>

            {/* Reorders table */}
            {isLoading ? (
                <p>Loading reorders...</p>
            ) : filteredReorders.length === 0 ? (
                <p>No reorder records found with status: **{filterStatus}**</p>
            ) : (
                <table className="reorders-table">
                    <thead>
                        <tr>
                            <th>Reorder ID</th>
                            <th>Supplier</th>
                            <th>Item</th>
                            <th>Quantity</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredReorders.map(r => {
                            const lowerStatus = r.status || '';
                            const displayStatus = lowerStatus
                                ? lowerStatus.charAt(0).toUpperCase() + lowerStatus.slice(1)
                                : '********';
                            return (
                                <tr key={r.reorderID} className={lowerStatus === 'received' ? 'received' : lowerStatus === 'cancelled' ? 'cancelled' : ''}>
                                    <td>{r.reorderID}</td>
                                    <td>{getSupplierName(r.supplierID)}</td>
                                    <td>{getItemName(r.itemID)}</td>
                                    <td>{r.quantity}</td>
                                    <td className={displayStatus === '********' ? 'status-error' : ''}>{displayStatus}</td>
                                    <td className="action-buttons">
                                        {(lowerStatus === 'ordered') && (
                                            <button onClick={() => handleMarkReceived(r.reorderID)} className="mark-received-btn">Mark Received</button>
                                        )}
                                        {/* Allow Cancel/Delete if the order hasn't been completed or explicitly cancelled */}
                                        {(lowerStatus === 'pending' || lowerStatus === 'ordered' || lowerStatus === '') && (
                                            <>
                                                <button onClick={() => handleCancelReorder(r.reorderID)} className="cancel-btn">Cancel</button>
                                                <button onClick={() => handleDelete(r.reorderID)} className="delete-btn">Delete</button>
                                            </>
                                        )}
                                        {(lowerStatus === 'received' || lowerStatus === 'cancelled') && (
                                            <span style={{ color: '#666', fontSize: '0.9em' }}>N/A</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default ReordersPage;