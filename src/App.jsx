import { useState, useMemo, useEffect } from 'react';
import Papa from 'papaparse';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiClock, FiMapPin, FiMic, FiUser, FiMonitor, // Icons công việc
  FiMoon, FiSun, // Icons Dark Mode
  FiSearch // Icon Empty State
} from 'react-icons/fi';
import './App.css'; // File CSS ở bước 6

// --- CÀI ĐẶT ---
const CACHE_DURATION = 3600 * 1000; // 1 giờ

// --- LOGIC CHO DARK MODE (Ý 4) ---
function useDarkMode() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  return [theme, toggleTheme];
}

// --- LOGIC TẢI DỮ LIỆU (TỪ CSV) ---
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
          const sortedData = results.data.sort((a, b) => {
            const dtA = new Date(`${a.Ngay} ${a.ThoiGianBatDau}`);
            const dtB = new Date(`${b.Ngay} ${b.ThoiGianBatDau}`);
            return dtA - dtB;
          });
          setAllJobs(sortedData);
          setIsLoading(false);
          localStorage.setItem("cachedJobs", JSON.stringify(sortedData));
          localStorage.setItem("cachedJobsTime", now.toString());
        },
        error: (err) => {
          console.error("Lỗi khi tải CSV:", err);
          setIsLoading(false);
        }
      });
    }
  }, []);

  const uniqueDates = useMemo(() => [...new Set(allJobs.map(job => job.Ngay))], [allJobs]);
  return { jobs: allJobs, isLoading, uniqueDates };
}

// --- COMPONENT GIAO DIỆN ---
// (Đã gộp tất cả vào đây để tránh lỗi import)

// 1. Header (Ý 5 - Heading Đẹp & Dark Mode)
const Header = ({ theme, toggleTheme }) => (
  <header className="app-header">
    <h1>Lịch Làm Việc</h1>
    <div className="theme-toggle" onClick={toggleTheme} title="Đổi giao diện Sáng/Tối">
      {theme === 'light' ? <FiMoon size={18} /> : <FiSun size={18} />}
      <label className="theme-toggle-switch">
        <input type="checkbox" checked={theme === 'dark'} onChange={() => {}} />
        <span className="theme-toggle-slider"></span>
      </label>
    </div>
  </header>
);

// 2. Thanh Filter
const FilterBar = ({ dateFilter, setDateFilter, inputValue, setInputValue, uniqueDates }) => (
  <div className="filter-container">
    <div className="form-group">
      <label htmlFor="dateInput">Ngày</label>
      <select id="dateInput" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
        <option value="">Tất cả các ngày</option>
        {uniqueDates.map(date => <option key={date} value={date}>{date}</option>)}
      </select>
    </div>
    <div className="form-group">
      <label htmlFor="nameInput">Tìm</label>
      <input type="text" id="nameInput" placeholder="VD: Quốc Huy" value={inputValue} onChange={(e) => setInputValue(e.target.value)} />
    </div>
  </div>
);

// 3. Khung Chờ Tải
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

// 4. Trạng Thái Rỗng (Ý 3)
const EmptyState = () => (
  <motion.div className="empty-state" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
    <FiSearch className="empty-state-icon" />
    <h3>Không tìm thấy kết quả</h3>
    <p>Vui lòng thử tìm tên khác hoặc chọn ngày khác.</p>
  </motion.div>
);

// 5. Thẻ Công Việc (Ý 2 - Animation)
const JobItem = ({ job, timeGroup }) => {
  const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
  return (
    <motion.div className="schedule-item" variants={itemVariants}>
      <h4>{job.TenCongViec || '...'}</h4>
      <p className="time"><FiClock /> {timeGroup}</p>
      <p className="location"><FiMapPin /> {job.DiaDiem || '...'}</p>
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
  const [inputValue, setInputValue] = useState('Quốc Huy'); 
  const [nameFilter, setNameFilter] = useState('Quốc Huy'); 

  // --- EFFECTS (Debounce & Cache Filter - Ý 1) ---
  useEffect(() => {
    const timerId = setTimeout(() => setNameFilter(inputValue), 300);
    return () => clearTimeout(timerId);
  }, [inputValue]);

  useEffect(() => {
    localStorage.setItem('lastViewedDate', dateFilter);
  }, [dateFilter]);

  // --- LOGIC LỌC & GOM NHÓM (Dùng useMemo) ---
  const filteredJobs = useMemo(() => {
    let jobsToFilter = jobs;
    const normNameFilter = nameFilter.toLowerCase().trim();
    if (normNameFilter) {
      jobsToFilter = jobsToFilter.filter(job => {
        const mc = (job.MC || '').toLowerCase().includes(normNameFilter);
        const standby = (job.Standby || '').toLowerCase().includes(normNameFilter);
        const tenCV = (job.TenCongViec || '').toLowerCase().includes(normNameFilter);
        return mc || standby || tenCV;
      });
    }
    if (dateFilter) { 
      jobsToFilter = jobsToFilter.filter(job => (job.Ngay || '').toString() === dateFilter);
    }
    return jobsToFilter;
  }, [jobs, dateFilter, nameFilter]); 

  const groupedJobs = useMemo(() => {
    return filteredJobs.reduce((acc, job) => {
      const timeGroup = `${job.ThoiGianBatDau}–${job.ThoiGianKetThuc}`;
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
                    <JobItem key={`${timeGroup}-${index}`} job={job} timeGroup={timeGroup} />
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