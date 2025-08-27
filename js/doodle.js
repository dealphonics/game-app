// Doodle Jump • premium (fixed meters, smoother camera, moderate tilt, proper shooting,
// invulnerability with boots/jetpack, stylized models)
window.Doodle = function(canvas, onScore, onAttemptDrop, onGameOver){
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  // State
  let running=false, paused=false, raf=0;
  let camY=0, prevMeters=0;
  let baseY=0, minY=0;

  // Player
  const player = {
    x: W/2, y: H-100, w: 28, h: 36,
    vx: 0, vy: 0, baseSpeed: 3.2, jump: -9.8,
    dir: 1,
    invul: 0,       // frames after hit
    shield: 0,      // 0/1
    jetpack: 0,     // frames
    boots: 0,       // frames
    shotCooldown: 0 // frames
  };

  // World arrays
  let plats=[], mobs=[], bullets=[], particles=[], pickups=[];

  // Input
  let tiltEnabled=false, tiltX=0;

  // Stars parallax
  const starsA = spawnStars(35), starsB=spawnStars(25), starsC=spawnStars(15);
  function spawnStars(n){ return Array.from({length:n},()=>({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.5+0.5})) }

  // Enable tilt on start (works under user gesture "Играть")
  function enableTilt(){
    if(tiltEnabled) return;
    if(typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function'){
      DeviceOrientationEvent.requestPermission()
        .then(state=>{
          if(state==='granted'){ window.addEventListener('deviceorientation', onTilt, {passive:true}); tiltEnabled=true; }
        }).catch(()=>{ /* ignore */ });
    } else {
      window.addEventListener('deviceorientation', onTilt, {passive:true});
      tiltEnabled=true;
    }
  }
  function onTilt(e){
    if(e && typeof e.gamma==='number'){
      // умеренная чувствительность
      const g = Math.max(-20, Math.min(20, e.gamma));
      tiltX = g / 15; // ~-1.3..1.3
    }
  }

  // Shooting by tap — одиночный выстрел сразу
  canvas.addEventListener('pointerdown', shoot, {passive:true});
  canvas.addEventListener('touchstart', shoot, {passive:true});

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

    baseY = player.y;
    minY = player.y;

    plats=[]; mobs=[]; bullets=[]; particles=[]; pickups=[];

    plats.push({x: W/2-45, y: H-22, w: 90, h: 12, type:'solid', vx:0, life:Infinity});
    for(let i=1;i<14;i++) plats.push(makePlat(H-22 - i*58));
  }

  function makePlat(y){
    const w=64, h=10, r=Math.random();
    if(r<0.15) return {x:rand(0,W-w), y, w, h, type:'move', vx:randSign()*rand(0.5,1.0), life:Infinity};
    if(r<0.30) return {x:rand(0,W-w), y, w, h, type:'disappear', vx:0, life:2};
    if(r<0.40) return {x:rand(0,W-w), y, w, h, type:'crumble', vx:0, life:1};
    return {x:rand(0,W-w), y, w, h, type:'solid', vx:0, life:Infinity};
  }
  function spawnMob(y){
    const t = Math.random();
    if(t<0.5) mobs.push({x:rand(10,W-30), y, w:26, h:22, type:'walker', vx:randSign()*rand(0.6,1.2), vy:0, alive:true});
    else      mobs.push({x:rand(10,W-30), y, w:22, h:20, type:'flyer',  vx:randSign()*rand(0.5,1.0), vy:rand(-0.35,0.35), alive:true, ph:Math.random()*6.28});
  }
  function spawnPickup(y){
    const r=Math.random();
    if(r<0.05)      pickups.push({x:rand(10,W-20), y, w:20,h:18, type:'boots'});
    else if(r<0.08) pickups.push({x:rand(10,W-20), y, w:18,h:22, type:'jetpack'});
    else if(r<0.11) pickups.push({x:rand(10,W-20), y, w:20,h:20, type:'shield'});
  }

  function shoot(){
    if(player.shotCooldown>0) return;
    bullets.push({x:player.x+player.w/2-2, y:player.y+2, vy:-8.4, r:3});
    player.shotCooldown=10;
    tg.HapticFeedback.impactOccurred('light');
  }

  function rand(a,b){ return Math.random()*(b-a)+a; }
  function randSign(){ return Math.random()<0.5?-1:1; }

  function update(){
    // Tilt: средняя чувствительность + сглаживание
    if(tiltEnabled){
      const target = tiltX * player.baseSpeed * 2.6;
      player.vx += (target - player.vx)*0.4;
      if(Math.abs(player.vx)<0.06) player.vx=0;
    }
    if(player.shotCooldown>0) player.shotCooldown--;
    if(player.invul>0) player.invul--;

    // Invulnerability while gear active
    const gearInvul = (player.jetpack>0 || player.boots>0);

    // Physics
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

    // Platforms
    plats.forEach(p=>{
      if(p.type==='move'){ p.x+=p.vx; if(p.x<0||p.x+p.w>W) p.vx*=-1; }
    });

    // Landing
    if(player.vy>0){
      for(const p of plats){
        if(player.x+player.w>p.x && player.x<p.x+p.w &&
           player.y+player.h>p.y && player.y+player.h<p.y+p.h + player.vy){
          player.y = p.y - player.h;
          const boost = player.boots>0 ? 1.65 : 1;
          player.vy = player.jump*boost;
          tg.HapticFeedback.impactOccurred('light');
          if(p.type==='crumble'||p.type==='disappear'){ p.life--; if(p.life<=0) p.y=-9999; }
          if(Math.random()<0.02 && typeof onAttemptDrop==='function') onAttemptDrop('landing');
          break;
        }
      }
    }

    // Mobs
    mobs.forEach(m=>{
      if(!m.alive) return;
      if(m.type==='walker'){ m.x+=m.vx; if(m.x<0||m.x+m.w>W) m.vx*=-1; }
      else{ m.ph+=0.04; m.x+=m.vx; m.y+= Math.sin(m.ph)*0.9 + m.vy; if(m.x<0||m.x+m.w>W) m.vx*=-1; }

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
          m.alive=false; player.vy = player.jump*(player.boots>0?1.7:1);
          particles.push({x:m.x+m.w/2,y:m.y,life:28,color:'#6f6'});
          tg.HapticFeedback.impactOccurred('medium');
          if(Math.random()<0.03 && typeof onAttemptDrop==='function') onAttemptDrop('kill');
        }else{
          // gear invulnerability or shield/invul
          if(gearInvul || player.invul>0 || player.shield>0){
            if(player.shield>0){ player.shield=0; player.invul=45; }
            else { player.invul = Math.max(player.invul, 30); }
            // мягкий отскок
            player.vy = -3;
            tg.HapticFeedback.impactOccurred('light');
          }else{
            running=false; // game over
          }
        }
      }
    });

    // Bullets (remove when above camera)
    bullets.forEach(b=>{ b.y += b.vy; });
    bullets = bullets.filter(b=> b.y > camY - 60);

    // Pickups
    pickups.forEach(f=>{
      if(player.x+player.w>f.x && player.x<f.x+f.w &&
         player.y+player.h>f.y && player.y<f.y+f.h){
        if(f.type==='boots')   player.boots   = 60*6;   // 6s
        if(f.type==='jetpack') player.jetpack = 60*4;   // 4s
        if(f.type==='shield')  player.shield  = 1;      // until hit
        f.y=-9999;
        particles.push({x:f.x+f.w/2,y:f.y,life:20,color:'#fff'});
        tg.HapticFeedback.impactOccurred('light');
      }
    });

    // Camera (smooth, no jitter)
    const desired = player.y - H*0.58;
    if(desired < camY){ camY += (desired - camY)*0.12; }

    // Generate upwards
    while(plats.length && plats[plats.length-1].y > camY - 40){
      const yTop = plats[plats.length-1].y - rand(56,64);
      plats.push(makePlat(yTop));
      if(Math.random()<0.22) spawnPickup(yTop-40);
      if(Math.random()<0.25) spawnMob(yTop-30);
      if(plats.length>54) plats.splice(0,1);
    }

    // Meters independent of camera — от базовой точки
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

    // Platforms (stylish)
    plats.forEach(p=>{
      if(p.y+offY>H+20) return;
      let grad = ctx.createLinearGradient(p.x, p.y+offY, p.x, p.y+offY+p.h);
      if(p.type==='solid'){ grad.addColorStop(0,'#2c2f48'); grad.addColorStop(1,'#3b3f66'); }
      else if(p.type==='move'){ grad.addColorStop(0,'#234457'); grad.addColorStop(1,'#2f6e86'); }
      else if(p.type==='crumble'){ grad.addColorStop(0,'#52333a'); grad.addColorStop(1,'#8a4958'); }
      else { grad.addColorStop(0,'#3c3052'); grad.addColorStop(1,'#5b4b8a'); }
      ctx.fillStyle=grad; roundRect(p.x, p.y+offY, p.w, p.h, 3, true);
      ctx.strokeStyle='rgba(255,255,255,0.08)'; roundRect(p.x, p.y+offY, p.w, p.h, 3, false);
    });

    // Mobs (rounded body, eyes, teeth)
    mobs.forEach(m=>{
      if(!m.alive) return;
      const y=m.y+offY; if(y<-30||y>H+30) return;
      drawMob(m.x,y,m.w,m.h, m.type==='walker'?'#ff6b6b':'#45b7d1');
    });

    // Pickups — модельки
    pickups.forEach(f=>{
      const y=f.y+offY; if(y<-30||y>H+30) return;
      if(f.type==='boots')   drawBoots(f.x,y,f.w,f.h);
      else if(f.type==='jetpack') drawJetpack(f.x,y,f.w,f.h);
      else drawShield(f.x,y,f.w,f.h);
    });

    // Bullets
    bullets.forEach(b=>{
      ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(b.x, b.y+offY, b.r, 0, Math.PI*2); ctx.fill();
      // light trail
      ctx.fillStyle='rgba(255,255,255,0.2)'; ctx.fillRect(b.x-1, b.y+offY+2, 2, 6);
    });

    // Player — “не копия”, но близко по духу
    drawPlayer(player.x, player.y+offY);

    // Particles
    particles.forEach(p=>{
      ctx.globalAlpha=Math.max(0,p.life/18);
      ctx.fillStyle=p.color; ctx.fillRect(p.x-2, p.y+offY-2, 4,4);
    }); ctx.globalAlpha=1;
  }

  function roundRect(x,y,w,h,r,fill){
    ctx.beginPath();
    ctx.moveTo(x+r,y);
    ctx.arcTo(x+w,y,x+w,y+h,r);
    ctx.arcTo(x+w,y+h,x,y+h,r);
    ctx.arcTo(x,y+h,x,y,r);
    ctx.arcTo(x,y,x+w,y,r);
    if(fill) ctx.fill(); else ctx.stroke();
  }

  function drawMob(x,y,w,h,base){
    const body = ctx.createLinearGradient(x,y,x,y+h);
    body.addColorStop(0, base);
    body.addColorStop(1, '#fff5');
    ctx.fillStyle=body;
    roundRect(x,y,w,h,5,true);

    // eyes
    ctx.fillStyle='#000';
    ctx.beginPath(); ctx.arc(x+6,y+6,2,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(x+w-6,y+6,2,0,Math.PI*2); ctx.fill();

    // mouth
    ctx.strokeStyle='#000'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(x+5,y+h-7); ctx.lineTo(x+w-5,y+h-7); ctx.stroke();
  }

  function drawBoots(x,y,w,h){
    // подошва
    ctx.fillStyle='#f5d66d';
    roundRect(x, y+h-6, w, 6, 3, true);
    // голенище
    ctx.fillStyle='#f1c40f';
    roundRect(x+3, y+2, w-6, h-8, 4, true);
    // блеск
    ctx.fillStyle='rgba(255,255,255,0.2)'; ctx.fillRect(x+4,y+4, w-10, 2);
  }
  function drawJetpack(x,y,w,h){
    // корпус
    ctx.fillStyle='#ff8e53';
    roundRect(x+2, y+2, w-4, h-8, 4, true);
    // сопла
    ctx.fillStyle='#c0392b';
    roundRect(x+4, y+h-8, 6, 6, 2, true);
    roundRect(x+w-10, y+h-8, 6, 6, 2, true);
    // индикатор
    ctx.fillStyle='#fff'; ctx.fillRect(x+w/2-2, y+6, 4, 6);
  }
  function drawShield(x,y,w,h){
    ctx.strokeStyle='rgba(78,205,196,0.9)'; ctx.lineWidth=2;
    roundRect(x+2,y+2,w-4,h-4,6,false);
  }

  function drawPlayer(x,y){
    // тело — слегка овал
    ctx.fillStyle='#eceff4';
    roundRect(x, y, player.w, player.h, 6, true);

    // визор
    ctx.fillStyle='#45b7d1';
    roundRect(x+5, y+5, player.w-10, 9, 4, true);

    // ножки
    ctx.fillStyle='#777';
    ctx.fillRect(x+5, y+player.h-4, 6, 4);
    ctx.fillRect(x+player.w-11, y+player.h-4, 6, 4);

    // пламя от jetpack
    if(player.jetpack>0){
      ctx.fillStyle='rgba(255,150,0,0.8)';
      ctx.fillRect(x+player.w/2-2, y+player.h, 4, 12);
    }

    // аура щита/неуязвимости
    if(player.shield>0 || player.invul>0 || player.jetpack>0 || player.boots>0){
      ctx.strokeStyle='rgba(78,205,196,0.9)'; ctx.lineWidth=2;
      roundRect(x-2, y-2, player.w+4, player.h+4, 8, false);
    }
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
    enableTilt
  };
};
