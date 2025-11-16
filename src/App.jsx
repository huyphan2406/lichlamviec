import { useState, useMemo, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useSWR from 'swr';
import { 
    FiClock, FiMapPin, FiMic, FiUser, FiMonitor,
    FiMoon, FiSun,
    FiSearch, FiDownload, FiX, FiZap,
    FiCalendar, FiInfo, FiTag, FiAward,
    FiLogIn, FiUserPlus,
    FiFilter, FiUsers, FiUserCheck, FiEdit3, 
    FiBarChart2, FiExternalLink
} from 'react-icons/fi';
import QuickReportForm from './QuickReportForm';
import './App.css'; 

// Hàm bỏ dấu tiếng Việt (dùng cho filter)
const removeAccents = (str) => {
    if (!str) return '';
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
};

// Hàm normalize tên để so sánh (PHẢI GIỐNG HỆT VỚI API)
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

// Hàm tìm link Zalo từ tên host/talent (CẢI THIỆN VỚI FUZZY MATCHING)
// 🌟 TỐI ƯU: Cache để tránh tính lại normalize nhiều lần
const normalizeCache = new Map();

// 🌟 TỐI ƯU: Hàm tìm kiếm group link với nhiều cải tiến
const findGroupLink = (name, groupsMap) => {
    if (!name || !groupsMap || Object.keys(groupsMap).length === 0) {
        return null;
    }
    
    // Cache normalize để tăng tốc
    let normalizedName = normalizeCache.get(name);
    if (!normalizedName) {
        normalizedName = normalizeName(name);
        if (normalizedName) {
            normalizeCache.set(name, normalizedName);
        }
    }
    if (!normalizedName) return null;
    
    // 1. EXACT MATCH - Nhanh nhất, kiểm tra trước
    const exactMatch = groupsMap[normalizedName];
    if (exactMatch?.link) {
        if (process.env.NODE_ENV === 'development') {
            console.log('✅ [EXACT]', name, '->', normalizedName);
        }
        return exactMatch.link;
    }
    
    // 2. PARTIAL MATCH - Sắp xếp keys từ dài đến ngắn để match chính xác hơn
    const allKeys = Object.keys(groupsMap);
    if (allKeys.length === 0) return null;
    
    // Sắp xếp keys theo độ dài (dài trước) để match "shopee express" trước "shopee"
    const sortedKeys = [...allKeys].sort((a, b) => b.length - a.length);
    
    // Tìm partial match 2 chiều
    for (const key of sortedKeys) {
        if (!key) continue;
        
        // Kiểm tra 2 chiều: name chứa key hoặc key chứa name
        if (normalizedName.includes(key) || key.includes(normalizedName)) {
            const match = groupsMap[key];
            if (match?.link) {
                if (process.env.NODE_ENV === 'development') {
                    console.log('✅ [PARTIAL]', name, '->', key);
                }
                return match.link;
            }
        }
    }
    
    // 3. FUZZY MATCH - Chỉ chạy nếu không tìm thấy exact/partial
    const nameWords = normalizedName.split(' ').filter(w => w.length > 2);
    if (nameWords.length === 0) return null;
    
    let bestMatch = null;
    let bestScore = 0;
    const minScore = 5; // Ngưỡng tối thiểu
    
    for (const key of sortedKeys) {
        if (!key) continue;
        
        const keyWords = key.split(' ').filter(w => w.length > 2);
        if (keyWords.length === 0) continue;
        
        let score = 0;
        
        // Tính điểm: từ khớp hoàn toàn = 10, từ chứa nhau = 5
        for (const nw of nameWords) {
            for (const kw of keyWords) {
                if (nw === kw) {
                    score += 10; // Exact word match
                } else if (nw.includes(kw) || kw.includes(nw)) {
                    score += 5; // Partial word match
                }
            }
        }
        
        // Cập nhật best match nếu score cao hơn và đạt ngưỡng
        if (score > bestScore && score >= minScore) {
            bestScore = score;
            bestMatch = key;
        }
    }
    
    if (bestMatch) {
        const match = groupsMap[bestMatch];
        if (match?.link) {
            if (process.env.NODE_ENV === 'development') {
                console.log('✅ [FUZZY]', name, '->', bestMatch, `(Score: ${bestScore})`);
            }
            return match.link;
        }
    }
    
    // Không tìm thấy
    if (process.env.NODE_ENV === 'development') {
        console.warn('❌ [NOT FOUND]', name, '->', normalizedName);
    }
    return null;
};

// 🌟 Hàm tìm Brand Link - CHẶT CHẼ HƠN, chỉ dùng exact/partial match nghiêm ngặt
// Không dùng fuzzy match để tránh match sai (ví dụ: "NIVEA SHOPEE" với "NIVEA LZD")
// Tham số: isBrandNameOnly = true nếu đây là brand name (chỉ 1 từ), false nếu là full name (có platform)
const findBrandLink = (name, groupsMap, isBrandNameOnly = false) => {
    if (!name || !groupsMap || Object.keys(groupsMap).length === 0) {
        return null;
    }
    
    // Cache normalize để tăng tốc
    let normalizedName = normalizeCache.get(name);
    if (!normalizedName) {
        normalizedName = normalizeName(name);
        if (normalizedName) {
            normalizeCache.set(name, normalizedName);
        }
    }
    if (!normalizedName) return null;
    
    // 1. EXACT MATCH - Nhanh nhất, kiểm tra trước
    const exactMatch = groupsMap[normalizedName];
    if (exactMatch?.link) {
        if (process.env.NODE_ENV === 'development') {
            console.log('✅ [BRAND EXACT]', name, '->', normalizedName);
        }
        return exactMatch.link;
    }
    
    // 2. Nếu là brand name only (chỉ 1 từ), CHỈ dùng exact match - không dùng partial
    // Tránh match "NIVEA" với "NIVEA LZD" (platform khác)
    const nameWords = normalizedName.split(' ').filter(w => w.length > 2);
    if (isBrandNameOnly || nameWords.length === 1) {
        // Chỉ match exact, không dùng partial
        if (process.env.NODE_ENV === 'development') {
            console.warn('❌ [BRAND NOT FOUND - EXACT ONLY]', name, '->', normalizedName);
        }
        return null;
    }
    
    // 3. PARTIAL MATCH NGHIÊM NGẶT - Chỉ match nếu tất cả từ đều có trong key
    // Chỉ dùng cho full name (có nhiều từ, ví dụ: "NIVEA SHOPEE")
    const allKeys = Object.keys(groupsMap);
    if (allKeys.length === 0) return null;
    
    // Sắp xếp keys theo độ dài (dài trước) để match chính xác hơn
    const sortedKeys = [...allKeys].sort((a, b) => b.length - a.length);
    
    // Tìm partial match: name chứa key HOẶC key chứa name (nhưng phải đảm bảo tất cả từ đều match)
    for (const key of sortedKeys) {
        if (!key) continue;
        
        // Kiểm tra 2 chiều: name chứa key hoặc key chứa name
        if (normalizedName.includes(key) || key.includes(normalizedName)) {
            // NGHIÊM NGẶT: Kiểm tra xem tất cả từ trong name có trong key không
            // Ví dụ: "NIVEA SHOPEE" không match "NIVEA LZD" vì "SHOPEE" không có trong "NIVEA LZD"
            const keyWords = key.split(' ').filter(w => w.length > 2);
            let allWordsMatch = true;
            
            // Kiểm tra tất cả từ trong name phải có trong key
            for (const nw of nameWords) {
                let wordFound = false;
                // Kiểm tra exact match hoặc partial match của từ
                for (const kw of keyWords) {
                    if (nw === kw || kw.includes(nw) || nw.includes(kw)) {
                        wordFound = true;
                        break;
                    }
                }
                if (!wordFound) {
                    allWordsMatch = false;
                    break;
                }
            }
            
            // Chỉ match nếu tất cả từ đều có trong key
            if (allWordsMatch) {
                const match = groupsMap[key];
                if (match?.link) {
                    if (process.env.NODE_ENV === 'development') {
                        console.log('✅ [BRAND PARTIAL]', name, '->', key);
                    }
                    return match.link;
                }
            }
        }
    }
    
    // 4. KHÔNG dùng fuzzy match - quá rủi ro, có thể match sai
    // Không tìm thấy -> return null
    if (process.env.NODE_ENV === 'development') {
        console.warn('❌ [BRAND NOT FOUND]', name, '->', normalizedName);
    }
    return null;
};

const parseDate = (dateStr, timeStr) => {
    try {
        const [day, month, year] = dateStr.split('/');
        const startTime = (timeStr || '00:00').split(' - ')[0];
        const [hour, minute] = startTime.split(':');
        return new Date(year, month - 1, day, hour, minute);
    } catch (e) { return new Date(0); }
};

const getFormattedToday = () => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0'); 
    const year = today.getFullYear();
    return `${day}/${month}/${year}`;
};

