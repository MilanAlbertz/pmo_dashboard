import React, { useState, useEffect } from 'react';
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
    partner: null // Will be set after partners are loaded
  });

  const [modules, setModules] = useState([]);
  const [courses, setCourses] = useState([]);
  const [partners, setPartners] = useState([]);
  const [isLoadingModules, setIsLoadingModules] = useState(false);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [isLoadingPartners, setIsLoadingPartners] = useState(true);
  const [error, setError] = useState('');

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
        // Pre-select the partner that matches card.PartnerName
        if (card?.PartnerName) {
          const matched = data.find(p => p.name === card.PartnerName);
          setFormData(prev => ({ ...prev, partner: matched || null }));
        }
      } catch (error) {
        console.error('Error loading partners and leads:', error);
      } finally {
        setIsLoadingPartners(false);
      }
    };
    loadPartners();
  }, [card?.PartnerName]);

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
          partnerName: formData.partner ? formData.partner.name : undefined
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
            <label>Partner</label>
            <Autocomplete
              options={partners}
              getOptionLabel={(option) => option ? `${option.name} (${option.type})` : ''}
              value={formData.partner}
              onChange={(event, newValue) => {
                setFormData(prev => ({ ...prev, partner: newValue }));
              }}
              renderInput={(params) => (
                <div ref={params.InputProps.ref}>
                  <input
                    type="text"
                    {...params.inputProps}
                    className="form-input"
                    placeholder="Search for a partner..."
                    disabled={isLoadingPartners}
                  />
                </div>
              )}
              renderOption={(props, option) => (
                <li {...props}>
                  {option.name} ({option.type})
                </li>
              )}
              loading={isLoadingPartners}
              loadingText="Loading partners..."
              noOptionsText="No partners found"
              isOptionEqualToValue={(option, value) => option.id === value?.id}
              style={{ width: '100%' }}
            />
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