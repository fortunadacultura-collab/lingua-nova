import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import '../styles/globals.css';
import '../styles/study.css';
import '../styles/ui.css';

const MyDecks = () => {
  const { t, nativeLanguage } = useLanguage();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [decks, setDecks] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);
  const [normalizingDeckId, setNormalizingDeckId] = useState(null);
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('ln_view_mode') || 'cards');

  // Correção defensiva de mojibake no cliente (quando strings vêm com má decodificação)
  const fixMojibakeClient = (input) => {
    if (input == null) return '';
    const str = String(input);
    if (!/Ã|Â|Ì|�/.test(str)) return str;
    try {
      const decoder = new TextDecoder('utf-8');
      const bytes = new Uint8Array(Array.from(str).map(ch => ch.charCodeAt(0) & 0xFF));
      const decoded = decoder.decode(bytes);
      return decoded.normalize('NFC');
    } catch {
      return str;
    }
  };

  // Remover sufixos de idioma do título exibido (ex.: "(en → pt)")
  const formatDeckName = (name) => {
    if (!name) return '';
    const stripped = fixMojibakeClient(name.replace(/\s*\([^)]*\)\s*$/, ''));
    // Inserir pontos de quebra suaves para evitar estouro de largura em nomes longos
    return stripped
      .replace(/_/g, '_\u200b')
      .replace(/-/g, '-\u200b')
      .replace(/\//g, '/\u200b')
      .replace(/\(/g, '(\u200b')
      .replace(/\)/g, '\u200b)');
  };

  useEffect(() => {
    const token = localStorage.getItem('linguanova_token');
    if (!isAuthenticated || !token) return;
    const fetchDecks = async () => {
      try {
        setLoading(true);
        const resp = await fetch('http://localhost:5001/api/flashcards/decks', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Target-Lang': nativeLanguage || ''
          }
        });
        const data = await resp.json();
        if (!resp.ok) {
          setError(data?.error || 'Falha ao carregar decks');
          return;
        }
        const list = Array.isArray(data.decks) ? data.decks : [];
        setDecks(list);
        // Buscar stats por deck (New/Learn/Review)
        const statsEntries = await Promise.all(list.map(async (d) => {
          const sResp = await fetch(`http://localhost:5001/api/flashcards/decks/${d.id}/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!sResp.ok) return [d.id, { total: 0, New: 0, Learn: 0, Review: 0 }];
          const sData = await sResp.json();
          return [d.id, sData];
        }));
        setStats(Object.fromEntries(statsEntries));
      } catch (e) {
        console.error('Erro ao carregar decks:', e);
        setError('Falha ao carregar decks');
      } finally {
        setLoading(false);
      }
    };
    fetchDecks();
  }, [isAuthenticated, nativeLanguage]);

  // Persistir modo de visualização
  useEffect(() => {
    try { localStorage.setItem('ln_view_mode', viewMode); } catch {}
  }, [viewMode]);

  const importMorningRoutine = async () => {
    const token = localStorage.getItem('linguanova_token');
    if (!isAuthenticated || !token) {
      setError('Você precisa estar autenticado para importar.');
      return;
    }
    try {
      setImporting(true);
      setError('');
      const resp = await fetch('http://localhost:5001/api/flashcards/import/dialogue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          dialogueKey: 'morning_routine',
          sourceLang: 'en',
          includeAllTranslations: false,
          targetLang: nativeLanguage || 'pt'
        })
      });
      const data = await resp.json();
      if (!resp.ok) {
        setError(data?.error || 'Falha ao importar diálogo');
        return;
      }
      // Recarregar lista de decks e navegar para estudo
      const deckId = data?.deck?.id;
      if (deckId) {
        // refresh decks
        const listResp = await fetch('http://localhost:5001/api/flashcards/decks', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Target-Lang': nativeLanguage || ''
          }
        });
        const listData = await listResp.json();
        setDecks(Array.isArray(listData.decks) ? listData.decks : []);
        // navegar para estudo
        navigate(`/flashcards/study?deckId=${deckId}`);
      }
    } catch (e) {
      console.error('Erro ao importar diálogo:', e);
      setError('Erro inesperado ao importar diálogo');
    } finally {
      setImporting(false);
    }
  };

  // Navegar para estudo ao clicar no card/linha, ignorando cliques em elementos interativos
  const studyDeck = (deckId) => navigate(`/flashcards/study?deckId=${deckId}`);
  const handleDeckClick = (e, deckId) => {
    const interactive = e.target.closest('a, button, summary, input, textarea, select, [data-ignore-card-click]');
    if (interactive) return;
    studyDeck(deckId);
  };
  const handleDeckKeyDown = (e, deckId) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const interactive = e.target.closest('a, button, summary, input, textarea, select, [data-ignore-card-click]');
      if (interactive) return;
      e.preventDefault();
      studyDeck(deckId);
    }
  };

  const importAllDialogues = async () => {
    const token = localStorage.getItem('linguanova_token');
    if (!isAuthenticated || !token) {
      setError('Você precisa estar autenticado para importar.');
      return;
    }
    try {
      setImporting(true);
      setError('');
      const resp = await fetch('http://localhost:5001/api/flashcards/import/all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sourceLang: 'en',
          includeAllTranslations: false,
          targetLang: nativeLanguage || 'pt'
        })
      });
      const data = await resp.json();
      if (!resp.ok) {
        setError(data?.error || 'Falha ao importar diálogos');
        return;
      }
      // Recarregar lista de decks
      const listResp = await fetch('http://localhost:5001/api/flashcards/decks', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Target-Lang': nativeLanguage || ''
        }
      });
      const listData = await listResp.json();
      setDecks(Array.isArray(listData.decks) ? listData.decks : []);
    } catch (e) {
      console.error('Erro ao importar todos os diálogos:', e);
      setError('Erro inesperado ao importar diálogos');
    } finally {
      setImporting(false);
    }
  };

  const deleteAllDecks = async () => {
    const token = localStorage.getItem('linguanova_token');
    if (!isAuthenticated || !token) {
      setError('Você precisa estar autenticado para apagar decks.');
      return;
    }
    const confirm = window.confirm('Tem certeza que deseja apagar TODOS os decks? Esta ação não pode ser desfeita.');
    if (!confirm) return;
    try {
      setLoading(true);
      setError('');
      const resp = await fetch('http://localhost:5001/api/flashcards/decks', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await resp.json();
      if (!resp.ok) {
        setError(data?.error || 'Falha ao apagar decks');
        return;
      }
      // Limpar UI
      setDecks([]);
      setStats({});
    } catch (e) {
      console.error('Erro ao apagar decks:', e);
      setError('Erro inesperado ao apagar decks');
    } finally {
      setLoading(false);
    }
  };

  const deleteDeck = async (deckId) => {
    const token = localStorage.getItem('linguanova_token');
    if (!isAuthenticated || !token) {
      setError('Você precisa estar autenticado para apagar um deck.');
      return;
    }
    const confirm = window.confirm('Tem certeza que deseja apagar este deck? Esta ação não pode ser desfeita.');
    if (!confirm) return;
    try {
      setLoading(true);
      setError('');
      const resp = await fetch(`http://localhost:5001/api/flashcards/decks/${deckId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await resp.json();
      if (!resp.ok) {
        setError(data?.error || 'Falha ao apagar deck');
        return;
      }
      // Atualizar estado local removendo o deck apagado
      setDecks((prev) => prev.filter((d) => d.id !== deckId));
      setStats((prev) => {
        const next = { ...prev };
        delete next[deckId];
        return next;
      });
    } catch (e) {
      console.error('Erro ao apagar deck:', e);
      setError('Erro inesperado ao apagar deck');
    } finally {
      setLoading(false);
    }
  };

  const normalizeDeck = async (deckId) => {
    const token = localStorage.getItem('linguanova_token');
    if (!isAuthenticated || !token) {
      setError('Você precisa estar autenticado para normalizar um deck.');
      return;
    }
    try {
      setNormalizingDeckId(deckId);
      setError('');
      const resp = await fetch(`http://localhost:5001/api/flashcards/decks/${deckId}/normalize`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await resp.json();
      if (!resp.ok) {
        setError(data?.error || 'Falha ao normalizar deck');
        return;
      }
      const count = Number(data?.updatedCards || 0);
      window.alert(`Deck normalizado: ${count} cards atualizados.`);
      // Opcional: recarregar estatísticas do deck
      try {
        const sResp = await fetch(`http://localhost:5001/api/flashcards/decks/${deckId}/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (sResp.ok) {
          const sData = await sResp.json();
          setStats((prev) => ({ ...prev, [deckId]: sData }));
        }
      } catch (e) {}
    } catch (e) {
      console.error('Erro ao normalizar deck:', e);
      setError('Erro inesperado ao normalizar deck');
    } finally {
      setNormalizingDeckId(null);
    }
  };

  const renderDeckActions = (deck) => (
    <div className="deck-actions" style={{ marginTop: '0.75rem' }}>
      <Link
        to={`/flashcards/study?deckId=${deck.id}`}
        className="study-btn icon-only"
        aria-label={t('navStudy','Estudar')}
        title={t('navStudy','Estudar')}
      >
        <i className="fas fa-graduation-cap"></i>
      </Link>
      <Link
        to={`/flashcards/add-cards?deckId=${deck.id}`}
        className="study-btn secondary icon-only"
        aria-label={t('navAddCards','Adicionar Cards')}
        title={t('navAddCards','Adicionar Cards')}
      >
        <i className="fas fa-plus-circle"></i>
      </Link>
      <Link
        to={`/flashcards/edit-deck?deckId=${deck.id}`}
        className="study-btn secondary icon-only"
        aria-label="Editar Deck"
        title="Editar Deck"
      >
        <i className="fas fa-edit"></i>
      </Link>
      <button
        className="study-btn secondary icon-only"
        onClick={() => normalizeDeck(deck.id)}
        aria-label="Normalizar Deck"
        title="Normalizar Deck"
        disabled={normalizingDeckId === deck.id}
      >
        <i className={`fas ${normalizingDeckId === deck.id ? 'fa-spinner fa-spin' : 'fa-broom'}`}></i>
      </button>
      <button
        className="study-btn danger icon-only"
        onClick={() => deleteDeck(deck.id)}
        aria-label="Apagar Deck"
        title="Apagar Deck"
      >
        <i className="fas fa-trash"></i>
      </button>
    </div>
  );

  return (
    <div className="my-decks-page">
      <div className="page-header">
        <h1>
          <i className="fas fa-layer-group"></i>
          {t('navMyDecks', 'Meus Decks')}
        </h1>
        <p>{t('myDecksPageDesc', 'Gerencie seus decks de flashcards')}</p>
      </div>
      
      <div className="content-container">
        {/* Ação rápida para importar Morning Routine como deck */}
      <div style={{ marginBottom: '1rem' }}>
        <button className="study-btn danger" onClick={deleteAllDecks}>
          <i className="fas fa-trash"></i>
          Apagar todos os decks
        </button>
      </div>
        {/* Alternador Cards/Lista */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <button className={`study-btn ${viewMode === 'cards' ? '' : 'secondary'}`} onClick={() => setViewMode('cards')}>
            <i className="fas fa-th-large"></i> Cards
          </button>
          <button className={`study-btn ${viewMode === 'list' ? '' : 'secondary'}`} onClick={() => setViewMode('list')}>
            <i className="fas fa-list"></i> Lista
          </button>
        </div>
        {loading && <div className="hotkeys-hint">{t('loading','Carregando...')}</div>}
        {error && <div className="hotkeys-hint">{error}</div>}
        {!loading && !error && decks.length === 0 && (
          <div className="coming-soon">
            <i className="fas fa-layer-group"></i>
            <h2>{t('noDecks', 'Nenhum deck encontrado')}</h2>
            <p>{t('createFirstDeck', 'Crie seu primeiro deck')}</p>
            <Link to="/flashcards/new-deck" className="study-btn" style={{ marginTop: '0.5rem' }}>
              <i className="fas fa-plus-circle"></i> {t('navNewDeck','Novo Deck')}
            </Link>
          </div>
        )}
        {decks.length > 0 && (
          (() => {
            const sortedDecks = [...decks].sort((a, b) => {
              const dueA = Number(a?.due_today || 0);
              const dueB = Number(b?.due_today || 0);
              if (dueB !== dueA) return dueB - dueA;
              const sA = stats[a.id] || { total: 0, New: 0, Learn: 0, Review: 0 };
              const sB = stats[b.id] || { total: 0, New: 0, Learn: 0, Review: 0 };
              if (sB.Review !== sA.Review) return sB.Review - sA.Review;
              if (sB.Learn !== sA.Learn) return sB.Learn - sA.Learn;
              if (sB.New !== sA.New) return sB.New - sA.New;
              const nameA = (a.display_name || a.name || '').toLowerCase();
              const nameB = (b.display_name || b.name || '').toLowerCase();
              return nameA.localeCompare(nameB);
            });
            if (viewMode === 'cards') {
              return (
                <div className="deck-grid">
                  {sortedDecks.map(deck => (
                    <div
                      key={deck.id}
                      className="deck-card"
                      onClick={(e) => handleDeckClick(e, deck.id)}
                      onKeyDown={(e) => handleDeckKeyDown(e, deck.id)}
                      tabIndex={0}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Menu de três pontinhos (mobile) e ícones (desktop) */}
                      <details className="card-actions-menu" aria-label={t('moreActions','Mais ações')}>
                        <summary className="study-btn secondary card-more-btn" title={t('moreActions','Mais ações')} aria-label={t('moreActions','Mais ações')} data-ignore-card-click>
                          <i className="fas fa-ellipsis-v"></i>
                        </summary>
                        <div className="menu">
                          <Link to={`/flashcards/study?deckId=${deck.id}`} className="study-btn">
                            <i className="fas fa-graduation-cap"></i> {t('navStudy','Estudar')}
                          </Link>
                          <Link to={`/flashcards/add-cards?deckId=${deck.id}`} className="study-btn secondary">
                            <i className="fas fa-plus-circle"></i> {t('navAddCards','Adicionar Cards')}
                          </Link>
                          <Link to={`/flashcards/edit-deck?deckId=${deck.id}`} className="study-btn secondary">
                            <i className="fas fa-edit"></i> Editar Deck
                          </Link>
                          <button className="study-btn secondary" onClick={() => normalizeDeck(deck.id)} disabled={normalizingDeckId === deck.id}>
                            <i className={`fas ${normalizingDeckId === deck.id ? 'fa-spinner fa-spin' : 'fa-broom'}`}></i> Normalizar
                          </button>
                          <button className="study-btn danger" onClick={() => deleteDeck(deck.id)}>
                            <i className="fas fa-trash"></i> Apagar
                          </button>
                        </div>
                      </details>

                      <div className="deck-title" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{formatDeckName(deck.display_name || deck.name)}</div>
                      {deck.description ? <div className="card-subtitle">{fixMojibakeClient(deck.description)}</div> : null}
                      <div className="deck-stats" style={{ marginTop: '0.5rem' }}>
                        {(() => {
                          const s = stats[deck.id] || { total: 0, New: 0, Learn: 0, Review: 0 };
                          const due = Number(deck?.due_today || 0);
                          return (
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
                              <span className={`stat-badge ${due > 0 ? 'review' : ''}`} title="Cards vencidos para revisar hoje">
                                <strong>Vencidos:</strong> {due}
                              </span>
                              <span className="stat-badge"><strong>Total:</strong> {s.total}</span>
                              <span className="stat-badge new"><strong>New:</strong> {s.New}</span>
                              <span className="stat-badge learn"><strong>Learn:</strong> {s.Learn}</span>
                              <span className="stat-badge review"><strong>Review:</strong> {s.Review}</span>
                            </div>
                          );
                        })()}
                      </div>
                      {/* Ícones de ação no desktop */}
                      {renderDeckActions(deck)}
                    </div>
                  ))}
                </div>
              );
            }
            return (
              <div className="deck-table">
                <div className="deck-table-header">
                  <div>Nome</div>
                  <div>Descrição</div>
                  <div>Vencidos</div>
                  <div>Total</div>
                  <div>Ações</div>
                </div>
                {sortedDecks.map(deck => {
                  const s = stats[deck.id] || { total: 0, New: 0, Learn: 0, Review: 0 };
                  const due = Number(deck?.due_today || 0);
                  return (
                    <div
                      key={deck.id}
                      className="deck-row"
                      onClick={(e) => handleDeckClick(e, deck.id)}
                      onKeyDown={(e) => handleDeckKeyDown(e, deck.id)}
                      tabIndex={0}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="row-title">{formatDeckName(deck.display_name || deck.name)}</div>
                      <div className="row-desc" title={fixMojibakeClient(deck.description || '')}>{fixMojibakeClient(deck.description || '')}</div>
                      <div className="row-due">{due}</div>
                      <div className="row-total">{s.total}</div>
                      <div className="row-actions">
                        {/* Ações Desktop (ícones) */}
                        <div className="actions-desktop" style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-start' }}>
                          <Link to={`/flashcards/study?deckId=${deck.id}`} className="study-btn icon-only" title={t('navStudy','Estudar')} aria-label={t('navStudy','Estudar')}>
                            <i className="fas fa-graduation-cap"></i>
                          </Link>
                          <Link to={`/flashcards/add-cards?deckId=${deck.id}`} className="study-btn secondary icon-only" title={t('navAddCards','Adicionar Cards')} aria-label={t('navAddCards','Adicionar Cards')}>
                            <i className="fas fa-plus-circle"></i>
                          </Link>
                          <Link to={`/flashcards/edit-deck?deckId=${deck.id}`} className="study-btn secondary icon-only" title="Editar Deck" aria-label="Editar Deck">
                            <i className="fas fa-edit"></i>
                          </Link>
                          <button className="study-btn secondary icon-only" onClick={() => normalizeDeck(deck.id)} title="Normalizar Deck" aria-label="Normalizar Deck" disabled={normalizingDeckId === deck.id}>
                            <i className={`fas ${normalizingDeckId === deck.id ? 'fa-spinner fa-spin' : 'fa-broom'}`}></i>
                          </button>
                          <button className="study-btn danger icon-only" onClick={() => deleteDeck(deck.id)} title="Apagar Deck" aria-label="Apagar Deck">
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>

                        {/* Ações Mobile (apenas menu “Mais”) */}
                        <div className="actions-mobile">
                          <details className="actions-menu">
                            <summary className="study-btn secondary more-btn" aria-label={t('moreActions','Mais ações')} title={t('moreActions','Mais ações')}>
                              <i className="fas fa-ellipsis-v"></i>
                            </summary>
                            <div className="menu">
                              <Link to={`/flashcards/study?deckId=${deck.id}`} className="study-btn">
                                <i className="fas fa-graduation-cap"></i> {t('navStudy','Estudar')}
                              </Link>
                              <Link to={`/flashcards/add-cards?deckId=${deck.id}`} className="study-btn secondary">
                                <i className="fas fa-plus-circle"></i> {t('navAddCards','Adicionar Cards')}
                              </Link>
                              <Link to={`/flashcards/edit-deck?deckId=${deck.id}`} className="study-btn secondary">
                                <i className="fas fa-edit"></i> Editar Deck
                              </Link>
                              <button className="study-btn secondary" onClick={() => normalizeDeck(deck.id)} disabled={normalizingDeckId === deck.id}>
                                <i className={`fas ${normalizingDeckId === deck.id ? 'fa-spinner fa-spin' : 'fa-broom'}`}></i> Normalizar
                              </button>
                              <button className="study-btn danger" onClick={() => deleteDeck(deck.id)}>
                                <i className="fas fa-trash"></i> Apagar
                              </button>
                            </div>
                          </details>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
};

export default MyDecks;