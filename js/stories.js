// App configuration and data for stories
let appConfig = {
    stories: {},
    currentLanguage: 'en',
    currentStory: 'the_last_ride',
    currentAudio: null,
    isPlaying: false,
    currentParagraphIndex: 0,
    audioElements: [],
    paragraphDurations: [],
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

// Volume manager for mobile
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
        
        if (volumeBtn) {
            volumeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleVolumePopup();
            });
            
            this.setupTouchGestures(volumeBtn);
        }
        
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
        
        if (volumeCloseBtn) {
            volumeCloseBtn.addEventListener('click', () => {
                this.hideVolumePopup();
            });
        }
        
        document.querySelectorAll('.volume-preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const volume = parseFloat(e.target.getAttribute('data-value'));
                this.updateVolume(volume, true);
                this.saveVolumePreference(volume);
                this.hideVolumePopup();
            });
        });
        
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
        
        appConfig.audioElements.forEach(audio => {
            if (audio) {
                audio.volume = this.currentVolume;
            }
        });
        
        if (updateSlider) {
            const desktopSlider = document.getElementById('volume-slider');
            const mobileSlider = document.getElementById('mobile-volume-slider');
            
            if (desktopSlider) desktopSlider.value = volume;
            if (mobileSlider) mobileSlider.value = volume;
        }
        
        this.updateVolumeIcon();
    },
    
    updateVolumeIcon() {
        const volumeBtn = document.getElementById('volume-btn');
        if (volumeBtn) {
            const icon = volumeBtn.querySelector('i');
            if (icon) {
                icon.className = this.currentVolume === 0 ? 'fas fa-volume-mute' : 
                               this.currentVolume < 0.5 ? 'fas fa-volume-down' : 'fas fa-volume-up';
            }
        }
    },
    
    saveVolumePreference(volume) {
        localStorage.setItem('appVolume', volume.toString());
    },
    
    showVolumeFeedback(volume) {
        // Implementation for volume feedback
    },
    
    hideVolumeFeedback() {
        // Implementation for hiding volume feedback
    },
    
    toggleMute() {
        if (this.isMuted) {
            this.updateVolume(this.lastVolume, true);
            this.isMuted = false;
        } else {
            this.lastVolume = this.currentVolume;
            this.updateVolume(0, true);
            this.isMuted = true;
        }
    }
};

// Story translation manager
const storyTranslationManager = {
    currentLanguage: 'pt',
    
    init() {
        this.loadStoredLanguage();
        this.setupEventListeners();
    },
    
    setupEventListeners() {
        const translateBtn = document.getElementById('translate-toggle-btn');
        if (translateBtn) {
            translateBtn.addEventListener('click', () => toggleTranslationMode());
        }
        
        // Listen for language changes from language-manager
        document.addEventListener('translationLanguageChanged', (e) => {
            const newLanguage = e.detail.language;
            this.changeLanguage(newLanguage);
            // Also update appConfig to load stories in the correct language
            appConfig.currentLanguage = newLanguage;
        });
        
        // Listen for native language changes from navbar
        document.addEventListener('nativeLanguageChanged', (e) => {
            const newLanguage = e.detail.language;
            this.changeLanguage(newLanguage);
            // Also update appConfig to load stories in the correct language
            appConfig.currentLanguage = newLanguage;
        });
    },
    
    loadStoredLanguage() {
        // Load saved language - using same key as dialogues for consistency
        const savedLang = localStorage.getItem('translationLanguage') || 'pt';
        this.currentLanguage = savedLang;
    },
    
    changeLanguage(langCode) {
        this.currentLanguage = langCode;
        localStorage.setItem('translationLanguage', langCode);
        this.updateAllTranslations();
    },
    
    updateAllTranslations() {
        // Update story translations based on current language
        const translationElements = document.querySelectorAll('.translation-text');
        const paragraphs = appConfig.stories[appConfig.currentStory]?.paragraphs || [];
        
        translationElements.forEach((element, index) => {
            if (paragraphs[index] && paragraphs[index].translations) {
                const translation = paragraphs[index].translations[this.currentLanguage] || '';
                element.textContent = translation;
            }
        });
    }
};

