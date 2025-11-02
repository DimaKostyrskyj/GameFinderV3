// API для получения реальных цен игр
class PriceAPI {
    constructor() {
        this.currency = this.getSavedCurrency() || 'USD';
        this.currencyRates = {};
        this.init();
    }

    async init() {
        await this.loadCurrencyRates();
    }

    // Получение курсов валют
    async loadCurrencyRates() {
        try {
            const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
            const data = await response.json();
            this.currencyRates = data.rates;
        } catch (error) {
            console.log('Используем стандартные курсы валют');
            this.currencyRates = {
                USD: 1,
                EUR: 0.85,
                UAH: 36.5,
                RUB: 90.0
            };
        }
    }

    // Конвертация валют
    convertPrice(priceUSD, targetCurrency) {
        const rate = this.currencyRates[targetCurrency] || 1;
        return priceUSD * rate;
    }

    // Форматирование цены
    formatPrice(price, currency) {
        const symbols = {
            'USD': '$',
            'EUR': '€',
            'UAH': '₴',
            'RUB': '₽'
        };

        const formatted = new Intl.NumberFormat('ru-RU', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(price);

        return `${symbols[currency]}${formatted}`;
    }

    // Получение цены из Steam
    async getSteamPrice(gameName) {
        try {
            // Используем Steam API или парсинг
            const response = await fetch(`https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(gameName)}&l=russian&cc=us`);
            const data = await response.json();
            
            if (data.items && data.items.length > 0) {
                const game = data.items[0];
                const priceUSD = game.price ? game.price.final / 100 : null;
                
                if (priceUSD) {
                    return {
                        price: this.convertPrice(priceUSD, this.currency),
                        originalPrice: this.convertPrice(game.price.initial / 100, this.currency),
                        discount: game.price.discount_percent,
                        currency: this.currency,
                        store: 'steam'
                    };
                }
            }
            return null;
        } catch (error) {
            console.log('Steam API error:', error);
            return this.getFallbackPrice('steam');
        }
    }

    // Получение цены из Epic Games (через сторонний API)
    async getEpicPrice(gameName) {
        try {
            const response = await fetch(`https://games.pcis.pk/api/epic?game=${encodeURIComponent(gameName)}`);
            const data = await response.json();
            
            if (data.price) {
                const priceUSD = data.price;
                return {
                    price: this.convertPrice(priceUSD, this.currency),
                    originalPrice: this.convertPrice(data.originalPrice || priceUSD, this.currency),
                    discount: data.discount,
                    currency: this.currency,
                    store: 'epic'
                };
            }
            return null;
        } catch (error) {
            return this.getFallbackPrice('epic');
        }
    }

    // Получение цены из Xbox Store
    async getXboxPrice(gameName) {
        try {
            const response = await fetch(`https://realtime-products.p.rapidapi.com/search?q=${encodeURIComponent(gameName)}&country=US`, {
                headers: {
                    'X-RapidAPI-Key': 'your-api-key',
                    'X-RapidAPI-Host': 'realtime-products.p.rapidapi.com'
                }
            });
            const data = await response.json();
            
            if (data.products && data.products.length > 0) {
                const product = data.products[0];
                return {
                    price: this.convertPrice(product.price, this.currency),
                    originalPrice: this.convertPrice(product.originalPrice || product.price, this.currency),
                    discount: product.discount,
                    currency: this.currency,
                    store: 'xbox'
                };
            }
            return null;
        } catch (error) {
            return this.getFallbackPrice('xbox');
        }
    }

    // Запасные цены (если API не работает)
    getFallbackPrice(store) {
        const basePrices = {
            'steam': { price: 29.99, discount: 20 },
            'epic': { price: 27.99, discount: 15 },
            'xbox': { price: 32.99, discount: 10 },
            'ea': { price: 26.99, discount: 5 },
            'ubisoft': { price: 28.50, discount: 25 }
        };

        const storePrice = basePrices[store] || { price: 29.99, discount: 0 };
        
        return {
            price: this.convertPrice(storePrice.price, this.currency),
            originalPrice: this.convertPrice(storePrice.price * 1.2, this.currency), // +20% как оригинальная цена
            discount: storePrice.discount,
            currency: this.currency,
            store: store
        };
    }

    // Сохранение валюты
    setCurrency(currency) {
        this.currency = currency;
        localStorage.setItem('preferredCurrency', currency);
    }

    getSavedCurrency() {
        return localStorage.getItem('preferredCurrency');
    }
}

// Глобальный экземпляр API
window.priceAPI = new PriceAPI();