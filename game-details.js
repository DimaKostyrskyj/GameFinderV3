class GameDetailsPage {
    constructor() {
        this.priceAPI = window.priceAPI;
        this.currentGame = null;
        this.init();
    }

    init() {
        this.loadGameData();
        this.initCurrencyDropdown();
        this.createParticles();
    }

    loadGameData() {
        const gameData = sessionStorage.getItem('currentGame');
        
        if (!gameData) {
            window.location.href = 'index.html';
            return;
        }

        this.currentGame = JSON.parse(gameData);
        this.displayGameDetails();
        this.loadGameImage();
        this.loadAllPrices();
    }

    displayGameDetails() {
        // Основная информация
        document.getElementById('detailGameTitle').textContent = this.currentGame.name;
        document.getElementById('detailMatchScore').textContent = Math.round(this.currentGame.moodMatch * 100) + '%';
        document.getElementById('detailGenre').textContent = this.currentGame.genre;
        document.getElementById('detailPlatforms').textContent = this.currentGame.platforms?.join(', ') || 'PC';
        document.getElementById('detailPlaytime').textContent = this.currentGame.playtime;
        document.getElementById('detailVibe').textContent = this.currentGame.vibe;
        document.getElementById('detailDescription').textContent = this.currentGame.description;
        document.getElementById('detailReason').textContent = this.currentGame.whyPerfect;

        // Генерируем системные требования на основе жанра
        this.generateRequirements();
    }

    async loadGameImage() {
        const imageElement = document.getElementById('detailGameImage');
        const placeholder = document.getElementById('imagePlaceholder');
        
        try {
            // Пытаемся найти изображение через Unsplash API по названию игры
            const searchQuery = encodeURIComponent(this.currentGame.name + ' game');
            const response = await fetch(`https://api.unsplash.com/search/photos?query=${searchQuery}&client_id=YOUR_UNSPLASH_ACCESS_KEY&per_page=1`);
            
            if (response.ok) {
                const data = await response.json();
                if (data.results.length > 0) {
                    imageElement.src = data.results[0].urls.regular;
                    imageElement.style.display = 'block';
                    placeholder.style.display = 'none';
                    return;
                }
            }
        } catch (error) {
            console.log('Не удалось загрузить изображение с Unsplash');
        }

        // Если изображение не найдено, используем заглушку
        placeholder.innerHTML = `
            <span class="placeholder-icon">🎮</span>
            <span>${this.currentGame.name}</span>
        `;
    }

    generateRequirements() {
        // Генерация системных требований на основе жанра игры
        const genre = this.currentGame.genre.toLowerCase();
        
        let minReq, recReq;
        
        if (genre.includes('инди') || genre.includes('казуал')) {
            minReq = { os: 'Windows 7', cpu: 'Intel Core i3', ram: '4 GB', gpu: 'Intel HD Graphics', storage: '2 GB' };
            recReq = { os: 'Windows 10', cpu: 'Intel Core i5', ram: '8 GB', gpu: 'GTX 750', storage: '4 GB' };
        } else if (genre.includes('страте') || genre.includes('симулятор')) {
            minReq = { os: 'Windows 8', cpu: 'Intel Core i5', ram: '8 GB', gpu: 'GTX 950', storage: '10 GB' };
            recReq = { os: 'Windows 10', cpu: 'Intel Core i7', ram: '16 GB', gpu: 'GTX 1060', storage: '20 GB' };
        } else if (genre.includes('экшен') || genre.includes('шутер') || genre.includes('ролевая')) {
            minReq = { os: 'Windows 10', cpu: 'Intel Core i5', ram: '8 GB', gpu: 'GTX 960', storage: '50 GB' };
            recReq = { os: 'Windows 11', cpu: 'Intel Core i7', ram: '16 GB', gpu: 'RTX 2060', storage: '50 GB' };
        } else {
            // Требования по умолчанию
            minReq = { os: 'Windows 10', cpu: 'Intel Core i5', ram: '8 GB', gpu: 'GTX 960', storage: '20 GB' };
            recReq = { os: 'Windows 11', cpu: 'Intel Core i7', ram: '16 GB', gpu: 'RTX 2060', storage: '20 GB' };
        }

        // Заполняем минимальные требования
        document.getElementById('minOS').textContent = minReq.os;
        document.getElementById('minCPU').textContent = minReq.cpu;
        document.getElementById('minRAM').textContent = minReq.ram;
        document.getElementById('minGPU').textContent = minReq.gpu;
        document.getElementById('minStorage').textContent = minReq.storage;

        // Заполняем рекомендуемые требования
        document.getElementById('recOS').textContent = recReq.os;
        document.getElementById('recCPU').textContent = recReq.cpu;
        document.getElementById('recRAM').textContent = recReq.ram;
        document.getElementById('recGPU').textContent = recReq.gpu;
        document.getElementById('recStorage').textContent = recReq.storage;
    }

    async loadAllPrices() {
        const storesGrid = document.getElementById('detailedStores');
        storesGrid.innerHTML = '<div class="loading-prices">🔄 Загружаем цены...</div>';

        const stores = ['steam', 'epic', 'xbox', 'ea', 'ubisoft'];
        const prices = [];

        // Загружаем цены для всех магазинов
        for (const store of stores) {
            try {
                const price = await this.fetchStorePrice(store);
                prices.push({ store, price });
            } catch (error) {
                console.error(`Error loading ${store} price:`, error);
                prices.push({ store, price: null });
            }
        }

        // Отображаем цены
        this.displayAllPrices(prices);
    }

    async fetchStorePrice(store) {
        switch(store) {
            case 'steam':
                return await this.priceAPI.getSteamPrice(this.currentGame.name);
            case 'epic':
                return await this.priceAPI.getEpicPrice(this.currentGame.name);
            case 'xbox':
                return await this.priceAPI.getXboxPrice(this.currentGame.name);
            case 'ea':
                return await this.priceAPI.getEAPrice(this.currentGame.name);
            case 'ubisoft':
                return await this.priceAPI.getUbisoftPrice(this.currentGame.name);
            default:
                return null;
        }
    }

    displayAllPrices(prices) {
        const storesGrid = document.getElementById('detailedStores');
        
        storesGrid.innerHTML = prices.map(({ store, price }) => {
            if (!price) {
                return `
                    <div class="store-price-card unavailable">
                        <div class="store-header">
                            <div class="store-icon">🛒</div>
                            <h4 class="store-name">${this.getStoreName(store)}</h4>
                        </div>
                        <div class="price-info">
                            <p class="price-unavailable">Цена не доступна</p>
                        </div>
                        <button class="visit-store-btn" onclick="window.openStore('${store}', '${this.currentGame.name}')">
                            Перейти в магазин
                        </button>
                    </div>
                `;
            }

            return `
                <div class="store-price-card ${price.isRealPrice ? 'real' : 'calculated'}">
                    <div class="store-header">
                        <div class="store-icon">${this.getStoreIcon(store)}</div>
                        <h4 class="store-name">${this.getStoreName(store)}</h4>
                        ${price.isRealPrice ? '<span class="price-badge real">✅ Реальная</span>' : '<span class="price-badge calculated">📊 Расчетная</span>'}
                    </div>
                    
                    <div class="price-main-detailed">
                        <span class="price-amount-detailed">${this.priceAPI.formatPrice(price.price, price.currency)}</span>
                        ${price.discount > 0 ? `
                            <span class="discount-badge-detailed">-${price.discount}%</span>
                        ` : ''}
                    </div>
                    
                    ${price.originalPrice ? `
                        <div class="original-price-detailed">
                            Было: <span class="price-strikethrough">${this.priceAPI.formatPrice(price.originalPrice, price.currency)}</span>
                        </div>
                    ` : ''}
                    
                    ${price.discount > 0 ? `
                        <div class="saving-amount">
                            Экономия: ${this.priceAPI.formatPrice(price.originalPrice - price.price, price.currency)}
                        </div>
                    ` : ''}
                    
                    <button class="buy-now-btn" onclick="window.openStore('${store}', '${this.currentGame.name}')">
                        Купить сейчас
                    </button>
                </div>
            `;
        }).join('');
    }

    getStoreName(store) {
        const names = {
            'steam': 'Steam',
            'epic': 'Epic Games',
            'xbox': 'XBOX Store',
            'ea': 'EA App',
            'ubisoft': 'Ubisoft Store'
        };
        return names[store] || store;
    }

    getStoreIcon(store) {
        const icons = {
            'steam': '🚀',
            'epic': '🎮',
            'xbox': '📦',
            'ea': '🔥',
            'ubisoft': '🦁'
        };
        return icons[store] || '🛒';
    }

    initCurrencyDropdown() {
        const currencyToggle = document.getElementById('currencyToggle');
        const currencyMenu = document.querySelector('.currency-dropdown-menu');
        const currencyOptions = document.querySelectorAll('.currency-option');
        const currentCurrencySymbol = document.getElementById('currentCurrencySymbol');
        
        if (currencyToggle && currencyMenu) {
            currencyToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                currencyMenu.classList.toggle('show');
                currencyToggle.classList.toggle('active');
            });
            
            currencyOptions.forEach(option => {
                option.addEventListener('click', (e) => {
                    const currency = option.getAttribute('data-currency');
                    const symbol = option.querySelector('.currency-symbol').textContent;
                    
                    this.priceAPI.setCurrency(currency);
                    currentCurrencySymbol.textContent = symbol;
                    
                    currencyOptions.forEach(opt => opt.classList.remove('active'));
                    option.classList.add('active');
                    
                    currencyMenu.classList.remove('show');
                    currencyToggle.classList.remove('active');
                    
                    // Перезагружаем цены
                    this.loadAllPrices();
                });
            });
            
            document.addEventListener('click', (e) => {
                if (!currencyToggle.contains(e.target) && !currencyMenu.contains(e.target)) {
                    currencyMenu.classList.remove('show');
                    currencyToggle.classList.remove('active');
                }
            });
            
            this.initCurrentCurrency();
        }
    }

    initCurrentCurrency() {
        const savedCurrency = this.priceAPI.getSavedCurrency() || 'USD';
        const currencyOptions = document.querySelectorAll('.currency-option');
        const currentCurrencySymbol = document.getElementById('currentCurrencySymbol');
        
        currencyOptions.forEach(option => {
            if (option.getAttribute('data-currency') === savedCurrency) {
                option.classList.add('active');
                const symbol = option.querySelector('.currency-symbol').textContent;
                currentCurrencySymbol.textContent = symbol;
            }
        });
    }

    createParticles() {
        const container = document.getElementById('particles');
        if (!container) return;

        for (let i = 0; i < 20; i++) {
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

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    window.gameDetailsPage = new GameDetailsPage();
});