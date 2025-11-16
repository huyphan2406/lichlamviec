import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiX, FiSave, FiClock, FiMapPin, FiUser, FiMonitor, 
  FiFileText, FiImage, FiPlus, FiTrash2, FiMail,
  FiDollarSign, FiHash, FiUpload
} from 'react-icons/fi';

const QuickReportForm = ({ isVisible, setIsVisible, job, showTempNotification }) => {
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

  const handleDismiss = () => {
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
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Xử lý upload ảnh
  const handleImageUpload = async (e) => {
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

    // Hiển thị preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
      setIsProcessing(false);
      showTempNotification?.('Ảnh đã được tải lên. Vui lòng nhập thông tin thủ công từ ảnh.');
    };
    reader.readAsDataURL(file);
  };

  // Thêm ID phiên live mới
  const handleAddLiveId = () => {
    setLiveIds([...liveIds, '']);
  };

  // Xóa ID phiên live
  const handleRemoveLiveId = (index) => {
    if (liveIds.length > 1) {
      const newIds = liveIds.filter((_, i) => i !== index);
      setLiveIds(newIds);
      setFormData(prev => ({
        ...prev,
        idLive2: newIds.slice(1).join(', ')
      }));
    }
  };

  // Cập nhật ID phiên live
  const handleLiveIdChange = (index, value) => {
    const newIds = [...liveIds];
    newIds[index] = value;
    setLiveIds(newIds);
    
    if (index === 0) {
      setFormData(prev => ({ ...prev, idLive1: value }));
    } else {
      setFormData(prev => ({ 
        ...prev, 
        idLive2: newIds.slice(1).filter(id => id).join(', ') 
      }));
    }
  };

  // Submit form đến Google Forms
  const handleSubmit = async (e) => {
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
  };

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
};

export default QuickReportForm;
