import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { doc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
import { db } from "./../../../firebase/firebase";

const CommentsModal = ({ show, onHide, employeeId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  // Fetch comments from Firestore
  useEffect(() => {
    const fetchComments = async () => {
      if (employeeId) {
        const employeeRef = doc(db, "employees", employeeId);
        const employeeDoc = await getDoc(employeeRef);
        if (employeeDoc.exists()) {
          const data = employeeDoc.data();
          setComments(data.comments || []); // Load existing comments
        }
      }
    };
    fetchComments();
  }, [employeeId]);

  // Add a new comment to Firestore
  const handleSendComment = async () => {
    if (newComment.trim()) {
      try {
        const employeeRef = doc(db, "employees", employeeId);
        const commentData = {
          text: newComment,
          timestamp: new Date().toISOString(),
          sender: "Admin", // Replace with dynamic user role if needed
        };

        await updateDoc(employeeRef, {
          comments: arrayUnion(commentData),
        });

        setComments((prevComments) => [...prevComments, commentData]); // Update local state
        setNewComment(""); // Clear input field
      } catch (error) {
        console.error("Error sending comment:", error);
      }
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Comments</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="comments-section">
          {comments.length > 0 ? (
            <ul className="comments-list">
              {comments.map((comment, index) => (
                <li key={index} className="comment-item">
                  <strong>{comment.sender}</strong>: {comment.text}{" "}
                  <small className="text-muted">({new Date(comment.timestamp).toLocaleString()})</small>
                </li>
              ))}
            </ul>
          ) : (
            <p>No comments yet.</p>
          )}
        </div>
        <Form.Group className="mt-3">
          <Form.Control
            type="text"
            placeholder="Type your comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
        <Button variant="primary" onClick={handleSendComment}>
          Send
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CommentsModal;
