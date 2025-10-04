import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import LanguageSelector from '../UI/LanguageSelector';
import { useFlagImage } from '../../hooks/useImageAsset';
import './LanguageAnalysis.css';

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

const LanguageAnalysis = () => {
  const { language, nativeLanguage, appData } = useLanguage();
  const [flagLoadStatus, setFlagLoadStatus] = useState({});
  const [analysisData, setAnalysisData] = useState({
    totalFlags: 0,
    loadedFlags: 0,
    failedFlags: 0,
    duplicateFlags: [],
    exclusivePairs: []
  });

  // Função para testar carregamento de bandeiras
  const testFlagLoading = async () => {
    if (!appData?.languages) return;
    
    const status = {};
    const flagCounts = {};
    
    for (const lang of appData.languages) {
      // Contar duplicatas
      flagCounts[lang.flag] = (flagCounts[lang.flag] || 0) + 1;
      
      try {
        // Tentar importar a bandeira dinamicamente
        await import(`../../assets/images/flags/${lang.flag}.svg`);
        status[lang.code] = {
          loaded: true,
          status: 200,
          flag: lang.flag,
          url: `src/assets/images/flags/${lang.flag}.svg`
        };
      } catch (error) {
        status[lang.code] = {
          loaded: false,
          error: error.message,
          flag: lang.flag,
          url: flagUrl
        };
      }
    }
    
    // Identificar duplicatas
    const duplicates = Object.entries(flagCounts)
      .filter(([flag, count]) => count > 1)
      .map(([flag, count]) => ({ flag, count }));
    
    // Calcular estatísticas
    const loaded = Object.values(status).filter(s => s.loaded).length;
    const failed = Object.values(status).filter(s => !s.loaded).length;
    
    setFlagLoadStatus(status);
    setAnalysisData({
      totalFlags: appData.languages.length,
      loadedFlags: loaded,
      failedFlags: failed,
      duplicateFlags: duplicates,
      exclusivePairs: findExclusivePairs()
    });
  };

  // Função para identificar pares exclusivos
  const findExclusivePairs = () => {
    const pairs = [];
    
    // Verificar se idioma de aprendizado é diferente do nativo
    if (language !== nativeLanguage) {
      const learningLang = appData?.languages?.find(l => l.code === language);
      const nativeLang = appData?.languages?.find(l => l.code === nativeLanguage);
      
      if (learningLang && nativeLang) {
        pairs.push({
          type: 'current_selection',
          learning: learningLang,
          native: nativeLang,
          isExclusive: true
        });
      }
    }
    
    return pairs;
  };

  // Função para simular conflito de bandeiras
  const simulateConflict = () => {
    // Encontrar idiomas que usam a mesma bandeira
    const flagGroups = {};
    appData?.languages?.forEach(lang => {
      if (!flagGroups[lang.flag]) {
        flagGroups[lang.flag] = [];
      }
      flagGroups[lang.flag].push(lang);
    });
    
    return Object.entries(flagGroups)
      .filter(([flag, langs]) => langs.length > 1)
      .map(([flag, langs]) => ({ flag, languages: langs }));
  };

  useEffect(() => {
    testFlagLoading();
  }, [appData]);

  const conflicts = simulateConflict();

  return (
    <div className="language-analysis-container">
      <div className="analysis-header">
        <h2>🔍 Análise Detalhada dos Seletores de Idioma</h2>
        <p>Análise completa da lógica de carregamento de bandeiras e exclusão mútua</p>
      </div>

      <div className="analysis-grid">
        {/* Seção de Seletores Atuais */}
        <div className="analysis-section">
          <h3>🎯 Seletores Atuais</h3>
          <div className="selectors-comparison">
            <div className="selector-item">
              <h4>📚 Aprendendo</h4>
              <LanguageSelector type="learning" />
              <div className="selector-info">
                <strong>Idioma:</strong> {language}<br/>
                <strong>Tipo:</strong> Sem texto, apenas bandeira<br/>
                <strong>Comportamento:</strong> Dropdown com nomes nativos
              </div>
            </div>
            
            <div className="selector-item">
              <h4>🏠 Interface</h4>
              <LanguageSelector type="interface" />
              <div className="selector-info">
                <strong>Idioma:</strong> {nativeLanguage}<br/>
                <strong>Tipo:</strong> Bandeira + código (ex: EN)<br/>
                <strong>Comportamento:</strong> Dropdown com nomes em inglês
              </div>
            </div>
          </div>
        </div>

        {/* Seção de Estatísticas de Carregamento */}
        <div className="analysis-section">
          <h3>📊 Status de Carregamento das Bandeiras</h3>
          <div className="stats-grid">
            <div className="stat-card success">
              <div className="stat-number">{analysisData.loadedFlags}</div>
              <div className="stat-label">Bandeiras Carregadas</div>
            </div>
            <div className="stat-card error">
              <div className="stat-number">{analysisData.failedFlags}</div>
              <div className="stat-label">Falhas no Carregamento</div>
            </div>
            <div className="stat-card warning">
              <div className="stat-number">{analysisData.duplicateFlags.length}</div>
              <div className="stat-label">Bandeiras Duplicadas</div>
            </div>
            <div className="stat-card info">
              <div className="stat-number">{analysisData.totalFlags}</div>
              <div className="stat-label">Total de Idiomas</div>
            </div>
          </div>
        </div>

        {/* Seção de Conflitos de Bandeiras */}
        {conflicts.length > 0 && (
          <div className="analysis-section">
            <h3>⚠️ Conflitos de Bandeiras Detectados</h3>
            <div className="conflicts-list">
              {conflicts.map((conflict) => (
                <div key={conflict.flag} className="conflict-item">
                  <div className="conflict-flag">
                    <FlagImage 
                      flagCode={conflict.flag}
                      alt={conflict.flag}
                    />
                    <span>{conflict.flag}.svg</span>
                  </div>
                  <div className="conflict-languages">
                    <strong>Usado por:</strong>
                    {conflict.languages.map(lang => (
                      <span key={lang.code} className="lang-tag">
                        {lang.nativeName} ({lang.code})
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Seção de Exclusão Mútua */}
        <div className="analysis-section">
          <h3>🔄 Análise de Exclusão Mútua</h3>
          <div className="exclusion-analysis">
            <div className="exclusion-item">
              <h4>✅ Implementação Atual</h4>
              <ul>
                <li><strong>Estados Separados:</strong> `language` vs `nativeLanguage`</li>
                <li><strong>Contexto Isolado:</strong> Cada selector gerencia seu próprio estado</li>
                <li><strong>Prevenção Natural:</strong> Impossível selecionar o mesmo idioma em ambos</li>
                <li><strong>Persistência:</strong> Estados salvos no localStorage separadamente</li>
              </ul>
            </div>
            
            <div className="exclusion-item">
              <h4>🎯 Comportamento Observado</h4>
              <div className="behavior-test">
                <p><strong>Teste de Exclusão:</strong></p>
                <div className="test-result">
                  {language === nativeLanguage ? (
                    <span className="warning">⚠️ Mesmo idioma selecionado em ambos</span>
                  ) : (
                    <span className="success">✅ Idiomas diferentes selecionados</span>
                  )}
                </div>
                <p>
                  <strong>Aprendendo:</strong> {language} | 
                  <strong>Interface:</strong> {nativeLanguage}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Seção de Detalhes Técnicos */}
        <div className="analysis-section">
          <h3>⚙️ Detalhes Técnicos da Implementação</h3>
          <div className="technical-details">
            <div className="detail-card">
              <h4>🖼️ Carregamento de Bandeiras</h4>
              <ul>
                <li><strong>Caminho:</strong> `src/assets/images/flags/[flag].svg`</li>
                <li><strong>Lazy Loading:</strong> Implementado com `loading="lazy"`</li>
                <li><strong>Fallback:</strong> Alt text com nome do idioma</li>
                <li><strong>Cache:</strong> Navegador gerencia automaticamente</li>
              </ul>
            </div>
            
            <div className="detail-card">
              <h4>🔄 Lógica de Estado</h4>
              <ul>
                <li><strong>Context API:</strong> LanguageContext gerencia estados globais</li>
                <li><strong>useMemo:</strong> Otimização para dados do idioma atual</li>
                <li><strong>useEffect:</strong> Cleanup de event listeners</li>
                <li><strong>localStorage:</strong> Persistência automática</li>
              </ul>
            </div>
            
            <div className="detail-card">
              <h4>🎨 Diferenças Visuais</h4>
              <ul>
                <li><strong>Tipo "learning":</strong> Apenas bandeira no botão</li>
                <li><strong>Tipo "interface":</strong> Bandeira + código do idioma</li>
                <li><strong>Dropdown "learning":</strong> Nomes nativos dos idiomas</li>
                <li><strong>Dropdown "interface":</strong> Nomes em inglês</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Seção de Status Detalhado */}
        <div className="analysis-section">
          <h3>📋 Status Detalhado por Idioma</h3>
          <div className="detailed-status">
            {Object.entries(flagLoadStatus).map(([code, status]) => {
              const lang = appData?.languages?.find(l => l.code === code);
              return (
                <div key={code} className={`status-item ${status.loaded ? 'loaded' : 'failed'}`}>
                  <div className="status-flag">
                    {status.loaded ? (
                      <img 
                        src={status.url} 
                        alt={lang?.name}
                        className="flag-mini"
                      />
                    ) : (
                      <div className="flag-error">❌</div>
                    )}
                  </div>
                  <div className="status-info">
                    <strong>{lang?.nativeName || code}</strong>
                    <div className="status-details">
                      <span className="code">{code.toUpperCase()}</span>
                      <span className="flag-file">{status.flag}.svg</span>
                      <span className={`status-badge ${status.loaded ? 'success' : 'error'}`}>
                        {status.loaded ? '✅ OK' : '❌ Falha'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LanguageAnalysis;