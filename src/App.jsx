import { useState, useMemo, useEffect } from 'react';
import './App.css'; 

// Import các hook và component
import { useDarkMode } from './hooks/useDarkMode';
import { useJobData } from './hooks/useJobData';
import Header from './components/Header';
import FilterBar from './components/FilterBar';
import ScheduleList from './components/ScheduleList';

function App() {
  // --- LOGIC (Hooks) ---
  const [theme, toggleTheme] = useDarkMode();
  const { jobs, isLoading, uniqueDates } = useJobData();

  // --- STATE (Filters) ---
  // Ý 1: Đọc cache ngày xem, nếu không có thì là '' (Tất cả)
  const [dateFilter, setDateFilter] = useState(() => 
    localStorage.getItem('lastViewedDate') || ''
  );
  const [inputValue, setInputValue] = useState('Quốc Huy'); 
  const [nameFilter, setNameFilter] = useState('Quốc Huy'); 

  // --- EFFECTS (Debounce & Cache Filter) ---
  // Debounce (trì hoãn) ô tìm kiếm
  useEffect(() => {
    const timerId = setTimeout(() => {
      setNameFilter(inputValue); 
    }, 300);
    return () => clearTimeout(timerId);
  }, [inputValue]);

  // Ý 1: Lưu cache ngày xem
  useEffect(() => {
    localStorage.setItem('lastViewedDate', dateFilter);
  }, [dateFilter]);

  
  // --- LOGIC LỌC & GOM NHÓM (Dùng useMemo) ---
  const filteredJobs = useMemo(() => {
    let jobsToFilter = jobs;
    const normNameFilter = nameFilter.toLowerCase().trim();

    if (normNameFilter) {
      jobsToFilter = jobsToFilter.filter(job => {
        const mcMatch = job.MC ? job.MC.toLowerCase().includes(normNameFilter) : false;
        const standbyMatch = job.Standby ? job.Standby.toLowerCase().includes(normNameFilter) : false;
        const jobNameMatch = job.TenCongViec ? job.TenCongViec.toLowerCase().includes(normNameFilter) : false;
        return mcMatch || standbyMatch || jobNameMatch;
      });
    }

    if (dateFilter) { 
      jobsToFilter = jobsToFilter.filter(job => 
        (job.Ngay ? job.Ngay.toString() : '') === dateFilter
      );
    }
    return jobsToFilter;
  }, [jobs, dateFilter, nameFilter]); 

  const groupedJobs = useMemo(() => {
    return filteredJobs.reduce((acc, job) => {
      const timeGroup = `${job.ThoiGianBatDau}–${job.ThoiGianKetThuc}`;
      if (!acc[timeGroup]) {
        acc[timeGroup] = [];
      }
      acc[timeGroup].push(job);
      return acc;
    }, {});
  }, [filteredJobs]);

  
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
        <ScheduleList 
          isLoading={isLoading}
          groupedJobs={groupedJobs}
        />
      </main>
    </div>
  );
}

export default App;