import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from '../../contexts/LanguageContext';
import { fetchMockData, updateModule } from '../../utils/api';
import './Table.css';
import { Link } from 'react-router-dom';
import FilterIcon from '../../assets/images/icons/FilterIcon';
import CrossIcon from '../../assets/images/icons/CrossIcon';
import SortIcon from '../../assets/images/icons/SortIcon';
import SortUpIcon from '../../assets/images/icons/SortUpIcon';
import SortDownIcon from '../../assets/images/icons/SortDownIcon';

const Table = () => {
  const { t } = useTranslation();
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

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Fetching mock data...');
        const mockData = await fetchMockData();
        console.log('Received mock data:', mockData);
        setData(mockData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching mock data:', err);
        setError(err.message);
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const getStatusColor = (status) => {
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

  const getTranslatedStatus = (status) => {
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

  const tableData = data?.projects || [];
  console.log('Table data:', tableData);

  const filteredData = useMemo(() => {
    console.log('Filtering data with:', { filters, searchTerm, sortConfig });
    let filtered = tableData.filter(row => {
      // Check if row matches all active filters
      const matchesFilters = Object.keys(filters).every(key => {
        if (!filters[key]) return true;
        
        let value = row[key];
        
        // Special handling for status column
        if (key === 'status') {
          value = getTranslatedStatus(row.status).toLowerCase();
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
        if (sortConfig.key === 'status') {
          aValue = getTranslatedStatus(a.status);
          bValue = getTranslatedStatus(b.status);
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
  }, [tableData, filters, searchTerm, sortConfig, t]);

  const columns = [
    { key: 'period', label: t('table.headers.period') },
    { key: 'className', label: t('table.headers.className') },
    { key: 'module', label: t('table.headers.module') },
    { key: 'subject', label: t('table.headers.subject') },
    { key: 'partner', label: t('table.headers.partner') },
    { key: 'status', label: t('table.headers.status') }
  ];

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return <div>No data available</div>;
  if (tableData.length === 0) return <div>No projects found</div>;

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
            {filteredData.length > 0 ? (
              filteredData.map((row, index) => (
                <tr key={index}>
                  <td>{row.period}</td>
                  <td>{row.className}</td>
                  <td>{row.module}</td>
                  <td>{row.subject}</td>
                  <td>{row.partner}</td>
                  <td style={{ backgroundColor: getStatusColor(row.status) }}>
                    {getTranslatedStatus(row.status)}
                  </td>
                  <td>
                    <Link to={`/project/${row.classCode}`} className="details-link">
                      {t('table.headers.details')}
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center' }}>
                  No matching records found
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