const jsonFetcher = (url) => fetch(url).then((res) => res.json());

const isJobActive = (job) => {
    try {
        const now = new Date();
        const [day, month, year] = job['Date livestream'].split('/');
        const [startTimeStr, endTimeStr] = (job['Time slot'] || '00:00 - 00:00').split(' - ');
        
        const [startHour, startMinute] = startTimeStr.split(':').map(Number);
        const [endHour, endMinute] = (endTimeStr || '00:00').split(':').map(Number); // Thêm fallback cho endMinute

        const jobStartTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startHour, startMinute);
        jobStartTime.setFullYear(parseInt(year), parseInt(month) - 1, parseInt(day));

        const jobEndTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), endHour, endMinute);
        jobEndTime.setFullYear(parseInt(year), parseInt(month) - 1, parseInt(day));

        if (jobEndTime.getTime() < jobStartTime.getTime()) {
            jobEndTime.setDate(jobEndTime.getDate() + 1);
        }

        const isRunning = now.getTime() >= jobStartTime.getTime() && now.getTime() < jobEndTime.getTime();
        const soonThreshold = 60 * 60 * 1000; 
        const timeToStart = jobStartTime.getTime() - now.getTime();
        const isStartingSoon = timeToStart > 0 && timeToStart <= soonThreshold;

        return isRunning || isStartingSoon;

    } catch (e) {
        console.error("Lỗi isJobActive:", e, job); // Log lỗi nếu parse thời gian thất bại
        return false;
    }
};


// --- LOGIC (HOOKS) ---

function useDarkMode() {
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
    const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
    useEffect(() => {
        localStorage.setItem('theme', theme);
        document.body.setAttribute('data-theme', theme);
    }, [theme]);
    return [theme, toggleTheme];
}

