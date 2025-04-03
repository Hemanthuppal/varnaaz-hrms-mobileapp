import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/auth';
import 'firebase/compat/storage';  // Import Firebase Storage

const firebaseConfig = {
  apiKey: "AIzaSyAn179awVToJBYIvwngaEfzSJ4oaKUuosc",
  authDomain: "varnaaz-hrms.firebaseapp.com",
  databaseURL: "https://varnaaz-hrms-default-rtdb.firebaseio.com",
  projectId: "varnaaz-hrms",
  storageBucket: "varnaaz-hrms.appspot.com",
  messagingSenderId: "226501097310",
  appId: "1:226501097310:web:0dafb40f972a19aac241cf"
};


if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();  // Initialize Firebase Storage

export { db, auth, storage };
