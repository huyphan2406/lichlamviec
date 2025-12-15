// File: /api/get-groups.js
// API để lấy thông tin Group Host và Group Brand từ Google Sheet

import Papa from 'papaparse';

// Link CSV export từ Google Sheet
const GROUP_HOST_CSV_URL = 'https://docs.google.com/spreadsheets/d/1a8zFG87DJxToDUk0UjVJsh8S24TW6DVoU9uROn4IpUA/export?format=csv&gid=0';
const GROUP_BRAND_CSV_URL = 'https://docs.google.com/spreadsheets/d/1a8zFG87DJxToDUk0UjVJsh8S24TW6DVoU9uROn4IpUA/export?format=csv&gid=1486029985';

// Hàm normalize brand name - xử lý viết tắt và format đặc biệt
const normalizeBrandName = (name) => {
    if (!name) return name;
    
    let normalized = String(name).toLowerCase();
    
    // Xóa dấu ngoặc vuông
    normalized = normalized.replace(/\[|\]/g, '');
    
    // Xử lý ngoặc đơn
    normalized = normalized.replace(/\(([^)]+)\)/g, (match, content) => {
        const cleanedContent = content.replace(/\+/g, ' ').trim();
        return ' ' + cleanedContent;
    });
    
    // Xử lý viết tắt platform
    normalized = normalized
        .replace(/\btts\b/g, 'tiktok')
        .replace(/\bshp\b/g, 'shopee')
        .replace(/\blaz\b/g, 'lazada')
        .replace(/\becom\b/g, 'ecommerce')
        .replace(/([a-z])tts(?![a-z])/g, '$1tiktok')
        .replace(/([a-z])shp(?![a-z])/g, '$1shopee')
        .replace(/([a-z])laz(?![a-z])/g, '$1lazada')
        .replace(/([a-z])ecom(?![a-z])/g, '$1ecommerce');
    
    // Xử lý các ký tự đặc biệt
    normalized = normalized
        .replace(/\+/g, ' ')
        .replace(/&/g, ' ')
        .replace(/\//g, ' ')
        .replace(/[-|]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    
    return normalized;
};

// Hàm normalize tên để so sánh
const normalizeName = (name) => {
    if (!name) return '';
    
    let str = String(name);
    str = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    str = str.replace(/đ/g, "d").replace(/Đ/g, "D");
    str = str.toLowerCase();
    str = str.replace(/[^a-z\s]/g, '');
    str = str.replace(/\s+/g, ' ').trim();
    
    return str;
};

// Hàm fetch và parse CSV
async function fetchGroupsData(csvUrl) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
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
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('Request timeout: Groups CSV fetch quá chậm');
        }
        throw error;
    }
}

// Hàm tìm cột name và link một cách linh hoạt
function findColumns(row, type = 'unknown') {
    const columns = Object.keys(row);
    let nameColumn = null;
    let linkColumn = null;
    
    // Ưu tiên tìm chính xác tên cột theo format thực tế
    // Host: "Tên Host" và "Link group Zalo"
    // Brand: "STORE" và "LINK GROUP ZALO"
    
    // Tìm name column - ưu tiên match chính xác
    const exactNameMatches = {
        'HOST': ['Tên Host', 'Ten Host', 'tên host', 'ten host'],
        'BRAND': ['STORE', 'Store', 'store']
    };
    
    // Tìm link column - ưu tiên match chính xác
    const exactLinkMatches = {
        'HOST': ['Link group Zalo', 'Link Group Zalo', 'link group zalo'],
        'BRAND': ['LINK GROUP ZALO', 'Link Group Zalo', 'link group zalo']
    };
    
    const typeUpper = type.toUpperCase();
    
    // Tìm name column - ưu tiên exact match
    if (exactNameMatches[typeUpper]) {
        for (const col of columns) {
            if (exactNameMatches[typeUpper].includes(col)) {
                nameColumn = col;
                break;
            }
        }
    }
    
    // Nếu không tìm thấy exact match, dùng pattern
    if (!nameColumn) {
        const namePatterns = [
            /^(tên|ten)\s*host$/i,  // "Tên Host"
            /^store$/i,              // "STORE"
            /^(group\s*)?brand$/i,
            /^(host|brand|mc|talent)\s*name$/i,
            /^name$/i,
            /^(ten|tên)$/i,
            /^(group|nhóm)\s*name$/i
        ];
        
        for (const col of columns) {
            const normalizedCol = normalizeName(col);
            for (const pattern of namePatterns) {
                if (pattern.test(normalizedCol) || pattern.test(col)) {
                    nameColumn = col;
                    break;
                }
            }
            if (nameColumn) break;
        }
    }
    
    // Nếu vẫn không tìm thấy, dùng keyword match
    if (!nameColumn) {
        const nameKeywords = typeUpper === 'HOST' 
            ? ['ten', 'tên', 'host', 'name']
            : ['store', 'brand', 'name'];
        for (const col of columns) {
            const normalizedCol = normalizeName(col);
            if (nameKeywords.some(keyword => normalizedCol.includes(keyword))) {
                nameColumn = col;
                break;
            }
        }
    }
    
    // Tìm link column - ưu tiên exact match
    if (exactLinkMatches[typeUpper]) {
        for (const col of columns) {
            if (exactLinkMatches[typeUpper].includes(col)) {
                linkColumn = col;
                break;
            }
        }
    }
    
    // Nếu không tìm thấy exact match, dùng pattern
    if (!linkColumn) {
        const linkPatterns = [
            /^link\s*group\s*zalo$/i,  // "Link group Zalo" hoặc "LINK GROUP ZALO"
            /^link$/i,
            /^link\s*(zalo|group|nhóm)?$/i,
            /^(zalo|group)\s*link$/i,
            /^url$/i,
            /^link\s*dep\s*lao$/i,
            /^zalo$/i
        ];
        
        for (const col of columns) {
            const normalizedCol = normalizeName(col);
            for (const pattern of linkPatterns) {
                if (pattern.test(normalizedCol) || pattern.test(col)) {
                    linkColumn = col;
                    break;
                }
            }
            if (linkColumn) break;
        }
    }
    
    // Nếu vẫn không tìm thấy, dùng keyword match
    if (!linkColumn) {
        const linkKeywords = ['link', 'url', 'zalo'];
        for (const col of columns) {
            const normalizedCol = normalizeName(col);
            if (linkKeywords.some(keyword => normalizedCol.includes(keyword))) {
                linkColumn = col;
                break;
            }
        }
    }
    
    return { nameColumn, linkColumn, allColumns: columns };
}

