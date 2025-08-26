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
    const albumCoverImg = document.getElementById('modalAlbumCover');
    if (albumCoverImg) {
        albumCoverImg.src = album.coverUrl;
    }
    
    // Обновляем информацию об альбоме
    document.getElementById('albumInfo').textContent = 
        `${album.tracks.length} треков • Альбом ${album.year}`;
    
    document.getElementById('musicModalTitle').textContent = `📀 ${album.name}`;
    
    updateActiveAlbum();
    updateMusicList();
    saveProgress();
}

// Обновление списка музыки
function updateMusicList() {
    const tracksList = document.getElementById('tracksList');
    if (!tracksList) return;
    
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
                        ${track.artist}
                        ${isUnlocked ? `<br><span class="rarity-badge ${rarityClass}">${rarityNames[track.rarity]}</span>` : ''}
                    </div>
                </div>
                <button class="play-btn" 
                        ${!isUnlocked ? 'disabled' : ''} 
                        onclick="playTrack('${track.id}', '${track.title}', '${track.artist}', '${track.audioFile}')">
                    ${isUnlocked ? '▶️ Play' : '🔒'}
                </button>
            </div>
        `;
    });
    
    tracksList.innerHTML = tracksHTML;
}

// Воспроизведение трека
function playTrack(trackId, trackTitle, trackArtist, audioFile) {
    tg.HapticFeedback.impactOccurred('light');
    
    // Для тестирования - разблокируем случайный трек
    if (unlockedTracks.length === 0) {
        const testTrack = albums[selectedAlbum].tracks[0];
        unlockedTracks.push(testTrack.id);
        updateMusicList();
        tg.showAlert('Для теста разблокирован первый трек!');
        return;
    }
    
    try {
        if (window.currentAudio) {
            window.currentAudio.pause();
            window.currentAudio = null;
        }
        
        // Создаем аудио элемент
        const audio = new Audio(audioFile);
        audio.volume = 0.7;
        
        audio.play().then(() => {
            window.currentAudio = audio;
            tg.showAlert(`🎵 Играет: ${trackTitle} - ${trackArtist}`);
        }).catch(() => {
            // Если нет файла, просто показываем уведомление
            tg.showAlert(`🎵 ${trackTitle} - ${trackArtist}\n(Демо режим - файл не загружен)`);
        });
        
        audio.addEventListener('ended', () => {
            window.currentAudio = null;
        });
        
    } catch (error) {
        tg.showAlert(`🎵 ${trackTitle} - ${trackArtist}\n(Демо режим)`);
    }
}
