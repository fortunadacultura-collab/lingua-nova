// App configuration and data
let appConfig = {
    dialogues: {},
    currentLanguage: 'en',
    currentDialogue: 'morning_routine',
    currentAudio: null,
    isPlaying: false,
    currentPhraseIndex: 0,
    audioElements: [],
    phraseDurations: [],
    totalDuration: 0,
    highlightInterval: null,
    data: null,
    initialThemes: 4,
    visibleThemes: 4,
    themesPerLine: 4,
    currentLine: 1,
    showTranslations: false,
    volume: 1,
    initialized: false,
    lastVolume: 0.7
};

// 🔥 NOVO: Gerenciador de Volume para Mobile
const volumeManager = {
    isActive: false,
    currentVolume: 1,
    isMuted: false,
    lastVolume: 0.7,
    
    init() {
        this.setupVolumeElements();
        this.loadVolumePreference();
        this.setupEventListeners();
        this.updateVolumeIcon();
    },
    
    setupVolumeElements() {
        // Criar elementos do volume se não existirem
        if (!document.getElementById('volume-popup')) {
            this.createVolumePopup();
        }
    },
    
    createVolumePopup() {
        const volumePopup = document.createElement('div');
        volumePopup.id = 'volume-popup';
        volumePopup.className = 'volume-popup';
        volumePopup.innerHTML = `
            <div class="volume-popup-content">
                <div class="volume-header">
                    <span data-translate="volumeTitle">Volume</span>
                    <button class="volume-close-btn">&times;</button>
                </div>
                <div class="volume-slider-container">
                    <input type="range" id="mobile-volume-slider" 
                           min="0" max="1" step="0.1" value="${this.currentVolume}"
                           class="mobile-volume-slider">
                    <div class="volume-labels">
                        <span>0%</span>
                        <span>50%</span>
                        <span>100%</span>
                    </div>
                </div>
                <div class="volume-buttons">
                    <button class="volume-preset-btn" data-value="0.3">30%</button>
                    <button class="volume-preset-btn" data-value="0.6">60%</button>
                    <button class="volume-preset-btn" data-value="1">100%</button>
                </div>
            </div>
        `;
        document.body.appendChild(volumePopup);
    },
    
    loadVolumePreference() {
        const savedVolume = localStorage.getItem('appVolume');
        if (savedVolume !== null) {
            this.currentVolume = parseFloat(savedVolume);
            this.updateVolume(this.currentVolume, false);
        }
    },
    
    setupEventListeners() {
        const volumeBtn = document.getElementById('volume-btn');
        const volumeCloseBtn = document.querySelector('.volume-close-btn');
        const volumePopup = document.getElementById('volume-popup');
        
        // Botão de volume
        if (volumeBtn) {
            volumeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleVolumePopup();
            });
            
            // Gestos touch para volume
            this.setupTouchGestures(volumeBtn);
        }
        
        // Slider de volume
        const volumeSlider = document.getElementById('mobile-volume-slider');
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                const volume = parseFloat(e.target.value);
                this.updateVolume(volume, true);
            });
            
            volumeSlider.addEventListener('change', (e) => {
                const volume = parseFloat(e.target.value);
                this.saveVolumePreference(volume);
            });
        }
        
        // Botão fechar
        if (volumeCloseBtn) {
            volumeCloseBtn.addEventListener('click', () => {
                this.hideVolumePopup();
            });
        }
        
        // Botões de preset
        document.querySelectorAll('.volume-preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const volume = parseFloat(e.target.getAttribute('data-value'));
                this.updateVolume(volume, true);
                this.saveVolumePreference(volume);
                this.hideVolumePopup();
            });
        });
        
        // Fechar ao clicar fora
        document.addEventListener('click', (e) => {
            if (volumePopup && volumePopup.classList.contains('active') && 
                !e.target.closest('.volume-popup') && 
                !e.target.closest('#volume-btn')) {
                this.hideVolumePopup();
            }
        });
    },
    
    setupTouchGestures(volumeBtn) {
        if (window.innerWidth <= 768) {
            let startY = 0;
            let startVolume = 0;
            
            volumeBtn.addEventListener('touchstart', (e) => {
                startY = e.touches[0].clientY;
                startVolume = this.currentVolume;
                e.preventDefault();
            });
            
            volumeBtn.addEventListener('touchmove', (e) => {
                const currentY = e.touches[0].clientY;
                const deltaY = startY - currentY;
                const volumeChange = deltaY / 200;
                
                let newVolume = Math.max(0, Math.min(1, startVolume + volumeChange));
                this.updateVolume(newVolume, false);
                this.showVolumeFeedback(newVolume);
                e.preventDefault();
            });
            
            volumeBtn.addEventListener('touchend', () => {
                this.saveVolumePreference(this.currentVolume);
                this.hideVolumeFeedback();
            });
        }
    },
    
    toggleVolumePopup() {
        const volumePopup = document.getElementById('volume-popup');
        if (volumePopup) {
            volumePopup.classList.toggle('active');
            this.isActive = volumePopup.classList.contains('active');
            
            if (this.isActive) {
                const slider = document.getElementById('mobile-volume-slider');
                if (slider) {
                    slider.value = this.currentVolume;
                }
            }
        }
    },
    
    hideVolumePopup() {
        const volumePopup = document.getElementById('volume-popup');
        if (volumePopup) {
            volumePopup.classList.remove('active');
            this.isActive = false;
        }
    },
    
    updateVolume(volume, updateSlider = true) {
        this.currentVolume = volume;
        
        // Atualizar áudios
        appConfig.audioElements.forEach(audio => {
            if (audio) {
                audio.volume = this.currentVolume;
            }
        });
        
        // Atualizar appConfig para consistência
        appConfig.volume = this.currentVolume;
        
        // Atualizar UI
        this.updateVolumeIcon();
        
        // Atualizar slider se necessário
        if (updateSlider) {
            const slider = document.getElementById('mobile-volume-slider');
            if (slider) {
                slider.value = this.currentVolume;
            }
        }
    },
    
    updateVolumeIcon() {
        const volumeBtn = document.getElementById('volume-btn');
        if (volumeBtn) {
            if (this.currentVolume === 0) {
                volumeBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
            } else if (this.currentVolume < 0.3) {
                volumeBtn.innerHTML = '<i class="fas fa-volume-off"></i>';
            } else if (this.currentVolume < 0.6) {
                volumeBtn.innerHTML = '<i class="fas fa-volume-down"></i>';
            } else {
                volumeBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
            }
        }
    },
    
    saveVolumePreference(volume) {
        localStorage.setItem('appVolume', volume.toString());
    },
    
    showVolumeFeedback(volume) {
        let feedback = document.getElementById('volume-feedback');
        if (!feedback) {
            feedback = document.createElement('div');
            feedback.id = 'volume-feedback';
            feedback.className = 'volume-feedback';
            document.body.appendChild(feedback);
        }
        
        const volumePercent = Math.round(volume * 100);
        feedback.innerHTML = `
            <i class="fas fa-volume-${volume === 0 ? 'mute' : volume < 0.3 ? 'off' : volume < 0.6 ? 'down' : 'up'}"></i>
            <span>${volumePercent}%</span>
        `;
        feedback.classList.add('visible');
    },
    
    hideVolumeFeedback() {
        const feedback = document.getElementById('volume-feedback');
        if (feedback) {
            feedback.classList.remove('visible');
            setTimeout(() => {
                if (feedback.parentNode) {
                    feedback.parentNode.removeChild(feedback);
                }
            }, 300);
        }
    },
    
    toggleMute() {
        if (this.currentVolume > 0) {
            this.lastVolume = this.currentVolume;
            this.updateVolume(0, true);
        } else {
            this.updateVolume(this.lastVolume || 0.7, true);
        }
        this.saveVolumePreference(this.currentVolume);
    }
};

