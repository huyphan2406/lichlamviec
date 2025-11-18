import { useState, useMemo, useEffect, useCallback, memo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useSWR from 'swr';
import { 
  FiClock, FiMapPin, FiMic, FiUser, FiMonitor,
  FiMoon, FiSun,
  FiSearch, FiDownload, FiX, FiZap,
  FiCalendar, FiInfo, FiTag, FiAward,
  FiLogIn, FiUserPlus,
  FiFilter, FiUsers, FiUserCheck, FiEdit3 
} from 'react-icons/fi';
import { useVirtualizer } from '@tanstack/react-virtual';
import QuickReportForm from './QuickReportForm.jsx';
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

// HÀM TẢI DỮ LIỆU (FETCHER) JSON MỚI
const jsonFetcher = (url) => fetch(url).then((res) => res.json());

// HÀM KIỂM TRA CÔNG VIỆC ĐANG HOẠT ĐỘNG (60 PHÚT)
const isJobActive = (job) => {
    try {
        if (!job || !job['Date livestream'] || !job['Time slot']) {
            return false;
        }
        
        const now = new Date();
        const [day, month, year] = job['Date livestream'].split('/');
        const [startTimeStr, endTimeStr] = (job['Time slot'] || '00:00 - 00:00').split(' - ');
        
        const [startHour, startMinute] = startTimeStr.split(':').map(Number);
        const [endHour, endMinute] = (endTimeStr || startTimeStr).split(':').map(Number); 

        const jobStartTime = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), startHour, startMinute);
        const jobEndTime = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), endHour, endMinute);

        // Nếu end time < start time, có thể là ca đêm qua ngày hôm sau
        if (jobEndTime.getTime() < jobStartTime.getTime()) {
            jobEndTime.setDate(jobEndTime.getDate() + 1);
        }

        const isRunning = now.getTime() >= jobStartTime.getTime() && now.getTime() < jobEndTime.getTime();
        const soonThreshold = 60 * 60 * 1000; // 60 phút
        const timeToStart = jobStartTime.getTime() - now.getTime();
        const isStartingSoon = timeToStart > 0 && timeToStart <= soonThreshold;

        return isRunning || isStartingSoon;

    } catch (e) {
        console.error("Lỗi isJobActive:", e, job);
        return false;
    }
};

// --- HELPER NAMES/LOCATION ---
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

// TỐI ƯU HÓA: FETCH TỪ API ROUTE
function useJobData() {
  const API_URL = '/api/get-schedule'; 

  const { data, error, isLoading } = useSWR(
    API_URL,
    jsonFetcher, 
    {
      refreshInterval: 60000, 
      revalidateOnFocus: true
    }
  );

  return { 
    jobs: data?.jobs || [], 
    uniqueDates: data?.dates || [],
    uniqueSessions: data?.sessions || [],
    uniqueStores: data?.stores || [],
    isLoading: isLoading, 
    error 
  };
}

