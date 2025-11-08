// src/CodeLogin.jsx (ĐĂNG NHẬP BẰNG MÃ CODE)

import { useState } from 'react';
// 🌟 IMPORT DB VÀ AUTH TỪ FIREBASE.JS 🌟
import { db, auth } from './firebase.js'; 
import { doc, getDoc, updateDoc } from 'firebase/firestore'; // Firestore functions
import { signInAnonymously } from 'firebase/auth'; // Auth cho Guest User
import { useNavigate, Link } from 'react-router-dom';

function CodeLogin() {
    const [accessCode, setAccessCode] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        try {
            // Loại bỏ khoảng trắng thừa và chuyển về chữ HOA để khớp với Document ID
            const code = accessCode.trim().toUpperCase(); 
            
            // 1. Tìm tài liệu (Document) theo mã code trong collection 'access_codes'
            const codeRef = doc(db, 'access_codes', code);
            const codeSnap = await getDoc(codeRef);

            if (!codeSnap.exists()) {
                setError('Mã truy cập không hợp lệ. Vui lòng kiểm tra lại.');
                return;
            }

            const data = codeSnap.data();
            const now = new Date();
            // Chuyển string date (ví dụ: '2026-01-01') sang Date object
            const expiryDate = new Date(data.expiryDate); 

            // 2. KIỂM TRA ĐIỀU KIỆN
            if (data.used) {
                setError('Mã này đã được sử dụng (đã kích hoạt).');
                return;
            }
            if (now > expiryDate) {
                setError(`Mã đã hết hạn sử dụng (${data.expiryDate}).`);
                return;
            }

            // 3. ĐĂNG NHẬP VÀ KÍCH HOẠT (Nếu hợp lệ)
            await signInAnonymously(auth); // Đăng nhập bằng Guest User

            // Cập nhật Database: Đánh dấu mã đã sử dụng
            await updateDoc(codeRef, {
                used: true,
                usedDate: now.toISOString(),
            });

            // 4. Chuyển hướng
            navigate('/'); 

        } catch (err) {
            console.error("Lỗi xác thực code:", err);
            setError('Có lỗi hệ thống xảy ra, không thể xác thực mã.');
        }
    };

    return (
        <div className="auth-container">
            <form onSubmit={handleSubmit} className="auth-form">
                <h2>Truy Cập Ứng Dụng</h2>
                {error && <p className="auth-error">{error}</p>}
                
                <input 
                    type="text" 
                    placeholder="Nhập Mã Kích Hoạt (Code)" 
                    value={accessCode} 
                    onChange={(e) => setAccessCode(e.target.value)} 
                    required 
                />
                
                <button type="submit">Sử Dụng Mã</button>

                <p style={{ marginTop: '25px', color: 'var(--color-danger)' }}>
                    Phần Đăng ký/Tạo tài khoản: **Cần mua Mã Kích Hoạt** để sử dụng.
                </p>
                <p>
                    <Link to="/contact">Liên hệ mua Code tại đây</Link> 
                </p>
            </form>
        </div>
    );
}
export default CodeLogin;