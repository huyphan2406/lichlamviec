// functions/index.js (CẬP NHẬT: Xử lý mã thủ công)

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid'); 

admin.initializeApp();
const db = admin.firestore();

const ADMIN_SECRET_CODE = 'HUYADMIN2026'; 

// Hàm trợ giúp tính toán ngày hết hạn (YYYY-MM-DD)
function getExpiryDate(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

exports.generateAccessCode = functions.https.onCall(async (data, context) => {
    
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Yêu cầu đăng nhập để tạo mã.');
    }

    // KIỂM TRA MÃ BÍ MẬT ADMIN
    const secretCode = data.secretCode;
    if (secretCode !== ADMIN_SECRET_CODE) {
        throw new functions.https.HttpsError('permission-denied', 'Mã bí mật Admin không chính xác.');
    }

    // LẤY DỮ LIỆU ĐẦU VÀO
    const days = data.days || 365;
    const manualCode = data.manualCode; // 🌟 LẤY MÃ THỦ CÔNG 🌟

    if (typeof days !== 'number' || days < 1) {
        throw new functions.https.HttpsError('invalid-argument', 'Số ngày không hợp lệ.');
    }
    
    // 🌟 1. TẠO MÃ HOẶC DÙNG MÃ THỦ CÔNG 🌟
    let finalCode;
    if (manualCode && manualCode.length > 0) {
        finalCode = manualCode.toUpperCase().trim();
        
        // Kiểm tra xem mã thủ công đã tồn tại chưa
        const existingDoc = await db.collection('code').doc(finalCode).get();
        if (existingDoc.exists) {
            throw new functions.https.HttpsError('already-exists', `Mã thủ công "${finalCode}" đã tồn tại. Vui lòng chọn mã khác.`);
        }
    } else {
        // Tạo mã ngẫu nhiên nếu mã thủ công không được cung cấp
        finalCode = uuidv4().toUpperCase().replace(/-/g, '').substring(0, 10); 
    }
    
    // 2. TÍNH TOÁN NGÀY HẾT HẠN
    const expiryDate = getExpiryDate(days);
    
    // 3. GHI VÀO FIRESTORE (Collection: 'code')
    try {
        await db.collection('code').doc(finalCode).set({
            activeUID: "", 
            expiryDate: expiryDate,
            createdByUID: context.auth.uid,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // 4. TRẢ VỀ MÃ CODE
        return { 
            status: 'success', 
            code: finalCode, // Trả về mã cuối cùng đã dùng
            expiry: expiryDate
        };
        
    } catch (error) {
        functions.logger.error("Lỗi ghi Firestore:", error);
        throw new functions.https.HttpsError('internal', 'Lỗi Database, không thể tạo mã.');
    }
});

