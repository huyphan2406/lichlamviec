// File: /api/get-groups.js
// API để lấy thông tin Group Host và Group Brand từ Google Sheet

import Papa from 'papaparse';

// Link CSV export từ Google Sheet
const GROUP_HOST_CSV_URL = 'https://docs.google.com/spreadsheets/d/1sgDT3E2kTsz5Ph6XeuXhZZKpdwtFDb4ncoUm6Q7UEYY/export?format=csv&gid=0';
const GROUP_BRAND_CSV_URL = 'https://docs.google.com/spreadsheets/d/1sgDT3E2kTsz5Ph6XeuXhZZKpdwtFDb4ncoUm6Q7UEYY/export?format=csv&gid=1406781907';
// Hàm normalize brand name - xử lý viết tắt và format đặc biệt (GIỐNG HỆT FRONTEND)
// Xử lý các format: "ADIVA- TIKTOK", "ANESSA - TTS", "JUDYDOLLSHP", "MONDELEZ", "ROHTO - TTS (SC +HB)"
const normalizeBrandName = (name) => {
    if (!name) return name;
    
    let normalized = String(name).toLowerCase();
    
    // Bước 1: Xử lý ngoặc đơn TRƯỚC (để xử lý nội dung bên trong)
    // "ROHTO - TTS (SC +HB)" -> "ROHTO - TTS SC +HB"
    normalized = normalized.replace(/\(([^)]+)\)/g, (match, content) => {
        // Xử lý nội dung trong ngoặc: thay dấu + thành space
        const cleanedContent = content.replace(/\+/g, ' ').trim();
        return ' ' + cleanedContent;
    });
    
    // Bước 2: Xử lý viết tắt platform (phải làm trước khi xóa ký tự đặc biệt)
    // Xử lý cả word boundary và không có word boundary (cho trường hợp "JUDYDOLLSHP")
    // Thử word boundary trước (chính xác hơn)
    normalized = normalized
        .replace(/\btts\b/g, 'tiktok')
        .replace(/\bshp\b/g, 'shopee')
        .replace(/\blaz\b/g, 'lazada')
        .replace(/\becom\b/g, 'ecommerce');
    
    // Xử lý trường hợp không có word boundary (ví dụ: "judydollshp" ở cuối)
    // Chỉ xử lý nếu không có dấu cách trước (để tránh match sai)
    normalized = normalized
        .replace(/([a-z])tts(?![a-z])/g, '$1tiktok')  // "judydolltts" -> "judydolltiktok" (không match)
        .replace(/([a-z])shp(?![a-z])/g, '$1shopee')  // "judydollshp" -> "judydollshopee"
        .replace(/([a-z])laz(?![a-z])/g, '$1lazada')
        .replace(/([a-z])ecom(?![a-z])/g, '$1ecommerce');
    
    // Bước 3: Xử lý dấu "+" (brand1+brand2 -> brand1 brand2)
    normalized = normalized.replace(/\+/g, ' ');
    
    // Bước 4: Xử lý dấu "&" (SENSODYNE & CENTRUM -> SENSODYNE CENTRUM)
    normalized = normalized.replace(/&/g, ' ');
    
    // Bước 5: Xử lý dấu "/" (TTS/SHP/LAZ -> TTS SHP LAZ)
    normalized = normalized.replace(/\//g, ' ');
    
    // Bước 6: Xử lý dấu "-" và "|" thành space (xử lý cả "ADIVA- TIKTOK" và "ANESSA - TTS")
    normalized = normalized.replace(/[-|]/g, ' ');
    
    // Bước 7: Loại bỏ khoảng trắng thừa và trim
    normalized = normalized.replace(/\s+/g, ' ').trim();
    
    return normalized;
};

