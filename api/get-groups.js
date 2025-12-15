// File: /api/get-groups.js
// API để lấy thông tin Group Host và Group Brand từ Google Sheet

import Papa from 'papaparse';

// Link CSV export từ Google Sheet
// Source (view links):
// - Host: https://docs.google.com/spreadsheets/d/1a8zFG87DJxToDUk0UjVJsh8S24TW6DVoU9uROn4IpUA/edit?gid=0#gid=0
// - Brand: https://docs.google.com/spreadsheets/d/1a8zFG87DJxToDUk0UjVJsh8S24TW6DVoU9uROn4IpUA/edit?gid=1486029985#gid=1486029985
const SHEET_ID = '1a8zFG87DJxToDUk0UjVJsh8S24TW6DVoU9uROn4IpUA';
const GROUP_HOST_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;
const GROUP_BRAND_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=1486029985`;
// Hàm normalize brand name - xử lý viết tắt và format đặc biệt (GIỐNG HỆT FRONTEND)
// Xử lý các format: "ADIVA- TIKTOK", "ANESSA - TTS", "JUDYDOLLSHP", "MONDELEZ", "ROHTO - TTS (SC +HB)"
// "[ MUSTELA - SHP/TTS] TEAM LIVESTREAM INHOUSE" -> "mustela shopee tiktok team livestream inhouse"
const normalizeBrandName = (name) => {
    if (!name) return name;
    
    let normalized = String(name).toLowerCase();
    
    // Bước 0: Xử lý dấu ngoặc vuông [ ] (xóa hoàn toàn)
    // "[ MUSTELA - SHP/TTS] TEAM LIVESTREAM INHOUSE" -> " MUSTELA - SHP/TTS TEAM LIVESTREAM INHOUSE"
    normalized = normalized.replace(/\[|\]/g, '');
    
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
    
    // Bước 5: Xử lý dấu "/" (TTS/SHP/LAZ -> TTS SHP LAZ) - QUAN TRỌNG cho "SHP/TTS"
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

// Hàm fetch và parse CSV (Tối ưu tốc độ)
async function fetchGroupsData(csvUrl) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // Timeout 8 giây
    
    try {
        const response = await fetch(csvUrl, {
            signal: controller.signal,
            headers: {
                'Accept': 'text/csv',
                'Cache-Control': 'no-cache'
            }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch Groups CSV: ${response.statusText}`);
        }
        
        const csvText = await response.text();

        return new Promise((resolve, reject) => {
            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                dynamicTyping: false, // Tắt để parse nhanh hơn
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
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('Request timeout: Groups CSV fetch quá chậm');
        }
        throw error;
    }
}

// Hàm tạo map từ tên -> link Zalo (Đã sửa lỗi dò tìm tên cột)
function createGroupsMap(rawData, type = 'unknown') {
    const groupsMap = new Map();
    
    // Tên cột tiềm năng đã được chuẩn hóa (dùng để tìm kiếm)
    // Lưu ý: Brand sheet dùng "GROUP BRAND" và "LINK", Host sheet có thể dùng tên khác
    const NAME_KEYS = ['group brand', 'tên host', 'ten host', 'tên brand', 'ten brand', 'name', 'tên', 'mc name', 'brand name', 'ten brand name'];
    const LINK_KEYS = ['link', 'link dép lào', 'link dep lao', 'link zalo', 'zalo link', 'link zalo group', 'zalo group link'];
    
    // Tối ưu: Cache normalized keys để tránh normalize nhiều lần
    const normalizedNameKeys = new Set(NAME_KEYS);
    const normalizedLinkKeys = new Set(LINK_KEYS);
    
    // Hàm tìm tên cột khớp (tối ưu với Set lookup)
    const findMatchingKey = (row, potentialKeysSet) => {
        for (const rowKey of Object.keys(row)) {
            const normalizedRowKey = normalizeName(rowKey);
            if (potentialKeysSet.has(normalizedRowKey)) {
                return row[rowKey];
            }
        }
        return '';
    };

    // Xử lý dữ liệu (bỏ debug logs để tăng tốc)
    for (const row of rawData) {
        const hostName = findMatchingKey(row, normalizedNameKeys);
        const zaloLink = findMatchingKey(row, normalizedLinkKeys);
        
        if (hostName && zaloLink) {
            const normalizedName = type.toUpperCase() === 'BRAND' 
                ? normalizeName(normalizeBrandName(hostName))
                : normalizeName(hostName);
            groupsMap.set(normalizedName, {
                originalName: hostName,
                link: zaloLink
            });
        }
    }
    
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
        
        // 2. Tạo map từ tên -> link Zalo cho cả Host và Brand (song song)
        const [hostGroupsMap, brandGroupsMap] = await Promise.all([
            Promise.resolve(createGroupsMap(hostData, 'HOST')),
            Promise.resolve(createGroupsMap(brandData, 'BRAND'))
        ]);
        
        // 3. Chuyển Map thành Object để JSON serialize (tối ưu)
        const hostGroupsObject = Object.fromEntries(hostGroupsMap);
        const brandGroupsObject = Object.fromEntries(brandGroupsMap);
        
        // 4. Đặt Cache Header (tối ưu)
        response.setHeader(
            'Cache-Control',
            'public, s-maxage=300, stale-while-revalidate=600, max-age=60'
        );
        response.setHeader('Content-Type', 'application/json; charset=utf-8');
        
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