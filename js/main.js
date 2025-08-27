(function(){
  const SKEY = 'sk_state_v6';
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
    toast: document.getElementById('toast'),
    albumSearch: document.getElementById('albumSearch'),
    searchResults: document.getElementById('searchResults'),
    // Player
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

  let doodle=null, timerId=null;
  let currentAlbum='karmageddon';
  const player={ queue:[], index:-1, seeking:false };

  // Modal helpers
  function showModal(id){ const m=document.getElementById(id); if(m) m.style.display='flex'; }
  function hideModal(id){
    const m=document.getElementById(id); if(!m) return;
    m.style.display='none';
    if(id==='gameModal') stopGame();
  }
  document.querySelectorAll('.modal-close').forEach(btn=>{
    btn.addEventListener('click', ()=>{ const id=btn.getAttribute('data-close')||btn.closest('.modal')?.id; if(id) hideModal(id); });
  });
  [el.gameModal, el.musicModal].forEach(mod=>{
    mod.addEventListener('click', (e)=>{ if(e.target===mod) hideModal(mod.id); });
  });
  document.addEventListener('keydown',(e)=>{ if(e.key==='Escape'){ hideModal('gameModal'); hideModal('musicModal'); } });

  // Actions
  el.btnPlay.addEventListener('click', ()=>{ showModal('gameModal'); startGame(); });
  el.btnMusic.addEventListener('click', ()=>{ showModal('musicModal'); renderTracks(); });
  el.btnRestart.addEventListener('click', startGame);
  el.btnPause.addEventListener('click', ()=>{
    if(!doodle) return;
    if(el.btnPause.dataset.paused==='1'){ doodle.resume(); el.btnPause.textContent='⏸️ Пауза'; el.btnPause.dataset.paused='0'; }
    else { doodle.pause(); el.btnPause.textContent='▶️ Продолжить'; el.btnPause.dataset.paused='1'; }
  });

  // Player bar
  el.playerPrev.addEventListener('click', ()=> prevTrack());
  el.playerPlay.addEventListener('click', ()=> togglePlayPause());
  el.playerNext.addEventListener('click', ()=> nextTrack());
  el.playerProgress.addEventListener('pointerdown', e=> startSeek(e));
  window.addEventListener('pointermove', e=> moveSeek(e));
  window.addEventListener('pointerup', ()=> endSeek());

  // Search
  el.albumSearch.addEventListener('input', ()=>{
    const q = el.albumSearch.value.trim().toLowerCase();
    const map = [
      {key:'karmageddon', album:'karmageddon'},
      {key:'кармагеддон', album:'karmageddon'},
      {key:'kizaru', album:'karmageddon'},
      {key:'психи', album:'psychi'},
      {key:'макс корж', album:'psychi'},
      {key:'psychi', album:'psychi'}
    ];
    const match = map.find(m=> q && m.key.includes(q));
    if(match){ currentAlbum=match.album; renderTracks(); el.searchResults.style.display='none'; return; }

    if(q.length>=2){
      const res = Music.searchTracks(q);
      if(res.length){
        el.searchResults.innerHTML = res.map(t=>`<div class="row" data-id="${t.id}">${t.title} — ${t.artist}</div>`).join('');
        el.searchResults.style.display='block';
      } else el.searchResults.style.display='none';
    } else el.searchResults.style.display='none';
  });
  el.searchResults.addEventListener('click', (e)=>{
    const row = e.target.closest('.row'); if(!row) return;
    const id = row.getAttribute('data-id');
    const all = Object.values(Music.albums).flatMap(a=>a.tracks);
    const track = all.find(t=>t.id===id);
    if(!track){ el.searchResults.style.display='none'; return; }
    if(!player.queue.some(t=>t.id===track.id)) player.queue.push(track);
    if(player.index<0) player.index = player.queue.findIndex(t=>t.id===track.id);
    playCurrent(); el.searchResults.style.display='none';
  });

  // Init
  updateStatsUI(); renderTracks(); bindAudio();

  // Game with tilt auto
  function startGame(){
    stopGame();
    el.gameScore.textContent='0'; el.gameTime.textContent='0:00';
    doodle = window.Doodle(
      el.gameCanvas,
      meters => { el.gameScore.textContent = meters; },
      evType => { attemptDrop(evType); },         // редкие дропы
      () => { // onGameOver
        stopGame();
        // Покажем явный тост, модалка остаётся открыта с кнопкой "Заново"
        toast('Игра окончена! Нажмите Заново, чтобы играть ещё.');
      }
    );
    doodle.enableTilt?.(); // запрос акселерометра на iOS
    doodle.start();
    el.btnPause.textContent='⏸️ Пауза'; el.btnPause.dataset.paused='0';
    startTimer();
  }
  function stopGame(){
    try{ doodle?.stop(); }catch(e){}
    doodle=null; stopTimer();
    const gained = parseInt(el.gameScore.textContent||'0',10)||0;
    if(gained>0){
      state.score += gained;
      // Финальный шанс 8%
      if(Math.random()<0.08) unlockByRarity();
      saveState(); updateStatsUI();
    }
  }

  // Rarity drop
  const weights = { common:70, rare:20, epic:8, legendary:2 };
  function attemptDrop(evType){
    const p = evType==='kill' ? 0.03 : 0.02;
    if(Math.random()<p) unlockByRarity();
  }
  function unlockByRarity(){
    const all = Object.values(Music.albums).flatMap(a=>a.tracks);
    const locked = all.filter(t=>!state.unlocked.includes(t.id));
    if(!locked.length) return;

    const by = {common:[], rare:[], epic:[], legendary:[]};
    locked.forEach(t=>{ if(by[t.rarity]) by[t.rarity].push(t); });

    const totalW = Object.keys(weights).reduce((s,k)=> s + (by[k].length? weights[k]:0),0);
    if(totalW===0) return;
    let r = Math.random()*totalW, rare='common';
    for(const k of ['common','rare','epic','legendary']){
      const w = by[k].length? weights[k]:0;
      if(r<w){ rare=k; break; } r-=w;
    }
    const pool = by[rare]; if(!pool || !pool.length) return;
    const t = pool[Math.floor(Math.random()*pool.length)];

    state.unlocked.push(t.id);
    saveState(); updateStatsUI();
    if(el.musicModal.style.display!=='none') renderTracks();
    toast(`🎉 Новый трек (${label(rare)}): ${t.title}`);
  }
  function label(r){ return {common:'Обычный', rare:'Редкий', epic:'Эпический', legendary:'Легендарный'}[r]||''; }

  // Timer
  function startTimer(){
    stopTimer();
    const start=Date.now();
    timerId=setInterval(()=>{
      const s=Math.floor((Date.now()-start)/1000);
      el.gameTime.textContent = `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;
    }, 500);
  }
  function stopTimer(){ if(timerId){ clearInterval(timerId); timerId=null; } }

  // Music & player
  function renderTracks(){
    Music.renderTracks(el.tracksList, currentAlbum, state.unlocked, (track)=>{
      const curAlbumUnlocked = (Music.albums[currentAlbum]?.tracks||[]).filter(t=>state.unlocked.includes(t.id));
      const allUnlocked = Object.values(Music.albums).flatMap(a=>a.tracks).filter(t=>state.unlocked.includes(t.id));
      const queue = curAlbumUnlocked.length? curAlbumUnlocked : allUnlocked;
      if(!queue.length){ tg.showAlert('Нет разблокированных треков. Откройте треки в игре.'); return; }
      setQueue(queue, track); playCurrent();
    });
    updateStatsUI();
  }
  function setQueue(queue, cur){
    player.queue = queue.slice();
    player.index = player.queue.findIndex(t=>t.id===cur.id);
    if(player.index<0) player.index=0;
  }
  function playCurrent(){
    const t=player.queue[player.index];
    if(!t){ tg.showAlert('Очередь пуста'); return; }
    el.playerTitle.textContent = t.title;
    el.playerArtist.textContent = t.artist;
    Music.playAudio(t).then?.(()=>{}).catch?.(()=>{});
    setTimeout(bindAudio, 120);
    el.playerPlay.textContent='⏸️';
  }
  function bindAudio(){
    const a = window.__currentAudio; if(!a) return;
    a.onended = ()=> nextTrack();
    a.ontimeupdate = ()=> updateProgress();
    a.onloadedmetadata = ()=> updateProgress(true);
  }
  function togglePlayPause(){
    const a = window.__currentAudio;
    if(!a){ if(player.queue.length>0) playCurrent(); return; }
    if(a.paused){ a.play().then(()=> el.playerPlay.textContent='⏸️'); }
    else{ a.pause(); el.playerPlay.textContent='▶️'; }
  }
  function nextTrack(){
    if(!player.queue.length) return;
    player.index=(player.index+1)%player.queue.length; playCurrent();
  }
  function prevTrack(){
    if(!player.queue.length) return;
    player.index=(player.index-1+player.queue.length)%player.queue.length; playCurrent();
  }
  function updateProgress(){
    const a=window.__currentAudio; if(!a) return;
    const cur=a.currentTime||0, dur=a.duration||0;
    const pct=dur>0?(cur/dur)*100:0;
    el.playerProgressFill.style.width=`${pct}%`;
    el.playerTimeCur.textContent=fmt(cur);
    el.playerTimeDur.textContent=isFinite(dur)?fmt(dur):'0:00';
  }
  function fmt(s){ const m=Math.floor(s/60), ss=Math.floor(s%60).toString().padStart(2,'0'); return `${m}:${ss}`; }
  function startSeek(e){
    player.seeking=true; seekTo(e);
  }
  function moveSeek(e){ if(player.seeking) seekTo(e); }
  function endSeek(){ player.seeking=false; }
  function seekTo(e){
    const a=window.__currentAudio; if(!a) return;
    const r=el.playerProgress.getBoundingClientRect();
    const x=(e.clientX ?? e.touches?.[0]?.clientX)-r.left;
    const ratio=Math.max(0,Math.min(1,x/r.width));
    const dur=a.duration||0; if(dur>0){ a.currentTime=dur*ratio; updateProgress(); }
  }

  // UI / State
  function updateStatsUI(){
    const total = Object.values(Music.albums).flatMap(a=>a.tracks).length;
    el.statScore.textContent = state.score;
    el.statTracks.textContent = `${state.unlocked.length}/${total}`;
    el.statLevel.textContent = Math.floor(state.score/200)+1;
  }
  function toast(msg){
    const t=el.toast; t.textContent=msg; t.classList.remove('hidden');
    clearTimeout(t._tmr); t._tmr=setTimeout(()=> t.classList.add('hidden'), 2000);
  }
  function loadState(){
    try{
      const raw=localStorage.getItem(SKEY);
      if(!raw) return {score:0, unlocked:[]};
      const obj=JSON.parse(raw);
      return {score: obj.score||0, unlocked: Array.isArray(obj.unlocked)?obj.unlocked:[]};
    }catch(e){ return {score:0, unlocked:[]}; }
  }
  function saveState(){ localStorage.setItem(SKEY, JSON.stringify(state)); }
})();
