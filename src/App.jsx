/*
=================================================
  File: App.jsx (React Component)
=================================================
*/

import { useState, useMemo, useEffect } from 'react';
import Papa from 'papaparse';
import { motion, AnimatePresence } from 'framer-motion';
import useSWR from 'swr';
import * as ics from 'ics';
import { 
  FiClock, FiMapPin, FiMic, FiUser, FiMonitor,
  FiMoon, FiSun,
  FiSearch, FiDownload, FiX, FiZap
} from 'react-icons/fi';
// ⚠️ HÃY ĐẢM BẢO BẠN ĐÃ IMPORT CSS
import './App.css'; 

// --- HÀM HỖ TRỢ (ĐÃ FIX LỖI) ---
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

// --- HÀM HELPER CHO GIAO DIỆN (TÁI SỬ DỤNG) ---
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

// 🌟 COMPONENT POPUP THÔNG BÁO (ĐÃ HOÀN THIỆN)
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
                        
                        // 🌟 SỬA LỖI TẠI ĐÂY:
                        // Chuyển toàn bộ logic căn giữa và animation vào framer-motion
                        
                        // 1. Trạng thái ban đầu:
                        initial={{ 
                            opacity: 0,
                            x: "-50%", // Căn giữa theo chiều ngang
                            y: "calc(-50% + 50px)" // Căn giữa (y: -50%) VÀ đẩy xuống 50px
                        }}
                        
                        // 2. Trạng thái khi hiển thị (vị trí cuối):
                        animate={{ 
                            opacity: 1,
                            x: "-50%", // Giữ căn giữa
                            y: "-50%"  // Vị trí cuối cùng là căn giữa tuyệt đối
                        }}
                        
                        // 3. Trạng thái khi tắt:
                        exit={{ 
                            opacity: 0,
                            x: "-50%", // Giữ căn giữa
                            y: "calc(-50% + 50px)" // Quay về vị trí bị đẩy xuống
                        }}
                        
                        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                    >
                        <div className="popup-content">

    {/* Tiêu đề chính */}
    <p className="popup-main-title">
        Lịch Livestream Nhanh & Chính Xác!
    </p>

    {/* Nội dung mô tả */}
    <p>
        Web dùng để tra cứu lịch làm việc của <strong>Standby</strong> và <strong>Host</strong>.
    </p>
    
    {/* Thông báo chính với ngày được highlight */}
    <p>
        Dùng miễn phí tới <strong className="highlight-date">15/11</strong>.
        Sau ngày 15, bạn cần đăng kí tài khoản để sử dụng.
    </p>
    
    {/* Thông tin thêm và tác giả */}
    <p className="popup-footer-info">
        Nhiều chức năng mới sẽ sớm được ra mắt...
        
        {/* Tên tác giả, căn phải, in nghiêng và nhỏ hơn */}
        <span className="popup-author">
            Tác giả: Quốc Huy
        </span>
    </p>

</div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};


// --- UI COMPONENTS ---

const Header = ({ theme, toggleTheme }) => (
  <header className="app-header">
    <h1>Work Schedule</h1>
    <label className="theme-toggle" title="Toggle Light/Dark Mode">
      {theme === 'light' ? <FiMoon size={18} /> : <FiSun size={18} />}
      <div className="theme-toggle-switch">
        <input type="checkbox" checked={theme === 'dark'} onChange={toggleTheme} />
        <span className="theme-toggle-slider"></span>
      </div>
    </label>
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
      alert("No valid events to export.");
      return;
    }

    const { error, value } = ics.createEvents(events);

    if (error) {
      console.error("Error creating ICS file:", error);
      alert("Error creating ICS file.");
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
        <label htmlFor="dateInput">Date</label>
        <select id="dateInput" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
          <option value="">All Dates</option>
          {uniqueDates.map(date => <option key={date} value={date}>{date}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label htmlFor="nameInput">Search</label>
        <input 
          type="text" 
          id="nameInput" 
          placeholder="e.g., Your Name" 
          value={inputValue} 
          onChange={(e) => setInputValue(e.target.value)} 
        />
      </div>
      {/* 🌟 NÚT EXPORT ĐÃ ĐƯỢC SỬA LẠI */}
      <button 
        className="download-button" 
        onClick={handleDownloadICS} 
        disabled={filteredJobs.length === 0}
      >
        <FiDownload size={18} />
        Export To Google Calendar (.ics)
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
    <h3>No Results Found</h3>
    <p>No matching schedule found {dateFilter ? `for ${dateFilter}` : ''}. Please try a different name or date.</p>
  </motion.div>
);

const JobItem = ({ job }) => {
  const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
  const timeGroup = `${job['Time slot'] || 'N/A'}`;
  const talentDisplay = combineNames(job['Talent 1'], job['Talent 2']);
  const coordDisplay = combineNames(job['Coordinator 1'], job['Coordinator 2']);
  const locationDisplay = combineLocation(job);

  return (
    <motion.div className="schedule-item" variants={itemVariants}>
      <h4>{job.Store || 'Unnamed Job'}</h4>
      <p className="time"><FiClock /> {timeGroup}</p>
      <p className="location"><FiMapPin /> {locationDisplay}</p>
      <p className="session"><FiMic /> Session type: {job['Type of session'] || '—'}</p>
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
      const timeGroup = job['Time slot'] || 'N/A';
      if (!acc[timeGroup]) acc[timeGroup] = [];
      acc[timeGroup].push(job);
      return acc;
    }, {});
  }, [filteredJobs]);

  const jobGroups = Object.keys(groupedJobs);

  // Giao diện
  return (
    <div className="App">
        {/* 🌟 Đặt Popup ở đây (nó sẽ tự căn giữa) */}
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