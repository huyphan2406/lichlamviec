import { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiX, FiSave, FiClock, FiMapPin, FiUser, FiMonitor, 
  FiFileText, FiImage, FiPlus, FiTrash2, FiMail,
  FiDollarSign, FiHash, FiUpload
} from 'react-icons/fi';

// Hàm cleanup cho Blob URL
const revokeBlobUrl = (url) => {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
};

const QuickReportForm = memo(({ isVisible, setIsVisible, job, showTempNotification }) => {
  const [formData, setFormData] = useState({
    email: '',
    // keyLivestream được tính toán bởi useMemo
    gmv: '',
    startTimeActual: ''
  });
  const [liveIds, setLiveIds] = useState(['']); // Mảng duy nhất cho tất cả các ID Live
  const [imagePreview, setImagePreview] = useState(null); // Sẽ là Blob URL
  const [isProcessing, setIsProcessing] = useState(false);
  
  const fileInputRef = useRef(null);
  // imageRef vẫn được giữ để tham chiếu DOM nếu cần
  // const imageRef = useRef(null); 

  // --- Tối ưu hóa 1: Lock scroll và Cleanup Blob URL ---
  useEffect(() => {
    let originalOverflow = 'auto'; // Giá trị mặc định an toàn

    if (isVisible) {
      originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }

    // Cleanup khi component unmount HOẶC isVisible thay đổi
    return () => {
      // Đặt lại scroll
      document.body.style.overflow = originalOverflow;
      // Cleanup Blob URL cũ khi đóng form/unmount
      setImagePreview(prev => {
        revokeBlobUrl(prev);
        return null;
      });
    };
  }, [isVisible]);


  // Tạo key livestream từ job data - Memoized (Tối ưu hóa tốt)
  const keyLivestream = useMemo(() => {
    if (!job) return '';
    const date = (job['Date livestream'] || '').replace(/\//g, '');
    const store = (job.Store || '').replace(/\s+/g, '').substring(0, 10);
    const time = (job['Time slot'] || '').split(' - ')[0].replace(/:/g, '');
    return `${date}_${store}_${time}`.toUpperCase();
  }, [job]);

  // Điền dữ liệu ban đầu khi form mở/job thay đổi
  useEffect(() => {
    if (job && isVisible) {
      setFormData({
        email: '',
        gmv: '',
        startTimeActual: ''
      });
      setLiveIds(['']);
      // Cleanup preview cũ nếu có
      setImagePreview(prev => {
        revokeBlobUrl(prev);
        return null;
      });
    }
  }, [job, isVisible]);

  // Hàm loại bỏ (Dismiss) Form - useCallback (Tối ưu hóa tốt)
  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    setFormData({
      email: '',
      gmv: '',
      startTimeActual: ''
    });
    setLiveIds(['']);
    setIsProcessing(false);
    
    // Cleanup Blob URL ngay lập tức khi đóng form
    setImagePreview(prev => {
      revokeBlobUrl(prev);
      return null;
    });
  }, [setIsVisible]);

  // Xử lý thay đổi input form (trừ Live ID) - useCallback (Tối ưu hóa tốt)
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  // --- Tối ưu hóa 2: Xử lý upload ảnh bằng Blob URL ---
  const handleImageUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showTempNotification?.('Vui lòng chọn file ảnh hợp lệ!');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showTempNotification?.('Kích thước ảnh không được vượt quá 5MB!');
      return;
    }

    setIsProcessing(true);

    // Tạo Blob URL (nhanh hơn Data URL)
    const newPreviewUrl = URL.createObjectURL(file);

    // Cleanup preview cũ và đặt preview mới
    setImagePreview(prev => {
      revokeBlobUrl(prev); // Cleanup cũ
      return newPreviewUrl; // Đặt mới
    });
    
    // Giả lập xử lý/trích xuất thông tin
    setTimeout(() => {
      setIsProcessing(false);
      showTempNotification?.('Ảnh đã được tải lên. Vui lòng nhập thông tin thủ công từ ảnh.');
    }, 500); // Giảm thời gian giả lập
    
    // Xóa giá trị file input để cho phép upload lại cùng 1 file
    e.target.value = null; 
  }, [showTempNotification]);

  // Thêm ID phiên live mới - useCallback (Tối ưu hóa tốt)
  const handleAddLiveId = useCallback(() => {
    setLiveIds(prev => [...prev, '']);
  }, []);

  // Xóa ID phiên live - useCallback (Tối ưu hóa tốt)
  const handleRemoveLiveId = useCallback((index) => {
    if (liveIds.length > 1) {
      setLiveIds(prev => prev.filter((_, i) => i !== index));
    }
  }, [liveIds.length]);

  // Cập nhật ID phiên live - Chỉ cập nhật liveIds (Tối ưu hóa)
  const handleLiveIdChange = useCallback((index, value) => {
    setLiveIds(prev => {
      const newIds = [...prev];
      newIds[index] = value;
      return newIds;
    });
  }, []);

  // Submit form - Tính toán idLive1/idLive2 ngay trước khi submit
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    const validLiveIds = liveIds.filter(id => id.trim() !== '');
    const idLive1 = validLiveIds[0] || '';
    const idLive2 = validLiveIds.slice(1).join(', ');

    if (!formData.email) {
      showTempNotification?.('Vui lòng nhập email!');
      return;
    }

    if (!idLive1) {
      showTempNotification?.('Vui lòng nhập ID phiên live 1!');
      return;
    }

    setIsProcessing(true);

    try {
      const formUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSeZAOqU-pF3DEa7PB_GL4xzWg5K1lhIqy0m2LuUnDf_HV4_QA/formResponse';
      
      const formDataToSubmit = new FormData();
      
      // *** CÁC ENTRY ID NÀY CẦN ĐƯỢC THAY THẾ BẰNG ENTRY ID THỰC TẾ CỦA GOOGLE FORM CỦA BẠN ***
      formDataToSubmit.append('entry.123456789', formData.email); 
      formDataToSubmit.append('entry.987654321', keyLivestream); 
      formDataToSubmit.append('entry.111111111', idLive1); 
      
      if (idLive2) {
        formDataToSubmit.append('entry.222222222', idLive2); 
      }
      if (formData.gmv) {
        formDataToSubmit.append('entry.333333333', formData.gmv); 
      }
      if (formData.startTimeActual) {
        formDataToSubmit.append('entry.444444444', formData.startTimeActual); 
      }
      
      const response = await fetch(formUrl, {
        method: 'POST',
        mode: 'no-cors',
        body: formDataToSubmit
      });

      // Bỏ qua kiểm tra response do 'no-cors'
      setIsProcessing(false);
      showTempNotification?.('Đã gửi form thành công!');
      
      setTimeout(() => {
        handleDismiss();
      }, 1000);

    } catch (error) {
      console.error('Submit Error:', error);
      setIsProcessing(false);
      showTempNotification?.('Lỗi khi gửi form. Vui lòng thử lại!');
    }
  }, [formData.email, formData.gmv, formData.startTimeActual, keyLivestream, liveIds, showTempNotification, handleDismiss]);

  // Không re-render nếu không cần thiết
  if (!isVisible || !job) return null;

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            style={{ 
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              willChange: 'transform, opacity'
            }}
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
                    {job['Date livestream'] || 'N/A'} - {job['Time slot'] || 'N/A'}
                  </div>
                </div>

                <div className="form-group">
                  <label>
                    <FiMapPin size={16} style={{ marginRight: '8px' }} />
                    Cửa Hàng
                  </label>
                  <div className="form-readonly-info">
                    {job.Store || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Upload Ảnh */}
              <div className="form-section">
                <h4 className="form-section-title">Upload Ảnh Dashboard</h4>
                
                <div className="form-group">
                  <label htmlFor="imageUpload">
                    <FiImage size={16} style={{ marginRight: '8px' }} />
                    Chọn ảnh từ Dashboard
                  </label>
                  <div className="image-upload-container">
                    <input
                      ref={fileInputRef}
                      type="file"
                      id="imageUpload"
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />
                    <button
                      type="button"
                      className="image-upload-button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isProcessing}
                    >
                      <FiUpload size={18} />
                      {isProcessing ? 'Đang xử lý...' : 'Chọn ảnh'}
                    </button>
                    {imagePreview && (
                      <div className="image-preview">
                        <img 
                          // ref={imageRef} // Không cần thiết nếu không dùng để thao tác DOM cụ thể
                          src={imagePreview} 
                          alt="Preview" 
                          loading="lazy"
                          decoding="async"
                          style={{ willChange: 'transform' }}
                        />
                        {/* Thay thế lớp phủ loading bằng thông báo trạng thái ngắn gọn hơn */}
                        {isProcessing && (
                          <div className="processing-overlay">
                            <div className="spinner"></div>
                            <p>Đang tải...</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Inputs */}
              <div className="form-section">
                <h4 className="form-section-title">Thông Tin Report</h4>
                
                <div className="form-group">
                  <label htmlFor="email">
                    <FiMail size={16} style={{ marginRight: '8px' }} />
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your.email@example.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="keyLivestream">
                    <FiHash size={16} style={{ marginRight: '8px' }} />
                    Key Livestream
                  </label>
                  <input
                    type="text"
                    id="keyLivestream"
                    name="keyLivestream"
                    value={keyLivestream}
                    onChange={handleChange}
                    readOnly
                    className="readonly-input"
                  />
                </div>

                {/* Live IDs */}
                {liveIds.map((id, index) => (
                  <div key={index} className="form-group">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <label style={{ margin: 0, flex: 1 }}>
                        <FiHash size={16} style={{ marginRight: '8px' }} />
                        ID Phiên Live {index === 0 ? '1 *' : index + 1}
                      </label>
                      {index > 0 && (
                        <button
                          type="button"
                          className="remove-button"
                          onClick={() => handleRemoveLiveId(index)}
                          title="Xóa"
                          disabled={liveIds.length <= 1}
                        >
                          <FiTrash2 size={16} />
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={id || ''}
                      onChange={(e) => handleLiveIdChange(index, e.target.value)}
                      placeholder={`Nhập ID phiên live ${index + 1}`}
                      required={index === 0}
                    />
                  </div>
                ))}

                <div className="form-group">
                  <button
                    type="button"
                    className="add-button"
                    onClick={handleAddLiveId}
                  >
                    <FiPlus size={16} />
                    Thêm ID Phiên Live
                  </button>
                </div>

                <div className="form-group">
                  <label htmlFor="gmv">
                    <FiDollarSign size={16} style={{ marginRight: '8px' }} />
                    GMV
                  </label>
                  <input
                    type="text"
                    id="gmv"
                    name="gmv"
                    value={formData.gmv}
                    onChange={handleChange}
                    placeholder="Nhập GMV (từ ảnh hoặc tự nhập)"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="startTimeActual">
                    <FiClock size={16} style={{ marginRight: '8px' }} />
                    Giờ Start Time Thực Tế (Dashboard)
                  </label>
                  <input
                    type="text"
                    id="startTimeActual"
                    name="startTimeActual"
                    value={formData.startTimeActual}
                    onChange={handleChange}
                    placeholder="HH:MM (từ ảnh hoặc tự nhập)"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="form-actions">
                <button 
                  type="button" 
                  className="form-button form-button-cancel"
                  onClick={handleDismiss}
                  disabled={isProcessing}
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="form-button form-button-submit"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <div className="spinner-small"></div>
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <FiSave size={18} />
                      Gửi Report
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}, (prevProps, nextProps) => {
  // Custom comparison để tránh re-render không cần thiết
  // Chỉ so sánh các props thực sự ảnh hưởng đến việc render và logic
  return prevProps.isVisible === nextProps.isVisible && 
         prevProps.job === nextProps.job; // job được dùng trong useMemo và read-only fields
  // setIsVisible và showTempNotification là hàm, chúng thường ổn định với useCallback từ bên ngoài
});

QuickReportForm.displayName = 'QuickReportForm';
export default QuickReportForm;