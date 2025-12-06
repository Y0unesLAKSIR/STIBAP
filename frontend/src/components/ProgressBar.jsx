import React from 'react';
import './ProgressBar.css';

const ProgressBar = ({ percentage = 0, label = '' }) => {
  const pct = Math.max(0, Math.min(100, Number.isFinite(percentage) ? percentage : 0));
  return (
    <div className="progressbar">
      <div className="progressbar__header">
        <span className="progressbar__label">{label || 'Course Progress'}</span>
        <span className="progressbar__value">{pct}%</span>
      </div>
      <div className="progressbar__track">
        <div className="progressbar__fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

export default ProgressBar;
