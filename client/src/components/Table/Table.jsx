import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from '../../contexts/LanguageContext';
import { fetchProjects } from '../../utils/api';
import './Table.css';
import { Link, useLocation } from 'react-router-dom';
import FilterIcon from '../../assets/images/icons/FilterIcon';
import CrossIcon from '../../assets/images/icons/CrossIcon';
import SortIcon from '../../assets/images/icons/SortIcon';
import SortUpIcon from '../../assets/images/icons/SortUpIcon';
import SortDownIcon from '../../assets/images/icons/SortDownIcon';

const Table = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  const [activeFilter, setActiveFilter] = useState(null);
  const [filterInput, setFilterInput] = useState('');
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc'
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tableData, setTableData] = useState([]);

  const handleFilterClick = (column) => {
    setActiveFilter(activeFilter === column ? null : column);
    setFilterInput(filters[column] || '');
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    if (activeFilter) {
      setFilters(prev => ({
        ...prev,
        [activeFilter]: filterInput
      }));
      setActiveFilter(null);
    }
  };

  const removeFilter = (column) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[column];
      return newFilters;
    });
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const formatPeriod = (period) => {
    if (!period) return '';
    return period.toString().replace('.', '');
  };

  const loadData = async () => {
    try {
      console.log('Fetching project data...');
      const response = await fetchProjects();
      console.log('Received project data:', response);
      setData(response);
      setTableData(response);  // The response is already an array from the database
      setLoading(false);
    } catch (err) {
      console.error('Error fetching project data:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  // Load data on mount and when location changes
  useEffect(() => {
    loadData();

    // Add event listener for sync completion
    const handleSyncComplete = () => {
      loadData();
    };

    window.addEventListener('dataSyncComplete', handleSyncComplete);
    return () => window.removeEventListener('dataSyncComplete', handleSyncComplete);
  }, [location.pathname]);

  const getStatusColor = (status) => {
    if (!status) return '#F5F5F5';
    // Remove accents and convert to lower case
    const normalized = status.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
    // Yellow: 'Pré análise de aderência docentes'
    if (normalized.includes('pre analise de aderencia docentes')) {
      return '#FFF9C4'; // Soft Yellow
    }
    // Red: up to and including 'Pré seleção EP'
    if (normalized.includes('pre selecao ep')) {
      return '#FFCDD2'; // Soft Red
    }
    // Yellow: until 'Concluido'
    if (
      normalized.includes('envio dos documentos') ||
      normalized.includes('tapi') ||
      normalized.includes('pre projeto') ||
      normalized.includes('projeto') ||
      normalized.includes('envio de prototipos')
    ) {
      return '#FFF9C4'; // Soft Yellow
    }
    // Green: 'Concluido'
    if (normalized.includes('concluido')) {
      return '#C8E6C9'; // Soft Green
    }
    return '#F5F5F5';
  };

  const filteredData = useMemo(() => {
    if (!tableData) return [];
    
    console.log('Filtering data with:', { filters, searchTerm, sortConfig });
    let filtered = tableData.filter(row => {
      // Check if row matches all active filters
      const matchesFilters = Object.keys(filters).every(key => {
        if (!filters[key]) return true;
        
        let value = row[key];
        
        // Special handling for status column
        if (key === 'Status') {
          value = row.Status.toLowerCase();
        } else {
          value = String(value).toLowerCase();
        }
        
        return value.includes(filters[key].toLowerCase());
      });

      // Check if row matches search term
      const matchesSearch = Object.values(row).some(value => 
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      );

      return matchesFilters && matchesSearch;
    });

    // Apply sorting if sortConfig is set
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Special handling for status column
        if (sortConfig.key === 'Status') {
          aValue = a.Status.toLowerCase();
          bValue = b.Status.toLowerCase();
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    console.log('Filtered data:', filtered);
    return filtered;
  }, [tableData, filters, searchTerm, sortConfig]);

  const columns = [
    { key: 'Period', label: t('table.headers.period') },
    { key: 'classCode', label: t('table.headers.className') },
    { key: 'module', label: t('table.headers.module') },
    { key: 'partnerName', label: t('table.headers.partner') },
    { key: 'Description', label: t('table.headers.description') },
    { key: 'Status', label: t('table.headers.status') }
  ];

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return <div>No data available</div>;

  return (
    <div className="table-wrapper">
      <div className="table-controls">
        <div className="search-bar">
          <input
            type="text"
            placeholder={t('common.labels.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="table-info">
            {filteredData.length} {t('table.rows')}
          </div>
        </div>
      </div>
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              {columns.map(column => (
                <th key={column.key}>
                  <div className="th-content">
                    <div 
                      className="th-title"
                      onClick={() => handleSort(column.key)}
                    >
                      <span>{column.label}</span>
                      <span className="sort-icon">
                        {sortConfig.key === column.key ? (
                          sortConfig.direction === 'asc' ? <SortUpIcon /> : <SortDownIcon />
                        ) : (
                          <SortIcon />
                        )}
                      </span>
                    </div>
                    <div className="filter-section">
                      <button 
                        className={`filter-icon ${filters[column.key] ? 'active' : ''}`}
                        onClick={() => handleFilterClick(column.key)}
                      >
                        <FilterIcon />
                      </button>
                      {filters[column.key] && (
                        <button 
                          className="filter-remove"
                          onClick={() => removeFilter(column.key)}
                          title="Remove filter"
                        >
                          <CrossIcon />
                        </button>
                      )}
                    </div>
                  </div>
                  {activeFilter === column.key && (
                    <form className="filter-popup" onSubmit={handleFilterSubmit}>
                      <input
                        type="text"
                        value={filterInput}
                        onChange={(e) => setFilterInput(e.target.value)}
                        placeholder={`Filter ${column.label}...`}
                        autoFocus
                      />
                    </form>
                  )}
                </th>
              ))}
              <th>{t('table.headers.details')}</th>
            </tr>
          </thead>
          <tbody>
            {(!tableData || tableData.length === 0) ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
                  {t('table.noData')}
                </td>
              </tr>
            ) : filteredData.length > 0 ? (
              filteredData.map((row, index) => (
                <tr key={index}>
                  <td>{row.Period}</td>
                  <td>{row.classCode}</td>
                  <td>{row.module}</td>
                  <td>{row.partnerName}</td>
                  <td>
                    <div 
                      className="description-cell" 
                      title={row.Description || ''}
                    >
                      {row.Description ? (
                        row.Description.length > 100 
                          ? `${row.Description.substring(0, 100)}...` 
                          : row.Description
                      ) : ''}
                    </div>
                  </td>
                  <td style={{ backgroundColor: getStatusColor(row.Status) }}>
                    {row.Status}
                  </td>
                  <td>
                    <Link to={`/project/${row.Id}`} className="details-link">
                      {t('table.headers.details')}
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
                  {t('table.noMatchingRecords')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table; 