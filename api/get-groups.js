// File: /api/get-groups.js
// API để lấy thông tin Group Host và Group Brand từ Google Sheet

import Papa from 'papaparse';

// Link CSV export từ Google Sheet
// gid=0: Group Host
// gid=1406781907: Group Brand
const GROUP_HOST_CSV_URL = 'https://docs.google.com/spreadsheets/d/1sgDT3E2kTsz5Ph6XeuXhZZKpdwtFDb4ncoUm6Q7UEYY/export?format=csv&gid=0';
const GROUP_BRAND_CSV_URL = 'https://docs.google.com/spreadsheets/d/1sgDT3E2kTsz5Ph6XeuXhZZKpdwtFDb4ncoUm6Q7UEYY/export?format=csv&gid=1406781907';

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

// Hàm tạo map từ tên -> link Zalo
function createGroupsMap(rawData) {
  const groupsMap = new Map();
  
  rawData.forEach(row => {
    // Hỗ trợ nhiều tên cột khác nhau
    const hostName = row['TÊN HOST'] || row['TEN HOST'] || row['Tên Host'] || row['Tên Brand'] || row['TÊN BRAND'] || '';
    const zaloLink = row['LINK DÉP LÀO'] || row['LINK DEP LAO'] || row['Link Dép Lào'] || row['Link Zalo'] || row['LINK ZALO'] || '';
    
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

