// src/RegisterPage.jsx (TẠO TÀI KHOẢN ĐẦY ĐỦ)

import { useState } from 'react';
import { auth } from './firebase';
import { 
    createUserWithEmailAndPassword, 
    updateProfile 
} from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';

// 🌟 ĐỊNH NGHĨA HẬU TỐ EMAIL GIẢ (PHẢI LÀ DOMAIN BẠN ĐÃ XÁC MINH TRONG FIREBASE)
const EMAIL_SUFFIX = '@workscheduleapp.com'; 

function RegisterPage() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState(''); // Email được lưu trữ nhưng không dùng để login
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Mật khẩu xác thực không khớp.');
            return;
        }

        // 1. Tạo Email chính cho Firebase
        const firebaseEmail = username + EMAIL_SUFFIX;

        try {
            // 2. Tạo người dùng Firebase
            const userCredential = await createUserWithEmailAndPassword(
                auth, 
                firebaseEmail, // Dùng email giả lập
                password
            );

            // 3. Lưu Tên đăng nhập vào Profile
            await updateProfile(userCredential.user, {
                displayName: username,
            });
            
            // 4. Chuyển hướng
            navigate('/'); 

        } catch (err) {
            let userMessage = 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.';
            if (err.code === 'auth/email-already-in-use') {
                 userMessage = 'Tên đăng nhập này đã được sử dụng. Vui lòng chọn tên khác.';
            } else if (err.code === 'auth/weak-password') {
                userMessage = 'Mật khẩu quá yếu. Cần ít nhất 6 ký tự.';
            }
            setError(userMessage);
            console.error(err);
        }
    };

    return (
        <div className="auth-container">
            <form onSubmit={handleSubmit} className="auth-form">
                <h2>Tạo Tài Khoản</h2>
                {error && <p className="auth-error">{error}</p>}
                
                <input 
                    type="text" 
                    placeholder="Tên đăng nhập" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)} 
                    required 
                />
                <input 
                    type="email" 
                    placeholder="Email (Để khôi phục tài khoản)" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                />
                <input 
                    type="password" 
                    placeholder="Mật khẩu (Ít nhất 6 ký tự)" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                />
                <input 
                    type="password" 
                    placeholder="Xác thực lại mật khẩu" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    required 
                />
                
                <button type="submit">Tạo Tài Khoản</button>
                <p>
                    Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
                </p>
            </form>
        </div>
    );
}
export default RegisterPage;