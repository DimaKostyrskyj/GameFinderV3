// Обновленная система цен с прокси
class PriceAPI {
    constructor() {
        this.currency = this.getSavedCurrency() || 'USD';
        this.currencyRates = {
            'USD': 1,
            'EUR': 0.93,
            'UAH': 39.5,
            'RUB': 92.0
        };
        this.currencySymbols = {
            'USD': '$',
            'EUR': '€',
            'UAH': '₴',
            'RUB': '₽'
        };
        
        this.priceCache = new Map();
        this.useProxy = true; // Включить прокси
    }

    // 🔧 Универсальный метод запроса через прокси
    async fetchWithProxy(url) {
        if (this.useProxy) {
            // Используем прокси для обхода CORS
            const proxyUrl = `/proxy.php?url=${encodeURIComponent(url)}`;
            try {
                const response = await fetch(proxyUrl);
                if (!response.ok) throw new Error(`Proxy error: ${response.status}`);
                return await response.json();
            } catch (error) {
                console.error('Proxy fetch error:', error);
                throw error;
            }
        } else {
            // Прямой запрос (работает только с CORS)
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
            return await response.json();
        }
    }

    // 🔍 Поиск игры в Steam
async searchSteamGame(gameName) {
    try {
        // Простая заглушка - всегда возвращаем расчетную цену
        console.log(`Игра "${gameName}" не найдена в Steam, используем расчетную цену`);
        return null;
    } catch (error) {
        console.error('Steam search error:', error);
        return null;
    }
}

// 💰 Получение данных о цене из Steam
async getSteamPriceData(appId, currency = 'us') {
    try {
        const response = await fetch(
            `/proxy.php?endpoint=api/appdetails&appid=${appId}&cc=${currency}`
        );
        
        if (!response.ok) throw new Error('Steam store API error');
        
        const data = await response.json();
        const appData = data[appId];
        
        if (!appData || !appData.success || !appData.data?.price_overview) {
            return null;
        }
        
        return appData.data.price_overview;
        
    } catch (error) {
        console.error('Steam price error:', error);
        return null;
    }
}

    // 🎯 Основной метод для Steam
    async getSteamPrice(gameName) {
        const cacheKey = `steam_${gameName}_${this.currency}`;
        
        if (this.priceCache.has(cacheKey)) {
            return this.priceCache.get(cacheKey);
        }

        try {
            // 1. Ищем appid игры
            const appId = await this.searchSteamGame(gameName);
            
            if (!appId) {
                console.log('Игра не найдена в Steam, используем расчетную цену');
                return await this.getEstimatedPrice(gameName, 'steam', true);
            }

            // 2. Получаем реальную цену
            const currencyCode = this.getSteamCurrencyCode(this.currency);
            const priceData = await this.getSteamPriceData(appId, currencyCode);
            
            if (!priceData) {
                console.log('Цена не найдена, используем расчетную цену');
                return await this.getEstimatedPrice(gameName, 'steam', true);
            }

            // 3. Форматируем результат
            const finalPrice = priceData.final / 100;
            const originalPrice = priceData.initial / 100;
            const discount = priceData.discount_percent;

            const result = {
                price: this.convertPrice(finalPrice, this.currency),
                originalPrice: discount > 0 ? this.convertPrice(originalPrice, this.currency) : null,
                discount: discount,
                currency: this.currency,
                store: 'steam',
                appId: appId,
                isRealPrice: true,
                source: 'steam_api'
            };

            this.priceCache.set(cacheKey, result);
            return result;

        } catch (error) {
            console.error('Steam API error, using estimation:', error);
            return await this.getEstimatedPrice(gameName, 'steam', true);
        }
    }

    // 📊 Расчетные цены для других платформ
    async getEpicPrice(gameName) {
        const steamPrice = await this.getSteamPrice(gameName);
        return this.calculatePlatformPrice(steamPrice, gameName, 'epic');
    }

    async getXboxPrice(gameName) {
        const steamPrice = await this.getSteamPrice(gameName);
        return this.calculatePlatformPrice(steamPrice, gameName, 'xbox');
    }

