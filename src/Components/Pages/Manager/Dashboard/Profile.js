import React, { useState, useEffect, useRef } from 'react';
import { FaRegUserCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { getFirestore, doc, getDoc, updateDoc  } from 'firebase/firestore';
import { auth} from '../../../firebase/firebase'; // Adjust import if needed
import { useAuth } from '../../../Context/AuthContext'; // Assuming you have this context
import './Profile.css';

function Profile() {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [profilePic, setProfilePic] = useState(''); // Start with an empty string
    const { user, logout } = useAuth(); // Assuming useAuth provides the logged-in user's info
    const navigate = useNavigate();
    const dropdownRef = useRef(null);

    const db = getFirestore();

    useEffect(() => {
        const fetchProfilePic = async () => {
            if (user?.uid) {
                const userDocRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setProfilePic(userData.profilePic || ''); // Set profilePic or an empty string if not available
                }
            }
        };

        fetchProfilePic();
    }, [user, db]);

    const toggleDropdown = () => {
        setDropdownOpen(!dropdownOpen);
    };

    const handleProfileClick = () => {
        navigate('/m-profile');
        closeDropdown(); // Close dropdown after navigation
    };

    const handleLogoutClick =  () => {
        // try {
        //   if (user) {
        //     const userDocRef = doc(db, 'users', user.uid);
      
        //     // Set loggedIn to false in Firestore
        //     await updateDoc(userDocRef, { loggedIn: false });
      
        //     // Sign out the user from Firebase
        //     await auth.signOut();
      
        //     // Call the context logout function to clear local state
        //     logout();
      
        //     // Redirect to login page
        //     navigate('/');
        //   }
        // } catch (error) {
        //   console.error('Logout error:', error);
        // }
        navigate('/');
      };
      

    const closeDropdown = () => {
        setDropdownOpen(false);
    };

    const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            closeDropdown();
        }
    };

    useEffect(() => {
        if (dropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [dropdownOpen]);

    return (
        <div className="dropdown-container" ref={dropdownRef}>
            <div
                className={`nav-icon1 ${dropdownOpen ? 'active' : ''}`} // Apply the active class when dropdown is open
                onClick={toggleDropdown}
            >
                {profilePic ? (
                    <img
                        src={profilePic}
                        alt="Profile"
                        className="profile-picture"
                    />
                ) : (
                    <FaRegUserCircle className="default-profile-icon" />
                )}
            </div>
            {dropdownOpen && (
                <div className="Profile-dropdown-menu">
                    <button style={{ fontWeight: "bold" }} className="dropdown-item" onClick={handleProfileClick}>
                        Profile
                    </button>
                    <button style={{ color: "red", fontWeight: "bold" }} className="dropdown-item" onClick={handleLogoutClick}>
                        LogOut
                    </button>
                    {/* <a
                href={`http://localhost:4000/update-loggedin-status?userId=${user.uid}&loggedIn=false`}
            
            >
                Logout
            </a> */}
                </div>
            )}
        </div>
    );
}

export default Profile;
