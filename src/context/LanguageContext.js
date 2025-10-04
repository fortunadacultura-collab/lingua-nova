import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('pt');
  const [nativeLanguage, setNativeLanguage] = useState('pt');
  const [translations, setTranslations] = useState({});
  const [appData, setAppData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load translations and app data from JSON files like the original model
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load main data.json file
        const dataResponse = await fetch('/data/data.json');
        const dataJson = await dataResponse.json();
        
        // Load translations separately
        const translationsResponse = await fetch('/data/translations.json');
        const translationsJson = await translationsResponse.json();
        
        // Load language configuration
        const configResponse = await fetch('/data/language-config.json');
        const configJson = await configResponse.json();
        
        // Process languages from both sources
        const processedLanguages = configJson.languages.map(lang => ({
          code: lang.code,
          flag: lang.flag,
          name: lang.name,
          shortName: lang.code.toUpperCase(),
          nativeName: lang.name,
          level: lang.level,
          progress: lang.progress
        }));
        
        // Set app data with processed languages
        const processedAppData = {
          ...dataJson,
          languages: processedLanguages
        };
        
        setAppData(processedAppData);
        setTranslations(translationsJson || {});
        
        // Load saved language preferences
        const savedLanguage = localStorage.getItem('selectedLanguage') || 'en';
        const savedNativeLanguage = localStorage.getItem('nativeLanguage') || 'pt';
        
        setLanguage(savedLanguage);
        setNativeLanguage(savedNativeLanguage);
        
        console.log('✅ Dados carregados dos arquivos JSON:', {
          languages: processedLanguages.length,
          translations: Object.keys(translationsJson || {}).length,
          savedLanguage,
          savedNativeLanguage
        });
        
      } catch (error) {
        console.error('❌ Erro ao carregar dados dos arquivos JSON:', error);
        
        // Fallback to mock data if JSON files fail to load
        const fallbackAppData = {
          languages: [
            { code: 'pt', flag: 'br', name: 'Português', shortName: 'PT', nativeName: 'Português' },
            { code: 'en', flag: 'us', name: 'English', shortName: 'EN', nativeName: 'English' },
            { code: 'es', flag: 'es', name: 'Español', shortName: 'ES', nativeName: 'Español' },
            { code: 'fr', flag: 'fr', name: 'Français', shortName: 'FR', nativeName: 'Français' }
          ]
        };
        
        const fallbackTranslations = {
          pt: {
            navHome: 'Home',
            navDialogues: 'Diálogos',
            navStories: 'Histórias',
            learningLabel: 'Aprendendo:',
            userLanguageLabel: 'Meu idioma:'
          },
          en: {
            navHome: 'Home',
            navDialogues: 'Dialogues',
            navStories: 'Stories',
            learningLabel: 'Learning:',
            userLanguageLabel: 'My language:'
          }
        };
        
        setAppData(fallbackAppData);
        setTranslations(fallbackTranslations);
        
        // Load saved language preferences
        const savedLanguage = localStorage.getItem('selectedLanguage') || 'en';
        const savedNativeLanguage = localStorage.getItem('nativeLanguage') || 'pt';
        
        setLanguage(savedLanguage);
        setNativeLanguage(savedNativeLanguage);
      }
      
      setLoading(false);
    };

    loadData();
  }, []);

  const changeLanguage = (newLanguage) => {
    // Se o novo idioma de aprendizado for igual ao idioma nativo,
    // trocar o idioma nativo para o idioma de aprendizado anterior
    if (newLanguage === nativeLanguage) {
      setNativeLanguage(language);
      localStorage.setItem('nativeLanguage', language);
    }
    setLanguage(newLanguage);
    localStorage.setItem('selectedLanguage', newLanguage);
  };

  const changeNativeLanguage = (newNativeLanguage) => {
    // Se o novo idioma nativo for igual ao idioma de aprendizado,
    // trocar o idioma de aprendizado para o idioma nativo anterior
    if (newNativeLanguage === language) {
      setLanguage(nativeLanguage);
      localStorage.setItem('selectedLanguage', nativeLanguage);
    }
    setNativeLanguage(newNativeLanguage);
    localStorage.setItem('nativeLanguage', newNativeLanguage);
  };

  // Translation function - works like the original model
  const t = (key, fallback = key, targetLang = null) => {
    const lang = targetLang || nativeLanguage;
    
    // Check if we have translations for this language
    if (translations[lang] && translations[lang][key]) {
      return translations[lang][key];
    }
    
    // Fallback to Portuguese if available
    if (lang !== 'pt' && translations['pt'] && translations['pt'][key]) {
      return translations['pt'][key];
    }
    
    // Fallback to English if available
    if (lang !== 'en' && translations['en'] && translations['en'][key]) {
      return translations['en'][key];
    }
    
    // Return the fallback or key itself
    return fallback;
  };
  
  // Get translation for specific language (like the original getTranslation)
  const getTranslation = (key, langCode = nativeLanguage) => {
    return t(key, key, langCode);
  };

  const value = {
    language,
    nativeLanguage,
    translations,
    appData,
    loading,
    changeLanguage,
    changeNativeLanguage,
    t,
    getTranslation
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};