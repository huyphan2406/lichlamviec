import { useState, useMemo, useEffect } from 'react';
import Papa from 'papaparse';
import { motion, AnimatePresence } from 'framer-motion';
import useSWR from 'swr';
// ⚠️ BƯỚC 1: IMPORT THƯ VIỆN 'ics'
import * as ics from 'ics';
import { 
  FiClock, FiMapPin, FiMic, FiUser, FiMonitor,
  FiMoon, FiSun,
  FiSearch, FiDownload // Thêm icon Download
} from 'react-icons/fi';
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

// HÀM LẤY NGÀY HÔM NAY (DD/MM/YYYY)
const getFormattedToday = () => {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0'); // Tháng 0-11
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
    // 1. Chuyển đổi jobs đã lọc thành định dạng sự kiện ics
    const events = filteredJobs.map(job => {
      try {
        const [day, month, year] = job['Date livestream'].split('/');
        const [startTimeStr, endTimeStr] = (job['Time slot'] || '00:00 - 00:00').split(' - ');
        
        const [startHour, startMinute] = startTimeStr.split(':').map(Number);
        const [endHour, endMinute] = (endTimeStr || startTimeStr).split(':').map(Number); 

        // Tính thời lượng
        const startDate = new Date(0, 0, 0, startHour, startMinute);
        const endDate = new Date(0, 0, 0, endHour, endMinute);
        let diffMs = endDate.getTime() - startDate.getTime();
        if (diffMs <= 0) diffMs = 60 * 60 * 1000; // Mặc định 1 tiếng nếu lỗi

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

    // 2. Tạo file ics
    const { error, value } = ics.createEvents(events);

    if (error) {
      console.error(error);
      alert("Error creating ICS file.");
      return;
    }

    // 3. Kích hoạt tải file
    const blob = new Blob([value], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `schedule_${dateFilter.replace(/\//g, '-') || 'all'}.ics`);
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
          placeholder="e.g., Your Name" // Sửa lại placeholder
          value={inputValue} 
          onChange={(e) => setInputValue(e.target.value)} 
        />
      </div>
      {/* Nút Download Mới */}
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

  // ⚠️ FIX LỖI: Thêm 2 dòng state bị thiếu
  const [inputValue, setInputValue] = useState(''); 
  const [nameFilter, setNameFilter] = useState(''); 

  useEffect(() => {
    const timerId = setTimeout(() => setNameFilter(inputValue), 300);
    return () => clearTimeout(timerId);
  }, [inputValue]);

  // (Đã xóa useEffect lưu cache ngày xem)

  // Logic lọc (Đã fix lỗi tìm Tiếng Việt)
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