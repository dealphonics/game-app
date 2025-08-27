window.GameTarget = function(canvas, onScore){
  const ctx = canvas.getContext('2d');
  let rafId = 0, running = false, paused = false;
  let targets = [];
  let score = 0;
  let startTime = 0;

  const clickHandler = (e)=>{
    if(!running || paused) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches?.[0]?.clientX ?? e.clientX) - rect.left;
    const y = (e.touches?.[0]?.clientY ?? e.clientY) - rect.top;
    for(let i=targets.length-1;i>=0;i--){
      const t = targets[i];
      const dx = x - (t.x + t.size/2);
      const dy = y - (t.y + t.size/2);
      if(Math.sqrt(dx*dx+dy*dy) < t.size/2){
        targets.splice(i,1);
        score += 10;
        onScore(score);
        break;
      }
    }
  };

  function spawn(){
    if(Math.random()<0.03){
      targets.push({
        x: Math.random()*(canvas.width-40),
        y: Math.random()*(canvas.height-40),
        size: 24 + Math.random()*20,
        life: 120 + Math.random()*120,
        color: `hsl(${Math.random()*360},70%,55%)`
      });
    }
  }

  function update(){
    for(let i=targets.length-1;i>=0;i--){
      const t = targets[i];
      t.life -= 1;
      if(t.life<=0) targets.splice(i,1);
    }
  }

  function draw(){
    ctx.fillStyle = "#000";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    targets.forEach(t=>{
      ctx.globalAlpha = Math.max(0.25, t.life/240);
      ctx.fillStyle = t.color;
      ctx.fillRect(t.x, t.y, t.size, t.size);
      ctx.globalAlpha = 1;
    });
  }

  function loop(){
    if(!running) return;
    if(!paused){
      spawn(); update(); draw();
    }
    rafId = requestAnimationFrame(loop);
  }

  function start(){
    stop();
    running = true; paused = false; score = 0; targets = [];
    startTime = Date.now();
    canvas.addEventListener('click', clickHandler, {passive:true});
    canvas.addEventListener('touchstart', clickHandler, {passive:true});
    loop();
  }

  function stop(){
    running = false; paused = false;
    cancelAnimationFrame(rafId);
    canvas.removeEventListener('click', clickHandler);
    canvas.removeEventListener('touchstart', clickHandler);
  }

  return {
    start,
    stop,
    pause: ()=>{ paused = true; },
    resume: ()=>{ paused = false; },
    getScore: ()=>score,
    getSeconds: ()=> Math.floor((Date.now()-startTime)/1000)
  };
};
