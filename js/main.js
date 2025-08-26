// Подключение к Telegram
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();
tg.setHeaderColor('#0a0a0f');

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

// АЛЬБОМЫ С ТРЕКАМИ
const albums = {
    karmageddon: {
        name: 'Karmageddon',
        artist: 'Kizaru',
        year: '2024',
        coverIcon: '🎭',
        coverClass: 'karmageddon',
        coverUrl: 'https://raw.githubusercontent.com/dealphonics/game-app/main/covers/karmageddon_cover.jpg',
        tracks: [
            { id: 'k1', title: 'Дежавю', artist: 'Kizaru', rarity: 'legendary', audioFile: 'karmageddon/dezhavu.mp3' },
            { id: 'k2', title: 'Top Dog', artist: 'Kizaru', rarity: 'common', audioFile: 'karmageddon/top_dog.mp3' },
            { id: 'k3', title: 'Водопад', artist: 'Kizaru', rarity: 'rare', audioFile: 'karmageddon/vodopad.mp3' },
            { id: 'k4', title: 'Держу район', artist: 'Kizaru', rarity: 'epic', audioFile: 'karmageddon/derzhu_raion.mp3' },
            { id: 'k5', title: 'Все что угодно', artist: 'Kizaru', rarity: 'common', audioFile: 'karmageddon/vse_chto_ugodno.mp3' },
            { id: 'k6', title: 'MONEY LONG', artist: 'Kizaru', rarity: 'legendary', audioFile: 'karmageddon/money_long.mp3' },
            { id: 'k7', title: 'Deep End', artist: 'Kizaru', rarity: 'epic', audioFile: 'karmageddon/deep_end.mp3' },
            { id: 'k8', title: 'Сим салабим', artist: 'Kizaru', rarity: 'common', audioFile: 'karmageddon/sim_salabim.mp3' },
            { id: 'k9', title: 'Smooth operator', artist: 'Kizaru', rarity: 'rare', audioFile: 'karmageddon/smooth_operator.mp3' },
            { id: 'k10', title: 'Психопат-лунатик', artist: 'Kizaru', rarity: 'epic', audioFile: 'karmageddon/psihopat_lunatik.mp3' },
            { id: 'k11', title: 'Я сделал это', artist: 'Kizaru', rarity: 'common', audioFile: 'karmageddon/ya_sdelal_eto.mp3' },
            { id: 'k12', title: 'Ещё одна ночь', artist: 'Kizaru', rarity: 'common', audioFile: 'karmageddon/eshe_odna_noch.mp3' },
            { id: 'k13', title: 'Cinderella', artist: 'Kizaru', rarity: 'rare', audioFile: 'karmageddon/cinderella.mp3' },
            { id: 'k14', title: 'На мне детка', artist: 'Kizaru', rarity: 'common', audioFile: 'karmageddon/na_mne_detka.mp3' },
            { id: 'k15', title: 'Исповедь', artist: 'Kizaru', rarity: 'rare', audioFile: 'karmageddon/ispoved.mp3' }
        ]
    },
    psychi: {
        name: 'Психи попадают в топ',
        artist: 'Макс Корж',
        year: '2023',
        coverIcon: '🧠',
        coverClass: 'psychi',
        coverUrl: 'https://raw.githubusercontent.com/dealphonics/game-app/main/covers/psychi_cover.jpg',
        tracks: [
            { id: 'p1', title: 'Снадобье', artist: 'Макс Корж', rarity: 'epic', audioFile: 'psychi/snadobye.mp3' },
            { id: 'p2', title: 'Афган', artist: 'Макс Корж', rarity: 'legendary', audioFile: 'psychi/afgan.mp3' },
            { id: 'p3', title: 'Сожжены', artist: 'Макс Корж', rarity: 'epic', audioFile: 'psychi/sozhzheny.mp3' },
            { id: 'p4', title: 'Лучший вайб', artist: 'Макс Корж', rarity: 'rare', audioFile: 'psychi/luchshiy_vaib.mp3' },
            { id: 'p5', title: 'Young haze', artist: 'Макс Корж', rarity: 'common', audioFile: 'psychi/young_haze.mp3' },
            { id: 'p6', title: 'Улицы без фонарей', artist: 'Макс Корж', rarity: 'rare', audioFile: 'psychi/ulitsy_bez_fonarey.mp3' },
            { id: 'p7', title: 'Так и знал', artist: 'Макс Корж', rarity: 'rare', audioFile: 'psychi/tak_i_znal.mp3' },
            { id: 'p8', title: 'На дому', artist: 'Макс Корж', rarity: 'rare', audioFile: 'psychi/na_domu.mp3' },
            { id: 'p9', title: 'Animals', artist: 'Макс Корж', rarity: 'common', audioFile: 'psychi/animals.mp3' },
            { id: 'p10', title: 'Заправка', artist: 'Макс Корж', rarity: 'common', audioFile: 'psychi/zapravka.mp3' },
            { id: 'p11', title: 'Балконы', artist: 'Макс Корж', rarity: 'epic', audioFile: 'psychi/balkony.mp3' },
            { id: 'p12', title: 'Карманы', artist: 'Макс Корж', rarity: 'common', audioFile: 'psychi/karmany.mp3' },
            { id: 'p13', title: 'Доверял', artist: 'Макс Корж', rarity: 'rare', audioFile: 'psychi/doveryal.mp3' },
            { id: 'p14', title: 'Воля', artist: 'Макс Корж', rarity: 'epic', audioFile: 'psychi/volya.mp3' },
            { id: 'p15', title: 'Тонкая красная нить', artist: 'Макс Корж', rarity: 'common', audioFile: 'psychi/tonkaya_krasnaya_nit.mp3' },
            { id: 'p16', title: 'Жизнь не Голливуд', artist: 'Макс Корж', rarity: 'epic', audioFile: 'psychi/zhizn_ne_gollivud.mp3' },
            { id: 'p17', title: 'Исключение', artist: 'Макс Корж', rarity: 'common', audioFile: 'psychi/isklyuchenie.mp3' },
            { id: 'p18', title: '17 лет', artist: 'Макс Корж', rarity: 'legendary', audioFile: 'psychi/17_let.mp3' },
            { id: 'p19', title: 'Не говорите другу никогда', artist: 'Макс Корж', rarity: 'common', audioFile: 'psychi/ne_govorite_drugu_nikogda.mp3' }
        ]
    }
};

