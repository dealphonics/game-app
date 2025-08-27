(function(){
  const SKEY = 'sk_state_v5';
  const state = loadState();

  // DOM
  const el = {
    statScore: document.getElementById('statScore'),
    statTracks: document.getElementById('statTracks'),
    statLevel: document.getElementById('statLevel'),
    btnPlay: document.getElementById('btnPlay'),
    btnMusic: document.getElementById('btnMusic'),
    gameModal: document.getElementById('gameModal'),
    musicModal: document.getElementById('musicModal'),
    gameScore: document.getElementById('gameScore'),
    gameTime: document.getElementById('gameTime'),
    gameCanvas: document.getElementById('gameCanvas'),
    btnRestart: document.getElementById('btnRestart'),
    btnPause: document.getElementById('btnPause'),
    tracksList: document.getElementById('tracksList'),
    toast: document.getElementById('toast'),
    albumSearch: document.getElementById('albumSearch'),
    searchResults: document.getElementById('searchResults'),
    // Player bar
    playerBar: document.getElementById('playerBar'),
    playerPrev: document.getElementById('playerPrev'),
    playerPlay: document.getElementById('playerPlay'),
    playerNext: document.getElementById('playerNext'),
    playerTitle: document.getElementById('playerTitle'),
    playerArtist: document.getElementById('playerArtist'),
    playerProgress: document.querySelector('.player-progress'),
    playerProgressFill: document.getElementById('playerProgressFill'),
    playerTimeCur: document.getElementById('playerTimeCur'),
    playerTimeDur: document.getElementById('playerTimeDur'),
  };

  // Текущий альбом для отображения
  let currentAlbum = 'karmageddon';

  // Doodle controller
  let doodle = null;
  let timerId = null;

  // Мини-плеер: очередь/текущий трек
  const player = { queue: [], index: -1, playing: false, seeking:false };

  // Modal helpers
  function showModal(id){ const m=document.getElementById(id); if(m){ m.style.display='flex'; } }
  function hideModal(id){
    const m=document.getElementById(id);
    if(!m) return;
    m.style.display='none';
    if(id==='gameModal'){ stopGame(); }
  }

  // Close buttons (✕)
  document.querySelectorAll('.modal-close').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const targetId = btn.getAttribute('data-close') || btn.closest('.modal')?.id;
      if(targetId) hideModal(targetId);
    });
  });
  // Close by click on backdrop
  [el.gameModal, el.musicModal].forEach(mod=>{
    mod.addEventListener('click', (e)=>{
      if(e.target === mod) hideModal(mod.id);
    });
  });
  // Close by Esc
  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape'){
      hideModal('gameModal'); hideModal('musicModal');
    }
  });

  // Actions
  el.btnPlay.addEventListener('click', ()=>{ showModal('gameModal'); startGame(); });
  el.btnMusic.addEventListener('click', ()=>{ showModal('musicModal'); renderTracks(); });
  el.btnRestart.addEventListener('click', startGame);
  el.btnPause.addEventListener('click', pauseResumeGame);

  // Player controls
  el.playerPrev.addEventListener('click', ()=> prevTrack());
  el.playerPlay.addEventListener('click', ()=> togglePlayPause());
  el.playerNext.addEventListener('click', ()=> nextTrack());

  // Player progress seeking
  el.playerProgress.addEventListener('pointerdown', e=> startSeek(e));
  window.addEventListener('pointermove', e=> moveSeek(e));
  window.addEventListener('pointerup', ()=> endSeek());

  // Album & track search
  el.albumSearch.addEventListener('input', ()=>{
    const q = el.albumSearch.value.trim().toLowerCase();

    // Вначале проверим альбом
    const albumMap = [
      {key:'karmageddon', album:'karmageddon'},
      {key:'кармагеддон', album:'karmageddon'},
      {key:'kizaru', album:'karmageddon'},
      {key:'психи', album:'psychi'},
      {key:'макс корж', album:'psychi'},
      {key:'psychi', album:'psychi'}
    ];
    const matchAlbum = albumMap.find(m=> q && m.key.includes(q));
    if(matchAlbum && currentAlbum!==matchAlbum.album){
      currentAlbum = matchAlbum.album;
      renderTracks();
      el.searchResults.style.display='none';
      return;
    }

    // Поиск по трекам
    if(q.length>=2){
      const found = Music.searchTracks(q);
      if(found.length){
        el.searchResults.innerHTML = found.map(t=>{
          return `<div class="row" data-id="${t.id}">
                    ${t.title} — ${t.artist}
                  </div>`;
        }).join('');
        el.searchResults.style.display='block';
      }else{
        el.searchResults.style.display='none';
      }
    }else{
      el.searchResults.style.display='none';
    }
  });

  el.searchResults.addEventListener('click', (e)=>{
    const row = e.target.closest('.row');
    if(!row) return;
    const id = row.getAttribute('data-id');
    // Найдём трек в альбомах
    const all = Object.values(Music.albums).flatMap(a=>a.tracks);
    const track = all.find(t=>t.id===id);
    if(!track){ el.searchResults.style.display='none'; return; }

    // Добавим в очередь (в конец) и начнем играть, если ничего не играет
    if(!player.queue.some(t=>t.id===track.id)) player.queue.push(track);
    if(player.index<0){ player.index = player.queue.findIndex(t=>t.id===track.id); }
    playCurrent();
    el.searchResults.style.display='none';
  });

  // Init UI
  updateStatsUI();
  renderTracks();
  bindAudioGlobal();

  // Game (Doodle Jump)
  function startGame(){
    stopGame();
    el.gameScore.textContent = '0';
    el.gameTime.textContent = '0:00';
    doodle = window.Doodle(
      el.gameCanvas,
      (meters)=>{ el.gameScore.textContent = meters; },   // score update
      ()=> { unlockInstant(); }                            // unlock on landing
    );
    doodle.start();
    el.btnPause.textContent = '⏸️ Пауза';
    el.btnPause.dataset.paused='0';
    startTimer();
  }
  function pauseResumeGame(){
    if(!doodle) return;
    if(el.btnPause.dataset.paused === '1'){
      doodle.resume(); el.btnPause.textContent='⏸️ Пауза'; el.btnPause.dataset.paused='0';
    }else{
      doodle.pause(); el.btnPause.textContent='▶️ Продолжить'; el.btnPause.dataset.paused='1';
    }
  }
  function stopGame(){
    try{ doodle?.stop(); }catch(e){}
    doodle = null;
    stopTimer();
    const gained = parseInt(el.gameScore.textContent||'0',10) || 0;
    if(gained>0){
      state.score += gained;
      if (Math.random()<0.25) unlockRandom();
      saveState(); updateStatsUI();
      toast(`Игра окончена! +${gained} очков`);
    }
  }
  function startTimer(){
    stopTimer();
    const start = Date.now();
    timerId = setInterval(()=>{
      const s = Math.floor((Date.now()-start)/1000);
      const mm = Math.floor(s/60).toString();
      const ss = (s%60).toString().padStart(2,'0');
      el.gameTime.textContent = `${mm}:${ss}`;
    }, 500);
  }
  function stopTimer(){ if(timerId){ clearInterval(timerId); timerId=null; } }

  // Music
  function renderTracks(){
    Music.renderTracks(el.tracksList, currentAlbum, state.unlocked, (track)=>{
      // Очередь — разблокированные треки текущего альбома; если нет — все разблокированные
      const curAlbumUnlocked = (Music.albums[currentAlbum]?.tracks || []).filter(t=>state.unlocked.includes(t.id));
      const allUnlocked = Object.values(Music.albums).flatMap(a=>a.tracks).filter(t=>state.unlocked.includes(t.id));
      const q = curAlbumUnlocked.length ? curAlbumUnlocked : allUnlocked;
      if(!q.length){ tg.showAlert('Нет разблокированных треков. Откройте треки в игре.'); return; }
      setQueue(q, track);
      playCurrent();
    });
    updateStatsUI();
  }

  // Player helpers
  function setQueue(queue, current){
    player.queue = queue.slice();
    player.index = Math.max(0, player.queue.findIndex(t=>t.id===current.id));
    if(player.index === -1) player.index = 0;
  }
  function playCurrent(){
    const track = player.queue[player.index];
    if(!track){ tg.showAlert('Очередь пуста'); return; }
    el.playerTitle.textContent = track.title;
    el.playerArtist.textContent = track.artist;

    // старт воспроизведения
    Music.playAudio(track).then?.(()=>{}).catch?.(()=>{});
    // Подождем и привяжем обработчики к текущему audio
    setTimeout(bindAudioGlobal, 120);
    setPlayIcon(true);
  }
  function bindAudioGlobal(){
    const a = window.__currentAudio;
    if(!a) return;
    a.onended = ()=> nextTrack();
    a.ontimeupdate = ()=> updateProgress();
    a.onloadedmetadata = ()=> updateProgress(true);
  }
  function togglePlayPause(){
    const a = window.__currentAudio;
    if(!a){
      if(player.queue.length>0){ playCurrent(); }
      return;
    }
    if(a.paused){
      a.play().then(()=>{ setPlayIcon(true); });
    }else{
      a.pause(); setPlayIcon(false);
    }
  }
  function nextTrack(){
    if(player.queue.length===0) return;
    player.index = (player.index+1) % player.queue.length;
    playCurrent();
  }
  function prevTrack(){
    if(player.queue.length===0) return;
    player.index = (player.index-1+player.queue.length) % player.queue.length;
    playCurrent();
  }
  function setPlayIcon(isPlaying){
    el.playerPlay.textContent = isPlaying ? '⏸️' : '▶️';
  }

  // Progress bar
  function updateProgress(resetMeta=false){
    const a = window.__currentAudio;
    if(!a) return;
    const cur = a.currentTime||0, dur = a.duration||0;
    if(resetMeta && !isFinite(dur)) return;
    const pct = dur>0 ? (cur/dur)*100 : 0;
    el.playerProgressFill.style.width = `${pct}%`;
    el.playerTimeCur.textContent = formatTime(cur);
    el.playerTimeDur.textContent = isFinite(dur) ? formatTime(dur) : '0:00';
  }
  function startSeek(e){
    const a = window.__currentAudio; if(!a) return;
    player.seeking = true; seekTo(e);
  }
  function moveSeek(e){
    if(!player.seeking) return;
    seekTo(e);
  }
  function endSeek(){
    player.seeking = false;
  }
  function seekTo(e){
    const a = window.__currentAudio; if(!a) return;
    const rect = el.playerProgress.getBoundingClientRect();
    const x = (e.clientX ?? (e.touches?.[0]?.clientX)) - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    const dur = a.duration||0;
    if(dur>0){ a.currentTime = dur * ratio; updateProgress(); }
  }
  function formatTime(s){
    const m = Math.floor(s/60), ss = Math.floor(s%60).toString().padStart(2,'0');
    return `${m}:${ss}`;
  }

  // Unlock helpers
  function allTracks(){
    return Object.values(Music.albums).flatMap(a=>a.tracks);
  }
  function pickLockedRandom(){
    const locked = allTracks().filter(t=>!state.unlocked.includes(t.id));
    if(!locked.length) return null;
    return locked[Math.floor(Math.random()*locked.length)];
  }
  function unlockInstant(){
    const t = pickLockedRandom(); if(!t) return;
    state.unlocked.push(t.id);
    saveState(); updateStatsUI();
    if (el.musicModal.style.display !== 'none') renderTracks();
    toast(`🎉 Новый трек: ${t.title}`);
  }
  function unlockRandom(){
    const t = pickLockedRandom(); if(!t) return;
    state.unlocked.push(t.id);
    toast(`🎵 Новый трек: ${t.title}`);
  }

  // UI & State
  function updateStatsUI(){
    const total = allTracks().length;
    el.statScore.textContent = state.score;
    el.statTracks.textContent = `${state.unlocked.length}/${total}`;
    el.statLevel.textContent = Math.floor(state.score/200)+1;
  }
  function toast(msg){
    const t = el.toast;
    t.textContent = msg;
    t.classList.remove('hidden');
    clearTimeout(t._tmr);
    t._tmr = setTimeout(()=> t.classList.add('hidden'), 2000);
  }
  function loadState(){
    try{
      const raw = localStorage.getItem(SKEY);
      if(!raw) return { score:0, unlocked:[] };
      const obj = JSON.parse(raw);
      return { score: obj.score||0, unlocked: Array.isArray(obj.unlocked)?obj.unlocked:[] };
    }catch(e){ return { score:0, unlocked:[] } }
  }
  function saveState(){
    localStorage.setItem(SKEY, JSON.stringify(state));
  }
})();
