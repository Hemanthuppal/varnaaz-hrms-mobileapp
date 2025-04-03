import React, { useState, useEffect, } from "react";
import { Form, Row, Col, Button, Card, Alert } from "react-bootstrap";
import AdminDashboard from "../../../Shared/AdminSidebar/AdminSidebar";
import {
  collection, addDoc, serverTimestamp, doc, updateDoc, getDocs
} from "firebase/firestore";
import { storage, db } from "./../../../firebase/firebase"; // Ensure storage is exported from your firebase config
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import "./AddEmployee.css";

const PersonalDetailsForm = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    dob: "",
    contactNo: "",
    email: "",
    gender: "",
    location: "",
    educationQualification: "",
    experience: "",
    skills: "",
    ctc: "",
    expectedCtc: "",
    currentOrganization: "",
    currentIndustryType: "",
    city: "",
    state: "",
    resume: null,
    aadhaarCard: null,
    panCard: null,
    uanNumber: "",
    panCardNumber: "",
    aadhaarCardNumber: "",
    image: null,
    drivingLicense: null,
    alternateContactNo: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");



  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(""); // Reset error message
    setSuccess(""); // Reset success message

    try {
      // Validate required fields
      if (!formData.name || !formData.email || !formData.contactNo) {
        throw new Error("Name, email, and contact number are required.");
      }

      // Add a new employee document with a temporary data (without file URLs)
      const docRef = await addDoc(collection(db, "employees"), {
        ...formData,
        department: selectedDepartment,
        createdAt: serverTimestamp(), // Add the createdAt field
        // Temporarily set file URLs to null; will update after upload
        resume: null,
        aadhaarCard: null,
        panCard: null,
        image: null,
        drivingLicense: null,
      });

      const employeeId = docRef.id; // Get the generated document ID

      // Upload files to Firebase Storage and get URLs
      const fileUploads = await uploadFiles(employeeId);

      // Update the employee document with the file URLs
      const employeeDocRef = doc(db, "employees", employeeId);
      await updateDoc(employeeDocRef, {
        resume: fileUploads.resumeURL,
        aadhaarCard: fileUploads.aadhaarCardURL,
        panCard: fileUploads.panCardURL,
        image: fileUploads.imageURL,
        drivingLicense: fileUploads.drivingLicenseURL,
      });
      window.alert("Registered Successfully!!!");
      setSuccess("Employee added successfully");
      console.log("Employee added successfully");
      setFormData({
        name: "",
        dob: "",
        contactNo: "",
        email: "",
        gender: "",
        location: "",
        educationQualification: "",
        experience: "",
        skills: "",
        ctc: "",
        expectedCtc: "",
        currentOrganization: "",
        currentIndustryType: "",
        city: "",
        state: "",
        resume: null,
        aadhaarCard: null,
        panCard: null,
        uanNumber: "",
        image: null,
        drivingLicense: null,
        alternateContactNo: "",
        department: ""
      }); // Reset form
    } catch (error) {
      console.error("Error adding employee:", error);
      setError(error.message || "Failed to add employee.");
    } finally {
      setLoading(false);
    }
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

  const uploadFiles = async (employeeId) => {
    const uploadFile = async (file, folder) => {
      if (!file) return null; // Return null if no file
      // Create a unique file name to prevent collisions
      const uniqueFileName = `${employeeId}_${Date.now()}_${file.name}`;
      const storageReference = ref(storage, `${folder}/${uniqueFileName}`);
      await uploadBytes(storageReference, file);
      return await getDownloadURL(storageReference); // Return the file URL
    };

    // Upload each file and get URLs
    const resumeURL = await uploadFile(formData.resume, "resumes");
    const aadhaarCardURL = await uploadFile(formData.aadhaarCard, "aadhaar-cards");
    const panCardURL = await uploadFile(formData.panCard, "pan-cards");
    const imageURL = await uploadFile(formData.image, "images");
    const drivingLicenseURL = await uploadFile(formData.drivingLicense, "licenses");

    return {
      resumeURL,
      aadhaarCardURL,
      panCardURL,
      imageURL,
      drivingLicenseURL,
    };
  };

  return (
    <div className="admin-onboarding-container">
      <AdminDashboard onToggleSidebar={setCollapsed} />
      <div className={`admin-onboarding-content ${collapsed ? "collapsed" : ""}`}>
        <h2 className="admin-onboarding-heading">Registration......</h2>

        <Card className="p-4 mb-4 shadow-sm">
          <Card.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}
            <Form onSubmit={handleSubmit}>
              <Row className="mb-3">
                <Col>
                  <Form.Group controlId="name">
                    <Form.Label>Name<span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter your name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                    required
                    />
                  </Form.Group>
                </Col>
                <Col xs={12} md={6}>
                  <Form.Group controlId="email">
                    <Form.Label>Email<span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="Enter email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>
                </Col>
                {/* <Col xs={12} md={6}>
                  <Form.Group controlId="fathername">
                    <Form.Label>Father's Name<span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter your father's name"
                      name="fathername"
                      value={formData.fathername}
                      onChange={handleChange}

                    />
                  </Form.Group>
                </Col> */}
              </Row>

              <Row className="mb-3">
                <Col xs={12} md={6}>
                  <Form.Group controlId="dob">
                    <Form.Label>Date of Birth<span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="date"
                      placeholder="Enter your date of birth"
                      name="dob"
                      value={formData.dob}
                      onChange={handleChange}
                    // required
                    />
                  </Form.Group>
                </Col>
                <Col xs={12} md={6}>
                  <Form.Group controlId="contactNo">
                    <Form.Label>Contact Number<span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter contact number"
                      name="contactNo"
                      value={formData.contactNo}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row className="mb-3">
               
                <Col xs={12} md={6}>
                  <Form.Group controlId="gender">
                    <Form.Label>Gender<span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      as="select"
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                    // required
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </Form.Control>
                  </Form.Group>
                </Col>
                <Col xs={12} md={6}>
                  <Form.Group controlId="educationQualification">
                    <Form.Label>Education Qualification<span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter qualification"
                      name="educationQualification"
                      value={formData.educationQualification}
                      onChange={handleChange}

                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row className="mb-3">
              <Col xs={12} md={6}>
                  <Form.Group controlId="experience">
                    <Form.Label>Experience (Years)<span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="number"
                      placeholder="Enter experience in years"
                      name="experience"
                      value={formData.experience}
                      onChange={handleChange}
                      min=""
                      required

                    />
                  </Form.Group>
                </Col>
                <Col xs={12} md={6}>
                  <Form.Group controlId="skills">
                    <Form.Label>Skills<span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter your skills"
                      name="skills"
                      value={formData.skills}
                      onChange={handleChange}

                    />
                  </Form.Group>
                </Col>
               
                
              </Row>

              <Row className="mb-3">
              <Col xs={12} md={6}>
                
                <Form.Group controlId="location">
                  <Form.Label>Location<span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}

                  />
                </Form.Group>
              </Col>
              <Col xs={12} md={6}>
                  <Form.Group controlId="city">
                    <Form.Label>City<span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      name="city"
                      placeholder="Enter city"
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row className="mb-3">
               
                <Col xs={12} md={6}>
                  <Form.Group controlId="state">
                    <Form.Label>State<span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      name="state"
                      placeholder="Enter state"
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
                <Col xs={12} md={6}>
                  <Form.Group controlId="alternateContactNo">
                    <Form.Label>Alternate Contact No</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter alternate contact number"
                      name="alternateContactNo"
                      value={formData.alternateContactNo}
                      onChange={handleChange}

                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row className="mb-3">
                





                <Col xs={12} md={6}>
                  <Form.Group controlId="uanNumber">
                    <Form.Label>UAN Number</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter UAN number"
                      name="uanNumber"
                      value={formData.uanNumber}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
                <Col xs={12} md={6}>
                  <Form.Group controlId="panCardNumber">
                    <Form.Label>PAN Card Number</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter PAN card number"
                      name="panCardNumber"
                      value={formData.panCardNumber}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
              </Row>

              {/* File Uploads */}
              <Row className="mb-3">
              
                <Col xs={12} md={6}>
                  <Form.Group controlId="aadhaarCardNumber">
                    <Form.Label>Aadhaar Card Number</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter Aadhaar card number"
                      name="aadhaarCardNumber"
                      value={formData.aadhaarCardNumber}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
                <Col xs={12} md={6} >
                  <Form.Group controlId="resume">
                    <Form.Label>Resume<span className="text-danger">*</span></Form.Label>
                    {formData.resume && <Form.Text>{formData.resume.name}</Form.Text>}
                    <Form.Control
                      type="file"
                      name="resume"
                      onChange={handleChange}

                      accept=".pdf, .doc, .docx"




                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row className="mb-3">
                
                <Col xs={12} md={6}>
                  <Form.Group controlId="aadhaarCard">
                    <Form.Label>Aadhaar Card<span className="text-danger">*</span></Form.Label>
                    {formData.aadhaarCard && <Form.Text>{formData.aadhaarCard.name}</Form.Text>}
                    <Form.Control
                      type="file"
                      name="aadhaarCard"
                      onChange={handleChange}
                      accept=".pdf, .doc, .docx"
                    />
                  </Form.Group>
                </Col>
                <Col xs={12} md={6}>
                  <Form.Group controlId="panCard">
                    <Form.Label>PAN Card<span className="text-danger">*</span></Form.Label>
                    {formData.panCard && <Form.Text>{formData.panCard.name}</Form.Text>}
                    <Form.Control
                      type="file"
                      name="panCard"
                      onChange={handleChange}
                      accept=".pdf, .doc, .docx"

                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row className="mb-3">
                
                <Col xs={12} md={6}>
                  <Form.Group controlId="image">
                    <Form.Label>Profile Image<span className="text-danger">*</span></Form.Label>
                    {formData.image && <Form.Text>{formData.image.name}</Form.Text>}
                    <Form.Control
                      type="file"
                      name="image"
                      onChange={handleChange}
                      accept="image/*"

                    />
                  </Form.Group>
                </Col>
                <Col xs={12} md={6}>
                  <Form.Group controlId="ctc">
                    <Form.Label>CTC<span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="number"
                      name="ctc"
                      placeholder="Enter your current CTC"
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
              </Row>


              <Row className="mb-3">
              
                <Col xs={12} md={6}>
                  <Form.Group controlId="expectedCtc">
                    <Form.Label>Expected CTC<span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="number"
                      name="expectedCtc"
                      placeholder="Enter your expected CTC"
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
                <Col xs={12} md={6}>
                  <Form.Group controlId="currentOrganization">
                    <Form.Label>Current Organization<span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      name="currentOrganization"
                      placeholder="Enter current organization"
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row className="mb-3">
              
                <Col xs={12} md={6}>
                  <Form.Group controlId="currentIndustryType">
                    <Form.Label>Current Industry Type<span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      name="currentIndustryType"
                      placeholder="Enter current industry type"
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
                <Col xs={12} md={6}>
                  <Form.Group controlId="drivingLicense">
                    <Form.Label>Driving License<span className="text-danger">*</span></Form.Label>
                    {formData.drivingLicense && <Form.Text>{formData.drivingLicense.name}</Form.Text>}
                    <Form.Control
                      type="file"
                      name="drivingLicense"
                      onChange={handleChange}
                      accept=".pdf, .doc, .docx"

                    />
                  </Form.Group>
                </Col>
              </Row>
             


              <Row className="mb-3">
              

                <Col xs={12} md={6}>
                  <Form.Group controlId="departmentSelect">
                    <Form.Label>
                      Department<span className="text-danger">*</span>
                    </Form.Label>
                    <div className="input-group">
                      <select
                        className="form-select"
                        id="department"
                        value={selectedDepartment}
                        onChange={(e) => {
                          setSelectedDepartment(e.target.value);
                        
                        }}
                        
                      >
                        <option value="">Select Department</option>
                        {departments.map((dept, index) => (
                          <option key={index} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </div>
                  </Form.Group>
                </Col>
              </Row>
              <div className="row">
  <div className="col-md-12 d-flex justify-content-center">
    <Button
      variant="primary"
      type="submit"
      className="btn"
      disabled={loading}
    >
      {loading ? "Submitting..." : "Submit"}
    </Button>
  </div>
</div>

            </Form>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
};

export default PersonalDetailsForm;
