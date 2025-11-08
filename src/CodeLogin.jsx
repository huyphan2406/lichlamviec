// src/CodeLogin.jsx (ĐÃ XÓA TRƯỜNG 'used' - CHO PHÉP DÙNG NHIỀU LẦN)

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

            // 2. KIỂM TRA HẠN SỬ DỤNG (Đây là kiểm tra duy nhất còn lại)
            if (now > expiryDate) {
                setError(`Mã đã hết hạn sử dụng (${data.expiryDate}).`);
                setIsLoading(false);
                return;
            }
            
            // 3. ĐĂNG NHẬP (Không kiểm tra 'used')
            await signInAnonymously(auth); 

            // 4. Cập nhật Database (Không đánh dấu used, chỉ lưu lại lần sử dụng gần nhất)
            await updateDoc(codeRef, {
                lastUsedDate: now.toISOString(), // Lưu lại lần sử dụng cuối
                lastUsedByUID: auth.currentUser ? auth.currentUser.uid : 'anonymous'
            });

            // 5. Chuyển hướng
            navigate('/'); 

        } catch (err) {
            console.error("Lỗi gốc Firebase:", err);
            // Cải thiện thông báo lỗi cho người dùng
            if (err.code === 'permission-denied') {
                setError('Lỗi quyền truy cập. Kiểm tra Rules hoặc kết nối.');
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