// Паттерны блоков для игр
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

// ТЕСТОВЫЙ РЕЖИМ - разблокировать несколько треков для демо
function enableTestMode() {
    // Добавляем несколько треков для теста
    const testTracks = ['k1', 'k2', 'k3', 'p1', 'p2'];
    testTracks.forEach(trackId => {
        if (!unlockedTracks.includes(trackId)) {
            unlockedTracks.push(trackId);
        }
    });
    
    // Добавляем очки
    userScore = 1000;
    
    // Сохраняем
    saveProgress();
    updateScore(0);
    updateTracksCount();
    
    console.log('Test mode enabled! Added tracks and points.');
}

// Автоматически включаем тестовый режим при первом запуске
document.addEventListener('DOMContentLoaded', function() {
    loadProgress();
    
    // Если нет разблокированных треков, включаем тестовый режим
    if (unlockedTracks.length === 0) {
        enableTestMode();
        tg.showAlert('Добро пожаловать! Мы добавили несколько треков для ознакомления.');
    }
    
    updateTracksCount();
    updateActiveAlbum();
});

// Получение случайного трека
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
    const tracksCount = document.getElementById('tracksCount');
    const totalTracksEl = document.getElementById('totalTracks');
    
    if (tracksCount) tracksCount.textContent = unlockedTracks.length;
    if (totalTracksEl) totalTracksEl.textContent = totalTracks;
    
    // Обновляем прогресс бар
    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) {
        const progress = (unlockedTracks.length / totalTracks) * 100;
        progressBar.style.width = `${progress}%`;
    }
}

// Обновление активного альбома
function updateActiveAlbum() {
    const activeAlbumEl = document.getElementById('activeAlbum');
    if (activeAlbumEl) {
        activeAlbumEl.textContent = `📀 ${albums[selectedAlbum].name}`;
    }
    
    // Обновляем showcase альбома
    updateAlbumShowcase();
}

// Обновление showcase альбома
function updateAlbumShowcase() {
    const album = albums[selectedAlbum];
    const coverEl = document.getElementById('showcaseAlbumCover');
    const nameEl = document.getElementById('showcaseAlbumName');
    const artistEl = document.getElementById('showcaseAlbumArtist');
    
    if (coverEl) coverEl.src = album.coverUrl;
    if (nameEl) nameEl.textContent = album.name;
    if (artistEl) artistEl.textContent = album.artist;
}

