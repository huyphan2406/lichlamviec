// src/CodeLogin.jsx (CHỈ MỘT PHIÊN ĐƯỢC PHÉP HOẠT ĐỘNG)

import { useState } from 'react';
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

            // 2. KIỂM TRA HẠN SỬ DỤNG
            if (now > expiryDate) {
                setError(`Mã đã hết hạn sử dụng (${data.expiryDate}).`);
                setIsLoading(false);
                return;
            }
            
            // 3. 🚫 KIỂM TRA PHIÊN HOẠT ĐỘNG 🚫
            if (data.activeUID && data.activeUID !== null) {
                setError('Mã này đang được sử dụng trên một thiết bị khác. Vui lòng đăng xuất thiết bị đó trước.');
                setIsLoading(false);
                return;
            }

            // 4. ĐĂNG NHẬP (Tạo Guest User mới)
            const userCredential = await signInAnonymously(auth); 
            const newUID = userCredential.user.uid;

            // 5. CẬP NHẬT DATABASE: Đánh dấu mã đang được dùng bởi UID mới này
            await updateDoc(codeRef, {
                // Đặt UID của người dùng mới này vào activeUID
                activeUID: newUID, 
                lastUsedDate: now.toISOString(),
            });

            // 6. Chuyển hướng
            navigate('/'); 

        } catch (err) {
            console.error("Lỗi gốc Firebase:", err);
            if (err.code === 'permission-denied') {
                setError('Lỗi quyền truy cập. Kiểm tra lại Quy tắc bảo mật Firestore.');
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