// 🌟 TỐI ƯU 1: HÀM useJobData ĐÃ ĐƯỢC TỐI ƯU HÓA
function useJobData() {
    // 1. Fetch từ API route của bạn (đảm bảo file /api/get-schedule.js tồn tại)
    const API_URL = '/api/get-schedule'; 

    const { data, error, isLoading } = useSWR(
        API_URL,
        jsonFetcher, // 👈 Dùng fetcher JSON mới
        {
            refreshInterval: 60000, 
            revalidateOnFocus: true
        }
    );

    // 2. Dữ liệu đã được xử lý sẵn trên server
    return { 
        jobs: data?.jobs || [], 
        uniqueDates: data?.dates || [],
        uniqueSessions: data?.sessions || [],
        uniqueStores: data?.stores || [],
        isLoading: isLoading, // Giữ nguyên trạng thái loading của SWR
        error 
    };
}

// 🌟 HÀM useGroupData ĐỂ FETCH GROUPS (HOST & BRAND)
function useGroupData() {
    const API_URL = '/api/get-groups';

    const { data, error, isLoading } = useSWR(
        API_URL,
        jsonFetcher,
        {
            refreshInterval: 60000, // Refresh mỗi 60s
            revalidateOnFocus: true
        }
    );

    const result = {
        hostGroups: data?.hostGroups || {},
        brandGroups: data?.brandGroups || {},
        hostCount: data?.hostCount || 0,
        brandCount: data?.brandCount || 0,
        isLoading: isLoading,
        error
    };
    
    // Debug: Log khi data được fetch (LUÔN LOG để debug)
    useEffect(() => {
        const hostKeys = Object.keys(result.hostGroups);
        const brandKeys = Object.keys(result.brandGroups);
        console.log('🔍 [API DEBUG] useGroupData:', {
            isLoading,
            hasData: !!data,
            error: error?.message || error,
            rawData: data, // Log toàn bộ data để xem
            hostCount: result.hostCount,
            brandCount: result.brandCount,
            hostKeys: hostKeys.length,
            brandKeys: brandKeys.length,
            hostSample: hostKeys.slice(0, 5),
            brandSample: brandKeys.slice(0, 5),
            firstHostKey: hostKeys[0],
            firstHostData: hostKeys.length > 0 ? result.hostGroups[hostKeys[0]] : null,
            firstBrandKey: brandKeys[0],
            firstBrandData: brandKeys.length > 0 ? result.brandGroups[brandKeys[0]] : null,
            brandGroupsType: typeof result.brandGroups,
            brandGroupsIsArray: Array.isArray(result.brandGroups)
        });
    }, [data, isLoading, error, result]);
    
    return result;
}

// --- HÀM HELPER CHO GIAO DIỆN ---
const combineNames = (name1, name2) => {
    const n1 = name1 || '';
    const n2 = (name2 && name2 !== 'nan') ? name2 : '';
    if (n1 && n2) return `${n1} | ${n2}`;
    return n1 || n2 || '...'; 
};

const combineLocation = (job) => {
    const addressName = job.Address || '';
    const roomName = job['Studio/Room'] || '';
    const locationDisplay = [addressName, roomName]
        .filter(part => part && part !== 'nan') 
        .join(' | ');
    return locationDisplay || 'No location';
};