// Gerenciador de idioma de tradução para diálogos
const dialogueTranslationManager = {
    currentLanguage: 'pt',
    
    init() {
        this.setupEventListeners();
        this.loadStoredLanguage();
    },
    
    setupEventListeners() {
        document.addEventListener('translationLanguageChanged', (e) => {
            this.changeLanguage(e.detail.language);
        });
        
        document.addEventListener('nativeLanguageChanged', (e) => {
            this.changeLanguage(e.detail.language);
        });
    },
    
    loadStoredLanguage() {
        // Load saved language from native language manager
        const savedLang = window.nativeLanguageManager?.getCurrentNativeLanguage() || 'pt';
        console.log('Dialogues: Carregando idioma salvo:', savedLang);
        this.changeLanguage(savedLang);
    },
    
    changeLanguage(langCode) {
        this.currentLanguage = langCode;
        
        // Use native language manager to save language
        if (window.nativeLanguageManager) {
            window.nativeLanguageManager.changeNativeLanguage(langCode);
        }
        
        if (appConfig.initialized) {
            this.updateAllTranslations();
        }
    },
    
    updateAllTranslations() {
        updateDialogueTranslations(this.currentLanguage);
        updateDialogueUITexts(this.currentLanguage);
        // Notificar navbar para atualizar suas traduções
        if (window.updateUITexts) {
            window.updateUITexts(this.currentLanguage);
        }
    }
};

// DOM Elements cache
let domElements = {};

// Função para traduzir a página
function translatePage() {
    if (!window.nativeLanguageManager) {
        console.log('Dialogues: nativeLanguageManager não disponível');
        return;
    }
    
    const currentLanguage = window.nativeLanguageManager.getCurrentNativeLanguage();
    const translations = window.nativeLanguageManager.getTranslations();
    
    if (!translations || !translations[currentLanguage]) {
        console.log('Dialogues: Traduções não disponíveis para', currentLanguage);
        return;
    }
    
    console.log('Dialogues: Traduzindo página para', currentLanguage);
    
    // Traduzir elementos com data-translate
    const elementsToTranslate = document.querySelectorAll('[data-translate]');
    elementsToTranslate.forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[currentLanguage][key]) {
            element.textContent = translations[currentLanguage][key];
        }
    });
}

// Initialize the application
async function init() {
    if (appConfig.initialized) {
        console.log("App already initialized");
        return;
    }
    
    try {
        console.log("Initializing application...");
        
        // Verificar parâmetro de idioma na URL e atualizar currentLanguage
        const urlParams = new URLSearchParams(window.location.search);
        const langParam = urlParams.get('lang');
        if (langParam === 'es') {
            appConfig.currentLanguage = 'es';
            console.log('Language set to Spanish from URL parameter');
            
            // Atualizar a bandeira do idioma de aprendizado
            setTimeout(() => {
                const learningLanguageElement = document.getElementById('learning-language');
                if (learningLanguageElement) {
                    const flagImg = learningLanguageElement.querySelector('img');
                    if (flagImg) {
                        flagImg.src = 'assets/images/flags/es.svg';
                        flagImg.alt = 'es';
                        console.log('Learning language flag updated to Spanish');
                    }
                }
            }, 100);
        }
        
        initDomElements();
        
        // Inicializar o gerenciador de idioma nativo PRIMEIRO
        if (window.nativeLanguageManager) {
            await window.nativeLanguageManager.init();
            console.log('Dialogues: Sistema de idiomas nativo inicializado');
        }
        
        // Inicializar o gerenciador de traduções
        dialogueTranslationManager.init();
        
        // Traduzir a página após inicialização
        setTimeout(() => {
            translatePage();
        }, 500);
        
        // Load data from external JSON
        const response = await fetch('data/data.json');
        if (!response.ok) throw new Error('Failed to load configuration');
        appConfig.data = await response.json();
        
        appConfig.themesPerLine = calculateThemesPerLine();
        
        // Configurar temas iniciais baseado no idioma
        if (appConfig.currentLanguage === 'es') {
            // Para espanhol, começar com 3 temas (1 linha de 3 colunas)
            appConfig.initialThemes = 3;
            appConfig.visibleThemes = 3;
        } else {
            // Para inglês, usar o cálculo padrão
            appConfig.initialThemes = appConfig.themesPerLine;
            appConfig.visibleThemes = appConfig.themesPerLine;
        }
        
        // Carregar diálogo baseado no idioma
        const defaultDialogue = appConfig.currentLanguage === 'es' ? 'la_idea' : 'morning_routine';
        appConfig.currentDialogue = defaultDialogue;
        await loadDialogue(defaultDialogue);
        renderThemeCards();
        setupEventListeners();
        
        // 🔥 ATUALIZADO: Inicializar volume manager primeiro
        volumeManager.init();
        setupMobileOptimizations();
        optimizeForMobile();
        
        updateDialogueUITexts(dialogueTranslationManager.currentLanguage);
        
        appConfig.initialized = true;
        console.log("Application initialized successfully");
    } catch (error) {
        console.error('Initialization error:', error);
        showError('Failed to initialize application');
    }
}

