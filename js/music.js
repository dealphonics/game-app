window.Music = (function(){
  const baseRepo = 'dealphonics/game-app';
  const buildUrl = [
    rel => `https://raw.githubusercontent.com/${baseRepo}/main/${rel}`,
    rel => `https://dealphonics.github.io/game-app/${rel}`,
    rel => `https://raw.githubusercontent.com/${baseRepo}/master/${rel}`,
  ];

  const albums = {
    ncs: {
      title:'Best Of NCS', artist:'NCS',
      tracks: [
        {id:'ncs_invincible',           title:'DEAF KEV - iNVINCIBLE',             artist:'NCS', rarity:'legendary', path:'ncscollection/invincible.mp3'},
        {id:'ncs_blank',           title:'Disfigure - Blank',            artist:'NCS', rarity:'epic',    path:'ncscollection/blank.mp3'},
        {id:'ncs_freefall',           title:'Audioscribe - Free Fall',            artist:'NCS', rarity:'rare',      path:'ncscollection/freefall.mp3'},
        {id:'ncs_staywithme',      title:'Mendum - Stay With Me',        artist:'NCS', rarity:'common',      path:'ncscollection/staywithme.mp3'},
        {id:'ncs_link',   title:'Jim Yosef - Link',     artist:'NCS', rarity:'common',    path:'ncscollection/link.mp3'}
      ]
    },
    monstercat: {
      title:'Best Of Monstercat', artist:'Monstercat',
      tracks: [
        {id:'mc_flight',          title:'Tristam & Braken - Flight',                 artist:'Monstercat', rarity:'legendary',      path:'monstercatcollection/flight.mp3'},
        {id:'mc_crabrave',             title:'Noisestorm - Crab Rave',                    artist:'Monstercat', rarity:'common', path:'monstercatcollection/crabrave.mp3'},
        {id:'mc_overkill',         title:'RIOT - Overkill',                  artist:'Monstercat', rarity:'epic',      path:'monstercatcollection/overkill.mp3'},
        {id:'mc_japan',     title:'Throttle - Japan',              artist:'Monstercat', rarity:'commom',      path:'monstercatcollection/japan.mp3'},
        {id:'mc_stronger',        title:'Stonebank & EMEL - Stronger',               artist:'Monstercat', rarity:'rare',    path:'monstercatcollection/stronger.mp3'}
      ]
    }
  };

  function renderTracks(targetEl, albumKey, unlocked, onPlay){
    const album = albums[albumKey] || albums.ncs; albums.monstercat;
    targetEl.innerHTML = '';
    album.tracks.forEach(track=>{
      const isUnlocked = unlocked.includes(track.id);
      const row = document.createElement('div');
      row.className = 'track' + (isUnlocked?'':' locked');
      row.innerHTML = `
        <div class="info">
          <div class="title">${isUnlocked?'🎵':'🔒'} ${track.title}</div>
          <div class="artist">${track.artist} · ${album.title} ${isUnlocked?`· ${rareLabel(track.rarity)}`:''}</div>
        </div>
        <button class="play" ${isUnlocked?'':'disabled'}>▶️</button>`;
      row.querySelector('.play')?.addEventListener('click', ()=> onPlay(track));
      targetEl.appendChild(row);
    });
  }

  function rareLabel(r){ return {common:'(Обычный)', rare:'(Редкий)', epic:'(Эпический)', legendary:'(Легендарный)'}[r]||''; }

  async function playAudio(track){
    try{ window.__currentAudio?.pause(); }catch(e){}
    window.__currentAudio = null;

    const candidates = buildUrl.map(f => f(track.path));
    for (let i=0;i<candidates.length;i++){
      const url = candidates[i];
      try{
        const audio = new Audio();
        audio.src = url;
        audio.preload = 'auto';
        audio.crossOrigin = 'anonymous';
        audio.volume = 0.9;
        await audio.play();
        window.__currentAudio = audio;
        return;
      }catch(e){}
    }
    // fallback beep
    try{
      const AC = window.AudioContext || window.webkitAudioContext;
      const ctx = new AC();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 520; gain.gain.value = 0.15;
      osc.start(); setTimeout(()=>{ osc.stop(); ctx.close(); }, 500);
    }catch(e){}
    tg.showAlert('Не удалось воспроизвести трек с GitHub. Проверьте путь: '+track.path);
  }

  function searchTracks(query){
    const q = (query||'').trim().toLowerCase();
    if(!q) return [];
    const all = Object.values(albums).flatMap(a=>a.tracks.map(t=>({...t, album:a.title})));
    return all.filter(t => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q) || (t.album||'').toLowerCase().includes(q)).slice(0,8);
  }

  return { albums, renderTracks, playAudio, searchTracks };
})();
