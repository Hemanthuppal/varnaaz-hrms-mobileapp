import React, { useState, useEffect, useCallback } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { Modal, Button, Form, Alert } from "react-bootstrap";
import AdminDashboard from '../../../Shared/AdminSidebar/AdminSidebar';
import {
  doc,
  setDoc,
  Timestamp,
  collection,
  getDocs,
  query,
  where,
  addDoc,
  orderBy,
} from "firebase/firestore";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { auth, db } from "./../../../firebase/firebase";
import { useNavigate } from "react-router-dom";
import './AddEmployee.css';

// Import Google Maps components
import { GoogleMap, useLoadScript, Marker } from "@react-google-maps/api";

// Define map container style
const mapContainerStyle = {
  width: "100%",
  height: "300px",
};

// Default center (e.g., India)
const defaultCenter = {
  lat: 20.5937,
  lng: 78.9629,
};

// Libraries to load with Google Maps
const libraries = ["places"];

/**
 * DepartmentModal Component
 * Handles adding a new department
 */
function DepartmentModal({
  showModal,
  setShowModal,
  newDepartment,
  setNewDepartment,
  handleAddDepartment,
}) {
  return (
    <Modal show={showModal} onHide={() => setShowModal(false)}>
      <Modal.Header closeButton>
        <Modal.Title>Add New Department</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <input
          type="text"
          className="form-control"
          placeholder="Department Name"
          value={newDepartment}
          onChange={(e) => setNewDepartment(e.target.value)}
        />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowModal(false)}>
          Close
        </Button>
        <Button variant="primary" onClick={handleAddDepartment}>
          Save Changes
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

/**
 * LocationModal Component
 * Handles selecting a location using Google Maps
 */

function LocationModal({
  showModal,
  setShowModal,
  location,
  setLocation,
  setAddressFromMap,
  reverseGeocode,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [map, setMap] = useState(null);

  const libraries = ["places"]; // Include Places library
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: 'AIzaSyAZAU88Lr8CEkiFP_vXpkbnu1-g-PRigXU', // Hardcoded API Key
    libraries,
  });

  // Handle map clicks to set marker position
  const onMapClick = useCallback(
    (event) => {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      setLocation({ lat, lng });
      reverseGeocode(lat, lng);
    },
    [reverseGeocode, setLocation]
  );

  // Handle search location
  const handleSearchLocation = () => {
    if (map && searchTerm) {
      const service = new window.google.maps.places.PlacesService(map);
      const request = {
        query: searchTerm,
        fields: ["name", "geometry"],
      };

      service.findPlaceFromQuery(request, (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          const { geometry } = results[0];
          const { location } = geometry;
          setLocation({
            lat: location.lat(),
            lng: location.lng(),
          });
          map.panTo(location); // Center the map to the found location
          reverseGeocode(location.lat(), location.lng());
        }
      });
    }
  };

  // Save a reference to the map when it's loaded
  const onLoad = (mapInstance) => {
    setMap(mapInstance);
  };

  if (loadError) {
    return <div>Error loading maps</div>;
  }

  if (!isLoaded) {
    return <div>Loading maps...</div>;
  }

  return (
    <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Select Location</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className='d-flex align-items-center mb-3'>
          <Form.Control
            type="text"
            className="form-control"
            placeholder="Enter Location Name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '250px' }}  // Adjust the width as needed
          />
          <Button variant="primary" onClick={handleSearchLocation} style={{ marginLeft: '10px' }}>
            Search
          </Button>
        </div>


        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          zoom={location.lat && location.lng ? 12 : 4}
          center={location.lat && location.lng ? location : defaultCenter}
          onClick={onMapClick}
          onLoad={onLoad}
        >
          {location.lat && location.lng && (
            <Marker position={{ lat: location.lat, lng: location.lng }} />
          )}
        </GoogleMap>
        <div className="mt-2">
          {location.lat && location.lng ? (
            <p>
              Selected Location: Latitude: {location.lat.toFixed(6)}, Longitude:{" "}
              {location.lng.toFixed(6)}
            </p>
          ) : (
            <p>No location selected</p>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowModal(false)}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={() => setShowModal(false)}
          disabled={!location.lat || !location.lng}
        >
          Confirm Location
        </Button>
      </Modal.Footer>
    </Modal>
  );
}


function AddEmployee() {
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [newDepartment, setNewDepartment] = useState("");
  const [departments, setDepartments] = useState([]);
  const [collapsed, setCollapsed] = useState(false);

  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [employees, setEmployees] = useState([]); // State to store employee objects
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mobile, setMobile] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedManager, setSelectedManager] = useState("");
  const [managerData, setManagerData] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [formValid, setFormValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employeeId, setEmployeeId] = useState("");

  // Additional state variables for new fields
  const [education, setEducation] = useState("");
  const [specialisation, setSpecialisation] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [photo, setPhoto] = useState(null);
  const [resume, setResume] = useState(null);
  const [offerletter, setOfferletter] = useState(null);
  const [offerletterUrl, setOfferletterUrl] = useState();
  const [resumeUrl, setResumeUrl] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [address, setAddress] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bank, setBank] = useState("");
  const [branch, setBranch] = useState("");
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [project, setProject] = useState(""); // New state for Project

  // New state variables for Location (Latitude, Longitude & Address)
  const [location, setLocation] = useState({ lat: null, lng: null });
  const [addressFromMap, setAddressFromMap] = useState(""); // Derived address
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // Load Google Maps script
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY, // Ensure this is set in your .env file
    libraries,
  });

  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      fullName &&
      email &&
      password &&
      mobile &&
      selectedRole &&
      location.lat &&
      location.lng &&
      addressFromMap &&
      project // Ensure Project is filled
    ) {
      if (emailRegex.test(email)) {
        if (password.length >= 6) {
          setErrorMsg("");
          setPasswordError("");
          setFormValid(true);
          return;
        } else {
          setPasswordError("Minimum 6 characters required for the password.");
        }
      } else {
        setErrorMsg("Please enter a valid email address.");
      }
    } else {
      setErrorMsg("Please fill in all fields correctly, including location and project.");
    }

    setFormValid(false);
  };

  useEffect(() => {
    validateForm();
    fetchEmployeeCount();
    if (selectedRole === "Employee" && selectedDepartment) {
      fetchManagerNames(selectedDepartment);
    }
  }, [
    fullName,
    email,
    password,
    mobile,
    selectedRole,
    selectedDepartment,
    location,
    addressFromMap,
    // Include project in dependencies
  ]);

  const handleRoleChange = (e) => {
    setSelectedRole(e.target.value);
    setSelectedManager(""); // Reset the selected manager when the role changes

    if (e.target.value === "Employee") {
      fetchManagerNames(selectedDepartment);
    }
  };

  useEffect(() => {
    // Function to fetch users and store their emails
    const fetchUsers = async () => {
      try {
        const usersCollectionRef = collection(db, 'users');
        const q = query(usersCollectionRef, orderBy('timestamp', 'desc')); // Order by timestamp in descending order
        const querySnapshot = await getDocs(q);

        // Get user data and store only emails
        const usersData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Store emails from users
        const userEmails = usersData.map(user => user.email);
        setUsers(userEmails); // Set only emails
        console.log("userEmails=", userEmails);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);


  // Function to fetch employees with 'Selected' status
  const fetchEmployees = async () => {
    try {
      const q = query(
        collection(db, "employees"),
        where("status", "==", "Selected")
      );
      const querySnapshot = await getDocs(q);

      const employeesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().fullName, // Assuming field is 'fullName'
        email: doc.data().email,   // Assuming field is 'email'
        ...doc.data()
      }));

      // Filter employees whose email does not exist in the users list
      const filteredEmployees = employeesData.filter(employee =>
        !users.includes(employee.email)
      );

      setEmployees(filteredEmployees); // Set only filtered employees
      console.log("filteredEmployees=", filteredEmployees);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  useEffect(() => {
    fetchEmployees(); // Fetch employees data after users are fetched
  }, [users]); // Fetch employees once users are set


  // Populate form fields based on selected employee
  useEffect(() => {
    if (fullName) {
      const selectedEmployee = employees.find(emp => emp.name === fullName);
      console.log("selectedEmployee=", selectedEmployee);

      if (selectedEmployee) {
        setEmail(selectedEmployee.email || '');
        setMobile(selectedEmployee.contactNo || '');
        setGender(selectedEmployee.gender || '');
        setEducation(selectedEmployee.educationQualification || '');
        setAadhaarNumber(selectedEmployee.uanNumber || '');
        setAddress(selectedEmployee.location || '');
        setFatherName(selectedEmployee.fathername || '');
        setDob(selectedEmployee.dob || '');
        setSpecialisation(selectedEmployee.specialisation || '');
        setResumeUrl(selectedEmployee.resume || '');
        setOfferletterUrl(selectedEmployee.offerletterUrl || '');
        setPhotoUrl(selectedEmployee.image || ''); // Fetched photo URL from employee data
        setSelectedDepartment(selectedEmployee.department || '');
      }
    } else {
      resetFormFields();
    }
  }, [fullName, employees]);



  const fetchManagerNames = async (department) => {
    try {
      const q = query(
        collection(db, "users"),
        where("role", "==", "Manager"),
        where("department", "==", department) // Filter by department
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map((doc) => ({
        uid: doc.id,
        fullName: doc.data().fullName,
      }));
      setManagerData(data);
    } catch (error) {
      console.error("Error fetching manager data:", error);
    }
  };

  const fetchEmployeeCount = async () => {
    try {
      const q = query(collection(db, "users"));
      const querySnapshot = await getDocs(q);
      const employeeCount = querySnapshot.docs.length;
      setEmployeeId(`EMPID${String(employeeCount + 1).padStart(3, "0")}`);
    } catch (error) {
      console.error("Error fetching employee count:", error);
    }
  };

  const handleFileUpload = async (file, folderName) => {
    if (!file) return "";  // If no file, return empty string

    const storage = getStorage();
    const uniqueFileName = `${folderName}/${Date.now()}_${file.name}`;
    const fileRef = storageRef(storage, uniqueFileName);

    try {
      const uploadResult = await uploadBytes(fileRef, file);
      const fileURL = await getDownloadURL(uploadResult.ref);  // Get the file's URL after uploading
      return fileURL;
    } catch (error) {
      console.error("File upload error: ", error);
      return "";
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update the user's display name
      await updateProfile(user, { displayName: fullName });

      // Find the manager data and assign manager UID if available
      const selectedManagerData = managerData.find(manager => manager.fullName === selectedManager);
      const assignedManagerUid = selectedManagerData ? selectedManagerData.uid : "";

      // If a new photo is selected, upload it; otherwise, use the existing photo URL
      const finalPhotoUrl = photo ? await handleFileUpload(photo, "photos") : photoUrl; // Use new photo or existing one
      const finalResumeUrl = resume ? await handleFileUpload(resume, "resumes") : resumeUrl;
      const finalOfferletterUrl = offerletter ? await handleFileUpload(offerletter, "offerletters") : offerletterUrl;

      // Add user data to Firestore
      await setDoc(doc(db, "users", user.uid), {
        fullName,
        email,
        mobile,
        role: selectedRole,
        employeeUid: user.uid,
        assignedManager: selectedManager,
        department: selectedDepartment,
        assignedManagerUid,
        employeeId,
        timestamp: Timestamp.fromDate(new Date()),
        education,
        specialisation,

        resume: finalResumeUrl,  // Store final resume URL
        fatherName,
        dob,
        gender,
        photo: finalPhotoUrl,  // Store final photo URL (newly uploaded or fetched one)
        offerletter: finalOfferletterUrl,  // Store final offer letter URL
        timestamp: Timestamp.fromDate(new Date()),
        address,
        accountHolderName,
        accountNumber,
        bank,
        branch,
        aadhaarNumber,
        ifsc,
        location,  // Store selected location coordinates
      });

      // Alert success and redirect to employee list
      window.alert("Registered Successfully!!!");
      navigate('/a-employeelist');

      // Reset form after submission
      resetForm();

    } catch (error) {
      console.error("Error during signup:", error);
      setErrorMsg("An error occurred during signup. Please try again.");
      setIsSubmitting(false);
    }
  };
  const resetForm = () => {
    setFullName("");
    setEmail("");
    setPassword("");
    setMobile("");
    setPasswordError("");
    setSelectedRole("");
    setSelectedManager("");
    setManagerData([]);
    setErrorMsg("");
    setFormValid(false);
    setIsSubmitting(false);
    setEmployeeId("");
    setEducation("");
    setSpecialisation("");
    setFatherName("");
    setDob("");
    setGender("");
    setPhoto(null);
    setResume(null);
    setOfferletter(null);
    setAddress("");
    setAccountHolderName("");
    setAccountNumber("");
    setBank("");
    setBranch("");
    setAadhaarNumber("");
    setIfsc("");
    setLocation({ lat: null, lng: null });
    setAddressFromMap("");

  };

  const resetFormFields = () => {
    // Reset only specific fields when no employee is selected
    setEmail("");
    setMobile("");
    setGender("");
    setEducation("");
    setAadhaarNumber("");
    setAddress("");
    setFatherName("");
    setDob("");
    setSpecialisation("");

  };

  useEffect(() => {
    const fetchDepartments = async () => {
      const querySnapshot = await getDocs(collection(db, "departments"));
      const fetchedDepartments = querySnapshot.docs.map(
        (doc) => doc.data().name
      );
      setDepartments(fetchedDepartments);
    };
    fetchDepartments();
  }, []);

  // Handle new department submission
  const handleAddDepartment = async () => {
    if (newDepartment) {
      await addDoc(collection(db, "departments"), { name: newDepartment });
      setDepartments((prev) => [...prev, newDepartment]); // Optimistically update the UI
      setNewDepartment(""); // Reset the input field
      setShowDeptModal(false); // Close the modal
    }
  };

  // Function to perform reverse geocoding
  const reverseGeocode = useCallback(async (lat, lng) => {
    if (!window.google) {
      console.error("Google Maps JavaScript API library must be loaded.");
      return;
    }

    const geocoder = new window.google.maps.Geocoder();
    const latlng = { lat, lng };

    try {
      const results = await geocoder.geocode({ location: latlng });
      if (results.results[0]) {
        setAddressFromMap(results.results[0].formatted_address);
        // setAddress(results.results[0].formatted_address); 
      } else {
        setAddressFromMap("No address found");
      }
    } catch (error) {
      console.error("Geocoder failed due to: " + error);
      setAddressFromMap("Geocoding failed");
    }
  }, []);

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div>Loading Maps...</div>;

  return (
    <div className='card-body admin-container'>
      <AdminDashboard onToggleSidebar={setCollapsed} />
      <div className={`admin-content ${collapsed ? 'collapsed' : ''}`}>
        <h2 className='heading'>Registration</h2>

        <form onSubmit={handleSignup}>
          {/* Personal Details */}
          <div className="card mb-5">
            <div className="card-body">
              <h5 className="card-title">Personal Details</h5>

              {/* Name and Father's Name */}
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="name" className="form-label">Name</label>
                  <select
                    className="form-control"
                    id="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  >
                    <option value="">Select an employee</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.name}>
                        {employee.name}
                      </option>
                    ))}
                  </select>
                </div>
                {/* <div className="col-md-6 mb-3">
                  <label htmlFor="fatherName" className="form-label">
                    Father's Name
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="fatherName"
                    value={fatherName}
                    onChange={(e) => setFatherName(e.target.value)}
                    required
                  />
                </div> */}
                <div className="col-md-6 mb-3">
                  <label htmlFor="dob" className="form-label">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    id="dob"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Date of Birth and Gender */}
              <div className="row">

                <div className="col-md-6 mb-3">
                  <label htmlFor="gender" className="form-label">
                    Gender
                  </label>
                  <select
                    className="form-select"
                    id="gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="aadhaarNumber" className="form-label">
                    Aadhaar Number
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="aadhaarNumber"
                    value={aadhaarNumber}
                    onChange={(e) => setAadhaarNumber(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Email and Password */}
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="email" className="form-label">
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  {errorMsg && <div className="text-danger">{errorMsg}</div>}
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="password" className="form-label">
                    Password
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  {passwordError && <div className="text-danger">{passwordError}</div>}
                </div>
              </div>

              {/* Phone Number and Photo */}
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="mobile" className="form-label">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    className="form-control"
                    id="mobile"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="photo" className="form-label">Photo</label>
                  <input
                    type="file"
                    className="form-control"
                    id="photo"
                    onChange={(e) => setPhoto(e.target.files[0])}
                    accept="image/*"
                  />

                  {photoUrl && (
                    <div className="mb-3">
                      <a href={photoUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                        View Photo
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Address and Aadhaar Number */}
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="address" className="form-label">
                    Address
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-6">
                  {/* Input for Aadhaar Number */}

                </div>
              </div>
            </div>
          </div>

          {/* Additional Personal Details */}
          <div className="card mb-5">
            <div className="card-body">
              <h5 className="card-title">Additional Details</h5>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="education" className="form-label">
                    Education
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="education"
                    value={education}
                    onChange={(e) => setEducation(e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="specialisation" className="form-label">
                    Specialisation
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="specialisation"
                    value={specialisation}
                    onChange={(e) => setSpecialisation(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Resume Upload */}
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="resume" className="form-label">Resume</label>
                  <input
                    type="file"
                    className="form-control"
                    id="resume"
                    onChange={(e) => setResume(e.target.files[0])}
                    accept=".pdf,.doc,.docx"
                  />

                  {resumeUrl && (
                    <div className="mb-3">
                      <a href={resumeUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                        View Resume
                      </a>
                    </div>
                  )}
                </div>

                <div className="col-md-6 mb-3">
                  <label htmlFor="offerletter" className="form-label">Offer Letter</label>
                  <input
                    type="file"
                    className="form-control"
                    id="offerletter"
                    onChange={(e) => setOfferletter(e.target.files[0])}
                    accept=".pdf,.doc,.docx"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Role, Department & Location */}
          <div className="card mb-5">
            <div className="card-body">
              <h5 className="card-title">Role, Department & Location</h5>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="role" className="form-label">
                    Role
                  </label>
                  <select style={{ marginTop: '10px' }}
                    className="form-select"
                    id="role"
                    value={selectedRole}
                    onChange={handleRoleChange}
                    required
                  >
                    <option value="">Select Role</option>
                    <option value="Employee">Employee</option>
                    <option value="Manager">Manager</option>

                  </select>
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="department" className="form-label">Department</label>
                  <div className="input-group">
                    <select
                      className="form-select"
                      id="department"
                      value={selectedDepartment}
                      onChange={(e) => {
                        setSelectedDepartment(e.target.value);
                        setSelectedManager("");
                      }}
                      required
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept, index) => (
                        <option key={index} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowDeptModal(true)}
                    >
                      Add
                    </button>
                  </div>
                </div>



                {/* Location Selection */}
                {/* <div className="col-md-6 mb-3">
                  <label className="form-label">Location</label>
                  <div className="d-flex align-items-center">
                    <Button variant="primary" onClick={() => setIsLocationModalOpen(true)}>
                      Add Location
                    </Button>
                    {location.lat && location.lng && (
                      <div className="ms-3">
                        <p className="mb-0"><strong>Lat:</strong> {location.lat.toFixed(6)}</p>
                        <p className="mb-0"><strong>Lng:</strong> {location.lng.toFixed(6)}</p>
                      </div>
                    )}
                  </div>
                </div> */}
              </div>

              {/* Manager Selection */}
              {selectedRole === "Employee" && (
                <div className="row mt-3">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="manager" className="form-label">
                      Manager
                    </label>
                    <select
                      className="form-select"
                      id="manager"
                      value={selectedManager}
                      onChange={(e) => setSelectedManager(e.target.value)}
                      required
                    >
                      <option value="">Select Manager</option>
                      {managerData.map((manager) => (
                        <option key={manager.uid} value={manager.fullName}>
                          {manager.fullName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Account Details */}
          <div className="card mb-5">
            <div className="card-body">
              <h5 className="card-title">Account Details</h5>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="accountHolderName" className="form-label">
                    Account Holder Name
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="accountHolderName"
                    value={accountHolderName}
                    onChange={(e) => setAccountHolderName(e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="accountNumber" className="form-label">
                    Account Number
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="accountNumber"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="bank" className="form-label">
                    Bank
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="bank"
                    value={bank}
                    onChange={(e) => setBank(e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="branch" className="form-label">
                    Branch
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="branch"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="ifsc" className="form-label">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="ifsc"
                    value={ifsc}
                    onChange={(e) => setIfsc(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="text-center">
            <button
              type="submit"
              className="btn btn-primary"

            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      </div>

      {/* Department Modal */}
      <DepartmentModal
        showModal={showDeptModal}
        setShowModal={setShowDeptModal}
        newDepartment={newDepartment}
        setNewDepartment={setNewDepartment}
        handleAddDepartment={handleAddDepartment}
      />

      {/* Location Modal */}
      <LocationModal
        showModal={isLocationModalOpen}
        setShowModal={setIsLocationModalOpen}
        location={location}
        setLocation={setLocation}
        setAddressFromMap={setAddressFromMap}
        reverseGeocode={reverseGeocode}
      />
    </div>
  );
};

export default AddEmployee;