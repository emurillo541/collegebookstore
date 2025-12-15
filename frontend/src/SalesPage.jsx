import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import './SalesPage.css';
import NewSaleForm from '../components/NewSaleForm';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function SalesPage() {
    const navigate = useNavigate();
    const { getAccessTokenSilently } = useAuth0();

    const [sales, setSales] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [merchandise, setMerchandise] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editSale, setEditSale] = useState(null);
    const [lineItems, setLineItems] = useState([]);
    const [editingItem, setEditingItem] = useState(null);
    const [currentSaleID, setCurrentSaleID] = useState(null);

    // Function to grab all the core data we need for the page (Multiple GETs)
    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const accessToken = await getAccessTokenSilently();
            const authHeaders = {
                Authorization: `Bearer ${accessToken}`,
            };

            const [salesRes, custRes, merchRes, empRes] = await Promise.all([
                fetch(`${API_BASE_URL}/sales`, { headers: authHeaders }),
                fetch(`${API_BASE_URL}/customers`, { headers: authHeaders }),
                fetch(`${API_BASE_URL}/merchandise`, { headers: authHeaders }),
                fetch(`${API_BASE_URL}/employees`, { headers: authHeaders }),
            ]);

            if (!salesRes.ok || !custRes.ok || !merchRes.ok || !empRes.ok) {
                // Determine which request failed for a clearer error
                let status = `Sales: ${salesRes.status}, Customers: ${custRes.status}, Merch: ${merchRes.status}, Emps: ${empRes.status}`;
                throw new Error(`Failed to fetch one or more datasets. Statuses: ${status}`);
            }

            setSales(await salesRes.json());
            setCustomers(await custRes.json());
            setMerchandise(await merchRes.json());
            setEmployees(await empRes.json());
            setIsLoading(false);
        } catch (err) {
            console.error(err);
            setError(err.message);
            setIsLoading(false);
        }
    };

    // Fetch data when the component first loads
    useEffect(() => {
        if (API_BASE_URL) {
             fetchData();
        } else {
             alert("API Base URL is not configured.");
        }
    }, [getAccessTokenSilently]);

    // Helper functions (No changes needed here)
    const getCustomerName = (id) => {
        const c = customers.find((c) => c.customerID === id);
        return c ? `${c.firstName} ${c.lastName}` : "Guest";
    };

    const getEmployeeName = (id) => {
        const e = employees.find((e) => e.employeeID === id);
        return e ? `${e.firstName} ${e.lastName}` : "N/A";
    };

    // Initiates the main sale editing form (No changes needed here)
    const handleEditStart = (sale) => {
        setIsEditing(true);
        setEditSale({
            salesID: sale.salesID,
            customerID: sale.customerID ? sale.customerID.toString() : "",
            employeeID: sale.employeeID ? sale.employeeID.toString() : "",
        });
    };

    // Keeps track of changes in the main sale edit form (No changes needed here)
    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditSale((prev) => ({ ...prev, [name]: value }));
    };

    // Sends the PUT request to update the main sale record (customer/employee)
    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        const updateData = {
            customerID: parseInt(editSale.customerID, 10) || null,
            employeeID: parseInt(editSale.employeeID, 10) || null,
        };

        try {
            
            const accessToken = await getAccessTokenSilently();

            
            const res = await fetch(`${API_BASE_URL}/sales/${editSale.salesID}`, {
                method: "PUT",
                headers: { 
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`, 
                },
                body: JSON.stringify(updateData),
            });
            if (!res.ok) {
                 const errorData = await res.json();
                 throw new Error(errorData.error || "Failed to update sale.");
            }
            alert("Sale updated!");
            setIsEditing(false);
            setEditSale(null);
            fetchData();
        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    };

    // Handles cancelling (deleting) a whole sale transaction
    const handleDelete = async (salesID) => {
        if (!window.confirm(`Cancel Sale ID ${salesID}?`)) return;
        try {
            
            const accessToken = await getAccessTokenSilently();

            
            const res = await fetch(`${API_BASE_URL}/sales/${salesID}`, { 
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${accessToken}`, 
                },
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to cancel sale.");
            }
            alert(`Sale ${salesID} cancelled.`);
            fetchData();
        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    };

    // Fetches the detailed line items for a specific sale ID (GET)
    const fetchLineItems = async (salesID) => {
        try {
            
            const accessToken = await getAccessTokenSilently();
            
            const res = await fetch(`${API_BASE_URL}/salesdetail/${salesID}`, {
                 headers: {
                    Authorization: `Bearer ${accessToken}`, 
                },
            });
            
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to fetch line items.");
            }
            const data = await res.json();
            // Makes sure quantities and prices are stored as numbers
            const sanitized = data.map(li => ({
                ...li,
                itemQuantity: Number(li.itemQuantity) || 0,
                priceEach: Number(li.priceEach) || 0
            }));
            setLineItems(sanitized);
        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    };

    // Prepares the form to edit a single line item (No changes needed here)
    const handleEditItemStart = (item) => {
        setEditingItem({
            ...item,
            salesDetailID: item.salesDetailID, 
            itemQuantity: item.itemQuantity.toString(),
            priceEach: item.priceEach.toString(),
        });
    };

    // Tracks input changes for the line item edit form (No changes needed here)
    const handleEditItemChange = (e) => {
        const { name, value } = e.target;
        setEditingItem((prev) => ({
            ...prev,
            [name]:
                name === "itemQuantity"
                    ? value === "" ? "" : parseInt(value)
                    : name === "priceEach"
                    ? value === "" ? "" : parseFloat(value)
                    : value,
        }));
    };

    // Submits the changes for a single line item (quantity/price) (PUT)
    const handleLineItemUpdate = async (e) => {
        e.preventDefault();
        const data = {
            itemQuantity: parseInt(editingItem.itemQuantity, 10),
            priceEach: parseFloat(editingItem.priceEach),
        };
        if (isNaN(data.itemQuantity) || isNaN(data.priceEach) || data.itemQuantity <= 0 || data.priceEach <= 0) {
            alert("Quantity and Price must be positive numbers.");
            return;
        }
        try {
            
            const accessToken = await getAccessTokenSilently();

            const res = await fetch(
                `${API_BASE_URL}/salesdetail/${editingItem.salesDetailID}`,
                {
                    method: "PUT",
                    headers: { 
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${accessToken}`, 
                    },
                    body: JSON.stringify(data), 
                }
            );
            if (!res.ok) {
                 const errorData = await res.json();
                 throw new Error(errorData.error || "Failed to update line item.");
            }
            alert("Line item updated!");
            setEditingItem(null);
            fetchLineItems(editingItem.salesID); // Refresh the line item list
            fetchData(); // Refresh the main sales list to update totals
        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    };

    const handleLineItemDelete = async (salesDetailID, salesID) => {
        if (!window.confirm(`Delete line item ID ${salesDetailID}?`)) return;
        try {
            const accessToken = await getAccessTokenSilently();

            const res = await fetch(
                `${API_BASE_URL}/salesdetail/${salesDetailID}`,
                { 
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${accessToken}`, 
                    },
                }
            );
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to delete line item.");
            }
            alert("Line item deleted!");
            setEditingItem(null); // Close the edit form if it was open
            fetchLineItems(salesID); // Refresh the line item list
            fetchData(); // Refresh the main sales list to update totals
        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    };

    // Sets the state to show the line items for a particular sale
    const handleViewDetails = (salesID) => {
        setCurrentSaleID(salesID);
        fetchLineItems(salesID);
    };

    // Calculates the total for a sale 
    const calculateSaleTotal = (sale) => {
        if (sale.totalAmount !== undefined && !isNaN(Number(sale.totalAmount))) {
            return Number(sale.totalAmount).toFixed(2);
        }
        // Fallback calculation: sum line items for this sale if 'totalAmount' is missing
        const items = lineItems.filter(li => li.salesID === sale.salesID);
        const total = items.reduce((sum, li) => {
            const qty = Number(li.itemQuantity) || 0;
            const price = Number(li.priceEach) || 0;
            return sum + qty * price;
        }, 0);
        return total.toFixed(2);
    };

    if (isLoading)
        return (
            <div className="page-container sales-page">
                <h1>Sales Processing</h1>
                <p>Loading...</p>
            </div>
        );

    if (error)
        return (
            <div className="page-container sales-page">
                <h1>Sales Processing</h1>
                <p>Error: {error}</p>
            </div>
        );

    return (
        <div className="page-container sales-page">
            <h1>Sales Processing (CRUD + M:N)</h1>
            {isEditing && editSale ? (
                <section className="edit-sale-section">
                    <h2>Edit Sale #{editSale.salesID}</h2>
                    <form onSubmit={handleUpdateSubmit}>
                        <div className="form-grid">
                            <label>Customer:</label>
                            <select name="customerID" value={editSale.customerID} onChange={handleEditChange}>
                                <option value="">-- Guest --</option>
                                {customers.map((c) => (
                                    <option key={c.customerID} value={c.customerID}>
                                        {c.firstName} {c.lastName}
                                    </option>
                                ))}
                            </select>

                            <label>Employee:</label>
                            <select name="employeeID" value={editSale.employeeID} onChange={handleEditChange}>
                                <option value="">-- None --</option>
                                {employees.map((e) => (
                                    <option key={e.employeeID} value={e.employeeID}>
                                        {e.firstName} {e.lastName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-actions">
                            <button type="submit">Save</button>
                            <button type="button" onClick={() => setIsEditing(false)}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </section>
            ) : (
                <section className="add-sale-section">
                    <h2>Process New Sale</h2>
                    <NewSaleForm
                        customers={customers}
                        merchandise={merchandise}
                        employees={employees}
                        onSaleProcessed={fetchData}
                    />
                </section>
            )}

            <hr />
            <section className="sales-summary-section">
                <h2>Sales Summary</h2>
                <table className="sales-table">
                    <thead>
                        <tr>
                            <th>Sale ID</th>
                            <th>Customer</th>
                            <th>Employee</th>
                            <th>Sale Total</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sales.map((sale) => (
                            <tr key={sale.salesID}>
                                <td>{sale.salesID}</td>
                                <td>{getCustomerName(sale.customerID)}</td>
                                <td>{getEmployeeName(sale.employeeID)}</td>
                                <td>${calculateSaleTotal(sale)}</td>
                                <td>
                                    <button onClick={() => handleEditStart(sale)}>Edit</button>
                                    <button onClick={() => handleViewDetails(sale.salesID)}>View Items</button>
                                    <button className="delete-btn" onClick={() => handleDelete(sale.salesID)}>
                                        Cancel Sale
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>
            {lineItems.length > 0 && currentSaleID && (
                <section className="sales-line-table">
                    <h2>Sale Line Items (Sale ID: {currentSaleID})</h2>

                    {editingItem && (
                        <form onSubmit={handleLineItemUpdate} className="edit-line-item-form">
                            <h3>Edit Line Item #{editingItem.salesDetailID} ({editingItem.itemName})</h3>
                            <div className="form-grid">
                                <label>Quantity:</label>
                                <input
                                    type="number"
                                    name="itemQuantity"
                                    min="1"
                                    value={editingItem.itemQuantity || 0}
                                    onChange={handleEditItemChange}
                                />
                                <label>Price Each:</label>
                                <input
                                    type="number"
                                    name="priceEach"
                                    min="0.01"
                                    step="0.01"
                                    value={editingItem.priceEach || 0}
                                    onChange={handleEditItemChange}
                                />
                            </div>
                            <div className="form-actions">
                                <button type="submit">Save Line Item</button>
                                <button type="button" onClick={() => setEditingItem(null)}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}

                    <table className="line-items-table">
                        <thead>
                            <tr>
                                <th>Detail ID</th> 
                                <th>Item ID</th>
                                <th>Name</th>
                                <th>Quantity</th>
                                <th>Price Each</th>
                                <th>Total</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lineItems.map((item) => {
                                const quantity = Number(item.itemQuantity) || 0;
                                const price = Number(item.priceEach) || 0;
                                return (
                                    <tr key={item.salesDetailID} className={editingItem && editingItem.salesDetailID === item.salesDetailID ? 'editing-row' : ''}>
                                        <td>{item.salesDetailID}</td>
                                        <td>{item.itemID}</td>
                                        <td>{item.itemName}</td>
                                        <td>{quantity}</td>
                                        <td>${price.toFixed(2)}</td>
                                        <td>${(quantity * price).toFixed(2)}</td> 
                                        <td>
                                            <button onClick={() => handleEditItemStart(item)} disabled={editingItem && editingItem.salesDetailID !== item.salesDetailID}>Edit</button>
                                            <button className="delete-btn" onClick={() => handleLineItemDelete(item.salesDetailID, item.salesID)} disabled={!!editingItem}>
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </section>
            )}
        </div>
    );
}

export default SalesPage;