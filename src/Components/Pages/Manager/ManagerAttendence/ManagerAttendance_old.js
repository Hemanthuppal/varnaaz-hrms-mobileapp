import React, { useState, useEffect } from 'react';
import ManagerDashboard from '../../../Shared/ManagerSidebar/ManagerSidebar';
import { useAuth } from "../../../Context/AuthContext";
import { db} from '../../../firebase/firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import axios from 'axios';
import './ManagerAttendence.css';

const ManagerAttendence = () => {
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

  // Fetch Assigned Location
  useEffect(() => {
    const fetchAssignedLocation = async () => {
      try {
        const userRef = doc(db, 'users', user.employeeUid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          if (userData.location) {
            setAssignedLocation({
              lat: userData.location.lat,
              lng: userData.location.lng
            });
          } else {
            setError("Assigned location not found.");
            console.error("Assigned location not found for the user.");
          }
        } else {
          setError("User data not found.");
          console.error("User document does not exist.");
        }
      } catch (err) {
        setError("Failed to fetch assigned location.");
        console.error("Error fetching assigned location:", err);
      } finally {
        setIsLoadingLocation(false);
      }
    };

    fetchAssignedLocation();
  }, [user.employeeUid]);

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

  // Haversine formula to calculate distance between two coordinates in km
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const toRad = (value) => (value * Math.PI) / 180;

    const R = 6371; // Radius of the Earth in km
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance; // in km
  };

  // Check if current location is within 5 km radius
  const isWithinRadius = () => {
    if (assignedLocation.lat === null || assignedLocation.lng === null) {
      setError("Assigned location not available.");
      return false;
    }
    if (coords.lat === null || coords.lng === null) {
      setError("Current location not available.");
      return false;
    }

    const distance = calculateDistance(
      coords.lat,
      coords.lng,
      assignedLocation.lat,
      assignedLocation.lng
    );

    console.log(`Distance from assigned location: ${distance.toFixed(2)} km`);

    if (distance <= 500) {
      return true;
    } else {
      setError("You are not within the allowed radius (5 km) of your assigned location.");
      return false;
    }
  };

  // Handle Check-In
  const handleCheckIn = async () => {
    const now = new Date();
    const dateKey = formatDate(now);

    try {
      // Make sure address is not null
      if (!address) {
        console.error('Address not available');
        alert("Location data not available. Try again.");
        return;
      }

      // Check if within 5 km radius
      if (!isWithinRadius()) {
        alert("You are not within the allowed radius to check in.");
        return;
      }

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
      // Make sure address is not null
      if (!address) {
        console.error('Address not available');
        alert("Location data not available. Try again.");
        return;
      }

      // Check if within 5 km radius
      if (!isWithinRadius()) {
        alert("You are not within the allowed radius to check out.");
        return;
      }

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

  // Determine if within radius for button disabling
  const [withinRadius, setWithinRadius] = useState(false);

  useEffect(() => {
    if (!isLoadingAttendance && !isLoadingLocation && coords.lat && coords.lng && assignedLocation.lat && assignedLocation.lng) {
      const within = isWithinRadius();
      setWithinRadius(within);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingAttendance, isLoadingLocation, coords, assignedLocation]);

  return (
    <div className='manager-attendenceContainer1'>
    <ManagerDashboard onToggleSidebar={setCollapsed} />
    <div className={`manager-attendence1 ${collapsed ? 'collapsed' : ''}`}>
    <h1 className='mt-4 text-center'>My Attendance</h1>
        <div className='attendance-card1 mt-3'>
          <h5> <span style={{fontWeight:"bold",color:"cadetblue"}}>{user.fullName}</span></h5>

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
              disabled={checkedIn || isSubmittingCheckIn || !withinRadius}
            >
              {isSubmittingCheckIn ? 'Checking In...' : 'Check In'}
            </button>

            <button
              className='checkedOut-btn'
              onClick={handleCheckOutClick}
              disabled={!checkedIn || checkedOut || isSubmittingCheckOut || !withinRadius}
            >
              {isSubmittingCheckOut ? 'Checking Out...' : 'Check Out'}
            </button>
          </div>

          {!withinRadius && (
            <div className="alert alert-warning mt-3" role="alert">
              You are not within the allowed radius (5 km) of your assigned location.
            </div>
          )}

          {/* <div>
            <p>{error && <span className="text-danger">{error}</span>}</p>
          </div> */}
        </div>
    </div>
</div>
  )
}

export default ManagerAttendence
