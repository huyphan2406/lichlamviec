import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiSave, FiClock, FiMapPin, FiUser, FiMonitor, FiFileText } from 'react-icons/fi';

const QuickReportForm = ({ isVisible, setIsVisible, job }) => {
  const [formData, setFormData] = useState({
    jobDate: '',
    jobTime: '',
    store: '',
    location: '',
    mc: '',
    standby: '',
    notes: '',
    rating: '',
    status: 'completed'
  });

  // Điền dữ liệu từ job vào form khi mở
  useEffect(() => {
    if (job && isVisible) {
      setFormData({
        jobDate: job['Date livestream'] || '',
        jobTime: job['Time slot'] || '',
        store: job.Store || '',
        location: `${job.Address || ''}${job['Studio/Room'] ? ' | ' + job['Studio/Room'] : ''}`.trim(),
        mc: `${job['Talent 1'] || ''}${job['Talent 2'] ? ' | ' + job['Talent 2'] : ''}`.trim(),
        standby: `${job['Coordinator 1'] || ''}${job['Coordinator 2'] ? ' | ' + job['Coordinator 2'] : ''}`.trim(),
        notes: '',
        rating: '',
        status: 'completed'
      });
    }
  }, [job, isVisible]);

  const handleDismiss = () => {
    setIsVisible(false);
    // Reset form khi đóng
    setFormData({
      jobDate: '',
      jobTime: '',
      store: '',
      location: '',
      mc: '',
      standby: '',
      notes: '',
      rating: '',
      status: 'completed'
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // TODO: Xử lý submit form ở đây
    console.log('Form Data:', formData);
    
    // Hiển thị thông báo tạm thời (sẽ được xử lý sau)
    alert('Form đã được gửi thành công! (Tính năng đang được phát triển)');
    
    // Đóng form sau khi submit
    handleDismiss();
  };

  // Debug: Log khi component render
  useEffect(() => {
    console.log('QuickReportForm render - isVisible:', isVisible, 'job:', job);
  }, [isVisible, job]);

  // Không return null sớm, để AnimatePresence có thể xử lý animation
  return (
    <AnimatePresence mode="wait">
      {isVisible && job && (
        <>
          <motion.div
            className="popup-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleDismiss}
          />
          
          <motion.div 
            className="popup-modal report-form-modal"
            initial={{ opacity: 0, x: "-50%", y: "calc(-50% + 50px)" }}
            animate={{ opacity: 1, x: "-50%", y: "-50%" }}
            exit={{ opacity: 0, x: "-50%", y: "calc(-50% + 50px)" }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="popup-header">
              <FiFileText size={22} className="popup-icon-zap" />
              <h3>Điền Report Nhanh</h3>
              <button className="popup-dismiss-btn" onClick={handleDismiss} title="Đóng">
                <FiX size={20} />
              </button>
            </div>
            
            <form className="report-form-content" onSubmit={handleSubmit}>
              {/* Thông tin Job (Read-only) */}
              <div className="form-section">
                <h4 className="form-section-title">Thông Tin Công Việc</h4>
                
                <div className="form-group">
                  <label>
                    <FiClock size={16} style={{ marginRight: '8px' }} />
                    Ngày & Giờ
                  </label>
                  <div className="form-readonly-info">
                    {formData.jobDate} - {formData.jobTime}
                  </div>
                </div>

                <div className="form-group">
                  <label>
                    <FiMapPin size={16} style={{ marginRight: '8px' }} />
                    Cửa Hàng
                  </label>
                  <div className="form-readonly-info">
                    {formData.store || 'N/A'}
                  </div>
                </div>

                <div className="form-group">
                  <label>
                    <FiMapPin size={16} style={{ marginRight: '8px' }} />
                    Địa Điểm
                  </label>
                  <div className="form-readonly-info">
                    {formData.location || 'N/A'}
                  </div>
                </div>

                <div className="form-group">
                  <label>
                    <FiUser size={16} style={{ marginRight: '8px' }} />
                    MC/Talent
                  </label>
                  <div className="form-readonly-info">
                    {formData.mc || 'N/A'}
                  </div>
                </div>

                <div className="form-group">
                  <label>
                    <FiMonitor size={16} style={{ marginRight: '8px' }} />
                    Standby/Coordinator
                  </label>
                  <div className="form-readonly-info">
                    {formData.standby || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Form Inputs */}
              <div className="form-section">
                <h4 className="form-section-title">Thông Tin Report</h4>
                
                <div className="form-group">
                  <label htmlFor="status">Trạng Thái *</label>
                  <select 
                    id="status" 
                    name="status" 
                    value={formData.status} 
                    onChange={handleChange}
                    required
                  >
                    <option value="completed">Hoàn Thành</option>
                    <option value="in-progress">Đang Thực Hiện</option>
                    <option value="cancelled">Đã Hủy</option>
                    <option value="delayed">Bị Trễ</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="rating">Đánh Giá</label>
                  <select 
                    id="rating" 
                    name="rating" 
                    value={formData.rating} 
                    onChange={handleChange}
                  >
                    <option value="">Chọn đánh giá</option>
                    <option value="excellent">Xuất Sắc ⭐⭐⭐⭐⭐</option>
                    <option value="good">Tốt ⭐⭐⭐⭐</option>
                    <option value="average">Bình Thường ⭐⭐⭐</option>
                    <option value="poor">Cần Cải Thiện ⭐⭐</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="notes">Ghi Chú</label>
                  <textarea 
                    id="notes" 
                    name="notes" 
                    value={formData.notes} 
                    onChange={handleChange}
                    placeholder="Nhập ghi chú về buổi livestream..."
                    rows="4"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="form-actions">
                <button 
                  type="button" 
                  className="form-button form-button-cancel"
                  onClick={handleDismiss}
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="form-button form-button-submit"
                >
                  <FiSave size={18} style={{ marginRight: '8px' }} />
                  Lưu Report
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default QuickReportForm;

