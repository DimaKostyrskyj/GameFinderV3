class GameDetailsPage {
    constructor() {
        this.currentGame = null;
        this.init();
    }

    init() {
        this.loadGameData();
        this.createParticles();
    }

    loadGameData() {
        const gameData = sessionStorage.getItem('currentGame');
        
        if (!gameData) {
            window.location.href = 'index.html';
            return;
        }

        this.currentGame = JSON.parse(gameData);
        console.log('🎮 Загружена игра:', this.currentGame);
        
        this.displayGameInfo();
        this.loadSteamData();
    }

    displayGameInfo() {
        // Основная информация из AI
        document.getElementById('detailGameTitle').textContent = this.currentGame.name;
        document.getElementById('detailMatchScore').textContent = Math.round(this.currentGame.moodMatch * 100) + '%';
        document.getElementById('detailGenre').textContent = this.currentGame.genre;
        document.getElementById('detailPlatforms').textContent = this.currentGame.platforms?.join(', ') || 'PC';
        document.getElementById('detailPlaytime').textContent = this.currentGame.playtime;
        document.getElementById('detailVibe').textContent = this.currentGame.vibe;
        document.getElementById('detailDescription').textContent = this.currentGame.description;
        document.getElementById('detailReason').textContent = this.currentGame.whyPerfect;
    }

    async loadSteamData() {
        try {
            // Ищем Steam App ID для получения изображения
            await this.findSteamAppId();
            
            if (this.steamAppId) {
                await this.loadSteamGameDetails();
            }
            
        } catch (error) {
            console.error('Ошибка загрузки Steam данных:', error);
        }
    }

    async findSteamAppId() {
        try {
            const response = await fetch('https://api.steampowered.com/ISteamApps/GetAppList/v2/');
            
            if (!response.ok) throw new Error('Steam API недоступен');
            
            const data = await response.json();
            const apps = data.applist.apps;
            
            const foundApp = apps.find(app => 
                app.name.toLowerCase() === this.currentGame.name.toLowerCase() ||
                app.name.toLowerCase().includes(this.currentGame.name.toLowerCase()) ||
                this.currentGame.name.toLowerCase().includes(app.name.toLowerCase())
            );
            
            this.steamAppId = foundApp ? foundApp.appid : null;
            
        } catch (error) {
            console.error('Ошибка поиска Steam App ID:', error);
        }
    }

    async loadSteamGameDetails() {
        try {
            const response = await fetch(`https://store.steampowered.com/api/appdetails?appids=${this.steamAppId}&l=russian`);
            
            if (!response.ok) throw new Error('Steam Store API недоступен');
            
            const data = await response.json();
            const gameData = data[this.steamAppId];
            
            if (gameData && gameData.success) {
                this.enrichWithSteamData(gameData.data);
            }
            
        } catch (error) {
            console.error('Ошибка загрузки деталей игры:', error);
        }
    }

    enrichWithSteamData(steamData) {
        // Обновляем данные из Steam
        if (steamData.name) {
            document.getElementById('detailGameTitle').textContent = steamData.name;
        }
        
        if (steamData.genres) {
            const genres = steamData.genres.map(genre => genre.description);
            document.getElementById('detailGenre').textContent = genres.join(', ');
        }
        
        if (steamData.short_description) {
            document.getElementById('detailDescription').textContent = steamData.short_description;
        }
        
        if (steamData.header_image) {
            this.loadGameImage(steamData.header_image);
        }
        
        // Системные требования
        if (steamData.pc_requirements) {
            this.displaySteamRequirements(steamData.pc_requirements);
        }
    }

    loadGameImage(imageUrl) {
        const imageElement = document.getElementById('detailGameImage');
        const placeholder = document.getElementById('imagePlaceholder');
        
        imageElement.onload = () => {
            imageElement.style.display = 'block';
            placeholder.style.display = 'none';
        };
        
        imageElement.src = imageUrl;
    }

    displaySteamRequirements(requirements) {
        const minReq = this.parseRequirements(requirements.minimum);
        const recReq = this.parseRequirements(requirements.recommended);
        
        if (minReq) {
            document.getElementById('minOS').textContent = minReq.os || 'Информация отсутствует';
            document.getElementById('minCPU').textContent = minReq.cpu || 'Информация отсутствует';
            document.getElementById('minRAM').textContent = minReq.ram || 'Информация отсутствует';
            document.getElementById('minGPU').textContent = minReq.gpu || 'Информация отсутствует';
            document.getElementById('minStorage').textContent = minReq.storage || 'Информация отсутствует';
        }
        
        if (recReq) {
            document.getElementById('recOS').textContent = recReq.os || 'Информация отсутствует';
            document.getElementById('recCPU').textContent = recReq.cpu || 'Информация отсутствует';
            document.getElementById('recRAM').textContent = recReq.ram || 'Информация отсутствует';
            document.getElementById('recGPU').textContent = recReq.gpu || 'Информация отсутствует';
            document.getElementById('recStorage').textContent = recReq.storage || 'Информация отсутствует';
        }
    }

    parseRequirements(htmlText) {
        if (!htmlText) return null;
        
        const requirements = {};
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlText;
        const text = tempDiv.textContent || tempDiv.innerText || '';
        
        const osMatch = text.match(/OS:\s*([^\n\r<]+)/i);
        const processorMatch = text.match(/Processor:\s*([^\n\r<]+)/i);
        const memoryMatch = text.match(/Memory:\s*([^\n\r<]+)/i);
        const graphicsMatch = text.match(/Graphics:\s*([^\n\r<]+)/i);
        const storageMatch = text.match(/Storage:\s*([^\n\r<]+)/i);
        
        if (osMatch) requirements.os = osMatch[1].trim();
        if (processorMatch) requirements.cpu = processorMatch[1].trim();
        if (memoryMatch) requirements.ram = memoryMatch[1].trim();
        if (graphicsMatch) requirements.gpu = graphicsMatch[1].trim();
        if (storageMatch) requirements.storage = storageMatch[1].trim();
        
        return Object.keys(requirements).length > 0 ? requirements : null;
    }

    createParticles() {
        const container = document.getElementById('particles');
        if (!container) return;

        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.cssText = `
                position: absolute;
                width: ${Math.random() * 4 + 2}px;
                height: ${Math.random() * 4 + 2}px;
                background: rgba(255, 255, 255, ${Math.random() * 0.2});
                border-radius: 50%;
                top: ${Math.random() * 100}vh;
                left: ${Math.random() * 100}vw;
                animation: floatParticle ${Math.random() * 15 + 10}s linear infinite;
                animation-delay: ${Math.random() * 5}s;
            `;
            container.appendChild(particle);
        }
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    window.gameDetailsPage = new GameDetailsPage();
});