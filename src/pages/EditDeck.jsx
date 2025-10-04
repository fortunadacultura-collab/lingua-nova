import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import '../styles/ui.css';

const EditDeck = () => {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const deckId = params.get('deckId');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState('');
  const [tagsStr, setTagsStr] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // UI robusta para edição de cards
  const [activeTab, setActiveTab] = useState('meta'); // 'meta' | 'cards'
  const [cards, setCards] = useState([]);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [cardsError, setCardsError] = useState('');
  const [filterText, setFilterText] = useState('');
  const [sortKey, setSortKey] = useState('updated_desc');
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const [savingCardId, setSavingCardId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');
  const [newFrontAudio, setNewFrontAudio] = useState('');
  const [newBackAudio, setNewBackAudio] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('linguanova_token');
    if (!deckId || !isAuthenticated || !token) return;
    const fetchDeck = async () => {
      try {
        setLoading(true);
        setError('');
        const resp = await fetch('http://localhost:5001/api/flashcards/decks', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();
        if (!resp.ok) {
          setError(data?.error || 'Falha ao carregar deck');
          return;
        }
        const list = Array.isArray(data.decks) ? data.decks : [];
        const deck = list.find(d => String(d.id) === String(deckId));
        if (!deck) {
          setError('Deck não encontrado');
          return;
        }
        setName(deck.name || '');
        setDescription(deck.description || '');
        setLanguage(deck.language || '');
        const tags = deck.tags;
        try {
          const arr = Array.isArray(tags) ? tags : JSON.parse(tags || '[]');
          setTagsStr(arr.join(', '));
        } catch {
          setTagsStr('');
        }
      } catch (e) {
        console.error('Erro carregando deck:', e);
        setError('Falha ao carregar deck');
      } finally {
        setLoading(false);
      }
    };
    fetchDeck();
  }, [deckId, isAuthenticated]);

  // Carregar cards do deck
  useEffect(() => {
    const token = localStorage.getItem('linguanova_token');
    if (!deckId || !isAuthenticated || !token) return;
    const fetchCards = async () => {
      try {
        setCardsLoading(true);
        setCardsError('');
        const resp = await fetch(`http://localhost:5001/api/flashcards/decks/${deckId}/cards`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();
        if (!resp.ok) {
          setCardsError(data?.error || 'Falha ao carregar cards');
          return;
        }
        setCards(Array.isArray(data.cards) ? data.cards : []);
      } catch (e) {
        console.error('Erro carregando cards:', e);
        setCardsError('Falha ao carregar cards');
      } finally {
        setCardsLoading(false);
      }
    };
    fetchCards();
  }, [deckId, isAuthenticated]);

  const isVirtualCard = (card) => String(card?.id || '').startsWith('v_');
  const resolveAbsAudio = (url) => {
    const u = String(url || '').trim();
    if (!u) return '';
    if (u.startsWith('http://') || u.startsWith('https://')) return u;
    return `http://localhost:5001${u}`;
  };

  // Upload de mídia (áudio)
  const uploadCardMedia = async (file) => {
    if (!file) return null;
    const token = localStorage.getItem('linguanova_token');
    if (!isAuthenticated || !token) {
      setCardsError('Você precisa estar autenticado para enviar mídia.');
      return null;
    }
    try {
      setCardsError('');
      const form = new FormData();
      form.append('file', file);
      const resp = await fetch('http://localhost:5001/api/upload/card-media', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: form
      });
      const data = await resp.json();
      if (!resp.ok) {
        setCardsError(data?.message || data?.error || 'Falha no upload');
        return null;
      }
      return data?.file?.url || null;
    } catch (e) {
      console.error('Upload error:', e);
      setCardsError('Erro inesperado no upload');
      return null;
    }
  };

  const handleUploadNew = async (side, file) => {
    const url = await uploadCardMedia(file);
    if (!url) return;
    if (side === 'front') setNewFrontAudio(url);
    if (side === 'back') setNewBackAudio(url);
  };

  const handleUploadCard = async (cardId, side, file) => {
    const url = await uploadCardMedia(file);
    if (!url) return;
    setCards(prev => prev.map(c => {
      if (c.id !== cardId) return c;
      if (side === 'front') return { ...c, front_audio_url: url };
      if (side === 'back') return { ...c, back_audio_url: url };
      return c;
    }));
  };

  const filteredCards = useMemo(() => {
    const ft = filterText.trim().toLowerCase();
    if (!ft) return cards;
    return cards.filter(c =>
      String(c.front_text || '').toLowerCase().includes(ft) ||
      String(c.back_text || '').toLowerCase().includes(ft)
    );
  }, [cards, filterText]);

  const sortedCards = useMemo(() => {
    const list = [...filteredCards];
    const hasAudio = (c) => (c.front_audio_url ? 1 : 0) + (c.back_audio_url ? 1 : 0);
    switch (sortKey) {
      case 'front_asc':
        return list.sort((a, b) => String(a.front_text || '').localeCompare(String(b.front_text || '')));
      case 'back_asc':
        return list.sort((a, b) => String(a.back_text || '').localeCompare(String(b.back_text || '')));
      case 'has_audio_desc':
        return list.sort((a, b) => hasAudio(b) - hasAudio(a));
      case 'updated_desc':
      default:
        return list.sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0));
    }
  }, [filteredCards, sortKey]);

  const totalPages = Math.max(1, Math.ceil(filteredCards.length / pageSize));
  const pageCards = sortedCards.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);

  const saveCard = async (card) => {
    const token = localStorage.getItem('linguanova_token');
    if (!isAuthenticated || !token) {
      setCardsError('Você precisa estar autenticado.');
      return;
    }
    if (isVirtualCard(card)) {
      window.alert('Este card é virtual (diálogo) e não pode ser editado aqui.');
      return;
    }
    try {
      setSavingCardId(card.id);
      setCardsError('');
      const payload = {
        front_text: card.front_text,
        back_text: card.back_text,
        front_audio_url: (card.front_audio_url || '') || null,
        back_audio_url: (card.back_audio_url || '') || null,
      };
      const resp = await fetch(`http://localhost:5001/api/flashcards/cards/${card.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await resp.json();
      if (!resp.ok) {
        setCardsError(data?.error || 'Falha ao salvar card');
        return;
      }
      setCards(prev => prev.map(c => c.id === card.id ? data.card : c));
    } catch (e) {
      console.error('Erro salvando card:', e);
      setCardsError('Erro inesperado ao salvar card');
    } finally {
      setSavingCardId(null);
    }
  };

  const deleteCard = async (cardId) => {
    const token = localStorage.getItem('linguanova_token');
    if (!isAuthenticated || !token) {
      setCardsError('Você precisa estar autenticado.');
      return;
    }
    const ok = window.confirm('Tem certeza que deseja remover este card?');
    if (!ok) return;
    try {
      setCardsError('');
      const resp = await fetch(`http://localhost:5001/api/flashcards/cards/${cardId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await resp.json();
      if (!resp.ok) {
        setCardsError(data?.error || 'Falha ao remover card');
        return;
      }
      setCards(prev => prev.filter(c => c.id !== cardId));
    } catch (e) {
      console.error('Erro removendo card:', e);
      setCardsError('Erro inesperado ao remover card');
    }
  };

  const createCard = async () => {
    const token = localStorage.getItem('linguanova_token');
    if (!isAuthenticated || !token || !deckId) {
      setCardsError('Você precisa estar autenticado.');
      return;
    }
    if (!newFront.trim() || !newBack.trim()) {
      setCardsError('Frente e verso são obrigatórios.');
      return;
    }
    try {
      setCreating(true);
      setCardsError('');
      const payload = {
        front_text: newFront,
        back_text: newBack,
        front_audio_url: newFrontAudio || null,
        back_audio_url: newBackAudio || null,
      };
      const resp = await fetch(`http://localhost:5001/api/flashcards/decks/${deckId}/cards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await resp.json();
      if (!resp.ok) {
        setCardsError(data?.error || 'Falha ao criar card');
        return;
      }
      setCards(prev => [data.card, ...prev]);
      setNewFront('');
      setNewBack('');
      setNewFrontAudio('');
      setNewBackAudio('');
      setPage(1);
    } catch (e) {
      console.error('Erro criando card:', e);
      setCardsError('Erro inesperado ao criar card');
    } finally {
      setCreating(false);
    }
  };

  const saveDeck = async () => {
    const token = localStorage.getItem('linguanova_token');
    if (!deckId || !isAuthenticated || !token) {
      setError('Você precisa estar autenticado.');
      return;
    }
    try {
      setSaving(true);
      setError('');
      const tags = tagsStr.split(',').map(s => s.trim()).filter(Boolean);
      const resp = await fetch(`http://localhost:5001/api/flashcards/decks/${deckId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, description, language, tags })
      });
      const data = await resp.json();
      if (!resp.ok) {
        setError(data?.error || 'Falha ao salvar');
        setSaving(false);
        return;
      }
      window.alert('Deck atualizado com sucesso');
    } catch (e) {
      console.error('Erro salvando deck:', e);
      setError('Erro inesperado ao salvar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="content-container">
      <div className="page-header">
        <h1>
          <i className="fas fa-edit"></i>
          {t('editDeck', 'Editar Deck')}
        </h1>
        <p>{t('editDeckDesc', 'Atualize nome, descrição, idioma, tags e cards')}</p>
      </div>
      {error && <div className="hotkeys-hint">{error}</div>}
      {loading ? (
        <div className="hotkeys-hint">{t('loading','Carregando...')}</div>
      ) : (
        <div className="card-subtitle" style={{ padding: '1rem', borderRadius: '8px', background: 'rgba(0,0,0,0.05)' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <button className={`study-btn ${activeTab === 'meta' ? '' : 'secondary'}`} onClick={() => setActiveTab('meta')}>
              <i className="fas fa-info-circle"></i> Metadados
            </button>
            <button className={`study-btn ${activeTab === 'cards' ? '' : 'secondary'}`} onClick={() => setActiveTab('cards')}>
              <i className="fas fa-clone"></i> Cartas
            </button>
          </div>

          {activeTab === 'meta' ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label>Nome</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%' }} />
                </div>
                <div>
                  <label>Idioma</label>
                  <input type="text" value={language} onChange={(e) => setLanguage(e.target.value)} style={{ width: '100%' }} placeholder="ex.: en, pt" />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label>Descrição</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} style={{ width: '100%' }} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label>Tags (separadas por vírgula)</label>
                  <input type="text" value={tagsStr} onChange={(e) => setTagsStr(e.target.value)} style={{ width: '100%' }} placeholder="ex.: import, anki" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                <button className="study-btn" onClick={saveDeck} disabled={saving}>
                  <i className={`fas ${saving ? 'fa-spinner fa-spin' : 'fa-save'}`}></i> Salvar
                </button>
                <Link className="study-btn secondary" to="/flashcards/my-decks">
                  <i className="fas fa-layer-group"></i> Voltar aos decks
                </Link>
                {deckId ? (
                  <Link className="study-btn secondary" to={`/flashcards/study?deckId=${deckId}`}>
                    <i className="fas fa-graduation-cap"></i> Estudar este deck
                  </Link>
                ) : null}
              </div>
            </>
          ) : (
            <>
              {/* Filtro, ordenação e criação rápida */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div>
                  <label>Buscar (frente/verso)</label>
                  <input type="text" value={filterText} onChange={(e) => { setFilterText(e.target.value); setPage(1); }} style={{ width: '100%' }} placeholder="Digite para filtrar" />
                  <div style={{ marginTop: '0.5rem' }}>
                    <label>Ordenar</label>
                    <select value={sortKey} onChange={(e) => { setSortKey(e.target.value); setPage(1); }} style={{ width: '100%' }}>
                      <option value="updated_desc">Atualizados (recentes)</option>
                      <option value="front_asc">Frente A-Z</option>
                      <option value="back_asc">Verso A-Z</option>
                      <option value="has_audio_desc">Com áudio primeiro</option>
                    </select>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <label style={{ display: 'block' }}>Adicionar card</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="study-btn secondary" onClick={() => setCreating(v => !v)}>
                      <i className="fas fa-plus"></i> Novo
                    </button>
                  </div>
                </div>
              </div>
              {creating && (
                <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.04)', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div>
                      <label>Frente</label>
                      <textarea rows={2} value={newFront} onChange={(e) => setNewFront(e.target.value)} style={{ width: '100%' }} />
                    </div>
                    <div>
                      <label>Verso</label>
                      <textarea rows={2} value={newBack} onChange={(e) => setNewBack(e.target.value)} style={{ width: '100%' }} />
                    </div>
                    <div>
                      <label>Áudio (frente)</label>
                      <input type="text" value={newFrontAudio} onChange={(e) => setNewFrontAudio(e.target.value)} style={{ width: '100%' }} placeholder="/uploads/apkg/... ou /audio/dialogues/..." />
                      <div className="toolbar" style={{ gap: '0.5rem', marginTop: '0.25rem' }}>
                        <input type="file" accept="audio/*" onChange={(e) => handleUploadNew('front', e.target.files[0])} />
                      </div>
                    </div>
                    <div>
                      <label>Áudio (verso)</label>
                      <input type="text" value={newBackAudio} onChange={(e) => setNewBackAudio(e.target.value)} style={{ width: '100%' }} placeholder="opcional" />
                      <div className="toolbar" style={{ gap: '0.5rem', marginTop: '0.25rem' }}>
                        <input type="file" accept="audio/*" onChange={(e) => handleUploadNew('back', e.target.files[0])} />
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button className="study-btn" onClick={createCard}>
                      <i className="fas fa-save"></i> Criar
                    </button>
                    <button className="study-btn secondary" onClick={() => { setCreating(false); setNewFront(''); setNewBack(''); setNewFrontAudio(''); setNewBackAudio(''); }}>
                      <i className="fas fa-times"></i> Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Lista de cards com edição inline */}
              {cardsError && <div className="hotkeys-hint">{cardsError}</div>}
              {cardsLoading ? (
                <div className="hotkeys-hint">Carregando cards...</div>
              ) : pageCards.length === 0 ? (
                <div className="hotkeys-hint">Nenhum card encontrado.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {pageCards.map((card) => {
                    const isVirt = isVirtualCard(card);
                    const frontResolved = resolveAbsAudio(card.front_audio_url);
                    const backResolved = resolveAbsAudio(card.back_audio_url);
                    const isAnkiAudio = String(card.front_audio_url || '').startsWith('/uploads/apkg/') || String(card.back_audio_url || '').startsWith('/uploads/apkg/');
                    const ankiBase = isAnkiAudio ? (String(card.front_audio_url || card.back_audio_url || '').replace(/\\+/g, '/').match(/^\/uploads\/apkg\/([^/]+\/[^/]+)\//)?.[1] || '' ) : '';
                    return (
                      <div key={card.id} style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.8)', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                          <div>
                            <label>Frente</label>
                            <textarea rows={3} value={card.front_text || ''} onChange={(e) => setCards(prev => prev.map(c => c.id === card.id ? { ...c, front_text: e.target.value } : c))} style={{ width: '100%' }} disabled={isVirt} />
                          </div>
                          <div>
                            <label>Verso</label>
                            <textarea rows={3} value={card.back_text || ''} onChange={(e) => setCards(prev => prev.map(c => c.id === card.id ? { ...c, back_text: e.target.value } : c))} style={{ width: '100%' }} disabled={isVirt} />
                          </div>
                          <div>
                            <label>Áudio (frente)</label>
                            <input type="text" value={card.front_audio_url || ''} onChange={(e) => setCards(prev => prev.map(c => c.id === card.id ? { ...c, front_audio_url: e.target.value } : c))} style={{ width: '100%' }} disabled={isVirt} />
                            <div className="toolbar" style={{ gap: '0.5rem', marginTop: '0.25rem' }}>
                              <input type="file" accept="audio/*" disabled={isVirt} onChange={(e) => handleUploadCard(card.id, 'front', e.target.files[0])} />
                            </div>
                            {frontResolved ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                                <audio src={frontResolved} controls preload="none" style={{ maxWidth: '240px' }} />
                                <a href={frontResolved} target="_blank" rel="noreferrer">Abrir</a>
                              </div>
                            ) : (
                              <div className="hotkeys-hint">Sem áudio resolvido</div>
                            )}
                          </div>
                          <div>
                            <label>Áudio (verso)</label>
                            <input type="text" value={card.back_audio_url || ''} onChange={(e) => setCards(prev => prev.map(c => c.id === card.id ? { ...c, back_audio_url: e.target.value } : c))} style={{ width: '100%' }} disabled={isVirt} />
                            <div className="toolbar" style={{ gap: '0.5rem', marginTop: '0.25rem' }}>
                              <input type="file" accept="audio/*" disabled={isVirt} onChange={(e) => handleUploadCard(card.id, 'back', e.target.files[0])} />
                            </div>
                            {backResolved ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                                <audio src={backResolved} controls preload="none" style={{ maxWidth: '240px' }} />
                                <a href={backResolved} target="_blank" rel="noreferrer">Abrir</a>
                              </div>
                            ) : (
                              <div className="hotkeys-hint">Sem áudio resolvido</div>
                            )}
                          </div>
                        </div>
                        {isAnkiAudio && ankiBase ? (
                          <div className="hotkeys-hint" style={{ marginTop: '0.25rem' }}>
                            Origem Anki: {`/uploads/apkg/${ankiBase}/media/`}
                          </div>
                        ) : null}
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                          <button className="study-btn" onClick={() => saveCard(card)} disabled={isVirt || savingCardId === card.id}>
                            <i className={`fas ${savingCardId === card.id ? 'fa-spinner fa-spin' : 'fa-save'}`}></i> Salvar
                          </button>
                          <button className="study-btn secondary" onClick={() => deleteCard(card.id)} disabled={isVirt}>
                            <i className="fas fa-trash-alt"></i> Remover
                          </button>
                          {isVirt ? (
                            <div className="hotkeys-hint">Card de diálogo (virtual). Edite via importação de diálogos.</div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Paginação */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
                <div className="hotkeys-hint">Página {page} de {totalPages} ({filteredCards.length} cards)</div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="study-btn secondary" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
                    <i className="fas fa-chevron-left"></i> Anterior
                  </button>
                  <button className="study-btn secondary" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                    Próxima <i className="fas fa-chevron-right"></i>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default EditDeck;