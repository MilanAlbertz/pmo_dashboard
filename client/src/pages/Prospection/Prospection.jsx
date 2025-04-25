import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../contexts/LanguageContext';
import ModuleCard from '../../components/ModuleCard/ModuleCard';
import { fetchMockData, updateModule } from '../../utils/api';
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
        console.log('Fetching mock data...');
        const mockData = await fetchMockData();
        console.log('Received mock data structure:', {
          projects: mockData.projects,
          modules: mockData.modules,
          projectsLength: mockData.projects?.length,
          modulesKeys: Object.keys(mockData.modules || {})
        });
        setData(mockData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching mock data:', err);
        setError(err.message);
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) return <div className="loading-container">Loading...</div>;
  if (error) return <div className="error-container">Error: {error}</div>;
  if (!data) return <div className="error-container">No data available</div>;

  const getModuleCards = (course, period) => {
    console.log('Getting module cards for:', { course, period, selectedYear });
    console.log('Available projects:', data.projects?.map(p => ({
      className: p.className,
      period: p.period,
      module: p.module
    })));
    
    // Try both data structures
    let modules = [];
    
    // First try projects array
    if (data.projects) {
      modules = data.projects.filter(project => {
        const matches = project.className === course && project.period === period.toString();
        if (matches) {
          console.log('Found matching project:', project);
        }
        return matches;
      });
    }
    
    // If no matches in projects, try modules object
    if (modules.length === 0 && data.modules) {
      const yearModules = data.modules[selectedYear];
      if (yearModules) {
        const courseModules = yearModules[course];
        if (courseModules) {
          modules = courseModules[period] || [];
          console.log('Found modules in modules object:', modules);
        }
      }
    }
    
    console.log('Final modules for rendering:', modules);

    return modules.map((moduleData, idx) => {
      if (!moduleData) return null;
      return (
        <ModuleCard 
          key={idx} 
          moduleNumber={moduleData.module || period.toString()} 
          data={{
            ...moduleData,
            id: `${selectedYear}-${course}-${period}-${idx}`
          }}
          isCompact={isCompact}
          onUpdate={(updatedModule) => {
            console.log('Updating module with:', updatedModule);
            // Update the module in the data
            const updatedData = {
              ...data,
              projects: data.projects.map(project => 
                project.id === moduleData.id ? { ...project, ...updatedModule } : project
              )
            };
            setData(updatedData);
          }}
        />
      );
    }).filter(Boolean);
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
              {getModuleCards(course, period)}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default Prospection; 