// 🌟 COMPONENT THÔNG BÁO TẠM THỜI (thay thế alert)
const TemporaryNotification = ({ message, onDismiss }) => {
    useEffect(() => {
        if (message) {
            const timer = setTimeout(onDismiss, 3000);
            return () => clearTimeout(timer);
        }
    }, [message, onDismiss]);

    return (
        <AnimatePresence>
            {message && (
                <motion.div
                    className="temporary-notification"
                    initial={{ y: -50, opacity: 0, scale: 0.95 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: -50, opacity: 0, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                    <span className="temporary-notification-text">{message}</span>
                    <button 
                        className="temporary-notification-close"
                        onClick={onDismiss}
                        aria-label="Đóng thông báo"
                    >
                        <FiX size={16} />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
};


// 🌟 COMPONENT POPUP THÔNG BÁO 
const NotificationPopup = ({ isVisible, setIsVisible }) => {
    const handleDismiss = () => {
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <>
                    <motion.div
                        className="popup-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleDismiss}
                    />
                    
                    <motion.div 
                        className="popup-modal"
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="popup-header">
                            <FiZap size={22} className="popup-icon-zap" />
                            <h3>Thông Báo Quan Trọng</h3>
                            <button className="popup-dismiss-btn" onClick={handleDismiss} title="Đóng">
                                <FiX size={20} />
                            </button>
                        </div>
                        <div className="popup-content">
                            
                            <p className="popup-main-title">
                                <strong>LỊCH LIVESTREAM NHANH & CHÍNH XÁC!</strong>
                            </p>

                            <p className="popup-content-text">
                                Tra cứu nhanh lịch làm việc của <strong>Standby</strong> và <strong>Host</strong>.
                            </p>
                            
                            <hr className="popup-divider" />
                            
                            <p className="popup-content-text popup-highlight-area">
                                **DÙNG THỬ:** Miễn phí tới ngày <strong className="highlight-date">30/11</strong>.
                                <br/>
                                Sau ngày 30, bạn cần đăng kí tài khoản để tiếp tục sử dụng.
                            </p>

                            <hr className="popup-divider" />

                            <p className="popup-content-text popup-footer-area">
                                <strong>Tính năng đăng được triển khai: Join nhanh group brand và host; điền nhanh report; dashboard thống kê jobs(CRM)</strong>
                                <span className="popup-author-simple">
                                    <FiAward size={14} /> Tác giả: Huy Phan
                                </span>
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};


// 🌟 HÀM XỬ LÝ CLICK TẠM THỜI CHO NÚT AUTH
const handleAuthClick = (showAuthPopup) => {
    showAuthPopup(); // Chỉ cần hiển thị popup
};


const Header = ({ theme, toggleTheme, showAuthPopup }) => ( 
    <header className="app-header">
        <h1 style={{margin: 0, paddingRight: '15px', flexShrink: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
            Lịch làm việc
        </h1>
        
        <div className="header-controls">

            {/* Nút Sáng/Tối (BÊN TRÁI AUTH) */}
            <label className="theme-toggle" title="Toggle Light/Dark Mode">
                {theme === 'light' ? <FiMoon size={18} /> : <FiSun size={18} />}
                <div className="theme-toggle-switch">
                    <input type="checkbox" checked={theme === 'dark'} onChange={toggleTheme} />
                    <span className="theme-toggle-slider"></span>
                </div>
            </label>
            
            <div className="auth-buttons">
                <button 
                    className="auth-button login" 
                    title="Đăng nhập"
                    onClick={() => handleAuthClick(showAuthPopup)}
                    style={{ flexShrink: 0 }} 
                >
                    <FiLogIn size={16} />
                    <span>Đăng nhập</span>
                </button>
                <button 
                    className="auth-button register" 
                    title="Đăng ký"
                    onClick={() => handleAuthClick(showAuthPopup)}
                    style={{ flexShrink: 0 }} 
                >
                    <FiUserPlus size={16} />
                    <span>Đăng ký</span>
                </button>
            </div>
        </div>
    </header>
);

// 🌟🌟🌟 COMPONENT FILTERBAR (ĐÃ TÁCH STATE - Tối ưu 3 & 4) 🌟🌟🌟
const FilterBar = ({ 
    dateFilter, setDateFilter, 
    setNameFilter, // 👈 ĐÃ THÊM
    uniqueDates, filteredJobs,
    sessionFilter, setSessionFilter,
    uniqueSessions, 
    storeFilter, setStoreFilter,
    uniqueStores,
    showTempNotification
}) => {
    
    // 🌟 TỐI ƯU HÓA 4: Tách state 'inputValue' vào FilterBar
    // 🌟 Load từ localStorage nếu có
    const [inputValue, setInputValue] = useState(() => {
        try {
            return localStorage.getItem('searchNameCache') || '';
        } catch (e) {
            return '';
        }
    }); 

    // 🌟 TỐI ƯU HÓA 4: Debounce (làm trễ) việc cập nhật bộ lọc
    useEffect(() => {
        const timerId = setTimeout(() => {
            setNameFilter(inputValue); // ...rồi mới cập nhật state của App
        }, 300);
        
        return () => {
            clearTimeout(timerId); // Xóa timer nếu người dùng gõ tiếp
        };
    }, [inputValue, setNameFilter]);

    // 🌟 Lưu inputValue vào localStorage khi thay đổi
    useEffect(() => {
        try {
            if (inputValue.trim()) {
                localStorage.setItem('searchNameCache', inputValue);
            } else {
                localStorage.removeItem('searchNameCache');
            }
        } catch (e) {
            console.warn('Không thể lưu vào localStorage:', e);
        }
    }, [inputValue]); 
    
    
    // 🌟 TỐI ƯU HÓA 3: Tải lười (Lazy Loading) thư viện 'ics'
    const handleDownloadICS = useCallback(async () => { // 👈 Thêm async
        // 🌟 Chỉ import khi nhấn nút
        const ics = await import('ics');

        const events = filteredJobs.map(job => {
            try {
                const [day, month, year] = job['Date livestream'].split('/');
                const [startTimeStr, endTimeStr] = (job['Time slot'] || '00:00 - 00:00').split(' - ');
                
                const [startHour, startMinute] = startTimeStr.split(':').map(Number);
                const [endHour, endMinute] = (endTimeStr || startTimeStr).split(':').map(Number);

                const startDate = new Date(0, 0, 0, startHour, startMinute);
                const endDate = new Date(0, 0, 0, endHour, endMinute);
                let diffMs = endDate.getTime() - startDate.getTime();
                if (diffMs <= 0) diffMs = 60 * 60 * 1000; 

                const durationHours = Math.floor(diffMs / (1000 * 60 * 60));
                const durationMinutes = (diffMs / (1000 * 60)) % 60;

                return {
                    title: job.Store || 'Unnamed Job',
                    start: [parseInt(year), parseInt(month), parseInt(day), startHour, startMinute],
                    duration: { hours: durationHours, minutes: durationMinutes },
                    location: combineLocation(job),
                    description: `MC: ${combineNames(job['Talent 1'], job['Talent 2'])}\nCoordinator: ${combineNames(job['Coordinator 1'], job['Coordinator 2'])}`
                };
            } catch (e) {
                return null; 
            }
        }).filter(Boolean); 

        if (events.length === 0) {
            showTempNotification("Không có sự kiện hợp lệ nào để xuất lịch.");
            return;
        }

        const { error, value } = ics.createEvents(events);

        if (error) {
            console.error("Error creating ICS file:", error);
            showTempNotification("Lỗi khi tạo file ICS.");
            return;
        }

        const blob = new Blob([value], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Google_Calendar_Schedule_${dateFilter.replace(/\//g, '-') || 'all'}.ics`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showTempNotification("Đã xuất lịch thành công!");
    }, [dateFilter, filteredJobs, showTempNotification]);

    return (
        <div className="filter-container">
            
            <div className="form-group-grid">
                <div className="form-group filter-date">
                    <label htmlFor="dateInput">Ngày</label>
                    <select id="dateInput" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
                        <option value="">All Dates</option>
                        {uniqueDates.map(date => <option key={date} value={date}>{date}</option>)}
                    </select>
                </div>
                
                <div className="form-group filter-session">
                    <label htmlFor="sessionInput">Loại Ca</label>
                    <select id="sessionInput" value={sessionFilter} onChange={(e) => setSessionFilter(e.target.value)}>
                        <option value="">All Sessions</option>
                        {uniqueSessions.map(session => <option key={session} value={session}>{session}</option>)}
                    </select>
                </div>

                <div className="form-group filter-store">
                    <label htmlFor="storeInput">Tên Cửa Hàng</label>
                    <select id="storeInput" value={storeFilter} onChange={(e) => setStoreFilter(e.target.value)}>
                        <option value="">All Stores</option>
                        {uniqueStores.map(store => <option key={store} value={store}>{store}</option>)}
                    </select>
                </div>

                {/* Đã xóa Group Brand và Group Host khỏi FilterBar */}

                <div className="form-group filter-search full-width">
                    <label htmlFor="nameInput">Tìm Kiếm</label>
                    <div className="input-with-icon">
                        <FiSearch className="search-icon" size={18} />
                        <input 
                            type="text" 
                            id="nameInput" 
                            placeholder="Nhập tên của bạn " 
                            value={inputValue} // 👈 Dùng state nội bộ
                            onChange={(e) => setInputValue(e.target.value)} // 👈 Cập nhật state nội bộ
                        />
                    </div>
                </div>

            </div>

            <button 
                className="download-button" 
                onClick={handleDownloadICS} 
                disabled={filteredJobs.length === 0}
            >
                <FiDownload size={18} />
                Nhập vào Google Calendar (.ics)
            </button>
        </div>
    );
};

const SkeletonLoader = () => (
    <div className="skeleton-container">
        {[...Array(3)].map((_, i) => (
            <div className="skeleton-item" key={i}>
                <div className="skeleton-line h4"></div>
                <div className="skeleton-line p"></div>
                <div className="skeleton-line p"></div>
                <div className="skeleton-line p"></div>
            </div>
        ))}
    </div>
);

const EmptyState = ({ dateFilter }) => (
    <motion.div 
        className="empty-state" 
        initial={{ opacity: 0, scale: 0.9 }} 
        animate={{ opacity: 1, scale: 1 }}
    >
        {/* THẺ CẢNH BÁO CHÍNH - STYLE CAO CẤP */}
        <div style={{ 
            border: '2px solid var(--color-danger)', borderRadius: '16px', padding: '25px', 
            backgroundColor: 'var(--color-card)', width: '100%', boxSizing: 'border-box',
            boxShadow: '0 8px 25px rgba(220, 53, 69, 0.2)'
        }}>
            
            <h3 style={{ 
                color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '12px', 
                margin: '0 0 20px 0', paddingBottom: '10px', borderBottom: '1px solid var(--color-border)', 
                fontSize: '1.3rem', fontWeight: 700
            }}>
                <FiSearch size={24} style={{color: 'var(--color-danger)'}} />
                KHÔNG TÌM THẤY LỊCH LÀM VIỆC!
            </h3>
            
            <p style={{ color: 'var(--color-text-primary)', fontWeight: 500, fontSize: '1.05em', margin: '0 0 15px 0' }}>
                <FiInfo size={18} style={{marginRight: '10px', color: 'var(--color-danger)'}}/>
                <strong style={{color: 'var(--color-danger)'}}>Lỗi:</strong> Không có công việc nào khớp với các tiêu chí lọc.
            </p>
            
            {dateFilter && (
                <p style={{ 
                    color: 'var(--color-text-primary)', fontSize: '1em', margin: '0 0 25px 0',
                    padding: '10px 15px', borderLeft: '4px solid var(--color-brand)', 
                    backgroundColor: 'var(--color-brand-light)', borderRadius: '4px'
                }}>
                    <span style={{ fontWeight: 600 }}>Đang lọc theo Ngày:</span> 
                    <strong style={{marginLeft: '5px'}}>{dateFilter}</strong>
                </p>
            )}
            
            <p style={{ 
                color: 'var(--color-text-secondary)', fontWeight: 500, paddingTop: '15px',
                borderTop: '1px solid var(--color-border)', fontSize: '0.95em'
            }}>
                👉 Vui lòng điều chỉnh lại Ngày, Tên Cửa Hàng, hoặc Loại Ca để xem lịch.
            </p>

        </div>
    </motion.div>
);

const JobItem = memo(({ job, isActive, onQuickReportClick, hostGroups, brandGroups }) => {
  const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
  const timeGroup = `${job['Time slot'] || 'N/A'}`;
  const talentDisplay = combineNames(job['Talent 1'], job['Talent 2']);
  const coordDisplay = combineNames(job['Coordinator 1'], job['Coordinator 2']);
  const locationDisplay = combineLocation(job);
  const sessionTypeDisplay = job['Type of session'] && job['Type of session'].trim() !== '' ? job['Type of session'] : '—';
  
  const defaultUpdateMessage = "Đang cập nhật...";

  // 🌟 TỐI ƯU: Tìm link Zalo cho Group Brand với logic chính xác
  // Format: "BRAND - PLATFORM" (ví dụ: "NIVEA - SHOPEE")
  // Ưu tiên: 1) "BRAND - PLATFORM" -> 2) "BRAND" -> 3) null (hiện "Đang cập nhật")
  const brandLink = useMemo(() => {
      if (!brandGroups || Object.keys(brandGroups).length === 0 || !job.Store) {
          return null;
      }

      const storeName = job.Store.trim();
      if (!storeName) return null;

      // 1. ƯU TIÊN 1: Tìm với tên đầy đủ "BRAND - PLATFORM" hoặc "BRAND PLATFORM" (ví dụ: "NIVEA - SHOPEE" hoặc "NIVEA SHOPEE")
      // Dùng findBrandLink (chặt chẽ hơn) thay vì findGroupLink để tránh match sai
      // isBrandNameOnly = false vì đây là full name (có thể có platform)
      let link = findBrandLink(storeName, brandGroups, false);
      if (link) return link;

      // 2. Tách tên theo dấu "-" hoặc "|"
      // Ví dụ: "NIVEA - SHOPEE" -> ["NIVEA", "SHOPEE"]
      const parts = storeName.split(/[-|]/).map(p => p.trim()).filter(p => p.length > 0);
      
      if (parts.length > 1) {
          // ƯU TIÊN 2: Chỉ tìm phần đầu (BRAND name) - KHÔNG tìm platform riêng
          // Ví dụ: "NIVEA - SHOPEE" -> chỉ tìm "NIVEA" (không tìm "SHOPEE")
          // isBrandNameOnly = true vì đây chỉ là brand name (1 từ), chỉ match exact
          const brandName = parts[0]; // Phần đầu là brand name
          if (brandName) {
              link = findBrandLink(brandName, brandGroups, true);
              if (link) return link;
          }
      } else if (parts.length === 1) {
          // Nếu chỉ có 1 phần (không có dấu "-"), có thể là brand name hoặc full name
          // Kiểm tra xem có nhiều từ không (ví dụ: "NIVEA SHOPEE" không có dấu "-")
          const words = parts[0].split(' ').filter(w => w.trim().length > 0);
          if (words.length === 1) {
              // Chỉ 1 từ -> brand name only, chỉ match exact
              link = findBrandLink(parts[0], brandGroups, true);
          } else {
              // Nhiều từ -> full name, có thể dùng partial match
              link = findBrandLink(parts[0], brandGroups, false);
          }
          if (link) return link;
      }

      // 3. Không tìm thấy -> return null (sẽ hiện "Đang cập nhật")
      return null;
  }, [job.Store, brandGroups]);

  // 🌟 TỐI ƯU: Tìm link Zalo cho Group Host (sử dụng hàm findGroupLink đã tối ưu)
  const hostLink = useMemo(() => {
      if (!hostGroups || Object.keys(hostGroups).length === 0) {
          return null;
      }
      
      // Thử tìm với Talent 1 trước (ưu tiên cao nhất)
      const link1 = findGroupLink(job['Talent 1'], hostGroups);
      if (link1) return link1;
      
      // Nếu không có, thử Talent 2
      const link2 = findGroupLink(job['Talent 2'], hostGroups);
      if (link2) return link2;
      
      // Nếu vẫn không có, thử Coordinator (có thể host cũng là coordinator)
      const link3 = findGroupLink(job['Coordinator 1'], hostGroups);
      if (link3) {
          console.log('✅ [HOST] Found via Coordinator 1:', job['Coordinator 1'], '->', link3);
          return link3;
      }
      
      const link4 = findGroupLink(job['Coordinator 2'], hostGroups);
      if (link4) {
          console.log('✅ [HOST] Found via Coordinator 2:', job['Coordinator 2'], '->', link4);
          return link4;
      }
      
      console.warn('❌ [HOST] Not found for any talent/coordinator');
      return null;
  }, [job, hostGroups]);

  // Handler functions
  const handleQuickReport = useCallback(() => {
      if (onQuickReportClick) {
          onQuickReportClick(job);
      }
  }, [onQuickReportClick, job]);

  const handleGroupClick = useCallback((link, e) => {
      e.stopPropagation();
      if (link) {
          window.open(link, '_blank', 'noopener,noreferrer');
      }
  }, []);
  
  return (
      <motion.div 
          className={`schedule-item ${isActive ? 'job-active' : ''}`}
          variants={itemVariants}
          initial="hidden"
          animate="visible"
      >
          <div className="job-header-row">
              <h4>{job.Store || 'N/A'}</h4>
              <button 
                  className="quick-report-button"
                  onClick={handleQuickReport}
                  title="Điền Report Nhanh"
              >
                  <FiEdit3 size={16} />
                  Điền Report Nhanh
              </button>
          </div>

          <p className="location">
              <FiMapPin size={18} />
              {locationDisplay}
          </p>

          <p className="time">
              <FiClock size={18} />
              {job['Time slot'] || 'N/A'}
          </p>

          <p>
              <FiMic size={18} />
              MC: {talentDisplay}
          </p>

          <p>
              <FiUser size={18} />
              Coordinator: {coordDisplay}
          </p>

          {sessionTypeDisplay !== '—' && (
              <p className="session">
                  <FiTag size={18} />
                  Loại ca: {sessionTypeDisplay}
              </p>
          )}

          <div className="job-groups-footer-container">
              <div className="group-brand job-group-item">
                  <FiUsers size={18} className="job-group-icon" /> 
                  <span className="job-group-label">Group Brand:</span>
                  {brandLink ? (
                      <a 
                          href={brandLink} 
                          onClick={(e) => handleGroupClick(brandLink, e)}
                          className="job-group-link"
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Mở Group Brand trên Zalo"
                      >
                          <span className="job-group-link-text">Tham gia Group</span>
                          <FiExternalLink size={14} className="job-group-link-icon" />
                      </a>
                  ) : (
                      <span className="job-group-value">{defaultUpdateMessage}</span>
                  )}
              </div>
              <div className="group-host job-group-item">
                  <FiUserCheck size={18} className="job-group-icon" />
                  <span className="job-group-label">Group Host:</span>
                  {hostLink ? (
                      <a 
                          href={hostLink} 
                          onClick={(e) => handleGroupClick(hostLink, e)}
                          className="job-group-link"
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Mở Group Host trên Zalo"
                      >
                          <span className="job-group-link-text">Tham gia Group</span>
                          <FiExternalLink size={14} className="job-group-link-icon" />
                      </a>
                  ) : (
                      <span className="job-group-value">{defaultUpdateMessage}</span>
                  )}
              </div>
          </div>
      </motion.div>
  );
});

// --- COMPONENT APP CHÍNH ---
function App() {
    const [theme, toggleTheme] = useDarkMode();
    const { jobs, isLoading, uniqueDates, uniqueSessions, uniqueStores, error } = useJobData();
    const { hostGroups, brandGroups, isLoading: groupsLoading, error: groupsError } = useGroupData(); // Fetch groups data
    
    // Debug groups data (chỉ trong development)
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            if (!groupsLoading && hostGroups && brandGroups) {
                console.log('Groups in App:', {
                    hostKeys: Object.keys(hostGroups).length,
                    brandKeys: Object.keys(brandGroups).length,
                    hostSample: Object.keys(hostGroups).slice(0, 5),
                    brandSample: Object.keys(brandGroups).slice(0, 5)
                });
            }
            if (groupsError) {
                console.error('Groups Error:', groupsError);
            }
        }
    }, [hostGroups, brandGroups, groupsLoading, groupsError]);
    
    const [dateFilter, setDateFilter] = useState(() => getFormattedToday());
    // 🌟 Lưu tên tìm kiếm vào localStorage
    const [nameFilter, setNameFilter] = useState(() => {
        try {
            return localStorage.getItem('searchNameCache') || '';
        } catch (e) {
            return '';
        }
    }); 
    const [sessionFilter, setSessionFilter] = useState('');
    const [storeFilter, setStoreFilter] = useState('');

    // 🌟 Lưu nameFilter vào localStorage khi thay đổi
    useEffect(() => {
        try {
            if (nameFilter.trim()) {
                localStorage.setItem('searchNameCache', nameFilter);
            } else {
                localStorage.removeItem('searchNameCache');
            }
        } catch (e) {
            console.warn('Không thể lưu vào localStorage:', e);
        }
    }, [nameFilter]);

    const [tempNotification, setTempNotification] = useState(null); 
    const showTempNotification = useCallback((message) => setTempNotification(message), []);
    const dismissTempNotification = useCallback(() => setTempNotification(null), []);

    const [isAuthPopupVisible, setIsAuthPopupVisible] = useState(true);
    const showAuthPopup = useCallback(() => setIsAuthPopupVisible(true), []);
    const hideAuthPopup = useCallback(() => setIsAuthPopupVisible(false), []);

    const [isReportFormVisible, setIsReportFormVisible] = useState(false);
    const [selectedJob, setSelectedJob] = useState(null);
    const handleQuickReportClick = useCallback((job) => {
        console.log('handleQuickReportClick called with job:', job);
        setSelectedJob(job);
        setIsReportFormVisible(true);
        console.log('State updated: isReportFormVisible = true, selectedJob =', job);
    }, []);
    const hideReportForm = useCallback(() => {
        setIsReportFormVisible(false);
        setSelectedJob(null);
    }, []);

    const [currentTime, setCurrentTime] = useState(new Date());
    
    useEffect(() => {
        const intervalId = setInterval(() => setCurrentTime(new Date()), 60000); 
        return () => clearInterval(intervalId);
    }, []);

    // Logic lọc
    const filteredJobs = useMemo(() => {
        const dummy = currentTime.toISOString(); 
        
        let jobsToFilter = jobs;
        const normNameFilter = removeAccents(nameFilter.toLowerCase().trim());
        
        if (normNameFilter) {
            jobsToFilter = jobsToFilter.filter(job => {
                const jobStr = `${job['Talent 1']} ${job['Talent 2']} ${job['Coordinator 1']} ${job['Coordinator 2']} ${job.Store} ${job.Address} ${job['Studio/Room']}`;
                return removeAccents(jobStr.toLowerCase()).includes(normNameFilter);
            });
        }
        
        if (dateFilter) { 
            jobsToFilter = jobsToFilter.filter(job => (job['Date livestream'] || '').toString() === dateFilter);
        }
        if (sessionFilter) {
            const normalizedFilter = sessionFilter.toLowerCase();
            jobsToFilter = jobsToFilter.filter(job => (job['Type of session'] || '').trim().toLowerCase() === normalizedFilter);
        }
        if (storeFilter) {
            const normalizedFilter = storeFilter.toLowerCase();
            jobsToFilter = jobsToFilter.filter(job => (job.Store || '').trim().toLowerCase() === normalizedFilter);
        }

        return jobsToFilter;

    }, [jobs, dateFilter, nameFilter, sessionFilter, storeFilter, currentTime]);

    // Logic Gom Nhóm (Dùng toàn bộ, không giới hạn)
    const groupedJobs = useMemo(() => {
        return filteredJobs.reduce((acc, job) => { // 👈 Dùng filteredJobs
            const timeGroup = job['Time slot'] || 'N/A';
            if (!acc[timeGroup]) acc[timeGroup] = [];
            acc[timeGroup].push(job);
            return acc;
        }, {});
    }, [filteredJobs]);

    // 🌟 TỐI ƯU HÓA 2: "Làm phẳng" (Flatten) dữ liệu để ảo hóa
    const flatRowItems = useMemo(() => {
        const items = [];
        const jobGroups = Object.keys(groupedJobs);

        jobGroups.forEach(timeGroup => {
            items.push({ id: `header_${timeGroup}`, type: 'HEADER', content: timeGroup });
            groupedJobs[timeGroup].forEach((job, index) => {
                items.push({
                    id: `job_${timeGroup}_${index}`,
                    type: 'JOB',
                    content: job,
                    isActive: isJobActive(job)
                });
            });
        });
        return items;
    }, [groupedJobs]);


    const totalFilteredCount = filteredJobs.length;

    // Giao diện
    return (
        <div className="App">
            <NotificationPopup isVisible={isAuthPopupVisible} setIsVisible={hideAuthPopup} /> 
            <QuickReportForm 
                isVisible={isReportFormVisible} 
                setIsVisible={hideReportForm}
                job={selectedJob}
                showTempNotification={showTempNotification}
            />
            
            <Header 
                theme={theme} 
                toggleTheme={toggleTheme} 
                showAuthPopup={showAuthPopup}
            />
            
            <TemporaryNotification message={tempNotification} onDismiss={dismissTempNotification} />

            <main>
                {/* 🌟 TỐI ƯU HÓA 4: Truyền 'setNameFilter' */}
                <FilterBar 
                    dateFilter={dateFilter}
                    setDateFilter={setDateFilter}
                    setNameFilter={setNameFilter} // 👈 ĐÃ THÊM
                    uniqueDates={uniqueDates}
                    filteredJobs={filteredJobs} // 👈 Truyền toàn bộ danh sách đã lọc
                    
                    sessionFilter={sessionFilter}
                    setSessionFilter={setSessionFilter}
                    uniqueSessions={uniqueSessions}

                    storeFilter={storeFilter}
                    setStoreFilter={setStoreFilter}
                    uniqueStores={uniqueStores}
                    showTempNotification={showTempNotification}
                />
                
                {jobs.length > 0 && totalFilteredCount > 0 && (
                    <motion.div 
                        className="job-count-summary"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <FiFilter size={18} style={{marginRight: '8px'}}/>
                        Tìm thấy <strong style={{color: 'var(--color-brand)'}}>{totalFilteredCount}</strong> công việc
                        {dateFilter ? ` cho ngày ${dateFilter}` : ' trong danh sách'}
                    </motion.div>
                )}
                
                <div id="schedule-list" className="schedule-list">
                    {error ? (
                        <motion.div className="empty-state" initial={{opacity:0}} animate={{opacity:1}}>
                            <FiSearch className="empty-state-icon" style={{color: '#dc3545'}}/>
                            <h3>Error Loading Data</h3>
                            <p>Could not connect to the Google Sheet. Please check the link or sharing permissions.</p>
                        </motion.div>
                    ) : isLoading ? (
                        <SkeletonLoader />
                    ) : (jobs.length > 0 && flatRowItems.length === 0) ? (
                        <EmptyState dateFilter={dateFilter} />
                    ) : (
                        // Render tất cả items để scroll tự nhiên
                        <div className="schedule-list">
                            {flatRowItems.map((item) => {
                                if (!item) return null;
                                
                                return (
                                    <div key={item.id}>
                                        {item.type === 'HEADER' ? (
                                            <h3 className="schedule-group-title">{item.content}</h3>
                                        ) : (
                                            <JobItem 
                                                job={item.content} 
                                                isActive={item.isActive}
                                                onQuickReportClick={handleQuickReportClick}
                                                hostGroups={hostGroups}
                                                brandGroups={brandGroups}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );

}

export default App;