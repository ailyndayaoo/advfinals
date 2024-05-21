import React from 'react';
import './NavigationBar.css';

function NavigationBar({ onShowTransactions, onShowProfile, onLogout, profileImage, Name }) {
    return (
        <div className="navigation-bar">
            <div className="user-profile-info">
                {profileImage && <img src={profileImage} className="profile-picture" alt="Profile" />}
                <p className="full-name">{Name}</p>
            </div>
            <button className="navigation-button" onClick={onShowTransactions}>Transactions</button>
            <button className="navigation-button" onClick={onShowProfile}>Profile</button>
            <button className="navigation-button" onClick={onLogout}>Logout</button>
        </div>
    );
}

export default NavigationBar;