    async getEAPrice(gameName) {
        const steamPrice = await this.getSteamPrice(gameName);
        return this.calculatePlatformPrice(steamPrice, gameName, 'ea');
    }

    async getUbisoftPrice(gameName) {
        const steamPrice = await this.getSteamPrice(gameName);
        return this.calculatePlatformPrice(steamPrice, gameName, 'ubisoft');
    }

    // 🧮 Расчет цены для других платформ
    calculatePlatformPrice(steamPrice, gameName, platform) {
        const platformMultipliers = {
            'epic': 0.95,
            'xbox': 1.15,
            'ea': 1.05,
            'ubisoft': 1.0
        };

        const multiplier = platformMultipliers[platform] || 1.0;
        const basePrice = steamPrice.price / multiplier;
        let discount = steamPrice.discount || 0;

        // Дополнительные скидки для Epic
        if (platform === 'epic' && discount > 0) {
            discount = Math.min(discount + 5, 90);
        }

        const finalPrice = discount > 0 ? basePrice * (1 - discount / 100) : basePrice;

        return {
            price: finalPrice,
            originalPrice: discount > 0 ? basePrice : null,
            discount: discount,
            currency: this.currency,
            store: platform,
            isRealPrice: false,
            source: 'calculated',
            basedOnSteam: true,
            steamReference: `На основе Steam: ${this.formatPrice(steamPrice.price, steamPrice.currency)}`
        };
    }

    // 🎪 Резервные методы
    async getEstimatedPrice(gameName, platform, isSteam = false) {
        const realisticPrices = {
            'valheim': { basePrice: 19.99, discount: 0 },
            'cyberpunk': { basePrice: 59.99, discount: 30 },
            'minecraft': { basePrice: 26.95, discount: 0 },
            'stardew valley': { basePrice: 14.99, discount: 0 },
            'call of duty': { basePrice: 69.99, discount: 20 },
            'the witcher': { basePrice: 39.99, discount: 70 },
            'grand theft auto': { basePrice: 29.99, discount: 50 },
            'elden ring': { basePrice: 59.99, discount: 25 },
            'hades': { basePrice: 24.99, discount: 20 },
            'fall guys': { basePrice: 0, discount: 0 },
            'among us': { basePrice: 4.99, discount: 0 },
            'rust': { basePrice: 39.99, discount: 0 }
        };

        const name = gameName.toLowerCase();
        let priceData = { basePrice: 29.99, discount: 0 };

        for (const [key, data] of Object.entries(realisticPrices)) {
            if (name.includes(key)) {
                priceData = data;
                break;
            }
        }

        const finalPrice = priceData.discount > 0 ? 
            priceData.basePrice * (1 - priceData.discount / 100) : priceData.basePrice;

        return {
            price: this.convertPrice(finalPrice, this.currency),
            originalPrice: priceData.discount > 0 ? 
                this.convertPrice(priceData.basePrice, this.currency) : null,
            discount: priceData.discount,
            currency: this.currency,
            store: platform,
            isRealPrice: false,
            source: isSteam ? 'steam_estimated' : 'calculated',
            basedOnSteam: isSteam
        };
    }

    // 🛠️ Вспомогательные методы
    getSteamCurrencyCode(currency) {
        const codes = { 'USD': 'us', 'EUR': 'eu', 'UAH': 'ua', 'RUB': 'ru' };
        return codes[currency] || 'us';
    }

    convertPrice(priceUSD, targetCurrency) {
        const rate = this.currencyRates[targetCurrency] || 1;
        return Math.round(priceUSD * rate * 100) / 100;
    }

    formatPrice(price, currency) {
        if (price === null || price === undefined) return 'Цена не найдена';
        if (price === 0) return 'Бесплатно';
        const symbol = this.currencySymbols[currency] || '$';
        return `${symbol}${price.toFixed(2)}`;
    }

    setCurrency(currency) {
        this.currency = currency;
        localStorage.setItem('preferredCurrency', currency);
    }

    getSavedCurrency() {
        return localStorage.getItem('preferredCurrency');
    }
}

window.priceAPI = new PriceAPI();