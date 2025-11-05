class GameDetailsPage {
    constructor() {
        this.priceAPI = window.priceAPI;
        this.currentGame = null;
        this.steamAppId = null;
        this.init();
    }

    init() {
        this.loadGameData();
        this.initCurrencyDropdown();
        this.createParticles();
    }

    async loadGameData() {
        const gameData = sessionStorage.getItem('currentGame');
        
        if (!gameData) {
            window.location.href = 'index.html';
            return;
        }

        this.currentGame = JSON.parse(gameData);
        await this.findSteamAppId();
        await this.loadSteamGameData();
        this.displayGameDetails();
        this.loadAllPrices();
    }

    async findSteamAppId() {
        try {
            // Используем Steam API для поиска игры
            const response = await fetch(`https://api.steampowered.com/ISteamApps/GetAppList/v2/`);
            if (!response.ok) throw new Error('Steam API недоступен');
            
            const data = await response.json();
            const apps = data.applist.apps;
            
            // Ищем игру по названию (точное или частичное совпадение)
            const foundApp = apps.find(app => 
                app.name.toLowerCase().includes(this.currentGame.name.toLowerCase()) ||
                this.currentGame.name.toLowerCase().includes(app.name.toLowerCase())
            );
            
            this.steamAppId = foundApp ? foundApp.appid : null;
            console.log('Steam App ID:', this.steamAppId);
            
        } catch (error) {
            console.error('Ошибка поиска Steam App ID:', error);
            this.steamAppId = null;
        }
    }

    async loadSteamGameData() {
        if (!this.steamAppId) {
            this.generateFallbackData();
            return;
        }

        try {
            const response = await fetch(`https://store.steampowered.com/api/appdetails?appids=${this.steamAppId}&l=russian`);
            if (!response.ok) throw new Error('Steam Store API недоступен');
            
            const data = await response.json();
            const gameData = data[this.steamAppId];
            
            if (gameData && gameData.success) {
                this.enrichWithSteamData(gameData.data);
            } else {
                this.generateFallbackData();
            }
            
        } catch (error) {
            console.error('Ошибка загрузки данных Steam:', error);
            this.generateFallbackData();
        }
    }

    enrichWithSteamData(steamData) {
        // Обогащаем данные из Steam API
        if (steamData.name) {
            this.currentGame.name = steamData.name;
        }
        
        if (steamData.genres) {
            this.currentGame.genre = steamData.genres.map(genre => genre.description).join(', ');
        }
        
        if (steamData.platforms) {
            const platforms = [];
            if (steamData.platforms.windows) platforms.push('PC');
            if (steamData.platforms.mac) platforms.push('Mac');
            if (steamData.platforms.linux) platforms.push('Linux');
            this.currentGame.platforms = platforms;
        }
        
        if (steamData.short_description) {
            this.currentGame.description = steamData.short_description;
        }
        
        if (steamData.header_image) {
            this.currentGame.imageUrl = steamData.header_image;
        }
        
        // Системные требования из Steam
        if (steamData.pc_requirements) {
            this.currentGame.requirements = this.parseSteamRequirements(steamData.pc_requirements);
        }
        
        // Дополнительная информация
        if (steamData.categories) {
            this.currentGame.features = steamData.categories.map(cat => cat.description);
        }
        
        if (steamData.release_date && !steamData.release_date.coming_soon) {
            this.currentGame.releaseDate = steamData.release_date.date;
        }
    }

    parseSteamRequirements(requirements) {
        const result = { minimum: {}, recommended: {} };
        
        if (requirements.minimum) {
            result.minimum = this.extractRequirements(requirements.minimum);
        }
        
        if (requirements.recommended) {
            result.recommended = this.extractRequirements(requirements.recommended);
        }
        
        return result;
    }

    extractRequirements(htmlText) {
        const requirements = {};
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlText;
        
        const text = tempDiv.textContent || tempDiv.innerText || '';
        
        // Парсим основные компоненты
        const osMatch = text.match(/OS:\s*([^\n\r<]+)/i);
        const processorMatch = text.match(/Processor:\s*([^\n\r<]+)/i);
        const memoryMatch = text.match(/Memory:\s*([^\n\r<]+)/i);
        const graphicsMatch = text.match(/Graphics:\s*([^\n\r<]+)/i);
        const storageMatch = text.match(/Storage:\s*([^\n\r<]+)/i);
        
        if (osMatch) requirements.os = osMatch[1].trim();
        if (processorMatch) requirements.cpu = processorMatch[1].trim();
        if (memoryMatch) requirements.ram = memoryMatch[1].trim();
        if (graphicsMatch) requirements.gpu = graphicsMatch[1].trim();
        if (storageMatch) requirements.storage = storageMatch[1].trim();
        
        return requirements;
    }

    generateFallbackData() {
        // Генерируем данные на основе жанра и названия игры
        const genre = this.currentGame.genre.toLowerCase();
        
        // Изображение по умолчанию через Unsplash
        this.currentGame.imageUrl = `https://source.unsplash.com/800x450/?${encodeURIComponent(this.currentGame.name + ' game')}`;
        
        // Системные требования по жанру
        this.currentGame.requirements = this.generateRequirementsByGenre(genre);
        
        // Дополнительные фичи
        this.currentGame.features = this.generateFeaturesByGenre(genre);
    }

    generateRequirementsByGenre(genre) {
        let minReq, recReq;
        
        if (genre.includes('инди') || genre.includes('казуал') || genre.includes('пиксель')) {
            minReq = { 
                os: 'Windows 7/8/10/11', 
                cpu: 'Intel Core i3 или AMD эквивалент', 
                ram: '4 GB RAM', 
                gpu: 'Intel HD Graphics 4000 или лучше', 
                storage: '2 GB доступного места' 
            };
            recReq = { 
                os: 'Windows 10/11', 
                cpu: 'Intel Core i5 или AMD Ryzen 3', 
                ram: '8 GB RAM', 
                gpu: 'NVIDIA GTX 750 Ti или AMD Radeon R7 360', 
                storage: '4 GB доступного места' 
            };
        } else if (genre.includes('страте') || genre.includes('симулятор') || genre.includes('тактич')) {
            minReq = { 
                os: 'Windows 8/10/11', 
                cpu: 'Intel Core i5-3470 или AMD FX-8350', 
                ram: '8 GB RAM', 
                gpu: 'NVIDIA GeForce GTX 950 или AMD Radeon R7 265', 
                storage: '15 GB доступного места' 
            };
            recReq = { 
                os: 'Windows 10/11', 
                cpu: 'Intel Core i7-4770K или AMD Ryzen 5 1500X', 
                ram: '16 GB RAM', 
                gpu: 'NVIDIA GeForce GTX 1060 или AMD Radeon RX 580', 
                storage: '20 GB доступного места' 
            };
        } else if (genre.includes('экшен') || genre.includes('шутер') || genre.includes('приключ')) {
            minReq = { 
                os: 'Windows 10 64-bit', 
                cpu: 'Intel Core i5-4460 или AMD Ryzen 3 1200', 
                ram: '8 GB RAM', 
                gpu: 'NVIDIA GeForce GTX 960 или AMD Radeon R9 280', 
                storage: '50 GB доступного места' 
            };
            recReq = { 
                os: 'Windows 10/11 64-bit', 
                cpu: 'Intel Core i7-4770K или AMD Ryzen 5 1600', 
                ram: '16 GB RAM', 
                gpu: 'NVIDIA GeForce RTX 2060 или AMD Radeon RX 5700', 
                storage: '50 GB доступного места' 
            };
        } else if (genre.includes('ролевая') || genre.includes('rpg') || genre.includes('открытый мир')) {
            minReq = { 
                os: 'Windows 10 64-bit', 
                cpu: 'Intel Core i5-2500K или AMD Ryzen 3 1200', 
                ram: '8 GB RAM', 
                gpu: 'NVIDIA GeForce GTX 970 или AMD Radeon R9 290', 
                storage: '70 GB доступного места' 
            };
            recReq = { 
                os: 'Windows 10/11 64-bit', 
                cpu: 'Intel Core i7-4770K или AMD Ryzen 5 1500X', 
                ram: '16 GB RAM', 
                gpu: 'NVIDIA GeForce RTX 2070 или AMD Radeon RX 5700 XT', 
                storage: '70 GB доступного места' 
            };
        } else {
            // Требования по умолчанию
            minReq = { 
                os: 'Windows 10 64-bit', 
                cpu: 'Intel Core i5-4460 или AMD эквивалент', 
                ram: '8 GB RAM', 
                gpu: 'NVIDIA GeForce GTX 960 или AMD Radeon R9 280', 
                storage: '20 GB доступного места' 
            };
            recReq = { 
                os: 'Windows 10/11 64-bit', 
                cpu: 'Intel Core i7-4770K или AMD Ryzen 5 1600', 
                ram: '16 GB RAM', 
                gpu: 'NVIDIA GeForce RTX 2060 или AMD Radeon RX 5700', 
                storage: '20 GB доступного места' 
            };
        }

        return { minimum: minReq, recommended: recReq };
    }

    generateFeaturesByGenre(genre) {
        const features = [];
        
        if (genre.includes('мультиплеер') || genre.includes('кооператив')) {
            features.push('Мультиплеер', 'Кооператив');
        }
        
        if (genre.includes('одиноч')) {
            features.push('Одиночная игра');
        }
        
        if (genre.includes('открытый мир')) {
            features.push('Открытый мир');
        }
        
        if (genre.includes('песочница')) {
            features.push('Песочница');
        }
        
        if (genre.includes('сюжет') || genre.includes('история')) {
            features.push('Богатый сюжет');
        }
        
        if (genre.includes('стратегия') || genre.includes('тактика')) {
            features.push('Тактический геймплей');
        }
        
        if (genre.includes('выживание')) {
            features.push('Выживание', 'Крафтинг');
        }
        
        return features.length > 0 ? features : ['Захватывающий геймплей', 'Качественная графика'];
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

        // Загружаем изображение
        this.loadGameImage();

        // Отображаем системные требования
        this.displayRequirements();

        // Отображаем дополнительные фичи
        this.displayFeatures();
    }

    async loadGameImage() {
        const imageElement = document.getElementById('detailGameImage');
        const placeholder = document.getElementById('imagePlaceholder');
        
        if (this.currentGame.imageUrl) {
            imageElement.onload = () => {
                imageElement.style.display = 'block';
                placeholder.style.display = 'none';
            };
            
            imageElement.onerror = () => {
                this.loadFallbackImage(placeholder);
            };
            
            imageElement.src = this.currentGame.imageUrl;
        } else {
            this.loadFallbackImage(placeholder);
        }
    }

    async loadFallbackImage(placeholder) {
        try {
            // Пробуем найти изображение через Unsplash
            const searchQuery = encodeURIComponent(this.currentGame.name + ' video game');
            const response = await fetch(`https://source.unsplash.com/800x450/?${searchQuery}`);
            
            if (response.ok) {
                const imageElement = document.getElementById('detailGameImage');
                imageElement.src = response.url;
                imageElement.style.display = 'block';
                placeholder.style.display = 'none';
            } else {
                throw new Error('Unsplash недоступен');
            }
        } catch (error) {
            // Фолбэк заглушка
            placeholder.innerHTML = `
                <span class="placeholder-icon">🎮</span>
                <span>${this.currentGame.name}</span>
                <small>Изображение не найдено</small>
            `;
        }
    }

    displayRequirements() {
        const requirements = this.currentGame.requirements;
        
        if (requirements && requirements.minimum) {
            document.getElementById('minOS').textContent = requirements.minimum.os || 'Информация отсутствует';
            document.getElementById('minCPU').textContent = requirements.minimum.cpu || 'Информация отсутствует';
            document.getElementById('minRAM').textContent = requirements.minimum.ram || 'Информация отсутствует';
            document.getElementById('minGPU').textContent = requirements.minimum.gpu || 'Информация отсутствует';
            document.getElementById('minStorage').textContent = requirements.minimum.storage || 'Информация отсутствует';
        }
        
        if (requirements && requirements.recommended) {
            document.getElementById('recOS').textContent = requirements.recommended.os || 'Информация отсутствует';
            document.getElementById('recCPU').textContent = requirements.recommended.cpu || 'Информация отсутствует';
            document.getElementById('recRAM').textContent = requirements.recommended.ram || 'Информация отсутствует';
            document.getElementById('recGPU').textContent = requirements.recommended.gpu || 'Информация отсутствует';
            document.getElementById('recStorage').textContent = requirements.recommended.storage || 'Информация отсутствует';
        }
    }

    displayFeatures() {
        const featuresContainer = document.getElementById('gameFeatures');
        if (!featuresContainer) return;
        
        if (this.currentGame.features && this.currentGame.features.length > 0) {
            featuresContainer.innerHTML = `
                <h3>🌟 Особенности</h3>
                <div class="features-grid">
                    ${this.currentGame.features.map(feature => `
                        <div class="feature-tag">${feature}</div>
                    `).join('')}
                </div>
            `;
        }
    }

    async loadAllPrices() {
        const storesGrid = document.getElementById('detailedStores');
        storesGrid.innerHTML = '<div class="loading-prices">🔄 Загружаем цены из всех магазинов...</div>';

        const stores = ['steam', 'epic', 'xbox', 'ea', 'ubisoft'];
        const prices = [];

        // Загружаем цены для всех магазинов параллельно
        const pricePromises = stores.map(store => 
            this.fetchStorePrice(store).catch(error => {
                console.error(`Error loading ${store} price:`, error);
                return { store, price: null };
            })
        );

        const results = await Promise.all(pricePromises);
        
        // Отображаем цены
        this.displayAllPrices(results);
    }

    async fetchStorePrice(store) {
        const price = await this.priceAPI.getSteamPrice(this.currentGame.name);
        return { store, price };
    }

    displayAllPrices(prices) {
        const storesGrid = document.getElementById('detailedStores');
        
        // Сортируем магазины: сначала с ценами, потом без
        const availablePrices = prices.filter(p => p.price);
        const unavailablePrices = prices.filter(p => !p.price);
        
        const sortedPrices = [...availablePrices, ...unavailablePrices];
        
        storesGrid.innerHTML = sortedPrices.map(({ store, price }) => {
            if (!price) {
                return `
                    <div class="store-price-card unavailable">
                        <div class="store-header">
                            <div class="store-icon">${this.getStoreIcon(store)}</div>
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

            const isFree = price.price === 0;
            
            return `
                <div class="store-price-card ${price.isRealPrice ? 'real' : 'calculated'}">
                    <div class="store-header">
                        <div class="store-icon">${this.getStoreIcon(store)}</div>
                        <h4 class="store-name">${this.getStoreName(store)}</h4>
                        ${price.isRealPrice ? '<span class="price-badge real">✅ Реальная</span>' : '<span class="price-badge calculated">📊 Расчетная</span>'}
                    </div>
                    
                    <div class="price-main-detailed">
                        <span class="price-amount-detailed ${isFree ? 'free' : ''}">
                            ${isFree ? 'Бесплатно' : this.priceAPI.formatPrice(price.price, price.currency)}
                        </span>
                        ${price.discount > 0 ? `
                            <span class="discount-badge-detailed">-${price.discount}%</span>
                        ` : ''}
                    </div>
                    
                    ${price.originalPrice && price.discount > 0 ? `
                        <div class="original-price-detailed">
                            Было: <span class="price-strikethrough">${this.priceAPI.formatPrice(price.originalPrice, price.currency)}</span>
                        </div>
                    ` : ''}
                    
                    ${price.discount > 0 ? `
                        <div class="saving-amount">
                            Экономия: ${this.priceAPI.formatPrice(price.originalPrice - price.price, price.currency)}
                        </div>
                    ` : ''}
                    
                    <button class="buy-now-btn ${isFree ? 'free-btn' : ''}" onclick="window.openStore('${store}', '${this.currentGame.name}')">
                        ${isFree ? 'Скачать бесплатно' : 'Купить сейчас'}
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