// Initialize DOM elements
function initDomElements() {
    domElements = {
        dialogueContent: document.getElementById('dialogue-content'),
        themeContainer: document.getElementById('theme-container'),
        playBtn: document.getElementById('play-btn'),
        pauseBtn: document.getElementById('pause-btn'),
        stopBtn: document.getElementById('stop-btn'),
        progressBar: document.getElementById('progress-bar'),
        currentTimeDisplay: document.getElementById('current-time'),
        totalTimeDisplay: document.getElementById('total-time'),
        dialogueTitle: document.getElementById('dialogue-title-text'),
        chooseThemeText: document.getElementById('choose-theme-text'),
        startLearningText: document.getElementById('start-learning-text'),
        translateToggleBtn: document.getElementById('translate-toggle-btn'),
        volumeBtn: document.getElementById('volume-btn'),
        volumeSlider: document.getElementById('volume-slider')
    };
}

// Dialogue functions
async function loadDialogue(dialogueId) {
    try {
        console.log("Loading dialogue:", dialogueId);
        
        // Load dialogue from server
        const dialogue = await loadDialogueTxt(dialogueId);
        if (!dialogue) {
            throw new Error('Dialogue not found: ' + dialogueId);
        }

        appConfig.dialogues[dialogueId] = dialogue;
        appConfig.currentDialogue = dialogueId;
        domElements.dialogueTitle.textContent = dialogue.title;
        domElements.dialogueContent.innerHTML = '';
        
        dialogue.lines.forEach((line, index) => {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message message-${index % 2 === 0 ? 'other' : 'user'}`;
            messageDiv.setAttribute('data-index', index);
            
            const infoDiv = document.createElement('div');
            infoDiv.className = 'message-info';
            
            const senderSpan = document.createElement('span');
            senderSpan.className = 'message-sender';
            senderSpan.textContent = line.speaker;
            
            infoDiv.appendChild(senderSpan);
            
            const textDiv = document.createElement('div');
            textDiv.className = 'message-text';
            textDiv.textContent = line.text;
            
            const translationDiv = document.createElement('div');
            translationDiv.className = 'translation-text';
            translationDiv.setAttribute('data-lang', dialogueTranslationManager.currentLanguage);
            translationDiv.textContent = line.translations[dialogueTranslationManager.currentLanguage] || getFallbackTranslation(dialogueTranslationManager.currentLanguage);
            translationDiv.style.display = 'none';
            
            messageDiv.appendChild(infoDiv);
            messageDiv.appendChild(textDiv);
            messageDiv.appendChild(translationDiv);
            
            messageDiv.addEventListener('click', () => {
                playPhrase(index);
            });
            
            // 🔥 ADICIONADO: Event listener para touch feedback
            messageDiv.addEventListener('touchstart', function() {
                this.style.transform = 'scale(0.98)';
            });
            
            messageDiv.addEventListener('touchend', function() {
                this.style.transform = 'scale(1)';
            });
            
            domElements.dialogueContent.appendChild(messageDiv);
        });

        updateTranslationVisibility();
        preloadAudios(dialogueId);
        calculateDurations();
        stopAllAudio();
        renderThemeCards();
        
        console.log("Dialogue loaded successfully:", dialogueId);
    } catch (error) {
        console.error('Error loading dialogue:', error);
        showError('Failed to load dialogue: ' + error.message);
    }
}

async function loadDialogueTxt(dialogueId) {
    try {
        // Usar o idioma atual para carregar os diálogos
        const language = appConfig.currentLanguage;
        console.log(`Loading dialogue ${dialogueId} for language: ${language}`);
        
        const response = await fetch(`languages/${language}/dialogues/${dialogueId}.txt`);
        if (!response.ok) {
            // Fallback: tentar com subpasta se não encontrar
            const fallbackResponse = await fetch(`languages/${language}/dialogues/${dialogueId}/${dialogueId}.txt`);
            if (!fallbackResponse.ok) throw new Error('Dialogue not found');
            const content = await fallbackResponse.text();
            return parseDialogueTxt(content);
        }
        const content = await response.text();
        return parseDialogueTxt(content);
    } catch (error) {
        console.error('Error loading dialogue file:', error);
        throw error;
    }
}

// 🔥 CORREÇÃO: Função parseDialogueTxt corrigida
function parseDialogueTxt(content) {
    const lines = content.split('\n');
    const dialogue = {
        title: '',
        lines: []
    };
    
    let currentLine = {};
    let currentSection = '';
    
    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;

        if (line.startsWith('title:')) {
            dialogue.title = line.replace('title:', '').trim();
        } 
        else if (line.startsWith('speaker:')) {
            // Se já temos uma linha em progresso, adiciona ao diálogo
            if (currentLine.speaker && currentLine.text) {
                dialogue.lines.push(currentLine);
            }
            currentLine = {
                speaker: line.replace('speaker:', '').trim(),
                text: '',
                translations: {}
            };
            currentSection = 'speaker';
        }
        else if (line.startsWith('text:')) {
            currentLine.text = line.replace('text:', '').trim();
            currentSection = 'text';
        }
        else if (line.startsWith('pt:')) {
            currentLine.translations.pt = line.replace('pt:', '').trim();
            currentSection = 'translation';
        }
        else if (line.startsWith('es:')) {
            currentLine.translations.es = line.replace('es:', '').trim();
            currentSection = 'translation';
        }
        else if (line.startsWith('en:')) {
            currentLine.translations.en = line.replace('en:', '').trim();
            currentSection = 'translation';
        }
        else if (currentSection === 'text' && currentLine.text) {
            // Permite múltiplas linhas no texto
            currentLine.text += ' ' + line;
        }
    }
    
    // Adiciona a última linha se existir
    if (currentLine.speaker && currentLine.text) {
        dialogue.lines.push(currentLine);
    }
    
    return ensureTranslations(dialogue);
}

function ensureTranslations(dialogue) {
    dialogue.lines.forEach(line => {
        line.translations = line.translations || {};
        // Garante que todas as traduções necessárias existam
        if (!line.translations.pt) line.translations.pt = getFallbackTranslation('pt');
        if (!line.translations.es) line.translations.es = getFallbackTranslation('es');
        if (!line.translations.en) line.translations.en = getFallbackTranslation('en');
    });
    return dialogue;
}

function getFallbackTranslation(lang) {
    const fallbacks = {
        'pt': 'Tradução não disponível',
        'es': 'Traducción no disponible', 
        'en': 'Translation not available'
    };
    return fallbacks[lang] || 'Translation not available';
}

// Audio functions - SEM FALLBACK
function preloadAudios(dialogueId) {
    // Clear existing audio elements
    appConfig.audioElements.forEach(audio => {
        if (audio && typeof audio.pause === 'function') {
            audio.pause();
        }
    });
    
    appConfig.audioElements = [];
    const dialogue = appConfig.dialogues[dialogueId];
    if (!dialogue) return;
    
    // Create audio elements for each line with the correct path structure
    dialogue.lines.forEach((_, index) => {
        const audio = new Audio();
        audio.preload = 'auto';
        
        // Usar o idioma atual para carregar os áudios
        const language = appConfig.currentLanguage;
        audio.src = `languages/${language}/dialogues/${dialogueId}/audios/line_${index}.mp3`;
        audio.volume = appConfig.volume;
        
        audio.addEventListener('error', (e) => {
            console.error(`Error loading audio for line ${index}:`, e);
            console.error(`Audio path: ${audio.src}`);
            
            // CORREÇÃO: Tentar caminho alternativo se o principal falhar
            const alternativePath = `audios/${dialogueId}/line_${index}.mp3`;
            console.log(`Trying alternative path: ${alternativePath}`);
            audio.src = alternativePath;
        });
        
        audio.addEventListener('loadeddata', () => {
            console.log(`Audio loaded successfully for line ${index}`);
            if (!isNaN(audio.duration) && audio.duration > 0) {
                appConfig.phraseDurations[index] = audio.duration;
                updateTotalDuration();
            }
        });
        
        audio.addEventListener('canplaythrough', () => {
            console.log(`Audio can play through for line ${index}`);
        });
        
        appConfig.audioElements.push(audio);
    });
}

function calculateDurations() {
    appConfig.phraseDurations = [];
    appConfig.totalDuration = 0;
    
    const dialogue = appConfig.dialogues[appConfig.currentDialogue];
    if (!dialogue) return;
    
    dialogue.lines.forEach((line, index) => {
        const wordCount = line.text.split(' ').length;
        const duration = Math.max(
            appConfig.data.settings.audioSettings.fallbackDuration.baseSeconds,
            wordCount * appConfig.data.settings.audioSettings.fallbackDuration.secondsPerWord
        );
        appConfig.phraseDurations.push(duration);
        appConfig.totalDuration += duration;
    });
    
    if (domElements.totalTimeDisplay) {
        domElements.totalTimeDisplay.textContent = formatTime(appConfig.totalDuration);
    }
}

function updateTotalDuration() {
    appConfig.totalDuration = appConfig.phraseDurations.reduce((sum, duration) => sum + duration, 0);
    if (domElements.totalTimeDisplay) {
        domElements.totalTimeDisplay.textContent = formatTime(appConfig.totalDuration);
    }
}

// Player control functions
function playDialogue() {
    console.log("Play button clicked - Entering sequence mode");
    
    if (appConfig.isPlaying) {
        pauseDialogue();
        return;
    }
    
    // ⚠️ CORREÇÃO: Sempre entrar no modo sequência quando clicar em Play
    appConfig.isPlaying = true;
    updatePlayerControls();
    startProgressTracking();
    
    // 🔥 ADICIONADO: Fechar volume control se aberto
    volumeManager.hideVolumePopup();
    
    // Resume from pause if we have a current audio
    if (appConfig.currentAudio && !appConfig.currentAudio.paused) {
        console.log("Resuming from paused state");
        // Ensure the onended handler is set for sequential playback
        appConfig.currentAudio.onended = () => {
            if (appConfig.isPlaying) {
                appConfig.currentPhraseIndex++;
                playCurrentPhrase();
            }
        };
        appConfig.currentAudio.play().catch(error => {
            console.error('Audio playback failed:', error);
            showError('Audio playback failed: ' + error.message);
        });
        return;
    }

    // Start from the current phrase index
    console.log("Starting sequence from phrase:", appConfig.currentPhraseIndex);
    playCurrentPhrase();
}

function playCurrentPhrase() {
    if (!appConfig.isPlaying || appConfig.currentPhraseIndex >= appConfig.audioElements.length) {
        console.log("Stopping playback - end of dialogue or not in sequence mode");
        stopAllAudio();
        return;
    }
    
    console.log("Playing phrase in sequence:", appConfig.currentPhraseIndex);
    highlightCurrentPhrase();
    
    const audio = appConfig.audioElements[appConfig.currentPhraseIndex];
    appConfig.currentAudio = audio;
    audio.volume = appConfig.volume;
    
    if (!audio || !audio.src) {
        console.error('Audio not available for phrase', appConfig.currentPhraseIndex);
        // Avançar para a próxima frase na sequência
        appConfig.currentPhraseIndex++;
        playCurrentPhrase();
        return;
    }
    
    // Sempre resetar o tempo para tocar do início na sequência
    audio.currentTime = 0;

    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
        playPromise.then(() => {
            // ⚠️ Configurar para continuar a sequência automaticamente
            audio.onended = () => {
                if (appConfig.isPlaying) {
                    appConfig.currentPhraseIndex++;
                    if (appConfig.currentPhraseIndex < appConfig.audioElements.length) {
                        playCurrentPhrase();
                    } else {
                        // Fim do diálogo
                        console.log("End of dialogue reached");
                        stopAllAudio();
                    }
                }
            };
        }).catch(error => {
            console.error('Audio playback failed:', error);
            showError('Audio playback failed: ' + error.message);
            // Avançar para a próxima frase mesmo com erro
            appConfig.currentPhraseIndex++;
            if (appConfig.isPlaying && appConfig.currentPhraseIndex < appConfig.audioElements.length) {
                playCurrentPhrase();
            }
        });
    }
}

// 🔥 NOVA FUNÇÃO: Reproduzir frase com offset específico
function playCurrentPhraseWithOffset(offset) {
    if (appConfig.currentPhraseIndex >= appConfig.audioElements.length) return;
    
    const audio = appConfig.audioElements[appConfig.currentPhraseIndex];
    appConfig.currentAudio = audio;
    audio.volume = appConfig.volume;
    audio.currentTime = offset;
    
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
        playPromise.then(() => {
            audio.onended = () => {
                if (appConfig.isPlaying) {
                    appConfig.currentPhraseIndex++;
                    playCurrentPhrase();
                }
            };
        }).catch(error => {
            console.error('Audio playback failed:', error);
            showError('Audio playback failed: ' + error.message);
        });
    }
}

function pauseDialogue() {
    console.log("Pause button clicked");
    
    if (!appConfig.isPlaying) return;
    
    appConfig.isPlaying = false;
    clearInterval(appConfig.highlightInterval);
    
    if (appConfig.currentAudio) {
        appConfig.currentAudio.pause();
    }
    
    updatePlayerControls();
}

function stopDialogue() {
    console.log("Stop button clicked");
    stopAllAudio();
}

function stopAllAudio() {
    appConfig.isPlaying = false;
    appConfig.currentPhraseIndex = 0;
    clearInterval(appConfig.highlightInterval);
    
    appConfig.audioElements.forEach(audio => {
        if (audio && typeof audio.pause === 'function') {
            audio.pause();
            audio.currentTime = 0;
        }
    });
    
    appConfig.currentAudio = null; // Clear current audio reference
    removeAllHighlights();
    updateProgress(0);
    updatePlayerControls();
    
    // 🔥 ADICIONADO: Fechar volume control ao parar
    volumeManager.hideVolumePopup();
}

function playPhrase(index) {
    console.log("Playing phrase:", index, "(Single phrase mode)");
    
    stopAllAudio(); // Stop any ongoing playback
    
    // ⚠️ CORREÇÃO: Modo de frase única - não deve continuar automaticamente
    appConfig.isPlaying = false; // Forçar modo não-sequência
    appConfig.currentPhraseIndex = index; // Set the starting point apenas para referência
    
    if (index >= appConfig.audioElements.length) {
        showError('Phrase index out of range');
        return;
    }
    
    const audio = appConfig.audioElements[index];
    appConfig.currentAudio = audio;
    audio.volume = appConfig.volume;
    
    highlightCurrentPhrase();
    updatePlayerControls();
    
    // 🔥 ADICIONADO: Fechar volume control ao tocar frase
    volumeManager.hideVolumePopup();
    
    if (!audio || !audio.src) {
        showError('Audio not available for this phrase');
        return;
    }
    
    audio.currentTime = 0;
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
        playPromise.then(() => {
            // ⚠️ CORREÇÃO: Modo de frase única - NÃO continuar automaticamente
            audio.onended = () => {
                removeAllHighlights();
                // ⚠️ IMPORTANTE: Não avançar para a próxima frase
                // Manter o currentPhraseIndex no mesmo lugar para que o Play continue daqui
                appConfig.isPlaying = false;
                updatePlayerControls();
                
                console.log("Single phrase playback finished. Ready for manual play.");
            };
        }).catch(error => {
            console.error('Audio playback failed:', error);
            showError('Audio playback failed: ' + error.message);
        });
    }
    
    updateProgress(getCurrentPlaybackTime());
}

// UI functions
function highlightCurrentPhrase() {
    removeAllHighlights();
    
    const messages = document.querySelectorAll('.message');
    if (appConfig.currentPhraseIndex < messages.length) {
        messages[appConfig.currentPhraseIndex].classList.add('highlighted');
        messages[appConfig.currentPhraseIndex].classList.add('playing');
        
        // 🔥 MELHORADO: Scroll otimizado para mobile
        if (window.innerWidth <= 768) {
            setTimeout(() => {
                messages[appConfig.currentPhraseIndex].scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center',
                    inline: 'nearest'
                });
            }, 100);
        } else {
            messages[appConfig.currentPhraseIndex].scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
        }
    }
}

function removeAllHighlights() {
    document.querySelectorAll('.message').forEach(msg => {
        msg.classList.remove('highlighted');
        msg.classList.remove('playing');
    });
}

function startProgressTracking() {
    clearInterval(appConfig.highlightInterval);
    
    appConfig.highlightInterval = setInterval(() => {
        if (!appConfig.isPlaying) return;
        updateProgress(getCurrentPlaybackTime());
    }, 100);
}

function getCurrentPlaybackTime() {
    if (!appConfig.isPlaying || appConfig.currentPhraseIndex >= appConfig.audioElements.length) return 0;
    
    let time = 0;
    for (let i = 0; i < appConfig.currentPhraseIndex; i++) {
        time += appConfig.phraseDurations[i];
    }
    
    if (appConfig.currentAudio && !isNaN(appConfig.currentAudio.currentTime)) {
        time += appConfig.currentAudio.currentTime;
    }
    
    return time;
}

function updateProgress(currentTime) {
    const progressPercent = (currentTime / appConfig.totalDuration) * 100;
    if (domElements.progressBar) {
        domElements.progressBar.style.setProperty('--progress', `${progressPercent}%`);
    }
    updateTimeDisplay(currentTime, appConfig.totalDuration);
}

function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function updateTimeDisplay(current, total) {
    if (domElements.currentTimeDisplay) {
        domElements.currentTimeDisplay.textContent = formatTime(current);
    }
    if (domElements.totalTimeDisplay) {
        domElements.totalTimeDisplay.textContent = formatTime(total);
    }
}

function updatePlayerControls() {
    if (domElements.playBtn) {
        domElements.playBtn.style.display = appConfig.isPlaying ? 'none' : 'inline-flex';
    }
    if (domElements.pauseBtn) {
        domElements.pauseBtn.style.display = appConfig.isPlaying ? 'inline-flex' : 'none';
    }
    if (domElements.stopBtn) {
        // Stop button should be visible when playing
        domElements.stopBtn.style.display = appConfig.isPlaying ? 'inline-flex' : 'none';
    }
}

function toggleTranslationMode() {
    console.log("Translate toggle clicked");
    
    appConfig.showTranslations = !appConfig.showTranslations;
    
    if (domElements.translateToggleBtn) {
        if (appConfig.showTranslations) {
            domElements.translateToggleBtn.classList.add('active');
        } else {
            domElements.translateToggleBtn.classList.remove('active');
        }
    }
    
    updateTranslationVisibility();
}

function updateTranslationVisibility() {
    const dialogueContainer = document.querySelector('.dialogue-container');
    const translations = document.querySelectorAll('.translation-text');
    
    if (appConfig.showTranslations) {
        dialogueContainer.classList.add('show-translations');
        translations.forEach(translation => {
            translation.style.display = 'block';
        });
    } else {
        dialogueContainer.classList.remove('show-translations');
        translations.forEach(translation => {
            translation.style.display = 'none';
        });
    }
}

// Função para alternar modo fullscreen
function toggleFullscreen() {
    const dialogueContainer = document.querySelector('.dialogue-container');
    const fullscreenBtn = document.getElementById('fullscreen-toggle-btn');
    
    if (!dialogueContainer || !fullscreenBtn) return;
    
    const isFullscreen = dialogueContainer.classList.contains('mobile-fullscreen');
    
    if (isFullscreen) {
        // Sair do fullscreen
        dialogueContainer.classList.remove('mobile-fullscreen');
        fullscreenBtn.classList.remove('active');
        document.body.style.overflow = 'auto';
        document.body.style.position = 'static';
    } else {
        // Entrar no fullscreen
        dialogueContainer.classList.add('mobile-fullscreen');
        fullscreenBtn.classList.add('active');
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        document.body.style.height = '100%';
        
        // Forçar redimensionamento imediato
        setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
        }, 100);
    }
}

// 🔥 ATUALIZADO: Função updateVolume unificada
function updateVolume(volume) {
    appConfig.volume = volume;
    
    appConfig.audioElements.forEach(audio => {
        if (audio) {
            audio.volume = appConfig.volume;
        }
    });
    
    // Atualizar ambos os sistemas de volume
    if (window.innerWidth <= 768) {
        volumeManager.updateVolume(volume, false);
    } else {
        if (domElements.volumeBtn) {
            if (appConfig.volume === 0) {
                domElements.volumeBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
            } else if (appConfig.volume < 0.5) {
                domElements.volumeBtn.innerHTML = '<i class="fas fa-volume-down"></i>';
            } else {
                domElements.volumeBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
            }
        }
    }
    
    // Atualizar slider visualmente
    if (domElements.volumeSlider) {
        domElements.volumeSlider.value = appConfig.volume;
    }
}

// 🔥 ATUALIZADO: Função toggleMute unificada
function toggleMute() {
    if (window.innerWidth <= 768) {
        volumeManager.toggleMute();
    } else {
        // Comportamento original para desktop
        if (appConfig.volume > 0) {
            appConfig.lastVolume = appConfig.volume;
            updateVolume(0);
            if (domElements.volumeSlider) {
                domElements.volumeSlider.value = 0;
            }
        } else {
            updateVolume(appConfig.lastVolume || 0.7);
            if (domElements.volumeSlider) {
                domElements.volumeSlider.value = appConfig.lastVolume || 0.7;
            }
        }
    }
}

// 🔥 NOVA FUNÇÃO: Fechar controle de volume
function closeVolumeControl() {
    if (window.innerWidth <= 768) {
        volumeManager.hideVolumePopup();
    }
}

function getFilteredThemes() {
    if (!appConfig.data || !appConfig.data.themes) return [];
    
    // Verificar se há parâmetro de idioma na URL
    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get('lang');
    
    console.log('URL params:', window.location.search);
    console.log('Lang param detected:', langParam);
    
    if (langParam === 'es') {
        console.log('Filtering Spanish themes...');
        // Para espanhol, incluir todos os temas relevantes
        const spanishThemes = [
            'Emprendimiento y Startups',
            'Bienestar y Salud Mental',
            'Sostenibilidad y Moda Ética',
            'Tecnología e Inteligencia Artificial',
            'Viajes y Turismo Slow',
            'Gastronomía y Tendencias Culinarias',
            'El Futuro del Trabajo (Remote Work)',
            'Activismo Social y Justicia',
            'Cultura Podcast y Nuevos Medios',
            'Relaciones y Amor en la Era Digital',
            'Educación Online y Aprendizaje Continuo',
            'Música Indie y Escenas Locales',
            'Cine y Series de Streaming',
            'Deporte y Rendimiento Atlético',
            'Economía Personal y Inversiones'
        ];
        
        return appConfig.data.themes.filter(theme => 
            spanishThemes.includes(theme.title)
        );
    }
    
    // Retornar todos os temas por padrão
    return appConfig.data.themes;
}

function renderThemeCards() {
    if (!domElements.themeContainer) return;
    
    domElements.themeContainer.innerHTML = '';
    
    const filteredThemes = getFilteredThemes();
    if (!filteredThemes.length) return;
    
    // Verificar se é modo espanhol para aplicar layout específico
    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get('lang');
    
    if (langParam === 'es') {
        domElements.themeContainer.classList.add('spanish-layout');
    } else {
        domElements.themeContainer.classList.remove('spanish-layout');
    }
    
    // Atualizar configuração baseada nos temas filtrados
    const totalFilteredThemes = filteredThemes.length;
    const maxVisibleThemes = Math.min(appConfig.visibleThemes, totalFilteredThemes);
    
    filteredThemes.slice(0, maxVisibleThemes).forEach(theme => {
        const themeCard = document.createElement('div');
        themeCard.className = 'theme-card';
        themeCard.innerHTML = `
            <h3>${theme.name || theme.title}</h3>
            <ul>
                ${theme.topics.map(topic => `
                    <li onclick="loadDialogue('${topic.id}')" 
                        data-id="${topic.id}"
                        ${appConfig.currentDialogue === topic.id ? 'class="active"' : ''}>
                        ${topic.name}
                    </li>
                `).join('')}
            </ul>
        `;
        domElements.themeContainer.appendChild(themeCard);
    });
    
    updateThemeControls();
}

function updateThemeControls() {
    const loadMoreBtn = document.getElementById('load-more-btn');
    const showLessBtn = document.getElementById('show-less-btn');
    
    if (!loadMoreBtn || !showLessBtn || !appConfig.data || !appConfig.data.translations) return;
    
    const translations = appConfig.data.translations[dialogueTranslationManager.currentLanguage] || appConfig.data.translations['en'] || {};
    
    const loadMoreSpan = loadMoreBtn.querySelector('span[data-translate="loadMore"]');
    const showLessSpan = showLessBtn.querySelector('span[data-translate="showLess"]');
    
    if (loadMoreSpan && translations['loadMore']) {
        loadMoreSpan.textContent = translations['loadMore'];
    }
    
    if (showLessSpan && translations['showLess']) {
        showLessSpan.textContent = translations['showLess'];
    }
    
    // Usar temas filtrados ao invés de todos os temas
    const filteredThemes = getFilteredThemes();
    const totalFilteredThemes = filteredThemes.length;
    
    if (appConfig.visibleThemes >= totalFilteredThemes) {
        loadMoreBtn.style.display = 'none';
    } else {
        loadMoreBtn.style.display = 'flex';
    }
    
    if (appConfig.visibleThemes > appConfig.initialThemes) {
        showLessBtn.style.display = 'flex';
    } else {
        showLessBtn.style.display = 'none';
    }
}

function showError(message) {
    const existingError = document.querySelector('.global-error');
    if (existingError) existingError.remove();
    
    const errorElement = document.createElement('div');
    errorElement.className = 'global-error';
    errorElement.textContent = message;
    errorElement.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ef233c;
        color: white;
        padding: 15px;
        border-radius: 8px;
        z-index: 10000;
        max-width: 300px;
    `;
    
    document.body.appendChild(errorElement);
    
    setTimeout(() => {
        if (errorElement.parentNode) {
            errorElement.parentNode.removeChild(errorElement);
        }
    }, 5000);
}

function setupEventListeners() {
    console.log("Setting up event listeners...");
    
    if (domElements.playBtn) {
        domElements.playBtn.addEventListener('click', playDialogue);
        // 🔥 ADICIONADO: Touch feedback para mobile
        domElements.playBtn.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.92)';
        });
        domElements.playBtn.addEventListener('touchend', function() {
            this.style.transform = 'scale(1)';
        });
    }
    
    if (domElements.pauseBtn) {
        domElements.pauseBtn.addEventListener('click', pauseDialogue);
        domElements.pauseBtn.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.92)';
        });
        domElements.pauseBtn.addEventListener('touchend', function() {
            this.style.transform = 'scale(1)';
        });
    }
    
    if (domElements.stopBtn) {
        domElements.stopBtn.addEventListener('click', stopDialogue);
        domElements.stopBtn.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.92)';
        });
        domElements.stopBtn.addEventListener('touchend', function() {
            this.style.transform = 'scale(1)';
        });
    }
    
    if (domElements.translateToggleBtn) {
        domElements.translateToggleBtn.addEventListener('click', toggleTranslationMode);
        domElements.translateToggleBtn.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.92)';
        });
        domElements.translateToggleBtn.addEventListener('touchend', function() {
            this.style.transform = 'scale(1)';
        });
    }
    
    // Fullscreen toggle button
    const fullscreenBtn = document.getElementById('fullscreen-toggle-btn');
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', toggleFullscreen);
        fullscreenBtn.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.92)';
        });
        fullscreenBtn.addEventListener('touchend', function() {
            this.style.transform = 'scale(1)';
        });
    }
    
    if (domElements.volumeBtn) {
        // 🔥 ATUALIZADO: Usar o volume manager para mobile
        if (window.innerWidth <= 768) {
            // O volume manager já cuida dos event listeners
        } else {
            domElements.volumeBtn.addEventListener('click', toggleMute);
        }
        
        domElements.volumeBtn.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.92)';
        });
        domElements.volumeBtn.addEventListener('touchend', function() {
            this.style.transform = 'scale(1)';
        });
    }
    
    if (domElements.volumeSlider) {
        domElements.volumeSlider.addEventListener('input', (e) => {
            updateVolume(parseFloat(e.target.value));
        });
    }
    
    // 🔥 ATUALIZADO: Event listener para a barra de progresso com seek
    if (domElements.progressBar) {
        domElements.progressBar.addEventListener('click', handleProgressBarClick);
        
        // 🔥 ADICIONADO: Suporte a touch para progress bar
        domElements.progressBar.addEventListener('touchstart', handleProgressBarTouch);
        domElements.progressBar.addEventListener('touchmove', handleProgressBarTouch);
    }

    const loadMoreBtn = document.getElementById('load-more-btn');
    const showLessBtn = document.getElementById('show-less-btn');
    
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', loadMoreThemes);
        loadMoreBtn.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.95)';
        });
        loadMoreBtn.addEventListener('touchend', function() {
            this.style.transform = 'scale(1)';
        });
    }
    if (showLessBtn) {
        showLessBtn.addEventListener('click', showLessThemes);
        showLessBtn.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.95)';
        });
        showLessBtn.addEventListener('touchend', function() {
            this.style.transform = 'scale(1)';
        });
    }
    
    // 🔥 ADICIONADO: Listener para redimensionamento
    window.addEventListener('resize', handleResize);
}