// Hàm validate và normalize link
function normalizeLink(link) {
    if (!link) return null;
    
    let cleanLink = String(link).trim();
    
    // Bỏ qua nếu quá ngắn
    if (cleanLink.length < 5) return null;
    
    // Nếu đã có http/https, giữ nguyên
    if (cleanLink.startsWith('http://') || cleanLink.startsWith('https://')) {
        try {
            new URL(cleanLink);
            return cleanLink;
        } catch {
            return null;
        }
    }
    
    // Nếu là zalo.me link, thêm https://
    if (cleanLink.includes('zalo.me') || cleanLink.includes('zalo')) {
        if (!cleanLink.startsWith('http')) {
            cleanLink = `https://${cleanLink}`;
        }
        try {
            new URL(cleanLink);
            return cleanLink;
        } catch {
            return null;
        }
    }
    
    // Thử thêm https:// cho các link khác
    try {
        const testUrl = `https://${cleanLink}`;
        new URL(testUrl);
        return testUrl;
    } catch {
        return null;
    }
}

// Hàm tạo map từ tên -> link Zalo
function createGroupsMap(rawData, type = 'unknown') {
    const groupsMap = new Map();
    
    if (!rawData || rawData.length === 0) {
        console.warn(`⚠️ [${type}] Không có dữ liệu CSV`);
        return groupsMap;
    }
    
    // Tìm cột name và link từ row đầu tiên
    const firstRow = rawData[0];
    const { nameColumn, linkColumn, allColumns } = findColumns(firstRow, type);
    
    console.log(`📋 [${type}] Tên cột trong CSV:`, allColumns);
    console.log(`🔍 [${type}] Tìm thấy cột NAME: "${nameColumn}", LINK: "${linkColumn}"`);
    
    if (!nameColumn || !linkColumn) {
        console.error(`❌ [${type}] Không tìm thấy đủ cột! NAME: ${nameColumn || 'MISSING'}, LINK: ${linkColumn || 'MISSING'}`);
        console.log(`📋 [${type}] Tất cả các cột:`, allColumns);
        return groupsMap;
    }
    
    let processedCount = 0;
    let skippedCount = 0;
    
    for (const row of rawData) {
        const rawName = row[nameColumn];
        const rawLink = row[linkColumn];
        
        if (!rawName || !rawLink) {
            skippedCount++;
            continue;
        }
        
        // Giữ nguyên tên gốc từ CSV - không trim, không normalize
        const originalName = String(rawName);
        const validLink = normalizeLink(rawLink);
        
        // Chỉ kiểm tra có giá trị, không trim
        if (!originalName || !validLink) {
            skippedCount++;
            continue;
        }
        
        // Normalize name để dùng làm key (chỉ để match, không ảnh hưởng originalName)
        const normalizedName = type.toUpperCase() === 'BRAND' 
            ? normalizeName(normalizeBrandName(originalName.trim()))
            : normalizeName(originalName.trim());
        
        if (!normalizedName) {
            skippedCount++;
            continue;
        }
        
        // Lưu vào map - originalName giữ nguyên 100% từ CSV
        // Nếu key đã tồn tại, chỉ update nếu tên mới ngắn hơn/đơn giản hơn (ưu tiên tên gốc đơn giản)
        const existing = groupsMap.get(normalizedName);
        if (existing) {
            // Ưu tiên tên ngắn hơn và đơn giản hơn (không có &, +, /)
            const existingLength = existing.originalName.length;
            const newLength = originalName.length;
            const existingHasSpecial = existing.originalName.includes('&') || existing.originalName.includes('+') || existing.originalName.includes('/');
            const newHasSpecial = originalName.includes('&') || originalName.includes('+') || originalName.includes('/');
            
            // Nếu entry mới ngắn hơn HOẶC (cùng độ dài nhưng entry mới không có ký tự đặc biệt mà entry cũ có)
            if (newLength < existingLength || (newLength === existingLength && !newHasSpecial && existingHasSpecial)) {
                // Entry mới tốt hơn, thay thế
                groupsMap.set(normalizedName, {
                    originalName: originalName, // Giữ nguyên, không trim
                    link: validLink
                });
            }
            // Nếu không, giữ nguyên entry cũ (tên ngắn hơn/đơn giản hơn)
        } else {
            // Key chưa tồn tại, thêm mới
            groupsMap.set(normalizedName, {
                originalName: originalName, // Giữ nguyên, không trim
                link: validLink
            });
        }
        processedCount++;
    }
    
    console.log(`📊 [${type}] Kết quả: ${groupsMap.size} groups hợp lệ, ${processedCount} processed, ${skippedCount} skipped, ${rawData.length} total rows`);
    
    if (groupsMap.size > 0) {
        console.log(`✅ Tìm thấy ${groupsMap.size} ${type} groups`);
    } else {
        console.warn(`⚠️ Không tìm thấy ${type} groups nào. Số dòng CSV: ${rawData.length}`);
    }
    
    return groupsMap;
}

