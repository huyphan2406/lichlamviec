/*
=================================================
  File: App.jsx (Hoàn chỉnh)
=================================================
*/

import { useState, useMemo, useEffect } from 'react';
import Papa from 'papaparse';
import { motion, AnimatePresence } from 'framer-motion';
import useSWR from 'swr';
import * as ics from 'ics';
import { 
  // Icons cho JobItem
  FiClock, FiMapPin, FiMic, FiUser, FiMonitor,
  // Icons cho Header
  FiMoon, FiSun, FiLogIn, FiUserPlus,
  // Icons cho Filter & Popup
  FiSearch, FiDownload, FiX, FiZap 
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
    if (!rawData || error) return { jobs: [], dates: [] };
    const validData = rawData.filter(row => row['Date livestream'] && row['Date livestream'].includes('/'));
    const sortedData = validData.sort((a, b) => {
      const dtA = parseDate(a['Date livestream'], a['Time slot']);
      const dtB = parseDate(b['Date livestream'], b['Time slot']);
      return dtA - dtB;
    });
    const uniqueDates = [...new Set(sortedData.map(job => job['Date livestream']).filter(Boolean))];
    return { jobs: sortedData, dates: uniqueDates };
  }, [rawData, error]);

  return { 
    jobs: processedData.jobs, 
    uniqueDates: processedData.dates,
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
  return locationDisplay || 'Không có địa điểm';
};

// 🌟 COMPONENT POPUP THÔNG BÁO (PHIÊN BẢN GIỐNG ẢNH)
const NotificationPopup = () => {
    // Luôn hiển thị để test
    const [isVisible, setIsVisible] = useState(true);

    /*
    // Dòng code gốc, hãy dùng lại khi test xong:
    const [isVisible, setIsVisible] = useState(() => {
        return localStorage.getItem('dismissed_popup_15nov') !== 'true';
    });
    */

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem('dismissed_popup_15nov', 'true');
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <>
                    {/* Lớp nền mờ */}
                    <motion.div
                        className="popup-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleDismiss} // Click bên ngoài để tắt
                    />
                    
                    {/* Nội dung Popup */}
                    <motion.div 
                        className="popup-modal"
                        initial={{ opacity: 0, x: "-50%", y: "calc(-50% + 50px)" }}
                        animate={{ opacity: 1, x: "-50%", y: "-50%" }}
                        exit={{ opacity: 0, x: "-50%", y: "calc(-50% + 50px)" }}
                        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                    >
                        <div className="popup-content">
                            <p className="popup-title">
                                Lịch Livestream Nhanh & Chính Xác!
                            </p>
                            <p>
                                Web dùng để tra cứu lịch làm việc của <strong>Standby</strong> và <strong>Host</strong>.
                            </p>
                            <p>
                                Dùng miễn phí tới <strong className="highlight-date">15/11</strong>. Sau ngày 15, bạn cần đăng kí tài khoản để sử dụng.
                            </p>
                            <p>
                                Nhiều chức năng mới sẽ sớm được ra mắt...
                            </p>
                            
                            <p className="popup-author">
                                Tác giả: Quốc Huy
                            </p>
                        </div>

                        {/* Nút X để đóng */}
                        <button className="popup-dismiss-btn-hidden" onClick={handleDismiss} title="Đóng">
                            <FiX size={20} />
                        </button>

                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};


// --- UI COMPONENTS ---

const Header = ({ theme, toggleTheme }) => (
  <header className="app-header">
    {/* 🌟 ĐÃ SỬA */}
    <h1>Lịch Làm Việc</h1>
    
    <div className="header-controls">
      <div className="auth-buttons">
        <button className="auth-button login">
          <FiLogIn size={16} />
          <span>Đăng nhập</span>
        </button>
        <button className="auth-button register">
          <FiUserPlus size={16} />
          <span>Đăng ký</span>
        </button>
      </div>

      {/* 🌟 ĐÃ SỬA */}
      <label className="theme-toggle" title="Chuyển chế độ Sáng/Tối">
        {theme === 'light' ? <FiMoon size={18} /> : <FiSun size={18} />}
        <div className="theme-toggle-switch">
          <input type="checkbox" checked={theme === 'dark'} onChange={toggleTheme} />
          <span className="theme-toggle-slider"></span>
        </div>
      </label>
    </div>
  </header>
);

