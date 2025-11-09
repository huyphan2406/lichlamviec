// src/ScheduleApp.jsx (Bộ Điều Hướng Router - Đã sửa lỗi)

import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import App from './App.jsx';                     // Nội dung Lịch
import ProtectedRoute from './ProtectedRoute.jsx'; // Người bảo vệ
import CodeLogin from './CodeLogin.jsx';           // Trang Đăng nhập bằng Mã Code
import AdminPanel from './AdminPanel.jsx';       // Trang Admin (ĐÃ TEST)
// Thêm icon cần thiết cho nút Report (nếu chưa có)
import { FiEdit3 } from 'react-icons/fi';

// Component Trang Liên Hệ Mua Code (Phụ)
const ContactPage = () => (
    <div className="auth-container">
        <div className="auth-form" style={{textAlign: 'center', padding: '40px'}}>
            <h2>Liên Hệ Mua Mã Kích Hoạt</h2>
            <Link to="/login" className="auth-button register" style={{display: 'inline-block', textDecoration: 'none', marginTop: '30px', width: 'auto'}}>
                Quay lại trang Truy Cập
            </Link>
        </div>
    </div>
);

function ScheduleApp() {
  return (
    <BrowserRouter>
      <Routes>
        
        {/* 🌟 FIX LỖI: Route chính (/) - KHÔNG CÒN BỊ BẢO VỆ. 
              Người dùng sẽ thấy lịch làm việc ngay lập tức (Guest Access). */}
        <Route path="/" element={<App />} />
        
        {/* Trang Đăng nhập bằng Mã Code */}
        <Route path="/login" element={<CodeLogin />} /> 
        <Route path="/register" element={<CodeLogin />} /> 
        
        {/* Route Admin - Vẫn cần bảo vệ */}
        <Route 
          path="/admin" 
          element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} 
        /> 

        {/* Trang liên hệ */}
        <Route path="/contact" element={<ContactPage />} /> 
        
      </Routes>
    </BrowserRouter>
  );
}

export default ScheduleApp;