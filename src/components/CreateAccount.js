import React, { useState } from 'react';
import { app } from './firebaseConfig';
import { getDatabase, ref, push } from 'firebase/database';
import './CreateAccount.css'; 
import logo from '../image/logo.png'; 
function CreateAccount({ onAccountCreate, setDefaultScreen }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [address, setAddress] = useState('');
    const [accountCreated, setAccountCreated] = useState(false); 
    const db = getDatabase(app);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (name.trim() === '' || email.trim() === '' || password.trim() === '') {
            alert('Please fill in all required fields');
            return;
        }

        if (!/^(09|)\d{9}$/.test(phoneNumber)) {
            alert('Please enter a valid 11-digit phone number starting with "09" ');
            return;
        }

        try {
            const newAccountRef = push(ref(db, 'accounts'), {
                name,
                email,
                password,
                phoneNumber,
                address,
            });

            const newAccountId = newAccountRef.key;

            if (onAccountCreate) {
                onAccountCreate({ id: newAccountId, name, email, password, phoneNumber, address,  });
            }

            setName('');
            setEmail('');
            setPassword('');
            setPhoneNumber('');
            setAddress('');

            setDefaultScreen("dashboard");

            setAccountCreated(true);
        } catch (error) {
            console.error('Error creating account:', error.message);
            alert('An error occurred while creating your account. Please try again later.');
        }
    };

    const handleBackToLogin = () => {
        setDefaultScreen("login");
    };

    return (
        <div className="max-w-md mx-auto create-account-container">
            <img src={logo} alt="Logo" className="image" /> 
            <h2 className="text-2xl mb-4">Create Account</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="input-field"
                />
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="input-field"
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="input-field"
                />
                <input
                    type="tel"
                    placeholder="Phone Number"
                    value={phoneNumber}
                    onChange={(e) => {
                        const inputPhoneNumber = e.target.value;
                        if (/^\d*$/.test(inputPhoneNumber) && inputPhoneNumber.length <= 12) {
                            setPhoneNumber(inputPhoneNumber);
                        }
                    }}
                    maxLength={12} 
                    className="input-field"
                />
                <input
                    type="text"
                    placeholder="Address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="input-field"
                />
               
                {accountCreated && (
                    <div className="success-message">
                        <p className="success-text">Account Created</p>
                        <button onClick={() => setAccountCreated(false)} className="login-button">LOGIN</button>
                    </div>
                )}
                {!accountCreated && (
                    <>
                        <button type="submit" className="submit-button">Create Account</button>
                        <button onClick={handleBackToLogin} className="back-button">Back</button>
                    </>
                )}
            </form>
        </div>
    );
}

export default CreateAccount;
