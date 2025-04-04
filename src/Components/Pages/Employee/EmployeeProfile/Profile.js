// import React, { useState, useEffect } from 'react';
// import { useLocation } from 'react-router-dom';
// import { doc, getDoc, updateDoc } from 'firebase/firestore';
// import { db, storage } from './../../../firebase/firebase';
// import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
// import { useAuth } from '../../../Context/AuthContext';
// import EmployeeSidebar from '../../../Shared/EmployeeSidebar/EmployeeSidebar';
// import './Profile.css';

// function EmployeeDetails() {
//   const { user } = useAuth();
//   const [collapsed, setCollapsed] = useState(false);
//   const [employeeData, setEmployeeData] = useState(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [editModePersonalInfo, setEditModePersonalInfo] = useState(false);
//   const [editModeEducationDetails, setEditModeEducationDetails] = useState(false);
//   const [editModeBankDetails, setEditModeBankDetails] = useState(false);

//   useEffect(() => {
//     const fetchEmployeeData = async () => {
//       setIsLoading(true);
//       try {
//         const docRef = doc(db, 'users', user.employeeUid);
//         const docSnap = await getDoc(docRef);

//         if (docSnap.exists()) {
//           setEmployeeData(docSnap.data());
//         } else {
//           console.log('No such document!');
//         }
//       } catch (error) {
//         console.error('Error fetching employee data:', error);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     if (user.employeeUid) {
//       fetchEmployeeData();
//     }
//   }, [user.employeeUid]);

//   const handleSave = async (section) => {
//     try {
//       const docRef = doc(db, 'users', user.employeeUid);
//       await updateDoc(docRef, {
//         ...employeeData,
//       });
//       if (section === 'personalInfo') setEditModePersonalInfo(false);
//       if (section === 'educationDetails') setEditModeEducationDetails(false);
//       if (section === 'bankDetails') setEditModeBankDetails(false);
//     } catch (error) {
//       console.error('Error updating document:', error);
//     }
//   };

//   const handleChange = (event, field) => {
//     setEmployeeData((prevState) => ({
//       ...prevState,
//       [field]: event.target.value,
//     }));
//   };

//   const uploadResume = async (file) => {
//     const storageRef = ref(storage, `resumes/${file.name}`);
//     try {
//       const snapshot = await uploadBytes(storageRef, file);
//       const downloadURL = await getDownloadURL(snapshot.ref);

//       const docRef = doc(db, 'users', user.employeeUid);
//       await updateDoc(docRef, {
//         resume: downloadURL,
//       });

//       setEmployeeData((prevState) => ({
//         ...prevState,
//         resume: downloadURL,
//       }));

//       alert('Resume successfully uploaded!');
//     } catch (error) {
//       console.error('Error uploading resume:', error);
//       alert('Error uploading resume. Please try again.');
//     }
//   };

//   const uploadPhoto = async (file) => {
//     const storageRef = ref(storage, `photos/${file.name}`);
//     try {
//       const snapshot = await uploadBytes(storageRef, file);
//       const downloadURL = await getDownloadURL(snapshot.ref);

//       const docRef = doc(db, 'users', user.employeeUid);
//       await updateDoc(docRef, {
//         photo: downloadURL,
//       });

//       setEmployeeData((prevState) => ({
//         ...prevState,
//         photo: downloadURL,
//       }));

//       alert('Profile photo successfully uploaded!');
//     } catch (error) {
//       console.error('Error uploading photo:', error);
//       alert('Error uploading photo. Please try again.');
//     }
//   };

//   if (!employeeData) return <div></div>;

//   return (
//     <div className='employee-profile'>
//       <EmployeeSidebar onToggleSidebar={setCollapsed} />
//       <div className={`employee-profile-content ${collapsed ? 'collapsed' : ''}`}>
//         <div className='profile-container'>
//           <div className='profile-header'>
//             <img
//               src={employeeData.photo}
//               alt="Employee"
//               className='profile-photo'
//             />
//             <div>
//               <h2 className='profile-name'>{employeeData.fullName}</h2>
//               <p className='profile-role'>{employeeData.role}</p>
//             </div>
//           </div>

//           <EditableSection
//             title="Personal Information"
//             data={employeeData}
//             editMode={editModePersonalInfo}
//             setEditMode={setEditModePersonalInfo}
//             handleSave={() => handleSave('personalInfo')}
//             handleChange={handleChange}
//             fields={['fullName', 'fatherName', 'dob', 'gender', 'mobile', 'address', 'aadhaarNumber', 'photo']}
//             uploadPhoto={uploadPhoto}
//           />

