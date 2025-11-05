class GameSearchAI {
    constructor() {
        this.baseURL = 'https://www.gamefinders.org/ai-proxy-get.php';
    }

    async searchGames(userQuery) {
        try {
            console.log('🤖 Starting DeepSeek AI search for:', userQuery);
            
            const response = await fetch(`${this.baseURL}?query=${encodeURIComponent(userQuery)}`);
            
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
            
            // Fallback - создаем базовую структуру
            return {
                analysis: {
                    understoodMood: "Настроение из запроса",
                    recommendedStyle: "Рекомендуемый стиль игр",
                    keyFactors: ["фактор1", "фактор2"],
                    reasoning: "AI проанализировал ваш запрос и подобрал подходящие игры"
                },
                games: [
                    {
                        name: "Пример игры",
                        genre: "Жанр",
                        description: "Описание игры будет здесь",
                        moodMatch: 0.85,
                        playtime: "20-30 часов",
                        vibe: "Атмосфера игры",
                        whyPerfect: "Идеально подходит под ваш запрос",
                        platforms: ["PC"]
                    }
                ]
            };
        }
    }
}