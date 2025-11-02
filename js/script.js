// Конфигурация
const CONFIG = {
    DEEPSEEK_API_KEY: 'sk-7f36fac6978e4df0b3ee1e97534d5fc4'
};

// Основной класс приложения
class GameFinderApp {
    constructor() {
        console.log('🎮 Initializing GameFinderApp...');
        this.initApp();
    }

    initApp() {
        try {
            this.initDOMElements();
            this.initEventListeners();
            this.createParticles();
            this.setupNavigation();
            this.setupDownloadTracking();
            console.log('✅ GameFinderApp initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing GameFinderApp:', error);
        }
    }

    initDOMElements() {
        this.searchInput = document.getElementById('searchInput');
        this.searchBtn = document.getElementById('searchBtn');
        this.resultsSection = document.getElementById('results');
        this.gamesContainer = document.getElementById('gamesContainer');
        this.analysisContent = document.getElementById('aiAnalysis');
        this.exampleChips = document.querySelectorAll('.example-chip');

        console.log('📝 DOM elements loaded:', {
            searchInput: !!this.searchInput,
            searchBtn: !!this.searchBtn,
            resultsSection: !!this.resultsSection,
            gamesContainer: !!this.gamesContainer,
            exampleChips: this.exampleChips.length
        });
    }

