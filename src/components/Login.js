import React, { useState } from 'react';
import { app } from './firebaseConfig';
import { getDatabase, ref, get, child, push } from 'firebase/database';
import { getAuth, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'; 
import UserDashboard from './UserDashboard';
import AdminDashboard from './AdminDashboard';
import './Login.css';
import logo from '../image/logo.png'; 

function Login({ setScreen }) {
    const [loggedIn, setLoggedIn] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [loginError, setLoginError] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [profileImageUrl, setProfileImageUrl] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false); 

    const db = getDatabase(app);
    const auth = getAuth(app);

    const handleLogin = async (e) => {
        e.preventDefault();
        if (email.trim() === '' || password.trim() === '') {
            alert('Please fill in all fields');
            return;
        }

        setLoading(true); 

        try {
            const snapshot = await get(child(ref(db), `accounts`));
            let isLoggedIn = false;
            snapshot.forEach((childSnapshot) => {
                const userData = childSnapshot.val();
                if (userData.email === email && userData.password === password) {
                    isLoggedIn = true;
                    setLoggedIn(true);
                    setIsAdmin(email.includes('@chicstation'));
                    setUserEmail(email);
                    setProfileImageUrl(userData.profileImage || ''); 
                    setFullName(userData.name || ''); 
                }
            });

            if (!isLoggedIn) {
                setLoginError('Invalid email or password');
            } else {
                setLoginError('');
            }
        } catch (error) {
            console.error('Error logging in:', error.message);
            alert('An error occurred while logging in. Please try again later.');
        } finally {
            setLoading(false); 
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            const snapshot = await get(child(ref(db), 'accounts'));
            let userExists = false;
            snapshot.forEach((childSnapshot) => {
                const userData = childSnapshot.val();
                if (userData.email === user.email) {
                    userExists = true;
                }
            });

            if (!userExists) {
                await push(ref(db, 'accounts'), {
                    email: user.email,
                });
            }

            setLoggedIn(true);
            setEmail(user.email); 
        } catch (error) {
            console.error('Error signing in with Google:', error.message);
            alert('An error occurred while signing in with Google. Please try again later.');
        }
    };

    const handleCreateAccount = () => {
        setScreen('createAccount');
    };

    if (loggedIn) {
        if (isAdmin) {
            return <AdminDashboard />;
        } else {
            return <UserDashboard email={email} profileImage={profileImageUrl} name={fullName} />;
        }
    }

    return (
        <div className="login-container">
            <img src={logo} alt="Logo" className="logo" /> 
            {loading && (
                <div className="loading-container">
                    <p className="loading-message">Loading...</p>
                    <div className="loading-spinner"></div>
                </div>
            )}
            <h2 className="login-header">Please Login</h2>
            {loginError && <p className="login-error">{loginError}</p>}
            <form onSubmit={handleLogin} className="login-form">
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="login-input"
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="login-input"
                    required
                />
                <button type="submit" className="login-button">
                    Login
                </button>
            </form>
            <button className="continue-with-google-button" onClick={handleGoogleLogin}>
                Continue with Google
            </button>
            <button className="create-account-button" onClick={handleCreateAccount}>
                Create Account
            </button>
        </div>
    );
}

export default Login;
