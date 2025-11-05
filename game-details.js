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
        console.log('🎮 Загружена игра:', this.currentGame);
        
        // Показываем базовые данные из AI
        this.displayBasicInfo();
        
        // Загружаем Steam данные
        await this.loadSteamData();
        this.loadAllPrices();
    }

    displayBasicInfo() {
        document.getElementById('detailGameTitle').textContent = this.currentGame.name;
        document.getElementById('detailMatchScore').textContent = Math.round(this.currentGame.moodMatch * 100) + '%';
        document.getElementById('detailGenre').textContent = this.currentGame.genre;
        document.getElementById('detailPlatforms').textContent = this.currentGame.platforms?.join(', ') || 'PC';
        document.getElementById('detailPlaytime').textContent = this.currentGame.playtime;
        document.getElementById('detailVibe').textContent = this.currentGame.vibe;
        document.getElementById('detailDescription').textContent = this.currentGame.description;
        document.getElementById('detailReason').textContent = this.currentGame.whyPerfect;
    }

    async loadSteamData() {
        try {
            // 1. Ищем Steam App ID
            await this.findSteamAppId();
            
            // 2. Загружаем данные игры
            if (this.steamAppId) {
                await this.loadSteamGameDetails();
            } else {
                console.log('Steam App ID не найден');
                this.showSteamDataUnavailable();
            }
            
        } catch (error) {
            console.error('Ошибка загрузки Steam данных:', error);
            this.showSteamDataUnavailable();
        }
    }

    async findSteamAppId() {
        try {
            // Используем Steam Web API (не требует ключа для получения списка игр)
            const response = await fetch('https://api.steampowered.com/ISteamApps/GetAppList/v2/');
            
            if (!response.ok) {
                throw new Error(`Steam API error: ${response.status}`);
            }
            
            const data = await response.json();
            const apps = data.applist.apps;
            
            // Поиск по точному или частичному совпадению
            const foundApp = apps.find(app => 
                app.name.toLowerCase() === this.currentGame.name.toLowerCase() ||
                app.name.toLowerCase().includes(this.currentGame.name.toLowerCase()) ||
                this.currentGame.name.toLowerCase().includes(app.name.toLowerCase())
            );
            
            this.steamAppId = foundApp ? foundApp.appid : null;
            console.log('🔍 Найден Steam App ID:', this.steamAppId);
            
        } catch (error) {
            console.error('Ошибка поиска Steam App ID:', error);
            this.steamAppId = null;
        }
    }

    async loadSteamGameDetails() {
        try {
            // Steam Store API - публичный доступ, не требует ключа
            const response = await fetch(`https://store.steampowered.com/api/appdetails?appids=${this.steamAppId}&l=russian`);
            
            if (!response.ok) {
                throw new Error(`Steam Store API error: ${response.status}`);
            }
            
            const data = await response.json();
            const gameData = data[this.steamAppId];
            
            if (gameData && gameData.success) {
                this.enrichWithSteamData(gameData.data);
                console.log('✅ Steam данные успешно загружены');
            } else {
                throw new Error('Steam данные недоступны для этой игры');
            }
            
        } catch (error) {
            console.error('Ошибка загрузки деталей игры:', error);
            throw error;
        }
    }

    enrichWithSteamData(steamData) {
        // Обновляем данные из Steam
        if (steamData.name) {
            document.getElementById('detailGameTitle').textContent = steamData.name;
        }
        
        if (steamData.genres) {
            const genres = steamData.genres.map(genre => genre.description);
            document.getElementById('detailGenre').textContent = genres.join(', ');
        }
        
        if (steamData.platforms) {
            const platforms = [];
            if (steamData.platforms.windows) platforms.push('Windows');
            if (steamData.platforms.mac) platforms.push('Mac');
            if (steamData.platforms.linux) platforms.push('Linux');
            document.getElementById('detailPlatforms').textContent = platforms.join(', ');
        }
        
        if (steamData.short_description) {
            document.getElementById('detailDescription').textContent = steamData.short_description;
        }
        
        if (steamData.header_image) {
            this.loadGameImage(steamData.header_image);
        }
        
        // Системные требования
        if (steamData.pc_requirements) {
            this.displaySteamRequirements(steamData.pc_requirements);
        }
        
        // Дополнительная информация
        if (steamData.categories) {
            this.displaySteamFeatures(steamData.categories);
        }
        
        if (steamData.release_date && !steamData.release_date.coming_soon) {
            this.displayReleaseDate(steamData.release_date.date);
        }
    }

    loadGameImage(imageUrl) {
        const imageElement = document.getElementById('detailGameImage');
        const placeholder = document.getElementById('imagePlaceholder');
        
        imageElement.onload = () => {
            imageElement.style.display = 'block';
            placeholder.style.display = 'none';
        };
        
        imageElement.onerror = () => {
            console.log('Ошибка загрузки изображения');
            placeholder.innerHTML = `
                <span class="placeholder-icon">🎮</span>
                <span>${this.currentGame.name}</span>
            `;
        };
        
        imageElement.src = imageUrl;
    }

    displaySteamRequirements(requirements) {
        const minReq = this.parseRequirements(requirements.minimum);
        const recReq = this.parseRequirements(requirements.recommended);
        
        if (minReq) {
            document.getElementById('minOS').textContent = minReq.os || 'Информация отсутствует';
            document.getElementById('minCPU').textContent = minReq.cpu || 'Информация отсутствует';
            document.getElementById('minRAM').textContent = minReq.ram || 'Информация отсутствует';
            document.getElementById('minGPU').textContent = minReq.gpu || 'Информация отсутствует';
            document.getElementById('minStorage').textContent = minReq.storage || 'Информация отсутствует';
        }
        
        if (recReq) {
            document.getElementById('recOS').textContent = recReq.os || 'Информация отсутствует';
            document.getElementById('recCPU').textContent = recReq.cpu || 'Информация отсутствует';
            document.getElementById('recRAM').textContent = recReq.ram || 'Информация отсутствует';
            document.getElementById('recGPU').textContent = recReq.gpu || 'Информация отсутствует';
            document.getElementById('recStorage').textContent = recReq.storage || 'Информация отсутствует';
        }
    }

    parseRequirements(htmlText) {
        if (!htmlText) return null;
        
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
        const directXMatch = text.match(/DirectX:\s*([^\n\r<]+)/i);
        
        if (osMatch) requirements.os = osMatch[1].trim();
        if (processorMatch) requirements.cpu = processorMatch[1].trim();
        if (memoryMatch) requirements.ram = memoryMatch[1].trim();
        if (graphicsMatch) requirements.gpu = graphicsMatch[1].trim();
        if (storageMatch) requirements.storage = storageMatch[1].trim();
        if (directXMatch) requirements.directx = directXMatch[1].trim();
        
        return Object.keys(requirements).length > 0 ? requirements : null;
    }

    displaySteamFeatures(categories) {
        const featuresContainer = document.getElementById('gameFeatures');
        if (!featuresContainer || !categories) return;
        
        const features = categories.map(cat => cat.description);
        
        if (features.length > 0) {
            featuresContainer.innerHTML = `
                <h3>🌟 Особенности</h3>
                <div class="features-grid">
                    ${features.map(feature => `
                        <div class="feature-tag">${feature}</div>
                    `).join('')}
                </div>
            `;
        }
    }

    displayReleaseDate(date) {
        const featuresContainer = document.getElementById('gameFeatures');
        if (!featuresContainer) return;
        
        let existingContent = featuresContainer.innerHTML;
        if (!existingContent.includes('🌟 Особенности')) {
            existingContent = `<h3>🌟 Особенности</h3><div class="features-grid">`;
        }
        
        featuresContainer.innerHTML = existingContent.replace('</div>', 
            `<div class="feature-tag release-date">📅 ${date}</div></div>`
        );
    }

    showSteamDataUnavailable() {
        const placeholder = document.getElementById('imagePlaceholder');
        placeholder.innerHTML = `
            <span class="placeholder-icon">🎮</span>
            <span>${this.currentGame.name}</span>
            <small>Steam данные недоступны</small>
        `;
        
        // Показываем базовые системные требования
        this.displayBasicRequirements();
    }

    displayBasicRequirements() {
        // Минимальные системные требования по умолчанию
        document.getElementById('minOS').textContent = 'Windows 10';
        document.getElementById('minCPU').textContent = 'Intel Core i5 или аналогичный';
        document.getElementById('minRAM').textContent = '8 GB RAM';
        document.getElementById('minGPU').textContent = 'NVIDIA GTX 960 или аналогичная';
        document.getElementById('minStorage').textContent = '20 GB доступного места';
        
        // Рекомендуемые системные требования по умолчанию
        document.getElementById('recOS').textContent = 'Windows 10/11';
        document.getElementById('recCPU').textContent = 'Intel Core i7 или аналогичный';
        document.getElementById('recRAM').textContent = '16 GB RAM';
        document.getElementById('recGPU').textContent = 'NVIDIA RTX 2060 или аналогичная';
        document.getElementById('recStorage').textContent = '20 GB доступного места';
    }

    async loadAllPrices() {
        const storesGrid = document.getElementById('detailedStores');
        storesGrid.innerHTML = '<div class="loading-prices">🔄 Загружаем цены...</div>';

        try {
            const stores = ['steam', 'epic', 'xbox', 'ea', 'ubisoft'];
            const pricePromises = stores.map(store => 
                this.fetchStorePrice(store)
            );

            const results = await Promise.allSettled(pricePromises);
            const prices = results.map(result => 
                result.status === 'fulfilled' ? result.value : { store: 'unknown', price: null }
            );

            this.displayAllPrices(prices);
        } catch (error) {
            console.error('Ошибка загрузки цен:', error);
            storesGrid.innerHTML = '<div class="price-error">❌ Не удалось загрузить цены</div>';
        }
    }

    async fetchStorePrice(store) {
        try {
            let priceData;
            switch(store) {
                case 'steam':
                    priceData = await this.priceAPI.getSteamPrice(this.currentGame.name);
                    break;
                case 'epic':
                    priceData = await this.priceAPI.getEpicPrice(this.currentGame.name);
                    break;
                case 'xbox':
                    priceData = await this.priceAPI.getXboxPrice(this.currentGame.name);
                    break;
                case 'ea':
                    priceData = await this.priceAPI.getEAPrice(this.currentGame.name);
                    break;
                case 'ubisoft':
                    priceData = await this.priceAPI.getUbisoftPrice(this.currentGame.name);
                    break;
                default:
                    priceData = null;
            }
            return { store, price: priceData };
        } catch (error) {
            console.error(`Ошибка загрузки цены для ${store}:`, error);
            return { store, price: null };
        }
    }

    displayAllPrices(prices) {
        const storesGrid = document.getElementById('detailedStores');
        
        storesGrid.innerHTML = prices.map(({ store, price }) => {
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

document.addEventListener('DOMContentLoaded', function() {
    window.gameDetailsPage = new GameDetailsPage();
});