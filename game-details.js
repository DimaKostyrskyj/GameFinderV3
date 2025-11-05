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
        this.loadGameImage();
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
        
        // Устанавливаем требования по умолчанию
        this.setDefaultRequirements();
    }

    async loadGameImage() {
        try {
            // Ищем изображение игры через Steam API
            const appId = await this.findSteamAppId();
            if (appId) {
                await this.loadSteamGameDetails(appId);
            } else {
                this.showPlaceholderImage();
            }
        } catch (error) {
            console.error('Ошибка загрузки изображения:', error);
            this.showPlaceholderImage();
        }
    }

    async findSteamAppId() {
        try {
            const response = await fetch('https://api.steampowered.com/ISteamApps/GetAppList/v2/');
            
            if (!response.ok) throw new Error('Steam API недоступен');
            
            const data = await response.json();
            const apps = data.applist.apps;
            
            // Ищем точное совпадение или частичное
            const foundApp = apps.find(app => 
                app.name.toLowerCase() === this.currentGame.name.toLowerCase() ||
                app.name.toLowerCase().includes(this.currentGame.name.toLowerCase()) ||
                this.currentGame.name.toLowerCase().includes(app.name.toLowerCase())
            );
            
            return foundApp ? foundApp.appid : null;
            
        } catch (error) {
            console.error('Ошибка поиска Steam App ID:', error);
            return null;
        }
    }

    async loadSteamGameDetails(appId) {
        try {
            const response = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appId}&l=russian`);
            
            if (!response.ok) throw new Error('Steam Store API недоступен');
            
            const data = await response.json();
            const gameData = data[appId];
            
            if (gameData && gameData.success) {
                this.enrichWithSteamData(gameData.data);
            } else {
                this.showPlaceholderImage();
            }
            
        } catch (error) {
            console.error('Ошибка загрузки деталей игры:', error);
            this.showPlaceholderImage();
        }
    }

    enrichWithSteamData(steamData) {
        // Обновляем изображение
        if (steamData.header_image) {
            this.loadGameImage(steamData.header_image);
        }
        
        // Обновляем описание если есть
        if (steamData.short_description) {
            document.getElementById('detailDescription').textContent = steamData.short_description;
        }
        
        // Обновляем жанр если есть
        if (steamData.genres) {
            const genres = steamData.genres.map(genre => genre.description);
            document.getElementById('detailGenre').textContent = genres.join(', ');
        }
        
        // Загружаем системные требования
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
        
        imageElement.onerror = () => {
            this.showPlaceholderImage();
        };
        
        imageElement.src = imageUrl;
    }

    showPlaceholderImage() {
        const imageElement = document.getElementById('detailGameImage');
        const placeholder = document.getElementById('imagePlaceholder');
        
        imageElement.style.display = 'none';
        placeholder.style.display = 'flex';
    }

    setDefaultRequirements() {
        // Устанавливаем базовые требования
        const defaultRequirements = {
            minOS: 'Windows 10',
            minCPU: 'Intel Core i5 или аналогичный',
            minRAM: '8 GB RAM',
            minGPU: 'GTX 960 или аналогичная',
            minStorage: '50 GB',
            recOS: 'Windows 11',
            recCPU: 'Intel Core i7 или аналогичный',
            recRAM: '16 GB RAM',
            recGPU: 'RTX 2060 или аналогичная',
            recStorage: '50 GB'
        };

        Object.keys(defaultRequirements).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                element.textContent = defaultRequirements[key];
            }
        });
    }

    displaySteamRequirements(requirements) {
        const minReq = this.parseRequirements(requirements.minimum);
        const recReq = this.parseRequirements(requirements.recommended);
        
        if (minReq) {
            if (minReq.os) document.getElementById('minOS').textContent = minReq.os;
            if (minReq.cpu) document.getElementById('minCPU').textContent = minReq.cpu;
            if (minReq.ram) document.getElementById('minRAM').textContent = minReq.ram;
            if (minReq.gpu) document.getElementById('minGPU').textContent = minReq.gpu;
            if (minReq.storage) document.getElementById('minStorage').textContent = minReq.storage;
        }
        
        if (recReq) {
            if (recReq.os) document.getElementById('recOS').textContent = recReq.os;
            if (recReq.cpu) document.getElementById('recCPU').textContent = recReq.cpu;
            if (recReq.ram) document.getElementById('recRAM').textContent = recReq.ram;
            if (recReq.gpu) document.getElementById('recGPU').textContent = recReq.gpu;
            if (recReq.storage) document.getElementById('recStorage').textContent = recReq.storage;
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