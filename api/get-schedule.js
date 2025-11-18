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

// 🌟🌟🌟 HÀM FETCH DỮ LIỆU (TỐI ƯU TỐC ĐỘ) 🌟🌟🌟
async function fetchData() {
    // 1. Fetch với timeout và tối ưu
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // Timeout 5 giây (giảm từ 10s)
    
    try {
        const response = await fetch(CSV_URL, {
            signal: controller.signal,
            headers: {
                'Accept': 'text/csv',
                'Cache-Control': 'no-cache'
            },
            keepalive: true // Tối ưu connection
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch CSV: ${response.statusText}`);
        }
        
        const csvText = await response.text();

        // 2. Dùng PapaParse với chế độ tối ưu tốc độ
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
                    console.error("Lỗi Papa.parse:", err);
                    reject(err);
                }
            });
        });
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('Request timeout: CSV fetch quá chậm');
        }
        throw error;
    }
}

// ----------------------------------------------------
// 🌟 HÀM API CHÍNH CỦA VERCEL (Giữ nguyên)
// ----------------------------------------------------
export default async function handler(request, response) {
  try {
    // 1. Tải và phân tích CSV (trên máy chủ Vercel)
    const rawData = await fetchData();
    
    // 2. Xử lý và trích xuất (Tối ưu với single pass)
    const validData = [];
    const datesSet = new Set();
    const sessionsMap = new Map();
    const storesMap = new Map();
    
    // Single pass để tối ưu
    for (const row of rawData) {
      if (row['Date livestream'] && row['Date livestream'].includes('/')) {
        validData.push(row);
        const date = row['Date livestream'];
        if (date) datesSet.add(date);
        
        const session = (row['Type of session'] || '').trim();
        if (session && session !== 'nan') {
          const lower = session.toLowerCase();
          if (!sessionsMap.has(lower)) sessionsMap.set(lower, session);
        }
        
        const store = (row['Store'] || '').trim();
        if (store && store !== 'nan') {
          const lower = store.toLowerCase();
          if (!storesMap.has(lower)) storesMap.set(lower, store);
        }
      }
    }
    
    // Sort một lần
    const sortedData = validData.sort((a, b) => {
      const dtA = parseDate(a['Date livestream'], a['Time slot']);
      const dtB = parseDate(b['Date livestream'], b['Time slot']);
      return dtA - dtB;
    });

    const uniqueDates = Array.from(datesSet);
    const uniqueSessions = Array.from(sessionsMap.values());
    const uniqueStores = Array.from(storesMap.values());
    
    const processedData = {
        jobs: sortedData,
        dates: uniqueDates,
        sessions: uniqueSessions,
        stores: uniqueStores
    };

    // 3. Đặt Cache Header (Tối ưu)
    response.setHeader(
        'Cache-Control',
        'public, s-maxage=300, stale-while-revalidate=600, max-age=60'
    );
    // s-maxage=300: CDN cache 5 phút
    // stale-while-revalidate=600: Serve stale data trong 10 phút khi đang revalidate
    // max-age=60: Browser cache 1 phút
    
    // 4. Trả về dữ liệu JSON
    response.status(200).json(processedData);
    
  } catch (error) {
    // 5. Nếu có lỗi (kể cả lỗi fetch), trả về lỗi 500
    console.error("Lỗi trong API handler:", error.message);
    response.status(500).json({ error: 'Không thể tải dữ liệu lịch. Kiểm tra quyền truy cập Google Sheet.' });
  }
}