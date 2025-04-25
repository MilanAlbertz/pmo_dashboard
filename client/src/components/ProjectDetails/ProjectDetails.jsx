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

const getStatusStep = (status) => {
  switch(status?.toLowerCase()) {
    case 'vaga em aberto':
      return 1;
    case 'aguardando início':
      return 2;
    case 'em andamento':
      return 3;
    case 'concluído':
      return 4;
    default:
      return 1;
  }
};

const StatusBar = ({ currentStep }) => {
  const { t } = useTranslation();
  const steps = [
    { number: 1, label: t('projectDetails.status.open') },
    { number: 2, label: t('projectDetails.status.waiting') },
    { number: 3, label: t('projectDetails.status.inProgress') },
    { number: 4, label: t('projectDetails.status.completed') }
  ];

  return (
    <div className="status-bar">
      {steps.map((step, index) => (
        <React.Fragment key={step.number}>
          {index > 0 && <div className={`status-line ${currentStep >= step.number ? 'completed' : ''}`} />}
          <div className={`status-step ${currentStep >= step.number ? 'completed' : ''}`}>
            <div className="status-number">
              {currentStep >= step.number ? <CheckIcon /> : step.number}
            </div>
            <div className="status-label">{step.label}</div>
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
      <span className="info-label" style={{ textAlign: 'left', display: 'block' }}>{label}:</span>
      <div 
        className={`description-value ${!value ? 'missing' : ''} ${required && !value ? 'required' : ''}`}
        style={{ textAlign: 'left' }}
      >
        {value || t('common.notSpecified')}
      </div>
    </div>
  );
};

const ProjectDetails = () => {
  const { t } = useTranslation();
  const { classCode } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const mockData = await fetchMockData();
        setData(mockData);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return <div>No data available</div>;

  const project = data.projects.find(p => p.classCode === classCode);

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
      <Link to="/" className="back-link">
        <span>←</span> {t('common.back')}
      </Link>
      
      <MobileStatusIndicator status={project.status} />
      <h1 className="project-title">{project?.projectDescription}</h1>
      
      <StatusBar currentStep={getStatusStep(project.status)} />
      
      <div className="info-grid">
        <InfoCard title={t('projectDetails.sections.generalInfo')}>
          <InfoRow label={t('projectDetails.fields.period')} value={project.period} />
          <InfoRow label={t('projectDetails.fields.date')} value={project.year} />
          <InfoRow label={t('projectDetails.fields.quarter')} value={project.quarter} />
          <InfoRow label={t('projectDetails.fields.startYear')} value={project.yearClass} />
          <InfoRow label={t('projectDetails.fields.class')} value={project.className} />
          <InfoRow label={t('projectDetails.fields.classCode')} value={project.classCode} />
          <InfoRow label={t('projectDetails.fields.module')} value={project.module} />
          <InfoRow label={t('projectDetails.fields.course')} value={project.course} />
          <InfoRow label={t('projectDetails.fields.coordinator')} value={project.coordinator} required />
          <InfoRow label={t('projectDetails.fields.advisor')} value={project.advisor} />
          <DescriptionRow 
            label={t('projectDetails.fields.projectDescription')} 
            value={project.projectDescription} 
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
            value={project.branch} 
          />
          <InfoRow 
            label={t('projectDetails.fields.activity')} 
            value={project.activity} 
          />
          <InfoRow 
            label={t('projectDetails.fields.partnerContact')} 
            value={project.partnerContact} 
          />
          <InfoRow 
            label={t('projectDetails.fields.email')} 
            value={project.partnerEmail} 
          />
          <InfoRow 
            label={t('projectDetails.fields.projectSupervisor')} 
            value={project.projectSupervisor} 
          />
          <InfoRow 
            label={t('projectDetails.fields.emailSupervisor')} 
            value={project.supervisorEmail} 
          />
        </InfoCard>

        <InfoCard title={t('projectDetails.sections.requiredInfo')}>
          <RequirementRow label={t('projectDetails.requirements.exampleData')} status="success" />
          <RequirementRow label={t('projectDetails.requirements.technicalMeeting')} status="success" />
          <RequirementRow label={t('projectDetails.requirements.logo')} status="error" />
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
              signed: project.tapi?.aligned || false,
              comment: project.tapi?.comment || "",
              meeting: project.tapi?.meeting || false
            }}
            type="tapi"
          />
        </InfoCard>
        
        <InfoCard title={t('projectDetails.sections.results')}>
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
              {project.githubLink ? (
                <a href={project.githubLink} target="_blank" rel="noopener noreferrer" className="github-link">
                  {t('projectDetails.status.viewGithub')}
                </a>
              ) : (
                <p className="no-github-text">{t('projectDetails.status.noGithub')}</p>
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