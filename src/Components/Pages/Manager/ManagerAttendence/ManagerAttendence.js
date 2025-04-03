import React, { useState, useEffect } from 'react';
import ManagerDashboard from '../../../Shared/ManagerSidebar/ManagerSidebar';
import { useAuth } from "../../../Context/AuthContext";
import { db } from '../../../firebase/firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import axios from 'axios';
import './ManagerAttendence.css';

const ManagerAttendence = () => {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  // Attendance States
  const [attendance, setAttendance] = useState({
    checkedIn: false,
    checkedOut: false,
    checkInTime: null,
    checkOutTime: null,
    checkInLocation: null,
    checkOutLocation: null,
    duration: null,
    status: "N/A",
  });

  const [coords, setCoords] = useState({ lat: null, lng: null });
  const [address, setAddress] = useState(null);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Format Date as DD-MM-YYYY
  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const today = formatDate(new Date());

  // Fetch Attendance Data
  useEffect(() => {
    const fetchAttendance = async () => {
      setIsLoading(true);
      try {
        const attendanceRef = doc(db, 'attendance', user.employeeUid);
        const attendanceSnap = await getDoc(attendanceRef);

        if (attendanceSnap.exists()) {
          const data = attendanceSnap.data();
          const todayData = data[today];

          if (todayData) {
            setAttendance({
              checkedIn: !!todayData.checkIn,
              checkedOut: !!todayData.checkOut,
              checkInTime: todayData.checkIn?.toDate(),
              checkOutTime: todayData.checkOut?.toDate(),
              checkInLocation: todayData.checkInLocation || "N/A",
              checkOutLocation: todayData.checkOutLocation || "N/A",
              duration: todayData.duration || null,
              status: todayData.status || "N/A",
            });
          }
        }
      } catch (error) {
        setError("Failed to fetch attendance data.");
        console.error("Error fetching attendance:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAttendance();
  }, [today, user.employeeUid]);

  // Request Geolocation
  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        setCoords({ lat, lng });
        await fetchAddress(lat, lng);
      },
      (error) => {
        setError("Failed to get location. Please enable location services.");
        console.error("Geolocation error:", error.message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  // Fetch Address from Coordinates
  const fetchAddress = async (lat, lng) => {
    try {
      const apiKey = 'AIzaSyAZAU88Lr8CEkiFP_vXpkbnu1-g-PRigXU'; // Replace with your actual API key
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
      );

      if (response.data.results.length > 0) {
        setAddress(response.data.results[0].formatted_address);
      } else {
        setError("Unable to fetch address.");
      }
    } catch (err) {
      setError("Failed to fetch address. Please check your API key.");
      console.error("Error fetching address:", err);
    }
  };

  // Handle Check-In
  const handleCheckIn = async () => {
    const now = new Date();

    try {
      await setDoc(
        doc(db, 'attendance', user.employeeUid),
        {
          [today]: {
            checkIn: now,
            checkInLocation: address,
            employeeName: user.fullName,
            employeeUid: user.employeeUid,
          },
        },
        { merge: true }
      );

      setAttendance((prev) => ({
        ...prev,
        checkedIn: true,
        checkInTime: now,
        checkInLocation: address,
        status: "Present",
      }));

      alert("Check-in successful!");
    } catch (error) {
      setError("Check-in failed. Please try again.");
      console.error("Check-in error:", error);
    }
  };

  // Handle Check-Out
  const handleCheckOut = async () => {
    const now = new Date();

    try {
      const checkInTime = attendance.checkInTime;

      if (!checkInTime) {
        setError("Check-in time not found. Please check in first.");
        alert("Please check in before checking out.");
        return;
      }

      const duration = now - checkInTime;

      await updateDoc(doc(db, 'attendance', user.employeeUid), {
        [`${today}.checkOut`]: now,
        [`${today}.checkOutLocation`]: address,
        [`${today}.duration`]: duration,
        [`${today}.status`]: "Present",
      });

      setAttendance((prev) => ({
        ...prev,
        checkedOut: true,
        checkOutTime: now,
        checkOutLocation: address,
        duration,
      }));

      alert("Check-out successful!");
    } catch (error) {
      setError("Check-out failed. Please try again.");
      console.error("Check-out error:", error);
    }
  };

  // Format Duration
  const formatDuration = (ms) => {
    if (!ms) return "N/A";
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  return (
    <div className="manager-attendenceContainer1">
      <ManagerDashboard onToggleSidebar={setCollapsed} />
      <div className={`manager-attendence1 ${collapsed ? 'collapsed' : ''}`}>
        <h1 className="mt-4 text-center">My Attendance</h1>
        <div className="attendance-card1 mt-3">
          <h5>
            <span style={{ fontWeight: "bold", color: "cadetblue" }}>
              {user.fullName}
            </span>
          </h5>
          <p><strong>Date:</strong> {today}</p>

          {isLoading ? (
            <p>Loading attendance data...</p>
          ) : (
            <>
              <p><strong>Check-In:</strong> {attendance.checkInTime?.toLocaleTimeString() || "Not checked in"}</p>
              <p><strong>Check-In Location:</strong> {attendance.checkInLocation}</p>
              <p><strong>Check-Out:</strong> {attendance.checkOutTime?.toLocaleTimeString() || "Not checked out"}</p>
              <p><strong>Check-Out Location:</strong> {attendance.checkOutLocation}</p>
              <p><strong>Duration:</strong> {formatDuration(attendance.duration)}</p>
              <p><strong>Status:</strong> {attendance.status}</p>
            </>
          )}

          <div className="button-container">
            <button     className='checkedIn-btn' onClick={handleCheckIn} disabled={attendance.checkedIn || isSubmitting}>
              Check In
            </button>
            <button      className='checkedOut-btn' onClick={handleCheckOut} disabled={!attendance.checkedIn || attendance.checkedOut || isSubmitting}>
              Check Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerAttendence;
