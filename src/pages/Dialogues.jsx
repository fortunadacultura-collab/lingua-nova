import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useLogo } from '../hooks/useImageAsset';
import '../styles/dialogues.css';
import '../styles/ui.css';
import '../styles/fullscreen.css';

const Dialogues = () => {
  const { language: currentLanguage, nativeLanguage, t, translations } = useLanguage();
  const { imageUrl: logoUrl } = useLogo();
  const [pageTitle, setPageTitle] = useState('Diálogos');
  
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

  
  const audioRefs = useRef([]);
  const progressIntervalRef = useRef(null);
  const phraseDurations = useRef([]);
  const isPlayingPhraseRef = useRef(false);

  useEffect(() => {
    init();
  }, []);

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
    if (currentDialogueData && nativeLanguage) {
      ensureTranslations(currentDialogueData);
      setCurrentDialogueData({...currentDialogueData}); // Force re-render
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
      console.error('❌ No topics available for language:', currentLanguage);
      setError(`No dialogue topics available for language: ${currentLanguage}`);
      return;
    }

    // Capture fullscreen state BEFORE any operation
    const wasInFullscreen = isFullscreen;
    console.log('🖥️ Fullscreen state before loading:', wasInFullscreen);

    // Select a random topic with validation
    const randomIndex = Math.floor(Math.random() * currentLanguageTopics.length);
    const randomTopicId = currentLanguageTopics[randomIndex];
    
    if (!randomTopicId || randomTopicId.trim().length === 0) {
      console.error('❌ Invalid random topic selected');
      setError('Failed to select a valid dialogue topic');
      return;
    }
    
    console.log('🎲 Loading random dialogue:', randomTopicId, 'for language:', currentLanguage);
    
    try {
      // Enhanced fullscreen preservation during loading
      if (wasInFullscreen) {
        console.log('🖥️ Preserving fullscreen during loading...');
        
        // Apply and maintain fullscreen during entire process
        const maintainFullscreen = () => {
          const dialogueContainer = document.querySelector('.dialogue-container');
          if (dialogueContainer && !dialogueContainer.classList.contains('mobile-fullscreen')) {
            dialogueContainer.classList.add('mobile-fullscreen');
            document.body.classList.add('fullscreen-body');
            
            // Hide elements
            const elementsToHide = document.querySelectorAll('.navbar, .tooltip, .user-dropdown, .language-selector, .section-title, .theme-grid, .theme-controls');
            elementsToHide.forEach(el => {
              el.classList.add('fullscreen-hidden');
            });
          }
        };
        
        // Apply immediately
        maintainFullscreen();
        
        // Monitor and reapply during loading
        const fullscreenInterval = setInterval(maintainFullscreen, 50);
        
        try {
          // Load the new dialogue with enhanced error handling
          await loadDialogue(randomTopicId, currentLanguage);
          
          // Stop monitoring and ensure final state
          clearInterval(fullscreenInterval);
          
          // Final fullscreen application with validation
          setTimeout(() => {
            maintainFullscreen();
            setIsFullscreen(true);
            window.dispatchEvent(new Event('resize'));
            console.log('✅ Fullscreen preserved successfully');
          }, 100);
          
        } catch (loadError) {
          clearInterval(fullscreenInterval);
          console.error('❌ Error during dialogue loading in fullscreen:', loadError);
          throw loadError;
        }
        
      } else {
        // Normal loading without fullscreen
        console.log('📱 Loading dialogue in normal mode');
        await loadDialogue(randomTopicId, currentLanguage);
      }
      
      // Additional validation after loading
      if (!currentDialogueData || !currentDialogueData.phrases) {
        throw new Error('Dialogue loaded but data is invalid');
      }
      
      console.log('✅ Random dialogue loaded successfully:', {
        topic: randomTopicId,
        language: currentLanguage,
        phrasesCount: currentDialogueData.phrases.length,
        fullscreen: isFullscreen
      });
      
    } catch (error) {
      console.error('❌ Error loading random dialogue:', error);
      setError(`Failed to load random dialogue: ${error.message}`);
      
      // Reset state on error
      setCurrentDialogueData(null);
      setCurrentDialogue(null);
      setCurrentPhraseIndex(0);
      setIsPlaying(false);
      
      // If was in fullscreen, try to restore it
      if (wasInFullscreen) {
        setIsFullscreen(false);
      }
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
    setError(null); // Clear previous errors
    
    try {
      console.log('🚀 Starting dialogue loading:', { dialogueId, language });
      
      // Step 1: Load text content with validation
      const txtContent = await loadDialogueTxt(dialogueId, language);
      
      if (!txtContent || txtContent.trim().length === 0) {
        throw new Error('Empty or invalid dialogue content');
      }
      
      console.log('📄 Text content loaded, length:', txtContent.length);
      
      // Step 2: Parse dialogue with validation
      const parsedDialogue = parseDialogueTxt(txtContent);
      
      if (!parsedDialogue || !parsedDialogue.phrases || parsedDialogue.phrases.length === 0) {
        throw new Error('Failed to parse dialogue or no phrases found');
      }
      
      console.log('📝 Dialogue parsed successfully:', {
        title: parsedDialogue.title,
        phrasesCount: parsedDialogue.phrases.length
      });
      
      // Step 3: Ensure translations
      ensureTranslations(parsedDialogue);
      
      // Step 4: Set dialogue data and reset state
      setCurrentDialogueData(parsedDialogue);
      setCurrentDialogue(dialogueId);
      
      // Reset player state completely
      stopDialogue();
      setCurrentPhraseIndex(0);
      setIsPlaying(false);
      
      // Step 5: Preload audios with enhanced validation
      console.log('🎵 Starting audio preloading...');
      await preloadAudios(dialogueId, language, parsedDialogue);
      
      // Step 6: Final validation of loaded content
      const finalValidation = validateLoadedContent(parsedDialogue);
      if (!finalValidation.isValid) {
        console.warn('⚠️ Content validation issues:', finalValidation.issues);
        // Don't throw error, but log warnings for monitoring
      }
      
      console.log('✅ Dialogue loaded successfully with full validation');
      
    } catch (err) {
      console.error('❌ Error loading dialogue:', err);
      setError(`Failed to load dialogue: ${err.message}`);
      
      // Reset state on error
      setCurrentDialogueData(null);
      setCurrentDialogue(null);
      setCurrentPhraseIndex(0);
      setIsPlaying(false);
      
      throw err; // Re-throw to allow caller to handle
    } finally {
      setLoading(false);
    }
  };
  
  // New function to validate loaded content integrity
  const validateLoadedContent = (dialogueData) => {
    const issues = [];
    
    if (!dialogueData) {
      issues.push('No dialogue data provided');
      return { isValid: false, issues };
    }
    
    if (!dialogueData.title || dialogueData.title.trim().length === 0) {
      issues.push('Missing or empty dialogue title');
    }
    
    if (!dialogueData.phrases || !Array.isArray(dialogueData.phrases)) {
      issues.push('Missing or invalid phrases array');
      return { isValid: false, issues };
    }
    
    if (dialogueData.phrases.length === 0) {
      issues.push('No phrases found in dialogue');
      return { isValid: false, issues };
    }
    
    // Validate each phrase
    dialogueData.phrases.forEach((phrase, index) => {
      if (!phrase) {
        issues.push(`Phrase ${index} is null or undefined`);
        return;
      }
      
      if (!phrase.text || phrase.text.trim().length === 0) {
        issues.push(`Phrase ${index} has empty text`);
      }
      
      if (!phrase.speaker || phrase.speaker.trim().length === 0) {
        issues.push(`Phrase ${index} has no speaker`);
      }
      
      if (!phrase.translations || typeof phrase.translations !== 'object') {
        issues.push(`Phrase ${index} has invalid translations`);
      }
    });
    
    // Check for audio-text count consistency
    const audioCount = audioRefs.current.filter(audio => audio !== null).length;
    if (audioCount > 0 && audioCount !== dialogueData.phrases.length) {
      issues.push(`Audio count (${audioCount}) doesn't match phrase count (${dialogueData.phrases.length})`);
    }
    
    return {
      isValid: issues.length === 0,
      issues: issues,
      phraseCount: dialogueData.phrases.length,
      audioCount: audioCount
    };
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
    
    dialogue.phrases.forEach(phrase => {
      // Update translation based on current native language
      if (phrase.translations && phrase.translations[nativeLanguage]) {
        phrase.translation = phrase.translations[nativeLanguage];
      } else if (!phrase.translation && data?.translations?.[nativeLanguage]) {
        const key = phrase.text.toLowerCase().replace(/[^a-z0-9]/g, '_');
        phrase.translation = data.translations[nativeLanguage][key] || '';
      }
    });
  };



  const preloadAudios = async (dialogueId, language, dialogueData = null) => {
    const dataToUse = dialogueData || currentDialogueData;
    console.log('🔄 preloadAudios called with:', { dialogueId, language, hasDialogueData: !!dialogueData, phrasesCount: dataToUse?.phrases?.length });
    console.log('🔍 Current state:', { currentDialogue, currentLanguage, volume });
    
    if (!dataToUse?.phrases || dataToUse.phrases.length === 0) {
      console.error('❌ No dialogue data or phrases available for preloading audios');
      throw new Error('Invalid dialogue data for audio preloading');
    }
    
    const totalPhrases = dataToUse.phrases.length;
    const audioPaths = dataToUse.phrases.map((_, index) => 
      `/audio/dialogues/${language}/${dialogueId}/line_${index}.mp3`
    );
    console.log('📁 Audio paths will be:', audioPaths);
    
    // Initialize loading progress
    setAudioLoadingProgress({ current: 0, total: totalPhrases, isLoading: true });
    
    // Clear existing audio elements
    audioRefs.current.forEach(audio => {
      if (audio && typeof audio.pause === 'function') {
        audio.pause();
        audio.removeEventListener('canplaythrough', () => {});
        audio.removeEventListener('error', () => {});
      }
    });
    audioRefs.current = [];
    
    // Initialize audio array immediately
    audioRefs.current = new Array(totalPhrases).fill(null);
    
    // Enhanced audio loading with better error handling and multi-format/language fallbacks
    const loadAudioWithRetry = async (index) => {
      // Candidates: MP3 current, WAV current, MP3 en, WAV en
      const candidates = [
        { lang: language, ext: 'mp3' },
        { lang: language, ext: 'wav' },
        { lang: 'en', ext: 'mp3' },
        { lang: 'en', ext: 'wav' }
      ];
      for (let attempt = 0; attempt < candidates.length; attempt++) {
        const { lang: candLang, ext } = candidates[attempt];
        try {
          const audio = new Audio();
          audio.preload = 'auto';
          audio.src = `/audio/dialogues/${candLang}/${dialogueId}/line_${index}.${ext}`;
          audio.volume = volume;

          console.log(`🎵 Loading audio ${index} (attempt ${attempt + 1}/${candidates.length}):`, audio.src);

          const loadPromise = new Promise((resolve, reject) => {
            let resolved = false;

            const handleLoad = () => {
              if (resolved) return;
              resolved = true;

              if (audio.duration && audio.duration > 0 && audio.readyState >= 3) {
                console.log(`✅ Audio ${index} loaded successfully:`, {
                  src: audio.src,
                  duration: audio.duration,
                  readyState: audio.readyState
                });
                audio.removeEventListener('canplaythrough', handleLoad);
                audio.removeEventListener('error', handleError);
                resolve(audio);
              } else {
                console.warn(`⚠️ Audio ${index} loaded but invalid:`, {
                  duration: audio.duration,
                  readyState: audio.readyState
                });
                reject(new Error('Invalid audio file'));
              }
            };

            const handleError = (e) => {
              if (resolved) return;
              resolved = true;

              console.error(`❌ Error loading audio ${index}:`, {
                src: audio.src,
                error: e,
                networkState: audio.networkState,
                readyState: audio.readyState
              });
              audio.removeEventListener('canplaythrough', handleLoad);
              audio.removeEventListener('error', handleError);
              reject(e);
            };

            audio.addEventListener('canplaythrough', handleLoad);
            audio.addEventListener('error', handleError);

            // Extended timeout for better reliability
            setTimeout(() => {
              if (!resolved) {
                resolved = true;
                console.warn(`⏰ Timeout loading audio ${index} after 8 seconds`);
                audio.removeEventListener('canplaythrough', handleLoad);
                audio.removeEventListener('error', handleError);
                reject(new Error('Audio loading timeout'));
              }
            }, 8000);
          });

          const loadedAudio = await loadPromise;
          audioRefs.current[index] = loadedAudio;
          setAudioLoadingProgress(prev => ({ ...prev, current: prev.current + 1 }));
          return loadedAudio;

        } catch (error) {
          console.warn(`⚠️ Attempt ${attempt + 1} failed for audio ${index}:`, error.message);
          // Try next candidate
          if (attempt === candidates.length - 1) {
            console.error(`💥 All attempts failed for audio ${index}`);
            audioRefs.current[index] = null;
            setAudioLoadingProgress(prev => ({ ...prev, current: prev.current + 1 }));
            return null;
          }
        }
      }
    };
    
    // Load all audios with enhanced error handling
    const allAudioPromises = [];
    for (let index = 0; index < totalPhrases; index++) {
      allAudioPromises.push(loadAudioWithRetry(index));
    }
    
    // Wait for all audios to load
    const loadedAudios = await Promise.all(allAudioPromises);
    
    // Validate synchronization integrity
    const successfullyLoaded = loadedAudios.filter(audio => audio !== null).length;
    const loadingSuccessRate = (successfullyLoaded / totalPhrases) * 100;
    
    console.log(`📊 Audio loading summary:`, {
      total: totalPhrases,
      successful: successfullyLoaded,
      failed: totalPhrases - successfullyLoaded,
      successRate: `${loadingSuccessRate.toFixed(1)}%`
    });
    
    // Warn on low success rate but continue gracefully (skip missing audios)
    if (loadingSuccessRate < 80) {
      console.warn('⚠️ Audio loading success rate below threshold, continuing with available audios:', {
        successRate: `${loadingSuccessRate.toFixed(1)}%`,
        successful: successfullyLoaded,
        failed: totalPhrases - successfullyLoaded
      });
      // Do NOT throw; allow playback to proceed and skip missing audios
    }
    
    // Calculate durations after all audios are loaded
    calculateDurations();
    
    // Validate audio-text synchronization
    const validationResult = validateAudioTextSync();
    if (!validationResult.isValid) {
      console.warn('⚠️ Audio-text synchronization validation failed:', validationResult.issues);
    }
    
    // Finalize loading
    setAudioLoadingProgress({ current: 0, total: 0, isLoading: false });
    
    console.log('✅ All audios loaded and validated, UI ready for reliable playback');
    return Promise.resolve();
  };
  
  // New function to validate audio-text synchronization
  const validateAudioTextSync = () => {
    const issues = [];
    const phrases = currentDialogueData?.phrases || [];
    
    // Check if audio count matches phrase count
    const audioCount = audioRefs.current.filter(audio => audio !== null).length;
    const phraseCount = phrases.length;
    
    if (audioCount !== phraseCount) {
      issues.push(`Audio count (${audioCount}) doesn't match phrase count (${phraseCount})`);
    }
    
    // Check for missing audios in sequence
    audioRefs.current.forEach((audio, index) => {
      if (!audio && phrases[index]) {
        issues.push(`Missing audio for phrase ${index}: "${phrases[index].text.substring(0, 50)}..."`);
      }
    });
    
    // Check for invalid durations
    const invalidDurations = audioRefs.current
      .map((audio, index) => ({ audio, index }))
      .filter(({ audio }) => audio && (!audio.duration || audio.duration <= 0))
      .map(({ index }) => index);
    
    if (invalidDurations.length > 0) {
      issues.push(`Invalid durations for audio indices: ${invalidDurations.join(', ')}`);
    }
    
    return {
      isValid: issues.length === 0,
      issues: issues,
      audioCount: audioCount,
      phraseCount: phraseCount
    };
  };

  const calculateDurations = () => {
    const durations = audioRefs.current.map(audio => {
      if (audio && !isNaN(audio.duration) && audio.duration > 0) {
        return audio.duration;
      }
      // Fallback duration calculation based on word count
      const phrase = currentDialogueData?.phrases?.[audioRefs.current.indexOf(audio)];
      if (phrase) {
        const wordCount = phrase.text.split(' ').length;
        return Math.max(2, wordCount * 0.5); // 0.5 seconds per word, minimum 2 seconds
      }
      return 3; // Default fallback
    });
    phraseDurations.current = durations;
    const total = durations.reduce((sum, duration) => sum + duration, 0);
    setTotalTime(total);
  };

  const playDialogue = async () => {
    console.log("Play button clicked - Entering sequence mode");
    console.log("AudioRefs length:", audioRefs.current.length);
    console.log("Current phrase index:", currentPhraseIndex);
    console.log("AudioRefs content:", audioRefs.current.map((audio, i) => ({ index: i, hasAudio: !!audio, src: audio?.src })));
    console.log("isPlaying before setIsPlaying(true):", isPlaying);
    

    
    // Always enter sequence mode when clicking Play
    setIsPlaying(true);
    console.log("setIsPlaying(true) called");
    
    // Stop any current audio before starting sequence
    stopAllAudio();
    
    // Resume from pause if we have a current audio
    const currentAudio = audioRefs.current[currentPhraseIndex];
    if (currentAudio && !currentAudio.paused && currentAudio.currentTime > 0) {
      console.log("Resuming from paused state");
      // Ensure the onended handler is set for sequential playback
      const handleEnded = () => {
        currentAudio.removeEventListener('ended', handleEnded);
        if (isPlaying) {
          setCurrentPhraseIndex(prev => prev + 1);
        }
      };
      currentAudio.addEventListener('ended', handleEnded);
      currentAudio.play().catch(error => {
        console.error('Audio playback failed:', error);
      });
      return;
    }

    // Start from the current phrase index
    console.log("Starting sequence from phrase:", currentPhraseIndex);
    // playCurrentPhrase will be called by useEffect when isPlaying becomes true
  };

  const playCurrentPhrase = () => {
    console.log("playCurrentPhrase called - currentPhraseIndex:", currentPhraseIndex, "audioRefs.length:", audioRefs.current.length);
    console.log("isPlaying state in playCurrentPhrase:", isPlaying);
    
    // Prevent simultaneous executions
    if (isPlayingPhraseRef.current) {
      console.log("playCurrentPhrase already running, skipping");
      return;
    }
    
    isPlayingPhraseRef.current = true;
    
    // Check if audioRefs are loaded
    if (audioRefs.current.length === 0) {
      console.log("AudioRefs not loaded yet, waiting...");
      isPlayingPhraseRef.current = false;
      // Try again after a short delay
      setTimeout(() => {
        if (isPlaying) {
          playCurrentPhrase();
        }
      }, 100);
      return;
    }
    
    if (currentPhraseIndex >= audioRefs.current.length) {
      console.log("Stopping playback - end of dialogue");
      isPlayingPhraseRef.current = false;
      stopDialogue();
      return;
    }
    
    if (!isPlaying) {
      console.log("Stopping playback - not in sequence mode");
      isPlayingPhraseRef.current = false;
      return;
    }
    
    console.log("Playing phrase in sequence:", currentPhraseIndex);
    highlightCurrentPhrase();
    
    const currentAudio = audioRefs.current[currentPhraseIndex];
    if (!currentAudio || !currentAudio.src) {
      console.error('Audio not available for phrase', currentPhraseIndex);
      // Advance to next phrase in sequence
      setCurrentPhraseIndex(prev => prev + 1);
      return;
    }
    
    currentAudio.volume = isMuted ? 0 : volume;
    
    // Always reset time to play from beginning in sequence
    currentAudio.currentTime = 0;

    // Pré-carregar o próximo áudio se ainda não estiver carregado
    const nextIndex = currentPhraseIndex + 1;
    if (nextIndex < audioRefs.current.length && audioRefs.current[nextIndex] && audioRefs.current[nextIndex].preload === 'metadata') {
      console.log(`Pre-loading next audio ${nextIndex} for smooth playback`);
      audioRefs.current[nextIndex].preload = 'auto';
      audioRefs.current[nextIndex].load(); // Forçar carregamento
    }

    // Remove any existing event listeners to prevent duplicates
    const existingHandlers = currentAudio._endedHandlers || [];
    existingHandlers.forEach(handler => {
      currentAudio.removeEventListener('ended', handler);
    });
    currentAudio._endedHandlers = [];
    
    // Configure to continue sequence automatically
    const handleEnded = () => {
      console.log(`Audio ended for phrase ${currentPhraseIndex}`);
      isPlayingPhraseRef.current = false;
      if (isPlaying) {
        if (currentPhraseIndex + 1 < audioRefs.current.length) {
          setCurrentPhraseIndex(prev => prev + 1);
        } else {
          // End of dialogue
          console.log("End of dialogue reached");
          stopDialogue();
        }
      }
    };
    
    currentAudio.addEventListener('ended', handleEnded);
    currentAudio._endedHandlers = [handleEnded];
    
    // Garantir que o áudio está pronto para reprodução
    const playAudio = () => {
      console.log('🎵 Attempting to play audio:', {
        index: currentPhraseIndex,
        src: currentAudio.src,
        readyState: currentAudio.readyState,
        paused: currentAudio.paused,
        volume: currentAudio.volume,
        networkState: currentAudio.networkState,
        duration: currentAudio.duration,

        userInteracted: document.hasStoredUserActivation || 'unknown'
      });
      
      const playPromise = currentAudio.play();
      
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log('✅ Audio playback started successfully for phrase:', currentPhraseIndex);
        }).catch(error => {
          console.error('❌ Audio playback failed:', error);
          console.error('Audio details:', {
            src: currentAudio.src,
            readyState: currentAudio.readyState,
            networkState: currentAudio.networkState,
            error: currentAudio.error
          });
          isPlayingPhraseRef.current = false;
          // Advance to next phrase even with error
          if (isPlaying && currentPhraseIndex + 1 < audioRefs.current.length) {
            setCurrentPhraseIndex(prev => prev + 1);
          }
        });
      }
    };
    
    // Se o áudio ainda não está totalmente carregado, aguardar
    if (currentAudio.readyState < 3) { // HAVE_FUTURE_DATA
      console.log(`Waiting for audio ${currentPhraseIndex} to be ready...`);
      const handleCanPlay = () => {
        currentAudio.removeEventListener('canplay', handleCanPlay);
        playAudio();
      };
      currentAudio.addEventListener('canplay', handleCanPlay);
      
      // Timeout para evitar travamento
      setTimeout(() => {
        currentAudio.removeEventListener('canplay', handleCanPlay);
        playAudio(); // Tentar reproduzir mesmo assim
      }, 1000);
    } else {
      playAudio();
    }
    
    // Start progress tracking
    startProgressTracking();
  };

  const pauseDialogue = () => {
    setIsPlaying(false);
    isPlayingPhraseRef.current = false;
    stopAllAudio();
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
  };

  const stopDialogue = () => {
    setIsPlaying(false);
    isPlayingPhraseRef.current = false;
    setCurrentPhraseIndex(0);
    setCurrentTime(0);
    stopAllAudio();
    removeAllHighlights();
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
  };

  const stopAllAudio = () => {
    audioRefs.current.forEach(audio => {
      if (audio && typeof audio.pause === 'function') {
        audio.pause();
        audio.currentTime = 0;
      }
    });
  };

  const playPhrase = (index) => {
    console.log("Playing phrase:", index, "(Single phrase mode)");
    
    if (index < 0 || index >= audioRefs.current.length) return;
    
    stopAllAudio(); // Stop any ongoing playback
    
    // Single phrase mode - should not continue automatically
    setIsPlaying(false); // Force non-sequence mode
    setCurrentPhraseIndex(index); // Set the starting point for reference - useEffect will handle highlighting
    
    const audio = audioRefs.current[index];
    if (!audio || !audio.src) {
      console.error('Audio not available for this phrase');
      return;
    }
    
    audio.volume = isMuted ? 0 : volume;
    audio.currentTime = 0;
    
    // Função para reproduzir o áudio
    const playAudio = () => {
      console.log('🎵 Playing single phrase:', {
        index: index,
        src: audio.src,
        readyState: audio.readyState,
        paused: audio.paused,
        volume: audio.volume
      });
      
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log('✅ Single phrase playback started successfully for index:', index);
          // Single phrase mode - DO NOT continue automatically
          const handleEnded = () => {
            audio.removeEventListener('ended', handleEnded);
            removeAllHighlights();
            // IMPORTANT: Do not advance to next phrase
            // Keep currentPhraseIndex in same place so Play continues from here
            setIsPlaying(false);
            
            console.log("Single phrase playback finished. Ready for manual play.");
          };
          audio.addEventListener('ended', handleEnded);
        }).catch(error => {
          console.error('❌ Single phrase playback failed:', error);
          console.error('Audio details:', {
            src: audio.src,
            readyState: audio.readyState,
            networkState: audio.networkState,
            error: audio.error
          });
        });
      }
    };
    
    // Se o áudio ainda não está carregado, forçar carregamento
    if (audio.readyState < 3 && audio.preload === 'metadata') {
      console.log(`Loading audio ${index} on demand...`);
      audio.preload = 'auto';
      audio.load();
      
      const handleCanPlay = () => {
        audio.removeEventListener('canplay', handleCanPlay);
        playAudio();
      };
      
      audio.addEventListener('canplay', handleCanPlay);
      
      // Timeout para evitar travamento
      setTimeout(() => {
        audio.removeEventListener('canplay', handleCanPlay);
        playAudio();
      }, 1000);
    } else {
      playAudio();
    }
    
    startProgressTracking();
  };

  const highlightCurrentPhrase = () => {
    removeAllHighlights();
    const messageElements = document.querySelectorAll('.message');
    if (messageElements[currentPhraseIndex]) {
      messageElements[currentPhraseIndex].classList.add('highlighted');
      messageElements[currentPhraseIndex].classList.add('playing');
      
      // Auto-scroll optimized for mobile and desktop
      if (window.innerWidth <= 768) {
        setTimeout(() => {
          messageElements[currentPhraseIndex].scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          });
        }, 100);
      } else {
        messageElements[currentPhraseIndex].scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
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
        setCurrentTime(phraseStartTime + currentPhraseTime);
      }
    }, 100);
  };

  // Effect to handle phrase changes in sequence mode - REMOVED to prevent race conditions
  // The sequence is now controlled only by the 'ended' event listener in playCurrentPhrase()

  // Effect to start playback when isPlaying becomes true or currentPhraseIndex changes during playback
  useEffect(() => {
    if (isPlaying && audioRefs.current.length > 0) {
      console.log("useEffect detected isPlaying=true or phrase change, starting playback");
      playCurrentPhrase();
    }
  }, [isPlaying, currentPhraseIndex]);

  // Effect to handle highlighting when currentPhraseIndex changes (for single phrase clicks)
  useEffect(() => {
    if (!isPlaying && currentPhraseIndex >= 0) {
      // This handles highlighting for single phrase clicks
      highlightCurrentPhrase();
    }
  }, [currentPhraseIndex]);

  const togglePlayPause = () => {
    console.log('🎮 togglePlayPause called, current state:', {
      isPlaying: isPlaying,
      currentPhraseIndex: currentPhraseIndex,
      audioRefsLength: audioRefs.current.length
    });
    
    if (isPlaying) {
      console.log('⏸️ Pausing dialogue');
      pauseDialogue();
    } else {
      console.log('▶️ Starting dialogue playback');
      // Always use playDialogue for the play button
      playDialogue();
    }
  };



  const updateProgress = () => {
    const currentAudio = audioRefs.current[currentPhraseIndex];
    if (currentAudio && !currentAudio.paused) {
      const elapsed = phraseDurations.current.slice(0, currentPhraseIndex)
        .reduce((sum, duration) => sum + duration, 0) + currentAudio.currentTime;
      setCurrentTime(elapsed);
    }
  };

  const toggleTranslations = () => {
    setShowTranslations(!showTranslations);
  };

  const toggleFullscreen = () => {
    const dialogueContainer = document.querySelector('.dialogue-container');
    
    if (!dialogueContainer) return;
    
    const isCurrentlyFullscreen = dialogueContainer.classList.contains('mobile-fullscreen');
    
    if (isCurrentlyFullscreen) {
      // Sair do fullscreen
      dialogueContainer.classList.remove('mobile-fullscreen');
      setIsFullscreen(false);
      document.body.classList.remove('fullscreen-body');
      
      // Restaurar elementos ocultados
      const elementsToShow = document.querySelectorAll('.navbar, .tooltip, .user-dropdown, .language-selector, .section-title, .theme-grid, .theme-controls');
      elementsToShow.forEach(el => {
        el.classList.remove('fullscreen-hidden');
      });
    } else {
      // Entrar no fullscreen
      dialogueContainer.classList.add('mobile-fullscreen');
      setIsFullscreen(true);
      document.body.classList.add('fullscreen-body');
      
      // Ocultar elementos que podem sobrepor o media player
      const elementsToHide = document.querySelectorAll('.navbar, .tooltip, .user-dropdown, .language-selector, .section-title, .theme-grid, .theme-controls');
      elementsToHide.forEach(el => {
        el.classList.add('fullscreen-hidden');
      });
      
      // Forçar redimensionamento imediato
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 100);
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      setVolume(lastVolume);
      audioRefs.current.forEach(audio => {
        if (audio) audio.volume = lastVolume;
      });
    } else {
      setLastVolume(volume);
      setIsMuted(true);
      setVolume(0);
      audioRefs.current.forEach(audio => {
        if (audio) audio.volume = 0;
      });
    }
  };

  const testAudio = async () => {
    console.log('🔧 TESTE DE ÁUDIO INICIADO');
    console.log('📊 Estado atual:', {
      currentDialogue,
      currentLanguage,
      audioRefsLength: audioRefs.current.length,
      currentPhraseIndex
    });

    if (audioRefs.current.length === 0) {
      console.log('❌ Nenhum áudio carregado');
      alert('Nenhum áudio carregado. Carregue um diálogo primeiro.');
      return;
    }

    const testAudio = audioRefs.current[0];
    if (!testAudio) {
      console.log('❌ Primeiro áudio não encontrado');
      alert('Primeiro áudio não encontrado.');
      return;
    }

    console.log('🎵 Testando primeiro áudio:', {
      src: testAudio.src,
      readyState: testAudio.readyState,
      networkState: testAudio.networkState,
      paused: testAudio.paused,
      volume: testAudio.volume,
      duration: testAudio.duration,
      error: testAudio.error
    });

    try {
      testAudio.currentTime = 0;
      const playPromise = testAudio.play();
      
      if (playPromise !== undefined) {
        await playPromise;
        console.log('✅ Áudio reproduzido com sucesso!');
        alert('Áudio funcionando! Reprodução iniciada.');
        
        // Parar após 2 segundos
        setTimeout(() => {
          testAudio.pause();
          console.log('⏸️ Teste finalizado - áudio pausado');
        }, 2000);
      }
    } catch (error) {
      console.log('❌ Erro na reprodução:', {
        error: error.message,
        name: error.name,
        audioError: testAudio.error,
        networkState: testAudio.networkState,
        readyState: testAudio.readyState
      });
      alert(`Erro na reprodução: ${error.message}`);
    }
  };

  const updateVolume = (newVolume) => {
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    audioRefs.current.forEach(audio => {
      if (audio) audio.volume = newVolume;
    });
    
    // Save to localStorage
    localStorage.setItem('appVolume', newVolume.toString());
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

  const loadMoreThemes = () => {
    setVisibleThemes(prev => Math.min(prev + 3, themes.length));
  };

  const showLessThemes = () => {
    setVisibleThemes(3);
  };

  const setupEventListeners = () => {
    // Handle fullscreen changes
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    // Cleanup
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  };

  // Load volume preference on mount
  useEffect(() => {
    const savedVolume = localStorage.getItem('appVolume');
    if (savedVolume !== null) {
      const vol = parseFloat(savedVolume);
      setVolume(vol);
      setIsMuted(vol === 0);
    }
  }, []);

  // Handle ESC key for fullscreen exit
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isFullscreen) {
        const dialogueContainer = document.querySelector('.dialogue-container');
        if (dialogueContainer && dialogueContainer.classList.contains('mobile-fullscreen')) {
          toggleFullscreen();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen, toggleFullscreen]);



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
      <div className="page-title-container">
        <h1 className="page-title">{pageTitle}</h1>
      </div>
      
      <div className="container">
        <div className="dialogue-container">
          <h2 className="dialogue-title">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>{currentDialogueData?.title || pageTitle}</span>
          </h2>
          
          <div id="dialogue-content">
            {currentDialogueData?.phrases?.map((phrase, index) => (
              <div 
                key={index} 
                className={`message message-${index % 2 === 0 ? 'other' : 'user'} ${currentPhraseIndex === index && isPlaying ? 'highlighted' : ''}`}
                data-index={index}
                onClick={(e) => {
                  // Only play single phrase if not in sequence mode
                  if (!isPlaying) {
                    playPhrase(index);
                  }
                  e.stopPropagation();
                }}
              >
                <div className="message-info">
                  <span className="message-sender">{phrase.speaker}</span>
                </div>
                <div className="message-text">{phrase.text}</div>
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
              <button className="player-btn" onClick={stopDialogue} title="Stop">
                <i className="fas fa-stop"></i>
              </button>
              

              
              {/* Random Button */}
              <button 
                className="player-btn random-btn" 
                onClick={loadRandomDialogue}
                title="Carregar Diálogo Aleatório"
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
        
        <div className="theme-grid" id="theme-container">
          {themes.slice(0, visibleThemes).map((theme, index) => (
            <div 
              key={index} 
              className="theme-card"
            >
              <h3>{theme.title}</h3>
              <ul>
                {theme.topics && theme.topics.map((topic) => {
                  const isAvailable = isTopicAvailable(topic.id, currentLanguage);
                  return (
                    <li 
                      key={topic.id}
                      className={`
                        ${currentDialogue === topic.id ? 'active' : ''}
                        ${isAvailable ? 'available' : 'unavailable'}
                      `.trim()}
                      onClick={() => {
                        if (isAvailable) {
                          loadDialogue(topic.id, currentLanguage);
                        }
                      }}
                      title={isAvailable ? '' : t('comingSoon') || 'Em breve'}
                    >
                      <span className="topic-content">
                        <span className="topic-name">{topic.name}</span>
                        {isAvailable ? (
                          <span className="available-icon">
                            <i className="fas fa-play-circle"></i>
                          </span>
                        ) : (
                          <span className="unavailable-icon">
                            <i className="fas fa-lock"></i>
                          </span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="theme-controls">
          {visibleThemes < themes.length && (
            <button className="theme-control-btn" onClick={loadMoreThemes}>
              <i className="fas fa-chevron-down"></i>
              <span>{t('loadMore')}</span>
            </button>
          )}
          {visibleThemes > 3 && (
            <button className="theme-control-btn" onClick={showLessThemes}>
              <i className="fas fa-chevron-up"></i>
              <span>{t('showLess')}</span>
            </button>
          )}
        </div>

        <div className="text-center">
          <a href="/signup" className="cta-button">{t('startLearning')}</a>
        </div>
      </div>

      {/* Audio Loading Progress Overlay */}
      {audioLoadingProgress.isLoading && (
        <div className="audio-loading-overlay">
          <div className="audio-loading-content">
            <div className="skeleton-media-player">
              <div className="skeleton-player-controls">
                <div className="skeleton-player-btn"></div>
                <div className="skeleton-player-btn"></div>
                <div className="skeleton-player-btn"></div>
                <div className="skeleton-player-btn"></div>
                <div className="skeleton-player-btn"></div>
                <div className="skeleton-volume-control">
                  <div className="skeleton-volume-btn"></div>
                  <div className="skeleton-volume-slider"></div>
                </div>
              </div>
              <div className="skeleton-progress-container">
                <div className="skeleton-progress-bar-container"></div>
                <div className="skeleton-time-display">
                  <div className="skeleton-time"></div>
                  <div className="skeleton-time"></div>
                </div>
              </div>
              <div className="loading-animation-container">
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
            <div className="loading-progress-bar">
              <div 
                className="loading-progress-fill" 
                style={{ 
                  width: `${audioLoadingProgress.total > 0 ? (audioLoadingProgress.current / audioLoadingProgress.total) * 100 : 0}%` 
                }}
              ></div>
            </div>
            <div className="progress-dots">
              {Array.from({ length: audioLoadingProgress.total }, (_, i) => (
                <div 
                  key={i} 
                  className={`progress-dot ${i < audioLoadingProgress.current ? 'completed' : ''}`}
                ></div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Volume Popup for Mobile */}
      {showVolumePopup && (
        <div className="volume-popup" onClick={() => setShowVolumePopup(false)}>
          <div className="volume-popup-content" onClick={(e) => e.stopPropagation()}>
            <div className="volume-header">
              <span>{t('volume')}</span>
              <button 
                className="volume-close-btn"
                onClick={() => setShowVolumePopup(false)}
              >
                &times;
              </button>
            </div>
            <div className="volume-slider-container">
              <input 
                type="range" 
                className="mobile-volume-slider"
                min="0" 
                max="1" 
                step="0.1" 
                value={volume}
                onChange={(e) => updateVolume(parseFloat(e.target.value))}
              />
              <div className="volume-labels">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
            <div className="volume-buttons">
              <button 
                className="volume-preset-btn" 
                onClick={() => updateVolume(0.3)}
              >
                30%
              </button>
              <button 
                className="volume-preset-btn" 
                onClick={() => updateVolume(0.6)}
              >
                60%
              </button>
              <button 
                className="volume-preset-btn" 
                onClick={() => updateVolume(1)}
              >
                100%
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dialogues;