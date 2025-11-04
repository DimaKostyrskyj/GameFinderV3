// Улучшенная система поиска игр с прокси
class GameSearchAI {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.cache = new Map();
        this.cacheTimeout = 10 * 60 * 1000; // 10 минут
    }

    async searchGames(userQuery) {
    try {
        console.log('🤖 Starting AI search for:', userQuery);
        
        // Кодируем запрос для URL
        const encodedQuery = encodeURIComponent(userQuery);
        
        const response = await fetch(`/ai-proxy-get.php?query=${encodedQuery}`);

        console.log('📥 Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ AI Response received');
        
        if (!data.choices || !data.choices[0]) {
            throw new Error('Invalid response from AI');
        }

        const content = data.choices[0].message.content;
        return this.parseAIResponse(content);
        
    } catch (error) {
        console.error('❌ AI search error:', error);
        throw new Error(`AI service error: ${error.message}`);
    }
}

    // 🧹 Очистка JSON ответа
    cleanJsonResponse(content) {
        let jsonString = content.trim();
        
        console.log('🔧 Cleaning JSON response...');
        
        // Убираем markdown код блока
        if (jsonString.includes('```json')) {
            jsonString = jsonString.split('```json')[1].split('```')[0].trim();
        } else if (jsonString.includes('```')) {
            jsonString = jsonString.split('```')[1].split('```')[0].trim();
        }
        
        // Убираем возможные префиксы
        jsonString = jsonString.replace(/^JSON:\s*/i, '');
        jsonString = jsonString.replace(/^```\s*/i, '');
        jsonString = jsonString.replace(/```$/i, '');
        
        // Исправляем распространенные ошибки JSON
        jsonString = jsonString
            .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?\s*:/g, '"$2":') // Ключи в кавычках
            .replace(/,(\s*[}\]])/g, '$1') // Висящие запятые
            .replace(/,\s*}/g, '}') // Висящие запятые в объектах
            .replace(/,\s*]/g, ']') // Висящие запятые в массивах
            .replace(/:\s*'([^']*)'/g, ':"$1"') // Одинарные кавычки в значениях
            .replace(/\n/g, ' ') // Убираем переносы строк
            .replace(/\s+/g, ' '); // Множественные пробелы
        
        console.log('🔧 Cleaned JSON:', jsonString);
        return jsonString;
    }

    // ✅ Валидация данных игр
    validateGameData(data) {
        if (!data.games || !Array.isArray(data.games)) {
            throw new Error('Invalid games array');
        }
        
        if (!data.analysis || typeof data.analysis !== 'object') {
            throw new Error('Invalid analysis object');
        }
        
        // Проверяем каждую игру
        data.games.forEach((game, index) => {
            if (!game.name || !game.genre || !game.description) {
                throw new Error(`Game ${index} missing required fields`);
            }
            
            // Нормализуем данные
            game.moodMatch = Math.max(0.7, Math.min(0.95, game.moodMatch || 0.8));
            game.description = game.description.substring(0, 100);
            game.whyPerfect = (game.whyPerfect || '').substring(0, 80);
        });
        
        // Нормализуем анализ
        if (!Array.isArray(data.analysis.keyFactors)) {
            data.analysis.keyFactors = ['игровой процесс', 'атмосфера', 'настроение'];
        }
        
        data.analysis.reasoning = (data.analysis.reasoning || '').substring(0, 150);
    }

    // 🗑️ Очистка кэша
    cleanupCache() {
        const now = Date.now();
        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > this.cacheTimeout) {
                this.cache.delete(key);
            }
        }
    }
}