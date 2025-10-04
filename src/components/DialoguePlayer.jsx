import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useLogo } from '../hooks/useImageAsset';
import '../styles/dialogues.css';
import '../styles/ui.css';
import '../styles/fullscreen.css';
import './DialoguePlayer.css';

const DialoguePlayer = ({ isHomePage = false }) => {
  const { language: currentLanguage, nativeLanguage, t, translations } = useLanguage();
  const { imageUrl: logoUrl } = useLogo();
  const [pageTitle, setPageTitle] = useState('Diálogos');
  
  console.log('🔍 DialoguePlayer render:', { currentLanguage, nativeLanguage, isHomePage });
  
  // App state
  const [dialogues, setDialogues] = useState({});
  const [currentDialogue, setCurrentDialogue] = useState('morning_routine');
  const [currentDialogueData, setCurrentDialogueData] = useState(null);
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

  // Effect to handle highlighting when currentPhraseIndex changes
  useEffect(() => {
    if (currentPhraseIndex >= 0) {
      highlightCurrentPhrase();
    }
  }, [currentPhraseIndex]);

  // Effect to handle playback when isPlaying state changes
  useEffect(() => {
    if (isPlaying && audioRefs.current.length > 0) {
      const audio = audioRefs.current[currentPhraseIndex];
      if (audio) {
        audio.play();
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    if (data && currentLanguage) {
      // Carregar um diálogo aleatório disponível quando o idioma mudar
      const availableTopics = {
        'en': [
          'airport', 'booking_flight', 'commuting', 'directions', 'eating_out',
          'grocery_shopping', 'hanging_out', 'hotel_checkin', 'household_chores',
          'job_interview', 'local_food', 'lost_luggage', 'morning_routine',
          'public_transport', 'renting_car', 'running_errands', 'sightseeing',
          'travel_tips', 'visiting_family', 'weather_chat', 'weekend_plans'
        ],
        'es': ['la_idea', 'rutinas_autocuidado'],
        'pt': [
          'booking_flight', 'commuting', 'eating_out', 'grocery_shopping',
          'household_chores', 'morning_routine', 'weekend_plans'
        ],
        'de': ['booking_flight', 'eating_out', 'grocery_shopping', 'morning_routine'],
        'fr': ['booking_flight', 'eating_out', 'grocery_shopping', 'morning_routine'],
        'hi': ['booking_flight', 'eating_out', 'grocery_shopping', 'morning_routine'],
        'it': ['booking_flight', 'eating_out', 'grocery_shopping', 'morning_routine'],
        'ja': ['booking_flight', 'eating_out', 'grocery_shopping', 'morning_routine'],
        'ko': ['booking_flight', 'eating_out', 'grocery_shopping', 'morning_routine'],
        'ru': ['booking_flight', 'eating_out', 'grocery_shopping', 'morning_routine'],
        'zh': ['booking_flight', 'eating_out', 'grocery_shopping', 'morning_routine']
      };
      
      const currentLanguageTopics = availableTopics[currentLanguage] || availableTopics['en'];
      const randomIndex = Math.floor(Math.random() * currentLanguageTopics.length);
      const randomTopicId = currentLanguageTopics[randomIndex];
      
      console.log('Mudança de idioma detectada. Carregando diálogo aleatório:', randomTopicId, 'para idioma:', currentLanguage);
      loadDialogue(randomTopicId, currentLanguage);
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
    console.log('🔄 useEffect [nativeLanguage] triggered:', { nativeLanguage, hasDialogueData: !!currentDialogueData });
    if (currentDialogueData && nativeLanguage) {
      console.log('✅ Updating translations for native language:', nativeLanguage);
      ensureTranslations(currentDialogueData);
      setCurrentDialogueData({...currentDialogueData}); // Force re-render
    } else {
      console.log('❌ Cannot update translations:', { hasDialogueData: !!currentDialogueData, nativeLanguage });
    }
  }, [nativeLanguage]);

  // useEffect para atualizar o título da página
  useEffect(() => {
    const newTitle = t('pageTitle', 'Diálogos');
    setPageTitle(newTitle);
  }, [t, currentLanguage, nativeLanguage, translations]);
  
  // Force re-render when translations are loaded
  useEffect(() => {
    if (translations && Object.keys(translations).length > 0) {
      // Force component re-render when translations are available
      setLoading(prev => prev); // Trigger re-render
    }
  }, [translations]);

  // Effect to start playback when isPlaying becomes true or currentPhraseIndex changes during playback
  useEffect(() => {
    if (isPlaying && isSequentialPlay && audioRefs.current.length > 0) {
      console.log("🎬 useEffect detected sequential playback needed, calling playPhrase");
      playPhrase(currentPhraseIndex);
    }
  }, [isPlaying, currentPhraseIndex, isSequentialPlay]);

  const init = async () => {
    try {
      setLoading(true);
      await loadData();
      
      // Carregar um diálogo aleatório disponível na inicialização
      const availableTopics = {
        'en': [
          'airport', 'booking_flight', 'commuting', 'directions', 'eating_out',
          'grocery_shopping', 'hanging_out', 'hotel_checkin', 'household_chores',
          'job_interview', 'local_food', 'lost_luggage', 'morning_routine',
          'public_transport', 'renting_car', 'running_errands', 'sightseeing',
          'travel_tips', 'visiting_family', 'weather_chat', 'weekend_plans'
        ],
        'es': ['la_idea', 'rutinas_autocuidado'],
        'pt': [
          'booking_flight', 'commuting', 'eating_out', 'grocery_shopping',
          'household_chores', 'morning_routine', 'weekend_plans'
        ],
        'de': ['booking_flight', 'eating_out', 'grocery_shopping', 'morning_routine'],
        'fr': ['booking_flight', 'eating_out', 'grocery_shopping', 'morning_routine'],
        'hi': ['booking_flight', 'eating_out', 'grocery_shopping', 'morning_routine'],
        'it': ['booking_flight', 'eating_out', 'grocery_shopping', 'morning_routine'],
        'ja': ['booking_flight', 'eating_out', 'grocery_shopping', 'morning_routine'],
        'ko': ['booking_flight', 'eating_out', 'grocery_shopping', 'morning_routine'],
        'ru': ['booking_flight', 'eating_out', 'grocery_shopping', 'morning_routine'],
        'zh': ['booking_flight', 'eating_out', 'grocery_shopping', 'morning_routine']
      };
      
      const currentLanguageTopics = availableTopics[currentLanguage] || availableTopics['en'];
      const randomIndex = Math.floor(Math.random() * currentLanguageTopics.length);
      const randomTopicId = currentLanguageTopics[randomIndex];
      
      console.log('Carregando diálogo inicial aleatório:', randomTopicId, 'para idioma:', currentLanguage);
      await loadDialogue(randomTopicId, currentLanguage);
      
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

  // Função para verificar se um tópico tem conteúdo disponível
  const isTopicAvailable = (topicId, language) => {
    // Lista de tópicos disponíveis por idioma baseada nos arquivos existentes
    const availableTopics = {
      'en': [
        'airport', 'booking_flight', 'commuting', 'directions', 'eating_out',
        'grocery_shopping', 'hanging_out', 'hotel_checkin', 'household_chores',
        'job_interview', 'local_food', 'lost_luggage', 'morning_routine',
        'public_transport', 'renting_car', 'running_errands', 'sightseeing',
        'travel_tips', 'visiting_family', 'weather_chat', 'weekend_plans'
      ],
      'es': ['la_idea', 'rutinas_autocuidado'],
      'pt': [
        'booking_flight', 'commuting', 'eating_out', 'grocery_shopping',
        'household_chores', 'morning_routine', 'weekend_plans'
      ],
      'de': ['booking_flight', 'eating_out', 'grocery_shopping', 'morning_routine'],
      'fr': ['booking_flight', 'eating_out', 'grocery_shopping', 'morning_routine'],
      'hi': ['booking_flight', 'eating_out', 'grocery_shopping', 'morning_routine'],
      'it': ['booking_flight', 'eating_out', 'grocery_shopping', 'morning_routine'],
      'ja': ['booking_flight', 'eating_out', 'grocery_shopping', 'morning_routine'],
      'ko': ['booking_flight', 'eating_out', 'grocery_shopping', 'morning_routine'],
      'ru': ['booking_flight', 'eating_out', 'grocery_shopping', 'morning_routine'],
      'zh': ['booking_flight', 'eating_out', 'grocery_shopping', 'morning_routine']
    };
    
    return availableTopics[language]?.includes(topicId) || false;
  };

  // Função para carregar um diálogo aleatório disponível
  const loadRandomDialogue = async () => {
    const availableTopics = {
      'en': [
        'airport', 'booking_flight', 'commuting', 'directions', 'eating_out',
        'grocery_shopping', 'hanging_out', 'hotel_checkin', 'household_chores',
        'job_interview', 'local_food', 'lost_luggage', 'morning_routine',
        'public_transport', 'renting_car', 'running_errands', 'sightseeing',
        'travel_tips', 'visiting_family', 'weather_chat', 'weekend_plans'
      ],
      'es': ['la_idea', 'rutinas_autocuidado'],
      'pt': [
        'booking_flight', 'commuting', 'eating_out', 'grocery_shopping',
        'household_chores', 'morning_routine', 'weekend_plans'
      ],
      'de': ['booking_flight', 'eating_out', 'grocery_shopping', 'morning_routine'],
      'fr': ['booking_flight', 'eating_out', 'grocery_shopping', 'morning_routine'],
      'hi': ['booking_flight', 'eating_out', 'grocery_shopping', 'morning_routine'],
      'it': ['booking_flight', 'eating_out', 'grocery_shopping', 'morning_routine'],
      'ja': ['booking_flight', 'eating_out', 'grocery_shopping', 'morning_routine'],
      'ko': ['booking_flight', 'eating_out', 'grocery_shopping', 'morning_routine'],
      'ru': ['booking_flight', 'eating_out', 'grocery_shopping', 'morning_routine'],
      'zh': ['booking_flight', 'eating_out', 'grocery_shopping', 'morning_routine']
    };

    const currentLanguageTopics = availableTopics[currentLanguage] || [];
    
    if (currentLanguageTopics.length === 0) {
      console.log('Nenhum tópico disponível para o idioma:', currentLanguage);
      return;
    }

    // Capturar o estado de fullscreen ANTES de qualquer operação
    const wasInFullscreen = isFullscreen;
    console.log('Estado fullscreen antes do carregamento:', wasInFullscreen);

    // Selecionar um tópico aleatório
    const randomIndex = Math.floor(Math.random() * currentLanguageTopics.length);
    const randomTopicId = currentLanguageTopics[randomIndex];
    
    console.log('Carregando diálogo aleatório:', randomTopicId, 'para idioma:', currentLanguage);
    
    try {
      // Preservar o estado de fullscreen durante todo o processo
      if (wasInFullscreen) {
        console.log('Preservando fullscreen durante carregamento...');
        
        // Aplicar e manter fullscreen durante todo o processo
        const maintainFullscreen = () => {
          const dialogueContainer = document.querySelector('.dialogue-container');
          if (dialogueContainer && !dialogueContainer.classList.contains('mobile-fullscreen')) {
            dialogueContainer.classList.add('mobile-fullscreen');
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
        
        // Carregar o novo diálogo
        await loadDialogue(randomTopicId, currentLanguage);
        
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
        await loadDialogue(randomTopicId, currentLanguage);
      }
    } catch (error) {
      console.error('Erro ao carregar diálogo aleatório:', error);
    }
  };

  // Função para filtrar temas por idioma
  const getFilteredThemes = (data, language) => {
    if (!data || !data.themes) {
      return [];
    }
    
    // Verificar se a nova estrutura existe (themes como objeto com chaves de idioma)
    if (data.themes && typeof data.themes === 'object' && !Array.isArray(data.themes)) {
      const themesForLanguage = data.themes[language] || data.themes['en'] || [];
      return themesForLanguage;
    }
    
    // Fallback para estrutura antiga (array de temas)
    if (Array.isArray(data.themes)) {
      if (language === 'es') {
        // Filtrar temas em espanhol pela propriedade language ou pelo título
        return data.themes.filter(theme => 
          theme.language === 'es' || 
          (theme.title && (
            theme.title.includes('Emprendimiento') ||
            theme.title.includes('Bienestar') ||
            theme.title.includes('Tecnología e Inteligencia') ||
            theme.title.includes('Viajes y Turismo') ||
            theme.title.includes('Gastronomía')
          ))
        );
      } else {
        // Para inglês ou outros idiomas, filtrar por language ou assumir inglês se não especificado
        return data.themes.filter(theme => 
          !theme.language || theme.language === language
        );
      }
    }
    
    return [];
  };

  const loadDialogue = async (dialogueId, language = 'en') => {
    setLoading(true);
    try {
      const txtContent = await loadDialogueTxt(dialogueId, language);
      
      if (txtContent) {
        const parsedDialogue = parseDialogueTxt(txtContent);
        
        // Ensure translations
        ensureTranslations(parsedDialogue);
        
        setCurrentDialogueData(parsedDialogue);
        setCurrentDialogue(dialogueId);
        
        // Reset player state
        stopDialogue();
        
        // Preload audios
        await preloadAudios(dialogueId, language, parsedDialogue);
        console.log('Dialogue loaded successfully');
      } else {
        throw new Error('No content loaded from dialogue file');
      }
    } catch (err) {
      console.error('Error loading dialogue:', err);
      setError('Failed to load dialogue');
    } finally {
      setLoading(false);
    }
  };

  const loadDialogueTxt = async (dialogueId, language) => {
    try {
      const url = `/dialogues/${language}/${dialogueId}.txt`;
      console.log('Fetching dialogue from:', url);
      const response = await fetch(url);
      console.log('Response status:', response.status, response.ok);
      
      if (!response.ok) {
        // Try fallback language
        const fallbackUrl = `/dialogues/en/${dialogueId}.txt`;
        console.log('Trying fallback URL:', fallbackUrl);
        const fallbackResponse = await fetch(fallbackUrl);
        console.log('Fallback response status:', fallbackResponse.status, fallbackResponse.ok);
        
        if (!fallbackResponse.ok) throw new Error('Dialogue not found');
        const content = await fallbackResponse.text();
        console.log('Fallback content length:', content.length);
        return content;
      }
      const content = await response.text();
      console.log('Content length:', content.length);
      return content;
    } catch (err) {
      console.error('Error loading dialogue txt:', err);
      return null;
    }
  };

  const parseDialogueTxt = (content) => {
    const lines = content.split('\n').filter(line => line.trim());
    const dialogue = { title: '', phrases: [] };
    let currentPhrase = null;
    
    for (const line of lines) {
      if (line.startsWith('title:')) {
        dialogue.title = line.replace('title:', '').trim();
      } else if (line.startsWith('speaker:')) {
        // If we have a previous phrase, save it
        if (currentPhrase) {
          dialogue.phrases.push(currentPhrase);
        }
        // Start new phrase
        currentPhrase = {
          speaker: line.replace('speaker:', '').trim(),
          text: '',
          translation: '',
          translations: {}
        };
      } else if (line.startsWith('text:')) {
        if (currentPhrase) {
          currentPhrase.text = line.replace('text:', '').trim();
        }
      } else if (line.includes(':') && currentPhrase) {
        // This is a translation line (e.g., "pt: Portuguese text")
        const colonIndex = line.indexOf(':');
        const langCode = line.substring(0, colonIndex).trim();
        const translationText = line.substring(colonIndex + 1).trim();
        
        currentPhrase.translations[langCode] = translationText;
        
        // Set the translation for the current native language
        if (langCode === nativeLanguage) {
          currentPhrase.translation = translationText;
        }
      }
    }
    
    // Don't forget the last phrase
    if (currentPhrase) {
      dialogue.phrases.push(currentPhrase);
    }
    
    return dialogue;
  };

  const ensureTranslations = (dialogue) => {
    if (!dialogue.phrases) return;
    
    console.log('🔄 ensureTranslations called with nativeLanguage:', nativeLanguage);
    
    dialogue.phrases.forEach((phrase, index) => {
      // Update translation based on current native language
      if (phrase.translations && phrase.translations[nativeLanguage]) {
        phrase.translation = phrase.translations[nativeLanguage];
        console.log(`✅ Translation found for phrase ${index}:`, phrase.translation);
      } else if (!phrase.translation && data?.translations?.[nativeLanguage]) {
        const key = phrase.text.toLowerCase().replace(/[^a-z0-9]/g, '_');
        phrase.translation = data.translations[nativeLanguage][key] || '';
        console.log(`🔍 Fallback translation for phrase ${index}:`, phrase.translation);
      } else {
        console.log(`❌ No translation found for phrase ${index}. Available translations:`, Object.keys(phrase.translations || {}));
      }
    });
  };

  const preloadAudios = async (dialogueId, language, dialogueData = null) => {
    const dataToUse = dialogueData || currentDialogueData;
    console.log('🔄 preloadAudios called with:', { dialogueId, language, hasDialogueData: !!dialogueData, phrasesCount: dataToUse?.phrases?.length });
    console.log('🔍 Current state:', { currentDialogue, currentLanguage, volume });
    if (!dataToUse?.phrases) {
      console.error('❌ No dialogue data or phrases available for preloading audios');
      return;
    }
    
    // Only create audio paths for existing phrases (0 to phrases.length - 1)
    const audioPaths = dataToUse.phrases.map((_, index) => 
      `/audio/dialogues/${language}/${dialogueId}/line_${index}.mp3`
    );
    console.log('📁 Audio paths will be:', audioPaths);
    console.log('🎯 Testing first audio path accessibility...');
    
    // Test if first audio is accessible
    try {
      const testResponse = await fetch(audioPaths[0], { method: 'HEAD' });
      console.log('🎵 First audio test result:', { status: testResponse.status, ok: testResponse.ok, url: audioPaths[0] });
    } catch (testError) {
      console.error('❌ First audio test failed:', testError);
    }
    
    // Initialize loading progress
    setAudioLoadingProgress({ current: 0, total: dataToUse.phrases.length, isLoading: true });
    
    // Clear existing audio elements
    audioRefs.current = [];
    phraseDurations.current = [];
    
    // Create and preload audio elements
    const audioPromises = audioPaths.map((audioPath, index) => {
      return new Promise((resolve) => {
        const audio = new Audio();
        audio.preload = 'auto';
        audio.volume = volume;
        
        const handleCanPlayThrough = () => {
          console.log(`✅ Audio ${index} loaded successfully:`, audioPath);
          phraseDurations.current[index] = audio.duration;
          setAudioLoadingProgress(prev => ({ ...prev, current: prev.current + 1 }));
          resolve(audio);
        };
        
        const handleError = (e) => {
          console.error(`❌ Error loading audio ${index}:`, audioPath, e);
          setAudioLoadingProgress(prev => ({ ...prev, current: prev.current + 1 }));
          resolve(null); // Resolve with null instead of rejecting
        };
        
        audio.addEventListener('canplaythrough', handleCanPlayThrough, { once: true });
        audio.addEventListener('error', handleError, { once: true });
        
        audio.src = audioPath;
        audioRefs.current[index] = audio;
      });
    });
    
    // Wait for all audios to load (or fail)
    const loadedAudios = await Promise.all(audioPromises);
    console.log('🎵 Audio loading completed. Loaded audios:', loadedAudios.filter(Boolean).length, 'of', audioPaths.length);
    
    // Calculate total time
    const totalDuration = phraseDurations.current.reduce((sum, duration) => sum + (duration || 0), 0);
    setTotalTime(totalDuration);
    console.log('⏱️ Total dialogue duration:', totalDuration, 'seconds');
    
    // Finish loading
    setAudioLoadingProgress({ current: dataToUse.phrases.length, total: dataToUse.phrases.length, isLoading: false });
  };

  const setupEventListeners = () => {
    // Add any global event listeners here if needed
  };

  const playDialogue = () => {
    if (!currentDialogueData?.phrases || audioRefs.current.length === 0) {
      console.log('No dialogue data or audio available');
      return;
    }
    
    console.log('🎬 playDialogue called - starting sequential playback');
    setIsSequentialPlay(true);
    setIsPlaying(true);
    setCurrentPhraseIndex(0);
  };

  const playPhrase = (index) => {
    if (!audioRefs.current[index]) {
      console.log('Audio not available for phrase', index);
      return;
    }
    
    console.log('🎵 playPhrase called:', { index, isSequentialPlay, totalPhrases: currentDialogueData?.phrases?.length });
    
    // Stop any currently playing audio
    audioRefs.current.forEach(audio => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
    
    setCurrentPhraseIndex(index);
    setIsPlaying(true);
    isPlayingPhraseRef.current = true;
    
    // Highlight current phrase and scroll to it
    highlightCurrentPhrase();
    
    const audio = audioRefs.current[index];
    audio.volume = isMuted ? 0 : volume;
    
    // Capturar o valor atual de isSequentialPlay no momento da criação do handler
    const shouldPlaySequentially = isSequentialPlay;
    
    const handleEnded = () => {
      console.log('🎵 Audio ended:', { 
        index, 
        isPlayingPhraseRef: isPlayingPhraseRef.current, 
        shouldPlaySequentially, 
        hasNextPhrase: index < currentDialogueData.phrases.length - 1 
      });
      
      // Move to next phrase only if playing in sequence mode
      if (isPlayingPhraseRef.current && shouldPlaySequentially && index < currentDialogueData.phrases.length - 1) {
        console.log('🎵 Moving to next phrase:', index + 1);
        playPhrase(index + 1);
      } else {
        console.log('🎵 Stopping playback - end of sequence or not sequential');
        // Se não está em modo sequencial ou chegou ao fim, parar reprodução
        setIsPlaying(false);
        isPlayingPhraseRef.current = false;
        setIsSequentialPlay(false); // Desativar reprodução sequencial
        removeAllHighlights();
      }
    };
    
    audio.addEventListener('ended', handleEnded, { once: true });
    audio.play().catch(console.error);
    
    // Start progress tracking
    startProgressTracking();
  };

  const pauseDialogue = () => {
    setIsPlaying(false);
    isPlayingPhraseRef.current = false;
    setIsSequentialPlay(false); // Desativar reprodução sequencial ao pausar
    
    audioRefs.current.forEach(audio => {
      if (audio) {
        audio.pause();
      }
    });
    
    stopProgressTracking();
    removeAllHighlights();
  };

  const stopDialogue = () => {
    setIsPlaying(false);
    setCurrentPhraseIndex(0);
    setCurrentTime(0);
    isPlayingPhraseRef.current = false;
    
    audioRefs.current.forEach(audio => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
    
    stopProgressTracking();
    removeAllHighlights();
  };

  const highlightCurrentPhrase = () => {
    removeAllHighlights();
    const messageElements = document.querySelectorAll('.message');
    if (messageElements[currentPhraseIndex]) {
      messageElements[currentPhraseIndex].classList.add('highlighted');
      
      // Auto-scroll to center the active phrase
      setTimeout(() => {
        messageElements[currentPhraseIndex].scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'nearest'
        });
      }, 50);
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

  const handleProgressBarClick = (e) => {
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const targetTime = percentage * totalTime;
    
    // Find which phrase this time corresponds to
    let accumulatedTime = 0;
    let targetPhraseIndex = 0;
    
    for (let i = 0; i < phraseDurations.current.length; i++) {
      if (accumulatedTime + phraseDurations.current[i] > targetTime) {
        targetPhraseIndex = i;
        break;
      }
      accumulatedTime += phraseDurations.current[i];
    }
    
    const offsetInPhrase = targetTime - accumulatedTime;
    setCurrentPhraseIndex(targetPhraseIndex);
    
    const audio = audioRefs.current[targetPhraseIndex];
    if (audio) {
      audio.currentTime = Math.max(0, Math.min(offsetInPhrase, audio.duration));
      if (isPlaying) {
        audio.play();
      }
    }
  };

  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume);
    audioRefs.current.forEach(audio => {
      if (audio) {
        audio.volume = isMuted ? 0 : newVolume;
      }
    });
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      setVolume(lastVolume);
      audioRefs.current.forEach(audio => {
        if (audio) {
          audio.volume = lastVolume;
        }
      });
    } else {
      setLastVolume(volume);
      setIsMuted(true);
      setVolume(0);
      audioRefs.current.forEach(audio => {
        if (audio) {
          audio.volume = 0;
        }
      });
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    
    const dialogueContainer = document.querySelector('.dialogue-container');
    if (!isFullscreen) {
      // Enter fullscreen
      dialogueContainer?.classList.add('mobile-fullscreen');
      document.body.classList.add('fullscreen-body');
      
      // Hide elements
      const elementsToHide = document.querySelectorAll('.navbar, .tooltip, .user-dropdown, .language-selector, .section-title, .theme-grid, .theme-controls');
      elementsToHide.forEach(el => {
        el.classList.add('fullscreen-hidden');
      });
    } else {
      // Exit fullscreen
      dialogueContainer?.classList.remove('mobile-fullscreen');
      document.body.classList.remove('fullscreen-body');
      
      // Show elements
      const elementsToShow = document.querySelectorAll('.fullscreen-hidden');
      elementsToShow.forEach(el => {
        el.classList.remove('fullscreen-hidden');
      });
    }
    
    // Trigger resize event for any responsive adjustments
    window.dispatchEvent(new Event('resize'));
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="audio-loading-overlay">
        <div className="audio-loading-content">
          <div className="linguanova-loading-animation">
            <div className="linguanova-logo-container">
              <div className="linguanova-logo">
                <img src={logoUrl} alt="LinguaNova Logo" style={{width: '100%', height: '100%'}} />
              </div>
            </div>
            <div className="linguanova-loading-text">
              {t('loadingAudio') || 'Carregando áudio premium...'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button onClick={init}>{t('retry')}</button>
      </div>
    );
  }

  return (
    <div className="content-below-navbar">
      <div className="container">
        <div className="dialogue-container">
          <h2 className="dialogue-title">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>{currentDialogueData?.title || pageTitle}</span>
          </h2>
          
          <div id="dialogue-content" className={showTranslations ? 'show-translations' : ''}>
            {currentDialogueData?.phrases?.map((phrase, index) => (
              <div 
                key={index} 
                className={`message message-${index % 2 === 0 ? 'other' : 'user'} ${currentPhraseIndex === index && isPlaying ? 'highlighted' : ''}`}
                data-index={index}
                onClick={(e) => {
                  // Sempre permitir clique na bolha - parar reprodução sequencial e tocar frase individual
                  setIsSequentialPlay(false); // Desativar modo sequencial
                  setIsPlaying(false); // Parar qualquer reprodução atual
                  
                  // Parar todos os áudios
                  audioRefs.current.forEach(audio => {
                    if (audio) {
                      audio.pause();
                      audio.currentTime = 0;
                    }
                  });
                  
                  // Tocar apenas a frase clicada
                  playPhrase(index);
                  e.stopPropagation();
                }}
              >
                <div className="message-info">
                  <span className="message-sender">{phrase.speaker}</span>
                  <span className="message-time">{formatTime(phraseDurations.current[index] || 0)}</span>
                </div>
                <div className="message-content">
                  <div className="message-text">{phrase.text}</div>
                  {showTranslations && phrase.translation && (
                    <div className="translation-text">
                      {phrase.translation}
                    </div>
                  )}
                    {showTranslations && !phrase.translation && (
                    <div className="translation-text" style={{ color: 'var(--translation-primary)', fontStyle: 'italic' }}>
                      Tradução não disponível
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="media-player">
            <div className="player-controls">
              <button 
                className={`control-btn play-pause-btn ${isPlaying ? 'playing' : ''}`}
                onClick={isPlaying ? pauseDialogue : playDialogue}
                disabled={!currentDialogueData?.phrases?.length}
              >
                {isPlaying ? (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                )}
              </button>

              <button 
                className="control-btn stop-btn"
                onClick={stopDialogue}
                disabled={!currentDialogueData?.phrases?.length}
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 6h12v12H6z"/>
                </svg>
              </button>

              {!isHomePage && (
                <button 
                  className="control-btn random-btn"
                  onClick={loadRandomDialogue}
                  title={t('randomDialogue') || 'Diálogo Aleatório'}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
                  </svg>
                </button>
              )}

              <button 
                  className={`control-btn translations-btn ${showTranslations ? 'active' : ''}`}
                  onClick={() => setShowTranslations(!showTranslations)}
                  title={t('toggleTranslations') || 'Mostrar/Ocultar Traduções'}
                >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
                </svg>
              </button>

              {!isHomePage && (
                <button 
                  className={`control-btn fullscreen-btn ${isFullscreen ? 'active' : ''}`}
                  onClick={toggleFullscreen}
                  title={t('toggleFullscreen') || 'Tela Cheia'}
                >
                  {isFullscreen ? (
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                    </svg>
                  )}
                </button>
              )}

              {!isHomePage && (
                <div className="volume-control">
                  <button 
                    className="control-btn volume-btn"
                    onClick={toggleMute}
                    onMouseEnter={() => setShowVolumePopup(true)}
                    onMouseLeave={() => setShowVolumePopup(false)}
                  >
                    {isMuted || volume === 0 ? (
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                      </svg>
                    ) : volume < 0.5 ? (
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                      </svg>
                    )}
                  </button>
                  
                  {showVolumePopup && (
                    <div className="volume-popup">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={volume}
                        onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                        className="volume-slider"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="progress-container">
              <div 
                className="progress-bar-container"
                onClick={handleProgressBarClick}
              >
                <div 
                  className="progress-bar" 
                  style={{ 
                    width: `${totalTime > 0 ? (currentTime / totalTime) * 100 : 0}%`
                  }}
                ></div>
              </div>
              <div className="time-display">
                <span className="current-time">{formatTime(currentTime)}</span>
                <span className="total-time">{formatTime(totalTime)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DialoguePlayer;