// 🔥 NOVA FUNÇÃO: Handle progress bar click (seek functionality)
function handleProgressBarClick(e) {
    const rect = domElements.progressBar.getBoundingClientRect();
    const seekPercent = (e.clientX - rect.left) / rect.width;
    const seekTime = seekPercent * appConfig.totalDuration;
    
    // Parar tudo para evitar sobreposição de áudios
    stopAllAudio();
    
    // Encontrar a frase correspondente ao tempo seeked
    let accumulatedTime = 0;
    let newPhraseIndex = 0;
    let offsetInPhrase = 0;
    
    for (let i = 0; i < appConfig.phraseDurations.length; i++) {
        if (accumulatedTime + appConfig.phraseDurations[i] > seekTime) {
            newPhraseIndex = i;
            offsetInPhrase = seekTime - accumulatedTime;
            break;
        }
        accumulatedTime += appConfig.phraseDurations[i];
    }
    
    // Atualizar índice da frase atual
    appConfig.currentPhraseIndex = newPhraseIndex;
    
    // Se estava tocando, continuar a reprodução do novo ponto
    if (appConfig.isPlaying) {
        playCurrentPhraseWithOffset(offsetInPhrase);
        appConfig.isPlaying = true; // Manter estado de playing
    } else {
        // Se estava pausado, apenas destacar a frase
        highlightCurrentPhrase();
    }
    
    // Atualizar a barra de progresso
    updateProgress(seekTime);
}

