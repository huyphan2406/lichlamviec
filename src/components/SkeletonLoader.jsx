import React from 'react';

function SkeletonLoader() {
  return (
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
  );
}

export default SkeletonLoader;