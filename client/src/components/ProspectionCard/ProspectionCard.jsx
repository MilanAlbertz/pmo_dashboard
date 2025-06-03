import React from 'react';
import './ProspectionCard.css';

const getStatusClass = (status) => {
  if (!status) return '';
  const s = status.toLowerCase();
  if (s === 'pending') return 'prospection-card-pending';
  if (s === 'confirmed') return 'prospection-card-confirmed';
  if (s === 'open for partners' || s === 'open for partner') return 'prospection-card-open';
  return '';
};

const ProspectionCard = ({ moduleNumber, data, isCompact, onEdit }) => {
  const statusClass = getStatusClass(data.status);

  const renderPartners = () => {
    if (!data.partnerNames || data.partnerNames.length === 0) {
      return 'No Partners';
    }
    return data.partnerNames.join(', ');
  };

  if (isCompact) {
    return (
      <div className={`prospection-card compact ${statusClass}`}>
        <div className="prospection-header">
          <h3>{moduleNumber}</h3>
          <span className="edit-icon" onClick={onEdit} title="Edit">
            <svg className="edit-icon-svg" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
              <path d="M0 0h24v24H0z" fill="none"/>
              <path d="M3 17.25V21h3.75l11.06-11.06-3.75-3.75L3 17.25zm14.71-9.04c.39-.39.39-1.02 0-1.41l-2.54-2.54a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
          </span>
        </div>
        <div className="prospection-content">
          <p><strong>Partners:</strong> {renderPartners()}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`prospection-card ${statusClass}`}>
      <div className="prospection-header">
        <h3>{moduleNumber}</h3>
        <span className="edit-icon" onClick={() => onEdit && onEdit(data)} title="Edit">
          {/* Material UI edit icon SVG with currentColor */}
          <svg className="edit-icon-svg" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
            <path d="M0 0h24v24H0z" fill="none"/>
            <path d="M3 17.25V21h3.75l11.06-11.06-3.75-3.75L3 17.25zm14.71-9.04c.39-.39.39-1.02 0-1.41l-2.54-2.54a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
          </svg>
        </span>
      </div>
      <div className="prospection-content">
        <p><strong>Course:</strong> {data.course}</p>
        <p><strong>Class Code:</strong> {data.classCode}</p>
        <p><strong>Year:</strong> {data.year}</p>
        <p><strong>Quarter:</strong> {data.quarter}</p>
        <p><strong>Status:</strong> {data.status}</p>
        <p><strong>Advisor:</strong> {data.advisor}</p>
        <p><strong>Classroom:</strong> {data.classroom}</p>
        <p><strong>Partners:</strong> {renderPartners()}</p>
        <div className="description-box">
          <p><strong>Description:</strong></p>
          <div className="description-content" title={data.description || 'No description'}>
            {(data.description || 'No description').length > 150 
              ? `${(data.description || 'No description').substring(0, 150)}...` 
              : (data.description || 'No description')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProspectionCard; 