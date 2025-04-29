import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../contexts/LanguageContext';
import ModuleCard from '../../components/ModuleCard/ModuleCard';
import { fetchProjects, updateModule } from '../../utils/api';
import './Prospection.css';
import { ReactComponent as MinimizeIcon } from '../../assets/images/icons/minimize.svg';
import { ReactComponent as MaximizeIcon } from '../../assets/images/icons/maximize.svg';

const Prospection = () => {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    '1º ANO': true,
    'Ciência da Computação': true,
    'Engenharia da Computação': true,
    'Sistemas de Informação': true,
    'ADM Tech': true
  });
  const [isCompact, setIsCompact] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [classCode, setClassCode] = useState('');

  const currentYear = new Date().getFullYear().toString();

  const courses = [
    "1º ANO",
    "Ciência da Computação",
    "Engenharia da Computação",
    "Sistemas de Informação",
    "ADM Tech"
  ];

  const toggleSection = (course) => {
    setExpandedSections(prev => ({
      ...prev,
      [course]: !prev[course]
    }));
  };

  const goToPreviousYear = () => {
    setSelectedYear(prev => (parseInt(prev) - 1).toString());
  };

  const goToNextYear = () => {
    setSelectedYear(prev => (parseInt(prev) + 1).toString());
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetchProjects();
        console.log('Fetched projects:', response.projects);
        setData(response.projects);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Add debug logging for filtering
  useEffect(() => {
    if (!data) return;
    console.log('Prospection page: full data:', data);
    [1, 2, 3, 4].forEach(period => {
      courses.forEach(course => {
        const filtered = data.filter(project =>
          String(project.year) === String(selectedYear) &&
          project.course === course &&
          String(project.period).endsWith('.' + period)
        );
        console.log(`Year: ${selectedYear}, Course: ${course}, Period: ${period} => ${filtered.length} projects`, filtered);
      });
    });
  }, [data, selectedYear]);

  if (loading) return <div className="loading-container">Loading...</div>;
  if (error) return <div className="error-container">Error: {error}</div>;
  if (!data) return <div className="error-container">No data available</div>;

  // Helper: get projects for a given year, course, and period
  const getProjectsFor = (year, course, period) => {
    const filtered = data.filter(project =>
      String(project.year) === String(year) &&
      project.course === course &&
      String(project.period).endsWith('.' + period)
    );
    console.log(`Filtered projects for ${year}, ${course}, ${period}:`, filtered);
    return filtered;
  };

  return (
    <div className="prospection-container">
      <div className="header-grid">
        <div className="empty-header"></div>
        <div className="year-header">
          <span className="year-nav" onClick={goToPreviousYear}>&lt;</span>
          <h2>{selectedYear}</h2>
          <span className="year-nav" onClick={goToNextYear}>&gt;</span>
          <button 
            className="view-toggle"
            onClick={() => setIsCompact(!isCompact)}
          >
            {isCompact ? <MaximizeIcon /> : <MinimizeIcon />}
          </button>
        </div>
      </div>
      <div className="period-headers">
        <div className="period-header empty-header"></div>
        {[1, 2, 3, 4].map(period => (
          <div key={period} className="period-header">
            Period {period}
          </div>
        ))}
      </div>
      {courses.map((course, index) => (
        <div key={index} className="module-row">
          <div 
            className="module-label"
            onClick={() => toggleSection(course)}
          >
            <span className="toggle-icon">{expandedSections[course] ? '▼' : '▶'}</span>
            {course}
          </div>
          {[1, 2, 3, 4].map((period) => (
            <div 
              key={period} 
              className="period-cell" 
              style={{ 
                display: expandedSections[course] ? 'flex' : 'none'
              }}
            >
              {getProjectsFor(selectedYear, course, period).map((project, idx) => (
                <ModuleCard 
                  key={project.id || idx}
                  moduleNumber={project.module}
                  data={project}
                  isCompact={isCompact}
                  onUpdate={() => {}}
                />
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default Prospection; 