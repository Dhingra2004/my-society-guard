import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBakujlNt4NbIaFpXX88lkbWMo9Je6lzu0",
  authDomain: "security-8bb5b.firebaseapp.com",
  projectId: "security-8bb5b",
  storageBucket: "security-8bb5b.firebasestorage.app",
  messagingSenderId: "97489289673",
  appId: "1:97489289673:web:63ae2733e6852ab4072818"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
