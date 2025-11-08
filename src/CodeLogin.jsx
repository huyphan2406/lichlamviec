// src/CodeLogin.jsx (ĐĂNG NHẬP BẰNG MÃ CODE)

import { useState } from 'react';
// 🌟 Đảm bảo đã import đúng db và auth từ firebase.js 🌟
import { db, auth } from './firebase.js'; 
import { doc, getDoc, updateDoc } from 'firebase/firestore'; 
import { signInAnonymously } from 'firebase/auth'; 
import { useNavigate, Link } from 'react-router-dom';

function CodeLogin() {
    const [accessCode, setAccessCode] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        
        try {
            const code = accessCode.trim().toUpperCase(); 
            if (!code) {
                setError('Vui lòng nhập Mã Kích Hoạt.');
                setIsLoading(false);
                return;
            }

            // 1. Tìm tài liệu (Document) theo mã code
            const codeRef = doc(db, 'access_codes', code);
            const codeSnap = await getDoc(codeRef);

            if (!codeSnap.exists()) {
                setError('Mã truy cập không hợp lệ. Vui lòng kiểm tra lại.');
                setIsLoading(false);
                return;
            }

            const data = codeSnap.data();
            const now = new Date();
            const expiryDate = new Date(data.expiryDate); 

            // 2. KIỂM TRA ĐIỀU KIỆN
            if (data.used === true) {
                setError('Mã này đã được sử dụng (đã kích hoạt).');
                setIsLoading(false);
                return;
            }
            if (now > expiryDate) {
                setError(`Mã đã hết hạn sử dụng (${data.expiryDate}).`);
                setIsLoading(false);
                return;
            }
            
            // 3. ĐĂNG NHẬP VÀ KÍCH HOẠT
            
            // Đăng nhập bằng Guest User
            await signInAnonymously(auth); 

            // Cập nhật Database: Đánh dấu mã đã sử dụng
            await updateDoc(codeRef, {
                used: true,
                usedDate: now.toISOString(),
                usedByUID: auth.currentUser ? auth.currentUser.uid : 'anonymous' // Lưu UID
            });

            // 4. Chuyển hướng
            navigate('/'); 

        } catch (err) {
            console.error("Lỗi gốc Firebase:", err);
            // Xử lý các lỗi phổ biến (ví dụ: lỗi mạng hoặc lỗi Auth)
            if (err.code === 'permission-denied') {
                setError('Lỗi kết nối cơ sở dữ liệu. Vui lòng kiểm tra quy tắc bảo mật Firestore.');
            } else {
                setError('Có lỗi hệ thống xảy ra, không thể xác thực mã.');
            }
        } finally {
            setIsLoading(false);
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
                    disabled={isLoading}
                />
                
                <button type="submit" disabled={isLoading}>
                    {isLoading ? 'Đang xác thực...' : 'Sử Dụng Mã'}
                </button>

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