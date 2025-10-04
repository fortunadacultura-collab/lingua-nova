import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import Navbar from '../components/Layout/Navbar';
import Footer from '../components/Layout/Footer';

const LanguageTest = () => {
  const { t, language, nativeLanguage, changeLanguage, changeNativeLanguage, appData } = useLanguage();

  return (
    <div className="app">
      <Navbar />
      
      <main className="main-content">
        <div className="container">
          <section className="test-section">
            <h1 data-translate="testTitle">Teste do Sistema de Idiomas</h1>
            <p data-translate="testDescription">Esta página testa o sistema de tradução e seleção de idiomas.</p>
            
            <div className="language-status">
              <h2 data-translate="currentStatus">Status Atual</h2>
              <div className="status-grid">
                <div className="status-item">
                  <strong data-translate="learningLanguage">Idioma de Aprendizado:</strong>
                  <span>{language}</span>
                </div>
                <div className="status-item">
                  <strong data-translate="interfaceLanguage">Idioma da Interface:</strong>
                  <span>{nativeLanguage}</span>
                </div>
              </div>
            </div>
            
            <div className="translation-test">
              <h2 data-translate="translationTest">Teste de Traduções</h2>
              <div className="test-items">
                <p data-translate="heroTitle">{t('heroTitle', 'Título padrão')}</p>
                <p data-translate="heroSubtitle">{t('heroSubtitle', 'Subtítulo padrão')}</p>
                <p data-translate="getStarted">{t('getStarted', 'Começar padrão')}</p>
                <p data-translate="learnMore">{t('learnMore', 'Saiba mais padrão')}</p>
              </div>
            </div>
            
            <div className="data-info">
              <h2 data-translate="dataInfo">Informações dos Dados</h2>
              <div className="info-grid">
                <div className="info-item">
                  <strong data-translate="availableLanguages">Idiomas Disponíveis:</strong>
                  <span>{appData?.languages?.length || 0}</span>
                </div>
                <div className="info-item">
                  <strong data-translate="availableTranslations">Traduções Disponíveis:</strong>
                  <span>{Object.keys(appData?.translations || {}).join(', ')}</span>
                </div>
              </div>
            </div>
            
            <div className="manual-controls">
              <h2 data-translate="manualControls">Controles Manuais</h2>
              <div className="controls-grid">
                <div className="control-group">
                  <h3 data-translate="changeLearningLang">Mudar Idioma de Aprendizado</h3>
                  <div className="button-group">
                    <button onClick={() => changeLanguage('en')} className="btn btn-small">English</button>
                    <button onClick={() => changeLanguage('es')} className="btn btn-small">Español</button>
                    <button onClick={() => changeLanguage('pt')} className="btn btn-small">Português</button>
                    <button onClick={() => changeLanguage('fr')} className="btn btn-small">Français</button>
                  </div>
                </div>
                
                <div className="control-group">
                  <h3 data-translate="changeInterfaceLang">Mudar Idioma da Interface</h3>
                  <div className="button-group">
                    <button onClick={() => changeNativeLanguage('en')} className="btn btn-small">English</button>
                    <button onClick={() => changeNativeLanguage('es')} className="btn btn-small">Español</button>
                    <button onClick={() => changeNativeLanguage('pt')} className="btn btn-small">Português</button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
      
      <Footer />
      
      <style>{`
        .test-section {
          padding: 2rem 0;
        }
        
        .language-status, .translation-test, .data-info, .manual-controls {
          margin: 2rem 0;
          padding: 1.5rem;
          border: 1px solid #ddd;
          border-radius: 8px;
          background: #f9f9f9;
        }
        
        .status-grid, .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
          margin-top: 1rem;
        }
        
        .status-item, .info-item {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem;
          background: white;
          border-radius: 4px;
        }
        
        .test-items {
          margin-top: 1rem;
        }
        
        .test-items p {
          padding: 0.5rem;
          margin: 0.5rem 0;
          background: white;
          border-left: 4px solid #007bff;
        }
        
        .controls-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
          margin-top: 1rem;
        }
        
        .control-group {
          padding: 1rem;
          background: white;
          border-radius: 4px;
        }
        
        .button-group {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 1rem;
        }
        
        .btn-small {
          padding: 0.5rem 1rem;
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
};

export default LanguageTest;