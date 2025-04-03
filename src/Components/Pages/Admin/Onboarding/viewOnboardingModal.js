import React from "react";
import { Modal, Button } from "react-bootstrap";

const EmployeeDetailsModal = ({ show, onHide, selectedEmployee }) => {
  return (
    <Modal show={show} onHide={onHide} size="lg">
    <Modal.Header closeButton>
      <Modal.Title>View Employee</Modal.Title>
    </Modal.Header>
    <Modal.Body>
       
{selectedEmployee && (
              <div className="container">
                <div className="row">
                  <div className="col-md-6 col-sm-12">
                    <p>
                      <strong>Name:</strong> {selectedEmployee.name}
                    </p>
                  </div>
                  {/* <div className="col-md-6 col-sm-12">
                    <p>
                      <strong>Father's Name:</strong> {selectedEmployee.fathername}
                    </p>
                  </div> */}
                </div>

                <div className="row">
                  <div className="col-md-6 col-sm-12">
                    <p>
                      <strong>Date of Birth:</strong> {selectedEmployee.dob}
                    </p>
                  </div>
                  <div className="col-md-6 col-sm-12">
                    <p>
                      <strong>Gender:</strong> {selectedEmployee.gender}
                    </p>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 col-sm-12">
                    <p>
                      <strong>Contact No:</strong> {selectedEmployee.contactNo}
                    </p>
                  </div>
                  <div className="col-md-6 col-sm-12">
                    <p>
                      <strong>Alternate Contact No:</strong> {selectedEmployee.alternateContactNo}
                    </p>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 col-sm-12">
                    <p>
                      <strong>Email:</strong> {selectedEmployee.email}
                    </p>
                  </div>
                  <div className="col-md-6 col-sm-12">
                    <p>
                      <strong>Location:</strong> {selectedEmployee.location}
                    </p>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 col-sm-12">
                    <p>
                      <strong>Education Qualification:</strong>{" "}
                      {selectedEmployee.educationQualification}
                    </p>
                  </div>
                  <div className="col-md-6 col-sm-12">
                    <p>
                      <strong>Experience:</strong> {selectedEmployee.experience}
                    </p>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 col-sm-12">
                    <p>
                      <strong>UAN Number:</strong> {selectedEmployee.uanNumber}
                    </p>
                  </div>
                  <div className="col-md-6 col-sm-12">
                    <p>
                      <strong>Skills:</strong> {selectedEmployee.skills}
                    </p>
                  </div>
                </div>

                {selectedEmployee.resume && (
                  <div className="row">
                    <div className="col-md-6 col-sm-12">
                      <p>
                        <strong>Resume:</strong>{" "}
                        <a
                          href={selectedEmployee.resume}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View Resume
                        </a>
                      </p>
                    </div>
                    <div className="col-md-6 col-sm-12">
                    <p>
                      <strong>City:</strong> {selectedEmployee.city}
                    </p>
                    </div>
                  </div>
                )}

                {/* Aadhaar Card */}
                {selectedEmployee.aadhaarCard && (
                  <div className="row">
                    <div className="col-md-6 col-sm-12">
                      <p>
                        <strong>Aadhaar Card:</strong>{" "}
                        <a
                          href={selectedEmployee.aadhaarCard}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View Aadhaar Card
                        </a>
                      </p>
                    </div>
                  </div>
                )}

                {/* PAN Card */}
                {selectedEmployee.panCard && (
                  <div className="row">
                    <div className="col-md-6 col-sm-12">
                      <p>
                        <strong>PAN Card:</strong>{" "}
                        <a
                          href={selectedEmployee.panCard}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View PAN Card
                        </a>
                      </p>
                    </div>
                  </div>
                )}

                {/* Profile Image */}
                {selectedEmployee.image && (
                  <div className="row">
                    <div className="col-md-6 col-sm-12">
                      <p>
                        <strong>Profile Image:</strong>
                      </p>
                      <img
                        src={selectedEmployee.image}
                        alt="Profile"
                        style={{
                          width: "100px",
                          height: "100px",
                          borderRadius: "50%",
                        }}
                      />
                    </div>
                    <div className="col-md-6 col-sm-12">
                    <p>
                      <strong>State:</strong> {selectedEmployee.state}
                    </p>
                    </div>
                  </div>
                )}

<div className="row">
                <div className="col-md-6 col-sm-12">
                  <p>
                    <strong>Aadhaar Card Number:</strong> {selectedEmployee.aadhaarCardNumber}
                  </p>
                </div>
                <div className="col-md-6 col-sm-12">
                  <p>
                    <strong>Pan Card Number:</strong> {selectedEmployee.panCardNumber}
                  </p>
                </div>
                </div>
                
                <div className="row">
                <div className="col-md-6 col-sm-12">
                    <p>
                      <strong>CTC:</strong> {selectedEmployee.ctc}
                    </p>
                    </div>

                    <div className="col-md-6 col-sm-12">
                    <p>
                      <strong>Expected CTC:</strong> {selectedEmployee.expectedCtc}
                    </p>
                    </div>

                    </div>

                    <div className="row">
                <div className="col-md-6 col-sm-12">
                    <p>
                      <strong>Current Organization:</strong> {selectedEmployee.currentOrganization}
                    </p>
                    </div>

                    <div className="col-md-6 col-sm-12">
                    <p>
                      <strong>Current Industry Type:
                      </strong> {selectedEmployee.currentIndustryType}
                    </p>
                    </div>

                    </div>
               
                    <div className="row">
                {/* <div className="col-md-6 col-sm-12">
                    <p>
                      <strong>driving license
                      :</strong> {selectedEmployee.drivingLicense}
                    </p>
                    </div> */}

                    <div className="col-md-6 col-sm-12">
                    <p>
                      <strong>Department:
                      </strong> {selectedEmployee.department
                      }
                    </p>
                    </div>

                    </div>

                    {/* <div className="col-md-6 col-sm-12">
                    <p>
                      <strong>Adhaar card:
                      </strong> {selectedEmployee.aadhaarCard
                      }
                    </p>
                    </div> */}
                {/* Driving License */}
                {selectedEmployee.drivingLicense && (
                  <div className="row">
                    <div className="col-md-6 col-sm-12">
                      <p>
                        <strong>Driving License:</strong>{" "}
                        <a
                          href={selectedEmployee.drivingLicense}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View Driving License
                        </a>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EmployeeDetailsModal;
