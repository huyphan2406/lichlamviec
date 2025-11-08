// src/AdminPanel.jsx (CẬP NHẬT: Thêm tùy chọn nhập mã thủ công)

import React, { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import app from './firebase'; 
import { useAuth } from './AuthContext.jsx'; 

function AdminPanel() {
    const { currentUser } = useAuth();
    const [days, setDays] = useState(365);
    const [secretCode, setSecretCode] = useState(''); 
    
    // 🌟 STATE MỚI CHO CODE THỦ CÔNG 🌟
    const [manualCode, setManualCode] = useState(''); 
    
    const [newCode, setNewCode] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const CORRECT_SECRET_CODE = 'HUYADMIN2026'; 
    
    const functions = getFunctions(app); 
    const generateCodeFunction = httpsCallable(functions, 'generateAccessCode');

    const handleGenerate = async () => {
        if (!currentUser) {
             setError('Vui lòng đăng nhập vào ứng dụng trước.');
             return;
        }
        
        if (secretCode !== CORRECT_SECRET_CODE) { 
            setError('Mã bí mật Admin không chính xác. Vui lòng kiểm tra lại.');
            return;
        }
        
        // 🌟 KIỂM TRA CODE THỦ CÔNG 🌟
        if (manualCode && manualCode.length < 5) {
             setError('Mã code thủ công phải dài ít nhất 5 ký tự.');
             return;
        }


        setIsLoading(true);
        setError('');
        setNewCode('');
        setExpiryDate('');
        
        try {
            // 🌟 GỬI CẢ MÃ THỦ CÔNG LÊN CLOUD FUNCTION 🌟
            const result = await generateCodeFunction({ 
                days: days,
                secretCode: secretCode,
                manualCode: manualCode.toUpperCase() // Gửi mã thủ công (nếu có)
            }); 
            
            if (result.data && result.data.code) {
                setNewCode(result.data.code);
                setExpiryDate(result.data.expiry);
                setSecretCode(''); // Xóa mã bí mật sau khi tạo code thành công
                setManualCode('');
            } else {
                // Lỗi trả về từ Cloud Function
                setError(`Lỗi tạo code: ${result.data.message || 'Lỗi không xác định'}. Mã lỗi: ${result.data.code}`);
            }
        } catch (err) {
            console.error("Lỗi Cloud Function:", err);
            // Hiển thị lỗi mạng hoặc lỗi hệ thống
            setError(`Lỗi kết nối: Vui lòng kiểm tra lại Cloud Function đã deploy chưa.`); 
        } finally {
            setIsLoading(false);
        }
    };

    if (!currentUser) {
        // ... (Giao diện không đăng nhập)
         return <div className="auth-container">
            <div className="auth-form" style={{textAlign: 'center', padding: '40px'}}>
                <h2 style={{color: 'var(--color-danger)'}}>Truy Cập Bị Từ Chối</h2>
                <p>Vui lòng đăng nhập vào ứng dụng để kiểm tra quyền Admin.</p>
            </div>
        </div>
    }


    return (
        <div className="auth-container">
            <div className="auth-form">
                <h2>Bảng Điều Khiển Admin (Tạo Code)</h2>
                {error && <p className="auth-error">{error}</p>}
                
                {/* TRƯỜNG NHẬP MÃ BÍ MẬT */}
                <div style={{marginBottom: '20px'}}>
                    <label style={{display: 'block', marginBottom: '8px', fontWeight: '600'}}>Mã Bí mật Admin:</label>
                    <input 
                        type="password"
                        placeholder="Nhập mã bí mật cố định"
                        value={secretCode} 
                        onChange={(e) => setSecretCode(e.target.value)} 
                        required
                        style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)'}}
                    />
                </div>

                {/* 🌟 TRƯỜNG NHẬP CODE THỦ CÔNG 🌟 */}
                <div style={{marginBottom: '20px'}}>
                    <label style={{display: 'block', marginBottom: '8px', fontWeight: '600'}}>
                        Mã Code Thủ Công (Tùy chọn):
                    </label>
                    <input 
                        type="text" 
                        placeholder="Để trống để tạo mã ngẫu nhiên..."
                        value={manualCode} 
                        onChange={(e) => setManualCode(e.target.value)} 
                        style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)'}}
                    />
                </div>
                
                {/* TRƯỜNG NHẬP SỐ NGÀY */}
                <div style={{marginBottom: '20px'}}>
                    <label style={{display: 'block', marginBottom: '8px', fontWeight: '600'}}>Số ngày kích hoạt:</label>
                    <input 
                        type="number" 
                        value={days} 
                        onChange={(e) => setDays(Number(e.target.value))} 
                        min="1"
                        style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)'}}
                    />
                </div>
                
                <button onClick={handleGenerate} disabled={isLoading || days < 1 || !secretCode}>
                    {isLoading ? 'Đang tạo...' : 'Tạo Mã Kích Hoạt Mới'}
                </button>
                
                {newCode && 
                    <div style={{marginTop: '25px', padding: '15px', backgroundColor: 'var(--color-brand-light)', border: '1px solid var(--color-brand)', borderRadius: '8px'}}>
                        <p style={{margin: 0, fontSize: '1.1em', fontWeight: 'bold', color: 'var(--color-brand)'}}>Mã Kích Hoạt:</p>
                        <code style={{fontSize: '1.4em', userSelect: 'all', fontWeight: 'bold'}}>{newCode}</code>
                        <p style={{margin: '5px 0 0 0', fontSize: '0.9em'}}>Hạn sử dụng: {expiryDate}</p>
                    </div>
                }
            </div>
        </div>
    );
}

export default AdminPanel;