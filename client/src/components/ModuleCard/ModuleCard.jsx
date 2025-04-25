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
  
  useEffect(() => {
    const loadPartners = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const partnersData = await fetchPartners();
        setPartners(partnersData.companies);
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
    console.log('Current status:', data?.status); // Debug log
    
    if (data?.status === 'Confirmed') return 'confirmed';
    if (data?.status === 'Pending') return 'filled';
    return 'empty'; // Default case (Open for partners)
  };

  const getPartnerType = (partnerName) => {
    if (!partners.length) return null; // Return null if partners data is not available
    const partner = partners.find(company => company.name === partnerName);
    return partner?.type;
  };

  const getPartnerBadgeColor = (partnerName) => {
    const type = getPartnerType(partnerName)?.toLowerCase();
    switch (type) {
      case 'gov':
        return '#4CAF50'; // Green
      case 'ong':
        return '#2196F3'; // Blue
      case 'privado':
        return '#9e9e9e'; // Gray
      default:
        return 'transparent'; // No badge for Available
    }
  };

  // Add a console.log to debug
  console.log('Partner:', data?.partner, 'Type:', getPartnerType(data?.partner));

  const handleEditClick = () => {
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = (updatedData) => {
    onUpdate(updatedData);
    setIsModalOpen(false);
  };

  return (
    <div className={`module-card ${getCardClass()} ${isCompact ? 'compact' : ''}`}>
      <div className="module-header">
        <h3>Module {moduleNumber}</h3>
        <EditIcon className="edit-icon" onClick={handleEditClick} />
      </div>
      <div className="module-content">
        {data?.partner && (
          <>
            {!isCompact && <span className="partner-label">Partner:</span>}
            <div className={`info-value ${isCompact ? 'compact' : ''}`}>
              <span className="partner-name">{data.partner}</span>
              {!isCompact && data.partner !== 'Available' && partners.length > 0 && (
                <span 
                  className="partner-badge" 
                  style={{ backgroundColor: getPartnerBadgeColor(data.partner) }}
                >
                  {getPartnerType(data.partner)}
                </span>
              )}
            </div>
          </>
        )}
        {!isCompact && (
          <>
            {data?.classroom && (
              <>
                <span className="info-label">Room:</span>
                <span className="info-value">{data.classroom}</span>
              </>
            )}
            {data?.advisor && (
              <>
                <span className="info-label">Advisor:</span>
                <span className="info-value">{data.advisor}</span>
              </>
            )}
            {data?.comment && (
              <div className="comment">{data.comment}</div>
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