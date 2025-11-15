import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAmaBRr7GU_EuPYzW831eo9lAfWS5DPcso",
  authDomain: "arecacropmonitoring.firebaseapp.com",
  databaseURL: "https://arecacropmonitoring-default-rtdb.firebaseio.com",
  projectId: "arecacropmonitoring",
  storageBucket: "arecacropmonitoring.firebasestorage.app",
  messagingSenderId: "459733959754",
  appId: "1:459733959754:web:197a5c9c41413c681292b3",
  measurementId: "G-BC97EJ79DL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);
export const storage = getStorage(app);

export default app;