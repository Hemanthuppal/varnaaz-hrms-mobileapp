import React, { useState, useEffect } from 'react';
import AdminDashboard from './../../../Shared/AdminSidebar/AdminSidebar';
import { ThreeDots } from 'react-loader-spinner';
import { Card, Row, Col } from 'react-bootstrap';
import './Dashboard.css';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase/firebase';
import { useNavigate } from 'react-router-dom';
import OnboardingChart from "./OnboardingChart";
import { format } from 'date-fns'; // For date formatting

function Dashboard() {
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [pendingLeavesCount, setPendingLeavesCount] = useState(0);
  const [attendanceData, setAttendanceData] = useState([]);
  const [presentCount, setPresentCount] = useState(0);
  const [lateCount, setLateCount] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      await fetchUsers();
      await fetchLeaves();
      await fetchAttendance();
      setLoading(false);
    };

    fetchData();
  }, []);

  const fetchUsers = async () => {
    try {
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      const userList = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(userList);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchLeaves = async () => {
    try {
      const leavesCollection = collection(db, 'leaves');
      const leavesSnapshot = await getDocs(leavesCollection);

      const allLeaves = [];
      leavesSnapshot.docs.forEach(doc => {
        const leaveDoc = doc.data();
        const nestedLeaves = leaveDoc.leaves || [];
        nestedLeaves.forEach(leave => {
          allLeaves.push({
            docId: doc.id,
            ...leave,
          });
        });
      });

      setLeaves(allLeaves);
      const pendingCount = allLeaves.filter(leave => leave.status === 'Pending').length;
      setPendingLeavesCount(pendingCount);
    } catch (error) {
      console.error('Error fetching leaves:', error);
    }
  };

  const fetchAttendance = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, 'attendance'));
        const attendance = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        setAttendanceData(attendance);

        // Get today's date formatted as 'dd-MM-yyyy'
        const todayDate = format(new Date(), 'dd-MM-yyyy');
        console.log('Today Date:', todayDate); // Log today's date for debugging

        let presentCount = 0;
        let lateCount = 0;

        // Iterate over each attendance record
        attendance.forEach(entry => {
            console.log('Entry:', entry); // Log the entire entry for debugging

            // Get all the dates from the document
            const dates = Object.keys(entry); 

            dates.forEach(date => {
                console.log('Checking date:', date); // Log each date for debugging

                // Compare with today's date
                if (date === todayDate) {
                    console.log('Matching date found!'); // Log when a matching date is found

                    const status = entry[date]?.statuses; // Check the status for the current date
                    const checkInTimestamp = entry[date]?.checkIn;  // Firebase Timestamp for check-in
                    const checkInTime = checkInTimestamp ? new Date(checkInTimestamp.seconds * 1000) : null; // Convert to Date object

                    console.log('Status:', status); // Log status
                    console.log('Check-in Time:', checkInTime); // Log check-in time

                    // If status is 'Present', increment present count
                    if (status === 'Present') {
                        presentCount += 1;

                        // Handle late check-in logic if check-in time exists
                        const lateThreshold = new Date();
                        lateThreshold.setHours(9, 0, 0, 0); // Set 9 AM threshold for late login

                        console.log('Late Threshold:', lateThreshold); // Log late threshold for debugging

                        if (checkInTime && checkInTime > lateThreshold) {
                            lateCount += 1;
                        }
                    }
                }
            });
        });

        // Set the final counts
        setPresentCount(presentCount);
        setLateCount(lateCount);

        console.log(`Present Count: ${presentCount}, Late Count: ${lateCount}`);  // Logging for debugging

    } catch (error) {
        console.error("Error fetching attendance data: ", error);
    }
};


  if (loading) {
    return (
      <div className="loader-container">
        <ThreeDots
          height="80"
          width="80"
          radius="9"
          color="#00BFFF"
          ariaLabel="three-dots-loading"
          visible={true}
        />
      </div>
    );
  }

  return (
    <div className="dashboardContainer1">
      <AdminDashboard onToggleSidebar={setCollapsed} />
      <div className={`dashboard1 ${collapsed ? 'collapsed' : ''}`}>
        <Row>
          <Col xs={12} sm={6} md={3} className="mb-4">
            <Card className="dashboard-card" onClick={() => navigate('/a-employeelist')}>
              <Card.Body>
                <Card.Title>Total Employees</Card.Title>
                <Card.Text>{users.length}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={12} sm={6} md={3} className="mb-4">
            <Card className="dashboard-card" onClick={() => navigate('/a-leave')}>
              <Card.Body>
                <Card.Title>Leave Requests</Card.Title>
                <Card.Text>{pendingLeavesCount}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={12} sm={6} md={3} className="mb-4">
            <Card className="dashboard-card" onClick={() => navigate('/AdminAttendence-daily')}>
              <Card.Body>
                <Card.Title>Total Present</Card.Title>
                <Card.Text>{presentCount}</Card.Text>
              </Card.Body>
            </Card>
          </Col>

          <Col xs={12} sm={6} md={3} className="mb-4">
            <Card className="dashboard-card" onClick={() => navigate('/AdminAttendence-daily')}>
              <Card.Body>
                <Card.Title>Total LateLogin</Card.Title>
                <Card.Text>{lateCount}</Card.Text> {/* Display the late login count */}
              </Card.Body>
            </Card>
          </Col>
        </Row>
        <Row>
          <Col xs={12} sm={6} md={5} className="mb-4">
            <Card className="dashboard-bar" >
              <Card.Body>
                <Card.Title></Card.Title>
                <Card.Text><OnboardingChart /></Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
}

export default Dashboard;