let domElements = {};

// Initialize the application
async function init() {
    try {
        console.log('🚀 Initializing Stories App...');
        
        // Initialize DOM elements
        initDomElements();
        
        // Initialize native language manager first
        if (window.nativeLanguageManager) {
            await window.nativeLanguageManager.init();
        }
        
        // Initialize managers
        volumeManager.init();
        storyTranslationManager.init();
        
        // Load data
        if (typeof loadData === 'function') {
            appConfig.data = await loadData();
        }
        
        // Setup event listeners
        setupEventListeners();
        
        // Load default story
        await loadStory(appConfig.currentStory);
        
        // Render story cards
        renderStoryCards();
        
        // Setup mobile optimizations
        setupMobileOptimizations();
        
        appConfig.initialized = true;
        console.log('✅ Stories App initialized successfully');
        
    } catch (error) {
        console.error('❌ Failed to initialize Stories App:', error);
        showError('Failed to load the application. Please refresh the page.');
    }
}

// Initialize DOM elements
function initDomElements() {
    domElements = {
        storyContent: document.getElementById('story-content'),
        storyTitle: document.getElementById('story-title-text'),
        playBtn: document.getElementById('play-btn'),
        pauseBtn: document.getElementById('pause-btn'),
        stopBtn: document.getElementById('stop-btn'),
        translateBtn: document.getElementById('translate-toggle-btn'),
        volumeBtn: document.getElementById('volume-btn'),
        volumeSlider: document.getElementById('volume-slider'),
        progressBar: document.getElementById('progress-bar'),
        currentTime: document.getElementById('current-time'),
        totalTime: document.getElementById('total-time'),
        storyContainer: document.getElementById('story-container'),
        loadMoreBtn: document.getElementById('load-more-btn'),
        showLessBtn: document.getElementById('show-less-btn')
    };
}

// Load a story
async function loadStory(storyId) {
    try {
        console.log(`📖 Loading story: ${storyId}`);
        
        // Stop current playback
        stopStory();
        
        // Load story text
        const storyData = await loadStoryTxt(storyId);
        if (!storyData) {
            throw new Error(`Story ${storyId} not found`);
        }
        
        // Store story data
        appConfig.stories[storyId] = storyData;
        appConfig.currentStory = storyId;
        
        // Update UI
        domElements.storyTitle.textContent = storyData.title || storyId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        // Render story content
        renderStoryContent(storyData);
        
        // Preload audios
        await preloadAudios(storyId);
        
        // Calculate durations
        calculateDurations();
        
        console.log(`✅ Story ${storyId} loaded successfully`);
        
    } catch (error) {
        console.error(`❌ Failed to load story ${storyId}:`, error);
        showError(`Failed to load story: ${storyId}`);
    }
}

// Load story text file
async function loadStoryTxt(storyId) {
    try {
        const response = await fetch(`languages/${appConfig.currentLanguage}/stories/${storyId}/${storyId}.txt`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const content = await response.text();
        return parseStoryTxt(content);
        
    } catch (error) {
        console.error(`Failed to load story txt for ${storyId}:`, error);
        return null;
    }
}

// Parse story text content
function parseStoryTxt(content) {
    const lines = content.split('\n').filter(line => line.trim());
    const story = {
        title: '',
        paragraphs: []
    };
    
    let currentParagraph = null;
    
    for (const line of lines) {
        const trimmedLine = line.trim();
        
        if (trimmedLine.startsWith('title:')) {
            story.title = trimmedLine.substring(6).trim();
        } else if (trimmedLine.startsWith('text:')) {
            // New paragraph
            if (currentParagraph) {
                story.paragraphs.push(currentParagraph);
            }
            currentParagraph = {
                text: trimmedLine.substring(5).trim(),
                translations: {}
            };
        } else if (trimmedLine.includes(':') && currentParagraph) {
            // Translation line
            const colonIndex = trimmedLine.indexOf(':');
            const langCode = trimmedLine.substring(0, colonIndex).trim();
            const translation = trimmedLine.substring(colonIndex + 1).trim();
            currentParagraph.translations[langCode] = translation;
        }
    }
    
    // Add the last paragraph
    if (currentParagraph) {
        story.paragraphs.push(currentParagraph);
    }
    
    // Ensure translations
    ensureTranslations(story);
    
    return story;
}

// Ensure all paragraphs have translations
function ensureTranslations(story) {
    story.paragraphs.forEach(paragraph => {
        if (!paragraph.translations.pt) {
            paragraph.translations.pt = getFallbackTranslation('pt');
        }
        if (!paragraph.translations.es) {
            paragraph.translations.es = getFallbackTranslation('es');
        }
    });
}

// Get fallback translation
function getFallbackTranslation(lang) {
    const fallbacks = {
        pt: 'Tradução não disponível',
        es: 'Traducción no disponible'
    };
    return fallbacks[lang] || 'Translation not available';
}

// Render story content
function renderStoryContent(storyData) {
    if (!domElements.storyContent || !storyData.paragraphs) return;
    
    domElements.storyContent.innerHTML = '';
    
    storyData.paragraphs.forEach((paragraph, index) => {
        const paragraphElement = document.createElement('div');
        paragraphElement.className = 'paragraph';
        paragraphElement.setAttribute('data-index', index);
        paragraphElement.onclick = () => playParagraph(index);
        
        const textElement = document.createElement('div');
        textElement.className = 'paragraph-text';
        textElement.textContent = paragraph.text;
        
        const translationElement = document.createElement('div');
        translationElement.className = 'translation-text';
        const currentLang = storyTranslationManager.currentLanguage;
        translationElement.textContent = paragraph.translations[currentLang] || '';
        
        paragraphElement.appendChild(textElement);
        paragraphElement.appendChild(translationElement);
        
        domElements.storyContent.appendChild(paragraphElement);
    });
}

// Preload audio files
function preloadAudios(storyId) {
    return new Promise((resolve) => {
        const story = appConfig.stories[storyId];
        if (!story || !story.paragraphs) {
            resolve();
            return;
        }
        
        appConfig.audioElements = [];
        let loadedCount = 0;
        const totalAudios = story.paragraphs.length;
        
        if (totalAudios === 0) {
            resolve();
            return;
        }
        
        story.paragraphs.forEach((paragraph, index) => {
            const audio = new Audio();
            audio.preload = 'metadata';
            audio.volume = appConfig.volume;
            
            audio.addEventListener('loadedmetadata', () => {
                loadedCount++;
                if (loadedCount === totalAudios) {
                    console.log(`✅ All ${totalAudios} audio files preloaded`);
                    resolve();
                }
            });
            
            audio.addEventListener('error', (e) => {
                console.warn(`⚠️ Failed to load audio ${index}:`, e);
                loadedCount++;
                if (loadedCount === totalAudios) {
                    resolve();
                }
            });
            
            audio.src = `languages/${appConfig.currentLanguage}/stories/${storyId}/audios/line_${index}.mp3`;
            appConfig.audioElements[index] = audio;
        });
    });
}

// Calculate audio durations
function calculateDurations() {
    appConfig.paragraphDurations = [];
    appConfig.totalDuration = 0;
    
    appConfig.audioElements.forEach((audio, index) => {
        if (audio && !isNaN(audio.duration)) {
            appConfig.paragraphDurations[index] = audio.duration;
            appConfig.totalDuration += audio.duration;
        } else {
            appConfig.paragraphDurations[index] = 0;
        }
    });
    
    updateTotalDuration();
}

// Update total duration display
function updateTotalDuration() {
    if (domElements.totalTime) {
        domElements.totalTime.textContent = formatTime(appConfig.totalDuration);
    }
}

// Play story from beginning
function playStory() {
    if (appConfig.isPlaying) {
        pauseStory();
        return;
    }
    
    console.log('▶️ Playing story');
    appConfig.isPlaying = true;
    playCurrentParagraph();
    updatePlayerControls();
    startProgressTracking();
}

// Play current paragraph
function playCurrentParagraph() {
    if (appConfig.currentParagraphIndex >= appConfig.audioElements.length) {
        stopStory();
        return;
    }
    
    const audio = appConfig.audioElements[appConfig.currentParagraphIndex];
    if (!audio) {
        console.warn(`No audio for paragraph ${appConfig.currentParagraphIndex}`);
        appConfig.currentParagraphIndex++;
        playCurrentParagraph();
        return;
    }
    
    appConfig.currentAudio = audio;
    
    // Highlight current paragraph
    highlightCurrentParagraph();
    
    // Setup audio event listeners
    audio.onended = () => {
        appConfig.currentParagraphIndex++;
        if (appConfig.isPlaying) {
            playCurrentParagraph();
        }
    };
    
    audio.onerror = (e) => {
        console.error(`Audio error for paragraph ${appConfig.currentParagraphIndex}:`, e);
        appConfig.currentParagraphIndex++;
        if (appConfig.isPlaying) {
            playCurrentParagraph();
        }
    };
    
    // Play audio
    audio.play().catch(error => {
        console.error('Failed to play audio:', error);
        appConfig.currentParagraphIndex++;
        if (appConfig.isPlaying) {
            playCurrentParagraph();
        }
    });
}

// Pause story
function pauseStory() {
    console.log('⏸️ Pausing story');
    appConfig.isPlaying = false;
    
    if (appConfig.currentAudio) {
        appConfig.currentAudio.pause();
    }
    
    updatePlayerControls();
}

// Stop story
function stopStory() {
    console.log('⏹️ Stopping story');
    appConfig.isPlaying = false;
    appConfig.currentParagraphIndex = 0;
    
    stopAllAudio();
    removeAllHighlights();
    updatePlayerControls();
    updateProgress(0);
}

// Stop all audio
function stopAllAudio() {
    appConfig.audioElements.forEach(audio => {
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
        }
    });
    appConfig.currentAudio = null;
}

// Play specific paragraph
function playParagraph(index) {
    if (index < 0 || index >= appConfig.audioElements.length) return;
    
    console.log(`▶️ Playing paragraph ${index}`);
    
    // Stop current playback
    stopAllAudio();
    removeAllHighlights();
    
    // Set new index
    appConfig.currentParagraphIndex = index;
    appConfig.isPlaying = true;
    
    // Play from this paragraph
    playCurrentParagraph();
    updatePlayerControls();
    startProgressTracking();
}

// Highlight current paragraph
function highlightCurrentParagraph() {
    removeAllHighlights();
    
    const paragraphElement = document.querySelector(`[data-index="${appConfig.currentParagraphIndex}"]`);
    if (paragraphElement) {
        paragraphElement.classList.add('highlighted');
        
        // Scroll into view
        paragraphElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
    }
}

// Remove all highlights
function removeAllHighlights() {
    document.querySelectorAll('.paragraph.highlighted').forEach(el => {
        el.classList.remove('highlighted');
    });
}

// Start progress tracking
function startProgressTracking() {
    if (appConfig.highlightInterval) {
        clearInterval(appConfig.highlightInterval);
    }
    
    appConfig.highlightInterval = setInterval(() => {
        if (appConfig.isPlaying) {
            const currentTime = getCurrentPlaybackTime();
            updateProgress(currentTime);
        }
    }, 100);
}

// Get current playback time
function getCurrentPlaybackTime() {
    let totalTime = 0;
    
    // Add duration of completed paragraphs
    for (let i = 0; i < appConfig.currentParagraphIndex; i++) {
        totalTime += appConfig.paragraphDurations[i] || 0;
    }
    
    // Add current paragraph time
    if (appConfig.currentAudio && !isNaN(appConfig.currentAudio.currentTime)) {
        totalTime += appConfig.currentAudio.currentTime;
    }
    
    return totalTime;
}

// Update progress bar
function updateProgress(currentTime) {
    const progress = appConfig.totalDuration > 0 ? (currentTime / appConfig.totalDuration) * 100 : 0;
    
    if (domElements.progressBar) {
        domElements.progressBar.style.setProperty('--progress', `${progress}%`);
    }
    
    updateTimeDisplay(currentTime, appConfig.totalDuration);
}

// Format time in MM:SS
function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Update time display
function updateTimeDisplay(current, total) {
    if (domElements.currentTime) {
        domElements.currentTime.textContent = formatTime(current);
    }
    if (domElements.totalTime) {
        domElements.totalTime.textContent = formatTime(total);
    }
}

// Update player controls
function updatePlayerControls() {
    if (domElements.playBtn) {
        domElements.playBtn.style.display = appConfig.isPlaying ? 'none' : 'inline-flex';
    }
    if (domElements.pauseBtn) {
        domElements.pauseBtn.style.display = appConfig.isPlaying ? 'inline-flex' : 'none';
    }
    if (domElements.stopBtn) {
        domElements.stopBtn.style.display = appConfig.isPlaying ? 'inline-flex' : 'none';
    }
}

// Toggle translation mode
function toggleTranslationMode() {
    appConfig.showTranslations = !appConfig.showTranslations;
    updateTranslationVisibility();
    
    // Update button state
    if (domElements.translateBtn) {
        domElements.translateBtn.classList.toggle('active', appConfig.showTranslations);
    }
}

// Update translation visibility
function updateTranslationVisibility() {
    const translations = document.querySelectorAll('.translation-text');
    translations.forEach(translation => {
        translation.style.display = appConfig.showTranslations ? 'block' : 'none';
    });
}

// Update volume
function updateVolume(volume) {
    appConfig.volume = volume;
    
    appConfig.audioElements.forEach(audio => {
        if (audio) {
            audio.volume = volume;
        }
    });
    
    // Update volume manager
    volumeManager.updateVolume(volume, false);
    
    // Save preference
    localStorage.setItem('storyVolume', volume.toString());
}

// Toggle mute
function toggleMute() {
    volumeManager.toggleMute();
}

// Fullscreen functionality
function toggleFullscreen() {
    const storyContainer = document.querySelector('.story-container');
    const fullscreenBtn = document.getElementById('fullscreen-toggle-btn');
    
    if (!storyContainer || !fullscreenBtn) return;
    
    const isFullscreen = storyContainer.classList.contains('mobile-fullscreen');
    
    if (isFullscreen) {
        // Sair do fullscreen
        storyContainer.classList.remove('mobile-fullscreen');
        fullscreenBtn.classList.remove('active');
        document.body.style.overflow = 'auto';
    } else {
        // Entrar no fullscreen
        storyContainer.classList.add('mobile-fullscreen');
        fullscreenBtn.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

// Render story cards
function renderStoryCards() {
    if (!domElements.storyContainer) return;
    
    // Sample story data - in a real app, this would come from a data source
    const stories = [
        {
            id: 'the_last_ride',
            title: 'The Last Ride of Paul Revere',
            description: 'A historical tale of courage and determination during the American Revolution.'
        },
        {
            id: 'the_trip',
            title: 'The Trip',
            description: 'An adventure story about an unexpected journey and the lessons learned along the way.'
        }
    ];
    
    domElements.storyContainer.innerHTML = '';
    
    const visibleStories = stories.slice(0, appConfig.visibleThemes);
    
    visibleStories.forEach(story => {
        const card = document.createElement('div');
        card.className = 'theme-card';
        card.onclick = () => loadStory(story.id);
        
        card.innerHTML = `
            <h3>${story.title}</h3>
            <p>${story.description}</p>
        `;
        
        domElements.storyContainer.appendChild(card);
    });
    
    updateThemeControls();
}

// Update theme controls
function updateThemeControls() {
    const totalStories = 4; // This would be dynamic in a real app
    
    if (domElements.loadMoreBtn) {
        domElements.loadMoreBtn.style.display = appConfig.visibleThemes < totalStories ? 'block' : 'none';
    }
    
    if (domElements.showLessBtn) {
        domElements.showLessBtn.style.display = appConfig.visibleThemes > appConfig.initialThemes ? 'block' : 'none';
    }
}

// Show error message
function showError(message) {
    console.error('Error:', message);
    
    // Create error notification
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-notification';
    errorDiv.innerHTML = `
        <div class="error-content">
            <i class="fas fa-exclamation-triangle"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()">&times;</button>
        </div>
    `;
    
    // Add styles if not already present
    if (!document.querySelector('.error-notification-styles')) {
        const styles = document.createElement('style');
        styles.className = 'error-notification-styles';
        styles.textContent = `
            .error-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: var(--danger);
                color: white;
                padding: 1rem;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                z-index: 1000;
                animation: slideIn 0.3s ease;
            }
            .error-content {
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            .error-content button {
                background: none;
                border: none;
                color: white;
                font-size: 1.2rem;
                cursor: pointer;
                margin-left: auto;
            }
            @keyframes slideIn {
                from { transform: translateX(100%); }
                to { transform: translateX(0); }
            }
        `;
        document.head.appendChild(styles);
    }
    
    document.body.appendChild(errorDiv);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentElement) {
            errorDiv.remove();
        }
    }, 5000);
}

// Setup event listeners
function setupEventListeners() {
    // Player controls
    if (domElements.playBtn) {
        domElements.playBtn.addEventListener('click', playStory);
        domElements.playBtn.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.95)';
        });
        domElements.playBtn.addEventListener('touchend', function() {
            this.style.transform = 'scale(1)';
        });
    }
    
    if (domElements.pauseBtn) {
        domElements.pauseBtn.addEventListener('click', pauseStory);
        domElements.pauseBtn.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.95)';
        });
        domElements.pauseBtn.addEventListener('touchend', function() {
            this.style.transform = 'scale(1)';
        });
    }
    
    if (domElements.stopBtn) {
        domElements.stopBtn.addEventListener('click', stopStory);
        domElements.stopBtn.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.95)';
        });
        domElements.stopBtn.addEventListener('touchend', function() {
            this.style.transform = 'scale(1)';
        });
    }
    
    if (domElements.translateBtn) {
        domElements.translateBtn.addEventListener('click', toggleTranslationMode);
    }
    
    // Fullscreen button
    const fullscreenBtn = document.getElementById('fullscreen-toggle-btn');
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', toggleFullscreen);
        fullscreenBtn.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.95)';
        });
        fullscreenBtn.addEventListener('touchend', function() {
            this.style.transform = 'scale(1)';
        });
    }
    
    // Volume controls
    if (domElements.volumeBtn) {
        domElements.volumeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            volumeManager.toggleVolumePopup();
        });
    }
    
    if (domElements.volumeSlider) {
        domElements.volumeSlider.addEventListener('input', (e) => {
            updateVolume(parseFloat(e.target.value));
        });
    }
    
    // Progress bar
    if (domElements.progressBar) {
        domElements.progressBar.addEventListener('click', handleProgressBarClick);
        domElements.progressBar.addEventListener('touchstart', handleProgressBarTouch);
    }
    
    // Theme controls
    if (domElements.loadMoreBtn) {
        domElements.loadMoreBtn.addEventListener('click', loadMoreStories);
    }
    
    if (domElements.showLessBtn) {
        domElements.showLessBtn.addEventListener('click', showLessStories);
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        switch (e.code) {
            case 'Space':
                e.preventDefault();
                if (appConfig.isPlaying) {
                    pauseStory();
                } else {
                    playStory();
                }
                break;
            case 'Escape':
                stopStory();
                break;
            case 'KeyT':
                toggleTranslationMode();
                break;
        }
    });
    
    // Window resize
    window.addEventListener('resize', handleResize);
}

// Handle progress bar click
function handleProgressBarClick(e) {
    if (appConfig.totalDuration === 0) return;
    
    const rect = domElements.progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const targetTime = percentage * appConfig.totalDuration;
    
    seekToTime(targetTime);
}

// Handle progress bar touch
function handleProgressBarTouch(e) {
    if (appConfig.totalDuration === 0) return;
    
    const rect = domElements.progressBar.getBoundingClientRect();
    const touchX = e.touches[0].clientX - rect.left;
    const percentage = touchX / rect.width;
    const targetTime = percentage * appConfig.totalDuration;
    
    seekToTime(targetTime);
}

// Seek to specific time
function seekToTime(targetTime) {
    let accumulatedTime = 0;
    let targetParagraphIndex = 0;
    let offsetInParagraph = 0;
    
    // Find which paragraph contains the target time
    for (let i = 0; i < appConfig.paragraphDurations.length; i++) {
        const paragraphDuration = appConfig.paragraphDurations[i] || 0;
        
        if (accumulatedTime + paragraphDuration >= targetTime) {
            targetParagraphIndex = i;
            offsetInParagraph = targetTime - accumulatedTime;
            break;
        }
        
        accumulatedTime += paragraphDuration;
    }
    
    // Stop current playback
    stopAllAudio();
    
    // Set new position
    appConfig.currentParagraphIndex = targetParagraphIndex;
    
    // If we were playing, continue playing from new position
    if (appConfig.isPlaying) {
        playCurrentParagraphWithOffset(offsetInParagraph);
    }
    
    // Update progress
    updateProgress(targetTime);
}

// Play current paragraph with offset
function playCurrentParagraphWithOffset(offset) {
    const audio = appConfig.audioElements[appConfig.currentParagraphIndex];
    if (!audio) return;
    
    appConfig.currentAudio = audio;
    audio.currentTime = offset;
    
    highlightCurrentParagraph();
    
    audio.onended = () => {
        appConfig.currentParagraphIndex++;
        if (appConfig.isPlaying) {
            playCurrentParagraph();
        }
    };
    
    audio.play().catch(error => {
        console.error('Failed to play audio with offset:', error);
    });
}

// Handle window resize
function handleResize() {
    calculateThemesPerLine();
    optimizeForMobile();
}

// Setup mobile optimizations
function setupMobileOptimizations() {
    if (window.innerWidth <= 768) {
        optimizeForMobile();
    }
}

// Optimize for mobile
function optimizeForMobile() {
    if (window.innerWidth <= 768) {
        // Hide desktop volume slider on mobile
        if (domElements.volumeSlider) {
            domElements.volumeSlider.style.display = 'none';
        }
        
        // Adjust themes per line for mobile
        appConfig.themesPerLine = 1;
    } else {
        // Show desktop volume slider
        if (domElements.volumeSlider) {
            domElements.volumeSlider.style.display = 'block';
        }
        
        // Reset themes per line for desktop
        calculateThemesPerLine();
    }
}

// Load more stories
function loadMoreStories() {
    appConfig.visibleThemes = Math.min(appConfig.visibleThemes + appConfig.themesPerLine, 8); // Max 8 stories
    renderStoryCards();
}

// Show less stories
function showLessStories() {
    appConfig.visibleThemes = Math.max(appConfig.initialThemes, appConfig.visibleThemes - appConfig.themesPerLine);
    renderStoryCards();
}

// Calculate themes per line
function calculateThemesPerLine() {
    const containerWidth = domElements.storyContainer?.offsetWidth || 1200;
    const cardWidth = 280; // Min width from CSS
    const gap = 24; // Gap from CSS
    
    appConfig.themesPerLine = Math.floor((containerWidth + gap) / (cardWidth + gap)) || 1;
}

// Export functions to global scope
window.loadStory = loadStory;
window.playParagraph = playParagraph;
window.toggleTranslationMode = toggleTranslationMode;
window.toggleFullscreen = toggleFullscreen;
window.toggleMute = toggleMute;
window.loadMoreStories = loadMoreStories;
window.showLessStories = showLessStories;
window.init = init;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (typeof init === 'function') {
            init().catch(error => {
                console.error('Failed to initialize Stories app:', error);
            });
        }
    }, 100);
});