// ----------------------------------------------------
// 🌟 HÀM API CHÍNH CỦA VERCEL
// ----------------------------------------------------
export default async function handler(request, response) {
    try {
        console.log('🚀 Bắt đầu fetch groups data...');
        
        // 1. Fetch cả 2 sheet song song (parallel)
        const [hostData, brandData] = await Promise.all([
            fetchGroupsData(GROUP_HOST_CSV_URL).catch(err => {
                console.error("❌ Lỗi fetch Group Host:", err);
                return [];
            }),
            fetchGroupsData(GROUP_BRAND_CSV_URL).catch(err => {
                console.error("❌ Lỗi fetch Group Brand:", err);
                return [];
            })
        ]);
        
        console.log(`📥 Fetched: Host=${hostData.length} rows, Brand=${brandData.length} rows`);
        
        // 2. Tạo map từ tên -> link Zalo cho cả Host và Brand
        const [hostGroupsMap, brandGroupsMap] = await Promise.all([
            Promise.resolve(createGroupsMap(hostData, 'HOST')),
            Promise.resolve(createGroupsMap(brandData, 'BRAND'))
        ]);
        
        // 3. Chuyển Map thành Object để JSON serialize
        const hostGroupsObject = Object.fromEntries(hostGroupsMap);
        const brandGroupsObject = Object.fromEntries(brandGroupsMap);
        
        // 4. Đặt Cache Header
        response.setHeader(
            'Cache-Control',
            'public, s-maxage=300, stale-while-revalidate=600, max-age=60'
        );
        response.setHeader('Content-Type', 'application/json; charset=utf-8');
        
        // 5. Trả về dữ liệu JSON
        console.log(`📊 API Response: Host=${hostGroupsMap.size}, Brand=${brandGroupsMap.size}`);
        
        response.status(200).json({
            hostGroups: hostGroupsObject,
            brandGroups: brandGroupsObject,
            hostCount: hostGroupsMap.size,
            brandCount: brandGroupsMap.size
        });
        
    } catch (error) {
        console.error("❌ Lỗi trong API get-groups:", error.message);
        console.error("Stack:", error.stack);
        response.status(500).json({ 
            error: 'Không thể tải dữ liệu groups. Kiểm tra quyền truy cập Google Sheet.',
            hostGroups: {},
            brandGroups: {},
            hostCount: 0,
            brandCount: 0
        });
    }
}
