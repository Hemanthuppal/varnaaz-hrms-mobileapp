import React from "react";
import { Modal, Button } from "react-bootstrap";

const SkillsModal = ({ show, onHide, skill }) => {
  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Skills</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>{skill}</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SkillsModal;
