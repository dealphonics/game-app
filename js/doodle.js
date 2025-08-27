// Doodle Jump • premium (fixed meters, tilt auto, smooth camera, better shooting)
window.Doodle = function(canvas, onScore, onAttemptDrop, onGameOver){
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  // State
  let running=false, paused=false, raf=0;
  let camY=0, prevMeters=0;
  let baseY=0, minY=0; // для корректной высоты независимо от камеры

  // Player
  const player = {
    x: W/2, y: H-100, w: 26, h: 34,
    vx: 0, vy: 0, baseSpeed: 3.2, jump: -9.8,
    dir: 1, invul:0, // frames after hit
    shield: 0, jetpack: 0, boots: 0, shotCooldown: 0
  };

  // World arrays
  let plats=[], mobs=[], bullets=[], particles=[], pickups=[];

  // Input
  let tiltEnabled=false, tiltX=0, pointerShoot=false;

  // Stars parallax
  const starsA = spawnStars(35), starsB=spawnStars(25), starsC=spawnStars(15);
  function spawnStars(n){ return Array.from({length:n},()=>({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.5+0.5})) }

  // Enable tilt immediately (called inside user gesture on startGame)
  function enableTilt(){
    if(tiltEnabled) return;
    if(typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function'){
      DeviceOrientationEvent.requestPermission()
        .then(state=>{
          if(state==='granted'){ window.addEventListener('deviceorientation', onTilt); tiltEnabled=true; }
        }).catch(()=>{ /* ignore */ });
    } else {
      window.addEventListener('deviceorientation', onTilt);
      tiltEnabled=true;
    }
  }
  function onTilt(e){
    if(e && typeof e.gamma==='number'){
      // гамма: -90..90, чувствительность средняя
      const g = Math.max(-22, Math.min(22, e.gamma));
      tiltX = g / 14; // сглаженная средняя чувствительность
    }
  }

  // Shooting by tap (instant)
  canvas.addEventListener('pointerdown', ()=>{ pointerShoot=true; shoot(); }, {passive:true});
  canvas.addEventListener('pointerup',   ()=>{ pointerShoot=false; }, {passive:true});
  canvas.addEventListener('touchstart', ()=>{ pointerShoot=true; shoot(); }, {passive:true});
  canvas.addEventListener('touchend',   ()=>{ pointerShoot=false; }, {passive:true});

  // Keyboard fallback
  window.addEventListener('keydown', e=>{
    if(e.key==='ArrowLeft'||e.key==='a') player.vx=-player.baseSpeed*2.0;
    if(e.key==='ArrowRight'||e.key==='d') player.vx= player.baseSpeed*2.0;
    if(e.key===' ') shoot();
  });
  window.addEventListener('keyup', e=>{
    if(e.key==='ArrowLeft'||e.key==='a'||e.key==='ArrowRight'||e.key==='d') player.vx=0;
  });

  function reset(){
    camY=0; prevMeters=0;
    player.x=W/2; player.y=H-100; player.vx=0; player.vy=0;
    player.shield=0; player.jetpack=0; player.boots=0; player.shotCooldown=0; player.invul=0;

    baseY = player.y; // стартовая точка для высоты
    minY = player.y;

    plats=[]; mobs=[]; bullets=[]; particles=[]; pickups=[];

    plats.push({x: W/2-45, y: H-20, w: 90, h: 12, type:'solid', vx:0, life:Infinity});
    for(let i=1;i<14;i++) plats.push(makePlat(H-20 - i*58));
  }

  function makePlat(y){
    const w=60, h=10, r=Math.random();
    if(r<0.15) return {x:rand(0,W-w), y, w, h, type:'move', vx:randSign()*rand(0.5,1.0), life:Infinity};
    if(r<0.30) return {x:rand(0,W-w), y, w, h, type:'disappear', vx:0, life:2};
    if(r<0.40) return {x:rand(0,W-w), y, w, h, type:'crumble', vx:0, life:1};
    return {x:rand(0,W-w), y, w, h, type:'solid', vx:0, life:Infinity};
  }
  function spawnMob(y){
    const t = Math.random();
    if(t<0.5) mobs.push({x:rand(10,W-30), y, w:24, h:20, type:'walker', vx:randSign()*rand(0.6,1.2), vy:0, alive:true});
    else      mobs.push({x:rand(10,W-30), y, w:20, h:18, type:'flyer',  vx:randSign()*rand(0.5,1.0), vy:rand(-0.35,0.35), alive:true, ph:Math.random()*6.28});
  }
  function spawnPickup(y){
    const r=Math.random();
    if(r<0.05)      pickups.push({x:rand(10,W-20), y, w:18,h:18, type:'boots'});
    else if(r<0.08) pickups.push({x:rand(10,W-20), y, w:18,h:18, type:'jetpack'});
    else if(r<0.11) pickups.push({x:rand(10,W-20), y, w:18,h:18, type:'shield'});
  }
  function shoot(){
    if(player.shotCooldown>0) return;
    bullets.push({x:player.x+player.w/2-2, y:player.y, vy:-8.2, r:3});
    player.shotCooldown=10;
    tg.HapticFeedback.impactOccurred('light');
  }

  function rand(a,b){ return Math.random()*(b-a)+a; }
  function randSign(){ return Math.random()<0.5?-1:1; }

  function update(){
    // Tilt control (mid-sensitivity, smoothed)
    if(tiltEnabled){
      const target = tiltX * player.baseSpeed * 2.4;
      player.vx += (target - player.vx)*0.35;
      if(Math.abs(player.vx)<0.06) player.vx=0;
    }
    if(pointerShoot) shoot();
    if(player.shotCooldown>0) player.shotCooldown--;
    if(player.invul>0) player.invul--;

    // Physics with jetpack
    if(player.jetpack>0){
      player.vy += 0.15;
      player.vy = Math.min(player.vy, -4.2);
      player.jetpack--;
      particles.push({x:player.x+player.w/2+rand(-3,3), y:player.y+player.h, life:12, color:'#fa5'});
    }else{
      player.vy += 0.35;
    }
    player.x += player.vx;
    player.y += player.vy;

    if(player.vx>0) player.dir=1; else if(player.vx<0) player.dir=-1;
    if(player.x<-player.w) player.x=W;
    if(player.x>W) player.x=-player.w;

    // Move platforms
    plats.forEach(p=>{
      if(p.type==='move'){
        p.x += p.vx;
        if(p.x<0 || p.x+p.w>W) p.vx*=-1;
      }
    });

    // Landing on platforms
    if(player.vy>0){
      for(const p of plats){
        if(player.x+player.w>p.x && player.x<p.x+p.w &&
           player.y+player.h>p.y && player.y+player.h<p.y+p.h + player.vy){
          player.y = p.y - player.h;
          const boost = player.boots>0 ? 1.5 : 1;
          player.vy = player.jump*boost;
          tg.HapticFeedback.impactOccurred('light');
          if(p.type==='crumble' || p.type==='disappear'){
            p.life--; if(p.life<=0) p.y=-9999;
          }
          if(Math.random()<0.02 && typeof onAttemptDrop==='function') onAttemptDrop('landing');
          break;
        }
      }
    }

    // Mobs
    mobs.forEach(m=>{
      if(!m.alive) return;
      if(m.type==='walker'){
        m.x+=m.vx; if(m.x<0||m.x+m.w>W) m.vx*=-1;
      }else{
        m.ph+=0.04; m.x+=m.vx; m.y += Math.sin(m.ph)*0.9 + m.vy;
        if(m.x<0||m.x+m.w>W) m.vx*=-1;
      }
      // bullets
      for(const b of bullets){
        if(b.x>m.x && b.x<m.x+m.w && b.y>m.y && b.y<m.y+m.h){
          m.alive=false; b.y=-9999;
          particles.push({x:m.x+m.w/2,y:m.y,life:28,color:'#f66'});
          tg.HapticFeedback.impactOccurred('medium');
          if(Math.random()<0.03 && typeof onAttemptDrop==='function') onAttemptDrop('kill');
        }
      }
      // collide with player
      if(m.alive &&
         player.x+player.w>m.x && player.x<m.x+m.w &&
         player.y+player.h>m.y && player.y<m.y+m.h){
        if(player.vy>0 && player.y<m.y){
          m.alive=false; player.vy = player.jump*(player.boots>0?1.6:1);
          particles.push({x:m.x+m.w/2,y:m.y,life:28,color:'#6f6'});
          tg.HapticFeedback.impactOccurred('medium');
          if(Math.random()<0.03 && typeof onAttemptDrop==='function') onAttemptDrop('kill');
        }else if(player.invul===0){
          if(player.shield>0){
            player.shield=0; player.invul=45;
            particles.push({x:player.x+player.w/2,y:player.y,life:18,color:'#4ef'});
            tg.HapticFeedback.impactOccurred('light');
          }else{
            running=false; // game over
          }
        }
      }
    });

    // Bullets (remove when above camera)
    bullets.forEach(b=>{ b.y += b.vy; });
    bullets = bullets.filter(b=> b.y > camY - 40);

    // Pickups
    pickups.forEach(f=>{
      if(player.x+player.w>f.x && player.x<f.x+f.w &&
         player.y+player.h>f.y && player.y<f.y+f.h){
        if(f.type==='boots')   player.boots   = 60*6;
        if(f.type==='jetpack') player.jetpack = 60*4;
        if(f.type==='shield')  player.shield  = 1;
        f.y=-9999;
        particles.push({x:f.x+f.w/2,y:f.y,life:20,color:'#fff'});
        tg.HapticFeedback.impactOccurred('light');
      }
    });

    // Camera — мягкая без дрожи (вверх только)
    const desired = player.y - H*0.55;
    if(desired < camY){
      camY += (desired - camY)*0.12; // сглаженно
    }

    // Generate upwards
    while(plats.length && plats[plats.length-1].y > camY - 40){
      const yTop = plats[plats.length-1].y - rand(56,64);
      plats.push(makePlat(yTop));
      if(Math.random()<0.22) spawnPickup(yTop-40);
      if(Math.random()<0.25) spawnMob(yTop-30);
      if(plats.length>54) plats.splice(0,1);
    }

    // Meters: считаем от стартовой точки игрока (без зависимости от камеры)
    if(player.y < minY) minY = player.y;
    const meters = Math.max(0, Math.floor((baseY - minY)/10));
    if(meters !== prevMeters){ prevMeters = meters; onScore?.(meters); }

    // Death by fall
    if(player.y - camY > H+72) running=false;

    // Timers
    if(player.boots>0) player.boots--;
    if(player.invul>0) player.invul--;
  }

  function updateParticles(){
    particles.forEach(p=>{ p.life--; });
    particles = particles.filter(p=> p.life>0);
  }

  function draw(){
    // Cosmic BG by meters
    const hue = (220 + (prevMeters/4)) % 360;
    const g = ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0, `hsl(${hue},30%,10%)`);
    g.addColorStop(1, `hsl(${(hue+40)%360},35%,15%)`);
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);

    drawStars(starsA, 0.2); drawStars(starsB, 0.35); drawStars(starsC, 0.55);
    function drawStars(arr, par){
      ctx.fillStyle='#fff';
      arr.forEach(s=>{
        let y = (s.y + camY*par) % H;
        if(y<0) y += H;
        ctx.globalAlpha = 0.5;
        ctx.fillRect(s.x, y, s.r, s.r);
      }); ctx.globalAlpha=1;
    }

    const offY = -camY;

    // Nebula rings
    ctx.strokeStyle=`hsla(${(hue+80)%360},70%,60%,0.2)`; ctx.lineWidth=2;
    for(let i=0;i<3;i++){ ctx.beginPath(); ctx.arc(W/2, (H/2)+offY + i*120, 120+i*30, 0, Math.PI*2); ctx.stroke(); }

    // Platforms
    plats.forEach(p=>{
      if(p.y+offY>H+20) return;
      let grad = ctx.createLinearGradient(p.x, p.y+offY, p.x, p.y+offY+p.h);
      if(p.type==='solid'){ grad.addColorStop(0,'#2c2f48'); grad.addColorStop(1,'#3b3f66'); }
      else if(p.type==='move'){ grad.addColorStop(0,'#234457'); grad.addColorStop(1,'#2f6e86'); }
      else if(p.type==='crumble'){ grad.addColorStop(0,'#52333a'); grad.addColorStop(1,'#8a4958'); }
      else { grad.addColorStop(0,'#3c3052'); grad.addColorStop(1,'#5b4b8a'); }
      ctx.fillStyle=grad; ctx.fillRect(p.x, p.y+offY, p.w, p.h);
      ctx.strokeStyle='rgba(255,255,255,0.08)'; ctx.strokeRect(p.x, p.y+offY, p.w, p.h);
    });

    // Mobs
    mobs.forEach(m=>{
      if(!m.alive) return;
      const y=m.y+offY; if(y<-30||y>H+30) return;
      drawMob(m.x,y,m.w,m.h, m.type==='walker'?'#ff6b6b':'#45b7d1');
    });

    // Pickups
    pickups.forEach(f=>{
      const y=f.y+offY; if(y<-30||y>H+30) return;
      drawPickup(f.x,y,f.w,f.h,f.type);
    });

    // Bullets
    ctx.fillStyle='#fff';
    bullets.forEach(b=>{ ctx.beginPath(); ctx.arc(b.x, b.y+offY, b.r, 0, Math.PI*2); ctx.fill(); });

    // Player
    drawPlayer(player.x, player.y+offY);

    // Particles
    particles.forEach(p=>{
      ctx.globalAlpha=Math.max(0,p.life/18);
      ctx.fillStyle=p.color; ctx.fillRect(p.x-2, p.y+offY-2, 4,4);
    }); ctx.globalAlpha=1;
  }

  function drawMob(x,y,w,h,color){
    const g = ctx.createLinearGradient(x,y,x,y+h);
    g.addColorStop(0,color); g.addColorStop(1,'#fff5');
    ctx.fillStyle=g; ctx.fillRect(x,y,w,h);
    ctx.fillStyle='#000'; ctx.fillRect(x+4,y+5,3,3); ctx.fillRect(x+w-7,y+5,3,3);
  }
  function drawPickup(x,y,w,h,type){
    const c = type==='boots'?'#feca57':type==='jetpack'?'#ff8e53':'#4ecdc4';
    ctx.fillStyle=c; ctx.beginPath();
    ctx.moveTo(x+w/2,y); ctx.lineTo(x+w,y+h/2); ctx.lineTo(x+w/2,y+h); ctx.lineTo(x,y+h/2); ctx.closePath();
    ctx.fill();
  }
  function drawPlayer(x,y){
    ctx.fillStyle='#e9ecef'; ctx.fillRect(x,y, player.w,player.h);
    ctx.fillStyle='#45b7d1'; ctx.fillRect(x+4,y+4, player.w-8, 8);
    if(player.jetpack>0){ ctx.fillStyle='rgba(255,150,0,0.7)'; ctx.fillRect(x+player.w/2-2, y+player.h, 4, 10); }
    if(player.shield>0 || player.invul>0){ ctx.strokeStyle='rgba(78,205,196,0.8)'; ctx.lineWidth=2; ctx.strokeRect(x-2,y-2,player.w+4,player.h+4); }
  }

  function loop(){
    if(!running){ onGameOver?.(prevMeters); return; }
    if(!paused){ update(); updateParticles(); draw(); }
    raf = requestAnimationFrame(loop);
  }

  function start(){ stop(); reset(); running=true; paused=false; enableTilt(); loop(); }
  function stop(){ running=false; paused=false; cancelAnimationFrame(raf); }

  return {
    start, stop,
    pause: ()=>{ paused=true; },
    resume: ()=>{ paused=false; },
    enableTilt // на всякий случай
  };
};
