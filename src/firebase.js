import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "energia-positivaa.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "energia-positivaa",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "energia-positivaa.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "509625923977",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:509625923977:web:481c9754bad687c91a8958",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-71HHBJEHWV"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
