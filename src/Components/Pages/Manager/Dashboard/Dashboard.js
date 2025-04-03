import React, { useState, useEffect } from 'react';
import ManagerSidebar from './../../../Shared/ManagerSidebar/ManagerSidebar';
import { useAuth } from '../../../Context/AuthContext';
import { ThreeDots } from 'react-loader-spinner';
import { Card, Row, Col } from 'react-bootstrap';
import './Dashboard.css';
import { collection, query, where, getDocs, documentId } from 'firebase/firestore';
import { db } from '../../../firebase/firebase';
import { useNavigate } from 'react-router-dom';

function ManagerDashboard() {
    const { user } = useAuth();
    const [collapsed, setCollapsed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [leaves, setLeaves] = useState([]);
    const [pendingLeavesCount, setPendingLeavesCount] = useState(0); // State to hold pending leaves count
    const [attendanceData, setAttendanceData] = useState([]); // State for attendance data
  const [presentCount, setPresentCount] = useState(0); // State for present status count

    useEffect(() => {
        const fetchData = async () => {
            await fetchUsers(); // Fetch users
            await fetchManagerLeaves(); // Fetch leaves for the manager
            await fetchAttendance();
            setLoading(false); // Set loading to false after fetching
        };
        fetchData();
    }, []);

    // Function to fetch users assigned to the manager
    const fetchUsers = async () => {
        try {
            const usersCollection = collection(db, 'users');
            const q = query(usersCollection, where('assignedManagerUid', '==', user.employeeUid));
            const usersSnapshot = await getDocs(q);
            const userList = usersSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setUsers(userList);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };
    const navigate = useNavigate();
    // Function to fetch leaves assigned to employees under the manager
    const fetchManagerLeaves = async () => {
        try {
            if (user && user.role === 'Manager') {
                const managerUid = user.employeeUid;

                // Query to fetch all users where assignedManagerUid matches the manager's employeeUid
                const usersQuery = query(
                    collection(db, 'users'),
                    where('assignedManagerUid', '==', managerUid)
                );

                const usersSnapshot = await getDocs(usersQuery);
                const matchedUsers = usersSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                }));

                // Extract employeeUid from matched users and create a mapping for employee details
                const employeeDetails = {};
                matchedUsers.forEach(user => {
                    employeeDetails[user.employeeUid] = {
                        fullName: user.fullName,
                        email: user.email,
                    };
                });

                const employeeUids = matchedUsers.map(user => user.employeeUid);

                // If no employee matches, stop further processing
                if (employeeUids.length === 0) {
                    setLeaves([]); // No leaves found
                    setPendingLeavesCount(0); // No pending leaves
                    return;
                }

                // Fetch leaves where the docId matches any of the employeeUids
                const leavesQuery = query(
                    collection(db, 'leaves'),
                    where(documentId(), 'in', employeeUids) // Match the Firestore document ID with employeeUid
                );

                const leavesSnapshot = await getDocs(leavesQuery);
                const leavesList = leavesSnapshot.docs.map(leaveDoc => ({
                    id: leaveDoc.id,
                    ...leaveDoc.data(),
                }));

                // Loop through the fetched leave documents to extract data from the nested leaves array
                const allLeaves = [];
                leavesList.forEach(leaveDoc => {
                    if (leaveDoc.leaves && Array.isArray(leaveDoc.leaves)) {
                        leaveDoc.leaves.forEach(nestedLeave => {
                            allLeaves.push({
                                docId: leaveDoc.id, // Leave document ID
                                ...nestedLeave,  // Spread the individual leave data
                            });
                        });
                    }
                });

                // Count pending leaves
                const pendingCount = allLeaves.filter(leave => leave.status === 'Pending').length;
                setPendingLeavesCount(pendingCount); 

                // Store the flattened leave data in state
                setLeaves(allLeaves);
            }
        } catch (error) {
            console.error('Error fetching leaves: ', error);
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
          
          // Count the number of "Present" statuses
          const presentStatusCount = attendance.filter(entry => entry.statuses === 'Present').length;
          setPresentCount(presentStatusCount);
    
          console.log("Attendance Data for the month:", attendance);
        } catch (error) {
          console.error("Error fetching attendance data: ", error);
        }
      };

    // Loader while fetching data
    if (loading) {
        return (
            <div className="loader-container">
                <ThreeDots 
                    height="80" 
                    width="80" 
                    radius="9"
                    color="#00BFFF"
                    ariaLabel="three-dots-loading"
                    wrapperStyle={{}}
                    wrapperClass=""
                    visible={true}
                />
            </div>
        );
    }

    return (
        <div className='manager-dashboardContainer1'>
            <ManagerSidebar onToggleSidebar={setCollapsed} />
            <div className={`manager-dashboard1 ${collapsed ? 'collapsed' : ''}`}>
                <Row>
                    <Col xs={12} sm={6} md={3} className="mb-4">
                    <Card className="dashboard-card" onClick={() => navigate('/m-viewemployees')}>
                            <Card.Body>
                                <Card.Title>Total Employees</Card.Title>
                                <Card.Text>{users.length}</Card.Text> {/* Display the user count */}
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col xs={12} sm={6} md={3} className="mb-4">
                    <Card className="dashboard-card" onClick={() => navigate('/m-leave')}>
                            <Card.Body>
                                <Card.Title>Leave Requests</Card.Title>
                                <Card.Text>{pendingLeavesCount}</Card.Text> {/* Display pending leaves count */}
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col xs={12} sm={6} md={3} className="mb-4">
                    <Card className="dashboard-card" onClick={() => navigate('/m-viewattendence')}>
              <Card.Body>
                <Card.Title>Total Present</Card.Title>
                <Card.Text>{presentCount}</Card.Text> {/* Display the count of "Present" statuses */}
              </Card.Body>
            </Card>
          </Col>
                    {/* You can add more cards similarly for other metrics */}
                </Row>
            </div>
        </div>
    );
}

export default ManagerDashboard;
