import React, { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function NewSaleForm({ customers, merchandise, employees, onSaleProcessed, existingSale, isEditMode }) {
    
    const { getAccessTokenSilently } = useAuth0();

    // State for selected customer and employee
    const [customerID, setCustomerID] = useState(existingSale?.customerID || '');
    const [employeeID, setEmployeeID] = useState(existingSale?.employeeID || '');
    // State for all line items in the sale
    const [lineItems, setLineItems] = useState(existingSale?.lineItems || []);
    // State for the new line item being added
    const [newItem, setNewItem] = useState({ itemID: '', quantity: 1 });

    // Add a product to the sale (No change)
    const handleAddLineItem = () => {
        if (!newItem.itemID || newItem.quantity <= 0) return;

        const selectedItemID = parseInt(newItem.itemID);
        const exists = lineItems.find(li => li.itemID === selectedItemID);

        if (exists) {
            // If product already exists, increment its quantity
            setLineItems(lineItems.map(li =>
                li.itemID === selectedItemID
                    ? { ...li, quantity: li.quantity + parseInt(newItem.quantity) }
                    : li
            ));
        } else {
            // Otherwise, add as new line item
            setLineItems([...lineItems, { itemID: selectedItemID, quantity: parseInt(newItem.quantity) }]);
        }

        // Reset new item input
        setNewItem({ itemID: '', quantity: 1 });
    };

    // Remove a product from the sale (No change)
    const handleRemoveLineItem = (idToRemove) => {
        setLineItems(lineItems.filter(li => li.itemID !== idToRemove));
    };

    // Update quantity of a line item (No change)
    const handleQuantityChange = (idToChange, qty) => {
        setLineItems(lineItems.map(li => li.itemID === idToChange ? { ...li, quantity: qty } : li));
    };

    // Submit the sale (POST for new, PUT for edit)
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!lineItems.length) return alert("Add at least one product.");

        
        const accessToken = await getAccessTokenSilently();

        // Map line items to include priceEach from merchandise
        const payloadLineItems = lineItems.map(li => {
            const product = merchandise.find(m => m.itemID === li.itemID);
            return {
                itemID: li.itemID,
                quantity: li.quantity,
                // Ensure price is included for the transaction record
                priceEach: product?.price || 0
            };
        });

        const saleData = {
            customerID: customerID || null,
            employeeID: employeeID || null,
            lineItems: payloadLineItems
        };

        try {
            
            const url = isEditMode 
                ? `${API_BASE_URL}/sales/${existingSale.salesID}` 
                : `${API_BASE_URL}/sales`;
            const method = isEditMode ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`, 
                },
                body: JSON.stringify(saleData)
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || `Failed to ${isEditMode ? 'update' : 'create'} sale: ${res.statusText}`);
            }

            alert(`Sale ${isEditMode ? 'updated' : 'created'} successfully!`);
            
            // Reset form after submission
            if (!isEditMode) {
                setLineItems([]);
                setCustomerID('');
                setEmployeeID('');
            }
            onSaleProcessed(); // Callback to refresh parent state
        } catch (err) {
            console.error(err);
            alert(`Error: ${err.message}`);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            {/* Customer and Employee selection */}
            <div className="form-grid">
                <label>Customer:</label>
                <select value={customerID} onChange={e => setCustomerID(e.target.value)}>
                    <option value="">-- Guest Customer --</option>
                    {customers.map(c => (
                        <option key={c.customerID} value={c.customerID}>{c.firstName} {c.lastName}</option>
                    ))}
                </select>

                <label>Employee:</label>
                <select value={employeeID} onChange={e => setEmployeeID(e.target.value)}>
                    <option value="">-- Select Employee --</option>
                    {employees.map(e => (
                        <option key={e.employeeID} value={e.employeeID}>{e.firstName} {e.lastName}</option>
                    ))}
                </select>
            </div>

            <hr />

            {/* Line items input */}
            <h3>Line Items</h3>
            <div className="form-grid">
                <label>Product:</label>
                <select value={newItem.itemID} onChange={e => setNewItem(prev => ({ ...prev, itemID: e.target.value }))}>
                    <option value="">-- Select Product --</option>
                    {merchandise.map(m => (
                        <option key={m.itemID} value={m.itemID}>{m.itemName}</option>
                    ))}
                </select>

                <label>Quantity:</label>
                <input type="number" min="1" value={newItem.quantity} onChange={e => setNewItem(prev => ({ ...prev, quantity: parseInt(e.target.value) }))} />

                <button type="button" onClick={handleAddLineItem}>Add Product</button>
            </div>

            {/* Table showing current line items */}
            <table className="sales-line-table">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Quantity</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {lineItems.map(li => {
                        const product = merchandise.find(m => m.itemID === li.itemID);
                        return (
                            <tr key={li.itemID}>
                                <td>{product?.itemName || 'Unknown'}</td>
                                <td>
                                    <input
                                        type="number"
                                        min="1"
                                        value={li.quantity}
                                        onChange={e => handleQuantityChange(li.itemID, parseInt(e.target.value))}
                                    />
                                </td>
                                <td>
                                    <button type="button" onClick={() => handleRemoveLineItem(li.itemID)}>Remove</button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {/* Submit button */}
            <div className="form-actions">
                <button type="submit">{isEditMode ? 'Update Sale' : 'Create Sale'}</button>
            </div>
        </form>
    );
}

export default NewSaleForm;