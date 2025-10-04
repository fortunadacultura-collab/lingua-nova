import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import LanguageSelector from '../UI/LanguageSelector';
import { useFlagImage } from '../../hooks/useImageAsset';
import './LanguageSelectorDemo.css';

// Componente para renderizar bandeiras com loading
const FlagImage = ({ flagCode, alt, className = "flag-preview" }) => {
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

const LanguageSelectorDemo = () => {
  const { language, nativeLanguage, appData } = useLanguage();

  const getCurrentLanguageInfo = (langCode) => {
    return appData?.languages?.find(lang => lang.code === langCode) || 
           { code: langCode, name: 'Unknown', nativeName: 'Unknown' };
  };

  const learningLang = getCurrentLanguageInfo(language);
  const nativeLang = getCurrentLanguageInfo(nativeLanguage);

  return (
    <div className="language-demo-container">
      <div className="demo-header">
        <h2>🌍 Seletores de Idioma - Demonstração</h2>
        <p>Teste os seletores "Aprendendo" e "Meu Idioma" com a lista expandida de idiomas</p>
      </div>

      <div className="demo-content">
        <div className="selector-demo-section">
          <div className="demo-item">
            <h3>📚 Idioma que estou Aprendendo</h3>
            <div className="selector-wrapper">
              <LanguageSelector type="learning" />
            </div>
            <div className="current-selection">
              <strong>Selecionado:</strong> {learningLang.nativeName} ({learningLang.name})
            </div>
          </div>

          <div className="demo-item">
            <h3>🏠 Meu Idioma (Interface)</h3>
            <div className="selector-wrapper">
              <LanguageSelector type="interface" />
            </div>
            <div className="current-selection">
              <strong>Selecionado:</strong> {nativeLang.nativeName} ({nativeLang.name})
            </div>
          </div>
        </div>

        <div className="features-section">
          <h3>✨ Funcionalidades Implementadas</h3>
          <div className="features-grid">
            <div className="feature-card">
              <h4>🎯 Acessibilidade</h4>
              <ul>
                <li>Navegação por teclado (Tab, Enter, Escape)</li>
                <li>ARIA labels e roles</li>
                <li>Focus visível</li>
                <li>Screen reader friendly</li>
              </ul>
            </div>
            
            <div className="feature-card">
              <h4>🎨 Design Moderno</h4>
              <ul>
                <li>Animações suaves com cubic-bezier</li>
                <li>Hover effects e transições</li>
                <li>Scrollbar customizada</li>
                <li>Backdrop blur effect</li>
              </ul>
            </div>
            
            <div className="feature-card">
              <h4>🌐 Lista Expandida</h4>
              <ul>
                <li>20 idiomas disponíveis</li>
                <li>Nomes nativos dos idiomas</li>
                <li>Bandeiras SVG otimizadas</li>
                <li>Lazy loading das imagens</li>
              </ul>
            </div>
            
            <div className="feature-card">
              <h4>⚡ Performance</h4>
              <ul>
                <li>useMemo para otimização</li>
                <li>Event listeners otimizados</li>
                <li>Componentes memoizados</li>
                <li>Carregamento eficiente</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="languages-overview">
          <h3>🗺️ Idiomas Disponíveis ({appData?.languages?.length || 0})</h3>
          <div className="languages-grid">
            {appData?.languages?.map((lang) => (
              <div key={lang.code} className="language-card">
                <FlagImage 
                  flagCode={lang.flag}
                  alt={lang.name}
                />
                <div className="lang-info">
                  <div className="lang-native">{lang.nativeName}</div>
                  <div className="lang-english">{lang.name}</div>
                  <div className="lang-code">{lang.code.toUpperCase()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LanguageSelectorDemo;