import React, { useState } from "react";
import { Modal, Button, Spinner } from "react-bootstrap";
import { doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "./../../../firebase/firebase"; // Adjust path as needed

const EditEmployeeModal = ({
  show,
  onHide,
  editEmployeeData,
  setEditEmployeeData,
  setEmployees,  // Destructure setEmployees from props
  setShowEditModal  // Destructure setShowEditModal from props
}) => {
  const [loading, setLoading] = useState(false); // Loading state

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    setEditEmployeeData(prevData => ({
      ...prevData,
      [`${field}File`]: file // Store the file object temporarily
    }));
  };

  const uploadFileAndGetURL = async (file, folder) => {
    if (!file) return null;
    const storageRef = ref(storage, `${folder}/${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const handleSaveChanges = async () => {
    setLoading(true); // Start loader
    try {
      const employeeDocRef = doc(db, "employees", editEmployeeData.id);

      // Prepare a copy of editEmployeeData to update
      const updatedData = { ...editEmployeeData };

      // Handle file uploads and update URLs (if necessary)
      const fileFields = ["resume", "aadhaarCard", "panCard", "image", "drivingLicense"];
      for (let field of fileFields) {
        const file = editEmployeeData[`${field}File`];
        if (file) {
          const downloadURL = await uploadFileAndGetURL(file, field);
          updatedData[field] = downloadURL;
          delete updatedData[`${field}File`]; // Remove file object from updatedData
        }
      }

      // Update Firestore with new data
      await updateDoc(employeeDocRef, updatedData);

      // Update the state to reflect the changes in the table
      setEmployees(prevEmployees =>
        prevEmployees.map(employee =>
          employee.id === editEmployeeData.id ? { ...employee, ...updatedData } : employee
        )
      );

      alert("Employee data updated successfully.");
      setShowEditModal(false); // Close modal after saving
    } catch (error) {
      console.error("Error updating employee:", error);
      alert("Failed to update employee data.");
    } finally {
      setLoading(false); // Stop loader
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Edit Employee</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {editEmployeeData && (
          <form>
            {/* Name and Father's Name */}
            <div className="row mb-3">
              <div className="col-md-6">
                <label>Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={editEmployeeData.name}
                  onChange={(e) =>
                    setEditEmployeeData({
                      ...editEmployeeData,
                      name: e.target.value,
                    })
                  }
                />
              </div>
              {/* <div className="col-md-6">
                    <label>Father's Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editEmployeeData.fathername}
                      onChange={(e) =>
                        setEditEmployeeData({
                          ...editEmployeeData,
                          fathername: e.target.value,
                        })
                      }
                    />
                  </div> */}
              <div className="col-md-6">
                <label>Date of Birth</label>
                <input
                  type="date"
                  className="form-control"
                  value={editEmployeeData.dob}
                  onChange={(e) =>
                    setEditEmployeeData({
                      ...editEmployeeData,
                      dob: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            {/* Date of Birth and Contact No */}
            <div className="row mb-3">

              <div className="col-md-6 col-sm-12">
                <label>Aadhaar Card Number</label>
                <input
                  type="text"
                  className="form-control"
                  value={editEmployeeData.aadhaarCardNumber || ''} // ensure value is not undefined
                  onChange={(e) =>
                    setEditEmployeeData({
                      ...editEmployeeData,
                      aadhaarCardNumber: e.target.value,
                    })
                  }
                />
              </div>

              <div className="col-md-6 col-sm-12">
                <label>Pan Card Number</label>
                <input
                  type="text"
                  className="form-control"
                  value={editEmployeeData.panCardNumber || ''} // ensure value is not undefined
                  onChange={(e) =>
                    setEditEmployeeData({
                      ...editEmployeeData,
                      panCardNumber: e.target.value,
                    })
                  }
                />
              </div>


              <div className="col-md-6">
                <label>Contact No</label>
                <input
                  type="text"
                  className="form-control"
                  value={editEmployeeData.contactNo}
                  onChange={(e) =>
                    setEditEmployeeData({
                      ...editEmployeeData,
                      contactNo: e.target.value,
                    })
                  }
                />
              </div>
              <div className="col-md-6 col-sm-12">
                <label>Alternate Contact No</label>
                <input
                  type="text"
                  className="form-control"
                  value={editEmployeeData.alternateContactNo || ''} // ensure value is not undefined
                  onChange={(e) =>
                    setEditEmployeeData({
                      ...editEmployeeData,
                      alternateContactNo: e.target.value,
                    })
                  }
                />
              </div>

            </div>

            {/* Email and Gender */}
            <div className="row mb-3">
              <div className="col-md-6">
                <label>Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={editEmployeeData.email}
                  onChange={(e) =>
                    setEditEmployeeData({
                      ...editEmployeeData,
                      email: e.target.value,
                    })
                  }
                />
              </div>
              <div className="col-md-6">
                <label>Gender</label>
                <select
                  className="form-control"
                  value={editEmployeeData.gender}
                  onChange={(e) =>
                    setEditEmployeeData({
                      ...editEmployeeData,
                      gender: e.target.value,
                    })
                  }
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Education Qualification and Location */}
            <div className="row mb-3">
              <div className="col-md-6">
                <label>Education Qualification:</label>
                <input
                  type="text"
                  className="form-control"
                  value={editEmployeeData.educationQualification}
                  onChange={(e) =>
                    setEditEmployeeData({
                      ...editEmployeeData,
                      educationQualification: e.target.value,
                    })
                  }
                />
              </div>

              <div className="col-md-6">
                <label>Location</label>
                <input
                  type="text"
                  className="form-control"
                  value={editEmployeeData.location}
                  onChange={(e) =>
                    setEditEmployeeData({
                      ...editEmployeeData,
                      location: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            {/* Skills and Resume */}
            <div className="row mb-3">
              <div className="col-md-6">
                <label>Skills</label>
                <input
                  type="text"
                  className="form-control"
                  value={editEmployeeData.skills}
                  onChange={(e) =>
                    setEditEmployeeData({
                      ...editEmployeeData,
                      skills: e.target.value,
                    })
                  }
                />
              </div>
              <div className="col-md-6">
                <label>Resume</label>
                {editEmployeeData.resume && (
                  <p>
                    <strong>Current Resume:</strong>{" "}
                    <a
                      href={editEmployeeData.resume}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View Current Resume
                    </a>
                  </p>
                )}
                <input
                  type="file"
                  className="form-control"
                  onChange={(e) => handleFileChange(e, "resume")}
                />
              </div>
            </div>

            {/* Aadhaar Card and PAN Card */}
            <div className="row mb-3">
              <div className="col-md-6">
                <label>Aadhaar Card</label>
                {editEmployeeData.aadhaarCard && (
                  <p>
                    <strong>Current Aadhaar Card:</strong>{" "}
                    <a
                      href={editEmployeeData.aadhaarCard}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View Current Aadhaar Card
                    </a>
                  </p>
                )}
                <input
                  type="file"
                  className="form-control"
                  onChange={(e) => handleFileChange(e, "aadhaarCard")}
                />
              </div>
              <div className="col-md-6">
                <label>PAN Card</label>
                {editEmployeeData.panCard && (
                  <p>
                    <strong>Current PAN Card:</strong>{" "}
                    <a
                      href={editEmployeeData.panCard}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View Current PAN Card
                    </a>
                  </p>
                )}
                <input
                  type="file"
                  className="form-control"
                  onChange={(e) => handleFileChange(e, "panCard")}
                />
              </div>
            </div>

            {/* Profile Image and Driving License */}
            <div className="row mb-3">
              <div className="col-md-6">
                <label>Profile Image</label>
                {editEmployeeData.image && (
                  <p>
                    <strong>Current Profile Image:</strong>
                    <br />
                    <img
                      src={editEmployeeData.image}
                      alt="Profile"
                      style={{
                        width: "100px",
                        height: "100px",
                        borderRadius: "50%",
                      }}
                    />
                  </p>
                )}
                <input
                  type="file"
                  className="form-control"
                  onChange={(e) => handleFileChange(e, "image")}
                />
              </div>
              <div className="col-md-6">
                <label>Driving License</label>
                {editEmployeeData.drivingLicense && (
                  <p>
                    <strong>Current Driving License:</strong>{" "}
                    <a
                      href={editEmployeeData.drivingLicense}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View Current Driving License
                    </a>
                  </p>
                )}
                <input
                  type="file"
                  className="form-control"
                  onChange={(e) => handleFileChange(e, "drivingLicense")}
                />
              </div>
            </div>

            {/* UAN Number */}
            <div className="row mb-3">
              <div className="col-md-6">
                <label>UAN Number</label>
                <input
                  type="text"
                  className="form-control"
                  value={editEmployeeData.uanNumber}
                  onChange={(e) =>
                    setEditEmployeeData({
                      ...editEmployeeData,
                      uanNumber: e.target.value,
                    })
                  }
                />
              </div>
              <div className="col-md-6">
                <label>Experience</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Enter experience in years"
                  value={editEmployeeData.experience}
                  onChange={(e) => setEditEmployeeData({ ...editEmployeeData, experience: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label>City</label>
                <input
                  type="text"
                  className="form-control"
                  value={editEmployeeData.city}
                  onChange={(e) =>
                    setEditEmployeeData({
                      ...editEmployeeData,
                      city: e.target.value,
                    })
                  }
                />
              </div>

              <div className="col-md-6">
                <label>State</label>
                <input
                  type="text"
                  className="form-control"
                  value={editEmployeeData.state}
                  onChange={(e) =>
                    setEditEmployeeData({
                      ...editEmployeeData,
                      state: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label>CTC</label>
                <input
                  type="text"
                  className="form-control"
                  value={editEmployeeData.ctc}
                  onChange={(e) =>
                    setEditEmployeeData({
                      ...editEmployeeData,
                      ctc: e.target.value,
                    })
                  }
                />
              </div>

              <div className="col-md-6">
                <label>Expected CTC</label>
                <input
                  type="text"
                  className="form-control"
                  value={editEmployeeData.expectedCtc}
                  onChange={(e) =>
                    setEditEmployeeData({
                      ...editEmployeeData,
                      expectedCtc: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label>Current Organization
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={editEmployeeData.currentOrganization}
                  onChange={(e) =>
                    setEditEmployeeData({
                      ...editEmployeeData,
                      currentOrganization: e.target.value,
                    })
                  }
                />
              </div>

              <div className="col-md-6">
                <label>Current Industry Type</label>
                <input
                  type="text"
                  className="form-control"
                  value={editEmployeeData.currentIndustryType}
                  onChange={(e) =>
                    setEditEmployeeData({
                      ...editEmployeeData,
                      currentIndustryType: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="col-md-6">
                <label>Department</label>
                <input
                  type="text"
                  className="form-control"
                  value={editEmployeeData.department}
                  onChange={(e) =>
                    setEditEmployeeData({
                      ...editEmployeeData,
                      department: e.target.value,
                    })
                  }
                />
              </div>
          </form>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Cancel</Button>
        <Button variant="primary" onClick={handleSaveChanges} disabled={loading}>
          {loading ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
              /> Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EditEmployeeModal;
