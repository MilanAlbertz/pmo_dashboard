import React from 'react';
import './Home.css';
import Button from '../../components/common/Button';
import { useTranslation } from '../../contexts/LanguageContext';
import Table from '../../components/Table/Table';

const Home = () => {
  const { t } = useTranslation();

  const stats = [
    { title: 'Total Projects', value: 114 },
    { title: 'Current Projects', value: 20 },
    { title: 'Partners', value: 238 },
    { title: 'Leads', value: 7 },
  ];

  return (
    <div className="home-container">
      <h2>{t('table.title')}</h2>
      <div className="stats-container">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card">
            <h3>{stat.title}</h3>
            <p className="stat-value">{stat.value}</p>
          </div>
        ))}
      </div>
      <Table />
    </div>
  );
};

export default Home; 