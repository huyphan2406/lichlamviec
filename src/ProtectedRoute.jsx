// src/ProtectedRoute.jsx
import React from 'react';
import { useAuth } from './AuthContext.jsx'; // Lấy trạng thái đăng nhập
import { Navigate, useLocation } from 'react-router-dom';

function ProtectedRoute({ children }) {
  const { currentUser } = useAuth(); // Lấy thông tin user
  const location = useLocation();

  if (!currentUser) {
    // 🌟 Nếu chưa đăng nhập: Chuyển hướng đến trang /login
    // Khách sẽ không bao giờ thấy trang /login là trang chính
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Nếu đã đăng nhập: Cho phép hiển thị nội dung lịch
  return children;
}

export default ProtectedRoute;