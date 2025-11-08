// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, signOut, signInAnonymously } from "firebase/auth"; // Thêm signInAnonymously
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore"; // 👈 THÊM CÁC HÀM FIRESTORE

const firebaseConfig = {
  apiKey: "AIzaSyCu-5sC_oDXoL5HOjcvyIeSX-jlF87xIwg",
  authDomain: "lichlamviecstandby.firebaseapp.com",
  projectId: "lichlamviecstandby",
  storageBucket: "lichlamviecstandby.firebasestorage.app",
  messagingSenderId: "504401682867",
  appId: "1:504401682867:web:4502d25fa2b9cd8d24ebc6",
  measurementId: "G-0H6NC067R2"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app); 
export { signOut };
export const db = getFirestore(app); 
export default app;