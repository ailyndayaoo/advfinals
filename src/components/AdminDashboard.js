import React, { useState, useEffect } from 'react';
import { app } from './firebaseConfig';
import { getDatabase, ref, onValue, update, push, remove  } from 'firebase/database';
import './AdminDashboard.css';
import NavigationBar from './AdminNav';
import { format } from 'date-fns';

function AdminDashboard({ onLogout }) {
    const [transactions, setTransactions] = useState([]);
    const [screen, setScreen] = useState('dashboard');
    const [accounts, setAccounts] = useState([]);
    const [searchEmail, setSearchEmail] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [totalReservations, setTotalReservations] = useState(0);
    const [reportsTotal, setReportsTotal] = useState(0);
    const [services, setServices] = useState([]);
    const [newEmployeeName, setNewEmployeeName] = useState('');
    const [employees, setEmployees] = useState([]);

    const servicePrices = {
        1: '$30',
        2: '$25',
        3: '$35',
    };

    const db = getDatabase(app);

    useEffect(() => {
        const transactionsRef = ref(db, 'transactions');
        onValue(transactionsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const transactionsArray = Object.keys(data).map((key) => ({
                    id: key,
                    ...data[key],
                }));
                setTransactions(transactionsArray);
            } else {
                setTransactions([]);
            }
        });
    }, [db]);

    useEffect(() => {
        const accountsRef = ref(db, 'accounts');
        onValue(accountsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const accountsArray = Object.keys(data).map((key) => ({
                    id: key,
                    ...data[key],
                }));
                setAccounts(accountsArray);
            } else {
                setAccounts([]);
            }
        });
    }, [db]);

    useEffect(() => {
        const servicesRef = ref(db, 'services');
        onValue(servicesRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const servicesArray = Object.keys(data).map((key) => ({
                    id: key,
                    ...data[key],
                }));
                setServices(servicesArray);
            } else {
                setServices([]);
            }
        });
    }, [db]);

    useEffect(() => {
        const employeesRef = ref(db, 'employees');
        onValue(employeesRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const employeesArray = Object.keys(data).map((key) => ({
                    id: key,
                    ...data[key],
                }));
                setEmployees(employeesArray);
            } else {
                setEmployees([]);
            }
        });
    }, [db]);

    const handleAddEmployee = () => {
        if (!newEmployeeName.trim()) {
            alert('Please enter the name of the new employee.');
            return;
        }

        const newEmployeeData = {
            name: newEmployeeName.trim(),
        };

        push(ref(db, 'employees'), newEmployeeData)
            .then(() => {
                console.log('New employee added successfully.');
                setNewEmployeeName(''); 
            })
            .catch((error) => {
                console.error('Error adding new employee:', error);
                alert('An error occurred while adding the new employee. Please try again.');
            });
    };

    const handleDeleteEmployee = (employeeId) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this employee?");
        if (!confirmDelete) {
            return;
        }
    
        setEmployees(employees.filter((employee) => employee.id !== employeeId));
    
        const employeeRef = ref(db, `employees/${employeeId}`);
        remove(employeeRef)
            .then(() => {
                console.log('Employee deleted successfully.');
            })
            .catch((error) => {
                console.error('Error deleting employee:', error);
                alert('An error occurred while deleting the employee. Please try again.');
            });
    };
    

    const handleAcceptTransaction = (transactionId) => {
        const transactionToAccept = transactions.find((transaction) => transaction.id === transactionId);
        if (!transactionToAccept) {
            console.error('Transaction not found.');
            return;
        }

        const isConflict = transactions.some((transaction) => {
            return (
                transaction.id !== transactionToAccept.id && 
                transaction.status === 'accepted' && 
                transaction.appointmentDateTime === transactionToAccept.appointmentDateTime
            );
        });

        if (isConflict) {
            console.log('There is a conflict with an existing transaction. Cannot accept.');
            return;
        }

        update(ref(db, `transactions/${transactionId}`), { status: 'accepted' })
            .then(() => {
                console.log('Transaction accepted:', transactionId);
            })
            .catch((error) => {
                console.error('Error accepting transaction:', error);
            });
    };

    const handleDeclineTransaction = (transactionId) => {
        update(ref(db, `transactions/${transactionId}`), { status: 'declined' })
            .then(() => {
                console.log('Transaction declined:', transactionId);
            })
            .catch((error) => {
                console.error('Error declining transaction:', error);
            });
    };

    const filteredTransactions = transactions.filter((transaction) => {
        return transaction.userEmail.toLowerCase().includes(searchEmail.toLowerCase());
    });

    const handleCalculateTotalReservations = () => {
        const filteredByDate = transactions.filter((transaction) => {
            const transactionDate = new Date(transaction.appointmentDateTime);
            return transactionDate >= new Date(startDate) && transactionDate <= new Date(endDate);
        });
        const total = filteredByDate.reduce((acc, curr) => acc + 1, 0);
        setTotalReservations(total);
        setReportsTotal(total); 
    };

    const groupTransactionsByDate = (transactions) => {
        const groupedTransactions = {};
    
        transactions.forEach((transaction) => {
            const date = transaction.appointmentDateTime.split('T')[0];
            const servicePrice = parseFloat(servicePrices[transaction.serviceId]?.replace('$', '') || '0');
    
            if (!groupedTransactions[date]) {
                groupedTransactions[date] = {
                    totalReservations: 0,
                    services: [],
                };
            }
    
            groupedTransactions[date].totalReservations += 1;
            if (!groupedTransactions[date].services.includes(transaction.service)) {
                groupedTransactions[date].services.push(transaction.service);
            }
        });
    
    
        return Object.entries(groupedTransactions)
            .map(([date, data]) => ({ date, ...data }))
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    };
    

    const generateReports = () => {
        const groupedTransactions = groupTransactionsByDate(transactions);
    
        return (
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Total Reservations</th>
                            <th>Services</th>
                        </tr>
                    </thead>
                    <tbody>
                        {groupedTransactions.map(({ date, totalReservations, services,  }) => (
                            <tr key={date}>
                                <td>{date}</td>
                                <td>{totalReservations}</td>
                                <td>
                                    <ul>
                                        {services.map((service, index) => (
                                            <li key={index}>{service}</li>
                                        ))}
                                    </ul>
                                </td>
                             
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };
    
    

    return (
        <div>
            <NavigationBar setScreen={setScreen} />
            <div className="admin-dashboard-container">
                {screen === 'dashboard' && (
                    <>
                        <h2>Admin Dashboard</h2>
                        <div className="transactions-container">
                            <h3>Accounts</h3>
                            <div className="transactions-list">
                                <ul>
                                    {accounts.map((account) => (
                                        <li key={account.id}>
                                            <p>Email: {account.email}</p>
                                            <p>Username: {account.name}</p>
                                            <p>Address: {account.address}</p>
                                            <p>Contact: {account.phoneNumber}</p>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </>
                )}
                                    {screen === 'transactions' && (
                        <>
                            <h2>Transactions</h2>
                            <div className="search-bar">
                                <input
                                    type="text"
                                    placeholder="Search by email"
                                    value={searchEmail}
                                    onChange={(e) => setSearchEmail(e.target.value)}
                                />
                            </div>
                            <div className="transactions-container">
                                <div className="transactions-list">
                                    <ul>
                                        {filteredTransactions.map((transaction) => (
                                            <li key={transaction.id}>
                                                <p>User Email: {transaction.userEmail}</p>
                                                <p>Service: {transaction.service}</p>
                                                <p>Employee: {transaction.employee}</p> {/* Add this line */}
                                                <p>Status: {transaction.status}</p>
                                                <p>Date and Time: {format(new Date(transaction.appointmentDateTime), 'MMMM dd, yyyy h:mm aa')}</p>
                                                {transaction.status !== 'accepted' && (
                                                    <>
                                                        <button onClick={() => handleAcceptTransaction(transaction.id)} className="accept-button">
                                                            Accept
                                                        </button>
                                                        <button onClick={() => handleDeclineTransaction(transaction.id)} className="decline-button">
                                                            Decline
                                                        </button>
                                                    </>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                            {startDate && endDate && (
                                <div>
                                    <button onClick={handleCalculateTotalReservations}>Calculate Total Reservations</button>
                                </div>
                            )}
                        </>
                    )}

                {screen === 'reports' && (
                    <>
                        <h2>Reports</h2>
                        <div>
                            <h3>Dates of Reservations and Services</h3>
                            {generateReports()}
                        </div>
                    </>
                )}
                                            {screen === 'employee' && (
                        <>
                            <h2>Manage Employees</h2>
                            <div className="add-employee-form">
                                <input
                                    type="text"
                                    placeholder="Enter Employee Name"
                                    value={newEmployeeName}
                                    onChange={(e) => setNewEmployeeName(e.target.value)}
                                />
                                <button onClick={handleAddEmployee}>Add Employee</button>
                            </div>
                            <div className="added-employees">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>List of Employees</th>
                                            <th> </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {employees.map((employee) => (
                                            <tr key={employee.id}>
                                                <td>{employee.name}</td>
                                                <td>
                                                    <button onClick={() => handleDeleteEmployee(employee.id)}>Delete Employee</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

            </div>
        </div>
    );
}

export default AdminDashboard;
