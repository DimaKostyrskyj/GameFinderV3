// Улучшенная система поиска игр с надежным парсингом JSON
class GameSearchAI {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.cache = new Map();
        this.cacheTimeout = 10 * 60 * 1000; // 10 минут
    }

    async searchGames(userQuery) {
        const cacheKey = userQuery.toLowerCase().trim();
        
        // Проверяем кэш
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                console.log('✅ Используем кэшированный ответ');
                return cached.data;
            }
        }

        const response = await fetch('https://api.deepseek.com/v1', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    {
                        role: 'system',
                        content: `Ты AI для поиска игр. ОТВЕЧАЙ ТОЛЬКО В JSON ФОРМАТЕ БЕЗ ЛЮБЫХ ДОПОЛНИТЕЛЬНЫХ ТЕКСТОВ.

Требуемый JSON формат:
{
  "games": [
    {
      "name": "Название игры",
      "genre": "Жанр",
      "description": "Короткое описание до 100 символов",
      "moodMatch": 0.85,
      "playtime": "10-20 часов",
      "vibe": "Атмосфера",
      "whyPerfect": "Почему подходит запросу"
    }
  ],
  "analysis": {
    "understoodMood": "Понятое настроение",
    "recommendedStyle": "Рекомендуемый стиль",
    "keyFactors": ["фактор1", "фактор2", "фактор3"],
    "reasoning": "Краткое объяснение подбора"
  }
}

ПРАВИЛА:
- games: 3-5 игр
- moodMatch: от 0.7 до 0.95
- description: максимум 100 символов
- whyPerfect: максимум 80 символов
- reasoning: максимум 150 символов
- keyFactors: 3-5 факторов

ВЕРНИ ТОЛЬКО JSON БЕЗ КАВЫЧЕК И ДОПОЛНИТЕЛЬНОГО ТЕКСТА.`
                    },
                    {
                        role: 'user', 
                        content: `Запрос пользователя: "${userQuery}". Верни ТОЛЬКО JSON без дополнительного текста.`
                    }
                ],
                temperature: 0.1,
                max_tokens: 1500,
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        
        console.log('📨 Raw AI Response:', content);

        // Очищаем и парсим JSON
        const cleanedJson = this.cleanJsonResponse(content);
        const result = JSON.parse(cleanedJson);
        
        // Валидация результата
        this.validateGameData(result);
        
        // Сохраняем в кэш
        this.cache.set(cacheKey, {
            data: result,
            timestamp: Date.now()
        });
        
        this.cleanupCache();
        
        console.log('✅ Успешно получены игры:', result.games.length);
        return result;
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