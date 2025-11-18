import { useState, useMemo, useEffect, useCallback, memo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useSWR from 'swr';
import { 
  FiClock, FiMapPin, FiMic, FiUser, FiMonitor,
  FiMoon, FiSun,
  FiSearch, FiDownload, FiX, FiZap,
  FiCalendar, FiInfo, FiTag, FiAward,
  FiLogIn, FiUserPlus,
  FiFilter, FiUsers, FiUserCheck, FiEdit3, 
  FiBarChart2
} from 'react-icons/fi';
import { useVirtualizer } from '@tanstack/react-virtual';
import './App.css'; 

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
    
    {/* 🌟 HÀNG 2: KHỐI ĐIỀU KHIỂN (Cân 2 bên) */}
    <div className="header-controls">

      {/* Nút CRM (Đã bị ẩn/xóa theo yêu cầu trước, nhưng vẫn giữ code nếu bạn cần) */}
      {/* <button 
        className="auth-button crm-dashboard-button" 
        title="Dashboard CRM"
        onClick={() => alert("Chức năng Dashboard/CRM đang được phát triển!")}
        style={{ flexShrink: 0 }} 
      >
        <FiBarChart2 size={16} />
        <span>CRM</span>
      </button> 
      */}
      
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
  const [inputValue, setInputValue] = useState(''); 

  // 🌟 TỐI ƯU HÓA 4: Debounce (làm trễ) việc cập nhật bộ lọc
  useEffect(() => {
    const timerId = setTimeout(() => {
        setNameFilter(inputValue); // ...rồi mới cập nhật state của App
    }, 300);
    
    return () => {
        clearTimeout(timerId); // Xóa timer nếu người dùng gõ tiếp
    };
  }, [inputValue, setNameFilter]); 
  
  
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
      <div className="job-header-row">
        <h4 className="job-title-with-button">{job.Store || 'Unnamed Job'}</h4> 
        
        <button 
          className="quick-report-button" 
          onClick={handleQuickReport}
          title="Điền Report Nhanh"
        >
          <FiEdit3 size={16} />
          Điền Report Nhanh
        </button>
      </div>
      
      <p className="time"><FiClock /> {timeGroup}</p>
      <p className="location"><FiMapPin /> {locationDisplay}</p>
      <p className="session"><FiMic /> Loại Ca: {sessionTypeDisplay}</p> 
      <p className="mc"><FiUser /> {talentDisplay}</p>
      <p className="standby"><FiMonitor /> {coordDisplay}</p>

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
  const [nameFilter, setNameFilter] = useState(''); 
  const [sessionFilter, setSessionFilter] = useState('');
  const [storeFilter, setStoreFilter] = useState('');

  const [tempNotification, setTempNotification] = useState(null); 
  const showTempNotification = useCallback((message) => setTempNotification(message), []);
  const dismissTempNotification = useCallback(() => setTempNotification(null), []);

  const [isAuthPopupVisible, setIsAuthPopupVisible] = useState(true);
  const showAuthPopup = useCallback(() => setIsAuthPopupVisible(true), []);
  const hideAuthPopup = useCallback(() => setIsAuthPopupVisible(false), []);

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


  // 🌟 TỐI ƯU HÓA 2: Khởi tạo Virtualizer
  const parentRef = useRef(null);
  
  const rowVirtualizer = useVirtualizer({
    count: flatRowItems.length, 
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
        const itemType = flatRowItems[index]?.type;
        return itemType === 'HEADER' ? 50 : 360; // 50px cho Header, 360px cho JobItem
    },
    overscan: 5, 
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  const totalFilteredCount = filteredJobs.length;

  // Giao diện
  return (
    <div className="App">
        <NotificationPopup isVisible={isAuthPopupVisible} setIsVisible={hideAuthPopup} /> 
        
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
            // 🌟 TỐI ƯU HÓA 2: ÁP DỤNG VIRTUALIZER
            <div 
                ref={parentRef} 
                className="virtual-list-container" // 👈 Container cuộn
            >
                <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
                    {virtualItems.map((virtualItem) => {
                        const item = flatRowItems[virtualItem.index];
                        
                        if (!item) {
                            return null; 
                        }
                        
                        return (
                            <div
                                key={item.id}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    transform: `translateY(${virtualItem.start}px)`,
                                    paddingBottom: '15px' // 👈 Thêm padding dưới để tạo khoảng cách
                                }}
                            >
                                {item.type === 'HEADER' ? (
                                    <h3 className="schedule-group-title">{item.content}</h3>
                                ) : (
                                    <JobItem 
                                        job={item.content} 
                                        isActive={item.isActive} 
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;