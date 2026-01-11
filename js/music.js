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
        {id:'ncs_blank',           title:'Disfigure - Blank',            artist:'NCS', rarity:'legendary',    path:'ncscollection/blank.mp3'},
        {id:'ncs_freefall',           title:'Audioscribe - Free Fall',            artist:'NCS', rarity:'epic',      path:'ncscollection/freefall.mp3'},
        {id:'ncs_staywithme',      title:'Mendum - Stay With Me',        artist:'NCS', rarity:'rare',      path:'ncscollection/staywithme.mp3'},
        {id:'ncs_link',   title:'Jim Yosef - Link',     artist:'NCS', rarity:'common',    path:'ncscollection/link.mp3'}
      ]
    },
    monstercat: {
      title:'Best Of Monstercat', artist:'Monstercat',
      tracks: [
        {id:'mc_snadobye',          title:'Снадобье',                 artist:'Макс Корж', rarity:'epic',      path:'psychi/snadobye.mp3'},
        {id:'p_afgan',             title:'Афган',                    artist:'Макс Корж', rarity:'legendary', path:'psychi/afgan.mp3'},
        {id:'p_sozhzheny',         title:'Сожжены',                  artist:'Макс Корж', rarity:'epic',      path:'psychi/sozhzheny.mp3'},
        {id:'p_luchshiy_vaib',     title:'Лучший вайб',              artist:'Макс Корж', rarity:'rare',      path:'psychi/luchshiy_vaib.mp3'},
        {id:'p_young_haze',        title:'Young haze',               artist:'Макс Корж', rarity:'common',    path:'psychi/young_haze.mp3'},
        {id:'p_ulitsy_bez_fonarey',title:'Улицы без фонарей',        artist:'Макс Корж', rarity:'rare',      path:'psychi/ulitsy_bez_fonarey.mp3'},
        {id:'p_tak_i_znal',        title:'Так и знал',               artist:'Макс Корж', rarity:'rare',      path:'psychi/tak_i_znal.mp3'},
        {id:'p_na_domu',           title:'На дому',                  artist:'Макс Корж', rarity:'rare',      path:'psychi/na_domu.mp3'},
        {id:'p_animals',           title:'Animals',                  artist:'Макс Корж', rarity:'common',    path:'psychi/animals.mp3'},
        {id:'p_zapravka',          title:'Заправка',                 artist:'Макс Корж', rarity:'common',    path:'psychi/zapravka.mp3'}
      ]
    }
  };

  function renderTracks(targetEl, albumKey, unlocked, onPlay){
    const album = albums[albumKey] || albums.karmageddon;
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
