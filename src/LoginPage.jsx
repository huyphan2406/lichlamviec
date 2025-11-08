// src/LoginPage.jsx (ĐĂNG NHẬP BẰNG USERNAME)

import { useState } from 'react';
import { auth } from './firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';

// 🌟 ĐỊNH NGHĨA HẬU TỐ EMAIL GIẢ (PHẢI LÀ DOMAIN BẠN ĐÃ XÁC MINH TRONG FIREBASE)
const EMAIL_SUFFIX = '@workscheduleapp.com'; 

function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        // 1. Chuyển Username thành Email mà Firebase nhận dạng
        const email = username + EMAIL_SUFFIX;

        try {
            // 2. Gọi hàm Đăng nhập Firebase bằng Email giả lập
            await signInWithEmailAndPassword(auth, email, password);
            navigate('/'); // Đăng nhập thành công
        } catch (err) {
            console.error("Lỗi đăng nhập:", err.code);
            // 3. Hiển thị thông báo lỗi thân thiện
            setError('Tên đăng nhập hoặc mật khẩu không chính xác. Vui lòng thử lại.');
        }
    };

    return (
        <div className="auth-container">
            <form onSubmit={handleSubmit} className="auth-form">
                <h2>Đăng Nhập</h2>
                {error && <p className="auth-error">{error}</p>}
                
                <input 
                    type="text" 
                    placeholder="Tên đăng nhập" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)} 
                    required 
                />
                <input 
                    type="password" 
                    placeholder="Mật khẩu" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                />
                
                <button type="submit">Đăng Nhập</button>
                <p>
                    Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
                </p>
            </form>
        </div>
    );
}
export default LoginPage;