// Hàm normalize tên để so sánh (CHO HOST - không xử lý viết tắt)
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
function createGroupsMap(rawData, type = 'unknown') {
    const groupsMap = new Map();
    
    // Tên cột tiềm năng đã được chuẩn hóa (dùng để tìm kiếm)
    // Lưu ý: Brand sheet dùng "GROUP BRAND" và "LINK", Host sheet có thể dùng tên khác
    const NAME_KEYS = ['group brand', 'tên host', 'ten host', 'tên brand', 'ten brand', 'name', 'tên', 'mc name', 'brand name', 'ten brand name'];
    const LINK_KEYS = ['link', 'link dép lào', 'link dep lao', 'link zalo', 'zalo link', 'link zalo group', 'zalo group link'];
    
    // DEBUG: Log tên cột của row đầu tiên
    if (rawData.length > 0) {
        const firstRow = rawData[0];
        const firstRowKeys = Object.keys(firstRow);
        console.log(`🔍 [API] ${type} - First row keys:`, firstRowKeys);
        console.log(`🔍 [API] ${type} - First row keys normalized:`, firstRowKeys.map(k => normalizeName(k)));
    }
    
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

    let processedCount = 0;
    let skippedCount = 0;
    
    rawData.forEach((row, index) => {
        // Lấy giá trị tên và link bằng cách tìm kiếm tên cột khớp
        const hostName = findMatchingKey(row, NAME_KEYS);
        const zaloLink = findMatchingKey(row, LINK_KEYS);
        
        // DEBUG: Log row đầu tiên để xem tại sao không match
        if (index === 0) {
            console.log(`🔍 [API] ${type} - First row debug:`, {
                hostName,
                zaloLink,
                hasHostName: !!hostName,
                hasZaloLink: !!zaloLink,
                rowKeys: Object.keys(row)
            });
        }
        
        if (hostName && zaloLink) {
            // Sử dụng normalizeBrandName cho brand groups, normalizeName cho host groups
            const normalizedName = type.toUpperCase() === 'BRAND' 
                ? normalizeName(normalizeBrandName(hostName)) // Brand: normalize brand name trước, rồi normalize chuẩn
                : normalizeName(hostName); // Host: chỉ normalize chuẩn
            // Lưu cả tên gốc và link
            groupsMap.set(normalizedName, {
                originalName: hostName,
                link: zaloLink
            });
            processedCount++;
        } else {
            skippedCount++;
        }
    });
    
    console.log(`🔍 [API] ${type} - Processed: ${processedCount}, Skipped: ${skippedCount}, Total rows: ${rawData.length}`);
    
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
        
        // DEBUG: Log raw data
        console.log('🔍 [API] Raw Host Data rows:', hostData.length);
        console.log('🔍 [API] Raw Brand Data rows:', brandData.length);
        if (brandData.length > 0) {
            console.log('🔍 [API] First Brand row:', brandData[0]);
            console.log('🔍 [API] Brand row keys:', Object.keys(brandData[0] || {}));
        }
        
        // 2. Tạo map từ tên -> link Zalo cho cả Host và Brand
        const hostGroupsMap = createGroupsMap(hostData, 'HOST');
        const brandGroupsMap = createGroupsMap(brandData, 'BRAND');
        
        // DEBUG: Log map sizes
        console.log('🔍 [API] Host Groups Map size:', hostGroupsMap.size);
        console.log('🔍 [API] Brand Groups Map size:', brandGroupsMap.size);
        if (brandGroupsMap.size > 0) {
            const firstBrandKey = Array.from(brandGroupsMap.keys())[0];
            console.log('🔍 [API] First Brand key:', firstBrandKey);
            console.log('🔍 [API] First Brand data:', brandGroupsMap.get(firstBrandKey));
        }
        
        // 3. Chuyển Map thành Object để JSON serialize
        const hostGroupsObject = {};
        hostGroupsMap.forEach((value, key) => {
            hostGroupsObject[key] = value;
        });
        
        const brandGroupsObject = {};
        brandGroupsMap.forEach((value, key) => {
            brandGroupsObject[key] = value;
        });
        
        // DEBUG: Log final objects
        console.log('🔍 [API] Host Groups Object keys:', Object.keys(hostGroupsObject).length);
        console.log('🔍 [API] Brand Groups Object keys:', Object.keys(brandGroupsObject).length);
        
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