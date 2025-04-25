import React, { useState } from 'react';
import { useTranslation } from '../../contexts/LanguageContext';
import CheckIcon from '../../assets/images/icons/CheckIcon';
import CrossIcon from '../../assets/images/icons/CrossIcon';
import './RequirementDropdown.css';

const RequirementDropdown = ({ title, items }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { t } = useTranslation();

  return (
    <div className="requirement-dropdown">
      <div 
        className="dropdown-header" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3>{title}</h3>
        <span className={`expand-arrow ${isExpanded ? 'expanded' : ''}`}>▼</span>
      </div>
      
      {isExpanded && (
        <div className="dropdown-content">
          {items.map((item, index) => (
            <div key={index} className="requirement-item">
              <span className={`requirement-status ${item.status}`}>
                {item.status === 'success' ? <CheckIcon /> : <CrossIcon />}
              </span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RequirementDropdown; 