// 🔥 NOVA FUNÇÃO: Handle progress bar touch events
function handleProgressBarTouch(e) {
    if (e.touches && e.touches[0]) {
        e.preventDefault();
        const rect = domElements.progressBar.getBoundingClientRect();
        const touch = e.touches[0];
        const seekPercent = (touch.clientX - rect.left) / rect.width;
        const seekTime = seekPercent * appConfig.totalDuration;
        
        // Parar tudo para evitar sobreposição
        stopAllAudio();
        
        let accumulatedTime = 0;
        let newPhraseIndex = 0;
        let offsetInPhrase = 0;
        
        for (let i = 0; i < appConfig.phraseDurations.length; i++) {
            if (accumulatedTime + appConfig.phraseDurations[i] > seekTime) {
                newPhraseIndex = i;
                offsetInPhrase = seekTime - accumulatedTime;
                break;
            }
            accumulatedTime += appConfig.phraseDurations[i];
        }
        
        appConfig.currentPhraseIndex = newPhraseIndex;
        
        if (appConfig.isPlaying) {
            playCurrentPhraseWithOffset(offsetInPhrase);
            appConfig.isPlaying = true;
        } else {
            highlightCurrentPhrase();
        }
        
        updateProgress(seekTime);
    }
}

// 🔥 NOVA FUNÇÃO: Handle window resize
function handleResize() {
    // Recalcular temas por linha
    appConfig.themesPerLine = calculateThemesPerLine();
    
    // Re-otimizar para mobile
    optimizeForMobile();
    
    // Re-renderizar temas se necessário
    if (appConfig.initialized) {
        renderThemeCards();
    }
}

