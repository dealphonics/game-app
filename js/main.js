(function(){
  const SKEY = 'sk_state_v4';
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
    // Player bar
    playerBar: document.getElementById('playerBar'),
    playerPrev: document.getElementById('playerPrev'),
    playerPlay: document.getElementById('playerPlay'),
    playerNext: document.getElementById('playerNext'),
    playerTitle: document.getElementById('playerTitle'),
    playerArtist: document.getElementById('playerArtist')
  };

  let controller = null;
  let timerId = null;

  // Текущий альбом (поиск)
  let currentAlbum = 'karmageddon';

  // Мини-плеер: очередь/текущий трек
  const player = {
    queue: [],         // массив треков
    index: -1,         // индекс текущего в очереди
    playing: false
  };

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
      hideModal('gameModal');
      hideModal('musicModal');
    }
  });

  // Actions
  el.btnPlay.addEventListener('click', ()=>{
    showModal('gameModal');
    startGame();
  });
  el.btnMusic.addEventListener('click', ()=>{
    showModal('musicModal');
    renderTracks();
  });
  el.btnRestart.addEventListener('click', startGame);
  el.btnPause.addEventListener('click', pauseResumeGame);

  // Album search only
  el.albumSearch.addEventListener('input', ()=>{
    const q = el.albumSearch.value.trim().toLowerCase();
    const candidates = [
      {key:'karmageddon', album:'karmageddon'},
      {key:'кармагеддон', album:'karmageddon'},
      {key:'kizaru', album:'karmageddon'},
      {key:'психи', album:'psychi'},
      {key:'макс корж', album:'psychi'},
      {key:'psychi', album:'psychi'}
    ];
    const match = candidates.find(m=> q && m.key.includes(q));
    if(match && currentAlbum!==match.album){
      currentAlbum = match.album;
      renderTracks();
    }
  });

  // Player controls
  el.playerPrev.addEventListener('click', ()=> prevTrack());
  el.playerPlay.addEventListener('click', ()=> togglePlayPause());
  el.playerNext.addEventListener('click', ()=> nextTrack());

  // Init UI
  updateStatsUI();
  renderTracks();

  // Game
  function startGame(){
    stopGame();
    el.gameScore.textContent = '0';
    el.gameTime.textContent = '0:00';
    controller = window.GameTarget(
      el.gameCanvas,
      (gameScore)=>{ el.gameScore.textContent = gameScore; },
      ()=> { instantUnlockOne(); } // onHitUnlock
    );
    controller.start();
    el.btnPause.textContent = '⏸️ Пауза';
    el.btnPause.dataset.paused='0';
    startTimer();
  }
  function pauseResumeGame(){
    if(!controller) return;
    if(el.btnPause.dataset.paused === '1'){
      controller.resume(); el.btnPause.textContent='⏸️ Пауза'; el.btnPause.dataset.paused='0';
    }else{
      controller.pause(); el.btnPause.textContent='▶️ Продолжить'; el.btnPause.dataset.paused='1';
    }
  }
  function stopGame(){
    try{ controller?.stop(); }catch(e){}
    controller = null;
    stopTimer();
    const gained = parseInt(el.gameScore.textContent||'0',10) || 0;
    if(gained>0){
      state.score += gained;
      // финальный шанс на разблокировку при завершении
      if (Math.random()<0.25) {
        const t = pickLockedRandom();
        if (t) {
          state.unlocked.push(t.id);
          toast(`🎵 Новый трек: ${t.title}`);
        }
      }
      saveState();
      updateStatsUI();
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
      // Строим очередь: разблокированные треки текущего альбома, иначе все разблокированные
      const albumUnlocked = (Music.albums[currentAlbum]?.tracks || []).filter(t=>state.unlocked.includes(t.id));
      const allUnlocked = Object.values(Music.albums).flatMap(a=>a.tracks).filter(t=>state.unlocked.includes(t.id));
      const queue = albumUnlocked.length>0 ? albumUnlocked : allUnlocked;

      if(queue.length===0){
        tg.showAlert('Нет разблокированных треков. Откройте треки в игре.');
        return;
      }
      setQueue(queue, track);
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
    if(!track){
      tg.showAlert('Очередь пуста'); return;
    }
    el.playerTitle.textContent = track.title;
    el.playerArtist.textContent = track.artist;
    Music.playAudio(track).then?.(()=>{}).catch?.(()=>{});
    // подождем и привяжем обработчики к текущему audio
    setTimeout(bindAudioHandlers, 100);
    setPlayIcon(true);
    player.playing = true;
  }
  function bindAudioHandlers(){
    const a = window.__currentAudio;
    if(!a) return;
    a.onended = ()=> { nextTrack(); };
  }
  function togglePlayPause(){
    const a = window.__currentAudio;
    if(!a){
      // если не было — начнем с текущего
      if(player.queue.length>0){ playCurrent(); }
      return;
    }
    if(a.paused){
      a.play().then(()=>{ setPlayIcon(true); player.playing=true; });
    }else{
      a.pause(); setPlayIcon(false); player.playing=false;
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

  // Unlock helpers
  function allTracks(){
    return Object.values(Music.albums).flatMap(a=>a.tracks);
  }
  function pickLockedRandom(){
    const locked = allTracks().filter(t=>!state.unlocked.includes(t.id));
    if(locked.length===0) return null;
    return locked[Math.floor(Math.random()*locked.length)];
  }
  function instantUnlockOne(){
    const t = pickLockedRandom();
    if(!t) return;
    state.unlocked.push(t.id);
    saveState();
    updateStatsUI();
    if (el.musicModal.style.display !== 'none') renderTracks();
    toast(`🎉 Новый трек: ${t.title}`);
  }

  // UI & State
  function updateStatsUI(){
    el.statScore.textContent = state.score;
    const total = allTracks().length;
    el.statTracks.textContent = `${state.unlocked.length}/${total}`;
    el.statLevel.textContent = Math.floor(state.score/200)+1;
  }
  function toast(msg){
    const t = el.toast;
    t.textContent = msg;
    t.classList.remove('hidden');
    clearTimeout(t._tmr);
    t._tmr = setTimeout(()=> t.classList.add('hidden'), 1800);
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
