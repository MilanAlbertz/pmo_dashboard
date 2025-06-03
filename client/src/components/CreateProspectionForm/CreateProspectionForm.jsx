import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
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
    partners: [],
    description: ''
  });

  const [selectedPartners, setSelectedPartners] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [modules, setModules] = useState([]);
  const [courses, setCourses] = useState([]);
  const [partners, setPartners] = useState([]);
  const [isLoadingModules, setIsLoadingModules] = useState(false);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [isLoadingPartners, setIsLoadingPartners] = useState(true);
  const [error, setError] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);

  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });

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
        console.log('Loaded partners:', data); // Debug log
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
    if (containerRef.current && inputValue) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  }, [inputValue]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(''); // Clear error when form changes
  };

  const validateForm = () => {
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    // Debug logs for course value
    console.log('Submitting course:', formData.course);
    console.log('Available course values:', courses);
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
          partners: formData.partners
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
    <div className="edit-form-container" style={{ overflow: 'visible', position: 'relative' }}>
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

          <div className="form-group" style={{ overflow: 'visible', position: 'relative', width: '100%', maxWidth: '100%'}}>
            <label>Partners</label>
            <div style={{ width: '100%', maxWidth: '100%', position: 'relative' }}>
              <div
                ref={containerRef}
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
                  {selectedPartners.length > 0 && (
                    <span style={{
                      fontStyle: 'italic',
                      color: '#333',
                      marginRight: '4px',
                      flexShrink: 0
                    }}>
                      {selectedPartners.map(p => p.name).join('; ')};{' '}
                    </span>
                  )}
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setTimeout(() => setIsInputFocused(false), 150)}
                    className="form-input"
                    placeholder={selectedPartners.length === 0 ? 'Search for partners...' : ''}
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
                      if (e.key === 'Backspace' && inputValue === '' && selectedPartners.length > 0) {
                        const newPartners = selectedPartners.slice(0, -1);
                        setSelectedPartners(newPartners);
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
                      !selectedPartners.some(p => p.name === partner.name)
                    )
                    .map((partner, index) => (
                      <div
                        key={partner.id || partner.name}
                        onClick={() => {
                          if (selectedPartners.length >= 5) return;
                          const newPartners = [...selectedPartners, partner];
                          setSelectedPartners(newPartners);
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
          <button type="submit" className="submit-button">Create Module</button>
          <button type="button" className="cancel-button" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default CreateProspectionForm; 