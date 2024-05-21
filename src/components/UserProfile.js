import React, { useState, useEffect } from 'react';
import { db, storage } from './firebaseConfig';
import { onValue, ref as databaseRef, set, get } from 'firebase/database';
import { ref as storageRef, getDownloadURL, uploadBytes } from 'firebase/storage';
import './UserProfile.css';

const updateUserProfileImageURL = async (userEmail, imageURL) => {
    try {
        const userDetailsRef = databaseRef(db, `accounts`);
        const snapshot = await get(userDetailsRef);
        const data = snapshot.val();

        const userId = Object.keys(data).find(key => data[key].email === userEmail);

        if (userId) {
            const userRef = databaseRef(db, `accounts/${userId}`);
            await set(userRef, { ...data[userId], profileImage: imageURL });
            console.log("Profile image URL updated successfully.");
        } else {
            console.error("User not found with email:", userEmail);
        }
    } catch (error) {
        console.error("Error updating profile image URL:", error);
    }
};

function UserProfile({ email }) {
    const [userDetails, setUserDetails] = useState(null);
    const [profileImageUrl, setProfileImageUrl] = useState(null);
    const [uploadButtonText, setUploadButtonText] = useState("Upload Profile Picture");
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        const userDetailsRef = databaseRef(db, `accounts`);
        const unsubscribe = onValue(userDetailsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const user = Object.values(data).find(account => account.email === email);
                if (user) {
                    setUserDetails(user);
                    if (user.profileImage) {
                        setProfileImageUrl(user.profileImage);
                        setUploadButtonText("Edit Profile Picture");
                    } else {
                        setProfileImageUrl('https://th.bing.com/th/id/OIP.cN620h43KlX8Sa15ZIsJfQHaHa?w=214&h=214&c=7&r=0&o=5&pid=1.7');
                    }
                }
            }
        });

        return () => unsubscribe();
    }, [db, email]);

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file || !file.name) {
            console.error("No file selected or file name is missing.");
            return;
        }

        if (!userDetails || !userDetails.email) {
            console.error("User details are missing or incomplete.");
            return;
        }

        const userEmail = userDetails.email;
        const filePath = `${userEmail}/${file.name}`;
        const fileRef = storageRef(storage, filePath);

        try {
            const snapshot = await uploadBytes(fileRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            await updateUserProfileImageURL(userEmail, downloadURL);
            setProfileImageUrl(downloadURL);
            setUploadButtonText("Edit Profile Picture");
        } catch (error) {
            console.error("Error uploading file:", error);
        }
    };

    const handleEditProfilePic = () => {
        const fileInput = document.getElementById("file-input");
        if (fileInput) {
            fileInput.click();
        }
    };

    const handleEditButtonClick = () => {
        setIsEditing(!isEditing);
    };

    const handleInputChange = (event) => {
        const { name, value } = event.target;
    
        if (name === "phoneNumber" && value.length > 11) {
            return;
        }
    
        setUserDetails(prevState => ({
            ...prevState,
            [name]: value
        }));
    };
    

    const saveChanges = async () => {
        try {
            if (!/^(09|639)\d{9}$/.test(userDetails.phoneNumber)) {
                alert('Please enter a valid 11-digit phone number starting with "09" ');
                return;
            }

            const userDetailsRef = databaseRef(db, `accounts`);
            const snapshot = await get(userDetailsRef);
            const data = snapshot.val();

            const userId = Object.keys(data).find(key => data[key].email === email);

            if (userId) {
                const userRef = databaseRef(db, `accounts/${userId}`);
                await set(userRef, userDetails);
                console.log("User details updated successfully.");
            } else {
                console.error("User not found with email:", email);
            }
        } catch (error) {
            console.error("Error updating user details:", error);
        }
        setIsEditing(false);
    };

    return (
        <div className="user-profile-container">
            <div className='user-profile-text'>
                <h3>Profile</h3>
            </div>
            {userDetails ? (
                <div>
                    <div className="profile-picture-container">
                        {profileImageUrl && <img src={profileImageUrl} alt="Profile" />}
                    </div>
                    <div className="edit-profile-text">
                        <input id="file-input" type="file" style={{ display: 'none' }} onChange={handleFileUpload} />
                        <button onClick={handleEditProfilePic}>{uploadButtonText}</button>
                    </div>
                    <div className="transactions-list">
                        <ul>
                            <div className="transactions-container">
                                <p>Name: {isEditing ? <input name="name" value={userDetails.name} onChange={handleInputChange} /> : userDetails.name}</p>
                                <p>Email: {isEditing ? <input name="email" value={userDetails.email} onChange={handleInputChange} /> : userDetails.email}</p>
                                <p>Phone Number: {isEditing ? <input name="phoneNumber" value={userDetails.phoneNumber} onChange={handleInputChange} /> : userDetails.phoneNumber}</p>
                                <p>Address: {isEditing ? <input name="address" value={userDetails.address} onChange={handleInputChange} /> : userDetails.address}</p>
                            </div>
                        </ul>
                    </div>
                </div>
            ) : (
                <p>Loading user profile...</p>
            )}
            <div className="edit-button-container">
                {!isEditing ? (
                    <button className="edit-button" onClick={handleEditButtonClick}>Edit</button>
                ) : (
                    <button className="edit-button" onClick={saveChanges}>Save</button>
                )}
            </div>
        </div>
    );
}

export default UserProfile;
