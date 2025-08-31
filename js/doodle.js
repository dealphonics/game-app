// Doodle Jump — исправленная версия
// - пружины привязаны к платформам (spring.ox/oy)
// - pickups активируются только когда видимы и активны (устранение самоподборов)
// - стабильное завершение игры (onGameOver вызывается, цикл корректно останавливается)
// - сохранены спрайты и фолбэки

window.Doodle = function(canvas, onScore, onAttemptDrop, onGameOver){
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  // ----- Game state -----
  let running = false, raf = 0, frame = 0;
  let camY = 0, prevMeters = 0, baseY = 0, minY = 0;
  let gameOverCalled = false;

  // ----- Player -----
  const player = {
  x: W/2, y: H-100, w: 40, h: 50,   // было 30x38 → стало больше
  vx: 0, vy: 0,
  baseSpeed: 2.35,
  jump: -10.2,
  dir: 1,
  invul: 0, shield: 0, jetpack: 0, boots: 0, shotCooldown: 0
};

  // ----- Entities -----
  let plats = [], mobs = [], bullets = [], particles = [], pickups = [];

  // ----- Tilt control -----
  let tiltEnabled = false, tiltX = 0;

  // ----- Assets (sprites) -----
  const Spr = {};
  const SPRITES = {
    player: 'img/player.png',
    playerJump: 'img/player_jump.png',
    bullet: 'img/bullet.png',
    plat_solid: 'img/plat_solid.png',
    plat_move: 'img/plat_move.png',
    plat_crumble: 'img/plat_crumble.png',
    plat_disappear: 'img/plat_disappear.png',
    spring: 'img/spring.png',
    boots: 'img/boots.png',
    jetpack: 'img/jetpack.png',
    shield: 'img/shield.png',
    mob_walker: 'img/mob_walker.png',
    mob_flyer: 'img/mob_flyer.png'
  };
  function loadSprites(map){
    Object.keys(map).forEach(k=>{
      const img = new Image();
      img.src = map[k];
      Spr[k] = img;
    });
  }
  loadSprites(SPRITES);

  // ----- Background stars -----
  const starsA = spawnStars(35), starsB = spawnStars(25), starsC = spawnStars(15);
  function spawnStars(n){ return Array.from({length:n},()=>({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.5+0.5})) }

  // ----- Tilt handlers -----
  function enableTilt(){
    if(tiltEnabled) return;
    if(typeof DeviceOrientationEvent !== 'undefined' &&
       typeof DeviceOrientationEvent.requestPermission === 'function'){
      DeviceOrientationEvent.requestPermission()
        .then(state=>{
          if(state==='granted'){ window.addEventListener('deviceorientation', onTilt, {passive:true}); tiltEnabled=true; }
        }).catch(()=>{});
    } else {
      window.addEventListener('deviceorientation', onTilt, {passive:true});
      tiltEnabled=true;
    }
  }
  function onTilt(e){
    if(e && typeof e.gamma==='number'){
      const g = Math.max(-20, Math.min(20, e.gamma));
      tiltX = g / 22; // уменьшенная чувствительность
    }
  }

  // ----- Input -----
  canvas.addEventListener('pointerdown', shoot, {passive:true});
  canvas.addEventListener('touchstart', shoot, {passive:true});
  window.addEventListener('keydown', e=>{
    if(e.key==='ArrowLeft'||e.key==='a') player.vx = -player.baseSpeed*1.8;
    if(e.key==='ArrowRight'||e.key==='d') player.vx =  player.baseSpeed*1.8;
    if(e.key===' ') shoot();
  });
  window.addEventListener('keyup', e=>{
    if(e.key==='ArrowLeft'||e.key==='a'||e.key==='ArrowRight'||e.key==='d') player.vx=0;
  });

  // ----- Helpers -----
  function rand(a,b){ return Math.random()*(b-a)+a; }
  function randSign(){ return Math.random()<0.5?-1:1; }

  // ----- World builders -----
  function reset(){
    camY=0; prevMeters=0; baseY=H-100; minY=H-100; frame=0;
    gameOverCalled=false;

    player.x=W/2; player.y=H-100; player.vx=0; player.vy=0;
    player.shield=0; player.jetpack=0; player.boots=0; player.shotCooldown=0; player.invul=0;

    plats=[]; mobs=[]; bullets=[]; particles=[]; pickups=[];

    // стартовая платформа + несколько вверх
    plats.push(makePlat(W/2-45, H-22, 90, 12, 'solid'));
    for(let i=1;i<14;i++){
      const y = H-22 - i*58;
      const x = rand(20, W-84);
      plats.push(makePlat(x, y, 64, 10, pickPlatType()));
    }
    plats.sort((a,b)=> b.y - a.y);
  }

  function pickPlatType(){
    const r = Math.random();
    if(r<0.15) return 'move';
    if(r<0.30) return 'disappear';
    if(r<0.40) return 'crumble';
    return 'solid';
  }

    // makePlat: пружина привязываем как offset (ox/oy) относительно платформы
  function makePlat(x, y, w, h, type){
  const p = {x, y, w, h, type, vx:0, life:Infinity, spring:null, pickup:null};
  if(type==='move') p.vx = randSign()*rand(0.5,1.0);
  if(type==='disappear') p.life = 2;
  if(type==='crumble')   p.life = 1;

  // пружина
  if(Math.random()<0.10){
    const sw = 20, sh = 12;
    const sx = rand(6, Math.max(6, w - sw - 6));
    const sy = -sh + 2;
    p.spring = { ox: sx, oy: sy, w: sw, h: sh, type: 'spring' };
  }

  // бонус на платформе (реже, чем пружина)
  if(Math.random()<0.08){
    const bw = 26, bh = 26;
    const bx = rand(6, Math.max(6, w - bw - 6));
    const by = -bh; // прямо на платформе
    const kindRoll = Math.random();
    let type = 'boots';
    if(kindRoll<0.33) type='boots';
    else if(kindRoll<0.66) type='jetpack';
    else type='shield';
    p.pickup = { ox: bx, oy: by, w: bw, h: bh, type, active:true };
  }

  return p;
}


    // мобы остаются редкими (10%)
    // spawnNextRow()
if(Math.random()<0.10){
  const t = Math.random();
  if(t<0.55) mobs.push({x:rand(10,W-40), y:yTop-36, w:40, h:36, type:'walker', vx:randSign()*rand(0.6,1.0), vy:0, alive:true, phase:Math.random()*6.28});
  else       mobs.push({x:rand(10,W-36), y:yTop-46, w:36, h:30, type:'flyer',  vx:randSign()*rand(0.5,0.9), vy:rand(-0.3,0.3), alive:true, ph:Math.random()*6.28});
}


    if(plats.length>64) plats.splice(0,1);
  }

  // ----- Shooting -----
  function shoot(){
  if(player.shotCooldown>0) return;
  bullets.push({x:player.x+player.w/2-3, y:player.y+4, vy:-14, r:6}); // r=6 вместо r=3
  player.shotCooldown=9;
  tg.HapticFeedback.impactOccurred('light');
}


  // ----- Update -----
  function update(){
    frame++;

    if(tiltEnabled){
      const target = tiltX * player.baseSpeed * 1.7;
      player.vx += (target - player.vx)*0.35;
      if(Math.abs(player.vx)<0.05) player.vx=0;
    }

    if(player.shotCooldown>0) player.shotCooldown--;
    if(player.invul>0) player.invul--;

    const gearInvul = (player.jetpack>0 || player.boots>0);

    // vertical physics
    if(player.jetpack>0){
      player.vy -= 0.26;
      if(player.vy < -7.8) player.vy = -7.8;
      player.jetpack--;
      particles.push({x:player.x+player.w/2+rand(-2,2), y:player.y+player.h, life:10, color:'#fa5'});
    }else{
      player.vy += 0.35;
    }

    player.x += player.vx; player.y += player.vy;
    if(player.vx>0) player.dir=1; else if(player.vx<0) player.dir=-1;
    if(player.x<-player.w) player.x=W; if(player.x>W) player.x=-player.w;

    // platforms movement
    plats.forEach(p=>{
      if(p.type==='move'){ p.x+=p.vx; if(p.x<0||p.x+p.w>W) p.vx*=-1; }
    });

    // Landing detection (including springs attached to platforms)
    if(player.vy>0){
      for(const p of plats){
        if(player.x+player.w>p.x && player.x<p.x+p.w &&
           player.y+player.h>p.y && player.y+player.h<p.y+p.h + player.vy){

          // check spring on platform (spring coordinates computed from platform)
          if(p.spring){
            const sx = p.x + p.spring.ox;
            const sy = p.y + p.spring.oy;
            const s = { x: sx, y: sy, w: p.spring.w, h: p.spring.h };
            const onSpring = (player.x+player.w> s.x && player.x < s.x+s.w &&
                              player.y+player.h > s.y && player.y+player.h < s.y+s.h + player.vy);
            if(onSpring){
              player.y = s.y - player.h + 2;
              player.vy = player.jump * 2.6;
              particles.push({x:s.x+s.w/2,y:s.y,life:18,color:'#fff'});
              tg.HapticFeedback.impactOccurred('light');
              if(Math.random()<0.02) onAttemptDrop?.('landing');
              break;
            }
          }

          // normal landing
          const boost = player.boots>0 ? 1.7 : 1.0;
          player.y = p.y - player.h;
          player.vy = player.jump*boost;
          tg.HapticFeedback.impactOccurred('light');
          if(p.type==='crumble'||p.type==='disappear'){ p.life--; if(p.life<=0) p.y=-9999; }
          if(Math.random()<0.02) onAttemptDrop?.('landing');
          break;
        }
      }
    }

    // Mobs (safe loop, no early return)
    for (let i=0; i<mobs.length; i++) {
      const m = mobs[i];
      if(!m.alive) continue;

      if(m.type==='walker'){
        m.x += m.vx;
        m.y += Math.sin(frame*0.12 + m.phase)*0.6;
        if(m.x<0||m.x+m.w>W) m.vx*=-1;
      } else {
        m.ph += 0.04;
        m.x += m.vx;
        m.y += Math.sin(m.ph)*1.1 + m.vy;
        if(m.x<0||m.x+m.w>W) m.vx*=-1;
      }

      // bullets hitting mobs
      for(const b of bullets){
        if(b.x>m.x && b.x<m.x+m.w && b.y>m.y && b.y<m.y+m.h){
          m.alive=false; b.y=-9999;
          particles.push({x:m.x+m.w/2,y:m.y,life:26,color:'#f66'});
          tg.HapticFeedback.impactOccurred('medium');
          if(Math.random()<0.03) onAttemptDrop?.('kill');
        }
      }

      // collision with player
      if(player.x+player.w>m.x && player.x<m.x+m.w &&
         player.y+player.h>m.y && player.y<m.y+m.h){

        if(gearInvul || player.invul>0 || player.shield>0){
          const fromTop = (player.vy>0 && player.y < m.y);
          if(fromTop){
            m.alive=false;
            const mult = player.boots>0 ? 1.9 : 1.25;
            player.vy = player.jump * mult;
            particles.push({x:m.x+m.w/2,y:m.y,life:24,color:'#6f6'});
            tg.HapticFeedback.impactOccurred('medium');
            if(player.shield>0) player.shield = Math.max(0, player.shield-1);
            if(Math.random()<0.03) onAttemptDrop?.('kill');
          }
          continue;
        }

        if(player.vy>0 && player.y<m.y){
          m.alive=false;
          const mult = player.boots>0 ? 1.8 : 1.2;
          player.vy = player.jump * mult;
          particles.push({x:m.x+m.w/2,y:m.y,life:24,color:'#6f6'});
          tg.HapticFeedback.impactOccurred('medium');
          if(Math.random()<0.03) onAttemptDrop?.('kill');
        } else {
          gameOver('mob');
        }
      }
    }

    // Bullets
    bullets.forEach(b=>{ b.y += b.vy; });
    bullets = bullets.filter(b=> b.y > camY - 80);

    // Pickups: only check collision when pickup is active and in (or near) screen
    for(let i=0;i<pickups.length;i++){
      const f = pickups[i];
      if(!f || f.active===false) continue;
      // only check if within vertical buffer of camera (prevent offscreen auto-collection)
      if(f.y < camY - 120 || f.y > camY + H + 120) continue;

      if(player.x+player.w>f.x && player.x<f.x+f.w &&
         player.y+player.h>f.y && player.y<f.y+f.h){
        // collect
        if(f.type==='boots')   player.boots   = 60*6;
        if(f.type==='jetpack') player.jetpack = 60*6;
        if(f.type==='shield')  player.shield  = 3;
        f.active = false;
        f.y = -9999;
        particles.push({x:f.x+f.w/2,y:f.y,life:20,color:'#fff'});
        tg.HapticFeedback.impactOccurred('light');
      }
    }

    // Camera
    const desired = player.y - H*0.58;
    if(desired < camY){ camY += (desired - camY)*0.12; }

    // Spawn new rows
    while(plats.length && plats[plats.length-1].y > camY - 40) spawnNextRow();

    // Score in meters
    if(player.y < minY) minY = player.y;
    const meters = Math.max(0, Math.floor((baseY - minY)/10));
    if(meters !== prevMeters){ prevMeters = meters; onScore?.(meters); }

    // Fall-out
    if(player.y - camY > H+72){
      gameOver('fall');
    }

    // Particles cleanup
    particles.forEach(p=>{ p.life--; });
    particles = particles.filter(p=> p.life>0);
  }

  // ----- Robust gameOver handler -----
  function gameOver(reason){
    if(!running) return;
    running = false;
    cancelAnimationFrame(raf);
    if(!gameOverCalled){
      gameOverCalled = true;
      onGameOver?.(prevMeters);
    }
  }

  // ----- Draw -----
  function draw(){
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

    // decorative rings
    ctx.strokeStyle=`hsla(${(hue+80)%360},70%,60%,0.18)`; ctx.lineWidth=2;
    for(let i=0;i<3;i++){ ctx.beginPath(); ctx.arc(W/2, (H/2)+offY + i*120, 120+i*30, 0, Math.PI*2); ctx.stroke(); }

    // Platforms + attached springs
    plats.forEach(p=>{
      if(p.y+offY>H+34) return;
      drawPlatform(p.x, p.y+offY, p.w, p.h, p.type);
      if(p.spring){
        const sx = p.x + p.spring.ox;
        const sy = p.y + p.spring.oy + offY;
        drawSpring(sx, sy, p.spring.w, p.spring.h);
      }
    });

    // Mobs
    mobs.forEach(m=>{
      if(!m.alive) return;
      const y=m.y+offY; if(y<-40||y>H+50) return;
      drawMob(m.x,y,m.w,m.h,m.type);
    });

    // Pickups (draw only active ones)
    pickups.forEach(f=>{
      if(!f || f.active===false) return;
      const y = f.y + offY;
      if(y<-40||y>H+50) return;
      if(f.type==='boots')   drawPickup(f, Spr.boots, drawBootsFallback);
      else if(f.type==='jetpack') drawPickup(f, Spr.jetpack, drawJetpackFallback);
      else if(f.type==='shield')  drawPickup(f, Spr.shield, drawShieldFallback);
    });

    // Bullets
    // draw()
    bullets.forEach(b=>{
      const y = b.y + offY;
      if(y<-20||y>H+20) return;
      ctx.fillStyle = '#ffeb3b';   // ярко-жёлтая пуля
      ctx.beginPath();
      ctx.arc(b.x, y, b.r, 0, Math.PI*2);
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });


    // Player (shield sphere and sprite)
    drawPlayer(player.x, player.y+offY);

    // Particles
    particles.forEach(p=>{
      ctx.globalAlpha=Math.max(0,p.life/18);
      ctx.fillStyle=p.color; ctx.fillRect(p.x-2, p.y+offY-2, 4,4);
    }); ctx.globalAlpha=1;
  }

  // ----- Drawing helpers -----
  function roundRect(x,y,w,h,r,fill){ ctx.beginPath(); ctx.moveTo(x+r,y);
    ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r);
    ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r);
    if(fill) ctx.fill(); else ctx.stroke();
  }

  function drawPlatform(x,y,w,h,type){
    const key = type==='solid' ? 'plat_solid'
              : type==='move' ? 'plat_move'
              : type==='crumble' ? 'plat_crumble'
              : 'plat_disappear';
    const img = Spr[key];
    if(img && img.complete){
      ctx.drawImage(img, x, y, w, h);
    } else {
      let grad = ctx.createLinearGradient(x,y,x,y+h);
      if(type==='solid'){ grad.addColorStop(0,'#2c2f48'); grad.addColorStop(1,'#3b3f66'); }
      else if(type==='move'){ grad.addColorStop(0,'#1e88b8'); grad.addColorStop(1,'#0f5f8a'); } // цельно синяя движущаяся платформа
      else if(type==='crumble'){ grad.addColorStop(0,'#7a3b3b'); grad.addColorStop(1,'#b05a4a'); }
      else { grad.addColorStop(0,'#5a2b2b'); grad.addColorStop(1,'#8b4b4b'); }
      ctx.fillStyle=grad; roundRect(x,y,w,h,3,true);
    }
  }

  function drawSpring(x,y,w,h){
    const img = Spr.spring;
    if(img && img.complete){
      ctx.drawImage(img, x, y, w, h);
    } else {
      ctx.strokeStyle='#fff'; ctx.lineWidth=2;
      ctx.beginPath();
      for(let i=0;i<5;i++){ ctx.moveTo(x+i*(w/5),y); ctx.lineTo(x+(i+1)*(w/5),y+h); }
      ctx.stroke();
    }
  }

  function drawPickup(f, img, fallback){
    if(img && img.complete){
      ctx.drawImage(img, f.x, f.y, f.w, f.h);
    } else {
      fallback(f.x, f.y, f.w, f.h);
    }
  }
  function drawBootsFallback(x,y,w,h){
    ctx.fillStyle='#f5d66d'; roundRect(x, y+h-10, w, 10, 3, true);
  }
  function drawJetpackFallback(x,y,w,h){
    ctx.fillStyle='#ff8e53'; roundRect(x+2, y+2, w-4, h-8, 4, true);
    ctx.fillStyle='#c0392b'; roundRect(x+4, y+h-8, 6, 6, 2, true); roundRect(x+w-10, y+h-8, 6, 6, 2, true);
  }
  function drawShieldFallback(x,y,w,h){
    ctx.strokeStyle='rgba(78,205,196,0.9)'; ctx.lineWidth=3;
    roundRect(x+2,y+2,w-4,h-4,6,false);
  }

  function drawMob(x,y,w,h,type){
    const img = (type==='walker') ? Spr.mob_walker : Spr.mob_flyer;
    if(img && img.complete){
      ctx.save();
      const t = Math.sin(frame*0.12)*0.06;
      ctx.translate(x+w/2,y+h/2);
      if(type==='flyer') ctx.rotate(t);
      ctx.translate(-w/2,-h/2);
      ctx.drawImage(img, 0, 0, w, h);
      ctx.restore();
    } else {
      ctx.save();
      if(type==='flyer') ctx.rotate(Math.sin(frame*0.1)*0.1);
      ctx.translate(x,y);
      ctx.fillStyle= type==='walker' ? '#ff6b6b' : '#45b7d1';
      ctx.beginPath(); ctx.ellipse(w/2,h/2,w/2,h/2,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#000';
      ctx.beginPath(); ctx.arc(8,10,3,0,Math.PI*2); ctx.arc(w-8,10,3,0,Math.PI*2); ctx.fill();
      ctx.restore();
    }
  }

  function drawPlayer(x,y){
    // shield sphere
    if(player.shield>0){
      ctx.save();
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = 'rgba(100,200,255,0.18)';
      ctx.beginPath();
      ctx.arc(x+player.w/2, y+player.h/2, Math.max(player.w,player.h)*0.8, 0, Math.PI*2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = 'rgba(120,210,255,0.7)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x+player.w/2, y+player.h/2, Math.max(player.w,player.h)*0.8, 0, Math.PI*2);
      ctx.stroke();
      ctx.restore();
    }

    // stretch on jump
    const stretch = Math.max(0.88, Math.min(1.14, 1 - player.vy*0.03));
    ctx.save();
    ctx.translate(x+player.w/2, y+player.h/2);
    ctx.scale(1, stretch);
    ctx.translate(-(x+player.w/2), -(y+player.h/2));

    const img = (player.vy<0 && Spr.playerJump?.complete) ? Spr.playerJump : Spr.player;
    if(img && img.complete){
      ctx.save();
      if(player.dir<0){
        ctx.translate(x+player.w, y);
        ctx.scale(-1,1);
        ctx.drawImage(img, 0, 0, player.w, player.h);
      } else {
        ctx.drawImage(img, x, y, player.w, player.h);
      }
      ctx.restore();
    } else {
      ctx.fillStyle='#f5deb3';
      ctx.beginPath(); ctx.ellipse(x+player.w/2, y+player.h/2, player.w/2, player.h/2, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle='#000';
      ctx.beginPath(); ctx.arc(x+9, y+12, 3, 0, Math.PI*2); ctx.arc(x+player.w-9, y+12, 3, 0, Math.PI*2); ctx.fill();
    }

    ctx.restore();
  }

  // ----- Loop -----
  function loop(){
    if(!running) return;
    update(); draw();
    raf = requestAnimationFrame(loop);
  }

  // ----- API -----
  function start(){ stop(); reset(); enableTilt(); running=true; loop(); }
  function stop(){ running=false; cancelAnimationFrame(raf); }

  return { start, stop, pause:()=>{}, resume:()=>{}, enableTilt };
};
