import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useTranslation } from '../../contexts/LanguageContext';
import { Autocomplete } from '@mui/material';
import { fetchModuleNames, fetchCoursePicklistValues, fetchPartnersAndLeads } from '../../utils/api';
import '../CreateProspectionForm/CreateProspectionForm.css';

const EditProspectionCard = ({ card, onSubmit, onCancel }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: card?.Name || '',
    course: card?.Course || '',
    description: card?.Description || '',
    year: card?.Year?.toString() || new Date().getFullYear().toString(),
    period: card?.Period?.toString() || '1',
    classCode: card?.ClassCode || '',
    status: card?.Status || 'Open for partners',
    advisor: card?.Advisor || '',
    classroom: card?.Classroom || '',
    partners: [] // Initialize as empty array
  });

  const [modules, setModules] = useState([]);
  const [courses, setCourses] = useState([]);
  const [partners, setPartners] = useState([]);
  const [isLoadingModules, setIsLoadingModules] = useState(false);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [isLoadingPartners, setIsLoadingPartners] = useState(true);
  const [error, setError] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const inputRef = useRef(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    const loadCourses = async () => {
      try {
        setIsLoadingCourses(true);
        const courseValues = await fetchCoursePicklistValues();
        setCourses(courseValues);
      } catch (error) {
        console.error('Error loading courses:', error);
      } finally {
        setIsLoadingCourses(false);
      }
    };
    loadCourses();
  }, []);

  useEffect(() => {
    const loadPartners = async () => {
      try {
        setIsLoadingPartners(true);
        const data = await fetchPartnersAndLeads();
        setPartners(data);
        // Pre-select the partners that match card.PartnerNames
        if (card?.PartnerNames) {
          const matched = data.filter(p => card.PartnerNames.includes(p.name));
          setFormData(prev => ({ ...prev, partners: matched }));
        }
      } catch (error) {
        console.error('Error loading partners and leads:', error);
      } finally {
        setIsLoadingPartners(false);
      }
    };
    loadPartners();
  }, [card?.PartnerNames]);

  useEffect(() => {
    const loadModules = async () => {
      if (!formData.course) return;
      try {
        setIsLoadingModules(true);
        const moduleNames = await fetchModuleNames(formData.course);
        setModules(moduleNames);
      } catch (error) {
        console.error('Error loading modules:', error);
      } finally {
        setIsLoadingModules(false);
      }
    };
    loadModules();
  }, [formData.course]);

  useEffect(() => {
    if (inputRef.current && isInputFocused) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  }, [isInputFocused, inputValue]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/prospection-cards/${card.ProspectionCardID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          course: formData.course,
          description: formData.description,
          year: parseInt(formData.year),
          period: parseInt(formData.period),
          classCode: formData.classCode,
          status: formData.status,
          advisor: formData.advisor,
          classroom: formData.classroom,
          partners: formData.partners
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update prospection card');
      }
      const data = await response.json();
      onSubmit(formData);
    } catch (error) {
      setError(error.message || 'Failed to update prospection card. Please try again.');
    }
  };

  const classrooms = Array.from({ length: 13 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() + i).toString());
  const periods = ['1', '2', '3', '4'];

  return (
    <div className="modal-content">
      <h2>Edit Module</h2>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Course</label>
            <select
              name="course"
              value={formData.course}
              onChange={handleChange}
              className="form-input"
              required
            >
              <option value="">Select a course</option>
              {courses.map((course, index) => (
                <option key={index} value={course.value || course}>
                  {course.label || course}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Module Name</label>
            <select
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="form-input"
              required
              disabled={isLoadingModules}
            >
              <option value="">Select a module</option>
              {modules.map((module, index) => (
                <option key={index} value={module}>
                  {module}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Partners</label>
            <div style={{ width: '100%', maxWidth: '100%', position: 'relative' }}>
              <div
                ref={inputRef}
                className="form-input"
                style={{
                  width: '100%',
                  maxWidth: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  background: 'white',
                  padding: '0.75rem',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box',
                  overflow: 'hidden',
                  position: 'relative',
                  height: '48px',
                  minHeight: 'unset'
                }}
              >
                <div style={{
                  position: 'absolute',
                  left: '0.75rem',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  display: 'flex',
                  alignItems: 'center',
                  overflowX: 'auto',
                  whiteSpace: 'nowrap',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  '&::-webkit-scrollbar': {
                    display: 'none'
                  }
                }}>
                  {formData.partners.length > 0 && (
                    <span style={{
                      fontStyle: 'italic',
                      color: '#333',
                      marginRight: '4px',
                      flexShrink: 0
                    }}>
                      {formData.partners.map(p => p.name).join('; ')};{' '}
                    </span>
                  )}
                  <input
                    type="text"
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setTimeout(() => setIsInputFocused(false), 150)}
                    className="form-input"
                    placeholder={formData.partners.length === 0 ? 'Search for partners...' : ''}
                    disabled={isLoadingPartners}
                    style={{
                      border: 'none',
                      outline: 'none',
                      boxShadow: 'none',
                      fontStyle: 'normal',
                      fontSize: '15px',
                      background: 'transparent',
                      padding: 0,
                      margin: 0,
                      color: '#333',
                      flex: '1',
                      minWidth: '120px',
                      width: 'auto',
                      height: '100%'
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Backspace' && inputValue === '' && formData.partners.length > 0) {
                        const newPartners = formData.partners.slice(0, -1);
                        setFormData(prev => ({ ...prev, partners: newPartners }));
                        e.preventDefault();
                      }
                    }}
                  />
                </div>
              </div>
              {isInputFocused && inputValue && !isLoadingPartners && ReactDOM.createPortal(
                <div style={{
                  position: 'absolute',
                  top: dropdownPos.top,
                  left: dropdownPos.left,
                  width: dropdownPos.width,
                  background: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  zIndex: 99999,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  {partners
                    .filter(partner =>
                      partner.name.toLowerCase().includes(inputValue.toLowerCase()) &&
                      !formData.partners.some(p => p.name === partner.name)
                    )
                    .map((partner, index) => (
                      <div
                        key={partner.id || partner.name}
                        onClick={() => {
                          if (formData.partners.length >= 5) return;
                          const newPartners = [...formData.partners, partner];
                          setFormData(prev => ({ ...prev, partners: newPartners }));
                          setInputValue('');
                        }}
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #eee',
                          ':hover': {
                            background: '#f5f5f5'
                          }
                        }}
                      >
                        {partner.name} ({partner.type})
                      </div>
                    ))}
                </div>, document.body
              )}
            </div>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="form-input"
            >
              <option value="Open for partners">Open for partners</option>
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
            </select>
          </div>

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
            <label>Class Code</label>
            <input
              type="text"
              name="classCode"
              value={formData.classCode}
              onChange={handleChange}
              className="form-input"
              placeholder="e.g., 2024-1A-T01"
            />
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
            <label>Period</label>
            <div className="period-inputs">
              <select
                name="year"
                value={formData.year}
                onChange={handleChange}
                className="form-input"
                required
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <select
                name="period"
                value={formData.period}
                onChange={handleChange}
                className="form-input"
                required
              >
                {periods.map((period) => (
                  <option key={period} value={period}>
                    {period}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="form-input"
            rows="3"
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="submit-button">Update</button>
          <button type="button" className="cancel-button" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default EditProspectionCard; 