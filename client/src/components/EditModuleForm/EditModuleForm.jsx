import React, { useState, useEffect } from 'react';
import './EditModuleForm.css';
import { useNavigate } from 'react-router-dom';
import Timeline from '../Timeline/Timeline';

const EditModuleForm = ({ data, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    partner: data?.partner || '',
    classcode: data?.classcode || '',
    advisor: data?.advisor || '',
    classroom: data?.classroom || '',
    status: data?.status || 'Open for partners',
    sector: data?.sector || '',
    comment: data?.comment || ''
  });
  const [showPartnersList, setShowPartnersList] = useState(false);
  const [partnerSearch, setPartnerSearch] = useState(data?.partner || '');
  const [showHistory, setShowHistory] = useState(false);
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [partners, setPartners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        setIsLoading(true);
        setError(null);
        // Fetch partners from local database instead of Salesforce
        const response = await fetch('/api/partners', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch partners');
        }

        setPartners(data.partners);
      } catch (error) {
        console.error('Error fetching partners:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPartners();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'status') {
      if (value === 'Open for partners') {
        // Set partner to "Available" when status is Open for partners
        setFormData(prev => ({
          ...prev,
          [name]: value,
          partner: 'Available',
          sector: ''
        }));
        setPartnerSearch('Available');
      } else if (value === 'Confirmed') {
        // Keep existing partner when changing to Confirmed
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Add this function to check if the current partner is valid
  const isValidPartner = () => {
    // Partner is valid if it's "Available" or exists in the partners list
    return formData.partner === 'Available' || 
           partners.some(p => p.Name === formData.partner);
  };

  const handlePartnerSearch = (e) => {
    const value = e.target.value;
    setPartnerSearch(value);
    setShowPartnersList(true);
    
    // Clear the partner if the search field is empty
    if (!value) {
      setFormData(prev => ({
        ...prev,
        partner: '',
        sector: ''
      }));
    }
  };

  const handlePartnerSelect = (selectedPartnerName) => {
    const selectedCompany = partners.find(company => company.Name === selectedPartnerName);
    console.log('Selected company:', selectedCompany);
    
    setFormData(prev => ({
      ...prev,
      partner: selectedPartnerName,
      sector: selectedCompany?.Sector || ''
    }));
    setPartnerSearch(selectedPartnerName);
    setShowPartnersList(false);
  };

  const filteredPartners = partners
    .filter(company => 
      company.Name.toLowerCase().includes(partnerSearch.toLowerCase())
    )
    .slice(0, 5);

  // Modify the submit handler to check for valid partner
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValidPartner()) {
      return;
    }

    try {
      // Find the selected partner's ID from the partners list
      const selectedPartner = formData.status === 'Open for partners' 
        ? null 
        : partners.find(p => p.Name === formData.partner);
      
      console.log('Selected partner:', selectedPartner);
      console.log('Current form data:', formData);
      console.log('Current project data:', data);

      // Only include fields that are being changed
      const updateData = {
        id: data.id,
        partnerId: selectedPartner?.PartnerID || null,
        status: formData.status,
        comment: formData.comment,
        // Include these for UI update
        partner: formData.partner,
        sector: selectedPartner?.Sector || null
      };

      console.log('Sending update data:', updateData);

      const response = await fetch(`/api/projects/${data.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error response:', errorData);
        throw new Error(errorData.message || 'Failed to update project');
      }

      const result = await response.json();
      console.log('Update result:', result);

      if (result.success) {
        // Merge the updated data with existing data for the UI
        const updatedData = {
          ...data,
          ...updateData
        };
        onSubmit(updatedData);  // Pass the merged updated data
      } else {
        throw new Error(result.message || 'Failed to update project');
      }
    } catch (error) {
      console.error('Error updating project:', error);
      alert('Failed to update project. Please try again.');
    }
  };

  // Create array of classroom numbers 01-13
  const classrooms = Array.from({ length: 13 }, (_, i) => 
    (i + 1).toString().padStart(2, '0')
  );

  // Partner is disabled when status is Confirmed
  const isPartnerDisabled = formData.status === 'Confirmed';

  // Check if a valid partner is selected (not "Available" or empty)
  const hasValidPartner = formData.partner && formData.partner !== 'Available';

  // Function to toggle the timeline modal
  const toggleTimelineModal = () => {
    // Only show timeline if a classcode is entered
    if (formData.classcode) {
      setShowTimelineModal(!showTimelineModal);
    } else {
      alert("Please enter a class code first");
    }
  };

  return (
    <>
      <div className="edit-form-container">
        <h2>Edit Module</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Advisor</label>
              <input 
                type="text"
                name="advisor"
                value={formData.advisor}
                onChange={handleChange}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Classcode</label>
              <div className="classcode-container">
                <input 
                  type="text"
                  name="classcode"
                  value={formData.classcode}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
              <span 
                className="history-link"
                onClick={toggleTimelineModal}
              >
                View class history
              </span>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="form-input"
              >
                <option value="">Select Status</option>
                <option value="Open for partners">Open for partners</option>
                <option value="Pending">Pending</option>
                <option value="Confirmed" disabled={!hasValidPartner}>
                  Confirmed {!hasValidPartner && '(Select a partner first)'}
                </option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Classroom</label>
              <select
                name="classroom"
                value={formData.classroom}
                onChange={handleChange}
                className="form-input"
              >
                <option value="">Select Classroom</option>
                {classrooms.map((num) => (
                  <option key={num} value={num}>
                    {num}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Partner</label>
              <div className="partner-input-container">
                <input 
                  type="text"
                  value={formData.status === 'Open for partners' ? 'Available' : partnerSearch}
                  onChange={handlePartnerSearch}
                  onFocus={() => !isPartnerDisabled && setShowPartnersList(true)}
                  className="form-input"
                  placeholder={
                    isLoading 
                      ? "Loading partners..." 
                      : error 
                      ? "Error loading partners"
                      : formData.status === 'Confirmed' 
                      ? "Partner locked - Status is Confirmed" 
                      : formData.status === 'Open for partners'
                      ? "Available"
                      : "Type to search partners..."
                  }
                  disabled={isPartnerDisabled || formData.status === 'Open for partners' || isLoading}
                />
                {showPartnersList && !isPartnerDisabled && formData.status !== 'Open for partners' && filteredPartners.length > 0 && (
                  <div className="partners-dropdown">
                    {filteredPartners.map((company, index) => (
                      <div 
                        key={index}
                        className="partner-option"
                        onClick={() => handlePartnerSelect(company.Name)}
                      >
                        {company.Name}
                      </div>
                    ))}
                  </div>
                )}
                {!isValidPartner() && partnerSearch && partnerSearch !== 'Available' && (
                  <div className="error-message">
                    Please select a partner from the list
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Comment</label>
            <textarea 
              name="comment"
              value={formData.comment || ''}
              onChange={handleChange}
              className="form-input"
              rows="3"
            />
          </div>

          <div className="form-buttons">
            <button 
              type="button" 
              className="cancel-button"
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="module-edit-save-button"
              disabled={!isValidPartner() && formData.status !== 'Open for partners'}
            >
              Save
            </button>
          </div>
        </form>
      </div>

      {showTimelineModal && (
        <div className="modal-overlay" onClick={() => setShowTimelineModal(false)}>
          <div className="modal-content history-modal" onClick={e => e.stopPropagation()}>
            <h2>Class History: {formData.classcode}</h2>
            <Timeline />
            <button 
              className="close-button"
              onClick={() => setShowTimelineModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default EditModuleForm; 