import { useState, useMemo, useEffect } from 'react';
import Papa from 'papaparse';
import './App.css';

// Đặt thời gian cache (ví dụ: 1 giờ)
// 1 giờ * 60 phút * 60 giây * 1000 ms
const CACHE_DURATION = 3600 * 1000;

function App() {
  // --- STATE ---
  const [allJobs, setAllJobs] = useState([]);
  const [dateFilter, setDateFilter] = useState('');
  
  // --- TỐI ƯU #3: DEBOUNCE ---
  // State cho giá trị filter đã được "debounce" (trì hoãn)
  const [nameFilter, setNameFilter] = useState('Quốc Huy'); 
  // State cho giá trị gõ vào ô input ngay lập tức
  const [inputValue, setInputValue] = useState('Quốc Huy'); 
  
  // --- TỐI ƯU #4: LOADING STATE ---
  // State để theo dõi trạng thái tải dữ liệu
  const [isLoading, setIsLoading] = useState(true);

  
  // --- TỐI ƯU #4: TẢI DỮ LIỆU TỰ ĐỘNG + CACHING ---
  useEffect(() => {
    const dataUrl = '/data.csv';
    const now = new Date().getTime();

    // 1. Kiểm tra Cache (LocalStorage)
    const cachedData = localStorage.getItem("cachedJobs");
    const cacheTime = localStorage.getItem("cachedJobsTime");

    if (cachedData && cacheTime && (now - parseInt(cacheTime) < CACHE_DURATION)) {
      // Nếu cache còn hạn, dùng dữ liệu cache
      setAllJobs(JSON.parse(cachedData));
      setIsLoading(false); // Hoàn tất tải
    } else {
      // Nếu cache hết hạn hoặc không có, tải file mới
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
          setIsLoading(false); // Hoàn tất tải

          // 2. Lưu cache mới vào LocalStorage
          localStorage.setItem("cachedJobs", JSON.stringify(sortedData));
          localStorage.setItem("cachedJobsTime", now.toString());
        },
        error: (err) => {
          console.error("Lỗi khi tải và đọc file CSV:", err);
          setIsLoading(false); // Tải thất bại
        }
      });
    }
  }, []); // Mảng rỗng [] đảm bảo nó chỉ chạy 1 lần

  
  // --- TỐI ƯU #3: DEBOUNCE EFFECT ---
  // Effect này sẽ theo dõi "inputValue" (người dùng đang gõ)
  // và chỉ cập nhật "nameFilter" (dùng để lọc) sau khi người dùng ngừng gõ 300ms
  useEffect(() => {
    // Đặt một bộ đếm thời gian
    const timerId = setTimeout(() => {
      setNameFilter(inputValue); // Cập nhật state filter chính
    }, 300); // 300 mili-giây

    // Rất quan trọng: Hủy bộ đếm nếu người dùng gõ tiếp
    return () => {
      clearTimeout(timerId);
    };
  }, [inputValue]); // Chỉ chạy lại khi inputValue thay đổi

  
  // --- LOGIC LỌC (Không đổi) ---
  // Nó sẽ tự động được tối ưu vì chỉ chạy khi "nameFilter" (đã debounce) thay đổi
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
  }, [allJobs, dateFilter, nameFilter]); // Phụ thuộc vào nameFilter (đã debounce)

  
  // --- TÍNH TOÁN DANH SÁCH NGÀY (Không đổi) ---
  const uniqueDates = useMemo(() => {
    const dates = allJobs.map(job => job.Ngay);
    return [...new Set(dates)];
  }, [allJobs]);

  
  // --- LOGIC GOM NHÓM (Không đổi) ---
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
          <h3>Tìm kiếm</h3>
          
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
            {/* TỐI ƯU #3:
              - value bây giờ là "inputValue" (hiển thị tức thì)
              - onChange cập nhật "setInputValue" (state tức thì)
            */}
            <input 
              type="text" 
              id="nameInput" 
              placeholder="VD: Quốc Huy"
              value={inputValue} 
              onChange={(e) => setInputValue(e.target.value)}
            />
          </div>
        </div>

        <div id="schedule-list" className="schedule-list">
          {/* --- TỐI ƯU #4: HIỂN THỊ KHUNG LOADING --- */}
          {isLoading ? (
            // Hiển thị 3 khung "skeleton" khi đang tải
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
            <p>Không tìm thấy kết quả phù hợp.</p>
          ) : (
            // Tải xong và có kết quả
            Object.keys(groupedJobs).map(timeGroup => (
              <div key={timeGroup} className="time-group-container"> 
                <h3 className="schedule-group-title">{timeGroup}</h3>
                {groupedJobs[timeGroup].map((job, index) => (
                  <div className="schedule-item" key={`${timeGroup}-${index}`}>
                    <h4>{job.TenCongViec || '...'}</h4>
                    <p className="time">{timeGroup}</p>
                    <p className="location">{job.DiaDiem || '...'}</p>
                    <p className="session">Session type: {job.SessionType || '—'}</p>
                    <p className="mc">{job.MC || '...'}</p>
                    <p className="standby">{job.Standby || '...'}</p>
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