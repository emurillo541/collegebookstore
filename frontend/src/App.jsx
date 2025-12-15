import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { useAuth0, withAuthenticationRequired } from '@auth0/auth0-react'; 
import './App.css';
import MerchandisePage from './MerchandisePage.jsx';
import CustomersPage from './CustomersPage.jsx'; 
import EmployeesPage from './EmployeesPage.jsx'; 
import SuppliersPage from './SuppliersPage.jsx'; 
import SalesPage from './SalesPage.jsx';        
import ReordersPage from './ReordersPage.jsx';

const ProtectedRoute = ({ component }) => {
    // If the user is not authenticated, Auth0 redirects them to the login page.
    const Component = withAuthenticationRequired(component, {
        
        onRedirecting: () => <div>Authenticating user...</div>, 
    });
    return <Component />;
};

function App() {
    // Access Auth0 state and methods
    const { isAuthenticated, loginWithRedirect, logout } = useAuth0();

    return (
        <Router>
            <div className="App-container">
                {/* Navigation bar at the top to quickly move between main sections */}
                <nav>
                    <Link to="/">Home</Link> | <Link to="/merchandise">Inventory</Link> | <Link to="/sales">Sales</Link>
                    
                    {/* NEW: Login/Logout buttons, which must appear inside the <nav> */}
                    <div className="auth-buttons">
                        {isAuthenticated ? (
                            <button 
                                className="logout-btn" 
                                onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}>
                                Log Out
                            </button>
                        ) : (
                            <button 
                                className="login-btn" 
                                onClick={() => loginWithRedirect()}>
                                Log In
                            </button>
                        )}
                    </div>
                </nav>

                <Routes>
                    {/* Public route */}
                    <Route path="/" element={<HomePage />} />
                    
                    {/* Protected routes. Only authenticated users can access these pages. */}
                    <Route path="/customers" element={<ProtectedRoute component={CustomersPage} />} />
                    <Route path="/employees" element={<ProtectedRoute component={EmployeesPage} />} />
                    <Route path="/suppliers" element={<ProtectedRoute component={SuppliersPage} />} />
                    <Route path="/merchandise" element={<ProtectedRoute component={MerchandisePage} />} />
                    <Route path="/sales" element={<ProtectedRoute component={SalesPage} />} />
                    <Route path="/reorders" element={<ProtectedRoute component={ReordersPage} />} />
                    
                    {/* Fallback route for any undefined paths */}
                    <Route path="*" element={<h2>404 Page Not Found</h2>} />
                </Routes>
            </div>
        </Router>
    );
}

const HomePage = () => {
    
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; 

    // Function to reset the database; used for testing purposes
    const handleResetDatabase = async () => {
        try {
          
            const url = `${API_BASE_URL}/reset-db`; 
            
            
            const res = await fetch(url); 
            
            if (!res.ok) throw new Error(`Network response was not ok. Status: ${res.status}`);
            const data = await res.json(); 
            alert(data.message); 
        } catch (err) {
            console.error(err);
            alert(`Error resetting database. Details: ${err.message}`);
        }
    };

    return (
        <div className="home-page-container">
            <h1>College Bookstore Inventory and Sales Management System</h1>
            <p>
                Welcome to the main dashboard. Use the links below to access and manage
                all major data entities and transactions in the system.
            </p>

            {/* Section listing core entities with full CRUD capabilities */}
            <h2 className="entity-section-heading">Core Entities (Full CRUD)</h2>
            
            <div className="entity-list-row">
                {/* All 4 core items are in this single list to maintain a consistent layout */}
                <ul className="core-list-row">
                    <li><Link to="/customers">CUSTOMERS</Link></li>
                    <li><Link to="/employees">EMPLOYEES</Link></li>
                    <li><Link to="/suppliers">SUPPLIERS</Link></li>
                    <li><Link to="/merchandise">MERCHANDISE</Link></li>
                </ul>
            </div>

            {/* Section listing transactional entities like sales and restock orders */}
            <h2 className="entity-section-heading">Transactional Entities (Sales & Inventory)</h2>
            
            <div className="entity-list-row">
                <ul className="transactional-list">
                    <li><Link to="/sales">SALES — Record new sales and view all transactions</Link></li>
                    <li>
                        <Link to="/reorders">
                            RESTOCK ORDERS — Track and manage inventory reorders
                        </Link>
                    </li>
                </ul>
            </div>
            
            {/* Horizontal separator to isolate critical actions from normal navigation */}
            <div className="critical-action-separator"></div>

            {/* Button to reset the database, kept separate to highlight its importance */}
            <div className="home-action-buttons">
                <button className="reset-btn" onClick={handleResetDatabase}>
                    RESET DATABASE
                </button>
            </div>
        </div>
    );
};

export default App;