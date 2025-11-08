// src/main.jsx (ĐÃ SỬA)

import React from 'react'
import ReactDOM from 'react-dom/client'
import ScheduleApp from './ScheduleApp.jsx'; // 🌟 IMPORT BỘ ĐIỀU HƯỚNG
import { AuthProvider } from './AuthContext.jsx'; // Context
import './App.css'; 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 🌟 CẤU TRÚC ĐÚNG: CONTEXT -> BỘ ĐIỀU HƯỚNG (CÓ BROWSERROUTER) 🌟 */}
    <AuthProvider> 
      <ScheduleApp /> 
    </AuthProvider>
  </React.StrictMode>,
)