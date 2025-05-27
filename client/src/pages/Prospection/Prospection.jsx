import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../contexts/LanguageContext';
import ProspectionCard from '../../components/ProspectionCard/ProspectionCard';
import { fetchProjects } from '../../utils/api';
import './Prospection.css';
import { ReactComponent as MinimizeIcon } from '../../assets/images/icons/minimize.svg';
import { ReactComponent as MaximizeIcon } from '../../assets/images/icons/maximize.svg';
import CreateProspectionForm from '../../components/CreateProspectionForm/CreateProspectionForm';
import EditProspectionCard from '../../components/EditProspectionCard/EditProspectionCard';

const Prospection = () => {
  const { t } = useTranslation();
  const [expandedSections, setExpandedSections] = useState({
    '1º ANO': true,
    'Ciência da Computação': true,
    'Engenharia da Computação': true,
    'Sistemas de Informação': true,
    'Engenharia de Software': true
  });
  const [isCompact, setIsCompact] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [cardBeingEdited, setCardBeingEdited] = useState(null);
  const [prospectionCards, setProspectionCards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [createModalData, setCreateModalData] = useState(null);

  const courses = [
    "1º ANO",
    "Ciência da Computação",
    "Engenharia da Computação",
    "Sistemas de Informação",
    "Engenharia de Software"
  ].sort((a, b) => a.localeCompare(b, 'pt', { sensitivity: 'base' }));

  const courseLabelToSalesforceValue = {
    "1º ANO": "Turma de 1° ano",
    "Ciência da Computação": "Ciência da Computação",
    "Engenharia da Computação": "Engenharia da Computação",
    "Sistemas de Informação": "Sistemas de Informação",
    "Engenharia de Software": "Engenharia de Software"
  };

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
    fetchProspectionCards();

    // Add event listener for sync completion
    const handleSyncComplete = () => {
      fetchProspectionCards();
    };

    window.addEventListener('dataSyncComplete', handleSyncComplete);
    return () => window.removeEventListener('dataSyncComplete', handleSyncComplete);
  }, []);

  const fetchProspectionCards = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/prospection-cards');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch prospection cards');
      }
      const data = await response.json();
      console.log('Fetched prospection cards:', data);
      console.log('Number of cards received:', data.length);
      setProspectionCards(data);
    } catch (error) {
      console.error('Error fetching prospection cards:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Add debug logging for filtering
  useEffect(() => {
    console.log('Current prospection cards:', prospectionCards);
    console.log('Selected year:', selectedYear);
    console.log('Expanded sections:', expandedSections);
    
    courses.forEach(course => {
      [1, 2, 3, 4].forEach(period => {
        const filtered = prospectionCards.filter(card => {
          const matches = card.Course.toLowerCase() === course.toLowerCase() && 
                         card.Year === parseInt(selectedYear) && 
                         card.Period === period;
          console.log(`Card ${card.ProspectionCardID}:`, {
            cardCourse: card.Course,
            targetCourse: course,
            cardYear: card.Year,
            targetYear: parseInt(selectedYear),
            cardPeriod: card.Period,
            targetPeriod: period,
            matches
          });
          return matches;
        });
        console.log(`Year: ${selectedYear}, Course: ${course}, Period: ${period} => ${filtered.length} cards`, filtered);
      });
    });
  }, [prospectionCards, selectedYear]);

  const handleSubmit = async (formData) => {
    console.log('Form submitted with data:', formData);
    setShowCreateModal(false);
    await fetchProspectionCards();
  };

  const handleEdit = (card) => {
    setCardBeingEdited(card);
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    setShowEditModal(false);
    setCardBeingEdited(null);
    await fetchProspectionCards();
  };

  const handleCreateClick = (course, period) => {
    setCreateModalData({
      course,
      year: parseInt(selectedYear),
      period
    });
    setShowCreateModal(true);
  };

  if (isLoading) return <div className="loading-container">Loading...</div>;
  if (error) return <div className="error-container">Error: {error}</div>;

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
            style={{ right: '50px' }}
            onClick={() => setIsCompact(!isCompact)}
          >
            {isCompact ? <MaximizeIcon /> : <MinimizeIcon />}
          </button>
          <button 
            className="view-toggle"
            onClick={() => setShowCreateModal(true)}
            title="Create Module"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="12" fill="#855ede"/>
              <path d="M12 7v10M7 12h10" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      {showCreateModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top:0, left:0, right:0, bottom:0, background: 'rgba(0,0,0,0.2)', zIndex: 1000 }}>
          <div style={{ position: 'relative', zIndex: 1001 }}>
            <CreateProspectionForm 
              onSubmit={handleSubmit} 
              onCancel={() => {
                setShowCreateModal(false);
                setCreateModalData(null);
              }}
              initialData={createModalData}
            />
          </div>
        </div>
      )}

      {showEditModal && cardBeingEdited && (
        <div className="modal-overlay" style={{ position: 'fixed', top:0, left:0, right:0, bottom:0, background: 'rgba(0,0,0,0.2)', zIndex: 1000 }}>
          <div style={{ position: 'relative', zIndex: 1001 }}>
            <EditProspectionCard
              card={cardBeingEdited}
              onSubmit={handleEditSubmit}
              onCancel={() => { setShowEditModal(false); setCardBeingEdited(null); }}
            />
          </div>
        </div>
      )}

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
          {[1, 2, 3, 4].map((period) => {
            const dbCourse = courseLabelToSalesforceValue[course] || course;
            const cardsInCell = prospectionCards.filter(card => 
              card.Course === dbCourse && 
              card.Year === parseInt(selectedYear) && 
              card.Period === period
            );
            
            return (
              <div 
                key={period} 
                className="period-cell" 
                style={{ 
                  display: expandedSections[course] ? 'flex' : 'none',
                  position: 'relative',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                {cardsInCell.map((card) => (
                  <ProspectionCard
                    key={card.ProspectionCardID}
                    moduleNumber={card.Name}
                    data={{
                      course: card.Course,
                      classCode: card.ClassCode,
                      year: card.Year,
                      quarter: card.Period,
                      status: card.Status,
                      advisor: card.Advisor,
                      classroom: card.Classroom,
                      partnerName: card.PartnerName,
                      description: card.Description
                    }}
                    isCompact={isCompact}
                    onEdit={() => handleEdit(card)}
                  />
                ))}
                {cardsInCell.length === 0 && (
                  <button 
                    className="create-prospection-link"
                    onClick={() => handleCreateClick(course, period)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    <span className="create-prospection-link-text">Create Prospection Card</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default Prospection; 