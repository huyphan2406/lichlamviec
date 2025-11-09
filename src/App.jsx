import { useState, useMemo, useEffect, useCallback, memo } from 'react';
import Papa from 'papaparse';
import { motion, AnimatePresence } from 'framer-motion';
import useSWR from 'swr';
import * as ics from 'ics';
import { 
  FiClock, FiMapPin, FiMic, FiUser, FiMonitor,
  FiMoon, FiSun,
  FiSearch, FiDownload, FiX, FiZap,
  FiCalendar, FiInfo, FiTag, FiAward,
  FiLogIn, FiUserPlus,
  FiFilter, FiUsers, FiUserCheck, FiEdit3, 
  FiBarChart2 // Đảm bảo icon này đã được import
} from 'react-icons/fi';
import './App.css'; 

// --- HÀM HỖ TRỢ ---
const removeAccents = (str) => {
  if (!str) return '';
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
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

// HÀM TẢI DỮ LIỆU (FETCHER) CHO SWR
const csvFetcher = (url) => {
  return new Promise((resolve, reject) => {
    Papa.parse(url, {
      download: true,
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
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
};

// 🌟 HÀM KIỂM TRA CÔNG VIỆC ĐANG HOẠT ĐỘNG (60 PHÚT)
const isJobActive = (job) => {
    try {
        const now = new Date();
        const [day, month, year] = job['Date livestream'].split('/');
        const [startTimeStr, endTimeStr] = (job['Time slot'] || '00:00 - 00:00').split(' - ');
        
        const [startHour, startMinute] = startTimeStr.split(':').map(Number);
        const [endHour, endMinute] = endTimeStr.split(':').map(Number); 

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

function useJobData() {
  const dataUrl = 'https://docs.google.com/spreadsheets/d/1716aQ1XqHDiHB4LHSClVYglY0Cgf60TVJ7RYjqlwsOM/export?format=csv&gid=2068764011';

  const { data: rawData, error, isLoading } = useSWR(
    dataUrl,
    csvFetcher,
    {
      refreshInterval: 60000, 
      revalidateOnFocus: true
    }
  );

  const processedData = useMemo(() => {
    if (!rawData || error) return { jobs: [], dates: [], sessions: [], stores: [] };
    const validData = rawData.filter(row => row['Date livestream'] && row['Date livestream'].includes('/'));
    
    const sortedData = validData.sort((a, b) => {
      const dtA = parseDate(a['Date livestream'], a['Time slot']);
      const dtB = parseDate(b['Date livestream'], b['Time slot']);
      return dtA - dtB;
    });

    const uniqueDates = [...new Set(sortedData.map(job => job['Date livestream']).filter(Boolean))];
    
    const sessionsList = sortedData.map(job => (job['Type of session'] || '').trim()).filter(s => s && s !== 'nan');
    const storesList = sortedData.map(job => (job['Store'] || '').trim()).filter(s => s && s !== 'nan');
    
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

    const uniqueSessions = getUniqueItems(sessionsList);
    const uniqueStores = getUniqueItems(storesList);

    return { 
        jobs: sortedData, 
        dates: uniqueDates,
        sessions: uniqueSessions,
        stores: uniqueStores
    };
  }, [rawData, error]);

  return { 
    jobs: processedData.jobs, 
    uniqueDates: processedData.dates,
    uniqueSessions: processedData.sessions,
    uniqueStores: processedData.stores,
    isLoading: isLoading && !rawData, 
    error 
  };
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
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
        >
          {message}
          <button 
            onClick={onDismiss} 
            style={{ 
              marginLeft: '10px', background: 'none', border: 'none', 
              color: 'inherit', cursor: 'pointer', display: 'flex',
              alignItems: 'center'
            }}
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
                        initial={{ opacity: 0, x: "-50%", y: "calc(-50% + 50px)" }}
                        animate={{ opacity: 1, x: "-50%", y: "-50%" }}
                        exit={{ opacity: 0, x: "-50%", y: "calc(-50% + 50px)" }}
                        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
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
    
    {/* 🌟 HÀNG 1: TIÊU ĐỀ CĂN GIỮA (Sử dụng CSS để căn giữa) */}
    <h1 className="header-title-centered">
        Lịch làm việc
    </h1>
    
    {/* 🌟 HÀNG 2: KHỐI ĐIỀU KHIỂN (Căn 2 bên) */}
    <div className="header-controls">

      {/* 🌟 VỊ TRÍ MỚI: NÚT SÁNG/TỐI (BÊN TRÁI) */}
      <label className="theme-toggle" title="Toggle Light/Dark Mode">
        {theme === 'light' ? <FiMoon size={18} /> : <FiSun size={18} />}
        <div className="theme-toggle-switch">
          <input type="checkbox" checked={theme === 'dark'} onChange={toggleTheme} />
          <span className="theme-toggle-slider"></span>
        </div>
      </label>
      
      {/* Nút Đăng nhập/Đăng ký (Khối liền mạch - BÊN PHẢI) */}
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

const FilterBar = ({ 
    dateFilter, setDateFilter, 
    inputValue, setInputValue, 
    uniqueDates, filteredJobs,
    sessionFilter, setSessionFilter,
    uniqueSessions, 
    storeFilter, setStoreFilter,
    uniqueStores,
    showTempNotification
}) => {
  
  // 🌟 TỐI ƯU HÓA 3: Tải lười (Lazy Loading) thư viện 'ics'
  const handleDownloadICS = useCallback(async () => { // 👈 Thêm async
    // 🌟 Chỉ import khi nhấn nút
    const ics = await import('ics');

    // 🌟 LƯU Ý: filteredJobs ở đây là danh sách đã bị giới hạn (50 jobs)
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

        <div className="form-group filter-search full-width">
            <label htmlFor="nameInput">Tìm Kiếm</label>
            <div className="input-with-icon">
              <FiSearch className="search-icon" size={18} />
              <input 
                type="text" 
                id="nameInput" 
                placeholder="Nhập tên của bạn " 
                value={inputValue} 
                onChange={(e) => setInputValue(e.target.value)} 
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
        border: '2px solid var(--color-danger)', 
        borderRadius: '16px', 
        padding: '25px', 
        backgroundColor: 'var(--color-card)', 
        width: '100%',
        boxSizing: 'border-box',
        boxShadow: '0 8px 25px rgba(220, 53, 69, 0.2)'
    }}>
        
        {/* TIÊU ĐỀ KHỐI CẢNH BÁO */}
        <h3 style={{ 
            color: 'var(--color-danger)', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            margin: '0 0 20px 0',
            paddingBottom: '10px',
            borderBottom: '1px solid var(--color-border)', 
            fontSize: '1.3rem', 
            fontWeight: 700
        }}>
            <FiSearch size={24} style={{color: 'var(--color-danger)'}} />
            KHÔNG TÌM THẤY LỊCH LÀM VIỆC!
        </h3>
        
        {/* KHỐI NỘI DUNG 1: LÝ DO */}
        <p style={{ 
            color: 'var(--color-text-primary)', 
            fontWeight: 500,
            fontSize: '1.05em',
            margin: '0 0 15px 0'
        }}>
            <FiInfo size={18} style={{marginRight: '10px', color: 'var(--color-danger)'}}/>
            <strong style={{color: 'var(--color-danger)'}}>Lỗi:</strong> Không có công việc nào khớp với các tiêu chí lọc.
        </p>
        
        {/* KHỐI NỘI DUNG 2: NGÀY LỌC HIỆN TẠI (Làm nổi bật) */}
        {dateFilter && (
            <p style={{ 
                color: 'var(--color-text-primary)', 
                fontSize: '1em',
                margin: '0 0 25px 0',
                padding: '10px 15px',
                borderLeft: '4px solid var(--color-brand)', 
                backgroundColor: 'var(--color-brand-light)', 
                borderRadius: '4px'
            }}>
                <span style={{ fontWeight: 600 }}>
                    Đang lọc theo Ngày:
                </span> 
                <strong style={{marginLeft: '5px'}}>{dateFilter}</strong>
            </p>
        )}
        
        {/* KHỐI NỘI DUNG 3: LỜI NHẮC HÀNH ĐỘNG (ACTIONABLE TIP) */}
        <p style={{ 
            color: 'var(--color-text-secondary)', 
            fontWeight: 500,
            paddingTop: '15px',
            borderTop: '1px solid var(--color-border)',
            fontSize: '0.95em'
        }}>
            👉 Vui lòng điều chỉnh lại Ngày, Tên Cửa Hàng, hoặc Loại Phiên để xem lịch.
        </p>

    </div>
  </motion.div>
);

const JobItem = memo(({ job, isActive }) => {
  const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
  const timeGroup = `${job['Time slot'] || 'N/A'}`;
  const talentDisplay = combineNames(job['Talent 1'], job['Talent 2']);
  const coordDisplay = combineNames(job['Coordinator 1'], job['Coordinator 2']);
  const locationDisplay = combineLocation(job);
  const sessionTypeDisplay = job['Type of session'] && job['Type of session'].trim() !== '' ? job['Type of session'] : '—';
  
  const defaultUpdateMessage = "Đang cập nhật...";

  const handleQuickReport = useCallback(() => {
    alert(`Tính năng đang được triển khai bạn vui lòng chờ nha!!!`);
  }, [job]);

  return (
    <motion.div 
      className={`schedule-item ${isActive ? 'job-active' : ''}`}
      variants={itemVariants}
    >
      {/* 🌟 KHỐI 1: TÊN CỬA HÀNG VÀ NÚT REPORT (ĐÃ TỐI ƯU CĂN CHỈNH) */}
      <div className="job-header-row" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '15px' 
      }}>
        
        {/* Tiêu đề: Cho phép co lại nếu cần */}
        <h4 className="job-title-main" style={{ 
            margin: 0, 
            paddingRight: '10px', 
            flexShrink: 1, 
            minWidth: '50%' 
        }}>
            {job.Store || 'Unnamed Job'}
        </h4> 
        
        {/* NÚT ĐIỀN REPORT NHANH (FORMAT ĐẸP) */}
        <button 
          className="quick-report-button" 
          onClick={handleQuickReport}
          title="Điền Report Nhanh"
        >
          <FiEdit3 size={16} />
          Điền Report Nhanh
        </button>
      </div>
      
      {/* CÁC MỤC THÔNG TIN CHÍNH */}
      <p className="time"><FiClock /> {timeGroup}</p>
      <p className="location"><FiMapPin /> {locationDisplay}</p>
      <p className="session"><FiMic /> Loại Ca: {sessionTypeDisplay}</p> 
      <p className="mc"><FiUser /> {talentDisplay}</p>
      <p className="standby"><FiMonitor /> {coordDisplay}</p>

      {/* KHỐI 2 CỘT ỔN ĐỊNH: SỬ DỤNG CLASS CSS GRID */}
      <div className="job-groups-footer-container">
          <div className="group-brand job-group-item">
            <FiUsers size={18} className="job-group-icon" /> 
            Group Brand: <span className="job-group-value">{defaultUpdateMessage}</span>
          </div>
          <div className="group-host job-group-item">
            <FiUserCheck size={18} className="job-group-icon" />
            Group Host: <span className="job-group-value">{defaultUpdateMessage}</span>
          </div>
      </div>

    </motion.div>
  );
});

// --- COMPONENT APP CHÍNH ---
function App() {
  const [theme, toggleTheme] = useDarkMode();
  const { jobs, isLoading, uniqueDates, uniqueSessions, uniqueStores, error } = useJobData();
  
  const [dateFilter, setDateFilter] = useState(() => getFormattedToday());
  const [inputValue, setInputValue] = useState(''); 
  const [nameFilter, setNameFilter] = useState(''); 
  const [sessionFilter, setSessionFilter] = useState('');
  const [storeFilter, setStoreFilter] = useState('');

  // State và hàm quản lý thông báo tạm thời
  const [tempNotification, setTempNotification] = useState(null); 
  const showTempNotification = useCallback((message) => setTempNotification(message), []);
  const dismissTempNotification = useCallback(() => setTempNotification(null), []);

  // State và hàm kiểm soát Popup chính (Thông Báo Quan Trọng)
  const [isAuthPopupVisible, setIsAuthPopupVisible] = useState(true);
  const showAuthPopup = useCallback(() => setIsAuthPopupVisible(true), []);
  const hideAuthPopup = useCallback(() => setIsAuthPopupVisible(false), []);


  useEffect(() => {
    const timerId = setTimeout(() => setNameFilter(inputValue), 300);
    return () => clearTimeout(timerId);
  }, [inputValue]);
  
  // 🌟 THÊM: SỬ DỤNG STATE ĐỂ BUỘC RE-RENDER THƯỜNG XUYÊN CHO HIGHLIGHT
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
      const intervalId = setInterval(() => setCurrentTime(new Date()), 60000); // Cập nhật mỗi 1 phút
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

  // 🌟 TỐI ƯU HÓA: CHỈ LẤY 30 JOBS ĐẦU TIÊN
  const limitedJobs = useMemo(() => {
      return filteredJobs.slice(0, 30);
  }, [filteredJobs]);

  // Logic Gom Nhóm (Dựa trên 50 jobs)
  const groupedJobs = useMemo(() => {
    return limitedJobs.reduce((acc, job) => { // 👈 Dùng limitedJobs
      const timeGroup = job['Time slot'] || 'N/A';
      if (!acc[timeGroup]) acc[timeGroup] = [];
      acc[timeGroup].push(job);
      return acc;
    }, {});
  }, [limitedJobs]); // 👈 Dùng limitedJobs

  const jobGroups = Object.keys(groupedJobs);
  const totalFilteredCount = filteredJobs.length; // 👈 Đếm tổng số lượng thực tế

  // Giao diện
  return (
    <div className="App">
        {/* Truyền state và hàm điều khiển vào popup */}
        <NotificationPopup isVisible={isAuthPopupVisible} setIsVisible={hideAuthPopup} /> 
        
      {/* Truyền showAuthPopup và showTempNotification xuống Header */}
      <Header 
        theme={theme} 
        toggleTheme={toggleTheme} 
        showAuthPopup={showAuthPopup}
      />
      
      {/* Hiển thị thông báo tạm thời */}
      <TemporaryNotification message={tempNotification} onDismiss={dismissTempNotification} />

      <main>
        {/* Truyền hàm thông báo xuống FilterBar */}
        <FilterBar 
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          inputValue={inputValue}
          setInputValue={setInputValue}
          uniqueDates={uniqueDates}
          filteredJobs={limitedJobs} // 👈 Chỉ export 50 jobs
          
          sessionFilter={sessionFilter}
          setSessionFilter={setSessionFilter}
          uniqueSessions={uniqueSessions}

          storeFilter={storeFilter}
          setStoreFilter={setStoreFilter}
          uniqueStores={uniqueStores}
          showTempNotification={showTempNotification}
        />
        
        {/* 🌟 HIỂN THỊ SỐ LƯỢNG CÔNG VIỆC (Đã cập nhật) */}
        {jobs.length > 0 && jobGroups.length > 0 && (
            <motion.div 
                className="job-count-summary"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <FiFilter size={18} style={{marginRight: '8px'}}/>
                Tìm thấy <strong style={{color: 'var(--color-brand)'}}>{totalFilteredCount}</strong> công việc
                {totalFilteredCount > 50 && ( // 👈 Cập nhật thành 50
                    <span style={{marginLeft: '5px', color: 'var(--color-danger)'}}>(Đang hiển thị 30 jobs đầu tiên)</span>
                )}
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
          ) : (jobs.length > 0 && jobGroups.length === 0) ? (
            <EmptyState dateFilter={dateFilter} />
          ) : (
            <AnimatePresence>
              {jobGroups.map(timeGroup => (
                <motion.div 
                  key={timeGroup} 
                  className="time-group-container"
                  initial="hidden" animate="visible" exit="hidden"
                  variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
                > 
                  <h3 className="schedule-group-title">{timeGroup}</h3>
                  {groupedJobs[timeGroup].map((job, index) => (
                    <JobItem 
                        key={`${timeGroup}-${index}`} 
                        job={job} 
                        isActive={isJobActive(job)} // 👈 Gắn trạng thái hoạt động
                    />
                  ))}
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;