class DirectGameSearchAI {
    constructor() {
        this.apiKey = 'sk-7f36fac6978e4df0b3ee1e97534d5fc4';
        this.baseURL = 'https://api.deepseek.com/chat/completions';
    }

    async searchGames(userQuery) {
        try {
            console.log('🤖 Starting Direct DeepSeek AI search for:', userQuery);
            
            if (!userQuery || userQuery.trim() === '') {
                throw new Error('Поисковый запрос не может быть пустым');
            }

            const prompt = this.createPrompt(userQuery);
            
            const requestData = {
                'model': 'deepseek-chat',
                'messages': [
                    {
                        'role': 'user',
                        'content': prompt
                    }
                ],
                'max_tokens': 3000,
                'temperature': 0.7,
                'stream': false
            };

            console.log('📡 Making direct API request to DeepSeek...');
            
            const response = await fetch(this.baseURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + this.apiKey,
                    'Accept': 'application/json'
                },
                body: JSON.stringify(requestData)
            });
            
            console.log('📥 DeepSeek response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ DeepSeek API error:', response.status, errorText);
                
                let errorMessage = 'Ошибка сервера';
                if (response.status === 400) errorMessage = 'Неверный запрос';
                if (response.status === 401) errorMessage = 'Неверный API ключ';
                if (response.status === 429) errorMessage = 'Слишком много запросов';
                if (response.status === 500) errorMessage = 'Ошибка на сервере DeepSeek';
                
                throw new Error(`DeepSeek API: ${errorMessage} (код: ${response.status})`);
            }

            const data = await response.json();
            console.log('✅ DeepSeek raw response received');

            if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
                throw new Error('Некорректный ответ от DeepSeek API');
            }

            const content = data.choices[0].message.content;
            console.log('📝 DeepSeek content:', content);

            if (!content) {
                throw new Error('Пустой ответ от AI');
            }

            const results = this.parseAIResponse(content);
            
            if (!results.games || results.games.length === 0) {
                throw new Error('AI не нашел подходящих игр');
            }
            
            console.log(`🎯 DeepSeek found ${results.games.length} games`);
            return results;
            
        } catch (error) {
            console.error('❌ Direct AI search error:', error);
            
            // Fallback: возвращаем демо-данные если API не работает
            if (error.message.includes('CORS') || error.message.includes('Network')) {
                console.log('🔄 Using fallback data due to network error');
                return this.getFallbackData(userQuery);
            }
            
            throw new Error(`Ошибка поиска: ${error.message}`);
        }
    }

    createPrompt(query) {
        return `Пользователь ищет игры по запросу: "${query}". 

Верни ТОЛЬКО JSON без каких-либо дополнительных текстов:

{
    "analysis": {
        "understoodMood": "краткое описание настроения",
        "recommendedStyle": "стиль игр", 
        "keyFactors": ["фактор1", "фактор2"],
        "reasoning": "краткое объяснение подбора"
    },
    "games": [
        {
            "name": "Название игры 1",
            "genre": "Жанр",
            "description": "Описание игры",
            "moodMatch": 0.95,
            "playtime": "Время игры",
            "vibe": "Атмосфера",
            "whyPerfect": "Почему подходит",
            "platforms": ["PC", "PS5"]
        },
        {
            "name": "Название игры 2", 
            "genre": "Жанр",
            "description": "Описание игры",
            "moodMatch": 0.90,
            "playtime": "Время игры", 
            "vibe": "Атмосфера",
            "whyPerfect": "Почему подходит",
            "platforms": ["PC", "XBOX"]
        },
        {
            "name": "Название игры 3",
            "genre": "Жанр", 
            "description": "Описание игры",
            "moodMatch": 0.85,
            "playtime": "Время игры",
            "vibe": "Атмосфера",
            "whyPerfect": "Почему подходит",
            "platforms": ["PC", "Switch"]
        }
    ]
}`;
    }

    parseAIResponse(content) {
        try {
            let cleanContent = content.trim();
            
            console.log('🔧 Raw content for parsing:', cleanContent);

            // Удаляем Markdown code blocks если есть
            if (cleanContent.startsWith('```json')) {
                cleanContent = cleanContent.substring(7);
            }
            if (cleanContent.endsWith('```')) {
                cleanContent = cleanContent.substring(0, cleanContent.length - 3);
            }
            cleanContent = cleanContent.trim();

            // Пытаемся найти JSON в тексте если он не чистый
            let jsonStart = cleanContent.indexOf('{');
            let jsonEnd = cleanContent.lastIndexOf('}');
            
            if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
                cleanContent = cleanContent.substring(jsonStart, jsonEnd + 1);
            }

            console.log('🧹 Cleaned content:', cleanContent);

            const parsed = JSON.parse(cleanContent);
            
            // Базовая валидация структуры
            if (!parsed.analysis) {
                parsed.analysis = {
                    understoodMood: "Настроение из запроса",
                    recommendedStyle: "Различные стили",
                    keyFactors: ["Настроение", "Предпочтения"],
                    reasoning: "AI проанализировал ваш запрос"
                };
            }

            if (!parsed.games || !Array.isArray(parsed.games)) {
                throw new Error('Games array is missing or invalid');
            }

            // Валидация каждой игры
            parsed.games = parsed.games.map(game => ({
                name: game.name || "Неизвестная игра",
                genre: game.genre || "Жанр не указан",
                description: game.description || "Описание отсутствует",
                moodMatch: typeof game.moodMatch === 'number' ? game.moodMatch : 0.8,
                playtime: game.playtime || "Время не указано",
                vibe: game.vibe || "Атмосфера не описана",
                whyPerfect: game.whyPerfect || "Подходит под ваш запрос",
                platforms: Array.isArray(game.platforms) ? game.platforms : ["PC"]
            }));

            return parsed;
            
        } catch (error) {
            console.error('❌ Failed to parse AI response:', error);
            console.log('📄 Problematic content:', content);
            
            // Если парсинг не удался, возвращаем fallback данные
            return this.getFallbackData();
        }
    }

    getFallbackData(query = "общий запрос") {
        console.log('🔄 Using fallback data');
        
        return {
            analysis: {
                understoodMood: "Разнообразные игровые предпочтения",
                recommendedStyle: "Популярные игры разных жанров", 
                keyFactors: ["универсальность", "качество", "доступность"],
                reasoning: "Подобраны популярные игры, подходящие под разные вкусы"
            },
            games: [
                {
                    name: "The Witcher 3: Wild Hunt",
                    genre: "RPG, Приключения",
                    description: "Эпическая RPG с богатым сюжетом и огромным открытым миром. Играйте за Геральта из Ривии, охотника на чудовищ.",
                    moodMatch: 0.92,
                    playtime: "50+ часов",
                    vibe: "Эпическая, атмосферная, с глубоким сюжетом",
                    whyPerfect: "Идеально подходит для любителей глубоких сюжетов и исследований",
                    platforms: ["PC", "PS4", "PS5", "XBOX", "Switch"]
                },
                {
                    name: "Stardew Valley", 
                    genre: "Симулятор, Инди",
                    description: "Уютный фермерский симулятор с элементами RPG. Создайте свою идеальную ферму и найдите свое место в долине.",
                    moodMatch: 0.88,
                    playtime: "Бесконечно", 
                    vibe: "Расслабляющая, уютная, творческая",
                    whyPerfect: "Отлично подходит для расслабления и творчества",
                    platforms: ["PC", "PS4", "PS5", "XBOX", "Switch", "Mobile"]
                },
                {
                    name: "Hades",
                    genre: "Roguelike, Экшен",
                    description: "Быстрый рогалик с потрясающим боевым системами и глубоким сюжетом. Сражайтесь, умирайте и становитесь сильнее.",
                    moodMatch: 0.85,
                    playtime: "20-40 часов",
                    vibe: "Динамичная, стильная, адреналиновая",
                    whyPerfect: "Отличный выбор для любителей экшена и повторяемого геймплея",
                    platforms: ["PC", "PS4", "PS5", "XBOX", "Switch"]
                }
            ]
        };
    }
}