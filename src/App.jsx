import { useState, useMemo, useEffect } from 'react';
import Papa from 'papaparse';
import { 
  FiClock, 
  FiMapPin, 
  FiMic, 
  FiUser, 
  FiMonitor 
} from 'react-icons/fi'; // Feather Icons
import './App.css'; // File CSS chúng ta sẽ làm ở bước 5

// Đặt thời gian cache (ví dụ: 1 giờ)
const CACHE_DURATION = 3600 * 1000;

function App() {
  // --- STATE ---
  const [allJobs, setAllJobs] = useState([]);
  const [dateFilter, setDateFilter] = useState('');
  
  // Tối ưu Debounce:
  const [nameFilter, setNameFilter] = useState('Quốc Huy'); // State đã trì hoãn
  const [inputValue, setInputValue] = useState('Quốc Huy'); // State gõ ngay lập tức
  
  // Tối ưu Loading:
  const [isLoading, setIsLoading] = useState(true);

  // --- TẢI DỮ LIỆU TỰ ĐỘNG + CACHING ---
  useEffect(() => {
    const dataUrl = '/data.csv'; // Trỏ đến file trong /public/data.csv
    const now = new Date().getTime();

    const cachedData = localStorage.getItem("cachedJobs");
    const cacheTime = localStorage.getItem("cachedJobsTime");

    // Kiểm tra cache
    if (cachedData && cacheTime && (now - parseInt(cacheTime) < CACHE_DURATION)) {
      setAllJobs(JSON.parse(cachedData));
      setIsLoading(false);
    } else {
      // Nếu không có cache, tải mới
      Papa.parse(dataUrl, {
        download: true,
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        complete: (results) => {
          const sortedData = results.data.sort((a, b) => {
            const dateTimeA = new Date(`${a.Ngay} ${a.ThoiGianBatDau}`);
            const dateTimeB = new Date(`${b.Ngay} ${b.ThoiGianBatDau}`);
            return dateTimeA - dateTimeB;
          });
          
          setAllJobs(sortedData);
          setIsLoading(false); 
          
          // Lưu vào cache
          localStorage.setItem("cachedJobs", JSON.stringify(sortedData));
          localStorage.setItem("cachedJobsTime", now.toString());
        },
        error: (err) => {
          console.error("Lỗi khi tải và đọc file CSV:", err);
          setIsLoading(false); 
        }
      });
    }
  }, []); // Mảng rỗng [] đảm bảo nó chỉ chạy 1 lần

  
  // --- DEBOUNCE EFFECT (TRÌ HOÃN TÌM KIẾM) ---
  useEffect(() => {
    const timerId = setTimeout(() => {
      setNameFilter(inputValue); // Cập nhật state filter chính
    }, 300); // 300 mili-giây

    return () => {
      clearTimeout(timerId); // Hủy bộ đếm nếu gõ tiếp
    };
  }, [inputValue]); // Chỉ chạy lại khi inputValue thay đổi

  
  // --- LOGIC LỌC (DÙNG useMemo) ---
  const filteredJobs = useMemo(() => {
    let jobs = allJobs;
    const normNameFilter = nameFilter.toLowerCase().trim();

    if (normNameFilter) {
      jobs = jobs.filter(job => {
        const mcMatch = job.MC ? job.MC.toLowerCase().includes(normNameFilter) : false;
        const standbyMatch = job.Standby ? job.Standby.toLowerCase().includes(normNameFilter) : false;
        const jobNameMatch = job.TenCongViec ? job.TenCongViec.toLowerCase().includes(normNameFilter) : false;
        return mcMatch || standbyMatch || jobNameMatch;
      });
    }

    if (dateFilter) { 
      jobs = jobs.filter(job => (job.Ngay ? job.Ngay.toString() : '') === dateFilter);
    }

    return jobs;
  }, [allJobs, dateFilter, nameFilter]); // Chỉ lọc lại khi các state chính này thay đổi

  
  // --- TÍNH TOÁN DANH SÁCH NGÀY (DÙNG useMemo) ---
  const uniqueDates = useMemo(() => {
    const dates = allJobs.map(job => job.Ngay);
    return [...new Set(dates)];
  }, [allJobs]);

  
  // --- LOGIC GOM NHÓM (DÙNG reduce) ---
  const groupedJobs = filteredJobs.reduce((acc, job) => {
    const timeGroup = `${job.ThoiGianBatDau}–${job.ThoiGianKetThuc}`;
    if (!acc[timeGroup]) {
      acc[timeGroup] = [];
    }
    acc[timeGroup].push(job);
    return acc;
  }, {});

  // --- GIAO DIỆN (JSX) ---
  return (
    <div className="App">
      <header>
        <h1>Lịch Làm Việc</h1>
      </header>

      <main>
        <div className="filter-container">
          <div className="form-group">
            <label htmlFor="dateInput">Ngày</label>
            <select
              id="dateInput"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option value="">Tất cả các ngày</option>
              {uniqueDates.map(date => (
                <option key={date} value={date}>{date}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="nameInput">Tìm</label>
            <input 
              type="text" 
              id="nameInput" 
              placeholder="VD: Quốc Huy"
              value={inputValue} // Hiển thị giá trị đang gõ
              onChange={(e) => setInputValue(e.target.value)} // Cập nhật state đang gõ
            />
          </div>
        </div>

        <div id="schedule-list" className="schedule-list">
          {isLoading ? (
            // Hiển thị khung chờ
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
          ) : filteredJobs.length === 0 ? (
            // Tải xong nhưng không có kết quả
            <p className='empty-state'>Không tìm thấy kết quả phù hợp.</p>
          ) : (
            // Tải xong và có kết quả
            Object.keys(groupedJobs).map(timeGroup => (
              <div key={timeGroup} className="time-group-container"> 
                <h3 className="schedule-group-title">{timeGroup}</h3>
                {groupedJobs[timeGroup].map((job, index) => (
                  <div className="schedule-item" key={`${timeGroup}-${index}`}>
                    <h4>{job.TenCongViec || '...'}</h4>
                    <p className="time"><FiClock /> {timeGroup}</p>
                    <p className="location"><FiMapPin /> {job.DiaDiem || '...'}</p>
                    <p className="session"><FiMic /> Session type: {job.SessionType || '—'}</p>
                    <p className="mc"><FiUser /> {job.MC || '...'}</p>
                    <p className="standby"><FiMonitor /> {job.Standby || '...'}</p>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

export default App;