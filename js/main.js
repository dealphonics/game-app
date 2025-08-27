(function(){
  const SKEY = 'sk_state_v1';
  const state = loadState();

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
    toast: document.getElementById('toast')
  };

  let controller = null; // game controller
  let timerId = null;
  let currentAlbum = 'album1';

  // Safe close buttons
  document.querySelectorAll('.modal-close').forEach(b=>{
    b.addEventListener('click', ()=>{
      const target = b.getAttribute('data-close');
      closeModal(target);
    });
  });

  // Outside click closes modal
  [el.gameModal, el.musicModal].forEach(mod=>{
    mod.addEventListener('click', (e)=>{
      if(e.target === mod) mod.classList.add('hidden');
    });
  });

  el.btnPlay.addEventListener('click', openGame);
  el.btnMusic.addEventListener('click', openMusic);
  el.btnRestart.addEventListener('click', restartGame);
  el.btnPause.addEventListener('click', pauseResumeGame);

  document.querySelectorAll('.album-tab').forEach(tab=>{
    tab.addEventListener('click', ()=>{
      document.querySelectorAll('.album-tab').forEach(t=>t.classList.remove('active'));
      tab.classList.add('active');
      currentAlbum = tab.getAttribute('data-album');
      renderTracks();
    });
  });

  updateStatsUI();
  renderTracks();

  // Expose selectAlbum for robustness (not strictly needed now)
  window.selectAlbum = (id)=>{
    currentAlbum = id;
    renderTracks();
  };

  function openGame(){
    el.gameModal.classList.remove('hidden');
    startGame();
  }

  function closeModal(id){
    const mod = document.getElementById(id);
    if(!mod) return;
    mod.classList.add('hidden');
    if(id==='gameModal'){ stopGame(); }
    if(id==='musicModal'){ /* nothing */ }
  }

  function openMusic(){
    el.musicModal.classList.remove('hidden');
  }

  function startGame(){
    stopGame();
    el.gameScore.textContent = '0';
    el.gameTime.textContent = '0:00';
    controller = window.GameTarget(el.gameCanvas, (gameScore)=>{
      el.gameScore.textContent = gameScore;
    });
    controller.start();
    startTimer();
  }

  function restartGame(){ startGame(); }
  function pauseResumeGame(){
    if(!controller) return;
    if(el.btnPause.dataset.paused === '1'){
      controller.resume(); el.btnPause.textContent = '⏸️ Пауза'; el.btnPause.dataset.paused='0';
    }else{
      controller.pause(); el.btnPause.textContent = '▶️ Продолжить'; el.btnPause.dataset.paused='1';
    }
  }

  function stopGame(){
    try{ controller?.stop(); }catch(e){}
    controller = null;
    stopTimer();
    // начисление очков
    const gained = parseInt(el.gameScore.textContent||'0',10) || 0;
    if(gained>0){
      state.score += gained;
      // шанс разблокировать трек
      maybeUnlockTrack();
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

  function renderTracks(){
    Music.renderTracks(el.tracksList, currentAlbum, state.unlocked, (track)=>{
      // По клику — реальный клик, автоплей не блокируется
      Music.playAudio(track);
      toast(`▶️ ${track.title} — ${track.artist}`);
    });
    updateStatsUI();
  }

  function maybeUnlockTrack(){
    const all = Object.values(Music.albums).flat();
    const locked = all.filter(t=>!state.unlocked.includes(t.id));
    if(locked.length===0) return;
    if(Math.random()<0.25){
      const t = locked[Math.floor(Math.random()*locked.length)];
      state.unlocked.push(t.id);
      toast(`🎵 Новый трек: ${t.title}`);
    }
  }

  function updateStatsUI(){
    el.statScore.textContent = state.score;
    const total = Object.values(Music.albums).flat().length;
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