// Открытие игрового модального окна
function openGameModal(gameType) {
    currentGameType = gameType;
    
    // Создаем модальное окно если его нет
    let modal = document.getElementById('gameModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'gameModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title" id="gameTitle">Игра</h2>
                    <button class="close" onclick="closeGameModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="game-score" id="currentGameScore">Очки: 0</div>
                    <div class="game-stats">
                        <span>Уровень: <span id="gameLevel">1</span></span>
                        <span>Время: <span id="gameTime">0:00</span></span>
                        <span>До трека: <span id="timeToTrack">60s</span></span>
                    </div>
                    <div style="position: relative;">
                        <canvas id="gameCanvas" width="320" height="240"></canvas>
                        <div id="countdownDiv"></div>
                        <div id="levelTransitionDiv"></div>
                    </div>
                    <div class="game-instructions" id="gameInstructions">
                        Нажмите по экрану для управления
                    </div>
                    <div id="gameOverDiv" style="display: none;">
                        <button class="restart-btn" onclick="restartCurrentGame()">🔄 Начать заново</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    modal.style.display = 'block';
    document.getElementById('gameOverDiv').style.display = 'none';
    
    const title = document.getElementById('gameTitle');
    if (gameType === 'risk') {
        title.textContent = '⚔️ Risk of Rain';
        // Проверяем, загружен ли скрипт игры
        if (typeof startRiskGame === 'function') {
            startRiskGame();
        } else {
            console.error('Risk game script not loaded');
        }
    } else if (gameType === 'doodle') {
        title.textContent = '🎯 Doodle Jump';
        if (typeof startDoodleGame === 'function') {
            startDoodleGame();
        } else {
            console.error('Doodle game script not loaded');
        }
    }
}

// Перезапуск текущей игры
function restartCurrentGame() {
    if (currentGameType === 'risk' && typeof startRiskGame === 'function') {
        startRiskGame();
    } else if (currentGameType === 'doodle' && typeof startDoodleGame === 'function') {
        startDoodleGame();
    }
}

// Закрытие игрового модального окна
function closeGameModal() {
    gameRunning = false;
    gamePaused = false;
    currentGameType = null;
    
    const modal = document.getElementById('gameModal');
    if (modal) modal.style.display = 'none';
    
    const canvas = document.getElementById('gameCanvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    const countdownDiv = document.getElementById('countdownDiv');
    if (countdownDiv) countdownDiv.innerHTML = '';
    
    const levelTransitionDiv = document.getElementById('levelTransitionDiv');
    if (levelTransitionDiv) levelTransitionDiv.innerHTML = '';
    
    // Скрываем кнопку полного экрана если есть
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
    // Создаем модальное окно если его нет
    let modal = document.getElementById('musicModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'musicModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title" id="musicModalTitle">📀 Karmageddon</h2>
                    <button class="close" onclick="closeMusicModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="album-selector">
                        <button class="album-btn active" id="albumBtn1" onclick="selectAlbum('karmageddon')">
                            Karmageddon
                        </button>
                        <button class="album-btn" id="albumBtn2" onclick="selectAlbum('psychi')">
                            Психи попадают в топ
                        </button>
                    </div>
                    
                    <div class="album-cover karmageddon" id="albumCover" 
                         style="background-image: url('https://raw.githubusercontent.com/dealphonics/game-app/main/covers/karmageddon_cover.jpg');">
                    </div>
                    
                    <div class="album-info" id="albumInfo">
                        15 треков • Альбом 2024
                    </div>
                    
                    <div class="tracks-container" id="tracksList"></div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    modal.style.display = 'block';
    selectAlbum(selectedAlbum);
}

// Закрытие музыкального модального окна
function closeMusicModal() {
    const modal = document.getElementById('musicModal');
    if (modal) modal.style.display = 'none';
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

// Обработка кликов для навигации
document.addEventListener('DOMContentLoaded', function() {
    // Загружаем прогресс
    loadProgress();
    updateTracksCount();
    updateActiveAlbum();
    
    // Обработка навигации
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            navItems.forEach(n => n.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Центральная кнопка Play
    const playBtn = document.querySelector('.nav-play-btn');
    if (playBtn) {
        playBtn.addEventListener('click', function() {
            // Открываем первую доступную игру
            openGameModal('risk');
        });
    }
    
    // Кнопки Play All и Shuffle
    const playAllBtn = document.querySelector('.btn-play-album');
    if (playAllBtn) {
        playAllBtn.addEventListener('click', function() {
            tg.showAlert('Функция воспроизведения в разработке');
        });
    }
    
    const shuffleBtn = document.querySelector('.btn-shuffle');
    if (shuffleBtn) {
        shuffleBtn.addEventListener('click', function() {
            tg.showAlert('Функция перемешивания в разработке');
        });
    }
    
    const favoriteBtn = document.querySelector('.btn-favorite');
    if (favoriteBtn) {
        favoriteBtn.addEventListener('click', function() {
            this.style.color = this.style.color === 'red' ? '' : 'red';
            tg.HapticFeedback.impactOccurred('light');
        });
    }
    
    // Daily rewards
    const claimBtn = document.querySelector('.claim-btn');
    if (claimBtn) {
        claimBtn.addEventListener('click', function() {
            const rewardItem = this.closest('.reward-item');
            if (rewardItem) {
                rewardItem.classList.remove('active');
                rewardItem.classList.add('completed');
                updateScore(100);
                this.style.display = 'none';
                tg.HapticFeedback.impactOccurred('medium');
                tg.showAlert('Награда получена! +100 очков');
            }
        });
    }
    
    // Coming soon notify
    const notifyBtn = document.querySelector('.game-notify-btn');
    if (notifyBtn) {
        notifyBtn.addEventListener('click', function() {
            tg.showAlert('Вы будете уведомлены о выходе игры!');
            this.innerHTML = '<span>✓ Уведомление включено</span>';
            this.style.background = 'var(--gradient-success)';
        });
    }
    
    // View All button
    const viewAllBtn = document.querySelector('.section-action');
    if (viewAllBtn) {
        viewAllBtn.addEventListener('click', function() {
            openMusicModal();
        });
    }
});

// Закрытие модальных окон по клику вне их
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        if (event.target.id === 'gameModal') {
            closeGameModal();
        } else if (event.target.id === 'musicModal') {
            closeMusicModal();
        }
    }
};
