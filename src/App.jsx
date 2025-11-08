import { useState, useMemo, useEffect } from 'react';
import Papa from 'papaparse';
import { motion, AnimatePresence } from 'framer-motion';
// ⚠️ QUAN TRỌNG: Đảm bảo bạn đã cài SWR
import useSWR from 'swr';
import { 
  FiClock, FiMapPin, FiMic, FiUser, FiMonitor,
  FiMoon, FiSun,
  FiSearch
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
    const [hour, minute] = timeStr.split(':');
    return new Date(year, month - 1, day, hour, minute);
  } catch (e) { return new Date(0); }
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
  // ⚠️ ĐÃ DÁN LINK EXPORT CSV MỚI CỦA BẠN VÀO ĐÂY
  const dataUrl = 'https://docs.google.com/spreadsheets/d/1716aQ1XqHDiHB4LHSClVYglY0Cgf60TVJ7RYjqlwsOM/export?format=csv&gid=2068764011';

  const { data: rawData, error, isLoading } = useSWR(
    dataUrl,
    csvFetcher,
    {
      refreshInterval: 60000, // Tự động cập nhật mỗi 60 giây
      revalidateOnFocus: true
    }
  );

  const processedData = useMemo(() => {
    if (!rawData || error) return { jobs: [], dates: [] };

    // Lọc bỏ dòng rỗng (dựa trên cột 'Date livestream')
    const validData = rawData.filter(row => row['Date livestream'] && row['Date livestream'].includes('/'));
    
    // Sắp xếp (dựa trên cột 'Date livestream' và 'StartTime')
    const sortedData = validData.sort((a, b) => {
      const dtA = parseDate(a['Date livestream'], a.StartTime);
      const dtB = parseDate(b['Date livestream'], b.StartTime);
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

// --- UI COMPONENTS (GỘP CHUNG) ---

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

const FilterBar = ({ dateFilter, setDateFilter, inputValue, setInputValue, uniqueDates }) => (
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
        placeholder="e.g., Quốc Huy" 
        value={inputValue} 
        onChange={(e) => setInputValue(e.target.value)} 
      />
    </div>
  </div>
);

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

const EmptyState = () => (
  <motion.div className="empty-state" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
    <FiSearch className="empty-state-icon" />
    <h3>No Results Found</h3>
    <p>Please try a different name or select another date.</p>
  </motion.div>
);

const JobItem = ({ job }) => {
  const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
  const timeGroup = `${job.StartTime || 'N/A'}–${job.EndTime || 'N/A'}`;
  
  return (
    <motion.div className="schedule-item" variants={itemVariants}>
      {/* ⚠️ GIẢ ĐỊNH TÊN CỘT: Sửa 'job.JobName' thành 'job.Store' */}
      <h4>{job.Store || 'Unnamed Job'}</h4>
      <p className="time"><FiClock /> {timeGroup}</p>
      {/* ⚠️ GIẢ ĐỊNH TÊN CỘT: Sửa 'job.Location' thành 'job.Address' */}
      <p className="location"><FiMapPin /> {job.Address || 'No location'}</p>
      <p className="session"><FiMic /> Session type: {job['Type of session'] || '—'}</p>
      {/* ⚠️ GIẢ ĐỊNH TÊN CỘT: Sửa 'job.MC' thành 'job.Talent 1' */}
      <p className="mc"><FiUser /> {job['Talent 1'] || '...'}</p>
      {/* ⚠️ GIẢ ĐỊNH TÊN CỘT: Sửa 'job.Standby' thành 'job.Coordinator 1' */}
      <p className="standby"><FiMonitor /> {job['Coordinator 1'] || '...'}</p>
    </motion.div>
  );
};

// --- COMPONENT APP CHÍNH ---
function App() {
  const [theme, toggleTheme] = useDarkMode();
  const { jobs, isLoading, uniqueDates, error } = useJobData();
  
  const [dateFilter, setDateFilter] = useState(() => localStorage.getItem('lastViewedDate') || '');
  const [inputValue, setInputValue] = useState('Quốc Huy'); 
  const [nameFilter, setNameFilter] = useState('Quốc Huy'); 

  useEffect(() => {
    const timerId = setTimeout(() => setNameFilter(inputValue), 300);
    return () => clearTimeout(timerId);
  }, [inputValue]);

  useEffect(() => {
    localStorage.setItem('lastViewedDate', dateFilter);
  }, [dateFilter]);

  // Logic lọc
  const filteredJobs = useMemo(() => {
    let jobsToFilter = jobs;
    const normNameFilter = removeAccents(nameFilter.toLowerCase().trim());
    if (normNameFilter) {
      jobsToFilter = jobsToFilter.filter(job => {
        // ⚠️ GIẢ ĐỊNH TÊN CỘT: Sửa logic lọc
        const mc = removeAccents((job['Talent 1'] || '').toLowerCase()).includes(normNameFilter);
        const standby = removeAccents((job['Coordinator 1'] || '').toLowerCase()).includes(normNameFilter);
        const jobName = removeAccents((job.Store || '').toLowerCase()).includes(normNameFilter);
        const location = removeAccents((job.Address || '').toLowerCase()).includes(normNameFilter);
        return mc || standby || jobName || location;
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
      const timeGroup = `${job.StartTime || 'N/A'}–${job.EndTime || 'N/A'}`;
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
            <EmptyState />
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