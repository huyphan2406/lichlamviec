import React from 'react';
import { FiSearch } from 'react-icons/fi';

function EmptyState() {
  return (
    <div className="empty-state">
      <FiSearch className="empty-state-icon" />
      <h3>Không tìm thấy kết quả</h3>
      <p>Vui lòng thử tìm tên khác hoặc chọn ngày khác.</p>
    </div>
  );
}

export default EmptyState;