// 🔥 NOVAS FUNÇÕES: Otimizações Mobile
function setupMobileOptimizations() {
    // Configurações existentes do volume control
    const volumeControl = document.querySelector('.volume-control');
    if (volumeControl && window.innerWidth <= 768) {
        volumeControl.style.display = 'none'; // Esconder controle desktop
    }
}

function optimizeForMobile() {
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        // Auto-close volume control quando player para
        const originalStop = stopAllAudio;
        stopAllAudio = function() {
            originalStop.apply(this, arguments);
            volumeManager.hideVolumePopup();
        };

        // Scroll suave melhorado para mobile
        const originalHighlight = highlightCurrentPhrase;
        highlightCurrentPhrase = function() {
            originalHighlight.apply(this, arguments);
            
            setTimeout(() => {
                const highlighted = document.querySelector('.message.highlighted');
                if (highlighted) {
                    highlighted.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                        inline: 'nearest'
                    });
                }
            }, 100);
        };
    }
}

function loadMoreThemes() {
    if (!appConfig.data || !appConfig.data.themes) return;
    
    const filteredThemes = getFilteredThemes();
    if (!filteredThemes.length) return;
    
    // Para espanhol, usar sempre 3 colunas
    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get('lang');
    const themesPerLine = langParam === 'es' ? 3 : calculateThemesPerLine();
    
    appConfig.currentLine++;
    
    const newVisibleThemes = themesPerLine * appConfig.currentLine;
    appConfig.visibleThemes = Math.min(newVisibleThemes, filteredThemes.length);
    
    renderThemeCards();
}

