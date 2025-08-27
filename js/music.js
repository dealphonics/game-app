window.Music = (function(){
  const demoMap = {
    t1: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_0ae50285c8.mp3?filename=soft-piano-ambient-110397.mp3',
    t2: 'https://cdn.pixabay.com/download/audio/2022/10/25/audio_3a5f4c2f33.mp3?filename=lofi-study-112191.mp3',
    t3: 'https://cdn.pixabay.com/download/audio/2022/10/31/audio_2d8feeccd2.mp3?filename=ambient-technology-112588.mp3',
    t4: 'https://cdn.pixabay.com/download/audio/2022/07/19/audio_1aafde5963.mp3?filename=slow-ambient-112191.mp3',
    t5: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_7f870f0673.mp3?filename=melody-of-nature-110689.mp3'
  };
  const albums = {
    album1: [
      {id:'t1', title:'Cosmic Journey', artist:'Space Beats'},
      {id:'t2', title:'Stellar Dreams', artist:'Nebula Sound'},
      {id:'t3', title:'Galaxy Pulse', artist:'Astro Vibes'},
      {id:'t4', title:'Quantum Rhythm', artist:'Orbit Lab'},
      {id:'t5', title:'Nebula Echo', artist:'Void Collective'}
    ],
    album2: [
      {id:'t6', title:'Aurora Drift', artist:'Northern Lights'},
      {id:'t7', title:'Lunar Bloom', artist:'Moon Unit'},
      {id:'t8', title:'Solar Wind', artist:'Helios'},
      {id:'t9', title:'Comet Trail', artist:'Iceshard'},
      {id:'t10', title:'Event Horizon', artist:'Singularity'}
    ]
  };

  function renderTracks(targetEl, albumId, unlocked, onPlay){
    const list = albums[albumId] || [];
    targetEl.innerHTML = '';
    list.forEach(track=>{
      const isUnlocked = unlocked.includes(track.id);
      const row = document.createElement('div');
      row.className = 'track' + (isUnlocked?'':' locked');
      row.innerHTML = `
        <div class="info">
          <div class="title">${isUnlocked?'🎵':'🔒'} ${track.title}</div>
          <div class="artist">${track.artist}</div>
        </div>
        <button class="play" ${isUnlocked?'':'disabled'}>▶️</button>`;
      row.querySelector('.play')?.addEventListener('click', ()=> onPlay(track));
      targetEl.appendChild(row);
    });
  }

  function playAudio(track){
    // Останавливаем предыдущий
    try{ window.__currentAudio?.pause(); }catch(e){}
    window.__currentAudio = null;

    // Демо-URL для первых пяти треков
    const url = demoMap[track.id];
    if(url){
      const audio = new Audio(url);
      audio.volume = 0.8;
      audio.play()
        .then(()=>{ window.__currentAudio = audio; })
        .catch(()=>{
          tg.showAlert('Аудио заблокировано автоплеем: нажмите ещё раз по ▶️');
        });
      audio.onended = ()=> window.__currentAudio = null;
      return;
    }

    // Фолбэк: короткий beep
    try{
      const AC = window.AudioContext || window.webkitAudioContext;
      const ctx = new AC();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 440; gain.gain.value = 0.2;
      osc.start(); setTimeout(()=>{ osc.stop(); ctx.close(); }, 600);
    }catch(e){
      tg.showAlert('Звук не воспроизводится. Добавим аудио позже.');
    }
  }

  return { albums, renderTracks, playAudio };
})();
