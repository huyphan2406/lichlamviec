import { initializeApp } from "firebase/app";
import { getAuth, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCu-5sC_oDXoL5HOjcvyIeSX-jlF87xIwg",
  authDomain: "lichlamviecstandby.firebaseapp.com",
  projectId: "lichlamviecstandby",
  storageBucket: "lichlamviecstandby.firebasestorage.app",
  messagingSenderId: "504401682867",
  appId: "1:504401682867:web:4502d25fa2b9cd8d24ebc6",
  measurementId: "G-0H6NC067R2",
} as const;

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const firebaseSignOut = () => signOut(auth);


