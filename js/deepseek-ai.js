class GameSearchAI {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseURL = 'https://api.deepseek.com/chat/completions';
    }
    

    async searchGames(userQuery) {
        try {
            console.log('🤖 Starting DeepSeek AI search for:', userQuery);
            
            const response = await fetch(this.baseURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    model: "deepseek-chat",
                    messages: [
                        {
                            role: "system",
                            content: `Ты эксперт по подбору компьютерных игр. Пользователь описывает, какую игру хочет найти. 
                            Твоя задача - проанализировать запрос и предложить 12 релевантных игр.
                            
                            ОТВЕЧАЙ ТОЛЬКО В ФОРМАТЕ JSON БЕЗ ЛЮБЫХ ДОПОЛНИТЕЛЬНЫХ ТЕКСТОВ И КОММЕНТАРИЕВ!
                            
                            Формат ответа:
                            {
                                "analysis": {
                                    "understoodMood": "строка - какое настроение понял из запроса",
                                    "recommendedStyle": "строка - рекомендуемый стиль игр", 
                                    "keyFactors": ["фактор1", "фактор2", "фактор3"],
                                    "reasoning": "строка - объяснение подбора игр"
                                },
                                "games": [
                                    {
                                        "name": "название игры на русском",
                                        "genre": "жанр игры",
                                        "description": "интересное описание 2-3 предложения",
                                        "moodMatch": 0.95,
                                        "playtime": "время прохождения",
                                        "vibe": "атмосфера игры", 
                                        "whyPerfect": "почему идеально подходит под запрос",
                                        "platforms": ["PC", "PS5", "XBOX", "Switch"]
                                    }
                                ]
                            }
                            
                            ВАЖНО: 
                            - Верни РОВНО 12 игр
                            - moodMatch от 0.7 до 0.99
                            - platforms должны быть реальными
                            - Описания должны быть уникальными и интересными`
                        },
                        {
                            role: "user", 
                            content: `Найди игры по запросу: "${userQuery}"`
                        }
                    ],
                    max_tokens: 4000,
                    temperature: 0.8,
                    stream: false
                })
            });

            console.log('📥 DeepSeek response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ DeepSeek API error:', response.status, errorText);
                throw new Error(`DeepSeek API Error: ${response.status}`);
            }

            const data = await response.json();
            console.log('✅ DeepSeek response received');
            
            if (!data.choices || !data.choices[0]) {
                throw new Error('Invalid response structure from DeepSeek');
            }

            const content = data.choices[0].message.content;
            console.log('📝 DeepSeek content length:', content.length);

            const results = this.parseAIResponse(content);
            
            // Гарантируем что есть 12 игр
            if (!results.games || results.games.length === 0) {
                throw new Error('DeepSeek не вернул ни одной игры');
            }
            
            console.log(`🎯 DeepSeek found ${results.games.length} games`);
            return results;
            
        } catch (error) {
            console.error('❌ DeepSeek search error:', error);
            throw new Error(`DeepSeek недоступен: ${error.message}`);
        }
    }
    

    parseAIResponse(content) {
        try {
            // Очищаем ответ от возможных markdown
            let cleanContent = content.trim();
            
            // Удаляем ```json и ```
            if (cleanContent.startsWith('```json')) {
                cleanContent = cleanContent.substring(7);
            }
            if (cleanContent.endsWith('```')) {
                cleanContent = cleanContent.substring(0, cleanContent.length - 3);
            }
            cleanContent = cleanContent.trim();
            
            console.log('🧹 Cleaned content:', cleanContent.substring(0, 200) + '...');
            
            const parsed = JSON.parse(cleanContent);
            
            // Валидация структуры
            if (!parsed.analysis || !parsed.games) {
                throw new Error('Invalid JSON structure from DeepSeek');
            }
            
            // Гарантируем что games - массив
            if (!Array.isArray(parsed.games)) {
                throw new Error('Games should be an array');
            }
            
            return parsed;
            
        } catch (error) {
            console.error('❌ Failed to parse DeepSeek response:', error);
            console.log('📄 Raw content that failed to parse:', content);
            throw new Error(`Ошибка обработки ответа от DeepSeek: ${error.message}`);
        }
    }
    async searchGames(query, filters = {}) {
    try {
        const prompt = this.buildSearchPrompt(query, filters);
        const response = await this.sendRequestToDeepSeek(prompt);
        
        if (!response) {
            throw new Error('Empty response from DeepSeek');
        }

        // Обработка streaming response если нужно
        if (typeof response === 'string') {
            return this.parseAIResponse(response);
        }
        
        // Если ответ уже объект
        return response;
        
    } catch (error) {
        console.error('DeepSeek search error:', error);
        
        // Более информативное сообщение об ошибке
        if (error.message.includes('JSON')) {
            throw new Error(`DeepSeek недоступен: Ошибка обработки ответа: ${error.message}`);
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
            throw new Error('DeepSeek недоступен: Проблемы с сетью');
        } else {
            throw new Error(`DeepSeek недоступен: ${error.message}`);
        }
    }
    }
}