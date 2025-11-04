// Умная система цен с приоритетом Steam API
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
        
        this.STEAM_API_KEY = 'AE24FF0F346F19DAE48D097AC1FEA4F6';
        this.priceCache = new Map();
    }

    // 🔥 ОСНОВНОЙ МЕТОД - Real Steam Price
    async getSteamPrice(gameName) {
        const cacheKey = `steam_${gameName}_${this.currency}`;
        
        if (this.priceCache.has(cacheKey)) {
            return this.priceCache.get(cacheKey);
        }

        try {
            // Поиск AppID в Steam
            const appId = await this.searchSteamGame(gameName);
            
            if (!appId) {
                return await this.getEstimatedPrice(gameName, 'steam', true);
            }

            // Получение реальной цены
            const currencyCode = this.getSteamCurrencyCode(this.currency);
            const priceData = await this.getSteamPriceData(appId, currencyCode);
            
            if (!priceData) {
                return await this.getEstimatedPrice(gameName, 'steam', true);
            }

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

    // 🎯 УМНЫЕ РАСЧЕТНЫЕ ЦЕНЫ для других платформ
    async getEpicPrice(gameName) {
        // Пытаемся получить Steam цену как ориентир
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

    // 🧮 Расчет цены для других платформ на основе Steam
    calculatePlatformPrice(steamPrice, gameName, platform) {
        const platformMultipliers = {
            'epic': 0.95,    // Epic обычно чуть дешевле
            'xbox': 1.15,    // Xbox часто дороже
            'ea': 1.05,      // EA App - примерно как Steam
            'ubisoft': 1.0   // Ubisoft - как Steam
        };

        const multiplier = platformMultipliers[platform] || 1.0;
        const basePrice = steamPrice.price / multiplier;

        // Генерируем правдоподобную скидку
        let discount = steamPrice.discount || 0;
        if (platform === 'epic' && discount > 0) {
            discount = Math.min(discount + 5, 90); // Epic часто дает доп. скидки
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

    // 🔍 Поиск игры в Steam
    async searchSteamGame(gameName) {
        try {
            const response = await fetch(`https://api.steampowered.com/ISteamApps/GetAppList/v2/`);
            if (!response.ok) throw new Error('Steam API error');
            
            const data = await response.json();
            const apps = data.applist.apps;
            
            // Точный поиск по названию
            const foundApp = apps.find(app => 
                app.name.toLowerCase().includes(gameName.toLowerCase()) ||
                gameName.toLowerCase().includes(app.name.toLowerCase())
            );
            
            return foundApp ? foundApp.appid : null;
            
        } catch (error) {
            console.error('Steam search error:', error);
            return null;
        }
    }

    // 💰 Получение данных о цене из Steam
    async getSteamPriceData(appId, currency = 'us') {
        try {
            const response = await fetch(
                `https://store.steampowered.com/api/appdetails?appids=${appId}&cc=${currency}&filters=price_overview`
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

    // 📊 Резервный метод для расчетных цен
    async getEstimatedPrice(gameName, platform, isSteam = false) {
        const realisticPrices = {
            'valheim': { basePrice: 19.99, discount: 0 },
            'cyberpunk 2077': { basePrice: 59.99, discount: 30 },
            'minecraft': { basePrice: 26.95, discount: 0 },
            'stardew valley': { basePrice: 14.99, discount: 0 },
            'call of duty': { basePrice: 69.99, discount: 20 },
            'the witcher 3': { basePrice: 39.99, discount: 70 },
            'grand theft auto v': { basePrice: 29.99, discount: 50 },
            'elden ring': { basePrice: 59.99, discount: 25 },
            'hades': { basePrice: 24.99, discount: 20 }
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

    // 🎪 Вспомогательные методы
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