    initEventListeners() {
        // Кнопка поиска
        if (this.searchBtn) {
            this.searchBtn.addEventListener('click', () => this.handleSearch());
        }

        // Enter в поиске
        if (this.searchInput) {
            this.searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.handleSearch();
                }
            });

            this.searchInput.addEventListener('input', this.autoResizeTextarea);
        }

        // Быстрые примеры
        if (this.exampleChips.length > 0) {
            this.exampleChips.forEach(chip => {
                chip.addEventListener('click', () => {
                    const exampleText = chip.getAttribute('data-example');
                    if (this.searchInput) {
                        this.searchInput.value = exampleText;
                        this.autoResizeTextarea.call(this.searchInput);
                    }
                    this.handleSearch();
                });
            });
        }

        console.log('🎯 Event listeners attached');
    }

    autoResizeTextarea() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 200) + 'px';
    }

    async handleSearch() {
        const query = this.searchInput ? this.searchInput.value.trim() : '';
        
        if (!query) {
            this.showError('📝 Пожалуйста, опишите что вы ищете');
            return;
        }

        console.log('🔍 Search query:', query);
        this.setLoading(true);
        this.hideError();

        try {
            const gameAI = new GameSearchAI(CONFIG.DEEPSEEK_API_KEY);
            const results = await gameAI.searchGames(query);
            this.displayResults(results);
        } catch (error) {
            console.error('❌ Search error:', error);
            this.showError(`❌ ${error.message}`);
        } finally {
            this.setLoading(false);
        }
    }

    setLoading(isLoading) {
        if (!this.searchBtn) return;

        const btnText = this.searchBtn.querySelector('.btn-text');
        const loadingSpinner = this.searchBtn.querySelector('.loading-spinner');
        
        if (isLoading) {
            btnText.classList.add('hidden');
            loadingSpinner.classList.remove('hidden');
            this.searchBtn.disabled = true;
            this.searchBtn.style.opacity = '0.7';
        } else {
            btnText.classList.remove('hidden');
            loadingSpinner.classList.add('hidden');
            this.searchBtn.disabled = false;
            this.searchBtn.style.opacity = '1';
        }
    }

    displayResults(results) {
        if (!this.resultsSection || !this.gamesContainer || !this.analysisContent) return;

        this.resultsSection.classList.remove('hidden');
        this.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        this.displayAIAnalysis(results.analysis);
        this.displayGames(results.games);
        this.showStats(results.games.length);
    }

    displayAIAnalysis(analysis) {
        if (!this.analysisContent) return;

        this.analysisContent.innerHTML = `
            <div class="analysis-header">
                <h3>🎯 AI анализ вашего запроса</h3>
            </div>
            <div class="analysis-content">
                <div class="analysis-item">
                    <strong>📊 Понятое настроение:</strong> ${analysis.understoodMood}
                </div>
                <div class="analysis-item">
                    <strong>🎨 Рекомендуемый стиль:</strong> ${analysis.recommendedStyle}
                </div>
                <div class="key-factors">
                    <strong>🔑 Ключевые факторы:</strong>
                    <div class="mood-tags">
                        ${analysis.keyFactors.map(factor => `<span class="mood-tag">${factor}</span>`).join('')}
                    </div>
                </div>
                <div class="reasoning">
                    <strong>💡 Объяснение подбора:</strong> ${analysis.reasoning}
                </div>
            </div>
        `;
    }

    displayGames(games) {
    if (!this.gamesContainer) return;

    this.gamesContainer.innerHTML = games.map((game, index) => `
        <div class="game-card fade-in-up" style="animation-delay: ${index * 0.1}s">
            <div class="game-header">
                <div class="game-title-section">
                    <h4 class="game-title">${game.name}</h4>
                    <div class="game-meta">
                        <span class="game-genre">${game.genre}</span>
                        ${game.platforms ? `<span class="game-platforms">${game.platforms.slice(0, 3).join(', ')}</span>` : ''}
                    </div>
                </div>
                <div class="match-score">
                    <div class="score-circle">${Math.round(game.moodMatch * 100)}%</div>
                    <div class="score-label">совпадение</div>
                </div>
            </div>
            <p class="game-description">${game.description}</p>
            <div class="game-details">
                <div class="detail-item">
                    <span class="detail-icon">🕐</span>
                    <span>${game.playtime}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-icon">🎭</span>
                    <span>${game.vibe}</span>
                </div>
            </div>
            <div class="game-reason">
                <div class="reason-title">🎯 Почему идеально подходит:</div>
                <p class="reason-text">${game.whyPerfect}</p>
            </div>
            
            <!-- БЛОК МАГАЗИНОВ И ЦЕН -->
            <div class="stores-container">
                <h4>🛒 Где купить:</h4>
                <div class="store-buttons">
                    <button class="store-btn" data-store="steam" data-game="${game.name}">Steam</button>
                    <button class="store-btn" data-store="epic" data-game="${game.name}">Epic Games</button>
                    <button class="store-btn" data-store="xbox" data-game="${game.name}">XBOX</button>
                    <button class="store-btn" data-store="ea" data-game="${game.name}">EA App</button>
                    <button class="store-btn" data-store="ubisoft" data-game="${game.name}">Ubisoft</button>
                </div>
                <div class="price-info" id="price-${game.name.replace(/\s+/g, '-').toLowerCase()}">
                    <p class="price-loading">Выберите магазин для просмотра цены</p>
                </div>
            </div>
        </div>
    `).join('');

    // Добавляем обработчики для кнопок магазинов
    this.initStoreButtons();
}

// Новая функция для инициализации кнопок магазинов
initStoreButtons() {
    const storeButtons = document.querySelectorAll('.store-btn');
    
    storeButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const store = e.target.getAttribute('data-store');
            const gameName = e.target.getAttribute('data-game');
            this.handleStoreClick(store, gameName, e.target);
        });
    });
}

// Обработчик клика по магазину
async handleStoreClick(store, gameName, button) {
    // Убираем активный класс у всех кнопок в этой карточке
    const allButtons = button.parentElement.querySelectorAll('.store-btn');
    allButtons.forEach(btn => btn.classList.remove('active'));
    
    // Добавляем активный класс к нажатой кнопке
    button.classList.add('active');
    
    // Показываем загрузку
    const priceInfo = document.getElementById(`price-${gameName.replace(/\s+/g, '-').toLowerCase()}`);
    priceInfo.innerHTML = '<p class="price-loading">Загрузка цены...</p>';
    
    try {
        const price = await this.fetchGamePrice(gameName, store);
        this.displayPrice(price, store, gameName, priceInfo);
    } catch (error) {
        console.error('Error fetching price:', error);
        priceInfo.innerHTML = '<p class="price-error">Цена не найдена</p>';
    }
}

// Функция для получения цены (заглушка)
async fetchGamePrice(gameName, store) {
    // Имитация загрузки
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Заглушки цен для демонстрации
    const priceMap = {
        'steam': { price: '1999 руб', discount: '-20%' },
        'epic': { price: '1899 руб', discount: null },
        'xbox': { price: '2099 руб', discount: '-10%' },
        'ea': { price: '1799 руб', discount: null },
        'ubisoft': { price: '1950 руб', discount: '-15%' }
    };
    
    return priceMap[store] || { price: 'Нет в продаже', discount: null };
}

// Функция для отображения цены
displayPrice(priceData, store, gameName, priceElement) {
    const storeNames = {
        'steam': 'Steam',
        'epic': 'Epic Games', 
        'xbox': 'Microsoft Store',
        'ea': 'EA App',
        'ubisoft': 'Ubisoft Store'
    };
    
    if (priceData.price === 'Нет в продаже') {
        priceElement.innerHTML = `
            <div class="price-error">
                <p>Игра не найдена в ${storeNames[store]}</p>
            </div>
        `;
    } else {
        priceElement.innerHTML = `
            <div class="price-success">
                <div class="price-amount">${priceData.price}</div>
                ${priceData.discount ? `<div class="price-discount" style="color: #ffd43b; font-size: 0.9rem;">${priceData.discount}</div>` : ''}
                <div class="price-store">в ${storeNames[store]}</div>
                <button class="buy-btn" onclick="window.open('${this.getStoreUrl(store, gameName)}', '_blank')">
                    Купить сейчас
                </button>
            </div>
        `;
    }
}

