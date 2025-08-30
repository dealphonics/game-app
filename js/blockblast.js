// Block Blast — 10x10, 3 фигуры в лотке, перетаскивание, очистка строк/столбцов.
// API: window.BlockBlast(canvas, onScore, onAttemptDrop, onGameOver) -> { start(), stop() }
(function(){
  function BlockBlast(canvas, onScore, onAttemptDrop, onGameOver){
    const ctx = canvas.getContext('2d');
    const GRID = 10;
    const PADDING = 12;
    const GAP = 8;
    const DPR = Math.max(1, Math.min(3, window.devicePixelRatio || 1));

    // Input support
    const SUPPORTS_POINTER = 'PointerEvent' in window;
    const SUPPORTS_TOUCH = 'ontouchstart' in window || (navigator.maxTouchPoints|0) > 0;

    let running = false;

    // Board state
    let board = Array.from({length:GRID},()=>Array(GRID).fill(0));
    let score = 0;
    let pieces = [];

    // Drag state
    let drag = {
      active:false, idx:-1,
      offsetX:0, offsetY:0, topLeftX:0, topLeftY:0,
      over:false, valid:false, cells:[]
    };

    // Geometry (в координатах CSS-пикселей)
    let cssW=0, cssH=0, cell=24, boardX=0, boardY=0, boardSize=0, trayY=0, trayHeight=0, slotW=0;

    // Visuals
    const COLORS = ['#5cc8ff','#ff7aa2','#ffd166','#9ce37d','#b792ff','#ffad5a','#57e0b3'];
    const SHAPES = [
      [[0,0]], // 1
      [[0,0],[1,0]], [[0,0],[0,1]], // 2
      [[0,0],[1,0],[2,0]], [[0,0],[0,1],[0,2]], // 3
      [[0,0],[1,0],[0,1],[1,1]], // 2x2
      [[0,0],[0,1],[1,1]], [[0,0],[1,0],[0,1]], // L-3
      [[0,0],[0,1],[0,2],[1,2]], [[0,2],[1,0],[1,1],[1,2]], // L-4
      [[0,0],[1,0],[1,1]], [[1,0],[0,1],[1,1]], // Z-3
      [[0,0],[1,0],[2,0],[3,0]], [[0,0],[0,1],[0,2],[0,3]], // 4
      [[0,0],[1,0],[2,0],[3,0],[4,0]], [[0,0],[0,1],[0,2],[0,3],[0,4]] // 5
    ];
    const POOL = [
      ...rep(SHAPES[0], 4),
      ...rep(SHAPES[1], 3), ...rep(SHAPES[2], 3),
      ...rep(SHAPES[3], 3), ...rep(SHAPES[4], 3),
      ...rep(SHAPES[5], 4),
      ...rep(SHAPES[6], 3), ...rep(SHAPES[7], 3),
      ...rep(SHAPES[8], 2), ...rep(SHAPES[9], 2),
      ...rep(SHAPES[10],3), ...rep(SHAPES[11],3),
      ...rep(SHAPES[12],1), ...rep(SHAPES[13],1)
    ];
    function rep(shape, n){ return Array.from({length:n}, ()=>shape); }
    function rof(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

    function start(){
      running = true;
      reset();
      // Делаем два layout: сразу и после отрисовки (когда модалка уже видима)
      layout();
      setTimeout(layout, 0);
      bind();
      render();
    }
    function stop(){
      running = false;
      unbind();
    }

    function reset(){
      board = Array.from({length:GRID},()=>Array(GRID).fill(0));
      score = 0;
      pieces = genPieces(3);
      placePiecesInTray();
      onScore?.(score);
    }

    function genPieces(n){
      const arr=[];
      for(let i=0;i<n;i++){
        const shape = clone(rof(POOL));
        const color = rof(COLORS);
        arr.push({ shape, color, placed:false, baseX:0, baseY:0, traySize:0 });
      }
      return arr;
    }
    function clone(shape){ return shape.map(([x,y])=>[x,y]); }
    function bbox(shape){
      let minX=+1e9,minY=+1e9,maxX=-1e9,maxY=-1e9;
      for(const [x,y] of shape){ if(x<minX)minX=x; if(y<minY)minY=y; if(x>maxX)maxX=x; if(y>maxY)maxY=y; }
      return {minX,minY,maxX,maxY,w:maxX-minX+1,h:maxY-minY+1};
    }

    function setCanvasSize(){
      // работаем в CSS-координатах; бэкбуфер — с учётом DPR
      const rect = canvas.getBoundingClientRect();
      let w = Math.floor(rect.width || canvas.clientWidth || canvas.width || 360);
      let h = Math.floor(rect.height || canvas.clientHeight || canvas.height || 520);
      if(w===0 || h===0){ // если модалка только что открыта
        w = canvas.width || 360;
        h = canvas.height || 520;
      }
      cssW = w; cssH = h;
      canvas.width = Math.floor(w * DPR);
      canvas.height = Math.floor(h * DPR);
      ctx.setTransform(DPR,0,0,DPR,0,0); // далее рисуем в CSS-пикселях
    }

    function layout(){
      setCanvasSize();

      // Подбираем размер клетки по ширине/высоте
      const cellByW = Math.floor((cssW - PADDING*2) / GRID);
      const cellByH = Math.floor((cssH - PADDING*2 - GAP) / (GRID + 4));
      cell = Math.max(12, Math.min(cellByW, cellByH));

      boardSize = cell * GRID;
      trayHeight = cell * 4;
      boardX = Math.floor((cssW - boardSize)/2);
      boardY = PADDING;
      trayY = boardY + boardSize + GAP;
      slotW = Math.floor(boardSize/3);

      placePiecesInTray();
      render();
    }

    function placePiecesInTray(){
      const sz = Math.max(10, Math.floor(cell*0.8));
      pieces.forEach((p,i)=>{
        if(!p || p.placed) return;
        const b = bbox(p.shape);
        const shapeW = b.w*sz, shapeH = b.h*sz;
        const slotX = boardX + i*slotW, slotY = trayY;
        p.baseX = Math.floor(slotX + (slotW-shapeW)/2);
        p.baseY = Math.floor(slotY + (trayHeight-shapeH)/2);
        p.traySize = sz;
      });
    }

    // ===== Events
    function bind(){
      if(SUPPORTS_POINTER){
        canvas.addEventListener('pointerdown', onPointerDown);
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
      }else{
        if(SUPPORTS_TOUCH){
          canvas.addEventListener('touchstart', onTouchStart, { passive:false });
          window.addEventListener('touchmove', onTouchMove, { passive:false });
          window.addEventListener('touchend', onTouchEnd, { passive:true });
          window.addEventListener('touchcancel', onTouchEnd, { passive:true });
        }
        // mouse fallback (десктопы/старые вебвью)
        canvas.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
      }
      window.addEventListener('resize', layout, {passive:true});
      window.addEventListener('orientationchange', layout);
    }
    function unbind(){
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);

      canvas.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);

      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);

      window.removeEventListener('resize', layout);
      window.removeEventListener('orientationchange', layout);
    }

    // Unified coords
    function eventPoint(e){
      if(e.touches && e.touches.length){ return { x: e.touches[0].clientX, y: e.touches[0].clientY }; }
      if(e.changedTouches && e.changedTouches.length){ return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY }; }
      return { x: e.clientX, y: e.clientY };
    }
    function relFromClient(clientX, clientY){
      const r=canvas.getBoundingClientRect();
      return { x: clientX - r.left, y: clientY - r.top }; // координаты в CSS-пикселях (как и рисование)
    }
    function rel(e){ const p = eventPoint(e); return relFromClient(p.x, p.y); }

    // Pointer
    function onPointerDown(e){ e.preventDefault?.(); if(!running) return; const {x,y}=rel(e); handleDown(x,y); }
    function onPointerMove(e){ if(!running || !drag.active) return; const {x,y}=rel(e); handleMove(x,y); }
    function onPointerUp(){ if(!running) return; handleUp(); }

    // Touch
    function onTouchStart(e){ if(!running) return; e.preventDefault(); const {x,y}=rel(e); handleDown(x,y); }
    function onTouchMove(e){ if(!running || !drag.active) return; e.preventDefault(); const {x,y}=rel(e); handleMove(x,y); }
    function onTouchEnd(){ if(!running) return; handleUp(); }

    // Mouse
    function onMouseDown(e){ if(!running) return; const {x,y}=rel(e); handleDown(x,y); }
    function onMouseMove(e){ if(!running || !drag.active) return; const {x,y}=rel(e); handleMove(x,y); }
    function onMouseUp(){ if(!running) return; handleUp(); }

    // Handlers
    function handleDown(x,y){
      const idx = hitPiece(x,y);
      if(idx===-1) return;
      const p = pieces[idx];
      const b = bbox(p.shape);
      const rect = { x:p.baseX, y:p.baseY, w:b.w*p.traySize, h:b.h*p.traySize };
      drag.active=true; drag.idx=idx;
      drag.offsetX = x-rect.x; drag.offsetY = y-rect.y;
      drag.topLeftX = x - drag.offsetX; drag.topLeftY = y - drag.offsetY;
      drag.over=false; drag.valid=false; drag.cells=[];
      try{ tg.HapticFeedback.impactOccurred('light'); }catch(e){}
      render();
    }

    function handleMove(x,y){
      drag.topLeftX = x - drag.offsetX;
      drag.topLeftY = y - drag.offsetY;

      const inside = (x>=boardX && x<=boardX+boardSize && y>=boardY && y<=boardY+boardSize);
      drag.over = inside;
      if(inside){
        const p = pieces[drag.idx], b = bbox(p.shape);
        const col = Math.round((drag.topLeftX - boardX)/cell);
        const row = Math.round((drag.topLeftY - boardY)/cell);
        const baseCol = col - b.minX, baseRow = row - b.minY;
        const placement = collectCells(baseCol, baseRow, p.shape);
        drag.cells = placement.cells; drag.valid = placement.valid;
      }else{
        drag.cells=[]; drag.valid=false;
      }
      render();
    }

    function handleUp(){
      if(drag.over && drag.valid){
        placeDragged();
      }
      drag.active=false; drag.idx=-1; drag.cells=[]; drag.valid=false;
      render();
    }

    function hitPiece(px,py){
      for(let i=0;i<pieces.length;i++){
        const p=pieces[i]; if(!p || p.placed) continue;
        const b=bbox(p.shape);
        const rect={ x:p.baseX, y:p.baseY, w:b.w*p.traySize, h:b.h*p.traySize };
        if(px>=rect.x && px<=rect.x+rect.w && py>=rect.y && py<=rect.y+rect.h) return i;
      }
      return -1;
    }

    function collectCells(baseCol, baseRow, shape){
      const cells=[]; let valid=true;
      for(const [sx,sy] of shape){
        const c=baseCol+sx, r=baseRow+sy;
        cells.push({x:c,y:r});
        if(c<0||c>=GRID||r<0||r>=GRID||board[r][c]) valid=false;
      }
      return {cells, valid};
    }

    function placeDragged(){
      const p = pieces[drag.idx];
      drag.cells.forEach(({x,y})=>{ board[y][x] = p.color; });
      score += p.shape.length;
      onScore?.(score);
      try{ tg.HapticFeedback.impactOccurred('light'); }catch(e){}

      // clear lines
      const cleared = clearLines();
      if(cleared>0){
        score += 10 * cleared;
        onScore?.(score);
        try{ tg.HapticFeedback.impactOccurred('medium'); }catch(e){}
        onAttemptDrop?.('kill'); // повышенный шанс
      }else{
        onAttemptDrop?.('landing'); // небольшой шанс на установке
      }

      pieces[drag.idx].placed=true;
      pieces[drag.idx]=null;

      if(pieces.every(pp=>!pp || pp.placed)){
        pieces = genPieces(3);
        placePiecesInTray();
      }

      if(isGameOver()){
        running=false;
        setTimeout(()=> onGameOver?.(score), 0);
      }
    }

    function clearLines(){
      const fullRows=[], fullCols=[];
      for(let r=0;r<GRID;r++){
        let ok=true; for(let c=0;c<GRID;c++){ if(!board[r][c]){ ok=false; break; } }
        if(ok) fullRows.push(r);
      }
      for(let c=0;c<GRID;c++){
        let ok=true; for(let r=0;r<GRID;r++){ if(!board[r][c]){ ok=false; break; } }
        if(ok) fullCols.push(c);
      }
      fullRows.forEach(r=>{ for(let c=0;c<GRID;c++) board[r][c]=0; });
      fullCols.forEach(c=>{ for(let r=0;r<GRID;r++) board[r][c]=0; });
      return fullRows.length + fullCols.length;
    }

    function isGameOver(){
      // Есть ли куда поставить хоть одну оставшуюся фигуру?
      for(const p of pieces){
        if(!p || p.placed) continue;
        if(canPlace(p.shape)) return false;
      }
      return true;
    }
    function canPlace(shape){
      for(let r=0;r<GRID;r++){
        for(let c=0;c<GRID;c++){
          let ok=true;
          for(const [sx,sy] of shape){
            const rr=r+sy, cc=c+sx;
            if(rr<0||rr>=GRID||cc<0||cc>=GRID||board[rr][cc]){ ok=false; break; }
          }
          if(ok) return true;
        }
      }
      return false;
    }

    // ===== Render
    function render(){
      // фон
      ctx.clearRect(0,0,cssW,cssH);
      const g=ctx.createLinearGradient(0,0,0,cssH);
      g.addColorStop(0,'#0f1424'); g.addColorStop(1,'#0a0e18');
      ctx.fillStyle=g; ctx.fillRect(0,0,cssW,cssH);

      drawBoard();
      drawPiecesTray();
      if(drag.active) drawDraggingPiece();
      if(drag.active && drag.over) drawPreview();
    }

    function drawBoard(){
      // панель
      roundRect(boardX, boardY, boardSize, boardSize, 12, true, '#141a2a');
      // сетка
      ctx.strokeStyle='rgba(255,255,255,0.06)';
      ctx.lineWidth=1;
      ctx.beginPath();
      for(let i=0;i<=GRID;i++){
        const xx = boardX + i*cell + 0.5;
        ctx.moveTo(xx, boardY+0.5); ctx.lineTo(xx, boardY+boardSize+0.5);
        const yy = boardY + i*cell + 0.5;
        ctx.moveTo(boardX+0.5, yy); ctx.lineTo(boardX+boardSize+0.5, yy);
      }
      ctx.stroke();

      // занятые клетки
      for(let r=0;r<GRID;r++){
        for(let c=0;c<GRID;c++){
          if(board[r][c]){
            drawCell(boardX + c*cell, boardY + r*cell, cell, board[r][c]);
          }
        }
      }
    }

    function drawCell(x,y,size,color){
      const r = Math.round(size*0.18);
      roundRect(x+2, y+2, size-4, size-4, r, true, color);
    }

    function drawPiecesTray(){
      pieces.forEach((p,i)=>{
        if(!p || p.placed || (drag.active && drag.idx===i)) return;
        const b=bbox(p.shape), sz = p.traySize;
        for(const [sx,sy] of p.shape){
          const px = p.baseX + (sx-b.minX)*sz;
          const py = p.baseY + (sy-b.minY)*sz;
          drawCell(px,py,sz,p.color);
        }
      });
    }

    function drawDraggingPiece(){
      const p = pieces[drag.idx]; if(!p) return;
      const b=bbox(p.shape), sz=cell;
      for(const [sx,sy] of p.shape){
        const px = drag.topLeftX + (sx-b.minX)*sz;
        const py = drag.topLeftY + (sy-b.minY)*sz;
        ctx.save();
        ctx.shadowColor='rgba(0,0,0,0.35)';
        ctx.shadowBlur=14; ctx.shadowOffsetY=4;
        drawCell(px,py,sz,p.color);
        ctx.restore();
      }
    }

    function drawPreview(){
      const color = drag.valid ? 'rgba(80,255,170,0.35)' : 'rgba(255,80,120,0.35)';
      for(const {x,y} of drag.cells){
        const px = boardX + x*cell, py = boardY + y*cell;
        roundRect(px+2,py+2,cell-4,cell-4,Math.round(cell*0.18), true, color);
      }
    }

    function roundRect(x,y,w,h,r,fill,color){
      const rr=Math.min(r, Math.floor(Math.min(w,h)/2));
      ctx.beginPath();
      ctx.moveTo(x+rr,y);
      ctx.arcTo(x+w,y,x+w,y+h,rr);
      ctx.arcTo(x+w,y+h,x,y+h,rr);
      ctx.arcTo(x,y+h,x,y,rr);
      ctx.arcTo(x,y,x+w,y,rr);
      ctx.closePath();
      if(fill){ ctx.fillStyle=color||'#141a2a'; ctx.fill(); }
      else { ctx.strokeStyle=color||'#fff'; ctx.stroke(); }
    }

    return { start, stop };
  }

  window.BlockBlast = BlockBlast;
})();
