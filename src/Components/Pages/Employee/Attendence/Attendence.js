import React, { useState, useEffect } from 'react';
import EmployeeSidebar from '../../../Shared/EmployeeSidebar/EmployeeSidebar';
import { useAuth } from "../../../Context/AuthContext";
import { db } from '../../../firebase/firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import axios from 'axios';
// import 'bootstrap/dist/css/bootstrap.min.css';
import './Attendence.css';

const Attendence = () => {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  
  // Attendance States
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkedOut, setCheckedOut] = useState(false);
  const [checkInTime, setCheckInTime] = useState(null);
  const [checkOutTime, setCheckOutTime] = useState(null);
  const [durationMillis, setDurationMillis] = useState(null);
  const [durationFormatted, setDurationFormatted] = useState("N/A");
  const [status, setStatus] = useState("N/A");
  
  // Location States
  const [address, setAddress] = useState(null);
  const [error, setError] = useState(null);
  const [checkInLocation, setCheckInLocation] = useState(null);
  const [checkOutLocation, setCheckOutLocation] = useState(null);
  
  // Geolocation States
  const [coords, setCoords] = useState({ lat: null, lng: null });
  const [isSubmittingCheckIn, setIsSubmittingCheckIn] = useState(false);
  const [isSubmittingCheckOut, setIsSubmittingCheckOut] = useState(false);
  
  // Assigned Location
  const [assignedLocation, setAssignedLocation] = useState({ lat: null, lng: null });
  
  // Loading States
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(true);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  
  // Format Date as DD-MM-YYYY
  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const today = formatDate(new Date());

  // Fetch Attendance Status
  useEffect(() => {
    const checkAttendanceStatus = async () => {
      try {
        const attendanceRef = doc(db, 'attendance', user.employeeUid);
        const attendanceSnap = await getDoc(attendanceRef);

        if (attendanceSnap.exists()) {
          const attendanceData = attendanceSnap.data();
          const attendanceForToday = attendanceData[today];

          if (attendanceForToday) {
            if (attendanceForToday.checkIn) {
              setCheckedIn(true);
              setCheckInTime(attendanceForToday.checkIn.toDate());
              setCheckInLocation(attendanceForToday.checkInLocation);
            }
            if (attendanceForToday.checkOut) {
              setCheckedOut(true);
              setCheckOutTime(attendanceForToday.checkOut.toDate());
              setCheckOutLocation(attendanceForToday.checkOutLocation);
              setDurationMillis(attendanceForToday.duration);
            }
            if (attendanceForToday.statuses) {
              setStatus(attendanceForToday.statuses);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching attendance data:", error);
        setError("Failed to fetch attendance data.");
      } finally {
        setIsLoadingAttendance(false);
      }
    };

    checkAttendanceStatus();
  }, [today, user.employeeUid]);


  // Request Current Location
  useEffect(() => {
    const requestLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            // Update state with the fetched coordinates
            setCoords({ lat, lng });

            // Fetch the address based on the coordinates
            fetchAddress(lat, lng);
          },
          (error) => {
            // Handle different geolocation errors
            switch(error.code) {
              case error.PERMISSION_DENIED:
                setError("User denied the request for Geolocation.");
                break;
              case error.POSITION_UNAVAILABLE:
                setError("Location information is unavailable.");
                break;
              case error.TIMEOUT:
                setError("The request to get user location timed out.");
                break;
              case error.UNKNOWN_ERROR:
                setError("An unknown error occurred.");
                break;
              default:
                setError("An unexpected error occurred.");
            }
            console.error("Error fetching geolocation:", error.message);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000, // Timeout after 10 seconds
            maximumAge: 0,  // Disable cache, always request fresh location
          }
        );
      } else {
        setError("Geolocation is not supported by this browser.");
      }
    };

    requestLocation();
  }, []);

  // Fetch Address from Coordinates
  const fetchAddress = async (lat, lng) => {
    try {
      const apiKey = 'AIzaSyAZAU88Lr8CEkiFP_vXpkbnu1-g-PRigXU'; // Replace with your actual API key
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
      );

      if (response.data.results && response.data.results.length > 0) {
        setAddress(response.data.results[0].formatted_address);
        console.log('Address fetched successfully:', response.data.results[0].formatted_address);
      } else {
        setError("Unable to fetch address.");
        console.error("No address found for given coordinates");
      }
    } catch (err) {
      setError("Failed to fetch address. Please check the API key and network connection.");
      console.error("Error fetching address:", err);
    }
  };

 
  
  // Handle Check-In
  const handleCheckIn = async () => {
    const now = new Date();
    const dateKey = formatDate(now);

    try {
     

      // Write the check-in data to Firestore
      await setDoc(doc(db, 'attendance', user.employeeUid), {
        [dateKey]: {
          checkIn: now,
          checkInLocation: address,
          employeeName: user.fullName,
          employeeUid: user.employeeUid,
          timestamp: now, // Optional: for additional tracking
        }
      }, { merge: true });

      // Update the local state if successful
      setCheckedIn(true);
      setCheckInLocation(address);
      setCheckInTime(now);
      setStatus("Present");

      alert("Check-in successful");
    } catch (error) {
      console.error("Error checking in:", error);
      alert("Check-in failed. Please try again.");
    }
  };

  // Handle Check-Out
  const handleCheckOut = async () => {
    const now = new Date();
    const dateKey = formatDate(now);

    try {
     

      const attendanceRef = doc(db, 'attendance', user.employeeUid);
      const attendanceSnap = await getDoc(attendanceRef);

      if (!attendanceSnap.exists()) {
        setError("Attendance record not found for today.");
        alert("Attendance record not found. Please check in first.");
        return;
      }

      const attendanceData = attendanceSnap.data();
      const todayAttendance = attendanceData[dateKey];

      if (!todayAttendance || !todayAttendance.checkIn) {
        setError("Check-in time not found.");
        alert("Check-in time not found. Please check in first.");
        return;
      }

      const checkInTime = todayAttendance.checkIn.toDate();
      const duration = now - checkInTime; // Duration in milliseconds

      await updateDoc(attendanceRef, {
        [`${dateKey}.checkOut`]: now,
        [`${dateKey}.checkOutLocation`]: address,
        [`${dateKey}.duration`]: duration,
        [`${dateKey}.statuses`]: 'Present',
      });

      setCheckedOut(true);
      setCheckOutTime(now);
      setCheckOutLocation(address);
      setDurationMillis(duration);
      setStatus('Present');

      alert(`Check-out successful. Status: Present`);
    } catch (error) {
      console.error("Error checking out:", error);
      alert("Check-out failed. Please try again.");
    }
  };

  // Format Duration
  useEffect(() => {
    if (durationMillis !== null && !isNaN(durationMillis)) {
      const durationDate = new Date(durationMillis);
      const durationHours = Math.floor(durationMillis / 3600000);
      const durationMinutes = Math.floor((durationMillis % 3600000) / 60000);
      const durationSeconds = Math.floor((durationMillis % 60000) / 1000);
      setDurationFormatted(`${durationHours}h ${durationMinutes}m ${durationSeconds}s`);
    }
  }, [durationMillis]);

  // Click Handlers with Loading States
  const handleCheckInClick = async () => {
    setIsSubmittingCheckIn(true);
    await handleCheckIn();
    setIsSubmittingCheckIn(false);
  };

  const handleCheckOutClick = async () => {
    setIsSubmittingCheckOut(true);
    await handleCheckOut();
    setIsSubmittingCheckOut(false);
  };



  

  return (
    <div className='employee-attendenceContainer1'>
      <EmployeeSidebar onToggleSidebar={setCollapsed} />
      <div className={`employee-attendence1 ${collapsed ? 'collapsed' : ''}`}>
        <h1 className='mt-4 text-center'>My Attendance</h1>
        <div className='attendance-card mt-3'>
          <h5>Welcome, <span style={{fontWeight:"bold",color:"cadetblue"}}>{user.fullName}</span></h5>

          <div className="calendar-input mt-2">
            <p><strong>Date:</strong> {today}</p>
          </div>

          {isLoadingAttendance ? (
            <p>Loading attendance data...</p>
          ) : (
            <>
              <div className="attendance-info">
                <p><strong>Check-In:</strong> {checkInTime ? checkInTime.toLocaleTimeString() : "Not checked in"}</p>
                <p><strong>Check-In Location:</strong> {checkInLocation ? checkInLocation : "N/A"}</p>
              </div>

              <div className="attendance-info">
                <p><strong>Check-Out:</strong> {checkOutTime ? checkOutTime.toLocaleTimeString() : "Not checked out"}</p>
                <p><strong>Check-Out Location:</strong> {checkOutLocation ? checkOutLocation : "N/A"}</p>
              </div>

              <div className="attendance-info">
                <p><strong>Duration:</strong> {durationFormatted}</p>
                <p><strong>Status:</strong> {status}</p>
              </div>
            </>
          )}

          <div className="button-container">
            <button
              className='checkedIn-btn'
              onClick={handleCheckInClick}
              disabled={checkedIn || isSubmittingCheckIn }
            >
              {isSubmittingCheckIn ? 'Checking In...' : 'Check In'}
            </button>

            <button
              className='checkedOut-btn'
              onClick={handleCheckOutClick}
              disabled={!checkedIn || checkedOut || isSubmittingCheckOut }
            >
              {isSubmittingCheckOut ? 'Checking Out...' : 'Check Out'}
            </button>
          </div>

         
        </div>
      </div>
    </div>
  );
};

export default Attendence;