function showLessThemes() {
    appConfig.currentLine = 1;
    
    // Para espanhol, usar sempre 3 colunas
    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get('lang');
    const themesPerLine = langParam === 'es' ? 3 : calculateThemesPerLine();
    
    appConfig.visibleThemes = themesPerLine;
    renderThemeCards();
    
    const sectionTitle = document.querySelector('.section-title');
    if (sectionTitle) {
        sectionTitle.scrollIntoView({ behavior: 'smooth' });
    }
}

function calculateThemesPerLine() {
    const grid = document.querySelector('.theme-grid');
    if (!grid) return 4;
    
    const gridWidth = grid.offsetWidth;
    const cardWidth = 280;
    const gap = 32;
    
    return Math.max(1, Math.floor(gridWidth / (cardWidth + gap)));
}

function updateDialogueUITexts(langCode) {
    if (!appConfig.data || !appConfig.data.translations) return;
    
    const translations = appConfig.data.translations[langCode] || appConfig.data.translations['en'] || {};
    
    // Atualizar apenas elementos específicos da página de diálogos (não do navbar)
    const dialogueContainer = document.querySelector('.content-below-navbar');
    if (dialogueContainer) {
        dialogueContainer.querySelectorAll('[data-translate]').forEach(element => {
            const key = element.getAttribute('data-translate');
            if (translations[key]) {
                element.textContent = translations[key];
            }
        });
    }
    
    // Atualizar explicitamente os botões de carregar mais e mostrar menos
    const loadMoreBtn = document.getElementById('load-more-btn');
    const showLessBtn = document.getElementById('show-less-btn');
    
    if (loadMoreBtn) {
        const loadMoreSpan = loadMoreBtn.querySelector('span[data-translate="loadMore"]');
        if (loadMoreSpan && translations['loadMore']) {
            loadMoreSpan.textContent = translations['loadMore'];
        }
    }
    
    if (showLessBtn) {
        const showLessSpan = showLessBtn.querySelector('span[data-translate="showLess"]');
        if (showLessSpan && translations['showLess']) {
            showLessSpan.textContent = translations['showLess'];
        }
    }
}

function updateDialogueTranslations(langCode) {
    const dialogue = appConfig.dialogues[appConfig.currentDialogue];
    if (!dialogue) return;
    
    document.querySelectorAll('.message').forEach((messageElement, index) => {
        const translationDiv = messageElement.querySelector('.translation-text');
        if (translationDiv && dialogue.lines[index]) {
            translationDiv.textContent = dialogue.lines[index].translations[langCode] || getFallbackTranslation(langCode);
            translationDiv.setAttribute('data-lang', langCode);
        }
    });
}

// Make functions available globally
window.loadDialogue = loadDialogue;
window.playPhrase = playPhrase;
window.toggleTranslationMode = toggleTranslationMode;
window.toggleFullscreen = toggleFullscreen;
window.toggleMute = toggleMute;
window.loadMoreThemes = loadMoreThemes;
window.showLessThemes = showLessThemes;
window.closeVolumeControl = closeVolumeControl;

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(init, 100);
});