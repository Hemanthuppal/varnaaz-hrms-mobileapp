import React, { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, Timestamp, collection, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from './../../../firebase/firebase';
import { useNavigate } from 'react-router-dom';

function ExecutiveRegistration({ onRegistrationSuccess }) {
  const history = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [selectedRole, setSelectedRole] = useState('sales-executive');
  const [selectedManager, setSelectedManager] = useState('');
  const [managerData, setManagerData] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [formValid, setFormValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [mobileError, setMobileError] = useState('');
  const [emailError, setEmailError] = useState('');

  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (fullName && email && password && mobile) {
      if (emailRegex.test(email)) {
        if (password.length >= 6) {
          if (/^\d{10}$/.test(mobile)) {
            setErrorMsg('');
            setPasswordError('');
            setMobileError('');
            setEmailError('');
            setFormValid(true);
            return;
          } else {
            setMobileError('Mobile number should contain exactly 10 digits.');
          }
        } else {
          setPasswordError('Minimum 6 characters required for the password.');
        }
      } else {
        if (email.indexOf('@') === -1) {
          setEmailError('Please enter a valid email address. "@" is missing.');
        } else {
          setEmailError('Please enter a valid email address.');
        }
      }
    } else {
      setErrorMsg('Please fill in all fields correctly.');
    }

    setFormValid(false);
  };

  useEffect(() => {
    validateForm();
  }, [fullName, email, password, mobile, selectedRole]);

  const fetchManagerNames = async () => {
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'manager'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map((doc) => ({
        uid: doc.id,
        fullName: doc.data().fullName,
      }));
      setManagerData(data);
    } catch (error) {
      console.error('Error fetching manager data:', error);
    }
  };

  useEffect(() => {
    fetchManagerNames();
  }, []);

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: fullName,
      });

      const selectedManagerData = managerData.find((manager) => manager.fullName === selectedManager);
      const assignedManagerUid = selectedManagerData ? selectedManagerData.uid : '';

      // Store user data in Firestore, including employee UID
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        employeeUid: user.uid,
        fullName: fullName,
        email: email,
        password: password,
        mobile: mobile,
        role: selectedRole,
        assignedmanager: selectedManager,
        assignedManagerUid: assignedManagerUid,
        timestamp: Timestamp.fromDate(new Date()),
      });

      alert('Sales-executive Registered Successfully!!!');
      onRegistrationSuccess();
      setFullName('');
      setEmail('');
      setPassword('');
      setMobile('');

    } catch (error) {
      console.error('Firebase signup error:', error);
      setErrorMsg('An error occurred during signup. Please check the console for details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container">
      <form onSubmit={handleSignup}>
        <div className="row">
          <div className="col mb-3">
            <label htmlFor="name" className="form-label">Name</label>
            <input
              type="text"
              className="form-control"
              id="name"
              name="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div className="col mb-3">
            <label htmlFor="mobile" className="form-label">Mobile Number</label>
            <input
              type="number"
              className="form-control"
              id="mobile"
              name="mobile"
              value={mobile}
              onChange={(e) => {
                setMobile(e.target.value);
                setMobileError('');
                if (!/^\d{10}$/.test(e.target.value)) {
                  setMobileError('Mobile number should contain exactly 10 digits.');
                }
              }}
              pattern="[0-9]{10}"
              required
            />
            {mobileError && <div className="text-danger">{mobileError}</div>}
          </div>
        </div>
        <div className="row">
          <div className="col mb-3">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              id="email"
              name="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError('');
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.target.value)) {
                  setEmailError('Please enter a valid email address.');
                }
              }}
              required
            />
            {emailError && <div className="text-danger">{emailError}</div>}
          </div>
          <div className="col mb-3">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              id="password"
              name="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError('');
              }}
              required
            />
            {passwordError && <div className="text-danger">{passwordError}</div>}
          </div>
        </div>
        <div className="row">
          <div className="col mb-3">
            <label htmlFor="role" className="form-label">Role</label>
            <input
              type="text"
              className="form-control"
              id="role"
              name="role"
              value={selectedRole}
              readOnly
              required
            />
          </div>
          <div className="col mb-3">
            <label htmlFor="manager" className="form-label">Assigned To Manager</label>
            <select
              className="form-select"
              id="assignedmanager"
              name="assignedmanager"
              value={selectedManager}
              onChange={(e) => setSelectedManager(e.target.value)}
              required
            >
              <option value="" disabled>Select Manager</option>
              {managerData.map((manager) => (
                <option key={manager.uid} value={manager.fullName}>{manager.fullName}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="text-center">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!formValid || isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ExecutiveRegistration;
