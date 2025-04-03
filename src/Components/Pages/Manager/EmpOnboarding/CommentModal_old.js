import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

const CommentModal = ({ show, onHide, employee, onSaveComment }) => {
    const isCommentSaved = Boolean(employee.comment); // Check if a comment is already saved
    const [comment, setComment] = useState(employee.comment || ''); // Local state for the comment

    const handleSave = () => {
        if (comment.trim() !== '') { // Ensure the comment is not empty
            onSaveComment(employee.id, comment);
            onHide();
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title>{isCommentSaved ? "View Comment" : "Add Comment"}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {isCommentSaved && !comment.trim() ? (
                    // View-only format for saved comments
                    <p>{employee.comment}</p>
                ) : (
                    // Input field format for adding a new comment
                    <Form>
                        <Form.Group controlId="commentTextarea">
                            <Form.Label>Reason for Selection/Rejection</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Enter your reason here"
                            />
                        </Form.Group>
                    </Form>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    Close
                </Button>
                {!isCommentSaved && (
                    <Button variant="primary" onClick={handleSave}>
                        Save
                    </Button>
                )}
            </Modal.Footer>
        </Modal>
    );
};

export default CommentModal;
