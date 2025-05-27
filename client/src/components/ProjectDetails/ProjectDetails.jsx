import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from '../../contexts/LanguageContext';
import { fetchMockData, updateModule } from '../../utils/api';
import CheckIcon from '../../assets/images/icons/CheckIcon';
import CrossIcon from '../../assets/images/icons/CrossIcon';
import BackIcon from '../../assets/images/icons/BackIcon';
import './ProjectDetails.css';
import InfoCard from '../common/InfoCard/InfoCard';
import PartnershipTerms from './PartnershipTerms';
import RequirementDropdown from './RequirementDropdown';
import Timeline from '../Timeline/Timeline';

const getNPSColor = (score) => {
  if (score < 6) return 'nps-red';
  if (score < 8) return 'nps-yellow';
  return 'nps-green';
};

const NPSScore = ({ label, score }) => (
  <div className="nps-box" style={{ background: score >= 0 ? '#4caf50' : '#f44336' }}>
    <span>{label}</span>
    <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{score}</span>
  </div>
);

// List of all possible statuses in order
const PROJECT_STATUSES = [
  'Pré seleção EP',
  'Pré análise de aderência docentes',
  'Envio dos documentos',
  'TAPI',
  'Pré Projeto',
  'Projeto',
  'Envio de protótipos',
  'Concluido'
];

// Helper to normalize accents and case
const normalize = str => str ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() : '';

// Returns the step index (0-based) for the given status
const getStatusStep = (status) => {
  if (!status) return 0;
  
  // First try exact match
  const exactIndex = PROJECT_STATUSES.indexOf(status);
  if (exactIndex !== -1) return exactIndex;
  
  // If no exact match, try normalized comparison
  const normalizedStatus = normalize(status);
  const normalizedSteps = PROJECT_STATUSES.map(normalize);
  
  // Find the index of the matching status
  const index = normalizedSteps.findIndex(step => 
    normalizedStatus === step || // Exact normalized match
    normalizedStatus.includes(step) || // Status contains step
    step.includes(normalizedStatus) // Step contains status
  );
  
  return index === -1 ? 0 : index;
};

