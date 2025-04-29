import React, { useState, useEffect } from 'react';
import { ReactComponent as EditIcon } from '../../assets/images/icons/edit.svg';
import Modal from '../Modal/Modal';
import EditModuleForm from '../EditModuleForm/EditModuleForm';
import { fetchPartners } from '../../utils/api';
import './ModuleCard.css';

const ModuleCard = ({ moduleNumber, data, onUpdate, isCompact }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [partners, setPartners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Add debug logging
  console.log('ModuleCard received data:', data);
  
  useEffect(() => {
    const loadPartners = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch('/api/partners');
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch partners');
        }
        setPartners(data.partners);
      } catch (error) {
        console.error('Error loading partners:', error);
        setError('Failed to load partners data');
        // Set empty partners array to prevent errors in rendering
        setPartners([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadPartners();
  }, []);

  const getCardClass = () => {
    if (data?.status === 'Confirmed') return 'confirmed';
    if (data?.status === 'Pending') return 'filled';
    return 'empty'; // Default case (Open for partners)
  };

  const getPartnerType = (partnerName) => {
    if (!partners.length || !partnerName) return null;
    const partner = partners.find(company => company.Name === partnerName);
    return partner?.Sector;
  };

  const getPartnerBadgeColor = (sector) => {
    if (!sector) return 'transparent';
    switch (sector.toLowerCase()) {
      case 'gov':
        return '#4CAF50'; // Green
      case 'ong':
        return '#2196F3'; // Blue
      case 'privado':
        return '#9e9e9e'; // Gray
      default:
        return 'transparent';
    }
  };

  // Add a console.log to debug
  console.log('Module data:', data);
  console.log('Partner:', data?.partner, 'Type:', getPartnerType(data?.partner));

  const handleEditClick = () => {
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = (updatedData) => {
    console.log('ModuleCard received updated data:', updatedData);
    // Pass the complete updated data to the parent
    onUpdate(updatedData);
    setIsModalOpen(false);
  };

  return (
    <div className={`module-card ${getCardClass()} ${isCompact ? 'compact' : ''}`}>
      <div className="module-header">
        <h3>{data.module || `Module ${moduleNumber}`}</h3>
        <EditIcon className="edit-icon" onClick={handleEditClick} />
      </div>
      <div className="module-content">
        {isCompact ? (
          data?.partner && (
            <div className="info-row">
              <span className="info-label">Partner:</span>
              <span className="info-value">
                {data.partner}
                <span 
                  className="partner-type-badge" 
                  style={{ 
                    backgroundColor: getPartnerBadgeColor(data.sector)
                  }}
                  title={data.sector}
                />
              </span>
            </div>
          )
        ) : (
          <>
            {data?.partner && (
              <div className="info-row">
                <span className="info-label">Partner:</span>
                <span className="info-value">
                  {data.partner}
                  <span 
                    className="partner-type-badge" 
                    style={{ 
                      backgroundColor: getPartnerBadgeColor(data.sector)
                    }}
                    title={data.sector}
                  />
                </span>
              </div>
            )}
            {data?.classCode && (
              <div className="info-row">
                <span className="info-label">Class Code:</span>
                <span className="info-value">{data.classCode}</span>
              </div>
            )}
            {data?.advisor && (
              <div className="info-row">
                <span className="info-label">Advisor:</span>
                <span className="info-value">{data.advisor}</span>
              </div>
            )}
            {data?.classroom && (
              <div className="info-row">
                <span className="info-label">Classroom:</span>
                <span className="info-value">{data.classroom}</span>
              </div>
            )}
            {data?.comment && (
              <div className="info-row comment-row">
                <span className="info-label">Comment:</span>
                <span className="info-value">{data.comment}</span>
              </div>
            )}
            {data?.status && (
              <div className="info-row">
                <span className="info-label">Status:</span>
                <span className="info-value">{data.status}</span>
              </div>
            )}
          </>
        )}
      </div>
      <Modal isOpen={isModalOpen} onClose={handleClose}>
        <EditModuleForm
          data={data}
          onClose={handleClose}
          onSubmit={handleSubmit}
          partners={partners}
          isLoading={isLoading}
          error={error}
        />
      </Modal>
    </div>
  );
};

export default ModuleCard; 