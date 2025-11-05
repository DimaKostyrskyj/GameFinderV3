class GameSearchAI {
    constructor() {
        this.baseURL = 'https://www.gamefinders.org/ai-proxy-get.php';
    }

    async searchGames(userQuery) {
        try {
            console.log('🤖 Starting DeepSeek AI search for:', userQuery);
            
            if (!userQuery || userQuery.trim() === '') {
                throw new Error('Поисковый запрос не может быть пустым');
            }

            const url = `${this.baseURL}?query=${encodeURIComponent(userQuery)}`;
            console.log('📡 Request URL:', url);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                }
            });
            
            console.log('📥 DeepSeek response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ DeepSeek API error:', response.status, errorText);
                
                let errorMessage = 'Ошибка сервера';
                if (response.status === 400) errorMessage = 'Неверный запрос';
                if (response.status === 500) errorMessage = 'Ошибка на сервере DeepSeek';
                if (response.status === 429) errorMessage = 'Слишком много запросов';
                
                throw new Error(`DeepSeek API: ${errorMessage} (код: ${response.status})`);
            }

            const data = await response.json();
            console.log('✅ DeepSeek raw response:', data);

            // Проверяем на ошибку от прокси
            if (data.error) {
                throw new Error(data.error);
            }

            // Проверяем структуру ответа
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
            console.error('❌ DeepSeek search error:', error);
            throw new Error(`Ошибка поиска: ${error.message}`);
        }
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
            throw new Error('Не удалось обработать ответ от AI. Попробуйте другой запрос.');
        }
    }
}