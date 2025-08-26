// АЛЬБОМЫ С ТРЕКАМИ
const albums = {
    karmageddon: {
        name: 'Karmageddon',
        artist: 'Kizaru',
        year: '2024',
        coverIcon: '🎭',
        coverClass: 'karmageddon',
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

// Выбор альбома
function selectAlbum(albumId) {
    selectedAlbum = albumId;
    
    // Обновляем кнопки
    document.querySelectorAll('.album-btn').forEach(btn => btn.classList.remove('active'));
    if (albumId === 'karmageddon') {
        document.getElementById('albumBtn1').classList.add('active');
    } else {
        document.getElementById('albumBtn2').classList.add('active');
    }
    
    // Обновляем обложку
    const album = albums[albumId];
    const albumCover = document.getElementById('albumCover');
    albumCover.className = `album-cover ${album.coverClass}`;
    
    // НЕ добавляем иконку, только меняем фон
    albumCover.innerHTML = ''; // Очищаем содержимое
    
    // Устанавливаем изображение через стиль
    const coverUrls = {
        'karmageddon': 'https://raw.githubusercontent.com/dealphonics/game-app/main/covers/karmageddon_cover.jpg',
        'psychi': 'https://raw.githubusercontent.com/dealphonics/game-app/main/covers/psychi_cover.jpg'
    };
    
    albumCover.style.backgroundImage = `url('${coverUrls[albumId]}')`;
    
    // Обновляем информацию об альбоме
    document.getElementById('albumInfo').textContent = 
        `${album.tracks.length} треков • Альбом ${album.year}`;
    
    document.getElementById('musicModalTitle').textContent = `📀 ${album.name}`;
    
    updateActiveAlbum();
    updateMusicList();
    saveProgress();
}

// ОБНОВЛЕННАЯ ФУНКЦИЯ СПИСКА МУЗЫКИ
function updateMusicList() {
    const tracksList = document.getElementById('tracksList');
    const currentAlbum = albums[selectedAlbum];
    let tracksHTML = '';
    
    currentAlbum.tracks.forEach((track) => {
        const isUnlocked = unlockedTracks.includes(track.id);
        const rarityClass = `rarity-${track.rarity}`;
        const trackClass = isUnlocked ? '' : 'locked';
        
        const icon = isUnlocked ? '💿' : '🔒';
        
        tracksHTML += `
            <div class="track-item ${trackClass}">
                <div class="track-info">
                    <div class="track-title">${icon} ${track.title}</div>
                    <div class="track-details">
                        ${track.artist}${isUnlocked ? `<br><span class="rarity-badge ${rarityClass}">${rarityNames[track.rarity]}</span>` : ''}
                    </div>
                </div>
                <button class="play-btn" 
                        ${!isUnlocked ? 'disabled' : ''} 
                        onclick="playTrack('${track.id}', '${track.title}', '${track.artist}', '${track.audioFile}')">
                    ${isUnlocked ? '▶️' : '🔒'}
                </button>
            </div>
        `;
    });
    
    tracksList.innerHTML = tracksHTML;
}

// Воспроизведение трека
function playTrack(trackId, trackTitle, trackArtist, audioFile) {
    tg.HapticFeedback.impactOccurred('light');
    
    try {
        if (window.currentAudio) {
            window.currentAudio.pause();
            window.currentAudio = null;
        }
        
        const audio = new Audio(audioFile);
        audio.volume = 0.7;
        
        audio.play().then(() => {
            window.currentAudio = audio;
            tg.showAlert(`🎵 Играет: ${trackTitle} - ${trackArtist}`);
        }).catch(() => {
            tg.showAlert(`🎵 ${trackTitle} - ${trackArtist}\n(Аудио файл не загружен)`);
        });
        
        audio.addEventListener('ended', () => {
            window.currentAudio = null;
        });
        
    } catch (error) {
        tg.showAlert(`🎵 ${trackTitle} - ${trackArtist}\n(Аудио файл не найден)`);
    }
}
