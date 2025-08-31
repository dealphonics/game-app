// Doodle Jump — версия с наклоном и редкими бонусами
window.Doodle = function(canvas, onScore, onAttemptDrop, onGameOver){
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  let running = false, raf = 0, frame = 0;
  let camY = 0, prevMeters = 0, baseY = 0, minY = 0;
  let gameOverCalled = false;

  // ----- Player -----
  const player = {
    x: W/2, y: H-100, w: 40, h: 50, // увеличен ~30%
    vx: 0, vy: 0,
    baseSpeed: 2.35,
    jump: -10.2,
    dir: 1,
    invul: 0, shield: 0, jetpack: 0, boots: 0, shotCooldown: 0
  };

  let plats = [], mobs = [], bullets = [], particles = [];

  // ----- Tilt control -----
  let tiltEnabled = false, tiltX = 0;
  function enableTilt(){
    if(tiltEnabled) return;
    if(typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function'){
      DeviceOrientationEvent.requestPermission()
        .then(state=>{
          if(state==='granted'){
            window.addEventListener('deviceorientation', onTilt, {passive:true});
            tiltEnabled = true;
          }
        }).catch(()=>{});
    } else {
      window.addEventListener('deviceorientation', onTilt, {passive:true});
      tiltEnabled = true;
    }
  }
  function onTilt(e){
    if(e && typeof e.gamma==='number'){
      const g = Math.max(-20, Math.min(20, e.gamma));
      tiltX = g / 15; // нормализуем
    }
  }

  // ----- Assets -----
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

  // ----- Reset -----
  function reset(){
    camY=0; prevMeters=0; baseY=H-100; minY=H-100; frame=0;
    gameOverCalled=false;

    player.x=W/2; player.y=H-100; player.vx=0; player.vy=0;
    player.shield=0; player.jetpack=0; player.boots=0; player.shotCooldown=0; player.invul=0;

    plats=[]; mobs=[]; bullets=[]; particles=[];

    plats.push(makePlat(W/2-45, H-22, 90, 12, 'solid'));
    for(let i=1;i<14;i++){
      const y = H-22 - i*58;
      const x = Math.random()*(W-84);
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

  // ----- Make platform with attached spring or pickup -----
  function makePlat(x,y,w,h,type){
    const p = {x,y,w,h,type,vx:0,life:Infinity,spring:null,pickup:null};
    if(type==='move') p.vx = (Math.random()<0.5?-1:1)*0.8;
    if(type==='disappear') p.life = 2;
    if(type==='crumble') p.life = 1;

    // шанс пружины (5%)
    if(Math.random()<0.05){
      p.spring = {ox:(w-20)/2, oy:-12, w:20, h:12};
    }
    // шанс бонуса (ещё 5%)
    else if(Math.random()<0.05){
      const kind = Math.random();
      let type='boots';
      if(kind<0.33) type='boots';
      else if(kind<0.66) type='jetpack';
      else type='shield';
      p.pickup = {ox:(w-28)/2, oy:-28, w:28, h:28, type, active:true};
    }
    return p;
  }

  // ----- Shooting -----
  function shoot(){
    if(player.shotCooldown>0) return;
    bullets.push({x:player.x+player.w/2-3, y:player.y, vy:-14, r:6});
    player.shotCooldown=9;
  }
  canvas.addEventListener('pointerdown', shoot, {passive:true});

  // ----- Update -----
  function update(){
    frame++;
    if(tiltEnabled){
      const target = tiltX * player.baseSpeed * 1.7;
      player.vx += (target - player.vx)*0.35;
      if(Math.abs(player.vx)<0.05) player.vx=0;
    }
    if(player.shotCooldown>0) player.shotCooldown--;

    player.vy += 0.35;
    player.x += player.vx; player.y += player.vy;
    if(player.vx>0) player.dir=1; else if(player.vx<0) player.dir=-1;
    if(player.x<-player.w) player.x=W; if(player.x>W) player.x=-player.w;

    plats.forEach(p=>{
      if(p.type==='move'){ p.x+=p.vx; if(p.x<0||p.x+p.w>W) p.vx*=-1; }
    });

    // landing on platform
    if(player.vy>0){
      for(const p of plats){
        if(player.x+player.w>p.x && player.x<p.x+p.w &&
           player.y+player.h>p.y && player.y+player.h<p.y+p.h + player.vy){

          // spring check
          if(p.spring){
            const s = {x:p.x+p.spring.ox,y:p.y+p.spring.oy,w:p.spring.w,h:p.spring.h};
            if(player.x+player.w>s.x && player.x<s.x+s.w &&
               player.y+player.h>s.y && player.y+player.h<s.y+s.h+player.vy){
              player.vy = player.jump*2.6;
              break;
            }
          }
          // pickup check
          if(p.pickup && p.pickup.active){
            const f = {x:p.x+p.pickup.ox,y:p.y+p.pickup.oy,w:p.pickup.w,h:p.pickup.h,type:p.pickup.type};
            if(player.x+player.w>f.x && player.x<f.x+f.w &&
               player.y+player.h>f.y && player.y<f.y+f.h){
              if(f.type==='boots') player.boots=360;
              if(f.type==='jetpack') player.jetpack=360;
              if(f.type==='shield') player.shield=3;
              p.pickup.active=false;
            }
          }

          // normal landing
          const boost = player.boots>0?1.7:1.0;
          player.y = p.y - player.h;
          player.vy = player.jump*boost;
          if(p.type==='crumble'||p.type==='disappear'){ p.life--; if(p.life<=0) p.y=-9999; }
          break;
        }
      }
    }

    // bullets
    bullets.forEach(b=>{ b.y+=b.vy; });
    bullets = bullets.filter(b=>b.y>camY-80);

    // camera
    const desired = player.y - H*0.58;
    if(desired<camY){ camY+=(desired-camY)*0.12; }
    while(plats.length && plats[plats.length-1].y > camY-40){
      plats.push(makePlat(Math.random()*(W-84), plats[plats.length-1].y-60, 64, 10, pickPlatType()));
      if(plats.length>64) plats.splice(0,1);
    }

    if(player.y<minY) minY=player.y;
    const meters=Math.max(0,Math.floor((baseY-minY)/10));
    if(meters!==prevMeters){ prevMeters=meters; onScore?.(meters); }

    if(player.y-camY>H+72) gameOver();
  }

  function gameOver(){
    if(!running) return;
    running=false;
    cancelAnimationFrame(raf);
    if(!gameOverCalled){ gameOverCalled=true; onGameOver?.(prevMeters); }
  }

  // ----- Draw -----
  function draw(){
    ctx.fillStyle='#123'; ctx.fillRect(0,0,W,H);
    const offY=-camY;

    plats.forEach(p=>{
      drawPlatform(p.x,p.y+offY,p.w,p.h,p.type);
      if(p.spring) drawSpring(p.x+p.spring.ox, p.y+p.spring.oy+offY, p.spring.w, p.spring.h);
      if(p.pickup && p.pickup.active){
        drawPickup(p.x+p.pickup.ox, p.y+p.pickup.oy+offY, p.pickup.w, p.pickup.h, p.pickup.type);
      }
    });

    bullets.forEach(b=>{
      const y=b.y+offY;
      ctx.fillStyle='yellow';
      ctx.beginPath(); ctx.arc(b.x, y, b.r, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle='orange'; ctx.stroke();
    });

    drawPlayer(player.x, player.y+offY);
  }

  // ----- Drawing helpers -----
  function drawPlatform(x,y,w,h,type){
    ctx.fillStyle=(type==='move'?'#1e88e5':'#888');
    ctx.fillRect(x,y,w,h);
  }
  function drawSpring(x,y,w,h){
    if(Spr.spring?.complete) ctx.drawImage(Spr.spring,x,y,w,h);
    else { ctx.strokeStyle='#fff'; ctx.strokeRect(x,y,w,h); }
  }
  function drawPickup(x,y,w,h,type){
    const img = Spr[type];
    if(img?.complete) ctx.drawImage(img,x,y,w,h);
    else { ctx.fillStyle='pink'; ctx.fillRect(x,y,w,h); }
  }
  function drawPlayer(x,y){
    const img=(player.vy<0&&Spr.playerJump?.complete)?Spr.playerJump:Spr.player;
    if(img?.complete) ctx.drawImage(img,x,y,player.w,player.h);
    else { ctx.fillStyle='#f5deb3'; ctx.fillRect(x,y,player.w,player.h); }
    if(player.shield>0){
      ctx.strokeStyle='rgba(100,200,255,0.7)'; ctx.lineWidth=3;
      ctx.beginPath(); ctx.arc(x+player.w/2,y+player.h/2,Math.max(player.w,player.h)*0.7,0,Math.PI*2); ctx.stroke();
    }
  }

  function loop(){ if(running){ update(); draw(); raf=requestAnimationFrame(loop); } }

  function start(){ stop(); reset(); running=true; enableTilt(); loop(); }
  function stop(){ running=false; cancelAnimationFrame(raf); }

  return { start, stop };
};
