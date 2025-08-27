// Doodle Jump (стабильная версия)
window.Doodle = function(canvas, onScoreUpdate, onUnlock){
  const ctx = canvas.getContext('2d');
  let raf=0, running=false, paused=false;

  // Размеры
  const W = canvas.width, H = canvas.height;

  // Игрок
  const player = {
    x: W/2, y: H-80, w: 26, h: 32,
    vx: 0, vy: 0, speed: 3.2, jump: -9.5
  };

  // Платформы
  let plats = [];
  const baseGap = 58;

  // Камера / высота
  let camY = 0, maxHeight = 0;

  // Управление
  let pointerActive=false, pointerX=0;

  function init(){
    plats = [];
    // базовая платформа
    plats.push({x: W/2-40, y: H-20, w: 80, h: 12, type:'solid', vy:0});
    // остальные вверх
    for(let i=1;i<10;i++){
      plats.push(makePlat(H-20 - i*baseGap));
    }
    camY = 0; maxHeight = 0;
    player.x = W/2; player.y = H-80; player.vx=0; player.vy=0;
  }

  function makePlat(y){
    const w = 60, h=10;
    return { x: Math.random()*(W-w), y, w, h, type: (Math.random()<0.2?'move':'solid'),
             dir: Math.random()<0.5?-1:1, vy:0, vx: (Math.random()*0.7+0.3)*(Math.random()<0.5?-1:1) };
  }

  function inputInit(){
    // Pointer
    canvas.addEventListener('pointerdown', e=>{
      pointerActive = true;
      pointerX = e.clientX - canvas.getBoundingClientRect().left;
    }, {passive:true});
    canvas.addEventListener('pointermove', e=>{
      if(!pointerActive) return;
      pointerX = e.clientX - canvas.getBoundingClientRect().left;
    }, {passive:true});
    window.addEventListener('pointerup', ()=> pointerActive=false, {passive:true});

    // Touch (дублирующий)
    canvas.addEventListener('touchstart', e=>{
      const rect = canvas.getBoundingClientRect();
      pointerActive=true;
      pointerX = e.touches[0].clientX - rect.left;
    }, {passive:true});
    canvas.addEventListener('touchmove', e=>{
      if(!pointerActive) return;
      const rect = canvas.getBoundingClientRect();
      pointerX = e.touches[0].clientX - rect.left;
    }, {passive:true});
    canvas.addEventListener('touchend', ()=> pointerActive=false, {passive:true});

    // Клавиатура (фолбэк)
    window.addEventListener('keydown', e=>{
      if(e.key==='ArrowLeft' || e.key==='a') player.vx = -player.speed;
      if(e.key==='ArrowRight' || e.key==='d') player.vx = player.speed;
    });
    window.addEventListener('keyup', e=>{
      if(e.key==='ArrowLeft' || e.key==='a' || e.key==='ArrowRight' || e.key==='d') player.vx = 0;
    });
  }

  function update(){
    // Управление по pointer — плавно следует к pointerX
    if(pointerActive){
      const cx = player.x + player.w/2;
      const dx = pointerX - cx;
      player.vx = Math.max(-player.speed, Math.min(player.speed, dx*0.06));
    }

    // Физика
    player.vy += 0.35;
    player.x += player.vx;
    player.y += player.vy;

    // За края по X — обёртка
    if(player.x < -player.w) player.x = W;
    if(player.x > W) player.x = -player.w;

    // Платформы двигающиеся
    plats.forEach(p=>{
      if(p.type==='move'){
        p.x += p.vx;
        if(p.x<0 || p.x+p.w>W) p.vx*=-1;
      }
    });

    // Столкновение (только если падаем)
    if(player.vy>0){
      for(const p of plats){
        if(player.x+player.w>p.x && player.x < p.x+p.w &&
           player.y+player.h > p.y && player.y+player.h < p.y+p.h + player.vy){
          // прыжок
          player.y = p.y - player.h;
          player.vy = player.jump;
          tg.HapticFeedback.impactOccurred('light');
          // Иногда разблокируем трек при успешной посадке
          if(Math.random()<0.08 && typeof onUnlock==='function') onUnlock();
          break;
        }
      }
    }

    // Камера: держим игрока в нижней половине
    const targetCam = Math.min(camY, player.y - H*0.55);
    const dy = targetCam - camY;
    camY += dy * 0.15;

    // Если игрок поднялся — добавим платформ сверху
    const topY = camY;
    while(plats.length && plats[plats.length-1].y > topY - 40){
      const yTop = plats[plats.length-1].y - baseGap;
      plats.push(makePlat(yTop));
      if(plats.length>40) plats.splice(0,1);
    }

    // Счёт — максимальная высота
    const height = Math.max(0, (H - (player.y - camY)) / 10 | 0);
    if(height>maxHeight){
      maxHeight = height;
      if(typeof onScoreUpdate==='function') onScoreUpdate(maxHeight);
    }

    // Если упал ниже экрана — стоп
    if(player.y - camY > H+60){
      running=false;
    }
  }

  function draw(){
    ctx.fillStyle="#000";
    ctx.fillRect(0,0,W,H);

    const offsetY = -camY;

    // Платформы
    ctx.fillStyle="#667eea";
    plats.forEach(p=>{
      ctx.fillRect(p.x, p.y+offsetY, p.w, p.h);
    });

    // Игрок
    ctx.fillStyle="#f4f4f4";
    ctx.fillRect(player.x, player.y+offsetY, player.w, player.h);
    // шлем
    ctx.fillStyle="#45b7d1";
    ctx.fillRect(player.x+4, player.y+offsetY+3, player.w-8, 8);
  }

  function loop(){
    if(!running) return;
    if(!paused){
      update(); draw();
    }
    raf = requestAnimationFrame(loop);
  }

  function start(){
    stop(); init();
    running=true; paused=false;
    loop();
  }
  function stop(){
    running=false; paused=false;
    cancelAnimationFrame(raf);
  }

  return {
    start, stop,
    pause: ()=>{paused=true;},
    resume: ()=>{paused=false;}
  };
};
