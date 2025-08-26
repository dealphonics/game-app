// АРКАНОИД ИГРА
function startArkanoidGame() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    document.getElementById('gameOverDiv').style.display = 'none';
    document.getElementById('gameInstructions').textContent = 'Приготовься...';
    document.getElementById('levelTransitionDiv').innerHTML = '';
    
    let gameScore = 0;
    let gameLevel = 1;
    let gameStartTime = Date.now();
    let lastTrackTime = Date.now();
    let baseSpeed = 2.5;
    let ballSpeed = baseSpeed;
    let levelTransitionActive = false;
    
    let ball = { x: canvas.width/2, y: canvas.height - 60, dx: 0, dy: 0, radius: 6 };
    let paddle = { x: canvas.width/2 - 30, y: canvas.height - 30, width: 60, height: 8 };
    let blocks = [];
    let vinylRecord = null;
    
    gameRunning = false;
    gamePaused = false;
    
    let countdown = 3;
    showCountdown();
    
    function showCountdown() {
        const countdownDiv = document.getElementById('countdownDiv');
        
        if (countdown > 0) {
            countdownDiv.innerHTML = `<div class="countdown">${countdown}</div>`;
            countdown--;
            setTimeout(showCountdown, 1000);
        } else {
            countdownDiv.innerHTML = `<div class="countdown">GO!</div>`;
            setTimeout(() => {
                countdownDiv.innerHTML = '';
                startGame();
            }, 500);
        }
    }
    
    function startGame() {
        gameRunning = true;
        resetBall();
        generateBlocks();
        gameLoop();
        updateGameStats();
    }
    
    function resetBall() {
        ball.x = canvas.width/2;
        ball.y = canvas.height - 60;
        const angle = (Math.random() - 0.5) * 0.6;
        ball.dx = Math.sin(angle) * ballSpeed;
        ball.dy = -Math.cos(angle) * ballSpeed;
    }
    
    function generateBlocks() {
        blocks = [];
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#e17055'];
        
        const patternIndex = Math.floor(Math.random() * blockPatterns.length);
        const pattern = blockPatterns[patternIndex]();
        
        const blockWidth = 38;
        const blockHeight = 15;
        const padding = 2;
        const offsetX = 10;
        const offsetY = 20;
        
        if (pattern.custom) {
            pattern.custom.forEach(pos => {
                if (pos.row >= 0 && pos.col >= 0 && pos.col < 7) {
                    blocks.push({
                        x: offsetX + pos.col * (blockWidth + padding),
                        y: offsetY + pos.row * (blockHeight + padding),
                        width: blockWidth,
                        height: blockHeight,
                        active: true,
                        color: colors[pos.row % colors.length],
                        hits: gameLevel > 5 ? (Math.random() > 0.7 ? 2 : 1) : 1
                    });
                }
            });
        } else {
            const rows = pattern.rows || 4;
            const cols = pattern.cols || 7;
            
            for (let i = 0; i < cols; i++) {
                for (let j = 0; j < rows; j++) {
                    blocks.push({
                        x: offsetX + i * (blockWidth + padding),
                        y: offsetY + j * (blockHeight + padding),
                        width: blockWidth,
                        height: blockHeight,
                        active: true,
                        color: colors[j % colors.length],
                        hits: gameLevel > 5 ? (Math.random() > 0.7 ? 2 : 1) : 1
                    });
                }
            }
        }
    }  
}
    function nextLevel() {
        if (levelTransitionActive) return;
        
        levelTransitionActive = true;
        gameLevel++;
        
        if (gameLevel % 3 === 1) {
            ballSpeed += 0.4;
        }
        
        gameScore += 100;
        
        const transitionDiv = document.getElementById('levelTransitionDiv');
        transitionDiv.innerHTML = `
            <div class="level-transition">
                <div class="level-title">Уровень ${gameLevel}!</div>
                <div class="level-subtitle">Приготовься к бою</div>
            </div>
        `;
        
        setTimeout(() => {
            transitionDiv.innerHTML = '';
            generateBlocks();
            resetBall();
            levelTransitionActive = false;
        }, 2500);
    }
    
    canvas.addEventListener('mousemove', movePaddle);
    canvas.addEventListener('touchmove', movePaddle);
    
    function movePaddle(e) {
        if (!gameRunning || gamePaused || levelTransitionActive) return;
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const x = e.touches ? e.touches[0].clientX : e.clientX;
        paddle.x = x - rect.left - paddle.width / 2;
        paddle.x = Math.max(0, Math.min(canvas.width - paddle.width, paddle.x));
    }
    
    function updateGameStats() {
        if (!gameRunning) return;
        
        const gameTime = Math.floor((Date.now() - gameStartTime) / 1000);
        const minutes = Math.floor(gameTime / 60);
        const seconds = gameTime % 60;
        document.getElementById('gameTime').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        const timeSinceTrack = Math.floor((Date.now() - lastTrackTime) / 1000);
        const timeToTrack = Math.max(0, 60 - timeSinceTrack);
        document.getElementById('timeToTrack').textContent = `${timeToTrack}s`;
        
        document.getElementById('gameLevel').textContent = gameLevel;
        document.getElementById('currentGameScore').textContent = `Очки: ${gameScore}`;
        
        if (timeSinceTrack >= 60 && !vinylRecord && !levelTransitionActive) {
            createVinylRecord();
        }
        
        setTimeout(updateGameStats, 1000);
    }
    
    function createVinylRecord() {
        vinylRecord = {
            x: Math.random() * (canvas.width - 60) + 30,
            y: 60,
            dx: (Math.random() - 0.5) * 2,
            dy: 0.8 + Math.random() * 0.4,
            radius: 18,
            timeLeft: 5000,
            rotation: 0,
            directionChangeTimer: 0,
            targetX: Math.random() * canvas.width,
            targetY: Math.random() * 150 + 50
        };
    }
    
    function gameLoop() {
        if (!gameRunning) return;
        
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        if (levelTransitionActive || gamePaused) {
            drawStaticObjects();
            requestAnimationFrame(gameLoop);
            return;
        }
        
        ball.x += ball.dx;
        ball.y += ball.dy;
        
        if (ball.x - ball.radius <= 0) {
            ball.x = ball.radius;
            ball.dx = Math.abs(ball.dx);
        }
        if (ball.x + ball.radius >= canvas.width) {
            ball.x = canvas.width - ball.radius;
            ball.dx = -Math.abs(ball.dx);
        }
        if (ball.y - ball.radius <= 0) {
            ball.y = ball.radius;
            ball.dy = Math.abs(ball.dy);
        }
        
        if (ball.y + ball.radius >= paddle.y && 
            ball.x >= paddle.x && 
            ball.x <= paddle.x + paddle.width &&
            ball.dy > 0) {
            
            const hitPos = (ball.x - paddle.x) / paddle.width;
            const angle = (hitPos - 0.5) * Math.PI / 3;
            
            ball.dx = Math.sin(angle) * ballSpeed;
            ball.dy = -Math.cos(angle) * ballSpeed;
            ball.y = paddle.y - ball.radius;
            tg.HapticFeedback.impactOccurred('light');
        }
        
        if (ball.y > canvas.height) {
            gameRunning = false;
            updateScore(gameScore);
            document.getElementById('gameOverDiv').style.display = 'block';
            document.getElementById('gameInstructions').textContent = 
                `Игра окончена! Вы набрали ${gameScore} очков и дошли до ${gameLevel} уровня.`;
            return;
        }
        
        blocks.forEach(block => {
            if (block.active && 
                ball.x - ball.radius < block.x + block.width &&
                ball.x + ball.radius > block.x &&
                ball.y - ball.radius < block.y + block.height &&
                ball.y + ball.radius > block.y) {
                
                block.hits--;
                if (block.hits <= 0) {
                    block.active = false;
                } else {
                    block.color = '#888';
                }
                
                ball.dy = -ball.dy;
                gameScore += 10;
                tg.HapticFeedback.impactOccurred('medium');
            }
        });
        
        if (vinylRecord) {
            const targetDx = vinylRecord.targetX - vinylRecord.x;
            const targetDy = vinylRecord.targetY - vinylRecord.y;
            const distance = Math.sqrt(targetDx * targetDx + targetDy * targetDy);
            
            if (distance < 20 || vinylRecord.directionChangeTimer <= 0) {
                vinylRecord.targetX = Math.random() * (canvas.width - 60) + 30;
                vinylRecord.targetY = Math.random() * (canvas.height - 150) + 50;
                vinylRecord.directionChangeTimer = 120;
            }
            
            const speed = 1.2;
            vinylRecord.dx = (targetDx / distance) * speed;
            vinylRecord.dy = (targetDy / distance) * speed;
            
            vinylRecord.x += vinylRecord.dx;
            vinylRecord.y += vinylRecord.dy;
            vinylRecord.rotation += 0.15;
            vinylRecord.timeLeft -= 16;
            vinylRecord.directionChangeTimer--;
            
            vinylRecord.x = Math.max(vinylRecord.radius + 5, Math.min(canvas.width - vinylRecord.radius - 5, vinylRecord.x));
            vinylRecord.y = Math.max(vinylRecord.radius + 5, Math.min(canvas.height - 80, vinylRecord.y));
            
            const dx = ball.x - vinylRecord.x;
            const dy = ball.y - vinylRecord.y;
            const collisionDistance = Math.sqrt(dx * dx + dy * dy);
            
            if (collisionDistance < ball.radius + vinylRecord.radius) {
                const randomTrack = getRandomTrack();
                const isNewTrack = !unlockedTracks.includes(randomTrack.id);
                
                if (isNewTrack) {
                    unlockedTracks.push(randomTrack.id);
                    updateTracksCount();
                }
                
                showTrackPopup(randomTrack, isNewTrack);
                
                vinylRecord = null;
                lastTrackTime = Date.now();
                gameScore += 50;
            }
            
            if (vinylRecord && vinylRecord.timeLeft <= 0) {
                vinylRecord = null;
                lastTrackTime = Date.now();
            }
        }
        
        const activeBlocks = blocks.filter(block => block.active);
        if (activeBlocks.length === 0 && !levelTransitionActive) {
            nextLevel();
        }
        
        drawStaticObjects();
        requestAnimationFrame(gameLoop);
    }
    
    function drawStaticObjects() {
        // Рисуем мяч
        ctx.fillStyle = '#ff4444';
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Рисуем платформу
        const gradient = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x + paddle.width, paddle.y);
        gradient.addColorStop(0, '#4ecdc4');
        gradient.addColorStop(1, '#44a08d');
        ctx.fillStyle = gradient;
        ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
        
        // Рисуем блоки
        blocks.forEach(block => {
            if (block.active) {
                ctx.fillStyle = block.color;
                ctx.fillRect(block.x, block.y, block.width, block.height);
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1;
                ctx.strokeRect(block.x, block.y, block.width, block.height);
                
                if (block.hits > 1) {
                    ctx.fillStyle = '#fff';
                    ctx.font = '10px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(block.hits, block.x + block.width/2, block.y + block.height/2 + 3);
                }
            }
        });
        
        // Рисуем виниловую пластинку
        if (vinylRecord) {
            ctx.save();
            ctx.translate(vinylRecord.x, vinylRecord.y);
            ctx.rotate(vinylRecord.rotation);
            
            // Основной круг пластинки
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(0, 0, vinylRecord.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Контур
            ctx.strokeStyle = '#4ecdc4';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Центр пластинки
            ctx.fillStyle = '#4ecdc4';
            ctx.beginPath();
            ctx.arc(0, 0, 4, 0, Math.PI * 2);
            ctx.fill();
            
            // Дорожки на пластинке
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.arc(0, 0, 6 + i * 3, 0, Math.PI * 2);
                ctx.stroke();
            }
            
            ctx.restore();
            
            // Таймер над пластинкой
            const timeLeft = Math.ceil(vinylRecord.timeLeft / 1000);
            ctx.fillStyle = '#ff6b6b';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(timeLeft, vinylRecord.x, vinylRecord.y - 25);
        }
    }
}
