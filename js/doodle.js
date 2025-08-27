// Doodle Jump • премиум версия (наклон, выстрелы, мобы, бонусы, космический фон)
window.Doodle = function(canvas, onScore, onUnlock){
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  // World/state
  let running=false, paused=false, raf=0;
  let camY=0, maxMeters=0, gravity=0.35;

  // Player
  const player = {
    x: W/2, y: H-100, w: 26, h: 34,
    vx: 0, vy: 0, baseSpeed: 3.2, jump: -9.8,
    dir: 1, // 1 right, -1 left
    shield: 0, jetpack: 0, boots: 0, // timers (frames)
    shotCooldown: 0
  };

  // Arrays
  let plats=[], mobs=[], bullets=[], particles=[], pickups=[];

  // Input
  let tiltEnabled=false, tiltX=0, pointerShoot=false;

  // Background state
  const starsA = spawnStars(35), starsB=spawnStars(25), starsC=spawnStars(15);
  function spawnStars(n){ return Array.from({length:n},()=>({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.5+0.5})) }

  // Permissions (iOS)
  function enableTilt(){
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function'){
      DeviceOrientationEvent.requestPermission().then(state=>{
        if(state==='granted'){
          window.addEventListener('deviceorientation', onTilt);
          tiltEnabled=true;
          tg.showAlert('Наклон включён');
        }else{
          tg.showAlert('Доступ к акселерометру отклонён');
        }
      }).catch(()=> tg.showAlert('Не удалось запросить доступ к акселерометру'));
    }else{
      window.addEventListener('deviceorientation', onTilt);
      tiltEnabled=true;
      tg.showAlert('Наклон включён');
    }
  }
  function onTilt(e){
    // gamma: -90..90 (наклон влево/вправо)
    if(e && typeof e.gamma === 'number'){
      const g = Math.max(-30, Math.min(30, e.gamma));
      tiltX = g/30; // -1..1
    }
  }

  // Shooting by pointer/tap
  canvas.addEventListener('pointerdown', ()=>{ pointerShoot=true; }, {passive:true});
  canvas.addEventListener('pointerup', ()=>{ pointerShoot=false; }, {passive:true});
  canvas.addEventListener('touchstart', ()=>{ pointerShoot=true; }, {passive:true});
  canvas.addEventListener('touchend', ()=>{ pointerShoot=false; }, {passive:true});

  // Keyboard fallback
  window.addEventListener('keydown', e=>{
    if(e.key==='ArrowLeft'||e.key==='a') player.vx=-player.baseSpeed;
    if(e.key==='ArrowRight'||e.key==='d') player.vx=player.baseSpeed;
    if(e.key===' ') shoot();
  });
  window.addEventListener('keyup', e=>{
    if(e.key==='ArrowLeft'||e.key==='a'||e.key==='ArrowRight'||e.key==='d') player.vx=0;
  });

  // API to request tilt outside
  function requestTilt(){ enableTilt(); }

  // Init world
  function reset(){
    camY=0; maxMeters=0;
    player.x=W/2; player.y=H-100; player.vx=0; player.vy=0;
    player.shield=0; player.jetpack=0; player.boots=0; player.shotCooldown=0;
    plats=[]; mobs=[]; bullets=[]; particles=[]; pickups=[];

    // base platform
    plats.push({x: W/2-45, y: H-20, w: 90, h: 12, type:'solid', vx:0, life:Infinity});
    // upper platforms
    for (let i=1;i<12;i++) plats.push(makePlat(H-20 - i*60));
  }

  function makePlat(y){
    const w=60, h=10;
    const r=Math.random();
    if(r<0.15) return {x:rand(0,W-w), y, w, h, type:'move', vx:randSign()*rand(0.4,0.9), life:Infinity};
    if(r<0.30) return {x:rand(0,W-w), y, w, h, type:'disappear', vx:0, life:2}; // исчезает через 2 касания
    if(r<0.40) return {x:rand(0,W-w), y, w, h, type:'crumble', vx:0, life:1};    // ломается сразу
    return {x:rand(0,W-w), y, w, h, type:'solid', vx:0, life:Infinity};
  }

  function spawnMob(y){
    const t = Math.random();
    if(t<0.5){
      // walker
      mobs.push({x:rand(10,W-30), y, w:24, h:20, type:'walker', vx:randSign()*rand(0.5,1.0), vy:0, alive:true});
    }else{
      // flyer
      mobs.push({x:rand(10,W-30), y, w:20, h:18, type:'flyer', vx:randSign()*rand(0.4,0.8), vy:rand(-0.3,0.3), alive:true, phase:Math.random()*Math.PI*2});
    }
  }

  function spawnPickup(y){
    const r=Math.random();
    if(r<0.05) pickups.push({x:rand(10,W-20), y, w:18,h:18, type:'boots'});
    else if(r<0.08) pickups.push({x:rand(10,W-20), y, w:18,h:18, type:'jetpack'});
    else if(r<0.11) pickups.push({x:rand(10,W-20), y, w:18,h:18, type:'shield'});
  }

  function shoot(){
    if(player.shotCooldown>0) return;
    bullets.push({x:player.x+player.w/2-2, y:player.y, vx:0, vy:-7, r:3});
    player.shotCooldown=12; // ~200ms
    tg.HapticFeedback.impactOccurred('light');
  }

  // Helpers
  function rand(a,b){ return Math.random()*(b-a)+a; }
  function randSign(){ return Math.random()<0.5?-1:1; }

  // Update
  function update(){
    // Input
    if(tiltEnabled){
      player.vx = tiltX * player.baseSpeed * 1.5;
      if(Math.abs(player.vx)<0.1) player.vx=0;
    }
    if(pointerShoot) shoot();
    if(player.shotCooldown>0) player.shotCooldown--;

    // Physics
    // Jetpack thrust
    if(player.jetpack>0){
      player.vy += 0.15; // мягче
      player.vy = Math.min(player.vy, -3.8); // удерживаем подъём
      player.jetpack--;
      flame(player.x+player.w/2, player.y+player.h);
    }else{
      player.vy += gravity;
    }

    player.x += player.vx;
    player.y += player.vy;
    if(player.vx>0) player.dir=1; else if(player.vx<0) player.dir=-1;
    // wrap X
    if(player.x<-player.w) player.x=W;
    if(player.x>W) player.x=-player.w;

    // Platforms movement
    plats.forEach(p=>{
      if(p.type==='move'){
        p.x += p.vx;
        if(p.x<0 || p.x+p.w>W) p.vx*=-1;
      }
    });

    // Landing on platforms (only when falling)
    if(player.vy>0){
      for(const p of plats){
        if(player.x+player.w>p.x && player.x<p.x+p.w &&
           player.y+player.h>p.y && player.y+player.h<p.y+p.h + player.vy){
          // Landing
          player.y = p.y - player.h;
          let boost = player.boots>0 ? 1.45 : 1;
          player.vy = player.jump*boost;
          tg.HapticFeedback.impactOccurred('light');
          if(p.type==='crumble' || p.type==='disappear'){
            p.life--;
            if(p.life<=0){
              // crumble/vanish effect
              particles.push({x:p.x+p.w/2,y:p.y,life:25,color:'#889'});
              p.y = -9999; // remove later
            }
          }
          // Occasionally unlock
          if(Math.random()<0.07 && typeof onUnlock==='function') onUnlock();
          break;
        }
      }
    }

    // Enemies
    mobs.forEach(m=>{
      if(!m.alive) return;
      if(m.type==='walker'){
        m.x += m.vx;
        if(m.x<0 || m.x+m.w>W) m.vx*=-1;
      }else if(m.type==='flyer'){
        m.phase += 0.04;
        m.x += m.vx;
        m.y += Math.sin(m.phase)*0.8 + m.vy;
        if(m.x<0 || m.x+m.w>W) m.vx*=-1;
      }
      // Collision with bullets
      for(const b of bullets){
        if(b.x>b.x && b.y>b.y){} // noop to keep lints away
        if(b.x>m.x && b.x<m.x+m.w && b.y>m.y && b.y<m.y+m.h){
          m.alive=false; b.y=-9999;
          particles.push({x:m.x+m.w/2,y:m.y,life:30,color:'#f66'});
          tg.HapticFeedback.impactOccurred('medium');
          if(Math.random()<0.15 && typeof onUnlock==='function') onUnlock();
        }
      }
      // Collision with player
      if(m.alive &&
         player.x+player.w>m.x && player.x<m.x+m.w &&
         player.y+player.h>m.y && player.y<m.y+m.h){
        if(player.vy>0 && player.y < m.y){ // stomp
          m.alive=false;
          player.vy = player.jump * (player.boots>0?1.5:1);
          particles.push({x:m.x+m.w/2,y:m.y,life:30,color:'#6f6'});
          tg.HapticFeedback.impactOccurred('medium');
          if(Math.random()<0.12 && typeof onUnlock==='function') onUnlock();
        }else{
          // hit
          if(player.shield>0){
            player.shield=0;
            particles.push({x:player.x+player.w/2,y:player.y,life:18,color:'#4ef'});
            tg.HapticFeedback.impactOccurred('light');
          }else{
            running=false; // game over
          }
        }
      }
    });

    // Bullets
    bullets.forEach(b=>{
      b.y += b.vy;
    });
    bullets = bullets.filter(b=> b.y>-20);

    // Pickups
    pickups.forEach(f=>{
      // collide with player
      if(player.x+player.w>f.x && player.x<f.x+f.w &&
         player.y+player.h>f.y && player.y<f.y+f.h){
        if(f.type==='boots') player.boots = 60*6;      // 6s
        if(f.type==='jetpack') player.jetpack = 60*4;  // 4s
        if(f.type==='shield') player.shield = 1;
        f.y = -9999;
        particles.push({x:f.x+f.w/2,y:f.y,life:22,color:'#fff'});
        tg.HapticFeedback.impactOccurred('light');
      }
    });
    pickups = pickups.filter(p=> p.y> -1000);

    // Camera and world generation
    const targetCam = Math.min(camY, player.y - H*0.55);
    camY += (targetCam - camY) * 0.15;

    // generate upward content
    const topY = camY;
    // ensure last platform exists above
    while(plats.length && plats[plats.length-1].y > topY - 40){
      const yTop = plats[plats.length-1].y - rand(56,64);
      const p = makePlat(yTop);
      plats.push(p);
      if(Math.random()<0.25) spawnMob(yTop-30);
      if(Math.random()<0.22) spawnPickup(yTop-40);
      if(plats.length>48) plats.splice(0,1);
    }

    // score meters
    const meters = Math.max(0, ((H - (player.y - camY)) / 10) | 0);
    if(meters>maxMeters){ maxMeters=meters; onScore?.(maxMeters); }

    // fall below
    if(player.y - camY > H+72){ running=false; }

    // timers
    if(player.boots>0) player.boots--;
    if(player.shield>0) { /* stays until hit */ }
  }

  // Particles
  function flame(x,y){
    particles.push({x:x+rand(-3,3), y:y+rand(0,6), life:14, color:'#fa5'});
  }

  function updateParticles(){
    particles.forEach(p=>{
      p.life--;
    });
    particles = particles.filter(p=>p.life>0);
  }

  // Render premium background and entities
  function draw(){
    // Cosmic gradient based on height
    const hue = (220 + (maxMeters/4)) % 360;
    const g = ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0, `hsl(${hue},30%,10%)`);
    g.addColorStop(1, `hsl(${(hue+40)%360},35%,15%)`);
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);

    // Parallax stars (move with cam)
    drawStars(starsA, 0.2);
    drawStars(starsB, 0.35);
    drawStars(starsC, 0.55);

    function drawStars(arr, par){
      ctx.fillStyle='#fff';
      arr.forEach(s=>{
        const y = (s.y + camY*par) % H;
        ctx.globalAlpha = 0.4 + 0.6*Math.random()*0.2;
        ctx.fillRect(s.x, y, s.r, s.r);
      });
      ctx.globalAlpha=1;
    }

    const offY = -camY;

    // Nebula rings
    ctx.strokeStyle=`hsla(${(hue+80)%360},70%,60%,0.2)`;
    ctx.lineWidth=2;
    for(let i=0;i<3;i++){
      ctx.beginPath();
      ctx.arc(W/2, (H/2)+offY + i*120, 120+i*30, 0, Math.PI*2);
      ctx.stroke();
    }

    // Platforms
    plats.forEach(p=>{
      if(p.y+offY>H+20) return;
      let grad = ctx.createLinearGradient(p.x, p.y+offY, p.x, p.y+offY+p.h);
      if(p.type==='solid')      { grad.addColorStop(0,'#2c2f48'); grad.addColorStop(1,'#3b3f66'); }
      else if(p.type==='move')  { grad.addColorStop(0,'#234457'); grad.addColorStop(1,'#2f6e86'); }
      else if(p.type==='crumble'){ grad.addColorStop(0,'#52333a'); grad.addColorStop(1,'#8a4958'); }
      else                      { grad.addColorStop(0,'#3c3052'); grad.addColorStop(1,'#5b4b8a'); }
      ctx.fillStyle=grad;
      ctx.fillRect(p.x, p.y+offY, p.w, p.h);
      // glow
      ctx.strokeStyle='rgba(255,255,255,0.1)'; ctx.strokeRect(p.x, p.y+offY, p.w, p.h);
    });

    // Mobs
    mobs.forEach(m=>{
      if(!m.alive) return;
      const y = m.y+offY;
      if(y<-30 || y>H+30) return;
      if(m.type==='walker'){
        drawMobBox(m.x, y, m.w, m.h, '#ff6b6b', '#ffa1a1');
      }else{
        drawMobBox(m.x, y, m.w, m.h, '#45b7d1', '#8ed9f2');
      }
    });

    // Pickups
    pickups.forEach(f=>{
      const y=f.y+offY; if(y<-30 || y>H+30) return;
      if(f.type==='boots'){ drawGem(f.x,y,f.w,f.h,'#feca57'); }
      if(f.type==='jetpack'){ drawGem(f.x,y,f.w,f.h,'#ff8e53'); }
      if(f.type==='shield'){ drawGem(f.x,y,f.w,f.h,'#4ecdc4'); }
    });

    // Bullets
    ctx.fillStyle='#fff';
    bullets.forEach(b=>{
      ctx.beginPath(); ctx.arc(b.x, b.y+offY, b.r, 0, Math.PI*2); ctx.fill();
    });

    // Player
    drawPlayer(player.x, player.y+offY);

    // Particles
    particles.forEach(p=>{
      ctx.globalAlpha = Math.max(0, p.life/20);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x-2, p.y+offY-2, 4, 4);
    });
    ctx.globalAlpha=1;
  }

  function drawMobBox(x,y,w,h,c1,c2){
    const g = ctx.createLinearGradient(x,y,x,y+h);
    g.addColorStop(0,c1); g.addColorStop(1,c2);
    ctx.fillStyle=g; ctx.fillRect(x,y,w,h);
    ctx.fillStyle='#000'; // eyes
    ctx.fillRect(x+4,y+5,3,3); ctx.fillRect(x+w-7,y+5,3,3);
  }
  function drawGem(x,y,w,h,color){
    ctx.fillStyle=color;
    ctx.beginPath();
    ctx.moveTo(x+w/2,y); ctx.lineTo(x+w,y+h/2); ctx.lineTo(x+w/2,y+h); ctx.lineTo(x,y+h/2); ctx.closePath();
    ctx.fill();
  }
  function drawPlayer(x,y){
    // body
    ctx.fillStyle='#e9ecef'; ctx.fillRect(x,y, player.w, player.h);
    // visor
    ctx.fillStyle='#45b7d1'; ctx.fillRect(x+4,y+4, player.w-8, 8);
    // jet flames if jetpack
    if(player.jetpack>0){
      ctx.fillStyle='rgba(255,150,0,0.7)';
      ctx.fillRect(x+player.w/2-2, y+player.h, 4, 10);
    }
    // shield ring
    if(player.shield>0){
      ctx.strokeStyle='rgba(78,205,196,0.7)'; ctx.lineWidth=2;
      ctx.strokeRect(x-2,y-2, player.w+4, player.h+4);
    }
  }

  // Main loop
  function loop(){
    if(!running) return;
    if(!paused){
      update();
      updateParticles();
      draw();
    }
    raf = requestAnimationFrame(loop);
  }

  function start(){ stop(); reset(); running=true; paused=false; loop(); }
  function stop(){ running=false; paused=false; cancelAnimationFrame(raf); }

  return {
    start, stop,
    pause: ()=>{ paused=true; },
    resume: ()=>{ paused=false; },
    enableTilt: ()=> requestTilt()
  };
};
