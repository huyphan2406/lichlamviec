// File: /api/get-groups.js
// API để lấy thông tin Group Host và Group Brand từ Google Sheet

import Papa from 'papaparse';

// Link CSV export từ Google Sheet Group H&B
const GROUPS_CSV_URL = 'https://docs.google.com/spreadsheets/d/1sgDT3E2kTsz5Ph6XeuXhZZKpdwtFDb4ncoUm6Q7UEYY/export?format=csv&gid=0';

// Hàm normalize tên để so sánh (bỏ dấu, lowercase)
const normalizeName = (name) => {
  if (!name) return '';
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
};

// Hàm fetch và parse CSV
async function fetchGroupsData() {
  const response = await fetch(GROUPS_CSV_URL);
  
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

// Hàm tạo map từ tên host -> link Zalo
function createGroupsMap(rawData) {
  const groupsMap = new Map();
  
  rawData.forEach(row => {
    const hostName = row['TÊN HOST'] || row['TEN HOST'] || '';
    const zaloLink = row['LINK DÉP LÀO'] || row['LINK DEP LAO'] || '';
    
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
    // 1. Tải và phân tích CSV
    const rawData = await fetchGroupsData();
    
    // 2. Tạo map từ tên host -> link Zalo
    const groupsMap = createGroupsMap(rawData);
    
    // 3. Chuyển Map thành Object để JSON serialize
    const groupsObject = {};
    groupsMap.forEach((value, key) => {
      groupsObject[key] = value;
    });
    
    // 4. Đặt Cache Header (refresh mỗi 60s)
    response.setHeader(
      'Cache-Control',
      'public, s-maxage=60, stale-while-revalidate=120'
    );
    
    // 5. Trả về dữ liệu JSON
    response.status(200).json({
      groups: groupsObject,
      count: groupsMap.size
    });
    
  } catch (error) {
    console.error("Lỗi trong API get-groups:", error.message);
    response.status(500).json({ 
      error: 'Không thể tải dữ liệu groups. Kiểm tra quyền truy cập Google Sheet.',
      groups: {},
      count: 0
    });
  }
}