// --- COMPONENTS ---

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
            style={{ marginLeft: '10px', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <FiX size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const NotificationPopup = ({ isVisible, setIsVisible }) => {
    const handleDismiss = () => setIsVisible(false);

    return (
        <AnimatePresence>
            {isVisible && (
                <>
                    <motion.div className="popup-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={handleDismiss} />
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
                            <button className="popup-dismiss-btn" onClick={handleDismiss} title="Đóng"><FiX size={20} /></button>
                        </div>
                        <div className="popup-content">
                            <p className="popup-main-title"><strong>LỊCH LIVESTREAM NHANH & CHÍNH XÁC!</strong></p>
                            <p className="popup-content-text">Tra cứu nhanh lịch làm việc của <strong>Standby</strong> và <strong>Host</strong>.</p>
                            <hr className="popup-divider" />
                            <p className="popup-content-text popup-highlight-area">
                                **DÙNG THỬ:** Miễn phí tới ngày <strong className="highlight-date">30/11</strong>.<br/>
                                Sau ngày 30, bạn cần đăng kí tài khoản để tiếp tục sử dụng.
                            </p>
                            <hr className="popup-divider" />
                            <p className="popup-content-text popup-footer-area">
                                <strong>Tính năng đang được triển khai:</strong> Join nhanh group brand và host; điền nhanh report; dashboard thống kê jobs (CRM).<br/>
                                <span className="popup-author-simple"><FiAward size={14} /> Tác giả: Huy Phan</span>
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

const handleAuthClick = (showAuthPopup) => showAuthPopup();

const Header = ({ theme, toggleTheme, showAuthPopup }) => ( 
  <header className="app-header">
    <h1 className="header-title-centered">Lịch làm việc</h1>
    <div className="header-controls">
      {/* Nút Sáng/Tối bên TRÁI */}
      <label className="theme-toggle" title="Toggle Light/Dark Mode">
        {theme === 'light' ? <FiMoon size={18} /> : <FiSun size={18} />}
        <div className="theme-toggle-switch">
          <input type="checkbox" checked={theme === 'dark'} onChange={toggleTheme} />
          <span className="theme-toggle-slider"></span>
        </div>
      </label>
      
      {/* Khối Đăng nhập/Đăng ký bên PHẢI */}
      <div className="auth-buttons">
        <button className="auth-button login" title="Đăng nhập" onClick={() => handleAuthClick(showAuthPopup)} style={{ flexShrink: 0 }}>
          <FiLogIn size={16} /><span>Đăng nhập</span>
        </button>
        <button className="auth-button register" title="Đăng ký" onClick={() => handleAuthClick(showAuthPopup)} style={{ flexShrink: 0 }}>
          <FiUserPlus size={16} /><span>Đăng ký</span>
        </button>
      </div>
    </div>
  </header>
);

const FilterBar = ({ 
    dateFilter, setDateFilter, 
    setNameFilter, 
    uniqueDates, filteredJobs,
    sessionFilter, setSessionFilter,
    uniqueSessions, 
    storeFilter, setStoreFilter,
    uniqueStores,
    showTempNotification
}) => {
  const [inputValue, setInputValue] = useState(''); 

  useEffect(() => {
    const timerId = setTimeout(() => setNameFilter(inputValue), 300);
    return () => clearTimeout(timerId);
  }, [inputValue, setNameFilter]); 
  
  const handleDownloadICS = useCallback(async () => { 
    const ics = await import('ics');
    const events = filteredJobs.map(job => {
      try {
        const [day, month, year] = job['Date livestream'].split('/');
        const [startTimeStr, endTimeStr] = (job['Time slot'] || '00:00 - 00:00').split(' - ');
        const [startHour, startMinute] = startTimeStr.split(':').map(Number);
        const [endHour, endMinute] = (endTimeStr || startTimeStr).split(':').map(Number);
        
        // Tính duration chính xác
        const startDate = new Date(0, 0, 0, startHour, startMinute);
        const endDate = new Date(0, 0, 0, endHour, endMinute);
        let diffMs = endDate.getTime() - startDate.getTime();
        if (diffMs <= 0) diffMs = 60 * 60 * 1000; // Fallback 1 giờ nếu end < start
        
        const durationHours = Math.floor(diffMs / (1000 * 60 * 60));
        const durationMinutes = (diffMs / (1000 * 60)) % 60;
        
        return {
          title: job.Store || 'Unnamed Job',
          start: [parseInt(year), parseInt(month), parseInt(day), startHour, startMinute],
          duration: { hours: durationHours, minutes: durationMinutes },
          location: combineLocation(job),
          description: `MC: ${combineNames(job['Talent 1'], job['Talent 2'])}\nCoordinator: ${combineNames(job['Coordinator 1'], job['Coordinator 2'])}`
        };
      } catch (e) { return null; }
    }).filter(Boolean); 

    if (events.length === 0) {
      showTempNotification("Không có sự kiện hợp lệ nào để xuất lịch.");
      return;
    }

    const { error, value } = ics.createEvents(events);
    if (error) {
      console.error("Error creating ICS:", error);
      showTempNotification("Lỗi khi tạo file ICS.");
      return;
    }

    const blob = new Blob([value], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Schedule_${dateFilter.replace(/\//g, '-') || 'all'}.ics`);
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
              <input type="text" id="nameInput" placeholder="Nhập tên của bạn " value={inputValue} onChange={(e) => setInputValue(e.target.value)} />
            </div>
        </div>
      </div>
      <button className="download-button" onClick={handleDownloadICS} disabled={filteredJobs.length === 0}>
        <FiDownload size={18} /> Nhập vào Google Calendar (.ics)
      </button>
    </div>
  );
};

const SkeletonLoader = () => (
  <div className="skeleton-container">
    {[...Array(3)].map((_, i) => (
      <div className="skeleton-item" key={i}><div className="skeleton-line h4"></div><div className="skeleton-line p"></div><div className="skeleton-line p"></div><div className="skeleton-line p"></div></div>
    ))}
  </div>
);

const EmptyState = ({ dateFilter }) => (
  <motion.div className="empty-state" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
    <div style={{ border: '2px solid var(--color-danger)', borderRadius: '16px', padding: '25px', backgroundColor: 'var(--color-card)', width: '100%', boxSizing: 'border-box', boxShadow: '0 8px 25px rgba(220, 53, 69, 0.2)' }}>
        <h3 style={{ color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '12px', margin: '0 0 20px 0', paddingBottom: '10px', borderBottom: '1px solid var(--color-border)', fontSize: '1.3rem', fontWeight: 700 }}>
            <FiSearch size={24} style={{color: 'var(--color-danger)'}} /> KHÔNG TÌM THẤY LỊCH LÀM VIỆC!
        </h3>
        <p style={{ color: 'var(--color-text-primary)', fontWeight: 500, fontSize: '1.05em', margin: '0 0 15px 0' }}>
            <FiInfo size={18} style={{marginRight: '10px', color: 'var(--color-danger)'}}/> <strong style={{color: 'var(--color-danger)'}}>Lỗi:</strong> Không có công việc nào khớp với các tiêu chí lọc.
        </p>
        {dateFilter && (
            <p style={{ color: 'var(--color-text-primary)', fontSize: '1em', margin: '0 0 25px 0', padding: '10px 15px', borderLeft: '4px solid var(--color-brand)', backgroundColor: 'var(--color-brand-light)', borderRadius: '4px' }}>
                <span style={{ fontWeight: 600 }}>Đang lọc theo Ngày:</span> <strong style={{marginLeft: '5px'}}>{dateFilter}</strong>
            </p>
        )}
        <p style={{ color: 'var(--color-text-secondary)', fontWeight: 500, paddingTop: '15px', borderTop: '1px solid var(--color-border)', fontSize: '0.95em' }}>
            👉 Vui lòng điều chỉnh lại Ngày, Tên Cửa Hàng, hoặc Loại Phiên để xem lịch.
        </p>
    </div>
  </motion.div>
);

const JobItem = memo(({ job, isActive, onQuickReport }) => {
  const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
  const timeGroup = `${job['Time slot'] || 'N/A'}`;
  const talentDisplay = combineNames(job['Talent 1'], job['Talent 2']);
  const coordDisplay = combineNames(job['Coordinator 1'], job['Coordinator 2']);
  const locationDisplay = combineLocation(job);
  const sessionTypeDisplay = job['Type of session'] && job['Type of session'].trim() !== '' ? job['Type of session'] : '—';
  
  const defaultUpdateMessage = "Đang cập nhật...";

  const handleQuickReport = useCallback(() => {
    if (onQuickReport) {
      onQuickReport(job);
    }
  }, [job, onQuickReport]);

  return (
    <motion.div className={`schedule-item ${isActive ? 'job-active' : ''}`} variants={itemVariants}>
      <div className="job-header-row">
        <h4 className="job-title-with-button">{job.Store || 'Unnamed Job'}</h4> 
        <button className="quick-report-button" onClick={handleQuickReport} title="Điền Report Nhanh">
          <FiEdit3 size={16} /> Điền Report Nhanh
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

  const [quickReportJob, setQuickReportJob] = useState(null);
  const [isQuickReportVisible, setIsQuickReportVisible] = useState(false);
  const handleQuickReport = useCallback((job) => {
    setQuickReportJob(job);
    setIsQuickReportVisible(true);
  }, []);

  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
      const intervalId = setInterval(() => setCurrentTime(new Date()), 60000); 
      return () => clearInterval(intervalId);
  }, []);

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
    
    if (dateFilter) jobsToFilter = jobsToFilter.filter(job => (job['Date livestream'] || '').toString() === dateFilter);
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

  const groupedJobs = useMemo(() => {
    return filteredJobs.reduce((acc, job) => {
      const timeGroup = job['Time slot'] || 'N/A';
      if (!acc[timeGroup]) acc[timeGroup] = [];
      acc[timeGroup].push(job);
      return acc;
    }, {});
  }, [filteredJobs]);

  // Tối ưu hóa Virtualization: Flatten data
  const flatRowItems = useMemo(() => {
    const items = [];
    const jobGroups = Object.keys(groupedJobs);
    jobGroups.forEach(timeGroup => {
        items.push({ id: `header_${timeGroup}`, type: 'HEADER', content: timeGroup });
        groupedJobs[timeGroup].forEach((job, index) => {
            items.push({ id: `job_${timeGroup}_${index}`, type: 'JOB', content: job, isActive: isJobActive(job) });
        });
    });
    return items;
  }, [groupedJobs]);

  const parentRef = useRef(null);
  const rowVirtualizer = useVirtualizer({
    count: flatRowItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => (flatRowItems[index]?.type === 'HEADER' ? 50 : 360),
    overscan: 5, 
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  const totalFilteredCount = filteredJobs.length;

  return (
    <div className="App">
      <NotificationPopup isVisible={isAuthPopupVisible} setIsVisible={hideAuthPopup} /> 
      <QuickReportForm 
        isVisible={isQuickReportVisible} 
        setIsVisible={setIsQuickReportVisible} 
        job={quickReportJob}
        showTempNotification={showTempNotification}
      />
      <Header theme={theme} toggleTheme={toggleTheme} showAuthPopup={showAuthPopup} />
      <TemporaryNotification message={tempNotification} onDismiss={dismissTempNotification} />

      <main>
        <FilterBar 
          dateFilter={dateFilter} setDateFilter={setDateFilter}
          setNameFilter={setNameFilter}
          uniqueDates={uniqueDates} filteredJobs={filteredJobs} 
          sessionFilter={sessionFilter} setSessionFilter={setSessionFilter} uniqueSessions={uniqueSessions}
          storeFilter={storeFilter} setStoreFilter={setStoreFilter} uniqueStores={uniqueStores}
          showTempNotification={showTempNotification}
        />
        
        {jobs.length > 0 && totalFilteredCount > 0 && (
            <motion.div className="job-count-summary" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
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
            <div ref={parentRef} className="virtual-list-container">
                <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
                    {virtualItems.map((virtualItem) => {
                        const item = flatRowItems[virtualItem.index];
                        if (!item) return null; 
                        return (
                            <div key={item.id} style={{
                                position: 'absolute', top: 0, left: 0, width: '100%',
                                transform: `translateY(${virtualItem.start}px)`,
                                paddingBottom: '15px' 
                            }}>
                                {item.type === 'HEADER' ? (
                                    <h3 className="schedule-group-title">{item.content}</h3>
                                ) : (
                                    <JobItem 
                                      job={item.content} 
                                      isActive={item.isActive}
                                      onQuickReport={handleQuickReport}
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