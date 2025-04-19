import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// Replace with your actual Firebase config
const firebaseConfig = {
apiKey: "AIzaSyA4lR-GIHXRPOOmxpSvXps_4wEzIfcTTu8",
  authDomain: "issue-match.firebaseapp.com",
  projectId: "issue-match",
  storageBucket: "issue-match.firebasestorage.app",
  messagingSenderId: "104640838777",
  appId: "1:104640838777:web:d1eee96402546a7a7b68a8",
  measurementId: "G-4E76BP1290"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };