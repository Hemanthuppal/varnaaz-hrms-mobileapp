import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Title, Legend, Tooltip } from 'chart.js';
import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns'; // Import the format function

// Register Chart.js components
ChartJS.register(BarElement, CategoryScale, LinearScale, Title, Legend, Tooltip);

const DepartmentBarChart = () => {
  // Get the current month and format it as "YYYY-MM"
  const currentMonth = new Date().toISOString().slice(0, 7);

  const [chartData, setChartData] = useState(null); // Initially set to null
  const [chartHeight, setChartHeight] = useState(300);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth); // Initialize with the current month
  const db = getFirestore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch department names
        const departmentSnapshot = await getDocs(collection(db, 'departments'));
        const departments = departmentSnapshot.docs.map((doc) => doc.data().name) || [];

        // Fetch employee statuses
        const employeeSnapshot = await getDocs(collection(db, 'employees'));
        const employees = employeeSnapshot.docs.map((doc) => doc.data()) || [];

        // Initialize counts for each department
        const statusCounts = departments.map((name) => ({
          department: name,
          Selected: 0,
          Review: 0,
          NotSelected: 0,
        }));

        // Filter employees based on the selected month
        const filteredEmployees = employees.filter((employee) => {
          const createdAt = employee.createdAt; // Assuming "createdAt" is a Firestore Timestamp field
          if (!createdAt) return false;

          // Get the year and month from the timestamp
          const employeeMonth = createdAt.toDate().toISOString().slice(0, 7);

          // Compare the employee's month with the selected month
          return employeeMonth === selectedMonth;
        });

        // Count statuses for each department
        filteredEmployees.forEach((employee) => {
          const { department, status } = employee;
          const departmentData = statusCounts.find((d) => d.department === department);

          if (departmentData) {
            if (status === 'Selected') departmentData.Selected += 1;
            else if (status === 'Review') departmentData.Review += 1;
            else if (status === 'NotSelected') departmentData.NotSelected += 1;
          }
        });

        // Calculate the maximum value for height adjustment
        const maxValue = Math.max(
          ...statusCounts.flatMap((d) => [d.Selected, d.Review, d.NotSelected])
        );

        setChartHeight(Math.min(1000, Math.max(400, maxValue * 20)));

        // Prepare chart data
        setChartData({
          labels: departments,
          datasets: [
            {
              label: 'Selected',
              data: statusCounts.map((d) => d.Selected),
              backgroundColor: 'rgba(75, 192, 192, 0.6)',
            },
            {
              label: 'Review',
              data: statusCounts.map((d) => d.Review),
              backgroundColor: 'rgba(255, 206, 86, 0.6)',
            },
            {
              label: 'NotSelected',
              data: statusCounts.map((d) => d.NotSelected),
              backgroundColor: 'rgba(255, 99, 132, 0.6)',
            },
          ],
        });
      } catch (error) {
        console.error('Error fetching data:', error);
        setChartData(null); // Set to null to handle loading or error state
      }
    };

    fetchData();
  }, [db, selectedMonth]);

  const handleMonthChange = (event) => {
    setSelectedMonth(event.target.value); // Update the selected month
  };

  if (chartData === null) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      

      <div className='row'>
        <div className='col-md-6'>
          <h3>OnBoarding</h3>
        </div>
        <div className="col-md-6">
          <label htmlFor="monthPicker" >Select Month:</label>
          <input
            type="month"
            id="monthPicker"
            value={selectedMonth}
            onChange={handleMonthChange}
            className="mr-2"
            max={format(new Date(), 'yyyy-MM')}
          />
        </div>
      </div>

      <div style={{ height: `${chartHeight}px`, width: '100%' }}>
        <Bar
          data={chartData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'top',
              },
              title: {
                display: true,
                text: 'Employee Status per Department',
              },
            },
            scales: {
              x: {
                title: {
                  display: true,
                  text: 'Departments',
                },
              },
              y: {
                title: {
                  display: true,
                  text: 'Number of Employees',
                },
                beginAtZero: true,
              },
            },
          }}
        />
      </div>
    </div>
  );
};

export default DepartmentBarChart;
