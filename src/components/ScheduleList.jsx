import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import JobItem from './JobItem';
import SkeletonLoader from './SkeletonLoader';
import EmptyState from './EmptyState';

// Cấu hình animation cho container
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05 // Hiệu ứng xuất hiện lần lượt
    }
  }
};

function ScheduleList({ isLoading, groupedJobs }) {
  if (isLoading) {
    return <SkeletonLoader />;
  }

  const jobGroups = Object.keys(groupedJobs);

  if (jobGroups.length === 0) {
    return <EmptyState />;
  }

  return (
    <div id="schedule-list" className="schedule-list">
      <AnimatePresence>
        {jobGroups.map(timeGroup => (
          <motion.div 
            key={timeGroup} 
            className="time-group-container"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          > 
            <h3 className="schedule-group-title">{timeGroup}</h3>
            {groupedJobs[timeGroup].map((job, index) => (
              <JobItem 
                key={`${timeGroup}-${index}`} 
                job={job} 
                timeGroup={timeGroup} 
              />
            ))}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default ScheduleList;