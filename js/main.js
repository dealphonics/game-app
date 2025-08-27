(function(){
  const SKEY = 'sk_state_v3';
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
    albumSearch: document.getElementById('albumSearch')
  };

  let controller = null;
  let timerId = null;

  // Текущий альбом (karmageddon / psychi)
  let currentAlbum = 'karmageddon';

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

  // Album search (только поиск)
  el.albumSearch.addEventListener('input', ()=>{
    const q = el.albumSearch.value.trim().toLowerCase();
    // Мэппинг по ключевым словам
    const map = [
      {key:'karmageddon', album:'karmageddon'},
      {key:'кармагеддон', album:'karmageddon'},
      {key:'kizaru', album:'karmageddon'},
      {key:'психи', album:'psychi'},
      {key:'макс корж', album:'psychi'},
      {key:'psychi', album:'psychi'}
    ];
    const found = map.find(m=> q && m.key.includes(q));
    if(found){
      currentAlbum = found.album;
      renderTracks();
    }
  });

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
      // onHitUnlock: разблокируем прямо в игре
      ()=> { instantUnlockOne(); }
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
      Music.playAudio(track);
      toast(`▶️ ${track.title} — ${track.artist}`);
    });
    updateStatsUI();
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
