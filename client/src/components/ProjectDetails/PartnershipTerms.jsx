import React, { useState } from 'react';
import { useTranslation } from '../../contexts/LanguageContext';
import CheckIcon from '../../assets/images/icons/CheckIcon';
import CrossIcon from '../../assets/images/icons/CrossIcon';
import DropdownArrow from '../../assets/images/icons/DropdownArrow';
import './PartnershipTerms.css';

const PartnershipTerms = ({ terms, type = "partnership" }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { t } = useTranslation();

  // Check if all terms are completed
  const allCompleted = type === "partnership" 
    ? terms.sent && terms.returned && terms.signed
    : terms.sent && terms.returned && terms.aligned && terms.meeting;

  return (
    <div className="partnership-terms">
      <div 
        className={`terms-header ${isExpanded ? 'expanded' : ''}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="header-content">
          <span className={`status-icon ${allCompleted ? 'success' : 'pending'}`}>
            {allCompleted ? <CheckIcon /> : <CrossIcon />}
          </span>
          <span>
            {t(`projectDetails.${type}.title`)}
          </span>
        </div>
        <span className={`expand-arrow ${isExpanded ? 'expanded' : ''}`}>
          <DropdownArrow />
        </span>
      </div>
      
      {isExpanded && (
        <div className="terms-content">
          <div className="terms-checklist">
            <div className={`term-item ${terms.sent ? 'success' : 'pending'}`}>
              <span className={`status-icon ${terms.sent ? 'success' : 'pending'}`}>
                {terms.sent ? <CheckIcon /> : <CrossIcon />}
              </span>
              <span>{t(`projectDetails.${type}.sent`)}</span>
            </div>
            
            <div className={`term-item ${terms.returned ? 'success' : 'pending'}`}>
              <span className={`status-icon ${terms.returned ? 'success' : 'pending'}`}>
                {terms.returned ? <CheckIcon /> : <CrossIcon />}
              </span>
              <span>{t(`projectDetails.${type}.returned`)}</span>
            </div>
            
            <div className={`term-item ${terms[type === "partnership" ? 'signed' : 'aligned'] ? 'success' : 'pending'}`}>
              <span className={`status-icon ${terms[type === "partnership" ? 'signed' : 'aligned'] ? 'success' : 'pending'}`}>
                {terms[type === "partnership" ? 'signed' : 'aligned'] ? <CheckIcon /> : <CrossIcon />}
              </span>
              <span>{t(`projectDetails.${type}.${type === "partnership" ? 'signed' : 'aligned'}`)}</span>
            </div>

            {type === "tapi" && (
              <div className={`term-item ${terms.meeting ? 'success' : 'pending'}`}>
                <span className={`status-icon ${terms.meeting ? 'success' : 'pending'}`}>
                  {terms.meeting ? <CheckIcon /> : <CrossIcon />}
                </span>
                <span>{t('projectDetails.tapi.meeting')}</span>
              </div>
            )}
          </div>
          
          {terms.comment && (
            <>
              <span className="comment-label">{t(`projectDetails.${type}.comment`)}:</span>
              <div className="terms-comment">
                <p>{terms.comment}</p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PartnershipTerms; 