//           <EditableSection
//             title="Education Details"
//             data={employeeData}
//             editMode={editModeEducationDetails}
//             setEditMode={setEditModeEducationDetails}
//             handleSave={() => handleSave('educationDetails')}
//             handleChange={handleChange}
//             fields={['education', 'specialisation', 'resume']}
//             uploadResume={uploadResume}
//           />

//           <EditableSection
//             title="Bank Details"
//             data={employeeData}
//             editMode={editModeBankDetails}
//             setEditMode={setEditModeBankDetails}
//             handleSave={() => handleSave('bankDetails')}
//             handleChange={handleChange}
//             fields={['accountHolderName', 'accountNumber', 'bank', 'branch', 'ifsc']}
//           />
//         </div>
//       </div>
//     </div>
//   );
// }

// function EditableSection({
//   title,
//   data,
//   editMode,
//   setEditMode,
//   handleSave,
//   handleChange,
//   fields,
//   uploadResume,
//   uploadPhoto,
// }) {
//   const handleFileChange = async (event) => {
//     const file = event.target.files[0];
//     if (file && uploadResume) {
//       await uploadResume(file);
//     }
//   };

//   const handlePhotoChange = async (event) => {
//     const file = event.target.files[0];
//     if (file && uploadPhoto) {
//       await uploadPhoto(file);
//     }
//   };

//   const viewPhoto = () => {
//     window.open(data.photo, '_blank');
//   };

//   return (
//     <div className='editable-section'>
//       <h3 className='section-title'>{title}</h3>
//       {editMode ? (
//         <button onClick={() => handleSave(title.toLowerCase().replace(/ /g, ''))} className='save-btn'>
//           Save
//         </button>
//       ) : (
//         <button onClick={() => setEditMode(true)} className='edit-btn'>
//           Edit
//         </button>
//       )}

//       {fields.map((field) => {
//         const labelWidth = 250;
//         const inputStyles = {
//           marginLeft: '10px',
//           marginTop: editMode ? '10px' : '0',
//         };


//         // Date of Birth field with date picker
//         if (editMode && field === 'dob') {
//           return (
//             <div key={field} className='input-group'>
//               <strong className='label'>Date of Birth:</strong>
//               <input
//                 type="date"
//                 value={data[field] || ''}
//                 onChange={(e) => handleChange(e, field)}
//                 style={inputStyles}
//               />
//             </div>
//           );
//         } else if (field === 'dob') {
//           return (
//             <p key={field} className='input-group'>
//               <strong className='label'>Date of Birth:</strong>
//               {data[field]}
//             </p>
//           );
//         }

//         // Gender field with dropdown
//         if (editMode && field === 'gender') {
//           return (
//             <div key={field} className='input-group'>
//               <strong className='label'>Gender:</strong>
//               <select
//                 value={data[field] || ''}
//                 onChange={(e) => handleChange(e, field)}
//                 style={inputStyles}
//               >
//                 <option value="">Select Gender</option>
//                 <option value="Male">Male</option>
//                 <option value="Female">Female</option>
//                 <option value="Other">Other</option>
//               </select>
//             </div>
//           );
//         } else if (field === 'gender') {
//           return (
//             <p key={field} className='input-group'>
//               <strong className='label'>Gender:</strong>
//               {data[field]}
//             </p>
//           );
//         }

//         if (editMode && field === 'resume') {
//           return (
//             <div key={field} className='input-group'>
//               <strong className='label'>Resume:</strong>
//               <input type="file" onChange={handleFileChange} style={inputStyles} />
//             </div>
//           );
//         } else if (editMode && field === 'photo') {
//           return (
//             <div key={field} className='input-group'>
//               <strong className='label'>Profile Photo:</strong>
//               <input className='input' type="file" accept="image/*" onChange={handlePhotoChange} style={inputStyles} />
//             </div>
//           );
//         } else if (editMode) {
//           return (
//             <div key={field} className='input-group'>
//               <strong className='label'>
//                 {field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}:
//               </strong>
//               <input
//                 type="text"
//                 value={data[field] || ''}
//                 onChange={(e) => handleChange(e, field)}
//                 style={inputStyles}
//               />
//             </div>
//           );
//         } else {
//           return (
//             <p key={field} className='input-group'>
//               <strong className='label'>
//                 {field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}:
//               </strong>
//               {field === 'resume' ? (
//                 <a href={data[field]} target="_blank" rel="noopener noreferrer" style={{textDecoration:'none'}}>
//                   View Resume
//                 </a>
//               ) : field === 'photo' ? (
//                 <a href="#" onClick={viewPhoto} style={{textDecoration:'none'}}>
//                   View Photo
//                 </a>
//               ) : (
//                 data[field]
//               )}
//             </p>
//           );
//         }
//       })}
//     </div>
//   );
// }

