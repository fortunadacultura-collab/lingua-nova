import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import '../styles/globals.css';
import '../styles/study.css';
import '../styles/ui.css';
import '../styles/dialogues.css';

const Study = () => {
  const { t, nativeLanguage } = useLanguage();
  const location = useLocation();
  const isNestedUnderFlashcards = location.pathname.startsWith('/flashcards');
  const { isAuthenticated } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [finished, setFinished] = useState(false);
  const [stats, setStats] = useState({ answered: 0, easy: 0, medium: 0, hard: 0 });
  const audioRefFront = useRef(null);
  const audioRefBack = useRef(null);
  const flashcardRef = useRef(null);
  const frontFaceRef = useRef(null);
  const backFaceRef = useRef(null);
  const [viewportWidth, setViewportWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  // Exemplo de cards com suporte a texto, áudio e vídeo
  const sampleCards = useMemo(() => ([
    {
      id: 'c1',
      front: {
        text: 'Hello = Olá',
        audioUrl: '',
        videoUrl: ''
      },
      back: {
        text: 'Tradução correta: Olá',
        audioUrl: '',
        videoUrl: ''
      }
    },
    {
      id: 'c2',
      front: {
        text: 'Good morning = Bom dia',
        audioUrl: '',
        videoUrl: ''
      },
      back: {
        text: 'Resposta: Bom dia',
        audioUrl: '',
        videoUrl: ''
      }
    },
    {
      id: 'c3',
      front: {
        text: 'Vídeo: Como pronunciar “Thank you”',
        audioUrl: '',
        videoUrl: ''
      },
      back: {
        text: 'Pronúncia: /θæŋk juː/',
        audioUrl: '',
        videoUrl: ''
      }
    }
  ]), []);

  const [cards, setCards] = useState(sampleCards);
  const [deckName, setDeckName] = useState('');
  const [loadingCards, setLoadingCards] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editFrontText, setEditFrontText] = useState('');
  const [editBackText, setEditBackText] = useState('');
  const [editFrontAudioUrl, setEditFrontAudioUrl] = useState('');
  const [editBackAudioUrl, setEditBackAudioUrl] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Buscar cards do backend quando houver deckId na URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const deckId = params.get('deckId');
    const token = localStorage.getItem('linguanova_token');

    if (!deckId || !isAuthenticated || !token) return;

    const fetchCards = async () => {
      try {
        setLoadingCards(true);
        const resp = await fetch(`http://localhost:5001/api/flashcards/decks/${deckId}/cards`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Target-Lang': nativeLanguage || ''
          }
        });
        if (!resp.ok) {
          console.error('Erro ao buscar cards:', resp.status);
          return;
        }
        const data = await resp.json();
        const toAbsoluteUrl = (u) => {
          const s = String(u || '').trim();
          if (!s) return '';
          if (s.startsWith('/uploads')) return `http://localhost:5001${s}`;
          return s;
        };

        const mapped = Array.isArray(data.cards) ? data.cards.map(row => ({
          id: row.id,
          front: {
            text: row.front_text || '',
            audioUrl: toAbsoluteUrl(row.front_audio_url || ''),
            videoUrl: row.front_video_url || ''
          },
          back: {
            text: row.back_text || '',
            audioUrl: toAbsoluteUrl(row.back_audio_url || ''),
            videoUrl: row.back_video_url || ''
          }
        })) : [];

        if (mapped.length > 0) {
          setCards(mapped);
          setCurrentIndex(0);
          setRevealed(false);
        } else {
          // Sem cards no deck: manter exemplos
          setCards(sampleCards);
        }

        // Buscar nome do deck para exibir como lembrete do título
        const decksResp = await fetch('http://localhost:5001/api/flashcards/decks', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Target-Lang': nativeLanguage || ''
          }
        });
        if (decksResp.ok) {
          const decksData = await decksResp.json();
          const list = Array.isArray(decksData.decks) ? decksData.decks : [];
          const d = list.find((x) => String(x.id) === String(deckId));
          if (d?.display_name || d?.name) setDeckName(d.display_name || d.name);
        }
      } catch (err) {
        console.error('Falha ao carregar cards:', err);
      } finally {
        setLoadingCards(false);
      }
    };

    fetchCards();
  }, [location.search, isAuthenticated, sampleCards, nativeLanguage]);

  const currentCard = cards[currentIndex];

  const hasImage = (html) => /<img\b/i.test(String(html || ''));
  // Centraliza quando não há imagem nem vídeo; áudio não impede centralização
  const frontTextOnly = !hasImage(currentCard?.front?.text) && !currentCard?.front?.videoUrl;
  const backTextOnly = !hasImage(currentCard?.back?.text) && !currentCard?.back?.videoUrl;

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const recomputeHeight = () => {
      const minHeight = viewportWidth <= 480 ? 320 : (viewportWidth <= 768 ? 360 : 480);
      const frontH = frontFaceRef.current ? frontFaceRef.current.scrollHeight : 0;
      const backH = backFaceRef.current ? backFaceRef.current.scrollHeight : 0;
      const maxH = Math.max(frontH, backH, minHeight);
      if (flashcardRef.current) {
        flashcardRef.current.style.height = `${maxH}px`;
      }
    };

    // recompute on immediate render
    setTimeout(recomputeHeight, 0);

    // recompute again after images load
    const imgs = [
      ...(frontFaceRef.current ? Array.from(frontFaceRef.current.querySelectorAll('img')) : []),
      ...(backFaceRef.current ? Array.from(backFaceRef.current.querySelectorAll('img')) : [])
    ];
    imgs.forEach((img) => img.addEventListener('load', recomputeHeight));
    return () => {
      imgs.forEach((img) => img.removeEventListener('load', recomputeHeight));
    };
  }, [currentIndex, revealed, editFrontText, editBackText, viewportWidth]);

  // Sanitiza HTML dos cards, permitindo apenas conteúdo básico e reescrevendo URLs de /uploads para absoluto
  const sanitizeCardHtml = (raw) => {
    const s = String(raw || '');
    // Remover tags perigosas
    let out = s
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/on[a-z]+\s*=\s*"[^"]*"/gi, '')
      .replace(/on[a-z]+\s*=\s*'[^']*'/gi, '')
      .replace(/on[a-z]+\s*=\s*[^\s>]+/gi, '');
    // Reescrever src para mídia servida pelo backend
    out = out.replace(/src=["'](\/uploads[^"']+)["']/gi, (m, p1) => `src="http://localhost:5001${p1}"`);
    return out;
  };

  const beginEdit = () => {
    if (!currentCard) return;
    setEditFrontText(currentCard.front.text || '');
    setEditBackText(currentCard.back.text || '');
    setEditFrontAudioUrl(currentCard.front.audioUrl || '');
    setEditBackAudioUrl(currentCard.back.audioUrl || '');
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setSavingEdit(false);
  };

  const saveEdit = async () => {
    if (!currentCard) return;
    // Bloquear edição para cards virtuais (diálogos)
    if (typeof currentCard.id === 'string' && currentCard.id.startsWith('v_')) {
      window.alert('Este tipo de card é virtual (diálogo) e não pode ser editado.');
      return;
    }
    const token = localStorage.getItem('linguanova_token');
    if (!token) {
      window.alert('Você precisa estar autenticado para editar.');
      return;
    }
    try {
      setSavingEdit(true);
      const toRelativeUploads = (u) => {
        const s = String(u || '').trim();
        if (!s) return null;
        // Se vindo com host absoluto, manter como está para exibição; backend aceita valores relativos ou absolutos.
        return s;
      };
      const resp = await fetch(`http://localhost:5001/api/flashcards/cards/${currentCard.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          front_text: editFrontText,
          back_text: editBackText,
          front_audio_url: toRelativeUploads(editFrontAudioUrl),
          back_audio_url: toRelativeUploads(editBackAudioUrl)
        })
      });
      const data = await resp.json();
      if (!resp.ok) {
        window.alert(data?.error || 'Falha ao salvar edição');
        setSavingEdit(false);
        return;
      }
      const toAbsoluteUrl = (u) => {
        const s = String(u || '').trim();
        if (!s) return '';
        if (s.startsWith('/uploads')) return `http://localhost:5001${s}`;
        return s;
      };
      // Atualizar card atual no estado
      setCards(prev => {
        const next = [...prev];
        next[currentIndex] = {
          ...prev[currentIndex],
          front: {
            ...prev[currentIndex].front,
            text: editFrontText,
            audioUrl: toAbsoluteUrl(editFrontAudioUrl)
          },
          back: {
            ...prev[currentIndex].back,
            text: editBackText,
            audioUrl: toAbsoluteUrl(editBackAudioUrl)
          }
        };
        return next;
      });
      setIsEditing(false);
      setSavingEdit(false);
      window.alert('Card atualizado com sucesso.');
    } catch (err) {
      console.error('Falha ao salvar edição:', err);
      window.alert('Erro inesperado ao salvar edição');
      setSavingEdit(false);
    }
  };

  // Preparar áudio da frente ao trocar de card (com auto-play quando na frente)
  const [frontIsPlaying, setFrontIsPlaying] = useState(false);
  useEffect(() => {
    if (audioRefFront.current && currentCard?.front?.audioUrl) {
      try {
        audioRefFront.current.load();
        audioRefFront.current.currentTime = 0;
      } catch {}
      if (!revealed) {
        try {
          const p = audioRefFront.current.play();
          setFrontIsPlaying(true);
          if (p && typeof p.then === 'function') {
            p.catch(() => { setFrontIsPlaying(false); });
          }
        } catch { setFrontIsPlaying(false); }
      } else {
        setFrontIsPlaying(false);
      }
    }
  }, [currentIndex, revealed, currentCard]);

  // Garantir que o ícone volte para "play" quando o áudio terminar ou pausar
  useEffect(() => {
    const audio = audioRefFront.current;
    if (!audio) return;
    const handleEnded = () => { setFrontIsPlaying(false); };
    const handlePause = () => { setFrontIsPlaying(false); };
    const handlePlay = () => { setFrontIsPlaying(true); };
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('play', handlePlay);
    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('play', handlePlay);
    };
  }, [currentCard, revealed]);

  const handleReveal = () => {
    setRevealed(true);
    // Pausar áudio da frente e preparar mídia da resposta
    if (audioRefFront.current) {
      try { audioRefFront.current.pause(); } catch {}
    }
  };

  const nextCard = () => {
    const nextIndex = (currentIndex + 1) % cards.length;
    setCurrentIndex(nextIndex);
    setRevealed(false);
    // Garantir que áudios sejam pausados ao trocar de card
    if (audioRefFront.current) { try { audioRefFront.current.pause(); } catch {} }
    if (audioRefBack.current) { try { audioRefBack.current.pause(); } catch {} }
    setFrontIsPlaying(false);
  };

  const backToFront = () => {
    setRevealed(false);
    if (audioRefBack.current) { try { audioRefBack.current.pause(); } catch {} }
  };

  const prevCard = () => {
    const prevIndex = (currentIndex - 1 + cards.length) % cards.length;
    setCurrentIndex(prevIndex);
    setRevealed(false);
    if (audioRefFront.current) { try { audioRefFront.current.pause(); } catch {} }
    if (audioRefBack.current) { try { audioRefBack.current.pause(); } catch {} }
    setFrontIsPlaying(false);
  };

  const restartSession = () => {
    setCurrentIndex(0);
    setRevealed(false);
    setFinished(false);
    setStats({ answered: 0, easy: 0, medium: 0, hard: 0 });
    if (audioRefFront.current) { try { audioRefFront.current.pause(); } catch {} }
    if (audioRefBack.current) { try { audioRefBack.current.pause(); } catch {} }
    setFrontIsPlaying(false);
  };

  const toggleFrontPlay = () => {
    const audio = audioRefFront.current;
    if (!audio || !currentCard?.front?.audioUrl) return;
    if (audio.paused) {
      try { audio.load(); } catch {}
      try {
        audio.currentTime = 0;
        const p = audio.play();
        setFrontIsPlaying(true);
        if (p && typeof p.then === 'function') {
          p.catch(() => { setFrontIsPlaying(false); });
        }
      } catch { setFrontIsPlaying(false); }
    } else {
      try { audio.pause(); } catch {}
      setFrontIsPlaying(false);
    }
  };

  const handleRate = async (level) => {
    // Atualiza estatísticas e avança
    setStats(prev => ({
      answered: prev.answered + 1,
      easy: prev.easy + (level === 'easy' ? 1 : 0),
      medium: prev.medium + (level === 'medium' ? 1 : 0),
      hard: prev.hard + (level === 'hard' ? 1 : 0),
    }));

    // Registrar review no backend (SM-2)
    try {
      const params = new URLSearchParams(location.search);
      const deckId = params.get('deckId');
      const token = localStorage.getItem('linguanova_token');
      if (deckId && isAuthenticated && token) {
        await fetch(`http://localhost:5001/api/flashcards/cards/${currentCard.id}/review`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ deckId, rating: level })
        });
      }
    } catch (err) {
      console.error('Falha ao registrar review:', err);
    }

    // Finalizar sessão ao último card
    const isLast = (currentIndex === (cards.length - 1));
    if (isLast) {
      setFinished(true);
    } else {
      // Avança suavemente
      setTimeout(nextCard, 150);
    }
  };

  // Atalhos de teclado: espaço = revelar; 1/2/3 = difícil/médio/fácil
  useEffect(() => {
    const onKeyDown = (e) => {
      // Atalho para play/pause do áudio da frente (P)
      if (e.key && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        if (!revealed) {
          toggleFrontPlay();
        }
        return;
      }
      // Voltar para a frente da carta (F)
      if (e.key && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        if (revealed) {
          backToFront();
        }
        return;
      }
      if (e.key === ' ') {
        e.preventDefault();
        if (!revealed) handleReveal();
      }
      if (!revealed) return; // Só permite rating após revelar
      if (e.key === '1') handleRate('hard');
      if (e.key === '2') handleRate('medium');
      if (e.key === '3') handleRate('easy');
      if (e.key === 'ArrowRight') nextCard();
      if (e.key === 'ArrowLeft') prevCard();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [revealed, currentIndex]);

  return (
    <div className="study-page">
      {finished ? (
        <div className="study-finish-overlay" role="alert" aria-live="polite">
          <div className="finish-card">
            <h2>
              <i className="fas fa-trophy" aria-hidden="true"></i>
              {t('studyFinished','Estudo finalizado!')}
            </h2>
            <p>{t('studyCongrats','Parabéns! Você concluiu o estudo deste deck com sucesso.')}</p>
            <div className="finish-actions">
              <button className="study-btn" onClick={restartSession} aria-label={t('restart','Reiniciar')}>
                <i className="fas fa-undo"></i> {t('restart','Reiniciar')}
              </button>
              <Link to="/flashcards/my-decks" className="study-btn secondary" aria-label={t('navMyDecks','Meus Decks')}>
                <i className="fas fa-layer-group"></i> {t('navMyDecks','Meus Decks')}
              </Link>
            </div>
          </div>
        </div>
      ) : null}
      {!isNestedUnderFlashcards && (
        <div className="page-header">
          <h1>
            <i className="fas fa-graduation-cap"></i>
            {t('navStudy', 'Estudar')}
          </h1>
          <p>{t('studyPageDesc', 'Pratique com seus flashcards')}</p>
        </div>
      )}

      {/* Navegação de páginas quando fora do container de Flashcards */}
      {!isNestedUnderFlashcards && (
        <div className="toolbar" style={{ margin: '0 1rem 1rem 1rem' }}>
          <Link to="/flashcards" className="toolbar-btn">
            <i className="fas fa-layer-group"></i>
            <span>{t('pageTitle_flashcards', 'Flashcards')}</span>
          </Link>
          <Link to="/flashcards/my-decks" className="toolbar-btn">
            <i className="fas fa-layer-group"></i>
            <span>{t('navMyDecks', 'Meus Decks')}</span>
          </Link>
          <Link to="/flashcards/new-deck" className="toolbar-btn">
            <i className="fas fa-plus-circle"></i>
            <span>{t('navNewDeck', 'Novo Deck')}</span>
          </Link>
          <Link to="/flashcards/add-cards" className="toolbar-btn">
            <i className="fas fa-plus"></i>
            <span>{t('navAddCards', 'Adicionar Cards')}</span>
          </Link>
          <Link to="/flashcards/import-export" className="toolbar-btn">
            <i className="fas fa-file-export"></i>
            <span>{t('navImportExport', 'Importar/Exportar')}</span>
          </Link>
        </div>
      )}

      <div className="content-container study-container">
        {/* Toolbar de sessão compacta */}
        <div className="session-toolbar" aria-label={t('sessionControls','Controles da sessão')}>
          <button className="toolbar-btn prev" onClick={prevCard} title={t('previous','Anterior')}>
            <i className="fas fa-arrow-left"></i>
            <span>{t('previous','Anterior')}</span>
          </button>
          <button className="toolbar-btn restart" onClick={restartSession} title={t('restart','Reiniciar')}>
            <i className="fas fa-undo"></i>
            <span>{t('restart','Reiniciar')}</span>
          </button>
          <button className="toolbar-btn next" onClick={nextCard} title={t('next','Próximo')}>
            <i className="fas fa-arrow-right"></i>
            <span>{t('next','Próximo')}</span>
          </button>
        </div>
        {/* Progresso da sessão */}
        <div className="study-progress" style={{ marginBottom: '1rem' }}>
          <div className="progress-header">
            <div>
              <span className="progress-title">{t('studyProgress', 'Progresso')}</span>
            </div>
            <div className="progress-stats">
              {t('cards', 'Cards')}: {currentIndex + 1}/{cards.length} · {t('answered', 'Respondidos')}: {stats.answered}
            </div>
          </div>
          <div className="progress-bar-container">
          <div className="progress-bar" style={{ width: `${cards.length ? (((currentIndex + 1) / cards.length) * 100) : 0}%` }}></div>
        </div>
        </div>

        {/* Edição do card atual */}
        <div className="hotkeys-hint" style={{ marginBottom: '0.75rem' }}>
          {!isEditing ? (
            <button className="study-btn secondary" onClick={(e) => { e.stopPropagation(); beginEdit(); }} title="Editar este card">
              <i className="fas fa-edit"></i> Editar card
            </button>
          ) : (
            <div className="card-subtitle" style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.05)', borderRadius: '8px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem' }}>Frente (texto)</label>
                  <textarea value={editFrontText} onChange={(e) => setEditFrontText(e.target.value)} rows={3} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem' }}>Verso (texto)</label>
                  <textarea value={editBackText} onChange={(e) => setEditBackText(e.target.value)} rows={3} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem' }}>Frente (URL de áudio)</label>
                  <input type="text" value={editFrontAudioUrl} onChange={(e) => setEditFrontAudioUrl(e.target.value)} style={{ width: '100%' }} placeholder="/uploads/... ou URL completa" />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem' }}>Verso (URL de áudio)</label>
                  <input type="text" value={editBackAudioUrl} onChange={(e) => setEditBackAudioUrl(e.target.value)} style={{ width: '100%' }} placeholder="/uploads/... ou URL completa" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button className="study-btn" onClick={(e) => { e.stopPropagation(); saveEdit(); }} disabled={savingEdit}>
                  <i className={`fas ${savingEdit ? 'fa-spinner fa-spin' : 'fa-save'}`}></i> Salvar
                </button>
                <button className="study-btn secondary" onClick={(e) => { e.stopPropagation(); cancelEdit(); }}>
                  <i className="fas fa-times"></i> Cancelar
                </button>
              </div>
              <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '0.25rem' }}>
                Dica: para áudio importado do Anki, o caminho começa com /uploads/apkg/... e é servido pelo backend em http://localhost:5001.
              </div>
            </div>
          )}
        </div>

        {/* Área do flashcard com flip */}
        <div 
          className={`flashcard ${revealed ? 'flipped' : ''}`} 
          role="button" 
          aria-label="Flashcard" 
          onClick={() => { 
            if (!revealed) { 
              handleReveal(); 
            } else {
              // Voltar para a frente
              setRevealed(false);
              if (audioRefBack.current) { try { audioRefBack.current.pause(); } catch {} }
            }
          }}
          ref={flashcardRef}
        >
          {/* Frente */}
          <div className={`flashcard-face flashcard-front ${frontTextOnly ? 'text-only' : 'media-content'}`} ref={frontFaceRef}>
            {deckName ? (
              <div
                className="dialogue-title-hint"
                style={{
                  position: 'absolute',
                  top: '0.5rem',
                  left: '0.5rem',
                  background: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.35)',
                  color: '#fff',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  backdropFilter: 'blur(2px)',
                  wordBreak: 'break-word',
                  overflowWrap: 'anywhere',
                  maxWidth: 'calc(100% - 1rem)'
                }}
              >
                {String(deckName || '')
                  .replace(/_/g, '_\u200b')
                  .replace(/-/g, '-\u200b')
                  .replace(/\//g, '/\u200b')
                  .replace(/\(/g, '(\u200b')
                  .replace(/\)/g, '\u200b)')}
              </div>
          ) : null}
            <div
              className="flashcard-text"
              dangerouslySetInnerHTML={{ __html: sanitizeCardHtml(currentCard?.front?.text || t('noContent', 'Sem conteúdo')) }}
            />
            {/* Mídias opcionais - áudio e vídeo na frente */}
            {currentCard?.front?.audioUrl ? (
              // Forçar recarregamento do elemento de áudio ao trocar de card
              <audio
                key={`${currentCard.id}-front`}
                ref={audioRefFront}
                preload="none"
                src={currentCard.front.audioUrl}
                controlsList="nodownload"
                style={{ display: 'none' }}
              />
            ) : null}
            {/* Botão de play dentro do card, centralizado na parte inferior */}
            {currentCard?.front?.audioUrl ? (
              <div className="flashcard-controls">
                <button
                  className="player-btn"
                  onClick={(e) => { e.stopPropagation(); toggleFrontPlay(); }}
                  title={frontIsPlaying ? 'Pause' : 'Play'}
                  aria-label={frontIsPlaying ? t('pause','Pausar') : t('play','Reproduzir')}
                >
                  <i className={`fas fa-${frontIsPlaying ? 'pause' : 'play'}`}></i>
                </button>
              </div>
            ) : null}
            {currentCard?.front?.videoUrl ? (
              <video controls preload="none" style={{ marginTop: '0.75rem', maxWidth: '100%', borderRadius: '8px' }}>
                <source src={currentCard.front.videoUrl} />
              </video>
            ) : null}
          </div>

          {/* Verso (resposta) */}
          <div className={`flashcard-face flashcard-back ${backTextOnly ? 'text-only' : 'media-content'}`} ref={backFaceRef}>
            <div
              className="flashcard-text"
              dangerouslySetInnerHTML={{ __html: sanitizeCardHtml(currentCard?.back?.text || t('noAnswer', 'Sem resposta')) }}
            />
            {/* Mídias opcionais - áudio e vídeo na resposta */}
            {currentCard?.back?.audioUrl ? (
              <audio
                key={`${currentCard.id}-back`}
                ref={audioRefBack}
                controls
                preload="none"
                src={currentCard.back.audioUrl}
                controlsList="nodownload"
                style={{ marginTop: '0.75rem' }}
              />
            ) : null}
          {currentCard?.back?.videoUrl ? (
            <video controls preload="none" style={{ marginTop: '0.75rem', maxWidth: '100%', borderRadius: '8px' }}>
              <source src={currentCard.back.videoUrl} />
            </video>
          ) : null}
          </div>
        </div>

        {/* Controles de áudio fora do card removidos para evitar duplicidade */}

        {/* Controles: revelar e rating */}
        <div className="study-controls" style={{ marginTop: '1rem' }}>
          {!revealed ? (
            <button className="study-btn" onClick={handleReveal} aria-label={t('showAnswer', 'Mostrar resposta')}>
              <i className="fas fa-eye"></i> {t('showAnswer', 'Mostrar resposta')} <span style={{ opacity: 0.7 }}>({t('shortcut_space', 'Espaço')})</span>
            </button>
          ) : (
            <>
              <button className="study-btn secondary" onClick={backToFront} aria-label={t('backToFront','Voltar para frente')} title={t('backToFront','Voltar para frente')}>
                <i className="fas fa-undo"></i> <span style={{ opacity: 0.7 }}>(F)</span>
              </button>
              <button className="study-btn secondary rate-hard" onClick={() => handleRate('hard')} aria-label={t('rateHard', 'Difícil')}>
                <i className="fas fa-bolt"></i> {t('rateHard', 'Difícil')} <span style={{ opacity: 0.7 }}>(1)</span>
              </button>
              <button className="study-btn secondary rate-medium" onClick={() => handleRate('medium')} aria-label={t('rateMedium', 'Médio')}>
                <i className="fas fa-adjust"></i> {t('rateMedium', 'Médio')} <span style={{ opacity: 0.7 }}>(2)</span>
              </button>
              <button className="study-btn rate-easy" onClick={() => handleRate('easy')} aria-label={t('rateEasy', 'Fácil')}>
                <i className="fas fa-check-circle"></i> {t('rateEasy', 'Fácil')} <span style={{ opacity: 0.7 }}>(3)</span>
              </button>
            </>
          )}
        </div>
        <div className="hotkeys-hint" aria-hidden="true">
          <div className="hotkeys-container" role="note" aria-label={t('keyboardShortcuts','Atalhos de teclado')}>
            <div className="hotkeys-list">
              <span className="hotkey-chip">
                <i className="fas fa-play-circle"></i>
                <span><span className="kbd">P</span>: {t('play','Reproduzir')}/{t('pause','Pausar')}</span>
              </span>
              <span className="hotkey-chip">
                <i className="fas fa-keyboard"></i>
                <span><span className="kbd">Espaço</span>: {t('showAnswer','Mostrar resposta')}</span>
              </span>
              <span className="hotkey-chip">
                <i className="fas fa-undo"></i>
                <span><span className="kbd">F</span>: {t('backToFront','Voltar para frente')}</span>
              </span>
              <span className="hotkey-chip">
                <i className="fas fa-arrows-alt-h"></i>
                <span><i className="fas fa-arrow-left" aria-hidden="true"></i>/<i className="fas fa-arrow-right" aria-hidden="true"></i> {t('navigate','Navegar')}</span>
              </span>
              <span className="hotkey-chip">
                <i className="fas fa-hashtag"></i>
                <span><span className="kbd">1</span>/<span className="kbd">2</span>/<span className="kbd">3</span> {t('rate','Avaliar')}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Study;