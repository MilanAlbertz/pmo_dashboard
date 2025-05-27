import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../contexts/LanguageContext';
import { Autocomplete } from '@mui/material';
import { fetchModuleNames, fetchCoursePicklistValues, fetchPartnersAndLeads } from '../../utils/api';
import './CreateProspectionForm.css';

// Mapping from UI label to Salesforce value
const courseLabelToSalesforceValue = {
  "1º ANO": "Turma de 1° ano",
  "Ciência da Computação": "Ciência da Computação",
  "Engenharia da Computação": "Engenharia da Computação",
  "Sistemas de Informação": "Sistemas de Informação",
  "Engenharia de Software": "Engenharia de Software"
};

function normalizeString(str) {
  return str
    ? str.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()
    : '';
}

const CreateProspectionForm = ({ onSubmit, onCancel, initialData }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    course: '',
    year: initialData?.year || new Date().getFullYear(),
    period: initialData?.period || 1,
    name: '',
    classCode: '',
    status: 'Open for partners',
    advisor: '',
    classroom: '',
    partnerName: '',
    description: ''
  });

  const [modules, setModules] = useState([]);
  const [courses, setCourses] = useState([]);
  const [partners, setPartners] = useState([]);
  const [isLoadingModules, setIsLoadingModules] = useState(false);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [isLoadingPartners, setIsLoadingPartners] = useState(true);
  const [error, setError] = useState('');
  const [existingCards, setExistingCards] = useState([]);

  // Load courses on mount
  useEffect(() => {
    const loadCourses = async () => {
      try {
        setIsLoadingCourses(true);
        const courseValues = await fetchCoursePicklistValues();
        setCourses(courseValues);
        // After courses are loaded, set the initial course if provided
        if (initialData?.course) {
          const mappedCourse = courseLabelToSalesforceValue[initialData.course] || initialData.course;
          const normalizedMapped = normalizeString(mappedCourse);
          console.log('Trying to pre-select course:', mappedCourse, '| Normalized:', normalizedMapped);
          console.log('Available course values:', courseValues.map(c => c.value));
          const matchingCourse = courseValues.find(c =>
            normalizeString(c.value) === normalizedMapped
          );
          if (matchingCourse) {
            console.log('Pre-selecting course:', matchingCourse.value);
            setFormData(prev => ({
              ...prev,
              course: matchingCourse.value
            }));
          } else {
            console.log('No matching course found for:', mappedCourse);
          }
        }
      } catch (error) {
        console.error('Error loading courses:', error);
      } finally {
        setIsLoadingCourses(false);
      }
    };
    loadCourses();
  }, [initialData?.course]);

  // Load partners on mount
  useEffect(() => {
    const loadPartners = async () => {
      try {
        setIsLoadingPartners(true);
        const data = await fetchPartnersAndLeads();
        console.log('Loaded partners and leads:', data);
        setPartners(data);
      } catch (error) {
        console.error('Error loading partners and leads:', error);
      } finally {
        setIsLoadingPartners(false);
      }
    };

    loadPartners();
  }, []);

  // Load modules when course changes
  useEffect(() => {
    const loadModules = async () => {
      if (!formData.course) return;
      
      try {
        console.log('Loading modules for course:', formData.course);
        setIsLoadingModules(true);
        const moduleNames = await fetchModuleNames(formData.course);
        console.log('Received modules:', moduleNames);
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
    fetchExistingCards();
  }, []);

  const fetchExistingCards = async () => {
    try {
      const response = await fetch('/api/prospection-cards');
      if (!response.ok) {
        throw new Error('Failed to fetch existing cards');
      }
      const data = await response.json();
      setExistingCards(data);
    } catch (error) {
      console.error('Error fetching existing cards:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(''); // Clear error when form changes
  };

  const validateForm = () => {
    // Check if a card already exists for the same year, period, and course
    const existingCard = existingCards.find(card => 
      card.Year === parseInt(formData.year) && 
      card.Period === parseInt(formData.period) && 
      card.Course === formData.course
    );

    if (existingCard) {
      setError(`A prospection card already exists for ${formData.course} in ${formData.year}.${formData.period}`);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    try {
      const response = await fetch('/api/prospection-cards', {
        method: 'POST',
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
        if (errorData.error?.includes('Duplicate entry')) {
          throw new Error('A prospection card with this class code already exists. Please use a different class code.');
        }
        throw new Error(errorData.error || 'Failed to create prospection card');
      }

      const data = await response.json();
      console.log('Prospection card created:', data);
      onSubmit(formData);
    } catch (error) {
      console.error('Error creating prospection card:', error);
      setError(error.message || 'Failed to create prospection card. Please try again.');
    }
  };

  // Create array of classroom numbers 01-13
  const classrooms = Array.from({ length: 13 }, (_, i) => 
    (i + 1).toString().padStart(2, '0')
  );

  // Generate array of years (current year + 4 years ahead)
  const years = Array.from(
    { length: 5 },
    (_, i) => (new Date().getFullYear() + i).toString()
  );

  // Generate array of periods (1-4)
  const periods = ['1', '2', '3', '4'];

  return (
    <div className="edit-form-container">
      <h2>Create New Module</h2>
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
              disabled={isLoadingCourses}
            >
              <option value="">Select a course</option>
              {courses.map((course, index) => (
                <option key={index} value={course.value}>
                  {course.label}
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
          <button type="submit" className="submit-button">Create Module</button>
          <button type="button" className="cancel-button" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default CreateProspectionForm; 