import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiX, FiSave, FiClock, FiMapPin, FiUser, FiMonitor, 
  FiFileText, FiImage, FiPlus, FiTrash2, FiMail,
  FiDollarSign, FiHash, FiUpload
} from 'react-icons/fi';

const QuickReportForm = memo(({ isVisible, setIsVisible, job, showTempNotification }) => {
  const [formData, setFormData] = useState({
    email: '',
    keyLivestream: '',
    idLive1: '',
    idLive2: '',
    gmv: '',
    startTimeActual: ''
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [liveIds, setLiveIds] = useState(['']); // Array để quản lý nhiều ID
  const fileInputRef = useRef(null);

  // Lock scroll khi form mở
  useEffect(() => {
    if (isVisible) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isVisible]);

  // Separate cleanup cho image preview
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // Tạo key livestream từ job data
  const generateKeyLivestream = (job) => {
    if (!job) return '';
    const date = (job['Date livestream'] || '').replace(/\//g, '');
    const store = (job.Store || '').replace(/\s+/g, '').substring(0, 10);
    const time = (job['Time slot'] || '').split(' - ')[0].replace(/:/g, '');
    return `${date}_${store}_${time}`.toUpperCase();
  };

  // Điền dữ liệu từ job vào form khi mở
  useEffect(() => {
    if (job && isVisible) {
      const keyLivestream = generateKeyLivestream(job);
      setFormData({
        email: '',
        keyLivestream: keyLivestream,
        idLive1: '',
        idLive2: '',
        gmv: '',
        startTimeActual: ''
      });
      setLiveIds(['']);
      setImagePreview(null);
    }
  }, [job, isVisible]);

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    setFormData({
      email: '',
      keyLivestream: '',
      idLive1: '',
      idLive2: '',
      gmv: '',
      startTimeActual: ''
    });
    setLiveIds(['']);
    setImagePreview(null);
    setIsProcessing(false);
  }, [setIsVisible]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  // Xử lý upload ảnh với cleanup
  const handleImageUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Kiểm tra loại file
    if (!file.type.startsWith('image/')) {
      showTempNotification?.('Vui lòng chọn file ảnh hợp lệ!');
      return;
    }

    // Kiểm tra kích thước (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showTempNotification?.('Kích thước ảnh không được vượt quá 5MB!');
      return;
    }

    setIsProcessing(true);

    // Hiển thị preview với cleanup
    const reader = new FileReader();
    reader.onload = (event) => {
      // Cleanup preview cũ nếu có
      setImagePreview(prev => {
        if (prev && prev.startsWith('blob:')) {
          URL.revokeObjectURL(prev);
        }
        return event.target.result;
      });
      setIsProcessing(false);
      showTempNotification?.('Ảnh đã được tải lên. Vui lòng nhập thông tin thủ công từ ảnh.');
    };
    reader.onerror = () => {
      setIsProcessing(false);
      showTempNotification?.('Lỗi khi đọc file ảnh!');
    };
    reader.readAsDataURL(file);
  }, [showTempNotification]);

  // Thêm ID phiên live mới
  const handleAddLiveId = useCallback(() => {
    setLiveIds(prev => [...prev, '']);
  }, []);

  // Xóa ID phiên live
  const handleRemoveLiveId = useCallback((index) => {
    if (liveIds.length > 1) {
      setLiveIds(prev => {
        const newIds = prev.filter((_, i) => i !== index);
        setFormData(prevData => ({
          ...prevData,
          idLive2: newIds.slice(1).join(', ')
        }));
        return newIds;
      });
    }
  }, [liveIds.length]);

  // Cập nhật ID phiên live
  const handleLiveIdChange = useCallback((index, value) => {
    setLiveIds(prev => {
      const newIds = [...prev];
      newIds[index] = value;
      
      if (index === 0) {
        setFormData(prevData => ({ ...prevData, idLive1: value }));
      } else {
        setFormData(prevData => ({ 
          ...prevData, 
          idLive2: newIds.slice(1).filter(id => id).join(', ') 
        }));
      }
      return newIds;
    });
  }, []);

  // Submit form đến Google Forms
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!formData.email) {
      showTempNotification?.('Vui lòng nhập email!');
      return;
    }

    if (!formData.idLive1) {
      showTempNotification?.('Vui lòng nhập ID phiên live 1!');
      return;
    }

    setIsProcessing(true);

    try {
      // Google Forms entry URL
      const formUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSeZAOqU-pF3DEa7PB_GL4xzWg5K1lhIqy0m2LuUnDf_HV4_QA/formResponse';
      
      // Tạo form data
      const formDataToSubmit = new FormData();
      
      // Entry IDs (cần điều chỉnh theo form thực tế)
      // Email field
      formDataToSubmit.append('entry.123456789', formData.email); // Thay bằng entry ID thực tế
      // Key livestream
      formDataToSubmit.append('entry.987654321', formData.keyLivestream); // Thay bằng entry ID thực tế
      // ID phiên live 1
      formDataToSubmit.append('entry.111111111', formData.idLive1); // Thay bằng entry ID thực tế
      // ID phiên live 2 (nếu có)
      if (formData.idLive2) {
        formDataToSubmit.append('entry.222222222', formData.idLive2); // Thay bằng entry ID thực tế
      }
      // GMV
      if (formData.gmv) {
        formDataToSubmit.append('entry.333333333', formData.gmv); // Thay bằng entry ID thực tế
      }
      // Start time thực tế
      if (formData.startTimeActual) {
        formDataToSubmit.append('entry.444444444', formData.startTimeActual); // Thay bằng entry ID thực tế
      }

      // Submit form
      const response = await fetch(formUrl, {
        method: 'POST',
        mode: 'no-cors', // Google Forms không trả về CORS
        body: formDataToSubmit
      });

      setIsProcessing(false);
      showTempNotification?.('Đã gửi form thành công!');
      
      // Đóng form sau 1 giây
      setTimeout(() => {
        handleDismiss();
      }, 1000);

    } catch (error) {
      console.error('Submit Error:', error);
      setIsProcessing(false);
      showTempNotification?.('Lỗi khi gửi form. Vui lòng thử lại!');
    }
  }, [formData, showTempNotification, handleDismiss]);

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
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            style={{ 
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)'
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
                        <img src={imagePreview} alt="Preview" />
                        {isProcessing && (
                          <div className="processing-overlay">
                            <div className="spinner"></div>
                            <p>Đang trích xuất thông tin...</p>
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
                    value={formData.keyLivestream}
                    onChange={handleChange}
                    readOnly
                    className="readonly-input"
                  />
                </div>

                <div className="form-group">
                  <label>
                    <FiHash size={16} style={{ marginRight: '8px' }} />
                    ID Phiên Live 1 *
                  </label>
                  <input
                    type="text"
                    value={liveIds[0] || ''}
                    onChange={(e) => handleLiveIdChange(0, e.target.value)}
                    placeholder="Nhập ID phiên live 1"
                    required
                  />
                </div>

                {liveIds.map((id, index) => {
                  if (index === 0) return null;
                  return (
                    <div key={index} className="form-group">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <label style={{ margin: 0, flex: 1 }}>
                          <FiHash size={16} style={{ marginRight: '8px' }} />
                          ID Phiên Live {index + 1}
                        </label>
                        <button
                          type="button"
                          className="remove-button"
                          onClick={() => handleRemoveLiveId(index)}
                          title="Xóa"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={id}
                        onChange={(e) => handleLiveIdChange(index, e.target.value)}
                        placeholder={`Nhập ID phiên live ${index + 1}`}
                      />
                    </div>
                  );
                })}

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
  return prevProps.isVisible === nextProps.isVisible && 
         prevProps.job === nextProps.job &&
         prevProps.setIsVisible === nextProps.setIsVisible &&
         prevProps.showTempNotification === nextProps.showTempNotification;
});

QuickReportForm.displayName = 'QuickReportForm';
export default QuickReportForm;
