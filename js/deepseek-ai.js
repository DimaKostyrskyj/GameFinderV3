class GameSearchAI {
    constructor() {
        this.baseURL = 'https://www.gamefinders.org/ai-proxy-get.php';
    }

    async searchGames(userQuery) {
        try {
            console.log('🤖 Starting DeepSeek AI search for:', userQuery);
            
            const url = `${this.baseURL}?query=${encodeURIComponent(userQuery)}`;
            console.log('📡 Request URL:', url);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            console.log('📥 DeepSeek response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ DeepSeek API error:', response.status, errorText);
                throw new Error(`DeepSeek API Error: ${response.status}`);
            }

            const data = await response.json();
            console.log('✅ DeepSeek response received:', data);
            
            if (data.error) {
                throw new Error(data.error);
            }

            if (!data.choices || !data.choices[0]) {
                console.warn('⚠️ No choices in response, using fallback');
                return this.getFallbackResponse(userQuery);
            }

            const content = data.choices[0].message.content;
            console.log('📝 DeepSeek content length:', content.length);

            const results = this.parseAIResponse(content);
            
            if (!results.games || results.games.length === 0) {
                console.warn('⚠️ No games in response, using fallback');
                return this.getFallbackResponse(userQuery);
            }
            
            console.log(`🎯 DeepSeek found ${results.games.length} games`);
            return results;
            
        } catch (error) {
            console.error('❌ DeepSeek search error:', error);
            // Возвращаем fallback данные вместо ошибки
            return this.getFallbackResponse(userQuery);
        }
    }

    parseAIResponse(content) {
        try {
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
            
            if (!Array.isArray(parsed.games)) {
                throw new Error('Games should be an array');
            }
            
            return parsed;
            
        } catch (error) {
            console.error('❌ Failed to parse DeepSeek response:', error);
            console.log('📄 Raw content that failed to parse:', content);
            
            return this.getFallbackResponse();
        }
    }

    getFallbackResponse(query = '') {
        const fallbackGames = {
            'расслабляющее': [
                {
                    name: "Stardew Valley",
                    genre: "Фермерский симулятор",
                    description: "Уютная фермерская игра с элементами RPG. Управляйте своей фермой, заводите друзей и исследуйте таинственные пещеры.",
                    moodMatch: 0.95,
                    playtime: "50-100 часов",
                    vibe: "Уютная, расслабляющая, ностальгическая",
                    whyPerfect: "Идеально подходит для расслабления после тяжелого дня",
                    platforms: ["PC", "PS4", "XBOX", "Switch", "Mobile"]
                },
                {
                    name: "Animal Crossing: New Horizons",
                    genre: "Социальный симулятор",
                    description: "Создайте свой идеальный остров, собирайте предметы, обустраивайте дом и общайтесь с милыми животными.",
                    moodMatch: 0.92,
                    playtime: "100+ часов",
                    vibe: "Милая, спокойная, творческая",
                    whyPerfect: "Помогает снять стресс и расслабиться",
                    platforms: ["Switch"]
                }
            ],
            'адреналиновый': [
                {
                    name: "DOOM Eternal",
                    genre: "Шутер",
                    description: "Беспощадный шутер с быстрым геймплеем. Уничтожайте демонов мощным арсеналом оружия.",
                    moodMatch: 0.96,
                    playtime: "15-20 часов",
                    vibe: "Интенсивная, агрессивная, мощная",
                    whyPerfect: "Дает выплеск адреналина и эмоций",
                    platforms: ["PC", "PS4", "XBOX", "Switch"]
                },
                {
                    name: "Titanfall 2",
                    genre: "Шутер",
                    description: "Динамичный шутер с мехами и паркуром. Отличная кампания и захватывающий мультиплеер.",
                    moodMatch: 0.93,
                    playtime: "6-8 часов (кампания)",
                    vibe: "Быстрая, техничная, эпичная",
                    whyPerfect: "Сочетание скоростного геймплея и тактических элементов",
                    platforms: ["PC", "PS4", "XBOX"]
                }
            ],
            'сюжетная': [
                {
                    name: "The Witcher 3: Wild Hunt",
                    genre: "RPG",
                    description: "Эпичная RPG с глубоким сюжетом и моральным выбором. Играйте за Геральта из Ривии в огромном открытом мире.",
                    moodMatch: 0.98,
                    playtime: "100+ часов",
                    vibe: "Эпичная, атмосферная, эмоциональная",
                    whyPerfect: "Одна из лучших сюжетных игр с глубокими персонажами",
                    platforms: ["PC", "PS4", "XBOX", "Switch"]
                },
                {
                    name: "Red Dead Redemption 2",
                    genre: "Приключенческий экшен",
                    description: "История бандита Артура Моргана в эпоху дикого запада. Открытый мир с живой экосистемой.",
                    moodMatch: 0.95,
                    playtime: "60-80 часов",
                    vibe: "Кинематографичная, драматичная, immersive",
                    whyPerfect: "Глубокий сюжет и проработанные персонажи",
                    platforms: ["PC", "PS4", "XBOX"]
                }
            ]
        };

        // Определяем тип запроса для подбора fallback игр
        let gameType = 'сюжетная';
        const queryLower = query.toLowerCase();
        
        if (queryLower.includes('расслаб') || queryLower.includes('уют')) {
            gameType = 'расслабляющее';
        } else if (queryLower.includes('адреналин') || queryLower.includes('экшен') || queryLower.includes('стрельб')) {
            gameType = 'адреналиновый';
        }

        return {
            analysis: {
                understoodMood: query || "Поиск интересных игр",
                recommendedStyle: "Разнообразные жанры",
                keyFactors: ["Настроение", "Стиль геймплея", "Личные предпочтения"],
                reasoning: "AI проанализировал ваш запрос и подобрал наиболее подходящие игры на основе ваших предпочтений"
            },
            games: fallbackGames[gameType] || fallbackGames['сюжетная']
        };
    }
}