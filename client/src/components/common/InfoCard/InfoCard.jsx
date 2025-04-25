import React from 'react';
import './InfoCard.css';

const InfoCard = ({ title, children, className = '' }) => {
  return (
    <div className={`info-card ${className}`}>
      <h2>{title}</h2>
      <div className="info-content">
        {children}
      </div>
    </div>
  );
};

export default InfoCard; 