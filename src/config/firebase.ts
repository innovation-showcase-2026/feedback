import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: "AIzaSyCXVHIRo0sohsAHUBZ7Ue6kW5iVnUzHmlU",
  authDomain: "innovation-feedback-2026.firebaseapp.com",
  projectId: "innovation-feedback-2026",
  storageBucket: "innovation-feedback-2026.firebasestorage.app",
  messagingSenderId: "1039873284190",
  appId: "1:1039873284190:web:d0b29a09d851484fd03ccf"
};

// Initialize Firebase (guarding against multiple initializations)
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export const FEEDBACK_COLLECTION = 'feedback';
