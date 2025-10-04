import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import '../styles/globals.css';
import '../styles/study.css';
import '../styles/ui.css';

const ImportExport = () => {
  const { t } = useLanguage();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const token = localStorage.getItem('linguanova_token') || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    if (!file) {
      setError(t('selectApkgFirst', 'Selecione um arquivo .apkg primeiro'));
      return;
    }
    try {
      setUploading(true);
      const form = new FormData();
      form.append('file', file);
      const resp = await fetch('http://localhost:5001/api/flashcards/import/apkg', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: form
      });
      const data = await resp.json();
      if (!resp.ok) {
        setError(data?.error || t('importFailed', 'Falha ao importar .apkg'));
      } else {
        setResult(data);
      }
    } catch (err) {
      setError(err.message || 'Erro no upload');
    } finally {
      setUploading(false);
    }
  };

  const decksCount = Array.isArray(result?.decks) ? result.decks.length : 0;

  return (
    <div className="flashcard-container">
      <div className="panel soft">
        <h2>{t('navImportExport', 'Importar/Exportar Decks')}</h2>
        <p>{t('importApkgHint', 'Importe decks do Anki (.apkg), incluindo áudios.')}</p>
        <form onSubmit={handleSubmit} className="form" style={{ marginTop: '1rem' }}>
          <input
            type="file"
            accept=".apkg,application/zip,application/octet-stream"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <button className="btn primary" type="submit" disabled={uploading} style={{ marginLeft: '0.5rem' }}>
            {uploading ? t('uploading', 'Importando...') : t('import', 'Importar')}
          </button>
        </form>
        {error && (
          <div className="alert error" style={{ marginTop: '0.75rem' }}>{error}</div>
        )}
        {result && (
          <div className="alert success" style={{ marginTop: '0.75rem' }}>
            <div>{t('importSuccess', 'Importação concluída')} ✅</div>
            <div>{t('decksCreated', 'Decks criados')}: {decksCount}</div>
            {result.mediaBaseUrl && (
              <div style={{ fontSize: '0.9em', opacity: 0.8 }}>
                {t('mediaStoredAt', 'Mídias armazenadas em')}: {result.mediaBaseUrl}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportExport;