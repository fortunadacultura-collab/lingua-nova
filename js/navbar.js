// Navbar functionality - REVISADO COMPLETAMENTE
class NavbarManager {
    constructor() {
        this.isMobile = window.innerWidth <= 768;
        this.init();
    }

    init() {
        this.loadNavbar();
        this.setupEventListeners();
    }

    async loadNavbar() {
        try {
            const response = await fetch('navbar.html');
            const data = await response.text();
            document.getElementById('navbar-container').innerHTML = data;
            
            // Aguardar o DOM ser atualizado
            setTimeout(() => {
                this.setupLanguageSelectors();
                this.initTooltips();
                this.highlightCurrentPage();
                this.setupUserMenu();
                this.setupMobileMenu();
                
                // Sincronizar com idioma detectado
                if (typeof syncWithDetectedLanguage === 'function') {
                    setTimeout(() => syncWithDetectedLanguage(), 500);
                }
            }, 100);
        } catch (error) {
            console.error('Error loading navbar:', error);
        }
    }

    setupEventListeners() {
        // Fechar menus ao clicar fora
        document.addEventListener('click', (e) => {
            this.closeLanguageSelectorsOnClickOutside(e);
            this.closeUserMenuOnClickOutside(e);
            this.closeDropdownsOnClickOutside(e);
        });

        // Prevenir que o clique nos dropdowns propague
        document.addEventListener('click', (e) => {
            if (e.target.closest('.dropdown-menu')) {
                e.stopPropagation();
            }
        });

        // Detectar mudança de tamanho de tela
        window.addEventListener('resize', () => {
            this.isMobile = window.innerWidth <= 768;
        });
    }

    setupLanguageSelectors() {
        // Seletor de idioma de aprendizado
        const learningSelected = document.getElementById('learning-language');
        const learningOptions = document.getElementById('learning-language-options');
        
        if (learningSelected && learningOptions) {
            learningSelected.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleLanguageSelector(learningSelected.closest('.language-selector'));
                this.closeUserMenu();
            });
            
            this.setupLanguageOptions(learningOptions, 'learning');
        }
        
        // Seletor de idioma nativo
        const userSelected = document.getElementById('user-language');
        const userOptions = document.getElementById('user-language-options');
        
        if (userSelected && userOptions) {
            userSelected.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleLanguageSelector(userSelected.closest('.language-selector'));
                this.closeUserMenu();
            });
            
            this.setupLanguageOptions(userOptions, 'native');
        }
    }

    setupLanguageOptions(optionsContainer, type) {
        optionsContainer.querySelectorAll('li').forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const value = option.getAttribute('data-value');
                const flag = option.getAttribute('data-flag');
                
                if (type === 'learning') {
                    this.changeLearningLanguage(value, flag, optionsContainer, option);
                } else if (type === 'native') {
                    this.changeNativeLanguage(value);
                }
                
                this.closeLanguageSelectors();
            });
        });
    }

    changeLearningLanguage(langCode, flag, optionsContainer, selectedOption) {
        const selectedElement = document.getElementById('learning-language');
        const flagImg = selectedElement.querySelector('img');
        
        if (flagImg) {
            flagImg.src = `assets/images/flags/${flag}.svg`;
            flagImg.alt = langCode;
        }
        
        // Marcar como selecionado
        optionsContainer.querySelectorAll('li').forEach(li => {
            li.classList.remove('selected');
        });
        selectedOption.classList.add('selected');
        
        // Redirecionar
        window.location.href = `study-${langCode}.html`;
    }

    changeNativeLanguage(langCode) {
        console.log(`Selecionado idioma nativo: ${langCode}`);
        
        // Salvar preferência imediatamente quando selecionado manualmente
        localStorage.setItem('nativeLanguage', langCode);
        
        // Notificar mudança
        notifyNativeLanguageChange(langCode);
        
        // Atualizar seletor visual imediatamente
        this.updateNativeLanguageSelector(langCode);
    }
    
    updateNativeLanguageSelector(langCode) {
        const userSelected = document.getElementById('user-language');
        const userOptions = document.getElementById('user-language-options');
        
        if (userSelected && userOptions) {
            const option = userOptions.querySelector(`li[data-value="${langCode}"]`);
            if (option) {
                const flag = option.getAttribute('data-flag');
                const flagImg = userSelected.querySelector('img');
                
                if (flagImg) {
                    flagImg.src = `assets/images/flags/${flag}.svg`;
                    flagImg.alt = langCode.toUpperCase();
                    flagImg.style.display = 'inline-block'; // Mostrar a bandeira
                }
                
                // Atualizar seleção visual
                userOptions.querySelectorAll('li').forEach(li => {
                    li.classList.remove('selected');
                });
                option.classList.add('selected');
            }
        }
    }

    toggleLanguageSelector(selector) {
        const isActive = selector.classList.contains('active');
        this.closeLanguageSelectors();
        
        if (!isActive) {
            selector.classList.add('active');
        }
    }

    closeLanguageSelectors() {
        document.querySelectorAll('.language-selector').forEach(selector => {
            selector.classList.remove('active');
        });
    }

    closeLanguageSelectorsOnClickOutside(event) {
        if (!event.target.closest('.language-selector')) {
            this.closeLanguageSelectors();
        }
    }

    setupUserMenu() {
        const userMenu = document.querySelector('.user-menu');
        const userDropdownMenu = document.querySelector('.user-dropdown-menu');
        
        if (userMenu && userDropdownMenu) {
            userMenu.addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeLanguageSelectors();
                
                const isVisible = userDropdownMenu.style.visibility === 'visible';
                if (isVisible) {
                    this.closeUserMenu();
                } else {
                    this.openUserMenu();
                }
            });
            
            userDropdownMenu.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }
    }

    openUserMenu() {
        const userDropdownMenu = document.querySelector('.user-dropdown-menu');
        if (userDropdownMenu) {
            userDropdownMenu.style.opacity = '1';
            userDropdownMenu.style.visibility = 'visible';
            userDropdownMenu.style.transform = 'translateY(0)';
        }
    }

    closeUserMenu() {
        const userDropdownMenu = document.querySelector('.user-dropdown-menu');
        if (userDropdownMenu) {
            userDropdownMenu.style.opacity = '0';
            userDropdownMenu.style.visibility = 'hidden';
            userDropdownMenu.style.transform = 'translateY(10px)';
        }
    }

    closeUserMenuOnClickOutside(event) {
        const userDropdownMenu = document.querySelector('.user-dropdown-menu');
        if (!event.target.closest('.user-menu') && 
            userDropdownMenu && 
            userDropdownMenu.style.visibility === 'visible') {
            this.closeUserMenu();
        }
    }

    setupMobileMenu() {
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        const navLinks = document.getElementById('nav-links');
        
        if (mobileMenuToggle && navLinks) {
            // Remover listeners antigos
            const newToggle = mobileMenuToggle.cloneNode(true);
            mobileMenuToggle.parentNode.replaceChild(newToggle, mobileMenuToggle);
            
            newToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                newToggle.classList.toggle('active');
                navLinks.classList.toggle('active');
                document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
                
                this.closeLanguageSelectors();
                this.closeUserMenu();
            });
            
            // Fechar menu ao clicar nos links
            document.querySelectorAll('.nav-links a, .dropdown-item').forEach(link => {
                link.addEventListener('click', () => {
                    newToggle.classList.remove('active');
                    navLinks.classList.remove('active');
                    document.body.style.overflow = '';
                });
            });
            
            // Fechar menu ao clicar fora
            document.addEventListener('click', (event) => {
                if (!event.target.closest('.nav-links') && 
                    !event.target.closest('.mobile-menu-toggle') && 
                    navLinks.classList.contains('active')) {
                    newToggle.classList.remove('active');
                    navLinks.classList.remove('active');
                    document.body.style.overflow = '';
                }
            });
        }
    }

    closeDropdownsOnClickOutside(event) {
        // Fechar dropdowns apenas em mobile ou se estiverem ativos
        if (this.isMobile || !event.target.closest('.dropdown')) {
            const clickedInsideDropdown = event.target.closest('.dropdown');
            
            if (!clickedInsideDropdown) {
                document.querySelectorAll('.dropdown').forEach(dropdown => {
                    dropdown.classList.remove('active');
                });
            }
        }
    }

    highlightCurrentPage() {
        let pageName;
        
        if (window.currentPage) {
            pageName = window.currentPage;
        } else {
            const currentPath = window.location.pathname;
            pageName = currentPath.split('/').pop() || 'index.html';
        }
        
        // Remover a classe 'active' de todos os links
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.classList.remove('active');
        });
        
        // Adicionar a classe 'active' ao link da página atual
        document.querySelectorAll('.nav-links a').forEach(link => {
            const href = link.getAttribute('href');
            
            if (href === pageName || 
                (pageName === 'index.html' && href === 'index.html') ||
                (pageName === '' && href === 'index.html')) {
                link.classList.add('active');
            }
        });
    }

    initTooltips() {
        const tooltipElements = document.querySelectorAll('.icon-tooltip');
        
        tooltipElements.forEach(tooltip => {
            tooltip.addEventListener('mouseenter', () => {
                const tooltipText = tooltip.querySelector('.tooltip-text');
                if (tooltipText) {
                    tooltipText.style.visibility = 'visible';
                    tooltipText.style.opacity = '1';
                }
            });
            
            tooltip.addEventListener('mouseleave', () => {
                const tooltipText = tooltip.querySelector('.tooltip-text');
                if (tooltipText) {
                    tooltipText.style.visibility = 'hidden';
                    tooltipText.style.opacity = '0';
                }
            });
        });
    }
}

// Funções globais para compatibilidade
function viewProfile() {
    console.log('Abrindo perfil do usuário');
    alert('Abrindo perfil do usuário');
    closeUserMenu();
}

function openSettings() {
    console.log('Abrindo configurações');
    alert('Abrindo configurações');
    closeUserMenu();
}

function logout() {
    console.log('Efetuando logout');
    alert('Logout realizado com sucesso!');
    closeUserMenu();
}

function closeUserMenu() {
    const userDropdownMenu = document.querySelector('.user-dropdown-menu');
    if (userDropdownMenu) {
        userDropdownMenu.style.opacity = '0';
        userDropdownMenu.style.visibility = 'hidden';
        userDropdownMenu.style.transform = 'translateY(10px)';
    }
}

function notifyNativeLanguageChange(langCode) {
    // Evitar disparar eventos se já estamos processando uma mudança
    if (window.nativeLanguageManager && window.nativeLanguageManager.isChangingLanguage) {
        console.log('Evitando evento duplicado durante mudança de idioma');
        return;
    }
    
    console.log(`Notificando mudança de idioma nativo para: ${langCode}`);
    
    document.dispatchEvent(new CustomEvent('nativeLanguageChanged', {
        detail: { language: langCode }
    }));
    
    document.dispatchEvent(new CustomEvent('translationLanguageChanged', {
        detail: { language: langCode }
    }));
}

// Load footer from external file
function loadFooter() {
    const footerContainer = document.getElementById('footer-container');
    if (footerContainer) {
        fetch('footer.html')
            .then(response => response.text())
            .then(data => {
                if (footerContainer) {
                    footerContainer.innerHTML = data;
                }
            })
            .catch(error => {
                console.error('Error loading footer:', error);
            });
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    window.navbarManager = new NavbarManager();
    loadFooter();
});

// Exportar para uso global
window.NavbarManager = NavbarManager;