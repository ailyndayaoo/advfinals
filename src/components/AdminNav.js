import React from 'react';
import './AdminNav.css';
import image1 from "../image/logo.png"

const NavigationBar = ({ setScreen }) => {
    const handleNavigateTo = (screen) => {
        setScreen(screen);
    };

    const handleNavigateToLogin = () => {
        window.location.reload(); 
    };

    return (
        <div className="navbar">
            <div className="logo">
            </div>
            <ul className="nav-links">
                <li><button onClick={() => handleNavigateTo('dashboard')}>Home</button></li>
                <li><button onClick={() => handleNavigateTo('transactions')}>Transactions</button></li>
                <li><button onClick={() => handleNavigateTo('reports')}>Reports</button></li>
                 <li><button onClick={() => handleNavigateTo('employee')}>Employee</button></li>
                <li><button onClick={handleNavigateToLogin}>Logout</button></li>
            </ul>
        </div>
    );
}

export default NavigationBar;