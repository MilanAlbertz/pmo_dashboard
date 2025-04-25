import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Header.css';
import ProfileIcon from '../../../assets/images/icons/ProfileIcon.png';
import ProfileIconHover from '../../../assets/images/icons/ProfileIconHover.png';
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
  const [isProfileHovered, setIsProfileHovered] = useState(false);
  const [isLogoutHovered, setIsLogoutHovered] = useState(false);
  const [isTranslateHovered, setIsTranslateHovered] = useState(false);
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

  const handleProfileClick = () => {
    setIsDropdownOpen(false);
    navigate('/profile');
  };

  const handleLanguageSelect = (language) => {
    changeLanguage(language);
    setIsLanguageDropdownOpen(false);
    setIsDropdownOpen(false);
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
                onMouseEnter={() => setIsProfileHovered(true)}
                onMouseLeave={() => setIsProfileHovered(false)}
                onClick={handleProfileClick}
              >
                <img
                  src={isProfileHovered ? ProfileIconHover : ProfileIcon}
                  alt={t('navigation.profile')}
                  className="translate-icon"
                />
                <span>{t('navigation.profile')}</span>
              </button>
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
        </div>
      )}
    </header>
  );
};

export default Header; 