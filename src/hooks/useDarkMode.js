import { useState, useEffect } from 'react';

export function useDarkMode() {
  // 1. Đọc cache từ localStorage, mặc định là 'light'
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    // 2. Cập nhật localStorage
    localStorage.setItem('theme', theme);
    // 3. Cập nhật thuộc tính data-theme trên thẻ <body>
    document.body.setAttribute('data-theme', theme);
  }, [theme]); // Chạy lại mỗi khi theme thay đổi

  return [theme, toggleTheme];
}