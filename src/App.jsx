import { useState, useMemo, useEffect } from 'react';
import Papa from 'papaparse';
import './App.css'; // Liên kết với file CSS để tạo kiểu

// Danh sách các cột (headers) mà ứng dụng mong đợi từ file CSV
// Đây là KEY để ứng dụng nhận diện dữ liệu
const EXPECTED_CSV_HEADERS = {
  NGAY: 'Ngay', // Ví dụ: 11/11/2025
  THOIGIANBATDAU: 'ThoiGianBatDau', // Ví dụ: 16:00
  THOIGIANKETTHUC: 'ThoiGianKetThuc', // Ví dụ: 18:00
  TENCONGVIEC: 'TenCongViec', // Ví dụ: NEUTROGENA - TIKTOK
  DIADIEM: 'DiaDiem', // Ví dụ: OP Livestream HUB 2 - H2 - 210
  SESSIONTYPE: 'SessionType', // Ví dụ: External
  NGUOITHUCHIEN: 'NguoiThucHien', // Ví dụ: Quốc Huy, Dương Kiều
  GHICHU: 'GhiChu' // Thêm cột Ghi chú nếu có
};

function App() {
  // --- STATE QUẢN LÝ DỮ LIỆU VÀ GIAO DIỆN ---
  const [allJobs, setAllJobs] = useState([]); // Toàn bộ dữ liệu từ CSV
  const [dateFilter, setDateFilter] = useState(''); // Giá trị ô lọc Ngày
  const [nameFilter, setNameFilter] = useState(''); // Giá trị ô lọc Tên
  const [csvError, setCsvError] = useState(''); // Thông báo lỗi CSV
  const [isCsvLoaded, setIsCsvLoaded] = useState(false); // Đã tải CSV thành công chưa

  // --- HÀM XỬ LÝ TẢI FILE CSV ---
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    setCsvError(''); // Reset lỗi
    setIsCsvLoaded(false); // Đặt lại trạng thái tải CSV

    if (file) {
      Papa.parse(file, {
        header: true, // Dòng đầu tiên là tiêu đề cột
        skipEmptyLines: true,
        dynamicTyping: true, // Tự động nhận diện kiểu dữ liệu (số, boolean)
        complete: (results) => {
          const rawData = results.data;
          const errors = results.errors;

          if (errors.length > 0) {
            setCsvError("Có lỗi khi đọc file CSV. Vui lòng kiểm tra định dạng.");
            console.error("PapaParse errors:", errors);
            setAllJobs([]);
            return;
          }

          // Kiểm tra xem các cột cần thiết có tồn tại không
          const missingHeaders = Object.values(EXPECTED_CSV_HEADERS).filter(header => 
            !rawData[0] || !Object.keys(rawData[0]).includes(header)
          );

          if (missingHeaders.length > 0) {
            setCsvError(`File CSV thiếu các cột quan trọng: ${missingHeaders.join(', ')}. Vui lòng kiểm tra tên cột.`);
            setAllJobs([]);
            return;
          }

          // Chuẩn hóa và sắp xếp dữ liệu
          const processedData = rawData
            .filter(job => job[EXPECTED_CSV_HEADERS.NGAY] && job[EXPECTED_CSV_HEADERS.THOIGIANBATDAU]) // Chỉ lấy job có đủ ngày/giờ
            .map(job => ({
              ...job,
              // Tạo một Date object để dễ dàng so sánh và sắp xếp
              dateTime: new Date(`${job[EXPECTED_CSV_HEADERS.NGAY]} ${job[EXPECTED_CSV_HEADERS.THOIGIANBATDAU]}`)
            }))
            .sort((a, b) => a.dateTime - b.dateTime); // Sắp xếp theo ngày giờ tăng dần
          
          setAllJobs(processedData);
          setIsCsvLoaded(true);
        },
        error: (err) => {
          console.error("Lỗi PapaParse:", err);
          setCsvError("Đã xảy ra lỗi khi đọc file CSV. Vui lòng thử lại.");
          setAllJobs([]);
        }
      });
    } else {
      setAllJobs([]);
      setIsCsvLoaded(false);
    }
  };

  // --- LOGIC LỌC DỮ LIỆU ---
  const filteredJobs = useMemo(() => {
    let jobs = allJobs;
    const normNameFilter = nameFilter.toLowerCase().trim();
    const normDateFilter = dateFilter.trim();

    if (normNameFilter) {
      jobs = jobs.filter(job => {
        const person = job[EXPECTED_CSV_HEADERS.NGUOITHUCHIEN]?.toLowerCase() || '';
        const jobName = job[EXPECTED_CSV_HEADERS.TENCONGVIEC]?.toLowerCase() || '';
        return person.includes(normNameFilter) || jobName.includes(normNameFilter);
      });
    }

    if (normDateFilter) {
      jobs = jobs.filter(job => {
        // Có thể cần định dạng lại ngày cho khớp với đầu vào
        // Ví dụ: "11/11/2025" trong CSV khớp "11/11" từ input
        const jobDateString = job[EXPECTED_CSV_HEADERS.NGAY]?.toString() || '';
        return jobDateString.includes(normDateFilter);
      });
    }

    return jobs;
  }, [allJobs, dateFilter, nameFilter]);

  // --- LOGIC GOM NHÓM DỮ LIỆU ĐỂ HIỂN THỊ ---
  const groupedJobs = useMemo(() => {
    return filteredJobs.reduce((acc, job) => {
      const timeGroupKey = `${job[EXPECTED_CSV_HEADERS.NGAY]} ${job[EXPECTED_CSV_HEADERS.THOIGIANBATDAU]}–${job[EXPECTED_CSV_HEADERS.THOIGIANKETTHUC]}`;
      if (!acc[timeGroupKey]) {
        acc[timeGroupKey] = [];
      }
      acc[timeGroupKey].push(job);
      return acc;
    }, {});
  }, [filteredJobs]);

  // --- GIAO DIỆN CỦA ỨNG DỤNG ---
  return (
    <div className="App-container">
      <header className="app-header">
        <h1>Lịch Làm Việc</h1>
        <div className="csv-upload-section">
          <label htmlFor="csvFileInput" className="csv-label">
            Tải lên file CSV:
            <input 
              type="file" 
              id="csvFileInput" 
              accept=".csv" 
              onChange={handleFileSelect} 
              className="csv-input"
            />
          </label>
        </div>
      </header>

      <main className="app-main-content">
        <div className="filter-section card">
          <h3>Tìm kiếm</h3>
          {/* Thông báo lỗi CSV */}
          {csvError && <p className="error-message">{csvError}</p>}

          <div className="form-group">
            <label htmlFor="dateInput">Ngày</label>
            <input 
              type="text" 
              id="dateInput" 
              placeholder="VD: 11/11/2025"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              disabled={!isCsvLoaded} // Vô hiệu hóa khi chưa tải CSV
            />
          </div>
          <div className="form-group">
            <label htmlFor="nameInput">Tìm theo tên</label>
            <input 
              type="text" 
              id="nameInput" 
              placeholder="VD: Quốc Huy"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              disabled={!isCsvLoaded} // Vô hiệu hóa khi chưa tải CSV
            />
          </div>
        </div>

        <div className="schedule-display-section">
          {filteredJobs.length === 0 && !csvError && (
            <p className="no-data-message">
              {allJobs.length === 0 && !isCsvLoaded 
                ? "Vui lòng tải lên file CSV để xem lịch làm việc." 
                : "Không tìm thấy công việc phù hợp."}
            </p>
          )}

          {/* Hiển thị các nhóm công việc */}
          {Object.entries(groupedJobs).map(([timeGroupKey, jobsInGroup]) => {
            const [datePart, timePart] = timeGroupKey.split(' '); // Tách Ngày và Thời gian
            const displayTime = timePart;

            return (
              <div key={timeGroupKey} className="schedule-group">
                <h3 className="schedule-group-title">{datePart}</h3> {/* Ngày */}
                <h4 className="schedule-time-range">{displayTime}</h4> {/* Khoảng thời gian */}
                {jobsInGroup.map(job => (
                  <div className="schedule-item card" key={job[EXPECTED_CSV_HEADERS.TENCONGVIEC] + job[EXPECTED_CSV_HEADERS.NGUOITHUCHIEN] + job.dateTime}>
                    <p className="job-title">{job[EXPECTED_CSV_HEADERS.TENCONGVIEC] || 'Không có tên công việc'}</p>
                    <div className="job-details">
                      <p className="detail-row"><span className="icon">📍</span>{job[EXPECTED_CSV_HEADERS.DIADIEM] || 'Không có địa điểm'}</p>
                      <p className="detail-row"><span className="icon">🎤</span>Session type: {job[EXPECTED_CSV_HEADERS.SESSIONTYPE] || '—'}</p>
                      <p className="detail-row"><span className="icon">🧑‍💻</span>{job[EXPECTED_CSV_HEADERS.NGUOITHUCHIEN] || 'Chưa gán người'}</p>
                      {job[EXPECTED_CSV_HEADERS.GHICHU] && (
                        <p className="detail-row"><span className="icon">📝</span>{job[EXPECTED_CSV_HEADERS.GHICHU]}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

export default App;