// Функция для получения URL магазина
getStoreUrl(store, gameName) {
    const encodedName = encodeURIComponent(gameName);
    const storeUrls = {
        'steam': `https://store.steampowered.com/search/?term=${encodedName}`,
        'epic': `https://store.epicgames.com/ru/browse?q=${encodedName}`,
        'xbox': `https://www.xbox.com/ru-ru/search?q=${encodedName}`,
        'ea': `https://www.ea.com/ru-ru/search?q=${encodedName}`,
        'ubisoft': `https://store.ubi.com/ru/search/?q=${encodedName}`
    };
    
    return storeUrls[store] || '#';
}

    showStats(gameCount) {
        const gamesGrid = document.querySelector('.games-grid');
        if (!gamesGrid) return;

        const statsElement = document.createElement('div');
        statsElement.className = 'stats-info';
        statsElement.innerHTML = `
            <div class="stats-card">
                <span class="stats-icon">📊</span>
                <span>Найдено <strong>${gameCount}</strong> игр</span>
            </div>
        `;
        
        const existingStats = gamesGrid.querySelector('.stats-info');
        if (existingStats) existingStats.remove();
        gamesGrid.insertBefore(statsElement, gamesGrid.querySelector('.games-container'));
    }

    setupNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn[href^="#"]');
        
        navButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = button.getAttribute('href').substring(1);
                const targetSection = document.getElementById(targetId);
                
                if (targetSection) {
                    targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    history.pushState(null, null, `#${targetId}`);
                }
            });
        });

        // Discord tracking
        const discordBtn = document.querySelector('.discord-btn');
        if (discordBtn) {
            discordBtn.addEventListener('click', () => {
                console.log('🎮 Discord button clicked');
            });
        }

        console.log('🎯 Navigation setup complete');
    }

    setupDownloadTracking() {
        const downloadButtons = document.querySelectorAll('[download], .download-btn');
        
        downloadButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                console.log('📥 Download button clicked');
                this.showDownloadNotification();
            });
        });
    }

    showDownloadNotification() {
        const notification = document.createElement('div');
        notification.className = 'download-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">⬇️</span>
                <span>Начинаем скачивание лаунчера...</span>
            </div>
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    showError(message) {
        this.hideError();
        if (!this.searchInput) return;

        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
                <span>⚠️</span>
                <span>${message}</span>
            </div>
        `;
        this.searchInput.parentNode.insertBefore(errorDiv, this.searchInput.nextSibling);
        setTimeout(() => errorDiv.remove(), 5000);
    }

    hideError() {
        const existingError = document.querySelector('.error-message');
        if (existingError) existingError.remove();
    }

    createParticles() {
        const container = document.getElementById('particles');
        if (!container) return;

        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.cssText = `
                position: absolute;
                width: ${Math.random() * 4 + 2}px;
                height: ${Math.random() * 4 + 2}px;
                background: rgba(255, 255, 255, ${Math.random() * 0.2});
                border-radius: 50%;
                top: ${Math.random() * 100}vh;
                left: ${Math.random() * 100}vw;
                animation: floatParticle ${Math.random() * 15 + 10}s linear infinite;
                animation-delay: ${Math.random() * 5}s;
            `;
            container.appendChild(particle);
        }
    }
}

// Простая версия инициализации
function initializeApp() {
    console.log('🚀 Starting app initialization...');
    
    if (typeof GameFinderApp !== 'undefined') {
        window.gameFinderApp = new GameFinderApp();
        console.log('✅ GameFinderApp initialized successfully');
        return true;
    } else {
        console.log('🔄 GameFinderApp not found, waiting for dependencies...');
        return false;
    }
}

// Запуск при полной загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM fully loaded');
    
    // Пытаемся инициализировать сразу
    if (!initializeApp()) {
        // Если не получилось, пробуем еще раз через короткое время
        setTimeout(() => {
            if (!initializeApp()) {
                console.error('❌ Failed to initialize GameFinderApp after retry');
            }
        }, 500);
    }
});

// Глобальные стили для анимаций
const globalStyles = `
    @keyframes floatParticle {
        0%, 100% { transform: translate(0, 0) rotate(0deg); opacity: 0.3; }
        25% { transform: translate(10vw, -10vh) rotate(90deg); opacity: 0.6; }
        50% { transform: translate(20vw, 5vh) rotate(180deg); opacity: 0.3; }
        75% { transform: translate(-10vw, 15vh) rotate(270deg); opacity: 0.6; }
    }
    
    .error-message {
        background: rgba(239, 68, 68, 0.9) !important;
        color: white !important;
        padding: 15px 20px !important;
        border-radius: 10px !important;
        margin: 15px 0 !important;
        text-align: center !important;
        animation: fadeInUp 0.3s ease !important;
        border: 1px solid rgba(255, 255, 255, 0.3) !important;
    }
    
    @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    .download-notification {
        position: fixed;
        top: 100px;
        right: 30px;
        background: rgba(16, 185, 129, 0.9);
        color: white;
        padding: 15px 20px;
        border-radius: 15px;
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        animation: slideInRight 0.5s ease, slideOutRight 0.5s ease 2.5s forwards;
    }
    
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;

// Добавляем глобальные стили
const styleSheet = document.createElement('style');
styleSheet.textContent = globalStyles;
document.head.appendChild(styleSheet);
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM fully loaded');
    
    // Пытаемся инициализировать сразу
    if (!initializeApp()) {
        setTimeout(() => {
            if (!initializeApp()) {
                console.error('❌ Failed to initialize GameFinderApp after retry');
            }
        }, 500);
    }
});

// Глобальная функция для открытия магазинов
window.openStore = function(store, gameName) {
    const urls = {
        'steam': `https://store.steampowered.com/search/?term=${encodeURIComponent(gameName)}`,
        'epic': `https://store.epicgames.com/ru/browse?q=${encodeURIComponent(gameName)}`,
        'xbox': `https://www.xbox.com/ru-ru/search?q=${encodeURIComponent(gameName)}`,
        'ea': `https://www.ea.com/ru-ru/search?q=${encodeURIComponent(gameName)}`,
        'ubisoft': `https://store.ubi.com/ru/search/?q=${encodeURIComponent(gameName)}`
    };
    
    window.open(urls[store], '_blank');
};