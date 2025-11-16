// File: /api/get-groups.js
// API để lấy thông tin Group Host và Group Brand từ Google Sheet

import Papa from 'papaparse';

// Link CSV export từ Google Sheet
const GROUP_HOST_CSV_URL = 'https://docs.google.com/spreadsheets/d/1sgDT3E2kTsz5Ph6XeuXhZZKpdwtFDb4ncoUm6Q7UEYY/export?format=csv&gid=0';
const GROUP_BRAND_CSV_URL = 'https://docs.google.com/spreadsheets/d/1sgDT3E2kTsz5Ph6XeuXhZZKpdwtFDb4ncoUm6Q7UEYY/export?format=csv&gid=1406781907';
// Hàm normalize tên để so sánh
const normalizeName = (name) => {
    if (!name) return '';
    
    let str = String(name);
    str = str.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Bỏ dấu
    str = str.replace(/đ/g, "d").replace(/Đ/g, "D"); // Chuyển đổi đ/Đ
    str = str.toLowerCase(); // Chuyển sang chữ thường
    
    // (QUAN TRỌNG) Xóa tất cả các ký tự không phải chữ cái hoặc khoảng trắng
    // Loại bỏ: số (374), gạch dưới (_), gạch ngang (-), chấm (.), v.v.
    str = str.replace(/[^a-z\s]/g, ''); 
    
    str = str.replace(/\s+/g, ' '); // Thay thế nhiều khoảng trắng bằng 1
    return str.trim();
};

// Hàm fetch và parse CSV
async function fetchGroupsData(csvUrl) {
    const response = await fetch(csvUrl);
    
    if (!response.ok) {
        throw new Error(`Failed to fetch Groups CSV: ${response.statusText}`);
    }
    
    const csvText = await response.text();

    return new Promise((resolve, reject) => {
        Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: false,
            transformHeader: (header) => header.replace(/\ufeff/g, '').trim(),
            complete: (results) => {
                resolve(results.data);
            },
            error: (err) => {
                console.error("Lỗi Papa.parse Groups CSV:", err);
                reject(err);
            }
        });
    });
}

// Hàm tạo map từ tên -> link Zalo (Đã sửa lỗi dò tìm tên cột)
function createGroupsMap(rawData) {
    const groupsMap = new Map();
    
    // Tên cột tiềm năng đã được chuẩn hóa (dùng để tìm kiếm)
    const NAME_KEYS = ['tên host', 'ten host', 'tên brand', 'ten brand', 'name', 'tên', 'mc name']; // Thêm 'mc name' nếu cần
    const LINK_KEYS = ['link dép lào', 'link dep lao', 'link zalo', 'zalo link', 'link'];
    
    // Hàm tìm tên cột khớp (tìm giá trị trong row dựa trên danh sách khóa tiềm năng)
    const findMatchingKey = (row, potentialKeys) => {
        const rowKeys = Object.keys(row);
        for (const rowKey of rowKeys) {
            const normalizedRowKey = normalizeName(rowKey); // Chuẩn hóa tên cột của dữ liệu
            if (potentialKeys.includes(normalizedRowKey)) {
                return row[rowKey];
            }
        }
        return '';
    };

    rawData.forEach(row => {
        // Lấy giá trị tên và link bằng cách tìm kiếm tên cột khớp
        const hostName = findMatchingKey(row, NAME_KEYS);
        const zaloLink = findMatchingKey(row, LINK_KEYS);
        
        if (hostName && zaloLink) {
            const normalizedName = normalizeName(hostName);
            // Lưu cả tên gốc và link
            groupsMap.set(normalizedName, {
                originalName: hostName,
                link: zaloLink
            });
        }
    });
    
    return groupsMap;
}

// ----------------------------------------------------
// 🌟 HÀM API CHÍNH CỦA VERCEL
// ----------------------------------------------------
export default async function handler(request, response) {
    try {
        // 1. Fetch cả 2 sheet song song (parallel)
        const [hostData, brandData] = await Promise.all([
            fetchGroupsData(GROUP_HOST_CSV_URL).catch(err => {
                console.error("Lỗi fetch Group Host:", err);
                return [];
            }),
            fetchGroupsData(GROUP_BRAND_CSV_URL).catch(err => {
                console.error("Lỗi fetch Group Brand:", err);
                return [];
            })
        ]);
        
        // 2. Tạo map từ tên -> link Zalo cho cả Host và Brand
        const hostGroupsMap = createGroupsMap(hostData);
        const brandGroupsMap = createGroupsMap(brandData);
        
        // 3. Chuyển Map thành Object để JSON serialize
        const hostGroupsObject = {};
        hostGroupsMap.forEach((value, key) => {
            hostGroupsObject[key] = value;
        });
        
        const brandGroupsObject = {};
        brandGroupsMap.forEach((value, key) => {
            brandGroupsObject[key] = value;
        });
        
        // 4. Đặt Cache Header (refresh mỗi 60s)
        response.setHeader(
            'Cache-Control',
            'public, s-maxage=60, stale-while-revalidate=120'
        );
        
        // 5. Trả về dữ liệu JSON với cả Host và Brand
        response.status(200).json({
            hostGroups: hostGroupsObject,
            brandGroups: brandGroupsObject,
            hostCount: hostGroupsMap.size,
            brandCount: brandGroupsMap.size
        });
        
    } catch (error) {
        console.error("Lỗi trong API get-groups:", error.message);
        response.status(500).json({ 
            error: 'Không thể tải dữ liệu groups. Kiểm tra quyền truy cập Google Sheet.',
            hostGroups: {},
            brandGroups: {},
            hostCount: 0,
            brandCount: 0
        });
    }
}