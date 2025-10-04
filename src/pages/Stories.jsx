import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useLogo } from '../hooks/useImageAsset';
import '../styles/stories.css';
import '../styles/ui.css';
import '../styles/fullscreen.css';

const Stories = () => {
  const { language: currentLanguage, nativeLanguage, t, translations } = useLanguage();
  const { imageUrl: logoUrl } = useLogo();
  const [pageTitle, setPageTitle] = useState('Histórias');
  
  // App state
  const [stories, setStories] = useState({});
  const [currentStory, setCurrentStory] = useState('the_last_ride');
  const [currentStoryData, setCurrentStoryData] = useState(null);
  const [themes, setThemes] = useState([]);
  const [visibleThemes, setVisibleThemes] = useState(4);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [initialThemes] = useState(4);
  const [themesPerLine] = useState(4);
  const [currentLine, setCurrentLine] = useState(1);

  // Estados para controle do player
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSequentialPlay, setIsSequentialPlay] = useState(false);
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showTranslations, setShowTranslations] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showVolumePopup, setShowVolumePopup] = useState(false);
  const [audioLoadingProgress, setAudioLoadingProgress] = useState({ current: 0, total: 0, isLoading: false });

  // Refs
  const audioRefs = useRef([]);
  const progressIntervalRef = useRef(null);
  const phraseDurations = useRef([]);
  const lastVolumeRef = useRef(0.7);
  const currentAudioRef = useRef(null);

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (data && currentLanguage) {
      // Carregar uma história aleatória disponível quando o idioma mudar
      const availableStories = {
        'en': [
          'the_last_ride', 'the_trip'
        ]
        // Only English stories have audio files available
        // Other languages will fallback to English stories
      };
      
      const currentLanguageStories = availableStories[currentLanguage] || availableStories['en'];
      const randomIndex = Math.floor(Math.random() * currentLanguageStories.length);
      const randomStoryId = currentLanguageStories[randomIndex];
      
      console.log('Mudança de idioma detectada. Carregando história aleatória:', randomStoryId, 'para idioma:', currentLanguage);
      loadStory(randomStoryId, currentLanguage);
    }
  }, [currentLanguage, data]);

  // Efeito para recarregar temas quando o idioma mudar
  useEffect(() => {
    if (data && currentLanguage) {
      const filteredThemes = getFilteredThemes(data, currentLanguage);
      setThemes(filteredThemes);
      setVisibleThemes(4); // Reset para mostrar apenas 4 temas inicialmente
    }
  }, [currentLanguage, data]);

  // Atualizar título da página com tradução
  useEffect(() => {
    setPageTitle(t('pageTitle_stories', 'Histórias'));
  }, [t, currentLanguage, nativeLanguage, translations]);

  // Update translations when native language changes
  useEffect(() => {
    if (currentStoryData && nativeLanguage) {
      ensureTranslations(currentStoryData);
      setCurrentStoryData({...currentStoryData}); // Force re-render
    }
  }, [nativeLanguage]);

  // useEffect para atualizar o título da página
  useEffect(() => {
    const newTitle = t('pageTitle_stories', 'Histórias');
    setPageTitle(newTitle);
    document.title = `${newTitle} - LinguaNova`;
  }, [t]);

  // Load volume preference from localStorage
  useEffect(() => {
    const savedVolume = localStorage.getItem('storyVolume');
    if (savedVolume !== null) {
      const volumeValue = parseFloat(savedVolume);
      setVolume(volumeValue);
      lastVolumeRef.current = volumeValue > 0 ? volumeValue : 0.7;
    }
  }, []);

  // Controle da reprodução sequencial: dispara a próxima frase quando índice/estado mudarem
  useEffect(() => {
    if (isPlaying && isSequentialPlay) {
      playCurrentPhrase();
    }
  }, [currentPhraseIndex, isPlaying, isSequentialPlay]);

  const init = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🚀 Inicializando Stories...');
      
      // Carregar dados das histórias
      const response = await fetch('/data/stories.json');
      if (!response.ok) {
        throw new Error(`Erro ao carregar dados: ${response.status}`);
      }
      
      const storiesData = await response.json();
      console.log('📚 Dados das histórias carregados:', storiesData);
      
      setData(storiesData);
      
      // Filtrar temas disponíveis para o idioma atual
      const filteredThemes = getFilteredThemes(storiesData, currentLanguage);
      setThemes(filteredThemes);
      
      // Carregar história padrão
      await loadStory(currentStory, currentLanguage);
      
    } catch (error) {
      console.error('❌ Erro na inicialização:', error);
      setError(`Erro ao carregar histórias: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Lista de histórias disponíveis por idioma
  const getAvailableStoriesByLanguage = () => ({
    'en': ['the_last_ride', 'the_trip']
    // Outros idiomas usam fallback para inglês
  });

  const getAvailableStories = (lang) => {
    const map = getAvailableStoriesByLanguage();
    return map[lang] || map['en'] || [];
  };

  const getFilteredThemes = (storiesData, language) => {
    if (!storiesData || !storiesData.stories) return [];
    
    return Object.entries(storiesData.stories)
      .filter(([storyId, story]) => {
        return story.languages && story.languages.includes(language);
      })
      .map(([storyId, story]) => ({
        id: storyId,
        ...story
      }));
  };

  const loadStory = async (storyId, language = null) => {
    try {
      const lang = language || currentLanguage;
      console.log(`📖 Carregando história: ${storyId} em ${lang}`);
      
      setLoading(true);
      setError(null);
      
      // Parar reprodução atual
      stopStory();
      
      // Carregar dados da história
      const storyData = await loadStoryTxt(storyId, lang);
      
      if (!storyData) {
        throw new Error('Dados da história não encontrados');
      }
      
      setCurrentStory(storyId);
      setCurrentStoryData(storyData);
      
      // Garantir traduções
      ensureTranslations(storyData);
      
      // Pré-carregar áudios
      await preloadAudios(storyId, lang);
      
      // Calcular durações
      calculateDurations();
      
      console.log('✅ História carregada com sucesso');
      
    } catch (error) {
      console.warn('❌ Erro ao carregar história, tentando fallback:', error);
      const lang = language || currentLanguage;
      // Tentar outra história disponível no mesmo idioma
      const candidates = getAvailableStories(lang).filter(id => id !== storyId);
      for (const candidate of candidates) {
        try {
          console.log(`Tentando história alternativa: ${candidate} em ${lang}`);
          await loadStory(candidate, lang);
          return; // sucesso no fallback
        } catch (err2) {
          console.warn(`Falha ao carregar alternativa ${candidate} em ${lang}:`, err2);
        }
      }
      // Como último recurso, tentar em inglês
      const enCandidates = getAvailableStories('en').filter(id => id !== storyId);
      for (const candidate of enCandidates) {
        try {
          console.log(`Tentando história alternativa (en): ${candidate}`);
          await loadStory(candidate, 'en');
          return; // sucesso no fallback
        } catch (err3) {
          console.warn(`Falha ao carregar alternativa ${candidate} em en:`, err3);
        }
      }
      console.error('Sem histórias alternativas disponíveis. Exibindo erro ao usuário.');
      setError(`Erro ao carregar história: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadStoryTxt = async (storyId, language = 'en') => {
    try {
      let response = await fetch(`/stories/${language}/${storyId}.txt`);
      if (!response.ok && language !== 'en') {
        console.warn(`História não encontrada em ${language}: ${storyId}. Tentando inglês.`);
        response = await fetch(`/stories/en/${storyId}.txt`);
      }
      if (!response.ok) {
        throw new Error(`História não encontrada: ${storyId} em ${language}`);
      }
      
      const content = await response.text();
      return parseStoryTxt(content);
      
    } catch (error) {
      console.error(`Erro ao carregar ${storyId}.txt:`, error);
      throw error;
    }
  };

  const parseStoryTxt = (content) => {
    const lines = content.split('\n').filter(line => line.trim());
    const story = {
      title: '',
      phrases: [],
      translations: {}
    };
    
    let currentPhrase = null;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('title:')) {
        story.title = trimmedLine.replace('title:', '').trim();
      } else if (trimmedLine.startsWith('text:')) {
        // If we have a previous phrase, save it
        if (currentPhrase) {
          story.phrases.push(currentPhrase);
        }
        // Start new phrase
        currentPhrase = {
          speaker: 'Narrator',
          text: trimmedLine.replace('text:', '').trim(),
          translation: '',
          translations: {}
        };
      } else if (trimmedLine.includes(':') && currentPhrase) {
        // This is a translation line (e.g., "pt: Portuguese text")
        const colonIndex = trimmedLine.indexOf(':');
        const langCode = trimmedLine.substring(0, colonIndex).trim();
        const translationText = trimmedLine.substring(colonIndex + 1).trim();
        
        currentPhrase.translations[langCode] = translationText;
        
        // Set the translation for the current native language
        if (langCode === nativeLanguage) {
          currentPhrase.translation = translationText;
        }
      }
    }
    
    // Don't forget the last phrase
    if (currentPhrase) {
      story.phrases.push(currentPhrase);
    }
    
    return story;
  };

  const ensureTranslations = (story) => {
    if (!story || !nativeLanguage) return;
    
    // Implementar lógica de tradução se necessário
    if (!story.translations) {
      story.translations = {};
    }
    
    if (!story.translations[nativeLanguage]) {
      story.translations[nativeLanguage] = {
        title: story.title,
        paragraphs: [...story.phrases]
      };
    }
  };

  const preloadAudios = async (storyId, language = 'en') => {
    try {
      console.log(`🎵 Pré-carregando áudios para ${storyId} em ${language}`);
      
      if (!currentStoryData || !currentStoryData.phrases) {
        console.warn('Dados da história não disponíveis para pré-carregamento');
        return;
      }
      
      // Initialize loading progress
      setAudioLoadingProgress({ current: 0, total: currentStoryData.phrases.length, isLoading: true });
      
      // Clear existing audio elements
      audioRefs.current.forEach(audio => {
        if (audio && typeof audio.pause === 'function') {
          audio.pause();
        }
      });
      audioRefs.current = [];
      
      // Initialize audio array immediately
      audioRefs.current = new Array(currentStoryData.phrases.length).fill(null);
      
      // New strategy: load ALL audios completely before releasing the interface
      const allAudioPromises = [];
      
      // Load all audios with preload 'auto' (complete loading) - SIMPLIFIED APPROACH LIKE DIALOGUES
      for (let index = 0; index < currentStoryData.phrases.length; index++) {
        const promise = new Promise((resolve) => {
          const audio = new Audio();
          audio.preload = 'auto'; // Complete loading for all
          audio.src = `/audio/stories/${language}/${storyId}/line_${index}.mp3`;
          audio.volume = volume;
          
          const handleLoad = () => {
            console.log(`✅ Audio loaded successfully for line ${index}:`, {
              src: audio.src,
              readyState: audio.readyState,
              duration: audio.duration
            });
            audio.removeEventListener('canplaythrough', handleLoad);
            audio.removeEventListener('error', handleError);
            audioRefs.current[index] = audio;
            setAudioLoadingProgress(prev => ({ ...prev, current: prev.current + 1 }));
            resolve(audio);
          };
          
          const handleError = (e) => {
            console.error(`❌ Error loading audio line ${index}:`, e);
            audio.removeEventListener('canplaythrough', handleLoad);
            audio.removeEventListener('error', handleError);
            audioRefs.current[index] = null;
            setAudioLoadingProgress(prev => ({ ...prev, current: prev.current + 1 }));
            resolve(null);
          };
          
          audio.addEventListener('canplaythrough', handleLoad);
          audio.addEventListener('error', handleError);
          
          // Timeout for each audio
          setTimeout(() => {
            if (!audioRefs.current[index]) {
              console.warn(`Timeout loading audio for line ${index}`);
              audioRefs.current[index] = null;
              setAudioLoadingProgress(prev => ({ ...prev, current: prev.current + 1 }));
              resolve(null);
            }
          }, 5000); // 5 second timeout like Dialogues
        });
        
        allAudioPromises.push(promise);
      }
      
      // Wait for ALL audios to load before releasing the interface
      await Promise.all(allAudioPromises);
      console.log('All audios loaded, UI ready for immediate playback');
      
      // Calculate durations after all audios load
      calculateDurations();
      
      // Finish loading only when all audios are ready
      setAudioLoadingProgress({ current: 0, total: 0, isLoading: false });
      
      console.log(`📱 ${audioRefs.current.length} áudios configurados`);
      
    } catch (error) {
      console.error('❌ Erro no pré-carregamento de áudios:', error);
      setAudioLoadingProgress({ current: 0, total: 0, isLoading: false });
    }
  };

  const calculateDurations = () => {
    phraseDurations.current = [];
    let totalDuration = 0;
    
    audioRefs.current.forEach((audio, index) => {
      if (audio && !isNaN(audio.duration) && audio.duration > 0) {
        phraseDurations.current[index] = audio.duration;
        totalDuration += audio.duration;
      } else {
        phraseDurations.current[index] = 3; // Duração padrão
        totalDuration += 3;
      }
    });
    
    setTotalTime(totalDuration);
    console.log('⏱️ Durações calculadas:', phraseDurations.current, 'Total:', totalDuration);
  };

  // Audio control functions
  const playStory = () => {
    if (isPlaying) {
      pauseStory();
      return;
    }
    
    console.log('▶️ Reproduzindo história');
    setIsSequentialPlay(true);
    setIsPlaying(true);
    startProgressTracking();
  };

  const playCurrentPhrase = () => {
    if (currentPhraseIndex >= audioRefs.current.length) {
      stopStory();
      return;
    }
    
    const audio = audioRefs.current[currentPhraseIndex];
    if (!audio) {
      console.warn(`Sem áudio para frase ${currentPhraseIndex}`);
      if (isSequentialPlay) {
        setCurrentPhraseIndex(prev => prev + 1);
      } else {
        setIsPlaying(false);
      }
      return;
    }
    
    // Check if this audio element has failed to load
    if (audio._failed) {
      console.warn(`⏭️ Pulando frase ${currentPhraseIndex} - áudio falhou ao carregar`);
      if (isSequentialPlay) {
        setCurrentPhraseIndex(prev => prev + 1);
      } else {
        setIsPlaying(false);
      }
      return;
    }
    
    // Stop any currently playing audio first
    if (currentAudioRef.current && currentAudioRef.current !== audio) {
      currentAudioRef.current.pause();
    }
    
    currentAudioRef.current = audio;
    audio.volume = isMuted ? 0 : volume;
    
    // Destacar frase atual
    highlightCurrentPhrase();
    
    // Configurar event listeners
    audio.onended = () => {
      if (isSequentialPlay) {
        setCurrentPhraseIndex(prev => prev + 1);
      } else {
        setIsPlaying(false);
      }
    };
    
    audio.onerror = (e) => {
      console.error(`Erro de áudio para frase ${currentPhraseIndex}:`, e);
      if (isSequentialPlay) {
        setCurrentPhraseIndex(prev => prev + 1);
      } else {
        setIsPlaying(false);
      }
    };
    
    // Reproduzir áudio with proper promise handling
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        // Audio started successfully
        console.log(`✅ Audio playing for phrase ${currentPhraseIndex}`);
      }).catch(error => {
        // Only log error if it's not an AbortError due to pause
        if (error.name !== 'AbortError') {
          console.error('Falha ao reproduzir áudio:', error);
        }
        // Continue to next phrase if still playing
        if (isPlaying) {
          if (isSequentialPlay) {
            setCurrentPhraseIndex(prev => prev + 1);
          } else {
            setIsPlaying(false);
          }
        }
      });
    }
  };

  const pauseStory = () => {
    console.log('⏸️ Pausando história');
    setIsPlaying(false);
    
    if (currentAudioRef.current) {
      // Add a small delay to prevent race condition with play()
      setTimeout(() => {
        if (currentAudioRef.current && !currentAudioRef.current.paused) {
          currentAudioRef.current.pause();
        }
      }, 10);
    }
  };

  const stopStory = () => {
    console.log('⏹️ Parando história');
    setIsPlaying(false);
    setCurrentPhraseIndex(0);
    
    stopAllAudio();
    removeAllHighlights();
    setProgress(0);
    setCurrentTime(0);
  };

  const stopAllAudio = () => {
    audioRefs.current.forEach(audio => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
    currentAudioRef.current = null;
  };

  const playPhrase = (index) => {
    if (index < 0 || index >= audioRefs.current.length) return;
    
    console.log(`▶️ Reproduzindo frase única ${index}`);
    
    // Parar qualquer reprodução atual
    stopAllAudio();
    removeAllHighlights();
    
    // Modo de frase única: não sequencial
    setIsSequentialPlay(false);
    setIsPlaying(false);
    setCurrentPhraseIndex(index);
    
    const audio = audioRefs.current[index];
    if (!audio) {
      console.error('Áudio não disponível para esta frase');
      return;
    }
    
    audio.volume = isMuted ? 0 : volume;
    audio.currentTime = 0;
    
    // Destacar e centralizar a frase clicada
    highlightCurrentPhrase(index);
    
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        console.log('✅ Reprodução de frase única iniciada para índice:', index);
        const handleEnded = () => {
          audio.removeEventListener('ended', handleEnded);
          console.log('🏁 Reprodução de frase única finalizada');
        };
        audio.addEventListener('ended', handleEnded);
      }).catch(error => {
        console.error('❌ Falha ao reproduzir frase única:', error);
      });
    }
    
    startProgressTracking();
  };

  const highlightCurrentPhrase = (targetIndex = null) => {
    removeAllHighlights();
    const indexToHighlight = (typeof targetIndex === 'number') ? targetIndex : currentPhraseIndex;
    const phraseElement = document.querySelector(`[data-index="${indexToHighlight}"]`);
    if (phraseElement) {
      phraseElement.classList.add('highlighted');
      phraseElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });
    }
  };

  const removeAllHighlights = () => {
    document.querySelectorAll('.paragraph.highlighted').forEach(el => {
      el.classList.remove('highlighted');
    });
  };

  const startProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    
    progressIntervalRef.current = setInterval(() => {
      if (isPlaying) {
        const currentPlaybackTime = getCurrentPlaybackTime();
        updateProgress(currentPlaybackTime);
      }
    }, 100);
  };

  const getCurrentPlaybackTime = () => {
    let totalTime = 0;
    
    // Adicionar duração das frases concluídas
    for (let i = 0; i < currentPhraseIndex; i++) {
      totalTime += phraseDurations.current[i] || 0;
    }
    
    // Adicionar tempo da frase atual
    if (currentAudioRef.current && !isNaN(currentAudioRef.current.currentTime)) {
      totalTime += currentAudioRef.current.currentTime;
    }
    
    return totalTime;
  };

  const updateProgress = (currentPlaybackTime) => {
    const progressPercent = totalTime > 0 ? (currentPlaybackTime / totalTime) * 100 : 0;
    setProgress(progressPercent);
    setCurrentTime(currentPlaybackTime);
  };

  const handleProgressBarClick = (e) => {
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const progressPercent = (clickX / rect.width) * 100;
    const targetTime = (progressPercent / 100) * totalTime;
    
    seekToTime(targetTime);
  };

  const seekToTime = (targetTime) => {
    let accumulatedTime = 0;
    let targetPhraseIndex = 0;
    let offsetInPhrase = 0;
    
    // Encontrar a frase que contém o tempo alvo
    for (let i = 0; i < phraseDurations.current.length; i++) {
      const phraseDuration = phraseDurations.current[i] || 0;
      
      if (accumulatedTime + phraseDuration >= targetTime) {
        targetPhraseIndex = i;
        offsetInPhrase = targetTime - accumulatedTime;
        break;
      }
      
      accumulatedTime += phraseDuration;
    }
    
    console.log(`🎯 Buscando tempo ${targetTime}s: frase ${targetPhraseIndex}, offset ${offsetInPhrase}s`);
    
    // Parar reprodução atual
    stopAllAudio();
    removeAllHighlights();
    
    // Definir novo índice
    setCurrentPhraseIndex(targetPhraseIndex);
    
    // Reproduzir com offset se estiver tocando
    if (isPlaying) {
      playCurrentPhraseWithOffset(offsetInPhrase);
    } else {
      // Apenas destacar a frase
      highlightCurrentPhrase();
    }
    
    // Atualizar progresso
    updateProgress(targetTime);
  };

  const playCurrentPhraseWithOffset = (offset) => {
    const audio = audioRefs.current[currentPhraseIndex];
    if (!audio) return;
    
    currentAudioRef.current = audio;
    audio.volume = isMuted ? 0 : volume;
    audio.currentTime = offset;
    
    highlightCurrentPhrase();
    
    // Configurar event listeners
    audio.onended = () => {
      if (isSequentialPlay) {
        setCurrentPhraseIndex(prev => prev + 1);
      } else {
        setIsPlaying(false);
      }
    };
    
    audio.play().catch(error => {
      console.error('Falha ao reproduzir áudio com offset:', error);
      if (!isSequentialPlay) {
        setIsPlaying(false);
      }
    });
  };

  const updateVolume = (newVolume) => {
    setVolume(newVolume);
    
    // Atualizar volume de todos os áudios
    audioRefs.current.forEach(audio => {
      if (audio) {
        audio.volume = isMuted ? 0 : newVolume;
      }
    });
    
    // Salvar preferência
    localStorage.setItem('storyVolume', newVolume.toString());
    
    // Atualizar lastVolume se não estiver mutado
    if (!isMuted && newVolume > 0) {
      lastVolumeRef.current = newVolume;
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      // Desmutar
      setIsMuted(false);
      const volumeToRestore = lastVolumeRef.current;
      setVolume(volumeToRestore);
      
      audioRefs.current.forEach(audio => {
        if (audio) {
          audio.volume = volumeToRestore;
        }
      });
    } else {
      // Mutar
      lastVolumeRef.current = volume;
      setIsMuted(true);
      
      audioRefs.current.forEach(audio => {
        if (audio) {
          audio.volume = 0;
        }
      });
    }
  };

  const togglePlayPause = () => {
    console.log('🎮 togglePlayPause called, current state:', {
      isPlaying: isPlaying,
      currentPhraseIndex: currentPhraseIndex,
      audioRefsLength: audioRefs.current.length
    });
    
    if (isPlaying) {
      console.log('⏸️ Pausing story');
      pauseStory();
    } else {
      console.log('▶️ Starting story playback');
      playStory();
    }
  };

  const loadRandomStory = async () => {
    const availableStories = {
      'en': ['the_last_ride', 'the_trip']
      // Only English stories have audio files available
      // Other languages will fallback to English stories
    };

    const currentLanguageStories = availableStories[currentLanguage] || availableStories['en'];
    
    if (currentLanguageStories.length === 0) {
      console.log('Nenhuma história disponível para o idioma:', currentLanguage);
      return;
    }

    // Capturar o estado de fullscreen ANTES de qualquer operação
    const wasInFullscreen = isFullscreen;
    console.log('Estado fullscreen antes do carregamento:', wasInFullscreen);

    // Selecionar uma história aleatória
    const randomIndex = Math.floor(Math.random() * currentLanguageStories.length);
    const randomStoryId = currentLanguageStories[randomIndex];
    
    console.log('Carregando história aleatória:', randomStoryId, 'para idioma:', currentLanguage);
    
    try {
      // Preservar o estado de fullscreen durante todo o processo
      if (wasInFullscreen) {
        console.log('Preservando fullscreen durante carregamento...');
        
        const maintainFullscreen = () => {
          const storyContainer = document.querySelector('.story-container');
          if (storyContainer && !storyContainer.classList.contains('mobile-fullscreen')) {
            storyContainer.classList.add('mobile-fullscreen');
            setIsFullscreen(true);
            document.body.classList.add('fullscreen-body');
          }
        };
        
        // Aplicar imediatamente
        maintainFullscreen();
        
        // Monitorar e reaplicar durante o carregamento
        const fullscreenInterval = setInterval(maintainFullscreen, 50);
        
        // Carregar a nova história
        await loadStory(randomStoryId, currentLanguage);
        
        // Parar o monitoramento e garantir estado final
        clearInterval(fullscreenInterval);
        
        // Aplicação final do fullscreen
        setTimeout(() => {
          maintainFullscreen();
          setIsFullscreen(true);
          window.dispatchEvent(new Event('resize'));
          console.log('Fullscreen preservado com sucesso');
        }, 100);
      } else {
        // Se não estava em fullscreen, carregar normalmente
        await loadStory(randomStoryId, currentLanguage);
      }
    } catch (error) {
      console.error('Erro ao carregar história aleatória:', error);
    }
  };

  const toggleTranslations = () => {
    setShowTranslations(!showTranslations);
  };

  const toggleVolumePopup = () => {
    setShowVolumePopup(!showVolumePopup);
  };

  const toggleFullscreen = () => {
    const storyContainer = document.querySelector('.story-container');
    
    if (!storyContainer) return;
    
    const isCurrentlyFullscreen = storyContainer.classList.contains('mobile-fullscreen');
    
    if (isCurrentlyFullscreen) {
      // Sair do fullscreen
      storyContainer.classList.remove('mobile-fullscreen');
      setIsFullscreen(false);
      document.body.classList.remove('fullscreen-body');
      
      // Restaurar elementos ocultados
      const elementsToShow = document.querySelectorAll('.navbar, .tooltip, .user-dropdown, .language-selector, .section-title, .theme-grid, .theme-controls');
      elementsToShow.forEach(el => {
        el.classList.remove('fullscreen-hidden');
      });
    } else {
      // Entrar no fullscreen
      storyContainer.classList.add('mobile-fullscreen');
      setIsFullscreen(true);
      document.body.classList.add('fullscreen-body');
      
      // Ocultar elementos que podem sobrepor o media player
      const elementsToHide = document.querySelectorAll('.navbar, .tooltip, .user-dropdown, .language-selector, .section-title, .theme-grid, .theme-controls');
      elementsToHide.forEach(el => {
        el.classList.add('fullscreen-hidden');
      });
    }
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const loadMoreStories = () => {
    const newVisible = Math.min(visibleThemes + themesPerLine, themes.length);
    setVisibleThemes(newVisible);
    setCurrentLine(Math.ceil(newVisible / themesPerLine));
  };

  const showLessStories = () => {
    const newVisible = Math.max(initialThemes, visibleThemes - themesPerLine);
    setVisibleThemes(newVisible);
    setCurrentLine(Math.ceil(newVisible / themesPerLine));
  };

  if (loading) {
    return (
      <div className="stories-page">
        <div className="container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Carregando histórias...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="stories-page">
        <div className="container">
          <div className="error-container">
            <h2>Erro</h2>
            <p>{error}</p>
            <button onClick={init} className="btn btn-primary">
              Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="content-below-navbar">
      <div className="page-title-container">
        <h1 className="page-title">{pageTitle}</h1>
      </div>
      
      <div className="container">
        <div className="story-container">
          <h2 className="story-title">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span>{currentStoryData?.title || pageTitle}</span>
          </h2>
          
          <div id="story-content">
            {currentStoryData?.phrases?.map((phrase, index) => (
              <div 
                key={index} 
                className={`paragraph ${currentPhraseIndex === index ? 'highlighted' : ''}`}
                data-index={index}
                onClick={(e) => {
                  // Sempre reproduzir apenas a frase clicada (modo single)
                  playPhrase(index);
                  e.stopPropagation();
                }}
              >
                <div className="paragraph-text">{phrase.text}</div>
                <div 
                  className="translation-text" 
                  style={{ display: showTranslations && phrase.translation ? 'block' : 'none' }}
                >
                  {phrase.translation}
                </div>
              </div>
            ))}
          </div>

          <div className="media-player">
            <div className="player-controls">
              {/* Play/Pause Button */}
              <button 
                className="player-btn" 
                onClick={togglePlayPause}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                <i className={`fas fa-${isPlaying ? 'pause' : 'play'}`}></i>
              </button>
              
              {/* Stop Button */}
              <button className="player-btn" onClick={stopStory} title="Stop">
                <i className="fas fa-stop"></i>
              </button>
              
              {/* Random Button */}
              <button 
                className="player-btn random-btn" 
                onClick={loadRandomStory}
                title="Carregar História Aleatória"
              >
                <i className="fas fa-random"></i>
              </button>
              
              {/* Translations Button */}
              <button 
                className={`control-btn translations-btn ${showTranslations ? 'active' : ''}`} 
                onClick={toggleTranslations}
                title="Toggle Translations"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
                </svg>
              </button>
              
              {/* Fullscreen Button */}
              <button 
                className={`player-btn ${isFullscreen ? 'active' : ''}`} 
                onClick={toggleFullscreen}
                title="Toggle Fullscreen"
              >
                <i className={`fas fa-${isFullscreen ? 'compress' : 'expand'}`}></i>
              </button>
              
              {/* Volume Control */}
              <div className="volume-control">
                <button 
                  className="volume-btn" 
                  onClick={() => setShowVolumePopup(!showVolumePopup)}
                  title="Volume"
                >
                  <i className={`fas fa-volume-${isMuted ? 'mute' : volume > 0.5 ? 'up' : 'down'}`}></i>
                </button>
                <input 
                  type="range" 
                  id="volume-slider"
                  min="0" 
                  max="1" 
                  step="0.1" 
                  value={volume}
                  onChange={(e) => updateVolume(parseFloat(e.target.value))}
                  title="Volume Control"
                />
              </div>
            </div>
            <div className="progress-container">
              <div 
                className="progress-bar-container"
                onClick={handleProgressBarClick}
              >
                <div 
                  className="progress-bar" 
                  style={{ width: `${totalTime > 0 ? (currentTime / totalTime) * 100 : 0}%` }}
                ></div>
              </div>
              <div className="time-display">
                <span id="current-time">{formatTime(currentTime)}</span>
                <span id="total-time">{formatTime(totalTime)}</span>
              </div>
            </div>
          </div>
        </div>

        <h2 className="section-title">{t('chooseTheme')}</h2>
        
        <div className="theme-grid">
          {themes.slice(0, visibleThemes).map((theme) => (
            <div
              key={theme.id}
              className={`theme-card ${currentStory === theme.id ? 'active' : ''}`}
              onClick={() => loadStory(theme.id, currentLanguage)}
            >
              <div className="theme-icon">
                <i className={theme.icon || 'fas fa-book'}></i>
              </div>
              <h3 className="theme-title">{theme.title}</h3>
              <p className="theme-description">{theme.description}</p>
              <div className="theme-meta">
                <span className="theme-level">{theme.level || 'Intermediário'}</span>
                <span className="theme-duration">{theme.duration || '5 min'}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Theme Controls */}
        <div className="theme-controls">
          {visibleThemes < themes.length && (
            <button onClick={loadMoreStories} className="btn btn-secondary">
              {t('loadMore', 'Carregar Mais')} ({themes.length - visibleThemes} restantes)
            </button>
          )}
          
          {visibleThemes > initialThemes && (
            <button onClick={showLessStories} className="btn btn-outline">
              {t('showLess', 'Mostrar Menos')}
            </button>
          )}
        </div>
      </div>

      {/* Hidden Audio Elements */}
      {currentStoryData && currentStoryData.phrases.map((_, index) => (
        <audio
          key={`audio-${currentStory}-${index}`}
          ref={el => {
            if (el) {
              audioRefs.current[index] = el;
              // Initialize retry counter and max retries for this audio element
              el._retryCount = 0;
              el._maxRetries = 4; // MP3 current, WAV current, MP3 en, WAV en
              el._failed = false;
            }
          }}
          preload="none" // Changed from "metadata" to "none" to prevent simultaneous loading
          src={`/audio/stories/${currentLanguage}/${currentStory}/line_${index}.mp3`}
          onLoadedMetadata={() => calculateDurations()}
          onError={(e) => {
            const audio = e.target;
            const currentSrc = audio.src;
            
            // Increment retry counter
            audio._retryCount = (audio._retryCount || 0) + 1;
            const maxRetries = audio._maxRetries || 4; // Fallback value
            
            console.warn(`⚠️ Erro ao carregar áudio JSX linha ${index} em ${currentLanguage} (tentativa ${audio._retryCount}/${maxRetries})`);
            
            // Prevent infinite retry loops
            if (audio._retryCount >= maxRetries) {
              console.error(`❌ Falha ao carregar áudio JSX linha ${index} após todas as tentativas de fallback`);
              // Mark this audio as failed but don't break the app
              audio._failed = true;
              return;
            }
            
            // Add delay between retries to prevent 429 errors
            setTimeout(() => {
              // Sequência de fallback: MP3 atual -> WAV atual -> MP3 inglês -> WAV inglês
              if (currentSrc.includes(`${currentLanguage}/${currentStory}/line_${index}.mp3`)) {
                // Tentar WAV no idioma atual
                console.log(`🔄 Tentando WAV para linha ${index} em ${currentLanguage}`);
                audio.src = `/audio/stories/${currentLanguage}/${currentStory}/line_${index}.wav`;
              } else if (currentSrc.includes(`${currentLanguage}/${currentStory}/line_${index}.wav`) && currentLanguage !== 'en') {
                // Tentar MP3 em inglês
                console.log(`🔄 Tentando MP3 para linha ${index} em inglês`);
                audio.src = `/audio/stories/en/${currentStory}/line_${index}.mp3`;
              } else if (currentSrc.includes(`en/${currentStory}/line_${index}.mp3`)) {
                // Tentar WAV em inglês
                console.log(`🔄 Tentando WAV para linha ${index} em inglês`);
                audio.src = `/audio/stories/en/${currentStory}/line_${index}.wav`;
              } else {
                console.error(`❌ Falha ao carregar áudio JSX linha ${index} após todas as tentativas de fallback`);
                audio._failed = true;
              }
            }, index * 100); // Stagger retries to prevent 429 errors
          }}
          onLoadStart={() => {
            // Reset failed flag when starting to load
            const audio = audioRefs.current[index];
            if (audio) {
              audio._failed = false;
            }
          }}
        />
      ))}
    </div>
  );
};

export default Stories;