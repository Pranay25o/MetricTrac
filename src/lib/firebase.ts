
// src/lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyC8JC1k_U_ITs8H_hzaMJVf1HFhbUmvMfc",
  authDomain: "project1-3deee.firebaseapp.com",
  projectId: "project1-3deee",
  storageBucket: "project1-3deee.firebasestorage.app", // Corrected: firebasestorage.app
  messagingSenderId: "606144499324",
  appId: "1:606144499324:web:301f81a23fedf4e064c3f9",
  measurementId: "G-5FKHJRFG6L"
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
