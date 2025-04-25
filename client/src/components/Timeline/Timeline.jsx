import React, { useState, useEffect } from 'react';
import { fetchHistory } from '../../utils/api';
import './Timeline.css';

const Timeline = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const historyData = await fetchHistory();
        setHistory(historyData);
        setLoading(false);
      } catch (error) {
        console.error('Error loading history:', error);
        setError('Failed to load history data');
        setLoading(false);
      }
    };
    loadHistory();
  }, []);

  if (loading) return <div className="timeline-loading">Loading history...</div>;
  if (error) return <div className="timeline-error">{error}</div>;

  return (
    <div className="timeline">
      {history.map((event, index) => (
        <div key={index} className="timeline-event">
          <div className="timeline-date">{event.date}</div>
          <div className="timeline-content">
            <h3>{event.title}</h3>
            <p>{event.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Timeline;