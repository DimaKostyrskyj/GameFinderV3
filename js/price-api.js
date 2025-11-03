// Система получения цен через DeepSeek AI
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
        this.DEEPSEEK_API_KEY = 'sk-7f36fac6978e4df0b3ee1e97534d5fc4';
        
        this.priceCache = new Map();
    }

    // Получение цены из Steam через DeepSeek
    async getSteamPrice(gameName) {
        return await this.getPriceFromAI(gameName, 'steam');
    }

    // Получение цены из Epic Games через DeepSeek
    async getEpicPrice(gameName) {
        return await this.getPriceFromAI(gameName, 'epic');
    }

    // Получение цены из Xbox Store через DeepSeek
    async getXboxPrice(gameName) {
        return await this.getPriceFromAI(gameName, 'xbox');
    }

    // Получение цены из EA App через DeepSeek
    async getEAPrice(gameName) {
        return await this.getPriceFromAI(gameName, 'ea');
    }

    // Получение цены из Ubisoft Store через DeepSeek
    async getUbisoftPrice(gameName) {
        return await this.getPriceFromAI(gameName, 'ubisoft');
    }

    // Основной метод получения цены через DeepSeek
    async getPriceFromAI(gameName, store) {
    const cacheKey = `${store}_${gameName}_${this.currency}`;
    
    if (this.priceCache.has(cacheKey)) {
        return this.priceCache.get(cacheKey);
    }

    try {
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    {
                        role: "system",
                        content: `Ты эксперт по ценам видеоигр. Твоя задача - определить реалистичную цену для игры.
                        
                        ОТВЕЧАЙ ТОЛЬКО В ФОРМАТЕ JSON БЕЗ ЛЮБЫХ ДОПОЛНИТЕЛЬНЫХ ТЕКСТОВ:
                        {
                            "basePrice": 59.99,
                            "discount": 20,
                            "isFree": false,
                            "confidence": 8
                        }
                        
                        Правила:
                        - basePrice: число от 0 до 100
                        - discount: число от 0 до 90
                        - isFree: true/false
                        - confidence: число от 1 до 10
                        
                        Примеры правильных ответов:
                        {"basePrice": 59.99, "discount": 0, "isFree": false, "confidence": 9}
                        {"basePrice": 19.99, "discount": 30, "isFree": false, "confidence": 7}
                        {"basePrice": 0, "discount": 0, "isFree": true, "confidence": 6}`
                    },
                    {
                        role: "user",
                        content: `Игра: "${gameName}", Магазин: ${store}. Верни только JSON.`
                    }
                ],
                temperature: 0.1,
                max_tokens: 150
            })
        });

        if (!response.ok) {
            throw new Error(`Ошибка API: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.choices || !data.choices[0]) {
            throw new Error('Неверный ответ от AI');
        }

        const content = data.choices[0].message.content.trim();
        console.log('Raw DeepSeek Response:', content);

        // Очистка ответа - убираем все кроме JSON
        let jsonString = content;
        
        // Если есть код блока, извлекаем JSON
        if (jsonString.includes('```json')) {
            jsonString = jsonString.split('```json')[1].split('```')[0].trim();
        } else if (jsonString.includes('```')) {
            jsonString = jsonString.split('```')[1].split('```')[0].trim();
        }
        
        // Убираем возможные префиксы
        jsonString = jsonString.replace(/^JSON:\s*/i, '');
        
        let priceData;
        try {
            priceData = JSON.parse(jsonString);
            console.log('Parsed price data:', priceData);
        } catch (parseError) {
            console.error('JSON parse error:', parseError, 'Raw content:', content);
            
            // Попробуем извлечь JSON другим способом
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    priceData = JSON.parse(jsonMatch[0]);
                } catch (secondError) {
                    throw new Error('Не удалось распарсить JSON ответ');
                }
            } else {
                throw new Error('JSON не найден в ответе');
            }
        }

        // Валидация обязательных полей
        const requiredFields = ['basePrice', 'discount', 'isFree'];
        for (const field of requiredFields) {
            if (priceData[field] === undefined) {
                throw new Error(`Отсутствует обязательное поле: ${field}`);
            }
        }

        // Нормализация данных
        let finalPrice = priceData.isFree ? 0 : parseFloat(priceData.basePrice);
        const discount = parseInt(priceData.discount) || 0;
        const confidence = parseInt(priceData.confidence) || 5;

        // Применяем скидку если игра не бесплатная
        if (!priceData.isFree && discount > 0) {
            finalPrice = finalPrice * (1 - discount / 100);
        }

        const result = {
            price: this.convertPrice(finalPrice, this.currency),
            originalPrice: (!priceData.isFree && discount > 0) ? 
                this.convertPrice(parseFloat(priceData.basePrice), this.currency) : null,
            discount: Math.max(0, Math.min(90, discount)),
            currency: this.currency,
            store: store,
            confidence: Math.max(1, Math.min(10, confidence))
        };

        console.log('Final price result:', result);
        this.priceCache.set(cacheKey, result);
        return result;

    } catch (error) {
        console.error('DeepSeek price error:', error);
        throw new Error(`Не удалось получить цену: ${error.message}`);
    }
}

    // Конвертация валют
    convertPrice(priceUSD, targetCurrency) {
        const rate = this.currencyRates[targetCurrency] || 1;
        return Math.round(priceUSD * rate * 100) / 100;
    }

    // Форматирование цены
    formatPrice(price, currency) {
        if (price === null || price === undefined) {
            return 'Цена не найдена';
        }
        
        if (price === 0) {
            return 'Бесплатно';
        }
        
        const symbol = this.currencySymbols[currency] || '$';
        return `${symbol}${price.toFixed(2)}`;
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