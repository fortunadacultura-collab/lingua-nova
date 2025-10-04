import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useLogo } from '../hooks/useImageAsset';
import '../styles/dialogues.css';
import '../styles/ui.css';
import '../styles/fullscreen.css';
import './DialoguePlayer.css';

const StoryPlayer = ({ storyId = null, onBack = null, isHomePage = false }) => {
  const { language: currentLanguage, nativeLanguage, t, translations } = useLanguage();
  const { imageUrl: logoUrl } = useLogo();
  const [pageTitle, setPageTitle] = useState('Histórias');
  
  // App state
  const [stories, setStories] = useState({});
  const [currentStory, setCurrentStory] = useState('the_last_ride');
  const [currentStoryData, setCurrentStoryData] = useState(null);
  const [themes, setThemes] = useState([]);
  const [visibleThemes, setVisibleThemes] = useState(3);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  // Media player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [lastVolume, setLastVolume] = useState(0.7);
  const [showTranslations, setShowTranslations] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showVolumePopup, setShowVolumePopup] = useState(false);
  const [audioLoadingProgress, setAudioLoadingProgress] = useState({ current: 0, total: 0, isLoading: false });
  const [isSequentialPlay, setIsSequentialPlay] = useState(false); // Nova variável para controlar reprodução sequencial

  const audioRefs = useRef([]);
  const progressIntervalRef = useRef(null);
  const phraseDurations = useRef([]);
  const isPlayingPhraseRef = useRef(false);

  useEffect(() => {
    init();
  }, []);

  // Load initial story if storyId is provided
  useEffect(() => {
    if (storyId && currentLanguage) {
      loadStory(storyId, currentLanguage);
    }
  }, [storyId, currentLanguage]);

  // Effect to handle highlighting when currentPhraseIndex changes
  useEffect(() => {
    if (currentPhraseIndex >= 0 && !showTranslations) {
      highlightCurrentPhrase();
    }
  }, [currentPhraseIndex, showTranslations]);

  // Simple effect to handle playback when isPlaying state changes
  useEffect(() => {
    if (isPlaying && audioRefs.current.length > 0) {
      const audio = audioRefs.current[currentPhraseIndex];
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(error => {
          console.error('Error playing audio:', error);
        });
      }
    }
  }, [isPlaying, currentPhraseIndex]);

  // Effect to handle sequential playback
  useEffect(() => {
    if (isPlaying && isSequentialPlay && audioRefs.current.length > 0) {
      playCurrentPhrase();
    }
  }, [isPlaying, currentPhraseIndex, isSequentialPlay]);



  useEffect(() => {
    if (data && currentLanguage) {
      // Carregar uma história aleatória disponível quando o idioma mudar
      const availableStories = {
        'en': ['the_last_ride'],
        'es': [],
        'pt': [],
        'fr': []
      };
      
      const currentLanguageStories = availableStories[currentLanguage] || availableStories['en'];
      if (currentLanguageStories.length > 0) {
        const randomIndex = Math.floor(Math.random() * currentLanguageStories.length);
        const randomStoryId = currentLanguageStories[randomIndex];
        
        console.log('Mudança de idioma detectada. Carregando história aleatória:', randomStoryId, 'para idioma:', currentLanguage);
        loadStory(randomStoryId, currentLanguage);
      }
    }
  }, [currentLanguage, data]);

  // Efeito para recarregar temas quando o idioma mudar
  useEffect(() => {
    if (data && currentLanguage) {
      const filteredThemes = getFilteredThemes(data, currentLanguage);
      setThemes(filteredThemes);
      setVisibleThemes(3); // Reset para mostrar apenas 3 temas inicialmente
    }
  }, [currentLanguage, data]);

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
  }, [t, currentLanguage, nativeLanguage, translations]);
  
  // Force re-render when translations are loaded
  useEffect(() => {
    if (translations && Object.keys(translations).length > 0) {
      // Force component re-render when translations are available
      setLoading(prev => prev); // Trigger re-render
    }
  }, [translations]);

  const init = async () => {
    try {
      setLoading(true);
      await loadData();
      
      // Só carregar história aleatória se um storyId específico foi fornecido
      // ou se estamos na página inicial
      if (storyId || isHomePage) {
        const availableStories = {
          'en': ['the_last_ride'],
          'es': [],
          'pt': [],
          'fr': []
        };
        
        const currentLanguageStories = availableStories[currentLanguage] || availableStories['en'];
        if (currentLanguageStories.length > 0) {
          const targetStoryId = storyId || currentLanguageStories[Math.floor(Math.random() * currentLanguageStories.length)];
          
          console.log('Carregando história:', targetStoryId, 'para idioma:', currentLanguage);
          await loadStory(targetStoryId, currentLanguage);
        }
      }
      
      setupEventListeners();
    } catch (err) {
      setError('Failed to initialize app');
      console.error('Error initializing app:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      const response = await fetch('/data/data.json');
      const jsonData = await response.json();
      setData(jsonData);
      
      // Filtrar temas baseado no idioma atual
      const filteredThemes = getFilteredThemes(jsonData, currentLanguage);
      setThemes(filteredThemes);
    } catch (err) {
      console.error('Error loading data:', err);
      throw err;
    }
  };

  // Função para verificar se uma história tem conteúdo disponível
  const isStoryAvailable = (storyId, language) => {
    // Lista de histórias disponíveis por idioma baseada nos arquivos existentes
    const availableStories = {
      'en': ['the_last_ride'],
      'es': ['the_last_ride'], // Fallback para inglês
      'pt': ['the_last_ride'], // Fallback para inglês
      'fr': ['the_last_ride'], // Fallback para inglês
      'de': ['the_last_ride'], // Fallback para inglês
      'it': ['the_last_ride'], // Fallback para inglês
      'ja': ['the_last_ride'], // Fallback para inglês
      'ko': ['the_last_ride'], // Fallback para inglês
      'zh': ['the_last_ride'], // Fallback para inglês
      'ru': ['the_last_ride'], // Fallback para inglês
      'hi': ['the_last_ride']  // Fallback para inglês
    };
    
    return availableStories[language]?.includes(storyId) || false;
  };

  // Função para carregar uma história aleatória disponível
  const loadRandomStory = async () => {
    const availableStories = {
      'en': ['the_last_ride'],
      'es': ['the_last_ride'], // Fallback para inglês
      'pt': ['the_last_ride'], // Fallback para inglês
      'fr': ['the_last_ride'], // Fallback para inglês
      'de': ['the_last_ride'], // Fallback para inglês
      'it': ['the_last_ride'], // Fallback para inglês
      'ja': ['the_last_ride'], // Fallback para inglês
      'ko': ['the_last_ride'], // Fallback para inglês
      'zh': ['the_last_ride'], // Fallback para inglês
      'ru': ['the_last_ride'], // Fallback para inglês
      'hi': ['the_last_ride']  // Fallback para inglês
    };

    const currentLanguageStories = availableStories[currentLanguage] || [];
    
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
        
        // Aplicar e manter fullscreen durante todo o processo
        const maintainFullscreen = () => {
          const storyContainer = document.querySelector('.dialogue-container');
          if (storyContainer && !storyContainer.classList.contains('mobile-fullscreen')) {
            storyContainer.classList.add('mobile-fullscreen');
            document.body.classList.add('fullscreen-body');
            
            // Ocultar elementos
            const elementsToHide = document.querySelectorAll('.navbar, .tooltip, .user-dropdown, .language-selector, .section-title, .theme-grid, .theme-controls');
            elementsToHide.forEach(el => {
              el.classList.add('fullscreen-hidden');
            });
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
        // Carregar normalmente sem fullscreen
        await loadStory(randomStoryId, currentLanguage);
      }
    } catch (error) {
      console.error('Erro ao carregar história aleatória:', error);
    }
  };

  const getFilteredThemes = (data, language) => {
    if (!data || !data.themes || !data.themes[language]) {
      return [];
    }
    
    const themes = data.themes[language];
    const availableStories = {
      'en': ['the_last_ride', 'the_trip'],
      'es': [],
      'pt': [],
      'fr': []
    };
    
    const currentLanguageStories = availableStories[language] || [];
    
    // Filtrar apenas temas que têm histórias disponíveis
    return themes.map(theme => ({
      ...theme,
      topics: theme.topics.filter(topic => currentLanguageStories.includes(topic.id))
    })).filter(theme => theme.topics.length > 0);
  };

  const loadStory = async (storyId, language = currentLanguage) => {
    try {
      console.log(`📖 Carregando história: ${storyId} em ${language}`);
      
      // Parar qualquer reprodução atual
      stopPlayback();
      
      // Resetar estados
      setCurrentPhraseIndex(0);
      setCurrentTime(0);
      setTotalTime(0);
      setShowTranslations(false);
      
      // Carregar arquivo de texto da história
      let response = await fetch(`/stories/${language}/${storyId}.txt`);
      
      if (!response.ok && language !== 'en') {
        console.warn(`História não encontrada em ${language}, tentando inglês`);
        response = await fetch(`/stories/en/${storyId}.txt`);
      }
      
      if (!response.ok) {
        throw new Error(`História não encontrada: ${storyId}`);
      }
      
      const text = await response.text();
      const parsedStory = parseStoryTxt(text, storyId);
      
      setCurrentStory(storyId);
      setCurrentStoryData(parsedStory);
      
      // Preload audios
      await preloadAudios(parsedStory.phrases);
      
      // Garantir traduções
      ensureTranslations(parsedStory);
      
      console.log('História carregada com sucesso:', parsedStory);
      
    } catch (error) {
      console.error('Erro ao carregar história:', error);
      setError(`Erro ao carregar história: ${error.message}`);
    }
  };

  // Função para processar o texto da história no formato específico
  const parseStoryTxt = (content, storyId) => {
    const lines = content.split('\n').filter(line => line.trim());
    const phrases = [];
    let currentPhrase = null;
    let title = storyId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('title:')) {
        title = trimmedLine.substring(6).trim();
      } else if (trimmedLine.startsWith('text:')) {
        // Nova frase do narrador
        if (currentPhrase) {
          phrases.push(currentPhrase);
        }
        currentPhrase = {
          speaker: 'Narrator',
          text: trimmedLine.substring(5).trim(),
          translations: {}
        };
      } else if (currentPhrase && trimmedLine.includes(':')) {
        // Tradução para a frase atual
        const colonIndex = trimmedLine.indexOf(':');
        const langCode = trimmedLine.substring(0, colonIndex).trim();
        const translation = trimmedLine.substring(colonIndex + 1).trim();
        currentPhrase.translations[langCode] = translation;
      }
    }
    
    // Adicionar a última frase
    if (currentPhrase) {
      phrases.push(currentPhrase);
    }
    
    return {
      title: title,
      phrases: phrases,
      metadata: {
        duration: phrases.length * 3 // Estimativa de 3 segundos por frase
      }
    };
  };

  const preloadAudios = async (phrases) => {
    if (!phrases || phrases.length === 0) return;
    
    console.log('🔄 Starting audio preload for', phrases.length, 'phrases');
    
    // Reset audio loading progress
    setAudioLoadingProgress({ current: 0, total: phrases.length, isLoading: true });
    
    // Clear existing audio references
    audioRefs.current = [];
    phraseDurations.current = [];
    
    try {
      const allAudioPromises = [];
      
      // Create audio elements for each phrase
      for (let index = 0; index < phrases.length; index++) {
        const promise = new Promise((resolve) => {
          const audio = new Audio();
          audio.preload = 'auto';
          audio.src = `/audio/stories/en/${currentStory}/line_${index}.mp3`;
          audio.volume = volume;
          
          const handleCanPlayThrough = () => {
            console.log(`✅ Audio loaded for line ${index}`);
            audio.removeEventListener('canplaythrough', handleCanPlayThrough);
            audio.removeEventListener('error', handleError);
            audioRefs.current[index] = audio;
            phraseDurations.current[index] = audio.duration || estimateDuration(phrases[index].text);
            setAudioLoadingProgress(prev => ({ ...prev, current: prev.current + 1 }));
            resolve(audio);
          };
          
          const handleError = () => {
            console.warn(`❌ Error loading audio for line ${index}`);
            audio.removeEventListener('canplaythrough', handleCanPlayThrough);
            audio.removeEventListener('error', handleError);
            audioRefs.current[index] = null;
            phraseDurations.current[index] = estimateDuration(phrases[index].text);
            setAudioLoadingProgress(prev => ({ ...prev, current: prev.current + 1 }));
            resolve(null);
          };
          
          audio.addEventListener('canplaythrough', handleCanPlayThrough);
          audio.addEventListener('error', handleError);
        });
        
        allAudioPromises.push(promise);
      }
      
      // Wait for all audios to load
      await Promise.all(allAudioPromises);
      
      // Calculate total duration
      updateTotalTime();
      
      console.log('✅ All audios preloaded successfully');
      setAudioLoadingProgress({ current: 0, total: 0, isLoading: false });
      
    } catch (error) {
      console.error('Error preloading audios:', error);
      setAudioLoadingProgress({ current: 0, total: 0, isLoading: false });
    }
  };

  const updateTotalTime = () => {
    const totalDuration = phraseDurations.current.reduce((sum, duration) => sum + duration, 0);
    setTotalTime(totalDuration);
  };

  const estimateDuration = (text) => {
    // Estimar duração baseada no número de palavras (aproximadamente 0.6 segundos por palavra)
    const wordCount = text.split(' ').length;
    return Math.max(2, wordCount * 0.6);
  };

  const playCurrentPhrase = () => {
    console.log("🎬 Starting sequential playback from phrase:", currentPhraseIndex);
    
    if (currentPhraseIndex < 0 || currentPhraseIndex >= audioRefs.current.length) {
      console.log("❌ Invalid phrase index:", currentPhraseIndex);
      return;
    }
    
    stopAllAudio();
    
    const audio = audioRefs.current[currentPhraseIndex];
    if (!audio) {
      console.warn(`❌ No audio available for phrase ${currentPhraseIndex}, skipping to next`);
      if (currentPhraseIndex < audioRefs.current.length - 1) {
        setCurrentPhraseIndex(prev => prev + 1);
      } else {
        setIsPlaying(false);
        setIsSequentialPlay(false);
      }
      return;
    }
    
    audio.volume = isMuted ? 0 : volume;
    audio.currentTime = 0;
    
    // Handle audio end for sequential playback
    const handleEnded = () => {
      audio.removeEventListener('ended', handleEnded);
      
      if (currentPhraseIndex < audioRefs.current.length - 1) {
        setCurrentPhraseIndex(prev => prev + 1);
      } else {
        console.log("🏁 Reached end of story");
        setIsPlaying(false);
        setIsSequentialPlay(false);
      }
    };
    
    audio.addEventListener('ended', handleEnded);
    
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        console.log('✅ Sequential playback started for phrase:', currentPhraseIndex);
        startProgressTracking();
      }).catch(error => {
        console.error('❌ Error playing audio:', error);
        audio.removeEventListener('ended', handleEnded);
        
        // Skip to next phrase on error
        if (currentPhraseIndex < audioRefs.current.length - 1) {
          setCurrentPhraseIndex(prev => prev + 1);
        } else {
          setIsPlaying(false);
          setIsSequentialPlay(false);
        }
      });
    }
  };

  const playPhrase = (index) => {
    console.log("Playing phrase:", index, "(Single phrase mode)");
    
    if (index < 0 || index >= audioRefs.current.length) return;
    
    stopAllAudio();
    
    setIsPlaying(false);
    setIsSequentialPlay(false);
    setCurrentPhraseIndex(index);
    
    const audio = audioRefs.current[index];
    if (!audio) {
      console.error('Audio not available for this phrase');
      return;
    }
    
    audio.volume = isMuted ? 0 : volume;
    audio.currentTime = 0;
    
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        console.log('✅ Single phrase playback started for index:', index);
        
        const handleEnded = () => {
          audio.removeEventListener('ended', handleEnded);
          console.log('🏁 Single phrase playback ended');
        };
        
        audio.addEventListener('ended', handleEnded);
        
      }).catch(error => {
        console.error('❌ Error playing single phrase:', error);
      });
    }
  };

  const stopStory = () => {
    setIsPlaying(false);
    stopAllAudio();
    removeAllHighlights();
    setCurrentTime(0);
    setCurrentPhraseIndex(0);
    stopProgressTracking();
  };

  const stopAllAudio = () => {
    audioRefs.current.forEach(audio => {
      if (audio && typeof audio.pause === 'function') {
        audio.pause();
        audio.currentTime = 0;
      }
    });
  };

  const ensureTranslations = (storyData) => {
    if (!storyData || !nativeLanguage) return;
    
    storyData.phrases.forEach(phrase => {
      if (!phrase.translations[nativeLanguage]) {
        // Se não há tradução disponível, usar o texto original
        phrase.translations[nativeLanguage] = phrase.text;
      }
    });
  };

  const setupEventListeners = () => {
    // Adicionar listeners para teclado
    document.addEventListener('keydown', handleKeyPress);
    
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  };

  const handleKeyPress = (event) => {
    if (!currentStoryData) return;
    
    switch (event.code) {
      case 'Space':
        event.preventDefault();
        togglePlayback();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        previousPhrase();
        break;
      case 'ArrowRight':
        event.preventDefault();
        nextPhrase();
        break;
      case 'KeyT':
        event.preventDefault();
        toggleTranslations();
        break;
      case 'KeyF':
        event.preventDefault();
        toggleFullscreen();
        break;
    }
  };

  const togglePlayback = () => {
    if (!currentStoryData || audioRefs.current.length === 0) return;
    
    if (isPlaying) {
      stopPlayback();
    } else {
      startPlayback();
    }
  };

  const startPlayback = () => {
    console.log('▶️ Starting playback:', {
      currentPhraseIndex,
      audioRefsLength: audioRefs.current.length,
      currentStoryData: !!currentStoryData
    });
    
    setIsPlaying(true);
    setIsSequentialPlay(true); // Ativar reprodução sequencial
    
    // Não chamar audio.play() diretamente aqui - deixar o useEffect controlar
    // O useEffect será acionado pela mudança de isPlaying e isSequentialPlay
    
    // Iniciar atualização do progresso
    startProgressUpdate();
  };

  const stopPlayback = () => {
    setIsPlaying(false);
    setIsSequentialPlay(false); // Desativar reprodução sequencial
    
    // Parar todos os áudios
    audioRefs.current.forEach(audio => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
    
    // Parar atualização do progresso
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const startProgressUpdate = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    
    progressIntervalRef.current = setInterval(() => {
      if (!isPlaying) return;
      
      const audio = audioRefs.current[currentPhraseIndex];
      if (audio && audio.src) {
        // Calcular tempo total até a frase atual + tempo atual da frase
        const timeUntilCurrentPhrase = phraseDurations.current
          .slice(0, currentPhraseIndex)
          .reduce((sum, duration) => sum + (duration || 0), 0);
        
        setCurrentTime(timeUntilCurrentPhrase + audio.currentTime);
      }
    }, 100);
  };

  const nextPhrase = () => {
    if (!currentStoryData) return;
    
    const nextIndex = Math.min(currentPhraseIndex + 1, currentStoryData.phrases.length - 1);
    setCurrentPhraseIndex(nextIndex);
    
    if (isPlaying) {
      stopPlayback();
      setTimeout(() => {
        setCurrentPhraseIndex(nextIndex);
        startPlayback();
      }, 100);
    }
  };

  const previousPhrase = () => {
    if (!currentStoryData) return;
    
    const prevIndex = Math.max(currentPhraseIndex - 1, 0);
    setCurrentPhraseIndex(prevIndex);
    
    if (isPlaying) {
      stopPlayback();
      setTimeout(() => {
        setCurrentPhraseIndex(prevIndex);
        startPlayback();
      }, 100);
    }
  };

  const highlightCurrentPhrase = () => {
    removeAllHighlights();
    const messageElements = document.querySelectorAll('.message');
    if (messageElements[currentPhraseIndex]) {
      messageElements[currentPhraseIndex].classList.add('highlighted');
    }
  };

  const removeAllHighlights = () => {
    const messageElements = document.querySelectorAll('.message');
    messageElements.forEach(element => {
      element.classList.remove('highlighted');
    });
  };

  const startProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    
    progressIntervalRef.current = setInterval(() => {
      const currentAudio = audioRefs.current[currentPhraseIndex];
      if (currentAudio && !currentAudio.paused) {
        const phraseStartTime = phraseDurations.current
          .slice(0, currentPhraseIndex)
          .reduce((sum, duration) => sum + duration, 0);
        const currentPhraseTime = currentAudio.currentTime;
        const newCurrentTime = phraseStartTime + currentPhraseTime;
        
        setCurrentTime(newCurrentTime);
      }
    }, 100);
  };

  const stopProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Progress bar click handler
  const handleProgressBarClick = (e) => {
    if (!audioRefs.current[currentPhraseIndex] || totalTime === 0) return;
    
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * totalTime;
    
    audioRefs.current[currentPhraseIndex].currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume);
    audioRefs.current.forEach(audio => {
      if (audio) {
        audio.volume = newVolume;
      }
    });
    
    if (newVolume === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
      setLastVolume(newVolume);
    }
  };

  const toggleFullscreen = () => {
    const newFullscreenState = !isFullscreen;
    setIsFullscreen(newFullscreenState);
    
    const storyContainer = document.querySelector('.dialogue-container');
    if (!storyContainer) return;
    
    if (newFullscreenState) {
      // Entrar em fullscreen
      storyContainer.classList.add('mobile-fullscreen');
      document.body.classList.add('fullscreen-body');
      
      // Ocultar elementos
      const elementsToHide = document.querySelectorAll('.navbar, .tooltip, .user-dropdown, .language-selector, .section-title, .theme-grid, .theme-controls');
      elementsToHide.forEach(el => {
        el.classList.add('fullscreen-hidden');
      });
    } else {
      // Sair do fullscreen
      storyContainer.classList.remove('mobile-fullscreen');
      document.body.classList.remove('fullscreen-body');
      
      // Mostrar elementos
      const elementsToShow = document.querySelectorAll('.navbar, .tooltip, .user-dropdown, .language-selector, .section-title, .theme-grid, .theme-controls');
      elementsToShow.forEach(el => {
        el.classList.remove('fullscreen-hidden');
      });
    }
    
    // Trigger resize event
    window.dispatchEvent(new Event('resize'));
  };

  const toggleTranslations = () => {
    setShowTranslations(!showTranslations);
  };

  const toggleMute = () => {
    if (isMuted) {
      handleVolumeChange(lastVolume);
    } else {
      setLastVolume(volume);
      handleVolumeChange(0);
    }
  };

  const loadMoreThemes = () => {
    setVisibleThemes(prev => Math.min(prev + 3, themes.length));
  };

  const showLessThemes = () => {
    setVisibleThemes(3);
  };

  if (loading) {
    return (
      <div className="content-below-navbar">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Carregando histórias...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="content-below-navbar">
        <div className="error-container">
          <p>Erro: {error}</p>
          <button onClick={() => window.location.reload()}>Tentar Novamente</button>
        </div>
      </div>
    );
  }

  return (
    <div className="content-below-navbar">
      <div className="page-title-container">
        <h1 className="page-title">{pageTitle}</h1>
        {onBack && (
          <button className="back-button" onClick={onBack}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {t('backToList', 'Voltar à Lista')}
          </button>
        )}
      </div>

      {/* Story Player Container */}
      {currentStoryData ? (
        <div className="dialogue-container">
          {/* Story Header */}
          {storyId && (
            <div className="dialogue-header">
              <div className="dialogue-info">
                <h2 className="dialogue-title">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 19.5C4 18.1193 5.11929 17 6.5 17H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M6.5 17H20V6.5C20 5.11929 18.8807 4 17.5 4H6.5C5.11929 4 4 5.11929 4 6.5V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M8 8H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M8 11H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  {currentStoryData.title}
                </h2>
                <div className="dialogue-meta">
                  <span className="dialogue-duration">{formatTime(totalTime)}</span>
                  <span className="dialogue-phrases">{currentStoryData.phrases.length} frases</span>
                </div>
              </div>
            </div>
          )}

          {/* Story Content */}
          <div id="dialogue-content">
            {currentStoryData?.phrases?.map((phrase, index) => (
              <div 
                key={index} 
                className={`message message-other ${currentPhraseIndex === index && isPlaying ? 'highlighted' : ''}`}
                data-index={index}
                onClick={(e) => {
                  // Only play single phrase if not in sequence mode
                  if (!isPlaying) {
                    setCurrentPhraseIndex(index);
                  }
                  e.stopPropagation();
                }}
              >
                <div className="message-info">
                  <span className="message-sender">Narrador</span>
                </div>
                <div className="message-text">{phrase.text}</div>
                <div 
                  className="translation-text" 
                  style={{ display: showTranslations && phrase.translations[nativeLanguage] ? 'block' : 'none' }}
                >
                  {phrase.translations[nativeLanguage]}
                </div>
              </div>
            ))}
          </div>

          {/* Media Player */}
          <div className="media-player">
            <div className="player-controls">
              {/* Play/Pause Button */}
              <button 
                className="player-btn" 
                onClick={togglePlayback}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                <i className={`fas fa-${isPlaying ? 'pause' : 'play'}`}></i>
              </button>
              
              {/* Stop Button */}
              <button className="player-btn" onClick={stopPlayback} title="Stop">
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
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
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
      ) : (
        // Quando não há currentStoryData, mostrar apenas a estrutura básica
        <div className="dialogue-container">
          <div id="dialogue-content">
            {/* Conteúdo vazio quando não há história carregada */}
          </div>
        </div>
      )}

      {/* Audio Loading Progress Overlay */}
      {audioLoadingProgress.isLoading && (
        <div className="audio-loading-overlay">
          <div className="media-player-skeleton">
            <div className="skeleton-controls">
              <div className="skeleton-btn"></div>
              <div className="skeleton-btn"></div>
              <div className="skeleton-btn"></div>
              <div className="skeleton-btn"></div>
              <div className="skeleton-btn"></div>
              <div className="skeleton-volume"></div>
            </div>
            <div className="skeleton-progress">
              <div className="skeleton-progress-bar"></div>
              <div className="skeleton-time">
                <div className="skeleton-time-item"></div>
                <div className="skeleton-time-item"></div>
              </div>
            </div>
          </div>
          <div className="loading-animation">
            <div className="loading-spinner"></div>
            <p>Carregando áudios da história...</p>
            <div className="loading-progress">
              <div className="progress-bar-loading">
                <div 
                  className="progress-fill-loading" 
                  style={{ width: `${(audioLoadingProgress.current / audioLoadingProgress.total) * 100}%` }}
                ></div>
              </div>
              <span className="loading-text">
                {audioLoadingProgress.current}/{audioLoadingProgress.total} arquivos
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Volume Popup for Mobile */}
      {showVolumePopup && (
        <div className="volume-popup">
          <div className="volume-popup-content">
            <div className="volume-slider-vertical">
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.1" 
                value={volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                orient="vertical"
              />
            </div>
            <span className="volume-value">{Math.round(volume * 100)}%</span>
          </div>
        </div>
      )}

      {/* Theme Selection - Only show if no specific story is loaded */}
      {!storyId && (
        <div className="container">
          <h2 className="section-title">{t('chooseTheme', 'Escolha Sua Próxima História')}</h2>
          
          <div className="theme-grid">
            {themes.slice(0, visibleThemes).map((theme, themeIndex) => (
              <div key={themeIndex}>
                <h3 className="theme-category">{theme.title}</h3>
                {theme.topics.map((topic, topicIndex) => (
                  <div 
                    key={topicIndex} 
                    className={`theme-card ${currentStory === topic.id ? 'active' : ''}`}
                    onClick={() => loadStory(topic.id, currentLanguage)}
                  >
                    <div className="theme-icon">
                      <i className="fas fa-book-open"></i>
                    </div>
                    <h4>{topic.name}</h4>
                    <div className="story-meta">
                      <span className="story-level">Intermediate</span>
                      <span className="story-time">5-10 min</span>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="theme-controls">
            {visibleThemes < themes.length && (
              <button className="theme-control-btn" onClick={loadMoreThemes}>
                <i className="fas fa-chevron-down"></i>
                <span>{t('loadMore', 'Carregar Mais Histórias')}</span>
              </button>
            )}
            {visibleThemes > 3 && (
              <button className="theme-control-btn" onClick={showLessThemes}>
                <i className="fas fa-chevron-up"></i>
                <span>{t('showLess', 'Mostrar Menos')}</span>
              </button>
            )}
          </div>

          <div className="text-center">
            <a href="/signup" className="cta-button">{t('startLearning', 'Comece a Ler Agora!')}</a>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryPlayer;