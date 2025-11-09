// File: /api/get-schedule.js

import Papa from 'papaparse';

const CSV_URL = 'https://docs.google.com/spreadsheets/d/1716aQ1XqHDiHB4LHSClVYglY0Cgf60TVJ7RYjqlwsOM/export?format=csv&gid=2068764011';

// --- CÁC HÀM HỖ TRỢ (Copy từ App.jsx) ---
const parseDate = (dateStr, timeStr) => {
  try {
    const [day, month, year] = dateStr.split('/');
    const startTime = (timeStr || '00:00').split(' - ')[0];
    const [hour, minute] = startTime.split(':');
    return new Date(year, month - 1, day, hour, minute);
  } catch (e) { return new Date(0); }
};

const getUniqueItems = (list) => {
    const itemMap = new Map();
    list.forEach(item => {
        const lowerCase = item.toLowerCase();
        if (!itemMap.has(lowerCase)) {
            itemMap.set(lowerCase, item);
        }
    });
    return Array.from(itemMap.values());
};

// 🌟🌟🌟 HÀM FETCH DỮ LIỆU (ĐÃ SỬA LỖI) 🌟🌟🌟
async function fetchData() {
    // 1. Tải dữ liệu CSV về dưới dạng văn bản (text)
    // (Đây là cách server (Node.js) fetch dữ liệu)
    const response = await fetch(CSV_URL);
    
    if (!response.ok) {
        // Nếu không tải được (ví dụ: Google Sheet CHƯA CHIA SẺ CÔNG KHAI)
        throw new Error(`Failed to fetch CSV: ${response.statusText}`);
    }
    
    const csvText = await response.text();

    // 2. Dùng PapaParse để phân tích (parse) đoạn text đó
    return new Promise((resolve, reject) => {
        Papa.parse(csvText, { // 👈 Phân tích text, không download
            header: true,
            skipEmptyLines: true,
            dynamicTyping: false,
            transformHeader: (header) => header.replace(/\ufeff/g, '').trim(),
            complete: (results) => {
                resolve(results.data);
            },
            error: (err) => {
                console.error("Lỗi Papa.parse trên server:", err);
                reject(err);
            }
        });
    });
}

// ----------------------------------------------------
// 🌟 HÀM API CHÍNH CỦA VERCEL (Giữ nguyên)
// ----------------------------------------------------
export default async function handler(request, response) {
  try {
    // 1. Tải và phân tích CSV (trên máy chủ Vercel)
    const rawData = await fetchData();
    
    // 2. Xử lý và trích xuất
    const validData = rawData.filter(row => row['Date livestream'] && row['Date livestream'].includes('/'));
    
    const sortedData = validData.sort((a, b) => {
      const dtA = parseDate(a['Date livestream'], a['Time slot']);
      const dtB = parseDate(b['Date livestream'], b['Time slot']);
      return dtA - dtB;
    });

    const uniqueDates = [...new Set(sortedData.map(job => job['Date livestream']).filter(Boolean))];
    
    const sessionsList = sortedData.map(job => (job['Type of session'] || '').trim()).filter(s => s && s !== 'nan');
    const storesList = sortedData.map(job => (job['Store'] || '').trim()).filter(s => s && s !== 'nan');

    const uniqueSessions = getUniqueItems(sessionsList);
    const uniqueStores = getUniqueItems(storesList);
    
    const processedData = {
        jobs: sortedData,
        dates: uniqueDates,
        sessions: uniqueSessions,
        stores: uniqueStores
    };

    // 3. Đặt Cache Header
    response.setHeader(
        'Cache-Control',
        'public, s-maxage=600, stale-while-revalidate=1200'
    );
    
    // 4. Trả về dữ liệu JSON
    response.status(200).json(processedData);
    
  } catch (error) {
    // 5. Nếu có lỗi (kể cả lỗi fetch), trả về lỗi 500
    console.error("Lỗi trong API handler:", error.message);
    response.status(500).json({ error: 'Không thể tải dữ liệu lịch. Kiểm tra quyền truy cập Google Sheet.' });
  }
}