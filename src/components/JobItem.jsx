import React from 'react';
import { motion } from 'framer-motion';
import { FiClock, FiMapPin, FiMic, FiUser, FiMonitor } from 'react-icons/fi';

// Cấu hình animation
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

function JobItem({ job, timeGroup }) {
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
}

export default JobItem;