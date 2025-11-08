// src/CodeLogin.jsx (ĐĂNG NHẬP BẰNG MÃ CODE)

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

            // 1. 🚫 KIỂM TRA PHIÊN HOẠT ĐỘNG (ACTIVE SESSION) 🚫
            if (data.activeUID && data.activeUID !== null) {
                // Trả về lỗi rõ ràng khi mã đang được dùng ở thiết bị khác
                setError('Mã này hiện đang được sử dụng trên một thiết bị khác. Vui lòng đăng xuất thiết bị đó trước khi đăng nhập tại đây.');
                setIsLoading(false);
                return;
            }
            
            // 2. KIỂM TRA HẠN SỬ DỤNG
            if (now > expiryDate) {
                setError(`Mã đã hết hạn sử dụng (${data.expiryDate}).`);
                setIsLoading(false);
                return;
            }
            
            // 3. ĐĂNG NHẬP (Tạo Guest User mới)
            const userCredential = await signInAnonymously(auth); 
            const newUID = userCredential.user.uid;

            // 4. CẬP NHẬT DATABASE: Đánh dấu mã đang được dùng bởi UID mới này
            await updateDoc(codeRef, {
                activeUID: newUID, // 👈 Đặt UID mới vào activeUID
                lastUsedDate: now.toISOString(),
            });

            // 5. Chuyển hướng
            navigate('/'); 

        } catch (err) {
            console.error("Lỗi gốc Firebase:", err);
            
            // 🌟 XỬ LÝ LỖI RÕ RÀNG HƠN 🌟
            if (err.code === 'permission-denied') {
                setError('Lỗi quyền truy cập Database. Vui lòng kiểm tra lại Quy tắc bảo mật Firestore.');
            } else if (err.code === 'auth/operation-not-allowed') {
                setError('Lỗi cấu hình Firebase Auth. Vui lòng bật phương thức đăng nhập "Ẩn danh".');
            } else {
                setError('Có lỗi hệ thống xảy ra, không thể xác thực mã. Vui lòng thử lại.');
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