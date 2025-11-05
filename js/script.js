// Конфигурация
const CONFIG = {
    DEEPSEEK_API_KEY: 'sk-7f36fac6978e4df0b3ee1e97534d5fc4'
};

// Основной класс приложения
class GameFinderApp {
    constructor() {
        console.log('🎮 Initializing GameFinderApp...');
        this.gameSearchAI = new GameSearchAI();
        this.priceAPI = window.priceAPI;
        this.initApp();
    }
    
    initApp() {
        try {
            this.initDOMElements();
            this.initEventListeners();
            this.initCurrencyDropdown();
            this.createParticles();
            this.setupNavigation();
            this.setupDownloadTracking();
            console.log('✅ GameFinderApp initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing GameFinderApp:', error);
        }
    }

    async handleSearch() {
        try {
            const query = this.searchInput.value.trim();
            if (!query) {
                this.showError('Пожалуйста, введите описание того, что вы ищете');
                return;
            }

            this.setLoading(true);
            this.hideError();

            console.log('🔍 Starting search with query:', query);
            
            const results = await this.gameSearchAI.searchGames(query);
            console.log('✅ Search results:', results);
            
            this.displayResults(results);
            
        } catch (error) {
            console.error('❌ Search error:', error);
            this.showError(error.message);
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
        
        // Убираем кнопку "Еще" так как DeepSeek всегда возвращает игры
        this.hideLoadMoreButton();
    }

    displayGames(games) {
        if (!this.gamesContainer) return;

        this.gamesContainer.innerHTML = games.map((game, index) => `
            <div class="game-card fade-in-up" style="animation-delay: ${index * 0.1}s" 
                 data-game='${JSON.stringify(game).replace(/'/g, "&#39;")}'>
                
                <div class="game-header">
                    <div class="game-title-section">
                        <h4 class="game-title clickable-title">${game.name}</h4>
                        <div class="game-meta">
                            <span class="game-genre">${game.genre}</span>
                            <span class="game-platforms">${game.platforms?.join(', ') || 'PC'}</span>
                        </div>
                    </div>
                    <div class="match-score">
                        <div class="score-circle">${Math.round(game.moodMatch * 100)}%</div>
                        <div class="score-label">Совпадение</div>
                    </div>
                </div>

                <div class="game-details">
                    <div class="detail-item">
                        <span class="detail-icon">⏱️</span>
                        <span>${game.playtime}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-icon">🎨</span>
                        <span>${game.vibe}</span>
                    </div>
                </div>

                <div class="game-description">
                    ${game.description}
                </div>

                <div class="game-reason">
                    <div class="reason-title">🎯 Почему подходит:</div>
                    ${game.whyPerfect}
                </div>

                <div class="stores-container">
                    <h4>💸 Узнать цену и купить</h4>
                    <div class="discord-price-mini">
                        <div class="discord-mini-content">
                            <span class="discord-mini-icon">🎮</span>
                            <span class="discord-mini-text">Актуальные цены в Discord</span>
                        </div>
                        <a href="https://discord.gg/MeHJ9epedA" class="discord-mini-btn" target="_blank">
                            Узнать цену
                        </a>
                    </div>
                    <div class="price-note">
                        💡 Получите самые свежие цены со всех магазинов
                    </div>
                </div>
            </div>
        `).join('');

        // Добавляем обработчики для клика по играм
        this.initGameClickHandlers();
    }

    // Остальные методы остаются без изменений...
    initGameClickHandlers() {
        const gameTitles = document.querySelectorAll('.clickable-title');
        const gameCards = document.querySelectorAll('.game-card');
        
        gameTitles.forEach((title, index) => {
            title.addEventListener('click', (e) => {
                e.stopPropagation();
                const gameCard = title.closest('.game-card');
                const gameData = gameCard.getAttribute('data-game');
                this.openGameDetails(JSON.parse(gameData));
            });
        });
        
        gameCards.forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.discord-mini-btn')) {
                    const gameData = card.getAttribute('data-game');
                    this.openGameDetails(JSON.parse(gameData));
                }
            });
        });
    }

    openGameDetails(game) {
        sessionStorage.setItem('currentGame', JSON.stringify(game));
        window.location.href = 'game-details.html';
    }

    showError(message) {
        this.hideError();
        if (!this.searchInput) return;

        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; gap: 10px; padding: 10px; background: rgba(255,0,0,0.1); border-radius: 8px; margin: 10px 0;">
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