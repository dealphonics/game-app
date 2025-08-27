window.Music = (function(){
  // стабильные демо-треки
  const demoMap = {
    t1: 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3',
    t2: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    t3: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    t4: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    t5: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    t6: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    t7: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
    t8: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
    t9: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
    t10:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3'
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
    try{ window.__currentAudio?.pause(); }catch(e){}
    window.__currentAudio = null;

    const url = demoMap[track.id];
    if(url){
      const audio = new Audio();
      audio.src = url;
      audio.preload = 'auto';
      audio.crossOrigin = 'anonymous';
      audio.volume = 0.85;
      audio.play().then(()=>{
        window.__currentAudio = audio;
      }).catch(()=>{
        tg.showAlert('Аудио заблокировано автоплеем: нажмите ещё раз по ▶️');
      });
      audio.onended = ()=> window.__currentAudio = null;
      audio.onerror = ()=> tg.showAlert('Не удалось загрузить аудио. Попробуйте другой трек.');
      return;
    }

    // Фолбэк beep
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
