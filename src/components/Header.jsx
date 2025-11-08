import React from 'react';
import { FiMoon, FiSun } from 'react-icons/fi';

function Header({ theme, toggleTheme }) {
  return (
    <header className="app-header">
      <h1>Lịch Làm Việc</h1>
      <div className="theme-toggle" onClick={toggleTheme} title="Đổi giao diện Sáng/Tối">
        {theme === 'light' ? <FiMoon size={18} /> : <FiSun size={18} />}
        <label className="theme-toggle-switch">
          <input type="checkbox" checked={theme === 'dark'} onChange={() => {}} />
          <span className="theme-toggle-slider"></span>
        </label>
      </div>
    </header>
  );
}

export default Header;