// export default EmployeeDetails;












import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, storage } from './../../../firebase/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../../../Context/AuthContext';
import EmployeeSidebar from '../../../Shared/EmployeeSidebar/EmployeeSidebar';
import './Profile.css';

function EmployeeDetails() {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [employeeData, setEmployeeData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editModePersonalInfo, setEditModePersonalInfo] = useState(false);
  const [editModeEducationDetails, setEditModeEducationDetails] = useState(false);
  const [editModeBankDetails, setEditModeBankDetails] = useState(false);

  useEffect(() => {
    const fetchEmployeeData = async () => {
      setIsLoading(true);
      try {
        const docRef = doc(db, 'users', user.employeeUid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setEmployeeData(docSnap.data());
        } else {
          console.log('No such document!');
        }
      } catch (error) {
        console.error('Error fetching employee data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user.employeeUid) {
      fetchEmployeeData();
    }
  }, [user.employeeUid]);

  const handleSave = async (section) => {
    try {
      const docRef = doc(db, 'users', user.employeeUid);
      await updateDoc(docRef, {
        ...employeeData,
      });
      if (section === 'personalInfo') setEditModePersonalInfo(false);
      if (section === 'educationDetails') setEditModeEducationDetails(false);
      if (section === 'bankDetails') setEditModeBankDetails(false);
    } catch (error) {
      console.error('Error updating document:', error);
    }
  };

  const handleChange = (event, field) => {
    setEmployeeData((prevState) => ({
      ...prevState,
      [field]: event.target.value,
    }));
  };

  const uploadResume = async (file) => {
    const storageRef = ref(storage, `resumes/${file.name}`);
    try {
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      const docRef = doc(db, 'users', user.employeeUid);
      await updateDoc(docRef, {
        resume: downloadURL,
      });

      setEmployeeData((prevState) => ({
        ...prevState,
        resume: downloadURL,
      }));

      alert('Resume successfully uploaded!');
    } catch (error) {
      console.error('Error uploading resume:', error);
      alert('Error uploading resume. Please try again.');
    }
  };

  const uploadOfferLetter = async (file) => {
    const storageRef = ref(storage, `offerLetters/${file.name}`);
    try {
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      const docRef = doc(db, 'users', user.employeeUid);
      await updateDoc(docRef, {
        offerLetter: downloadURL,
      });

      setEmployeeData((prevState) => ({
        ...prevState,
        offerLetter: downloadURL,
      }));

      alert('Offer letter successfully uploaded!');
    } catch (error) {
      console.error('Error uploading offer letter:', error);
      alert('Error uploading offer letter. Please try again.');
    }
  };

  const uploadPhoto = async (file) => {
    const storageRef = ref(storage, `photos/${file.name}`);
    try {
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      const docRef = doc(db, 'users', user.employeeUid);
      await updateDoc(docRef, {
        photo: downloadURL,
      });

      setEmployeeData((prevState) => ({
        ...prevState,
        photo: downloadURL,
      }));

      alert('Profile photo successfully uploaded!');
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Error uploading photo. Please try again.');
    }
  };

  if (!employeeData) return <div></div>;

  return (
    <div className='employee-profile'>
      <EmployeeSidebar onToggleSidebar={setCollapsed} />
      <div className={`employee-profile-content ${collapsed ? 'collapsed' : ''}`}>
        <div className='profile-container'>
          <div className='profile-header'>
            {employeeData.photo ? (
              <img
                src={employeeData.photo}
                alt="Employee"
                className='profile-photo'
              />
            ) : (
              <div className='profile-photo-placeholder'>No Photo</div>
            )}
            <div>
              <h2 className='profile-name'>{employeeData.fullName}</h2>
              <p className='profile-role'>{employeeData.role}</p>
            </div>
          </div>

          <EditableSection
            title="Personal Information"
            data={employeeData}
            editMode={editModePersonalInfo}
            setEditMode={setEditModePersonalInfo}
            handleSave={() => handleSave('personalInfo')}
            handleChange={handleChange}
            fields={['fullName', 'fatherName', 'dob', 'gender', 'mobile', 'address', 'aadhaarNumber', 'photo']}
            uploadPhoto={uploadPhoto}
          />

          <EditableSection
            title="Education Details"
            data={employeeData}
            editMode={editModeEducationDetails}
            setEditMode={setEditModeEducationDetails}
            handleSave={() => handleSave('educationDetails')}
            handleChange={handleChange}
            fields={['education', 'specialisation', 'resume', 'offerLetter']}
            uploadResume={uploadResume}
            uploadOfferLetter={uploadOfferLetter}
          />

          <EditableSection
            title="Bank Details"
            data={employeeData}
            editMode={editModeBankDetails}
            setEditMode={setEditModeBankDetails}
            handleSave={() => handleSave('bankDetails')}
            handleChange={handleChange}
            fields={['accountHolderName', 'accountNumber', 'bank', 'branch', 'ifsc']}
          />
        </div>
      </div>
    </div>
  );
}

function EditableSection({
  title,
  data,
  editMode,
  setEditMode,
  handleSave,
  handleChange,
  fields,
  uploadResume,
  uploadOfferLetter,
  uploadPhoto,
}) {
  const handleFileChange = async (event, type) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      if (type === 'resume' && uploadResume) {
        await uploadResume(file);
      } else if (type === 'offerLetter' && uploadOfferLetter) {
        await uploadOfferLetter(file);
      } else if (type === 'photo' && uploadPhoto) {
        await uploadPhoto(file);
      }
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
    }
  };

  const viewFile = (url) => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  return (
    <div className='editable-section'>
      <h3 className='section-title'>{title}</h3>
      {editMode ? (
        <button onClick={() => handleSave(title.toLowerCase().replace(/ /g, ''))} className='save-btn'>
          Save
        </button>
      ) : (
        <button onClick={() => setEditMode(true)} className='edit-btn'>
          Edit
        </button>
      )}

      {fields.map((field) => {
        const inputStyles = {
          marginLeft: '10px',
          marginTop: editMode ? '10px' : '0',
        };

        // Date of Birth field with date picker
        if (editMode && field === 'dob') {
          return (
            <div key={field} className='input-group'>
              <strong className='label'>Date of Birth:</strong>
              <input
                type="date"
                value={data[field] || ''}
                onChange={(e) => handleChange(e, field)}
                style={inputStyles}
              />
            </div>
          );
        } else if (field === 'dob') {
          return (
            <p key={field} className='input-group'>
              <strong className='label'>Date of Birth:</strong>
              {data[field]}
            </p>
          );
        }

        // Gender field with dropdown
        if (editMode && field === 'gender') {
          return (
            <div key={field} className='input-group'>
              <strong className='label'>Gender:</strong>
              <select
                value={data[field] || ''}
                onChange={(e) => handleChange(e, field)}
                style={inputStyles}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          );
        } else if (field === 'gender') {
          return (
            <p key={field} className='input-group'>
              <strong className='label'>Gender:</strong>
              {data[field]}
            </p>
          );
        }

        // File upload fields (resume, offer letter, photo)
        if (editMode && (field === 'resume' || field === 'offerLetter')) {
          return (
            <div key={field} className='input-group'>
              <strong className='label'>
                {field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}:
              </strong>
              <input
                type="file"
                onChange={(e) => handleFileChange(e, field)}
                style={inputStyles}
              />
            </div>
          );
        } else if (editMode && field === 'photo') {
          return (
            <div key={field} className='input-group'>
              <strong className='label'>Profile Photo:</strong>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'photo')}
                style={inputStyles}
              />
            </div>
          );
        } else if (field === 'photo') {
          return (
            <p key={field} className='input-group'>
              <strong className='label'>Profile Photo:</strong>
              {data.photo ? (
                <a href="#" onClick={() => viewFile(data.photo)} style={{ textDecoration: 'none' }}>
                  View Photo
                </a>
              ) : (
                'Not uploaded'
              )}
            </p>
          );
        } else if (field === 'resume' || field === 'offerLetter') {
          return (
            <p key={field} className='input-group'>
              <strong className='label'>
                {field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}:
              </strong>
              {data[field] ? (
                <a href="#" onClick={() => viewFile(data[field])} style={{ textDecoration: 'none' }}>
                  View {field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}
                </a>
              ) : (
                'Not uploaded'
              )}
            </p>
          );
        } else if (editMode) {
          return (
            <div key={field} className='input-group'>
              <strong className='label'>
                {field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}:
              </strong>
              <input
                type="text"
                value={data[field] || ''}
                onChange={(e) => handleChange(e, field)}
                style={inputStyles}
              />
            </div>
          );
        } else {
          return (
            <p key={field} className='input-group'>
              <strong className='label'>
                {field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}:
              </strong>
              {data[field] || 'N/A'}
            </p>
          );
        }
      })}
    </div>
  );
}

export default EmployeeDetails;