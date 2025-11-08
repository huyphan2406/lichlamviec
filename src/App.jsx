import { useState, useMemo, useEffect } from 'react';
import Papa from 'papaparse';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiClock, FiMapPin, FiMic, FiUser, FiMonitor, // Job Icons
  FiMoon, FiSun, // Dark Mode Icons
  FiSearch // Empty State Icon
} from 'react-icons/fi';
import './App.css'; 

// --- SETTINGS ---
const CACHE_DURATION = 3600 * 1000; // 1 hour

// --- LOGIC: DARK MODE (Ý 4) ---
function useDarkMode() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  return [theme, toggleTheme];
}

// --- LOGIC: LOAD DATA (TỪ CSV) ---
function useJobData() {
  const [allJobs, setAllJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const dataUrl = '/data.csv';
    const now = new Date().getTime();
    const cachedData = localStorage.getItem("cachedJobs");
    const cacheTime = localStorage.getItem("cachedJobsTime");

    if (cachedData && cacheTime && (now - parseInt(cacheTime) < CACHE_DURATION)) {
      setAllJobs(JSON.parse(cachedData));
      setIsLoading(false);
    } else {
      Papa.parse(dataUrl, {
        download: true, header: true, skipEmptyLines: true, dynamicTyping: true,
        complete: (results) => {
          // CẬP NHẬT LOGIC (Tiếng Anh): Đọc cột "Date" và "StartTime"
          const sortedData = results.data.sort((a, b) => {
            const dtA = new Date(`${a.Date} ${a.StartTime}`);
            const dtB = new Date(`${b.Date} ${b.StartTime}`);
            return dtA - dtB;
          });
          setAllJobs(sortedData);
          setIsLoading(false);
          localStorage.setItem("cachedJobs", JSON.stringify(sortedData));
          localStorage.setItem("cachedJobsTime", now.toString());
        },
        error: (err) => {
          console.error("Error loading CSV:", err);
          setIsLoading(false);
        }
      });
    }
  }, []);

  // CẬP NHẬT LOGIC (Tiếng Anh): Đọc cột "Date"
  const uniqueDates = useMemo(() => [...new Set(allJobs.map(job => job.Date))], [allJobs]);
  return { jobs: allJobs, isLoading, uniqueDates };
}

// --- UI COMPONENTS ---

// 1. Header (Heading & Dark Mode)
// ⚠️ SỬA LỖI: Đã di chuyển 'toggleTheme' vào đúng 'onChange' của input
const Header = ({ theme, toggleTheme }) => (
  <header className="app-header">
    <h1>Work Schedule</h1>
    <label className="theme-toggle" title="Toggle Light/Dark Mode">
      {theme === 'light' ? <FiMoon size={18} /> : <FiSun size={18} />}
      <div className="theme-toggle-switch">
        <input 
          type="checkbox" 
          checked={theme === 'dark'} 
          onChange={toggleTheme} // Sửa lỗi ở đây
        />
        <span className="theme-toggle-slider"></span>
      </div>
    </label>
  </header>
);

// 2. Filter Bar (Dịch sang Tiếng Anh)
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
        placeholder="e.g., Your Name" 
        value={inputValue} 
        onChange={(e) => setInputValue(e.target.value)} 
      />
    </div>
  </div>
);

// 3. Skeleton Loader (Khung chờ tải)
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

// 4. Empty State (Dịch sang Tiếng Anh)
const EmptyState = () => (
  <motion.div className="empty-state" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
    <FiSearch className="empty-state-icon" />
    <h3>No Results Found</h3>
    <p>Please try a different name or select another date.</p>
  </motion.div>
);

// 5. Job Item (Cập nhật logic Tiếng Anh)
const JobItem = ({ job }) => {
  const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
  // CẬP NHẬT LOGIC (Tiếng Anh): Đọc cột "StartTime" và "EndTime"
  const timeGroup = `${job.StartTime}–${job.EndTime}`;
  
  return (
    <motion.div className="schedule-item" variants={itemVariants}>
      <h4>{job.JobName || '...'}</h4>
      <p className="time"><FiClock /> {timeGroup}</p>
      <p className="location"><FiMapPin /> {job.Location || '...'}</p>
      <p className="session"><FiMic /> Session type: {job.SessionType || '—'}</p>
      <p className="mc"><FiUser /> {job.MC || '...'}</p>
      <p className="standby"><FiMonitor /> {job.Standby || '...'}</p>
    </motion.div>
  );
};

// --- COMPONENT APP CHÍNH ---
function App() {
  // --- LOGIC (Hooks) ---
  const [theme, toggleTheme] = useDarkMode();
  const { jobs, isLoading, uniqueDates } = useJobData();

  // --- STATE (Filters) ---
  const [dateFilter, setDateFilter] = useState(() => localStorage.getItem('lastViewedDate') || '');
  const [inputValue, setInputValue] = useState('Quốc Huy'); // Đã dịch
  const [nameFilter, setNameFilter] = useState('Quốc Huy'); 

  // --- EFFECTS (Debounce & Cache Filter) ---
  useEffect(() => {
    const timerId = setTimeout(() => setNameFilter(inputValue), 300);
    return () => clearTimeout(timerId);
  }, [inputValue]);

  useEffect(() => {
    localStorage.setItem('lastViewedDate', dateFilter);
  }, [dateFilter]);

  // --- LOGIC LỌC & GOM NHÓM (Cập nhật logic Tiếng Anh) ---
  const filteredJobs = useMemo(() => {
    let jobsToFilter = jobs;
    const normNameFilter = nameFilter.toLowerCase().trim();
    if (normNameFilter) {
      jobsToFilter = jobsToFilter.filter(job => {
        const mc = (job.MC || '').toLowerCase().includes(normNameFilter);
        const standby = (job.Standby || '').toLowerCase().includes(normNameFilter);
        // CẬP NHẬT LOGIC (Tiếng Anh): Đọc cột "JobName"
        const jobName = (job.JobName || '').toLowerCase().includes(normNameFilter);
        return mc || standby || jobName;
      });
    }
    if (dateFilter) { 
      // CẬP NHẬT LOGIC (Tiếng Anh): Đọc cột "Date"
      jobsToFilter = jobsToFilter.filter(job => (job.Date || '').toString() === dateFilter);
    }
    return jobsToFilter;
  }, [jobs, dateFilter, nameFilter]); 

  const groupedJobs = useMemo(() => {
    return filteredJobs.reduce((acc, job) => {
      // CẬP NHẬT LOGIC (Tiếng Anh): Đọc cột "StartTime" và "EndTime"
      const timeGroup = `${job.StartTime}–${job.EndTime}`;
      if (!acc[timeGroup]) acc[timeGroup] = [];
      acc[timeGroup].push(job);
      return acc;
    }, {});
  }, [filteredJobs]);

  const jobGroups = Object.keys(groupedJobs);

  // --- GIAO DIỆN (JSX) ---
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
          {isLoading ? (
            <SkeletonLoader />
          ) : jobGroups.length === 0 ? (
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