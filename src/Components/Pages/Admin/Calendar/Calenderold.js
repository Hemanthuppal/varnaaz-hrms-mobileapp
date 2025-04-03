import React, { useState, useEffect } from 'react';
import { getFirestore, addDoc, collection, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import AdminDashboard from '../../../Shared/AdminSidebar/AdminSidebar'
import { Modal, Button } from 'react-bootstrap';
import './Calendar.css';
import { db } from '../../../firebase/firebase'; 
import { FaEdit, FaTrashAlt } from 'react-icons/fa';

function AddHoliday() {
  const [holidays, setHolidays] = useState([]);
  const [date, setDate] = useState('');
  const [day, setDay] = useState('');
  const [festival, setFestival] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editHolidayId, setEditHolidayId] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const holidaysPerPage = 10;

  // Fetch holidays on component load
  useEffect(() => {
    const fetchHolidays = async () => {
      const querySnapshot = await getDocs(collection(db, 'holidays'));
      const holidaysData = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setHolidays(holidaysData);
    };

    fetchHolidays();
  }, []);

  // Function to format date as DD-MM-YYYY
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date || !day || !festival) {
      console.error('All fields are required');
      return;
    }

    setIsAdding(true);

    const formattedDate = formatDate(date); // Format the date before saving
    const data = { date: formattedDate, day, festival };

    try {
      if (isEditMode) {
        // Update existing holiday
        const docRef = doc(db, 'holidays', editHolidayId);
        await updateDoc(docRef, data);
        alert('Holiday updated successfully!');
      } else {
        // Add new holiday
        await addDoc(collection(db, 'holidays'), data);
        alert('Holiday added successfully!');
      }

      // Clear form fields
      setDate('');
      setDay('');
      setFestival('');
      setIsEditMode(false);
      setEditHolidayId(null);
      setShowModal(false);

      // Refresh holiday list
      const querySnapshot = await getDocs(collection(db, 'holidays'));
      setHolidays(querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    } catch (error) {
      console.error('Error adding/updating holiday:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleEdit = (holiday) => {
    setDate(holiday.date.split('-').reverse().join('-')); // Convert DD-MM-YYYY to YYYY-MM-DD for input field
    setDay(holiday.day);
    setFestival(holiday.festival);
    setIsEditMode(true);
    setEditHolidayId(holiday.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'holidays', id));
      alert('Holiday deleted successfully!');
      setHolidays(holidays.filter(holiday => holiday.id !== id));
    } catch (error) {
      console.error('Error deleting holiday:', error);
    }
  };

  const handleDateChange = (e) => {
    const selectedDate = e.target.value;
    setDate(selectedDate);

    const selectedDay = new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' });
    setDay(selectedDay);
  };

  const handleFestivalChange = (e) => {
    const input = e.target.value;
    const filteredInput = input.replace(/[^a-zA-Z\s]/g, '');
    setFestival(filteredInput);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setIsEditMode(false);
    setDate('');
    setDay('');
    setFestival('');
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to the first page after searching
  };

  // Pagination logic
  const indexOfLastHoliday = currentPage * holidaysPerPage;
  const indexOfFirstHoliday = indexOfLastHoliday - holidaysPerPage;
  const filteredHolidays = holidays.filter(holiday =>
    holiday.festival.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const currentHolidays = filteredHolidays.slice(indexOfFirstHoliday, indexOfLastHoliday);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const pageNumbers = [];
  for (let i = 1; i <= Math.ceil(filteredHolidays.length / holidaysPerPage); i++) {
    pageNumbers.push(i);
  }

  return (
    <div className='admin-calendar-container'>
      <AdminDashboard onToggleSidebar={setCollapsed} />
      <div className={`admin-calendar-content ${collapsed ? 'collapsed' : ''}`}>
        <div className="row">
          <div className="col-12">
            <div className="col text-end mt-3 mb-3">
              <input
                type="text"
                placeholder="Search Festival"
                value={searchTerm}
                onChange={handleSearchChange}
                className="form-control w-25"
              />
              <Button variant="primary" onClick={() => setShowModal(true)}>Add Holiday</Button>
            </div>
            <table className="table table-striped mt-4">
              <thead>
                <tr className="">
                  <th>Date</th>
                  <th>Day</th>
                  <th>Festival</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentHolidays.map((holiday) => (
                  <tr key={holiday.id}>
                    <td>{holiday.date}</td> {/* Display date in DD-MM-YYYY format */}
                    <td>{holiday.day}</td>
                    <td>{holiday.festival}</td>
                    <td>
                      <Button variant="info" size="sm" onClick={() => handleEdit(holiday)}>
                        <FaEdit /> {/* Edit icon */}
                      </Button>{' '}
                      <Button variant="danger" size="sm" onClick={() => handleDelete(holiday.id)}>
                        <FaTrashAlt /> {/* Delete icon */}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Pagination */}
            <nav>
              <ul className="pagination">
                {pageNumbers.map(number => (
                  <li key={number} className="page-item">
                    <Button
                      className="page-link"
                      onClick={() => paginate(number)}
                      active={number === currentPage}
                    >
                      {number}
                    </Button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>

        {/* Modal for Add/Edit */}
        <Modal show={showModal} onHide={handleModalClose}>
          <Modal.Header closeButton>
            <Modal.Title>{isEditMode ? 'Edit Holiday' : 'Add Holiday'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="date">Date:</label>
                <input
                  className="form-control"
                  id="date"
                  type="date"
                  value={date}
                  onChange={handleDateChange}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div className="form-group mt-2">
                <label htmlFor="day">Day:</label>
                <input
                  className="form-control"
                  id="day"
                  type="text"
                  value={day}
                  readOnly
                  required
                />
              </div>

              <div className="form-group mt-2">
                <label htmlFor="festival">Festival:</label>
                <input
                  className="form-control"
                  id="festival"
                  type="text"
                  value={festival}
                  onInput={handleFestivalChange}
                  required
                />
              </div>

              <Button variant="primary" type="submit" className="mt-3" disabled={isAdding}>
                {isAdding ? 'Saving...' : 'Save'}
              </Button>
            </form>
          </Modal.Body>
        </Modal>
      </div>
    </div>
  );
}

export default AddHoliday;