const FilterBar = ({ dateFilter, setDateFilter, inputValue, setInputValue, uniqueDates, filteredJobs }) => {
  
  const handleDownloadICS = () => {
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
      // 🌟 ĐÃ SỬA
      alert("Không có lịch hợp lệ để xuất.");
      return;
    }

    const { error, value } = ics.createEvents(events);

    if (error) {
      console.error("Error creating ICS file:", error);
      // 🌟 ĐÃ SỬA
      alert("Lỗi khi tạo file ICS.");
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
  };

  return (
    <div className="filter-container">
      <div className="form-group">
        {/* 🌟 ĐÃ SỬA */}
        <label htmlFor="dateInput">Lịch</label>
        <select id="dateInput" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
          {/* 🌟 ĐÃ SỬA */}
          <option value="">Tất cả ngày</option>
          {uniqueDates.map(date => <option key={date} value={date}>{date}</option>)}
        </select>
      </div>
      <div className="form-group">
        {/* 🌟 ĐÃ SỬA */}
        <label htmlFor="nameInput">Tìm tên</label>
        <input 
          type="text" 
          id="nameInput" 
          // 🌟 ĐÃ SỬA
          placeholder="VD: Nguyễn Văn A" 
          value={inputValue} 
          onChange={(e) => setInputValue(e.target.value)} 
        />
      </div>
      <button 
        className="download-button" 
        onClick={handleDownloadICS} 
        disabled={filteredJobs.length === 0}
      >
        <FiDownload size={18} />
        {/* 🌟 ĐÃ SỬA */}
        Xuất ra Google Calendar (.ics)
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
  <motion.div className="empty-state" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
    <FiSearch className="empty-state-icon" />
    {/* 🌟 ĐÃ SỬA */}
    <h3>Không tìm thấy kết quả</h3>
    <p>Không tìm thấy lịch nào {dateFilter ? `cho ngày ${dateFilter}` : ''}. Vui lòng thử tên hoặc ngày khác.</p>
  </motion.div>
);

const JobItem = ({ job }) => {
  const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
  // 🌟 ĐÃ SỬA
  const timeGroup = `${job['Time slot'] || 'Chưa rõ'}`;
  const talentDisplay = combineNames(job['Talent 1'], job['Talent 2']);
  const coordDisplay = combineNames(job['Coordinator 1'], job['Coordinator 2']);
  const locationDisplay = combineLocation(job);

  return (
    <motion.div className="schedule-item" variants={itemVariants}>
      {/* 🌟 ĐÃ SỬA */}
      <h4>{job.Store || 'Chưa đặt tên'}</h4>
      <p className="time"><FiClock /> {timeGroup}</p>
      <p className="location"><FiMapPin /> {locationDisplay}</p>
      {/* 🌟 ĐÃ SỬA */}
      <p className="session"><FiMic /> Loại phiên: {job['Type of session'] || '—'}</p>
      <p className="mc"><FiUser /> {talentDisplay}</p>
      <p className="standby"><FiMonitor /> {coordDisplay}</p>
    </motion.div>
  );
};

// --- COMPONENT APP CHÍNH ---
function App() {
  const [theme, toggleTheme] = useDarkMode();
  const { jobs, isLoading, uniqueDates, error } = useJobData();
  
  const [dateFilter, setDateFilter] = useState(() => getFormattedToday());
  const [inputValue, setInputValue] = useState(''); 
  const [nameFilter, setNameFilter] = useState(''); 

  useEffect(() => {
    const timerId = setTimeout(() => setNameFilter(inputValue), 300);
    return () => clearTimeout(timerId);
  }, [inputValue]);

  // Logic lọc
  const filteredJobs = useMemo(() => {
    let jobsToFilter = jobs;
    const normNameFilter = removeAccents(nameFilter.toLowerCase().trim());
    if (normNameFilter) {
      jobsToFilter = jobsToFilter.filter(job => {
        const talent1 = removeAccents((job['Talent 1'] || '').toLowerCase()).includes(normNameFilter);
        const talent2 = removeAccents((job['Talent 2'] || '').toLowerCase()).includes(normNameFilter);
        const coord1 = removeAccents((job['Coordinator 1'] || '').toLowerCase()).includes(normNameFilter);
        const coord2 = removeAccents((job['Coordinator 2'] || '').toLowerCase()).includes(normNameFilter);
        const jobName = removeAccents((job.Store || '').toLowerCase()).includes(normNameFilter);
        const location = removeAccents((job.Address || '').toLowerCase()).includes(normNameFilter);
        const studio = removeAccents((job.Studio || '').toLowerCase()).includes(normNameFilter);
        const room = removeAccents((job['Studio/Room'] || '').toLowerCase()).includes(normNameFilter);
        return talent1 || talent2 || coord1 || coord2 || jobName || location || studio || room;
      });
    }
    
    if (dateFilter) { 
      jobsToFilter = jobsToFilter.filter(job => (job['Date livestream'] || '').toString() === dateFilter);
    }
    return jobsToFilter;
  }, [jobs, dateFilter, nameFilter]); 

  // Logic Gom Nhóm
  const groupedJobs = useMemo(() => {
    return filteredJobs.reduce((acc, job) => {
      const timeGroup = job['Time slot'] || 'Chưa rõ';
      if (!acc[timeGroup]) acc[timeGroup] = [];
      acc[timeGroup].push(job);
      return acc;
    }, {});
  }, [filteredJobs]);

  const jobGroups = Object.keys(groupedJobs);

  // Giao diện
  return (
    <div className="App">
      <NotificationPopup /> 
        
      <Header theme={theme} toggleTheme={toggleTheme} />
      <main>
        <FilterBar 
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          inputValue={inputValue}
          setInputValue={setInputValue}
          uniqueDates={uniqueDates}
          filteredJobs={filteredJobs} 
        />
        <div id="schedule-list" className="schedule-list">
          {error ? (
             <motion.div className="empty-state" initial={{opacity:0}} animate={{opacity:1}}>
                <FiSearch className="empty-state-icon" style={{color: '#dc3545'}}/>
                {/* 🌟 ĐÃ SỬA */}
                <h3>Lỗi Tải Dữ Liệu</h3>
                <p>Không thể kết nối đến Google Sheet. Vui lòng kiểm tra lại đường dẫn hoặc quyền chia sẻ.</p>
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
                    <JobItem key={`${timeGroup}-${index}`} job={job} />
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