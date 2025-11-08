// src/AuthContext.jsx (ĐÃ SỬA VÀ THÊM HÀM LOGOUT)
import React, { useContext, useState, useEffect } from 'react';
// Import auth và signOut từ firebase.js
import { auth, signOut } from './firebase.js'; 
import { onAuthStateChanged } from 'firebase/auth';

const AuthContext = React.createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // 🌟 ĐỊNH NGHĨA HÀM LOGOUT Ở ĐÂY 🌟
  const appLogout = () => {
      return signOut(auth);
  };

  const value = {
    currentUser,
    // 🌟 TRUYỀN HÀM LOGOUT ĐÃ ĐƯỢC KHỞI TẠO ĐÚNG CÁCH 🌟
    logout: appLogout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}