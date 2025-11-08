/*
=================================================
  File: ScheduleApp.jsx (Bộ Điều Hướng Router)
  Chứa BrowserRouter và các Route.
=================================================
*/

import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import App from './App.jsx';                     // Nội dung Lịch (Được bảo vệ)
import ProtectedRoute from './ProtectedRoute.jsx'; // Component bảo vệ
import CodeLogin from './CodeLogin.jsx';          // Trang đăng nhập bằng Code


// 🌟 Component Trang Liên Hệ Mua Code 🌟
// Đây là nơi người dùng được chuyển đến khi muốn mua mã code.
const ContactPage = () => (
    <div className="auth-container">
        <div className="auth-form" style={{textAlign: 'center', padding: '40px'}}>
            <h2>Liên Hệ Mua Mã Kích Hoạt</h2>
            <p style={{marginBottom: '20px', color: 'var(--color-text-primary)'}}>
                Để sử dụng ứng dụng Lịch Làm Việc, vui lòng liên hệ tác giả để nhận Mã Kích Hoạt.
            </p>
            
            <p style={{fontWeight: 'bold', fontSize: '1.1em', color: 'var(--color-brand)', margin: '15px 0'}}>
                Tác giả: Quốc Huy
            </p>
            
            <p>
                Zalo: [Số Zalo của bạn]
            </p>
            <p>
                Email: [Email liên hệ của bạn]
            </p>
            
            <Link 
                to="/login" 
                className="auth-button register" 
                style={{display: 'inline-block', textDecoration: 'none', marginTop: '30px', width: 'auto'}}
            >
                Quay lại trang Truy Cập
            </Link>
        </div>
    </div>
);


function ScheduleApp() {
  return (
    <BrowserRouter>
      <Routes>
        
        {/* 1. Route chính (/) - Bị bảo vệ */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              {/* Nếu đã đăng nhập (bằng mã code), hiển thị ứng dụng lịch */}
              <App /> 
            </ProtectedRoute>
          } 
        />

        {/* 2. Trang Đăng nhập (Sử dụng CodeLogin) */}
        <Route path="/login" element={<CodeLogin />} /> 
        
        {/* 3. Trang Đăng ký (Cũng trỏ về CodeLogin, nhưng nút Liên hệ sẽ hoạt động) */}
        <Route path="/register" element={<CodeLogin />} /> 
        
        {/* 4. Trang Liên hệ Mua code */}
        <Route path="/contact" element={<ContactPage />} /> 
        
      </Routes>
    </BrowserRouter>
  );
}

export default ScheduleApp;