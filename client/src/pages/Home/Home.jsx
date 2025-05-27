import React, { useState, useEffect } from 'react';
import './Home.css';
import Button from '../../components/common/Button';
import { useTranslation } from '../../contexts/LanguageContext';
import Table from '../../components/Table/Table';

const Home = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    totalProjects: 0,
    currentProjects: 0,
    totalPartners: 0,
    totalLeads: 0,
    projectsInQA: 0,
    totalProjectPartners: 0,
    preApprovedProjects: 0,
    initiatives: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('all'); // 'all', 'general', 'initiative'

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/statistics');
        if (!response.ok) {
          throw new Error('Failed to fetch statistics');
        }
        const data = await response.json();
        setStats(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchStats();

    // Add event listener for sync completion
    const handleSyncComplete = () => {
      fetchStats();
    };

    window.addEventListener('dataSyncComplete', handleSyncComplete);
    return () => window.removeEventListener('dataSyncComplete', handleSyncComplete);
  }, []);

  const statCards = [
    { title: t('home.stats.totalProjects'), value: stats.totalProjects },
    { title: t('home.stats.currentProjects'), value: stats.currentProjects },
    { title: t('home.stats.projectsInQA'), value: stats.projectsInQA },
    { title: t('home.stats.projectPartners'), value: stats.totalProjectPartners },
  ];

  const secondaryStatCards = [
    { title: t('home.stats.preApprovedProjects'), value: stats.preApprovedProjects },
    { title: t('home.stats.initiatives'), value: stats.initiatives },
    { title: t('home.stats.totalPartners'), value: stats.totalPartners },
    { title: t('home.stats.totalLeads'), value: stats.totalLeads },
  ];

  if (loading) return <div className="loading-container">Loading...</div>;
  if (error) return <div className="error-container">Error: {error}</div>;

  return (
    <div className="home-container">
      <div className="view-toggle-container">
        <div className="segmented-control">
          <button 
            className={`segment-btn ${viewMode === 'all' ? 'active' : ''}`}
            onClick={() => setViewMode('all')}
          >
            {t('home.viewMode.all')}
          </button>
          <button 
            className={`segment-btn ${viewMode === 'general' ? 'active' : ''}`}
            onClick={() => setViewMode('general')}
          >
            {t('home.viewMode.general')}
          </button>
          <button 
            className={`segment-btn ${viewMode === 'initiative' ? 'active' : ''}`}
            onClick={() => setViewMode('initiative')}
          >
            {t('home.viewMode.initiative')}
          </button>
        </div>
      </div>
      
      {(viewMode === 'all' || viewMode === 'general') && (
        <div className="stats-container">
          {statCards.map((stat, index) => (
            <div key={index} className="stat-card">
              <h3>{stat.title}</h3>
              <p className="stat-value">{stat.value}</p>
            </div>
          ))}
        </div>
      )}
      
      {(viewMode === 'all' || viewMode === 'initiative') && (
        <div className="stats-container">
          {secondaryStatCards.map((stat, index) => (
            <div key={index} className="stat-card stat-card-secondary">
              <h3>{stat.title}</h3>
              <p className="stat-value">{stat.value}</p>
            </div>
          ))}
        </div>
      )}
      <Table />
    </div>
  );
};

export default Home; 