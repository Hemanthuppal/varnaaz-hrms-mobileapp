import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase/firebase'; 
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import EmployeeSidebar from './../../../Shared/EmployeeSidebar/EmployeeSidebar';
import { Modal, Button } from 'react-bootstrap'; 
import "./EmployeeCalendar.css";

function formatDate(dateString) {
  // Split the date string by '-' and map to create a new date string in the format 'YYYY-MM-DD'
  const [day, month, year] = dateString.split('-');
  return `${year}-${month}-${day}`; // Convert to 'YYYY-MM-DD'
}

function EmployeeCalendar() { 
  const [holidays, setHolidays] = useState([]);
  const [showModal, setShowModal] = useState(false); 
  const [selectedEvent, setSelectedEvent] = useState(null); 
  const localizer = momentLocalizer(moment);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const fetchHolidays = async () => {
      const holidaysCollection = collection(db, 'holidays');
      const holidaysSnapshot = await getDocs(holidaysCollection);
      const holidayList = holidaysSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      // Transform holidays data into events format required by react-big-calendar
      const events = holidayList.map((holiday) => ({
        id: holiday.id,
        title: holiday.festival,
        start: new Date(formatDate(holiday.date)), // Convert date format
        end: new Date(formatDate(holiday.date)),   // Convert date format
      }));

      setHolidays(events);
    };

    fetchHolidays();
  }, []);

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setShowModal(true); // Open the modal when an event is clicked
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedEvent(null); // Clear the selected event when modal closes
  };

  return (
    <div className="calendar-container">
      <EmployeeSidebar onToggleSidebar={setCollapsed} />
      <div className={`calendar-content ${collapsed ? "collapsed" : ""}`}>
        <h2 className='text-center'>Holidays</h2>
        <Calendar
          localizer={localizer}
          events={holidays}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 500 }}
          onSelectEvent={handleSelectEvent} // Attach event handler for event click
        />
      </div>

      {/* Modal to display event details */}
      {selectedEvent && (
        <Modal 
          className='d-flex justify-content-center align-items-center'
          dialogClassName="modal-dialog-centered custom-modal-width"
          show={showModal} 
          onHide={handleCloseModal}
        >
          <Modal.Header closeButton>
            <Modal.Title>Holiday Details</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p><strong>Festival:</strong> {selectedEvent.title}</p>
            <p><strong>Date:</strong> {new Date(selectedEvent.start).toLocaleDateString('en-IN')}</p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
}

export default EmployeeCalendar;
