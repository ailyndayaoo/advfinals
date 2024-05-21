import React, { useState, useEffect } from 'react';
import { app } from './firebaseConfig';
import { getDatabase, ref, push, onValue, remove, update } from 'firebase/database';
import './UserDashboard.css';
import UserProfile from './UserProfile';
import NavigationBar from './NavigationBar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faTimes } from '@fortawesome/free-solid-svg-icons';
import { format } from 'date-fns';


function UserDashboard({ email, onLogout, profileImageUrl, fullName }) {
    const [selectedService, setSelectedService] = useState('');
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [transactions, setTransactions] = useState([]);
    const [showTransactions, setShowTransactions] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [showNavigationBar, setShowNavigationBar] = useState(false);
    const [userDetails, setUserDetails] = useState(null);
    const [iconSpin, setIconSpin] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    const [timeError, setTimeError] = useState('');
    const [selectedDate, setSelectedDate] = useState(''); 
    const [selectedTime, setSelectedTime] = useState(''); 
    const [editTransaction, setEditTransaction] = useState(null);
    const [editedDateTime, setEditedDateTime] = useState('');
    const [employees, setEmployees] = useState([]);

    const servicePrices = {
        1: '₱99.00',
        2: '₱150.00',
        3: '₱499.00',
        4: '₱599.00',
        5: '₱999.00',
        6: '₱799.00',
    };

    const db = getDatabase(app);

    const services = [
        { id: 1, name: 'Haircut' },
        { id: 2, name: 'Mani/Pedi' },
        { id: 3, name: 'Softgel/Polygel' },
        { id: 4, name: 'Eyelash Extention' },
        { id: 5, name: 'Make-up' },
        { id: 6, name: 'Wax' },

    ];

    useEffect(() => {
        const transactionsRef = ref(db, 'transactions');
        onValue(transactionsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const userTransactions = Object.values(data).filter(transaction => transaction.userEmail === email);
                setTransactions(userTransactions);
            } else {
                setTransactions([]);
            }   
        });

        const userRef = ref(db, 'users');
        onValue(userRef, (snapshot) => {
            const userData = snapshot.val();
            if (userData && userData[email]) {
                setUserDetails(userData[email]);
            } else {
                setUserDetails(null);
            }
        });
    }, [db, email]);

    useEffect(() => {
        const employeesRef = ref(db, 'employees');
        onValue(employeesRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const employeesArray = Object.values(data);
                setEmployees(employeesArray);
            } else {
                setEmployees([]);
            }
        });
    }, [db]);

    const handleTransactionSubmission = () => {
        if (!selectedService || !selectedEmployee || !selectedDate || !selectedTime) {
            alert('Please select service, employee, date, and time.');
            return;
        }
    
        const selectedDateTime = new Date(selectedDate + 'T' + selectedTime);
        const now = new Date();
    
        // Check if the selected date and time is in the past
        if (selectedDateTime < now) {
            alert('You cannot select a date and time in the past. Please choose a future date and time.');
            return;
        }
    
        // Check if the selected time is between 9am and 7pm
        const selectedHours = selectedDateTime.getHours();
        if (selectedHours < 9 || selectedHours >= 19) {
            alert('Please select a time between 9am and 7pm.');
            return;
        }
    
        // Check if the selected date and time conflicts with existing transactions
        const isConflict = transactions.some(transaction => {
            const transactionDate = new Date(transaction.appointmentDateTime);
            return transactionDate.getTime() === selectedDateTime.getTime();
        });
    
        if (isConflict) {
            alert('This date and time slot is already booked. Please select another one.');
            return;
        }
    
        const transactionData = {
            userEmail: email,
            service: selectedService,
            employee: selectedEmployee,
            appointmentDateTime: selectedDateTime.toISOString(), // Convert date to ISO string for storing in database
            status: 'pending',
        };
    
        push(ref(db, 'transactions'), transactionData)
            .then(() => {
                console.log('Transaction submitted successfully.');
                setSelectedService('');
                setSelectedEmployee('');
                setSelectedDate(''); // Reset date and time after submission
                setSelectedTime('');
            })
            .catch((error) => {
                console.error('Error submitting transaction:', error);
                alert('An error occurred while submitting transaction. Please try again.');
            });
    };
    
    const handleCancelTransaction = (transaction) => {
        const transactionRef = ref(db, 'transactions');
        let transactionKey = null;

        onValue(transactionRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const keys = Object.keys(data);
                const foundKey = keys.find((key) => {
                    const t = data[key];
                    return (
                        t.userEmail === transaction.userEmail &&
                        t.service === transaction.service &&
                        t.employee === transaction.employee &&
                        t.status === transaction.status
                    );
                });
                if (foundKey) {
                    transactionKey = foundKey;
                }
            }
        });

        if (!transactionKey) {
            console.error('Transaction key not found.');
            return;
        }

        remove(ref(db, `transactions/${transactionKey}`))
            .then(() => {
                console.log('Transaction canceled successfully.');
            })
            .catch((error) => {
                console.error('Error canceling transaction:', error);
                alert('An error occurred while canceling transaction. Please try again.');
            });
    };

    const handleEditTransaction = (transaction) => {
        if (transaction.status !== 'pending') {
            alert('You can only edit transactions with pending status.');
            return;
        }
    
        setEditTransaction(transaction);
        setEditedDateTime(transaction.appointmentDateTime);
        setSelectedService(transaction.service);
        setSelectedEmployee(transaction.employee);
    };
    
    
    const handleSaveEditedTransaction = () => {
        if (!editedDateTime) {
            alert('Please enter the new appointment date and time.');
            return;
        }
    
        const editedDateTimeObj = new Date(editedDateTime);
        const now = new Date();
    
        if (editedDateTimeObj < now) {
            alert('You cannot set a time that has already passed.');
            return;
        }
    
        const transactionRef = ref(db, 'transactions');
        let transactionKey = null;
    
        onValue(transactionRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const keys = Object.keys(data);
                const foundKey = keys.find((key) => {
                    const t = data[key];
                    return (
                        t.userEmail === editTransaction.userEmail &&
                        t.service === editTransaction.service &&
                        t.employee === editTransaction.employee &&
                        t.status === editTransaction.status
                    );
                });
                if (foundKey) {
                    transactionKey = foundKey;
                }
            }
        });
    
        if (!transactionKey) {
            console.error('Transaction key not found.');
            return;
        }
    
        const updates = {};
        updates[`transactions/${transactionKey}/appointmentDateTime`] = editedDateTime;
        updates[`transactions/${transactionKey}/status`] = 'pending';
    
        update(ref(db), updates)
            .then(() => {
                console.log('Transaction edited successfully.');
                setEditTransaction(null);
                setEditedDateTime('');
            })
            .catch((error) => {
                console.error('Error editing transaction:', error);
                alert('An error occurred while editing transaction. Please try again.');
            });
    };
    
    
    const handleShowTransactions = () => {
        setShowTransactions(true);
        setShowProfile(false);
    };

    const handleHideTransactions = () => {
        setShowTransactions(false);
    };

    const handleShowProfile = () => {
        setShowProfile(true);
        setShowTransactions(false);
    };

    const handleShowNavigationBar = () => {
        setShowNavigationBar(true);
    };

    const handleHideNavigationBar = () => {
        setShowNavigationBar(false);
    };

    const handleNavigateToLogin = () => {
        window.location.reload();
    };

    const handleTimeChange = (e) => {
        const selectedTime = e.target.value;
        const [hours, minutes] = selectedTime.split(':').map(Number);
        if (hours < 9 || hours >= 19) {
            setTimeError('Please select a time between 9am and 7pm.');
        } else {
            setTimeError('');
            setSelectedTime(selectedTime);
        }
    };

    return (
        <div className="user-dashboard-container">
            {showNavigationBar && (
                <NavigationBar
                    onShowTransactions={handleShowTransactions}
                    onShowProfile={handleShowProfile}
                    onLogout={handleNavigateToLogin}
                    profileImage={profileImageUrl} 
                    Name={fullName} 
                />
            )}
            <div className="dashboard-content">
                <h2>User Dashboard</h2>
                {!showTransactions && !showProfile && (
                    <div className="selection-container">
                        <div className="service-selection">
                            <label htmlFor="service-select">Select Service:</label>
                            <select
                                id="service-select"
                                value={selectedService}
                                onChange={(e) => setSelectedService(e.target.value)}
                            >
                                <option value="">Select</option>
                                {services.map((service) => (
                                    <option key={service.id} value={service.name}>
                                        {service.name} - {servicePrices[service.id]}
                                    </option>
                                ))}
                            </select>
                        </div>

                            <div className="employee-selection">
                                <label htmlFor="employee-select">Select Employee:</label>
                                <select
                                    id="employee-select"
                                    value={selectedEmployee}
                                    onChange={(e) => setSelectedEmployee(e.target.value)}
                                >
                                    <option value="">Select</option>
                                    {employees.map((employee, index) => (
                                        <option key={index} value={employee.name}>
                                            {employee.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                        <div className="date-time-selection">
                            <label htmlFor="date-select">Select Date:</label>
                            <input
                                type="date"
                                id="date-select"
                                min={new Date().toISOString().split('T')[0]} 
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                            />
                        </div>

                        <div className="date-time-selection">
                            <label htmlFor="time-select">Select Time:</label>
                            <input
                                type="time"
                                id="time-select"
                                min="09:00"
                                max="19:00"
                                value={selectedTime}
                                onChange={handleTimeChange}
                            />
                            {timeError && <p className="error-message">{timeError}</p>}
                        </div>

                        <button className="submit-button" onClick={handleTransactionSubmission}>
                            Submit
                        </button>
                    </div>
                )}

                {showTransactions && (
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Your Transactions</h3>
                        {transactions.length === 0 && (
                            <p className="text-sm">You don't have any appointments.</p>
                        )}
                        <ul>
                            <div className="transactions-container bg-gray-100 p-4 rounded-lg ">
                                {transactions.map((transaction, index) => (
                                    <li key={index} className="border-b py-4">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-sm font-semibold">Service: {transaction.service}</p>
                                                <p className="text-sm">Employee: {transaction.employee}</p>
                                                <p className="text-sm">Status: {transaction.status}</p>
                                                <p className="text-sm">Date and Time: {format(new Date(transaction.appointmentDateTime), 'MMMM dd, yyyy hh:mm a')}</p>
                                            </div>
                                            {transaction.status === 'pending' ? (
                                                editTransaction === transaction ? (
                                                    <div>
                                                        <input
                                                            type="datetime-local"
                                                            value={editedDateTime}
                                                            min={new Date().toISOString().split('T')[0] + 'T00:00'} // Set min attribute to current date and time
                                                            onChange={(e) => setEditedDateTime(e.target.value)}
                                                            className="border rounded py-1 px-2 mr-2"
                                                        />
                                                        <button
                                                            className="bg-blue-500 text-white py-1 px-4 rounded hover:bg-blue-600"
                                                            onClick={handleSaveEditedTransaction}
                                                        >
                                                            Save
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div>
                                                    <button
                                                        className="bg-yellow-500 text-white py-1 px-4 rounded hover:bg-yellow-600"
                                                        onClick={() => handleEditTransaction(transaction)}
                                                    >
                                                        Edit
                                                    </button>
                                                    
                                                                <button
                                                                    className="bg-red-500 text-white py-1 px-4 rounded hover:bg-red-600"
                                                                    onClick={() => handleCancelTransaction(transaction)}
                                                                >
                                                                    Cancel
                                                                </button>                                                          
                                                </div>
                                    
                                                )
                                            ) : (
                                                transaction.status === 'accepted' ? null : (
                                                    <button
                                                        className="bg-red-500 text-white py-1 px-4 rounded hover:bg-red-600"
                                                        onClick={() => handleCancelTransaction(transaction)}
                                                    >
                                                        Cancel
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </div>
                        </ul>
                        <button className="bg-gray-500 text-white py-2 px-6 rounded mt-4 hover:bg-gray-600" onClick={handleHideTransactions}>
                            Return
                        </button>
                    </div>
                )}
                {showProfile && <UserProfile email={email} userDetails={userDetails} />}
            </div>
            <div className="navigation-control" style={{ position: 'fixed', top: '10px', left: '10px' }}>
                {showNavigationBar ? (
                    <button
                        className={`navigation-button ${iconSpin || isHovering ? 'spin' : ''}`}
                        onMouseEnter={() => setIsHovering(true)} 
                        onMouseLeave={() => setIsHovering(false)} 
                        onClick={handleHideNavigationBar}
                    >
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                ) : (
                    <button
                        className={`navigation-button ${iconSpin || isHovering ? 'spin' : ''}`}
                        onMouseEnter={() => setIsHovering(true)} 
                        onMouseLeave={() => setIsHovering(false)} 
                        onClick={handleShowNavigationBar}
                    >
                        <FontAwesomeIcon icon={faBars} />
                    </button>
                )}
            </div>
        </div>
    );
}

export default UserDashboard;