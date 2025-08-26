// Подключение к Telegram
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();
tg.setHeaderColor('#0f0f23');

// Глобальные переменные
let userScore = 0;
let unlockedTracks = [];
let currentGameType = null;
let gameRunning = false;
let gamePaused = false;
let selectedAlbum = 'karmageddon';

// Вероятности выпадения по редкости
const rarityChances = {
    'common': 65,
    'rare': 20,
    'epic': 10,
    'legendary': 5
};

// Цвета редкости
const rarityColors = {
    'common': '#4CAF50',
    'rare': '#2196F3',
    'epic': '#9C27B0',
    'legendary': '#FF9800'
};

// Названия редкости
const rarityNames = {
    'common': 'Обычный',
    'rare': 'Редкий',
    'epic': 'Эпический',
    'legendary': 'Легендарный'
};

// 20 РАЗНЫХ ПАТТЕРНОВ БЛОКОВ (сокращенная версия)
const blockPatterns = [
    () => { return { rows: 4, cols: 7, pattern: 'full' }; },
    () => { 
        const blocks = [];
        for (let row = 0; row < 5; row++) {
            const blocksInRow = 7 - row * 2;
            const startCol = row;
            for (let col = 0; col < blocksInRow; col++) {
                blocks.push({ row: row, col: startCol + col });
            }
        }
        return { custom: blocks };
    },
    () => {
        const blocks = [];
        const pattern = [
            [1,0,0,1,0,0,1],
            [1,0,1,1,1,0,1],
            [1,1,0,1,0,1,1],
            [1,0,0,1,0,0,1]
        ];
        for (let row = 0; row < pattern.length; row++) {
            for (let col = 0; col < pattern[row].length; col++) {
                if (pattern[row][col]) {
                    blocks.push({ row: row, col: col });
                }
            }
        }
        return { custom: blocks };
    },
    () => {
        const blocks = [];
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 7; col++) {
                if ((row + col) % 2 === 0) {
                    blocks.push({ row: row, col: col });
                }
            }
        }
        return { custom: blocks };
    }
];

// АВТОСОХРАНЕНИЕ
function saveProgress() {
    const progressData = {
        userScore: userScore,
        unlockedTracks: unlockedTracks,
        selectedAlbum: selectedAlbum,
        timestamp: Date.now()
    };
    localStorage.setItem('soundkeeper_progress', JSON.stringify(progressData));
}

function loadProgress() {
    const saved = localStorage.getItem('soundkeeper_progress');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            userScore = data.userScore || 0;
            unlockedTracks = data.unlockedTracks || [];
            selectedAlbum = data.selectedAlbum || 'karmageddon';
            
            document.getElementById('scoreDisplay').textContent = userScore;
            updateTracksCount();
            updateActiveAlbum();
            
            console.log('Прогресс загружен:', data);
        } catch (e) {
            console.error('Ошибка загрузки прогресса:', e);
        }
    }
}

// Получение случайного трека из выбранного альбома
function getRandomTrack() {
    const currentAlbum = albums[selectedAlbum];
    const random = Math.random() * 100;
    let rarity;
    
    if (random <= rarityChances.legendary) {
        rarity = 'legendary';
    } else if (random <= rarityChances.legendary + rarityChances.epic) {
        rarity = 'epic';
    } else if (random <= rarityChances.legendary + rarityChances.epic + rarityChances.rare) {
        rarity = 'rare';
    } else {
        rarity = 'common';
    }
    
    const tracksOfRarity = currentAlbum.tracks.filter(track => track.rarity === rarity);
    return tracksOfRarity[Math.floor(Math.random() * tracksOfRarity.length)];
}

// Обновление счета
function updateScore(points) {
    userScore += points;
    document.getElementById('scoreDisplay').textContent = userScore;
    updateTracksCount();
    saveProgress();
}

