import React, { useState, useRef, useEffect } from 'react';
import './Login.css';
import InteliLogo from '../../../assets/images/logos/InteliLogo.png';
import GoogleIcon from '../../../assets/images/logos/GoogleLogo.svg';
import EyeIcon from '../../../assets/images/icons/EyeIcon.svg';
import TranslateIcon from '../../../assets/images/icons/TranslateIcon.png';
import TranslateIconHover from '../../../assets/images/icons/TranslateIconHover.png';
import BrazilFlag from '../../../assets/images/icons/BrazilFlag.svg';
import UsFlag from '../../../assets/images/icons/UsFlag.svg';
import NlFlag from '../../../assets/images/icons/NlFlag.svg';
import SpainFlag from '../../../assets/images/icons/SpainFlag.svg';
import FranceFlag from '../../../assets/images/icons/FranceFlag.svg';
import { useTranslation } from '../../../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const { t, language, changeLanguage } = useTranslation();
  const [showPasswordLogin, setShowPasswordLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const languageDropdownRef = useRef(null);
  const navigate = useNavigate();
  const [isTranslateHovered, setIsTranslateHovered] = useState(false);

  const languages = [
    { code: 'pt', name: 'Português', icon: BrazilFlag },
    { code: 'en', name: 'English', icon: UsFlag },
    { code: 'nl', name: 'Nederlands', icon: NlFlag },
    { code: 'es', name: 'Español', icon: SpainFlag },
    { code: 'fr', name: 'Français', icon: FranceFlag }
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target)) {
        setIsLanguageOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const colors = ['rgb(232, 74, 74)', 'rgb(46, 38, 64)'];
    const decorationElements = document.querySelectorAll([
      '.circle-decoration-1', '.circle-decoration-2',
      '.triangle-decoration-1', '.triangle-decoration-2',
      '.square-decoration-1', '.square-decoration-2'
    ].join(','));

    decorationElements.forEach(element => {
      // Set random colors for both ::before and ::after
      const randomColorBefore = colors[Math.floor(Math.random() * colors.length)];
      const randomColorAfter = colors[Math.floor(Math.random() * colors.length)];
      
      // Randomly decide fill style for before and after elements
      const isFilledBefore = Math.random() < 0.5;
      const isFilledAfter = Math.random() < 0.5;
      
      element.style.setProperty('--before-color', randomColorBefore);
      element.style.setProperty('--after-color', randomColorAfter);
      element.style.setProperty('--before-fill', isFilledBefore ? randomColorBefore : 'transparent');
      element.style.setProperty('--after-fill', isFilledAfter ? randomColorAfter : 'transparent');
      element.style.setProperty('--before-border-width', isFilledBefore ? '0' : '4px');
      element.style.setProperty('--after-border-width', isFilledAfter ? '0' : '4px');
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password
        }),
        credentials: 'include'
      });

      if (response.ok) {
        localStorage.setItem('isLoggedIn', true);
        navigate('/');
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('An error occurred during login. Please try again.');
    }
  };

  const handleGoogleSignIn = () => {
    console.log('Google sign in clicked');
  };

  return (
    <div className="login-container">
      <div className="circle-decoration-1"></div>
      <div className="circle-decoration-2"></div>
      <div className="triangle-decoration-1"></div>
      <div className="triangle-decoration-2"></div>
      <div className="square-decoration-1"></div>
      <div className="square-decoration-2"></div>
      <div className="login-box">
        <div className="language-selector" ref={languageDropdownRef}>
          <img 
            src={isTranslateHovered ? TranslateIconHover : TranslateIcon}
            className="translate-icon" 
            onClick={() => setIsLanguageOpen(!isLanguageOpen)}
            onMouseEnter={() => setIsTranslateHovered(true)}
            onMouseLeave={() => setIsTranslateHovered(false)}
            alt=""
          />
          {isLanguageOpen && (
            <div className="language-dropdown">
              {languages.map(({ code, name, icon }) => (
                <button
                  key={code}
                  className={`language-option ${language === code ? 'active' : ''}`}
                  onClick={() => {
                    changeLanguage(code);
                    setIsLanguageOpen(false);
                  }}
                >
                  <img src={icon} alt="" className="flag-icon" />
                  <span>{name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="login-logo">
          <img src={InteliLogo} alt="Inteli" />
        </div>
        <h2>{t('auth.login.title')}</h2>
        
        {!showPasswordLogin ? (
          <>
            <button className="google-sign-in" onClick={handleGoogleSignIn}>
              <img src={GoogleIcon} alt="" className="google-icon" />
              {t('auth.login.googleButton')}
            </button>
            <div className="login-divider">
              <span>{t('auth.login.or')}</span>
            </div>
            <button 
              className="password-login-button"
              onClick={() => setShowPasswordLogin(true)}
            >
              {t('auth.login.continueWithPassword')}
            </button>
          </>
        ) : (
          <>
            <form onSubmit={handleSubmit}>
              <div className="input-field">
                <label>{t('common.labels.email')} {t('common.labels.required')}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="input-field">
                <label>{t('common.labels.password')} {t('common.labels.required')}</label>
                <div className="password-input-container">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <img 
                    src={EyeIcon} 
                    alt="Toggle password visibility"
                    className="eye-icon"
                    onClick={() => setShowPassword(!showPassword)}
                  />
                </div>
              </div>
              <button type="submit" className="submit-button">
                {t('auth.login.loginButton')}
              </button>
            </form>
            <div className="login-divider">
              <span>{t('auth.login.or')}</span>
            </div>
            <button className="google-sign-in" onClick={handleGoogleSignIn}>
              <img src={GoogleIcon} alt="" className="google-icon" />
              {t('auth.login.googleButton')}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Login; 