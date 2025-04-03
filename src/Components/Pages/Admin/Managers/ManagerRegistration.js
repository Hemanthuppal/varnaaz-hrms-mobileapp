import React, { useState, useEffect } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { auth, db } from "./../../../firebase/firebase";
import { useNavigate } from "react-router-dom";

function ManagerRegistration({ onManagerRegistrationSuccess }) {
  const history = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mobile, setMobile] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [formValid, setFormValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [mobileError, setMobileError] = useState("");
  const [emailError, setEmailError] = useState("");

  const selectedRole = "manager";

  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (fullName && email && password && mobile) {
      if (emailRegex.test(email)) {
        if (password.length >= 6) {
          if (/^\d{10}$/.test(mobile)) {
            setErrorMsg("");
            setPasswordError("");
            setMobileError("");
            setEmailError("");
            setFormValid(true);
            return;
          } else {
            setMobileError("Mobile number should contain exactly 10 digits.");
          }
        } else {
          setPasswordError("Minimum 6 characters required for the password.");
        }
      } else {
        if (email.indexOf("@") === -1) {
          setEmailError('Please enter a valid email address. "@" is missing.');
        } else {
          setEmailError("Please enter a valid email address.");
        }
      }
    } else {
      setErrorMsg("Please fill in all fields correctly.");
    }

    setFormValid(false);
  };

  useEffect(() => {
    validateForm();
  }, [fullName, email, password, mobile]);

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: fullName,
      });

      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, {
        fullName: fullName,
        email: email,
        password: password,
        mobile: mobile,
        role: selectedRole,
        employeeUid: user.uid,
        timestamp: Timestamp.fromDate(new Date()),
      });

      alert("Manager Registered Successfully!!!");
      onManagerRegistrationSuccess();
      setFullName("");
      setEmail("");
      setPassword("");
      setMobile("");
    } catch (error) {
      console.error("Firebase signup error:", error);
      alert("An error occurred during signup");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="container">
      {/* <h2 className="text-center mb-4">Manager Registration</h2> */}
      <form onSubmit={handleSignup}>
        <div className="row">
          <div className="col-6 mb-3">
            <label htmlFor="name" className="form-label">
              Name
            </label>
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
          <div className="col-6 mb-3">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              type="email"
              className="form-control"
              id="email"
              name="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError("");
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.target.value)) {
                  setEmailError("Please enter a valid email address.");
                }
              }}
              required
            />
            {emailError && <div className="text-danger">{emailError}</div>}
          </div>
          <div className="col-6 mb-3">
            <label htmlFor="mobile" className="form-label">
              Mobile Number
            </label>
            <input
              type="tel"
              className="form-control"
              id="mobile"
              name="mobile"
              value={mobile}
              onChange={(e) => {
                setMobile(e.target.value);
                setMobileError("");
                if (!/^\d{10}$/.test(e.target.value)) {
                  setMobileError(
                    "Mobile number should contain exactly 10 digits."
                  );
                }
              }}
              pattern="[0-9]{10}"
              required
            />
            {mobileError && <div className="text-danger">{mobileError}</div>}
          </div>

          <div className="col-6 mb-3">
            <label htmlFor="role" className="form-label">
              Role
            </label>
            <input
              type="text"
              className="form-control"
              id="role"
              name="role"
              value="Manager" // Set value to 'Manager'
              readOnly // Make the field read-only
            />
          </div>
        </div>
        <div className="mb-3">
          <label htmlFor="password" className="form-label">
            Password
          </label>
          <input
            type="password"
            className="form-control"
            id="password"
            name="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setPasswordError("");
              if (e.target.value.length < 6) {
                setPasswordError(
                  "Minimum 6 characters required for the password."
                );
              }
            }}
            required
          />
          {passwordError && <div className="text-danger">{passwordError}</div>}
        </div>
        <div className="text-center">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!formValid || isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ManagerRegistration;
