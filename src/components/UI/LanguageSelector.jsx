import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useFlagImage } from '../../hooks/useImageAsset';
import '../../styles/language-selector.css';

// Componente para renderizar bandeiras com loading
const FlagImage = ({ flagCode, alt, className = "flag-icon" }) => {
  const { imageUrl, isLoading } = useFlagImage(flagCode);
  
  if (isLoading) {
    return <div className="flag-loading">🏳️</div>;
  }
  
  return (
    <img 
       src={imageUrl} 
       alt={alt}
       className={className}
       loading="lazy"
     />
  );
};

const LanguageSelector = ({ type = 'learning' }) => {
  const { language, nativeLanguage, changeLanguage, changeNativeLanguage, appData } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentLanguage = type === 'learning' ? language : nativeLanguage;
  const handleLanguageChange = type === 'learning' ? changeLanguage : changeNativeLanguage;

  // Memoize current language data for better performance
  const currentLangData = useMemo(() => {
    return appData?.languages?.find(lang => lang.code === currentLanguage) || 
           { code: currentLanguage, flag: currentLanguage, name: currentLanguage.toUpperCase(), shortName: currentLanguage.toUpperCase(), nativeName: currentLanguage.toUpperCase() };
  }, [appData?.languages, currentLanguage]);



  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!isOpen) return;
      
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const selectLanguage = (langCode) => {
    handleLanguageChange(langCode);
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    setIsOpen(prev => !prev);
  };

  if (!appData?.languages) {
    return <div className="language-selector-loading">Carregando idiomas...</div>;
  }

  return (
    <div className="language-selector-wrapper" ref={dropdownRef}>
      <div className={`language-selector ${isOpen ? 'active' : ''}`}>
        <div 
          className="selected-language"
          onClick={toggleDropdown}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && toggleDropdown()}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <FlagImage 
            flagCode={currentLangData.flag}
            alt={currentLangData.name}
          />
        </div>
        
        <ul 
          className={`language-options ${isOpen ? 'show' : ''}`}
          role="listbox"
          aria-label="Selecionar idioma"
        >
          {appData.languages.map((lang) => {
            // Implementar exclusão mútua como no modelo original
            const otherLanguage = type === 'interface' ? language : nativeLanguage;
            const shouldHide = lang.code === otherLanguage;
            
            return (
              <li 
                key={lang.code}
                role="option"
                aria-selected={currentLanguage === lang.code}
                className={currentLanguage === lang.code ? 'selected' : ''}
                onClick={() => selectLanguage(lang.code)}
                onKeyDown={(e) => e.key === 'Enter' && selectLanguage(lang.code)}
                tabIndex={0}
                style={{ display: shouldHide ? 'none' : 'flex' }}
              >
                <FlagImage 
                  flagCode={lang.flag}
                  alt={lang.name}
                />


              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default LanguageSelector;