// Обновление счетчика треков
function updateTracksCount() {
    const totalTracks = albums.karmageddon.tracks.length + albums.psychi.tracks.length;
    document.getElementById('tracksCount').textContent = unlockedTracks.length;
    document.getElementById('totalTracks').textContent = totalTracks;
}

// Обновление активного альбома
function updateActiveAlbum() {
    document.getElementById('activeAlbum').textContent = `📀 ${albums[selectedAlbum].name}`;
}

// Обновите функцию openGameModal
function openGameModal(gameType) {
    currentGameType = gameType;
    const modal = document.getElementById('gameModal');
    const title = document.getElementById('gameTitle');
    
    modal.style.display = 'block';
    document.getElementById('gameOverDiv').style.display = 'none';
    
    if (gameType === 'risk') {
        title.textContent = '⚔️ Risk of Rain';
        startRiskGame();
    } else if (gameType === 'doodle') {
        title.textContent = '🎯 Doodle Jump';
        startDoodleGame();
    }
}

// Обновите функцию restartCurrentGame
function restartCurrentGame() {
    if (currentGameType === 'risk') {
        startRiskGame();
    } else if (currentGameType === 'doodle') {
        startDoodleGame();
    }
}
// Закрытие игрового модального окна
function closeGameModal() {
    gameRunning = false;
    gamePaused = false;
    currentGameType = null;
    document.getElementById('gameModal').style.display = 'none';
    
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    document.getElementById('countdownDiv').innerHTML = '';
    document.getElementById('levelTransitionDiv').innerHTML = '';
    
    // Скрываем кнопку полного экрана при закрытии игры
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    if (fullscreenBtn) {
        fullscreenBtn.style.display = 'none';
    }
    
    // Выходим из полноэкранного режима
    if (document.fullscreenElement) {
        document.exitFullscreen();
    }
}

// Открытие музыкального модального окна
function openMusicModal() {
    const modal = document.getElementById('musicModal');
    modal.style.display = 'block';
    selectAlbum(selectedAlbum);
}

// Закрытие музыкального модального окна
function closeMusicModal() {
    document.getElementById('musicModal').style.display = 'none';
}

// Показать всплывающее окно трека
function showTrackPopup(track, isNew) {
    gamePaused = true;
    
    const popup = document.createElement('div');
    popup.className = 'track-popup';
    const rarityClass = `rarity-${track.rarity}`;
    
    popup.innerHTML = `
        <h3>${isNew ? '🎉 Поздравляю!' : '📀 Трек уже есть'}</h3>
        <div style="font-size: 40px; margin: 15px 0; color: ${rarityColors[track.rarity]};">💿</div>
        <div class="track-name" style="color: ${rarityColors[track.rarity]};">${track.title}</div>
        <div class="track-artist">${track.artist}</div>
        <div class="rarity-badge ${rarityClass}" style="margin: 10px 0;">${rarityNames[track.rarity]}</div>
        <p style="color: #aaa; margin: 10px 0; font-size: 12px;">
            ${isNew ? 'Ты выбил новый трек!' : 'Этот трек у тебя уже есть.'}
        </p>
        <button class="restart-btn" onclick="closeTrackPopup(this)" style="margin-top: 15px;">
            Продолжить игру
        </button>
    `;
    
    document.body.appendChild(popup);
    
    if (isNew) {
        tg.HapticFeedback.impactOccurred('heavy');
        saveProgress();
    } else {
        tg.HapticFeedback.impactOccurred('light');
    }
}

// Закрыть всплывающее окно трека
function closeTrackPopup(button) {
    button.parentElement.remove();
    gamePaused = false;
}

// Закрытие модальных окон по клику вне их
window.onclick = function(event) {
    const gameModal = document.getElementById('gameModal');
    const musicModal = document.getElementById('musicModal');
    
    if (event.target === gameModal) {
        closeGameModal();
    }
    if (event.target === musicModal) {
        closeMusicModal();
    }
}

// Инициализация при загрузке страницы
window.onload = function() {
    loadProgress();
    updateTracksCount();
    updateActiveAlbum();
};
