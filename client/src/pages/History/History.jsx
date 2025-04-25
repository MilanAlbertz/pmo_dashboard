import React, { useState, useEffect } from 'react';
import './History.css';
import Timeline from '../../components/Timeline/Timeline';
import { useLocation } from 'react-router-dom';

const History = () => {
  const location = useLocation();
  const [viewType, setViewType] = useState(location.state?.initialViewType || null);
  const [selectedYear, setSelectedYear] = useState('');
  const [classCode, setClassCode] = useState(location.state?.initialClassCode || '');
  const [showTimeline, setShowTimeline] = useState(!!location.state?.initialClassCode);

  // Add current year constant
  const currentYear = new Date().getFullYear();
  const minYear = 2020;

  // Add validation function
  const isValidYear = (year) => {
    const yearNum = parseInt(year);
    return yearNum >= minYear && yearNum <= currentYear;
  };

  useEffect(() => {
    if (location.state?.initialClassCode) {
      setViewType('class');
      setClassCode(location.state.initialClassCode);
      setShowTimeline(true);
    }
  }, [location.state]);

  if (!showTimeline) {
    return (
      <div className="history-container">
        <h2>Select History View</h2>
        <div className="selection-buttons">
          <button 
            className={`selection-button ${viewType === 'class' ? 'active' : ''}`}
            onClick={() => {
              setViewType('class');
              setSelectedYear('');
            }}
          >
            Class History
          </button>
          <div className="selection-divider">or</div>
          <button 
            className={`selection-button ${viewType === 'year' ? 'active' : ''}`}
            onClick={() => {
              setViewType('year');
              setClassCode('');
            }}
          >
            Year History
          </button>
        </div>

        {viewType && (
          <div className="input-container">
            {viewType === 'class' ? (
              <>
                <input
                  type="text"
                  placeholder="Enter Class Code (e.g., INF2A)"
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value)}
                  className="history-input"
                />
                <button 
                  className="submit-button"
                  onClick={() => setShowTimeline(true)}
                  disabled={!classCode}
                >
                  View History
                </button>
              </>
            ) : (
              <>
                <input
                  type="number"
                  placeholder={`Enter Year (${minYear}-${currentYear})`}
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  min={minYear}
                  max={currentYear}
                  className="history-input"
                />
                <div className="input-helper-text">
                  Select a year between {minYear} and {currentYear}
                </div>
                <button 
                  className="submit-button"
                  onClick={() => setShowTimeline(true)}
                  disabled={!selectedYear || !isValidYear(selectedYear)}
                >
                  View History
                </button>
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="history-container">
      <div className="history-header">
        <button 
          className="back-button"
          onClick={() => {
            setViewType(null);
            setSelectedYear('');
            setClassCode('');
            setShowTimeline(false);
          }}
        >
          ← Back to Selection
        </button>
        <h2>
          {viewType === 'class' ? `Class History: ${classCode}` : `Year History: ${selectedYear}`}
        </h2>
      </div>
      <Timeline 
        viewType={viewType}
        classCode={classCode}
        selectedYear={selectedYear}
        isProspection={false}
      />
    </div>
  );
};

export default History; 