const StatusBar = ({ currentStep }) => {
  const steps = PROJECT_STATUSES;
  return (
    <div className="status-bar">
      {steps.map((label, index) => (
        <React.Fragment key={label}>
          {index > 0 && <div className={`status-line ${currentStep >= index ? 'completed' : ''}`} />}
          <div className={`status-step ${currentStep >= index ? 'completed' : ''}`}>  
            <div className="status-number">
              {currentStep >= index ? <CheckIcon /> : index + 1}
            </div>
            <div className="status-label">{label}</div>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
};

const MobileStatusIndicator = ({ status }) => {
  const { t } = useTranslation();
  
  const getStatusColor = () => {
    switch(status?.toLowerCase()) {
      case 'concluído':
        return '#E8F5E9';
      case 'em andamento':
        return '#E3F2FD';
      case 'aguardando início':
        return '#FFF3E0';
      case 'vaga em aberto':
      default:
        return '#F5F5F5';
    }
  };

  const getTranslatedStatus = () => {
    switch(status?.toLowerCase()) {
      case 'concluído':
        return t('projectDetails.status.completed');
      case 'em andamento':
        return t('projectDetails.status.inProgress');
      case 'aguardando início':
        return t('projectDetails.status.waiting');
      case 'vaga em aberto':
        return t('projectDetails.status.open');
      default:
        return t('projectDetails.status.notStarted');
    }
  };

  return (
    <div 
      className="mobile-status-indicator"
      style={{ backgroundColor: getStatusColor() }}
    >
      <span className="status-icon">ⓘ</span>
      <span className="status-text">
        {getTranslatedStatus()}
      </span>
    </div>
  );
};

const RequirementRow = ({ label, status }) => (
  <div className="requirement-row">
    <span className={`status-icon ${status}`}>
      {status === 'success' ? <CheckIcon /> : <CrossIcon />}
    </span>
    <span>{label}</span>
  </div>
);

const DescriptionRow = ({ label, value, required }) => {
  const { t } = useTranslation();
  
  return (
    <div className="description-row">
      <span className="info-label" style={{ textAlign: 'left', display: 'block', fontWeight: 'bold' }}>{label}:</span>
      <div 
        className={`description-value ${!value ? 'missing' : ''} ${required && !value ? 'required' : ''}`}
        style={{ 
          textAlign: 'left',
          fontSize: '12px',
          maxHeight: '150px',
          overflowY: 'auto',
          padding: '8px',
          border: '1px solid #e0e0e0',
          borderRadius: '4px',
          backgroundColor: '#f9f9f9'
        }}
      >
        {value || t('common.notSpecified')}
      </div>
    </div>
  );
};

const ProjectDetails = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch(`/api/projects/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch project details');
        }
        const projectData = await response.json();
        setData(projectData);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return <div>No data available</div>;

  const project = {
    ...data,
    module: data.module || '',
    partner: data.partnerName || '',
    period: data.Period || '',
    classCode: data.classCode || '',
    course: data.course || '',
    coordinator: data.CoordinatorID || '',
    advisor: data.AdvisorID || '',
    sector: data.sector || '',
    industry: data.industry || '',
    activity: data.activity || '',
    contacts: data.contacts || []
  };

  const getProjectStatus = () => {
    switch(project.status?.toLowerCase()) {
      case 'concluído':
        return t('projectDetails.status.completed');
      case 'em andamento':
        return t('projectDetails.status.started');
      default:
        return t('projectDetails.status.notStarted');
    }
  };

  const getStatusIcon = () => {
    switch(project.status?.toLowerCase()) {
      case 'concluído':
        return '✓';
      case 'em andamento':
        return '⟳';
      default:
        return '?';
    }
  };

  const requirementItems = [
    {
      label: t('projectDetails.requirements.exampleData'),
      status: 'error'
    },
    {
      label: t('projectDetails.requirements.technicalMeeting'),
      status: 'error'
    },
    {
      label: t('projectDetails.requirements.logo'),
      status: 'error'
    },
    {
      label: t('projectDetails.requirements.tapi'),
      status: 'error'
    }
  ];

  if (!project) {
    return (
      <div className="project-details-container">
        <h2>{t('projectDetails.notFound')}</h2>
        <Link to="/" className="back-button">{t('projectDetails.backButton')}</Link>
      </div>
    );
  }

  return (
    <div className="project-details-container">
      <div className="project-header-row">
        <Link to="/" className="back-link">
          <span>←</span> {t('common.back')}
        </Link>
        <h1 className="project-title">{project.module || project.Title}</h1>
      </div>
      
      <MobileStatusIndicator status={project.status} />
      
      <StatusBar currentStep={getStatusStep(project.Status)} />

      <div className="info-grid">
        <InfoCard title={t('projectDetails.sections.generalInfo')}>
          <InfoRow label={t('projectDetails.fields.period')} value={project.period} />
          <InfoRow label={t('projectDetails.fields.date')} value={project.year} />
          <InfoRow label={t('projectDetails.fields.quarter')} value={project.quarter} />
          <InfoRow label={t('projectDetails.fields.classCode')} value={project.classCode} />
          <InfoRow label={t('projectDetails.fields.course')} value={project.course} />
          <InfoRow label={t('projectDetails.fields.coordinator')} value={project.coordinator} />
          <InfoRow label={t('projectDetails.fields.advisor')} value={project.advisor} />
          <DescriptionRow 
            label={t('projectDetails.fields.projectDescription')} 
            value={project.Description} 
            required 
          />
        </InfoCard>

        <InfoCard title={t('projectDetails.sections.partner')}>
          <InfoRow 
            label={t('projectDetails.fields.partnerName')} 
            value={project.partner} 
          />
          <InfoRow 
            label={t('projectDetails.fields.sector')} 
            value={project.sector} 
          />
          <InfoRow 
            label={t('projectDetails.fields.branch')} 
            value={project.industry} 
          />
          <InfoRow 
            label={t('projectDetails.fields.activity')} 
            value={project.activity} 
          />

          {/* Partner Contact Info */}
          {project.contacts && project.contacts[0] && (
            <div style={{ marginTop: '16px', paddingTop: '12px', width: '100%' }}>
              <h2 style={{
                fontSize: '20px',
                marginTop: '0',
                marginBottom: '12px',
                paddingBottom: '12px',
                borderBottom: '1px solid #2E2640',
                color: '#1a1a1a',
                fontFamily: 'var(--font-heading)'
              }}>
                {t('projectDetails.fields.partnerContactInfo')}
              </h2>
              <InfoRow 
                label={t('projectDetails.fields.partnerContact')} 
                value={project.contacts[0].name} 
              />
              <InfoRow 
                label={t('projectDetails.fields.email')} 
                value={project.contacts[0].email} 
              />
              <InfoRow 
                label={t('projectDetails.fields.phone')} 
                value={project.contacts[0].phone} 
              />
            </div>
          )}
        </InfoCard>

        <InfoCard title={t('projectDetails.sections.requiredInfo')}>
          <InfoRow 
            label={t('projectDetails.fields.numPrototypes')} 
            value={project.NumPrototypes} 
          />
          <PartnershipTerms 
            terms={{
              sent: project.terms?.sent || false,
              returned: project.terms?.returned || false,
              signed: project.terms?.signed || false,
              comment: project.terms?.comment || ""
            }} 
          />
          <PartnershipTerms 
            terms={{
              sent: project.tapi?.sent || false,
              returned: project.tapi?.returned || false,
              aligned: project.tapi?.aligned || false,
              comment: project.tapi?.comment || ""
            }}
            type="tapi"
          />

          {/* Results section with heading and divider */}
          <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #2E2640', color: '#1a1a1a', fontFamily: 'var(--font-heading)' }}>
            {t('projectDetails.sections.results')}
          </h2>
          <div className="nps-container">
            <NPSScore 
              label={t('projectDetails.results.partnerNPS')} 
              score={project.partnerNPS} 
            />
            <NPSScore 
              label={t('projectDetails.results.studentNPS')} 
              score={project.studentNPS} 
            />
          </div>
          {project.status === 'Concluído' ? (
            <div className="status-section">
              <div className="status-icon">✓</div>
              <p className="status-text">{t('projectDetails.status.completed')}</p>
              {project.githubLink && (
                <a href={project.githubLink} target="_blank" rel="noopener noreferrer" className="github-link">
                  {t('projectDetails.status.viewGithub')}
                </a>
              )}
            </div>
          ) : (
            <div className="status-section">
              <div className="status-icon">{getStatusIcon()}</div>
              <p className="status-text">{getProjectStatus()}</p>
            </div>
          )}
        </InfoCard>
      </div>
    </div>
  );
};

const InfoRow = ({ label, value, required }) => {
  const { t } = useTranslation();
  
  return (
    <div className="info-row">
      <span className="info-label">{label}:</span>
      <span className={`info-value ${!value ? 'missing' : ''} ${required && !value ? 'required' : ''}`}>
        {value || t('common.notSpecified')}
      </span>
    </div>
  );
};

export default ProjectDetails;