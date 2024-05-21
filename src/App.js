import React, { useState } from 'react';
import CreateAccount from './components/CreateAccount';
import Login from './components/Login';
import NavigationBar from './components/AdminNav';
import './styles.css'; // Import custom CSS file
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';



function App() {
    const [users, setUsers] = useState([]);
    const [loggedInUser, setLoggedInUser] = useState(null);
    const [screen, setScreen] = useState('login');
    const [bookingConfirmation, setBookingConfirmation] = useState('');
    const [fadeOut, setFadeOut] = useState(false);

    const handleAccountCreate = (newUser) => {
        setUsers([...users, newUser]);
        alert('Account created successfully!');
    };

    const handleLogin = (email, password) => {
        // Simulate login logic
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
            setLoggedInUser(user);
            setFadeOut(true); 
            setTimeout(() => {
                setScreen('dashboard');
                setFadeOut(false); 
            }, 500);
            alert('Login successful!');
        } else {
            alert('Invalid email or password');
        }
    };

    const handleLogout = () => {
        setLoggedInUser(null);
        setFadeOut(true); 
        setTimeout(() => {
            setScreen('dashboard');
            setFadeOut(false); 
        }, 500); 
    };

    const handleNavigateToLogin = () => {
        setFadeOut(true); 
        setTimeout(() => {
            setScreen('login');
            setFadeOut(false); 
        }, 500); 
    };

    const handleNavigateToCreateAccount = () => {
        setFadeOut(true); 
        setTimeout(() => {
            setScreen('createAccount');
            setFadeOut(false);
        }, 500); 
    };

    return (
        <div className="app">
            <div className="background-image"></div>
            <div className="content-container">
                <header className="header">
                </header>
                
                <main className={`main ${fadeOut ? 'fade-out' : ''}`}>
                    
                {screen === 'login' && (
    <Login onLogin={handleLogin} setScreen={setScreen} />
)}

                    {screen === 'createAccount' && (
                        <CreateAccount onAccountCreate={handleAccountCreate} setDefaultScreen={handleNavigateToLogin} />
                    )}
                    {screen !== 'login' && screen !== 'createAccount' && !loggedInUser && (
                        <div className="button-container">
                            <button className="button" onClick={handleNavigateToLogin}>Login</button>
                            <button className="button" onClick={handleNavigateToCreateAccount}>Create Account</button>
                        </div>
                    )}
                    
                </main>
            </div>
        </div>
    );
}

export default App;
