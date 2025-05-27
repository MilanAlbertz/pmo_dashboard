import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Header.css';
import LogoutIcon from '../../../assets/images/icons/LogoutIcon.png';
import LogoutIconHover from '../../../assets/images/icons/LogoutIconHover.png';
import InteliLogo from '../../../assets/images/logos/InteliLogo.png';
import UsFlag from '../../../assets/images/icons/UsFlag.svg';
import BrazilFlag from '../../../assets/images/icons/BrazilFlag.svg';
import NlFlag from '../../../assets/images/icons/NlFlag.svg';
import TranslateIcon from '../../../assets/images/icons/TranslateIcon.png';
import TranslateIconHover from '../../../assets/images/icons/TranslateIconHover.png';
import { useTranslation } from '../../../contexts/LanguageContext';
import SpainFlag from '../../../assets/images/icons/SpainFlag.svg';
import FranceFlag from '../../../assets/images/icons/FranceFlag.svg';

const Header = () => {
  const navigate = useNavigate();
  const { t, currentLanguage, changeLanguage } = useTranslation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [isLogoutHovered, setIsLogoutHovered] = useState(false);
  const [isTranslateHovered, setIsTranslateHovered] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null);
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const dropdownRef = useRef(null);

  const languages = [
    { code: 'en', name: t('languages.english'), icon: UsFlag },
    { code: 'pt', name: t('languages.portuguese'), icon: BrazilFlag },
    { code: 'nl', name: t('languages.dutch'), icon: NlFlag },
    { code: 'es', name: t('languages.spanish'), icon: SpainFlag },
    { code: 'fr', name: t('languages.french'), icon: FranceFlag }
  ];

  const userName = localStorage.getItem('userName') || 'User';
  const userFirstLetter = userName.charAt(0);

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    setIsDropdownOpen(false);
    navigate('/login');
  };

  const handleLanguageSelect = (language) => {
    changeLanguage(language);
    setIsLanguageDropdownOpen(false);
    setIsDropdownOpen(false);
  };

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      setSyncMessage(null);
      
      const response = await fetch('/api/sync/salesforce', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Sync failed');
      }

      const data = await response.json();
      console.log('Sync response:', data);
      
      // Calculate total changes from stats
      let totalAdded = 0;
      let totalUpdated = 0;
      
      if (data.stats) {
        Object.values(data.stats).forEach(category => {
          if (category.inserted) totalAdded += category.inserted;
          if (category.updated) totalUpdated += category.updated;
        });
      }
      
      console.log('Total Added:', totalAdded, 'Total Updated:', totalUpdated);
      
      let message = 'Sync completed successfully.';
      if (totalAdded > 0 || totalUpdated > 0) {
        const parts = [];
        if (totalAdded > 0) {
          parts.push(`${totalAdded} record${totalAdded === 1 ? '' : 's'} added`);
        }
        if (totalUpdated > 0) {
          parts.push(`${totalUpdated} record${totalUpdated === 1 ? '' : 's'} updated`);
        }
        message += ` ${parts.join(' and ')}.`;
      } else {
        message += ' No records were added or updated.';
      }
      
      setSyncMessage({
        type: 'success',
        text: message
      });

      // Dispatch a custom event to notify other components to refresh their data
      const refreshEvent = new CustomEvent('dataSyncComplete', { detail: data });
      window.dispatchEvent(refreshEvent);
    } catch (error) {
      console.error('Sync error:', error);
      setSyncMessage({
        type: 'error',
        text: error.message || 'Failed to sync with Salesforce'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
        setIsLanguageDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-hide sync message after 3 seconds
  useEffect(() => {
    if (syncMessage) {
      const timer = setTimeout(() => {
        setSyncMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [syncMessage]);

  return (
    <header className="header">
      <div className="header-brand">
        <Link to="/">
          <img src={InteliLogo} alt="Inteli" className="inteli-logo" />
        </Link>
      </div>
      <nav className="header-nav">
        <ul>
          <li>
            <Link to="/">{t('navigation.home')}</Link>
          </li>
          <li>
            <Link to="/prospection">{t('navigation.prospection')}</Link>
          </li>
          <li>
            <Link to="/history">{t('navigation.history')}</Link>
          </li>
        </ul>
      </nav>
      {isLoggedIn && (
        <button 
          className={`sync-button ${isSyncing ? 'syncing' : ''}`}
          onClick={handleSync}
          title="Sync with Salesforce"
        >
          <svg 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              d="M23 4v6h-6M1 20v-6h6" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
            <path 
              d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
      {isLoggedIn && (
        <div 
          className="profile-container" 
          ref={dropdownRef}
        >
          <div className="profile-elements">
            <div 
              className="profile-circle"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span>{userFirstLetter}</span>
            </div>
            <div 
              className="profile-text"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span className="user-name">{userName}</span>
              <span className="dropdown-arrow">▼</span>
            </div>
          </div>
          {isDropdownOpen && (
            <div className="profile-dropdown">
              <button
                onMouseEnter={() => {
                  setIsLanguageDropdownOpen(true);
                  setIsTranslateHovered(true);
                }}
                onMouseLeave={() => {
                  setIsLanguageDropdownOpen(false);
                  setIsTranslateHovered(false);
                }}
              >
                <img
                  src={isTranslateHovered ? TranslateIconHover : TranslateIcon}
                  alt=""
                  className="translate-icon"
                />
                <span>{t('common.language')}</span>
                <img
                  src={languages.find(lang => lang.code === currentLanguage)?.icon}
                  alt=""
                  className="translate-icon-right"
                />
                {isLanguageDropdownOpen && (
                  <div className="language-dropdown-header">
                    {languages.map(({ code, name, icon }) => (
                      <button
                        key={code}
                        onClick={() => handleLanguageSelect(code)}
                      >
                        <img src={icon} alt="" className="flag-icon" />
                        <span>{name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </button>
              <button
                onMouseEnter={() => setIsLogoutHovered(true)}
                onMouseLeave={() => setIsLogoutHovered(false)}
                onClick={handleLogout}
              >
                <img
                  src={isLogoutHovered ? LogoutIconHover : LogoutIcon}
                  alt={t('navigation.logout')}
                />
                <span>{t('navigation.logout')}</span>
              </button>
            </div>
          )}
          {syncMessage && (
            <div className={`sync-message ${syncMessage.type}`}>
              {syncMessage.text}
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Header; 