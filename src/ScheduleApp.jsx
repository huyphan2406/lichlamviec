// src/ScheduleApp.jsx (Bộ Điều Hướng Router - ĐÃ KIỂM TRA LẠI CẤU TRÚC)

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.jsx';                     
import ProtectedRoute from './ProtectedRoute.jsx'; 
import LoginPage from './LoginPage.jsx';        
import RegisterPage from './RegisterPage.jsx';     

function ScheduleApp() {
  return (
    // 🌟 PHẢI CÓ BROWSERROUTER BAO BỌC TOÀN BỘ 🌟
    <BrowserRouter>
      <Routes>
        
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              {/* Đây là nơi gọi component App có chứa Header và Link */}
              <App /> 
            </ProtectedRoute>
          } 
        />

        {/* Các Route công khai */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
      </Routes>
    </BrowserRouter>
  );
}

export default ScheduleApp;