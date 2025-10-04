import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import '../styles/globals.css';
import '../styles/study.css';
import '../styles/ui.css';

const AddCards = () => {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  const [decks, setDecks] = useState([]);
  const [selectedDeckId, setSelectedDeckId] = useState('');
  const [frontText, setFrontText] = useState('');
  const [backText, setBackText] = useState('');
  const [frontAudioUrl, setFrontAudioUrl] = useState('');
  const [frontVideoUrl, setFrontVideoUrl] = useState('');
  const [backAudioUrl, setBackAudioUrl] = useState('');
  const [backVideoUrl, setBackVideoUrl] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Formatar nome do deck sem sufixo de idiomas
  const formatDeckName = (name) => {
    if (!name) return '';
    return name.replace(/\s*\([^)]*\)\s*$/, '');
  };

  // Carregar decks do usuário
  useEffect(() => {
    const token = localStorage.getItem('linguanova_token');
    if (!isAuthenticated || !token) return;
    const fetchDecks = async () => {
      try {
        const resp = await fetch('http://localhost:5001/api/flashcards/decks', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!resp.ok) return;
        const data = await resp.json();
        setDecks(Array.isArray(data.decks) ? data.decks : []);
        // Pré-selecionar deck via query param
        const params = new URLSearchParams(location.search);
        const deckId = params.get('deckId');
        if (deckId) setSelectedDeckId(deckId);
      } catch (e) {
        console.error('Erro ao carregar decks:', e);
      }
    };
    fetchDecks();
  }, [isAuthenticated, location.search]);

  const handleUpload = async (side, type, file) => {
    if (!file) return;
    const token = localStorage.getItem('linguanova_token');
    if (!token) {
      setStatusMsg(t('authRequired', 'Autenticação necessária para enviar arquivos'));
      return;
    }
    try {
      setStatusMsg(t('uploading', 'Enviando arquivo...'));
      const form = new FormData();
      form.append('file', file);
      const resp = await fetch('http://localhost:5001/api/upload/card-media', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: form
      });
      const data = await resp.json();
      if (!resp.ok) {
        setStatusMsg(data?.message || t('uploadFailed', 'Falha no upload'));
        return;
      }
      const url = data?.file?.url || '';
      if (side === 'front' && type === 'audio') setFrontAudioUrl(url);
      if (side === 'front' && type === 'video') setFrontVideoUrl(url);
      if (side === 'back' && type === 'audio') setBackAudioUrl(url);
      if (side === 'back' && type === 'video') setBackVideoUrl(url);
      setStatusMsg(t('uploadSuccess', 'Arquivo enviado com sucesso'));
    } catch (e) {
      console.error('Upload error:', e);
      setStatusMsg(t('uploadFailed', 'Falha no upload'));
    }
  };

  const handleCreateCard = async () => {
    if (!selectedDeckId) {
      setStatusMsg(t('selectDeck', 'Selecione um deck'));
      return;
    }
    if (!frontText || !backText) {
      setStatusMsg(t('fillTexts', 'Preencha texto da frente e verso'));
      return;
    }
    const token = localStorage.getItem('linguanova_token');
    if (!token) {
      setStatusMsg(t('authRequired', 'Autenticação necessária'));
      return;
    }
    try {
      setSubmitting(true);
      setStatusMsg(t('saving', 'Salvando card...'));
      const resp = await fetch(`http://localhost:5001/api/flashcards/decks/${selectedDeckId}/cards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          front_text: frontText,
          back_text: backText,
          front_audio_url: frontAudioUrl || null,
          front_video_url: frontVideoUrl || null,
          back_audio_url: backAudioUrl || null,
          back_video_url: backVideoUrl || null
        })
      });
      const data = await resp.json();
      if (!resp.ok) {
        setStatusMsg(data?.error || t('saveFailed', 'Falha ao salvar o card'));
        return;
      }
      setStatusMsg(t('cardCreated', 'Card criado com sucesso'));
      // Reset simples
      setFrontText('');
      setBackText('');
      setFrontAudioUrl('');
      setFrontVideoUrl('');
      setBackAudioUrl('');
      setBackVideoUrl('');
    } catch (e) {
      console.error('Create card error:', e);
      setStatusMsg(t('saveFailed', 'Falha ao salvar o card'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="add-cards-page">
      <div className="page-header">
        <h1>
          <i className="fas fa-plus"></i>
          {t('navAddCards', 'Adicionar Cards')}
        </h1>
        <p>{t('addCardsPageDesc', 'Adicione novos cards aos seus decks')}</p>
      </div>
      
      <div className="content-container">
        {/* Seleção de Deck */}
        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <label className="form-label">{t('selectDeck', 'Selecione o Deck')}</label>
          <select
            className="form-input"
            value={selectedDeckId}
            onChange={(e) => setSelectedDeckId(e.target.value)}
          >
            <option value="">{t('choose', 'Escolha...')}</option>
            {decks.map(d => (
              <option key={d.id} value={d.id}>{formatDeckName(d.name)}</option>
            ))}
          </select>
        </div>

        {/* Texto Frente/Verso */}
        <div className="form-group">
          <label className="form-label">{t('frontText', 'Texto da Frente')}</label>
          <textarea className="form-input" rows={3} value={frontText} onChange={(e) => setFrontText(e.target.value)} />
        </div>
        <div className="form-group" style={{ marginTop: '0.75rem' }}>
          <label className="form-label">{t('backText', 'Texto do Verso')}</label>
          <textarea className="form-input" rows={3} value={backText} onChange={(e) => setBackText(e.target.value)} />
        </div>

        {/* Upload de mídia Frente */}
        <div className="form-group" style={{ marginTop: '1rem' }}>
          <label className="form-label">{t('frontMedia', 'Mídia da Frente')}</label>
          <div className="toolbar" style={{ gap: '0.5rem' }}>
            <input type="file" accept="audio/*" onChange={(e) => handleUpload('front', 'audio', e.target.files[0])} />
            <input type="file" accept="video/*" onChange={(e) => handleUpload('front', 'video', e.target.files[0])} />
          </div>
          {frontAudioUrl ? <div className="hint" style={{ marginTop: '0.5rem' }}>{t('audioUrl', 'URL Áudio')}: {frontAudioUrl}</div> : null}
          {frontVideoUrl ? <div className="hint">{t('videoUrl', 'URL Vídeo')}: {frontVideoUrl}</div> : null}
        </div>

        {/* Upload de mídia Verso */}
        <div className="form-group" style={{ marginTop: '1rem' }}>
          <label className="form-label">{t('backMedia', 'Mídia do Verso')}</label>
          <div className="toolbar" style={{ gap: '0.5rem' }}>
            <input type="file" accept="audio/*" onChange={(e) => handleUpload('back', 'audio', e.target.files[0])} />
            <input type="file" accept="video/*" onChange={(e) => handleUpload('back', 'video', e.target.files[0])} />
          </div>
          {backAudioUrl ? <div className="hint" style={{ marginTop: '0.5rem' }}>{t('audioUrl', 'URL Áudio')}: {backAudioUrl}</div> : null}
          {backVideoUrl ? <div className="hint">{t('videoUrl', 'URL Vídeo')}: {backVideoUrl}</div> : null}
        </div>

        {/* Status */}
        {statusMsg && (
          <div className="hotkeys-hint" style={{ marginTop: '0.75rem' }}>{statusMsg}</div>
        )}

        {/* Ações */}
        <div className="study-controls" style={{ marginTop: '1rem' }}>
          <button className="study-btn" disabled={submitting} onClick={handleCreateCard}>
            <i className="fas fa-save"></i> {t('saveCard', 'Salvar Card')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddCards;