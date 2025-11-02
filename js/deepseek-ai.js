class GameSearchAI {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseURL = 'https://api.deepseek.com/v1';
    }

    async searchGames(userRequest) {
        // Проверяем API ключ
        if (!this.apiKey || this.apiKey === 'YOUR_DEEPSEEK_API_KEY_HERE') {
            throw new Error('❌ Добавьте ваш DeepSeek API ключ в файле script.js');
        }

        const prompt = `
Пользователь ищет игры по запросу: "${userRequest}"

ПРОАНАЛИЗИРУЙ запрос и ПОДБЕРИ 10-12 КОНКРЕТНЫХ СУЩЕСТВУЮЩИХ ИГР которые идеально подходят.

Верни ответ ТОЛЬКО в JSON формате:

{
    "analysis": {
        "understoodMood": "краткое описание настроения",
        "keyFactors": ["фактор1", "фактор2", "фактор3", "фактор4"],
        "recommendedStyle": "стиль игр",
        "reasoning": "подробное объяснение подбора"
    },
    "games": [
        {
            "name": "Точное название игры",
            "genre": "Основной жанр",
            "moodMatch": 0.95,
            "description": "Краткое описание игры и геймплея",
            "whyPerfect": "Конкретная причина почему идеально подходит для запроса",
            "playtime": "Примерное время прохождения",
            "vibe": "Атмосфера игры",
            "platforms": ["PC", "PS5", "Xbox", "Switch"]
        }
    ],
    "summary": "Итоговое объяснение подбора"
}

ТРЕБОВАНИЯ:
- ТОЧНО 10-12 игр (не меньше!)
- Только реальные существующие игры
- Разнообразие жанров и стилей
- Высокое качество подбора
- Точные названия и описания`;

        try {
            console.log('🔍 Отправляем запрос к DeepSeek API...');
            
            const response = await fetch(`${this.baseURL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: "deepseek-chat",
                    messages: [
                        {
                            role: "system",
                            content: "Ты - эксперт по играм. Подбирай ТОЧНО 10-12 реальных игр. Всегда возвращай валидный JSON. Не используй вымышленные игры."
                        },
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 4000
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API Error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log('✅ Ответ от DeepSeek получен');

            if (!data.choices || !data.choices[0]) {
                throw new Error('Некорректный формат ответа от AI');
            }

            const content = data.choices[0].message.content;
            console.log('📄 Содержание ответа:', content);

            // Извлекаем JSON из ответа
            let jsonData;
            try {
                jsonData = JSON.parse(content);
            } catch (e) {
                // Пытаемся найти JSON в тексте
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    jsonData = JSON.parse(jsonMatch[0]);
                } else {
                    throw new Error('AI не вернул валидный JSON');
                }
            }

            // Проверяем количество игр
            if (!jsonData.games || jsonData.games.length < 10) {
                throw new Error(`AI вернул только ${jsonData.games?.length || 0} игр. Нужно 10-12.`);
            }

            console.log(`🎮 Успешно получено ${jsonData.games.length} игр`);
            return jsonData;

        } catch (error) {
            console.error('❌ Ошибка DeepSeek AI:', error);
            throw new Error(`Ошибка AI: ${error.message}`);
        }
    }
}