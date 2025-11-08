import { useState, useMemo, useEffect } from 'react';
import Papa from 'papaparse';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiClock, FiMapPin, FiMic, FiUser, FiMonitor, // Job Icons
  FiMoon, FiSun, // Dark Mode Icons
  FiSearch // Empty State Icon
} from 'react-icons/fi';
import './App.css'; 

// --- CÀI ĐẶT ---
const CACHE_DURATION = 3600 * 1000; // 1 giờ

// Hàm loại bỏ dấu (Không đổi)
const removeAccents = (str) => {
  if (!str) return '';
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d").replace(/Đ/g, "D");
};

// --- LOGIC: DARK MODE (Không đổi) ---
function useDarkMode() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.body.setAttribute('data-theme', theme);
  }, [theme]);
  return [theme, toggleTheme];
}

// --- ⚠️ BƯỚC 1: SỬA LỖI LOGIC TẢI DỮ LIỆU ---
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
        download: true, 
        header: true, 
        skipEmptyLines: true, 
        // ⚠️ SỬA LỖI Ở ĐÂY: Tắt dynamicTyping
        // Bằng cách này, "11/11/2025" sẽ luôn là dạng chuỗi (string)
        dynamicTyping: false, 
        complete: (results) => {
          const sortedData = results.data.sort((a, b) => {
            // Giờ chúng ta phải parse thủ công vì đã tắt dynamicTyping
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

  const uniqueDates = useMemo(() => [...new Set(allJobs.map(job => job.Date))], [allJobs]);
  return { jobs: allJobs, isLoading, uniqueDates };
}

// --- UI COMPONENTS (Không đổi) ---

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
        placeholder="e.g., Quoc Huy" 
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

// --- COMPONENT APP CHÍNH (Không đổi) ---
function App() {
  const [theme, toggleTheme] = useDarkMode();
  const { jobs, isLoading, uniqueDates } = useJobData();
  const [dateFilter, setDateFilter] = useState(() => localStorage.getItem('lastViewedDate') || '');
  const [inputValue, setInputValue] = useState('Quoc Huy'); 
  const [nameFilter, setNameFilter] = useState('Quoc Huy'); 

  useEffect(() => {
    const timerId = setTimeout(() => setNameFilter(inputValue), 300);
    return () => clearTimeout(timerId);
  }, [inputValue]);

  useEffect(() => {
    localStorage.setItem('lastViewedDate', dateFilter);
  }, [dateFilter]);

  // Logic lọc (Không đổi - Vẫn hoạt động tốt)
  const filteredJobs = useMemo(() => {
    let jobsToFilter = jobs;
    const normNameFilter = removeAccents(nameFilter.toLowerCase().trim());

    if (normNameFilter) {
      jobsToFilter = jobsToFilter.filter(job => {
        const mc = removeAccents((job.MC || '').toLowerCase()).includes(normNameFilter);
        const standby = removeAccents((job.Standby || '').toLowerCase()).includes(normNameFilter);
        const jobName = removeAccents((job.JobName || '').toLowerCase()).includes(normNameFilter);
        const location = removeAccents((job.Location || '').toLowerCase()).includes(normNameFilter);
        return mc || standby || jobName || location;
      });
    }

    // Logic lọc ngày (BÂY GIỜ SẼ ĐÚNG)
    // "11/11/2025" (string) === "11/11/2025" (string) -> TRUE
    if (dateFilter) { 
      jobsToFilter = jobsToFilter.filter(job => (job.Date || '').toString() === dateFilter);
    }
    return jobsToFilter;
  }, [jobs, dateFilter, nameFilter]); 

  const groupedJobs = useMemo(() => {
    return filteredJobs.reduce((acc, job) => {
      const timeGroup = `${job.StartTime}–${job.EndTime}`;
      if (!acc[timeGroup]) acc[timeGroup] = [];
      acc[timeGroup].push(job);
      return acc;
    }, {});
  }, [filteredJobs]);

  const jobGroups = Object.keys(groupedJobs);

  // Giao diện (Không đổi)
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