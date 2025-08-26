// DOODLE JUMP ИГРА
function startDoodleGame() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    document.getElementById('gameOverDiv').style.display = 'none';
    document.getElementById('gameInstructions').textContent = 'Наклоните телефон или нажмите по экрану';
    document.getElementById('levelTransitionDiv').innerHTML = '';
    
    // Игровые переменные
    let gameScore = 0;
    let gameLevel = 1;
    let gameStartTime = Date.now();
    let lastTrackTime = Date.now();
    let maxHeight = 0;
    let cameraY = 0;
    
    // Персонаж
    let doodle = {
        x: canvas.width / 2 - 15,
        y: canvas.height - 100,
        width: 30,
        height: 30,
        velocityY: 0,
        velocityX: 0,
        jumpPower: -10,
        gravity: 0.3,
        speed: 4,
        direction: 1, // 1 - вправо, -1 - влево
        color: '#4ecdc4'
    };
    
    // Платформы
    let platforms = [];
    let platformWidth = 60;
    let platformHeight = 10;
    let platformGap = 50;
    
    // Виниловые пластинки
    let vinyls = [];
    let vinylSpawnChance = 0.02;
    
    // Враги
    let enemies = [];
    let enemySpawnChance = 0.005;
    
    // Бонусы
    let powerUps = [];
    let hasSuperJump = false;
    let superJumpTimer = 0;
    let hasShield = false;
    let shieldTimer = 0;
    
    // Управление
    let touchStartX = null;
    let accelerometerX = 0;
    let useAccelerometer = false;
    
    gameRunning = false;
    gamePaused = false;
    
    // Создаем начальные платформы
    function createInitialPlatforms() {
        platforms = [];
        
        // Стартовая платформа
        platforms.push({
            x: canvas.width / 2 - platformWidth / 2,
            y: canvas.height - 50,
            width: platformWidth,
            height: platformHeight,
            type: 'normal',
            color: '#4ecdc4',
            broken: false
        });
        
        // Генерируем платформы вверх
        for (let i = 1; i < 20; i++) {
            let platform = generatePlatform(canvas.height - 50 - (i * platformGap));
            platforms.push(platform);
        }
    }
    
    // Генерация одной платформы
    function generatePlatform(y) {
        let types = ['normal', 'normal', 'normal', 'moving', 'breakable', 'spring'];
        let type = types[Math.floor(Math.random() * types.length)];
        
        // С увеличением высоты больше сложных платформ
        if (maxHeight > 5000) {
            types = ['normal', 'moving', 'breakable', 'moving', 'spring'];
            type = types[Math.floor(Math.random() * types.length)];
        }
        
        let platform = {
            x: Math.random() * (canvas.width - platformWidth),
            y: y,
            width: platformWidth,
            height: platformHeight,
            type: type,
            color: '#4ecdc4',
            broken: false
        };
        
        // Особенности для разных типов
        switch(type) {
            case 'moving':
                platform.color = '#45b7d1';
                platform.velocityX = (Math.random() - 0.5) * 2;
                platform.direction = platform.velocityX > 0 ? 1 : -1;
                break;
            case 'breakable':
                platform.color = '#ff6b6b';
                platform.health = 1;
                break;
            case 'spring':
                platform.color = '#feca57';
                platform.jumpBoost = -15;
                break;
        }
        
        // Шанс появления винила на платформе
        if (Math.random() < 0.1 && type === 'normal') {
            platform.hasVinyl = true;
        }
        
        return platform;
    }
    
    // Создание винила
    function createVinyl(x, y) {
        vinyls.push({
            x: x,
            y: y,
            radius: 15,
            collected: false,
            rotation: 0,
            floatOffset: 0
        });
    }
    
    // Создание врага
    function createEnemy(y) {
        enemies.push({
            x: Math.random() * (canvas.width - 30),
            y: y,
            width: 30,
            height: 30,
            velocityX: (Math.random() - 0.5) * 2,
            type: Math.random() > 0.5 ? 'monster' : 'spike',
            color: '#e17055'
        });
    }
    
    // Создание бонуса
    function createPowerUp(x, y, type) {
        powerUps.push({
            x: x,
            y: y,
            width: 25,
            height: 25,
            type: type, // 'superJump', 'shield', 'magnet'
            collected: false
        });
    }
    
    // Обработка управления
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        touchStartX = e.touches[0].clientX - rect.left;
    });
    
    canvas.addEventListener('touchmove', (e) => {
        if (!gameRunning || gamePaused) return;
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const touchX = e.touches[0].clientX - rect.left;
        
        if (touchStartX !== null) {
            const diff = touchX - touchStartX;
            doodle.velocityX = Math.max(-doodle.speed, Math.min(doodle.speed, diff * 0.1));
        }
    });
    
    canvas.addEventListener('touchend', () => {
        touchStartX = null;
    });
    
    // Управление с клавиатуры (для тестирования)
    document.addEventListener('keydown', (e) => {
        if (!gameRunning || gamePaused) return;
        if (e.key === 'ArrowLeft') {
            doodle.velocityX = -doodle.speed;
            doodle.direction = -1;
        } else if (e.key === 'ArrowRight') {
            doodle.velocityX = doodle.speed;
            doodle.direction = 1;
        }
    });
    
    document.addEventListener('keyup', (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            doodle.velocityX = 0;
        }
    });
    
    // Акселерометр (если доступен)
    if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', (e) => {
            if (!gameRunning || gamePaused) return;
            if (e.gamma !== null) {
                useAccelerometer = true;
                accelerometerX = e.gamma / 30; // Нормализуем значение
                accelerometerX = Math.max(-1, Math.min(1, accelerometerX));
                doodle.velocityX = accelerometerX * doodle.speed;
                doodle.direction = accelerometerX > 0 ? 1 : -1;
            }
        });
    }
    
    // Обновление игровой статистики
    function updateGameStats() {
        if (!gameRunning) return;
        
        const gameTime = Math.floor((Date.now() - gameStartTime) / 1000);
        const minutes = Math.floor(gameTime / 60);
        const seconds = gameTime % 60;
        document.getElementById('gameTime').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        const timeSinceTrack = Math.floor((Date.now() - lastTrackTime) / 1000);
        const timeToTrack = Math.max(0, 45 - timeSinceTrack); // Каждые 45 секунд
        document.getElementById('timeToTrack').textContent = `${timeToTrack}s`;
        
        // Уровень зависит от высоты
        gameLevel = Math.floor(maxHeight / 1000) + 1;
        document.getElementById('gameLevel').textContent = gameLevel;
        document.getElementById('currentGameScore').textContent = `Высота: ${Math.floor(maxHeight)}м`;
        
        // Спавн специального винила каждые 45 секунд
        if (timeSinceTrack >= 45 && vinyls.length === 0) {
            let highestPlatform = platforms.reduce((prev, current) => 
                (prev.y < current.y) ? prev : current
            );
            createVinyl(highestPlatform.x + platformWidth/2 - 15, highestPlatform.y - 40);
            lastTrackTime = Date.now();
        }
        
        setTimeout(updateGameStats, 1000);
    }
    
    // Основной игровой цикл
    function gameLoop() {
        if (!gameRunning) return;
        
        // Очистка канваса
        ctx.fillStyle = '#0f0f23';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Фоновый градиент в зависимости от высоты
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        const hue = (maxHeight / 100) % 360;
        gradient.addColorStop(0, `hsl(${hue}, 50%, 10%)`);
        gradient.addColorStop(1, `hsl(${hue}, 50%, 20%)`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        if (gamePaused) {
            drawStaticObjects();
            requestAnimationFrame(gameLoop);
            return;
        }
        
        // Обновление физики персонажа
        doodle.velocityY += doodle.gravity;
        doodle.y += doodle.velocityY;
        doodle.x += doodle.velocityX;
        
        // Супер-прыжок
        if (hasSuperJump) {
            superJumpTimer--;
            if (superJumpTimer <= 0) {
                hasSuperJump = false;
            }
        }
        
        // Щит
        if (hasShield) {
            shieldTimer--;
            if (shieldTimer <= 0) {
                hasShield = false;
            }
        }
        
        // Переход через края экрана
        if (doodle.x > canvas.width) {
            doodle.x = -doodle.width;
        } else if (doodle.x + doodle.width < 0) {
            doodle.x = canvas.width;
        }
        
        // Движение камеры
        if (doodle.y < canvas.height / 2) {
            let diff = canvas.height / 2 - doodle.y;
            doodle.y = canvas.height / 2;
            cameraY += diff;
            maxHeight = Math.max(maxHeight, cameraY);
            
            // Двигаем все объекты вниз
            platforms.forEach(platform => platform.y += diff);
            vinyls.forEach(vinyl => vinyl.y += diff);
            enemies.forEach(enemy => enemy.y += diff);
            powerUps.forEach(powerUp => powerUp.y += diff);
        }
        
        // Проверка столкновений с платформами
        platforms.forEach(platform => {
            // Движение подвижных платформ
            if (platform.type === 'moving') {
                platform.x += platform.velocityX;
                if (platform.x <= 0 || platform.x + platform.width >= canvas.width) {
                    platform.velocityX = -platform.velocityX;
                    platform.direction = -platform.direction;
                }
            }
            
            // Столкновение с платформой
            if (doodle.velocityY > 0 && !platform.broken &&
                doodle.x < platform.x + platform.width &&
                doodle.x + doodle.width > platform.x &&
                doodle.y + doodle.height > platform.y &&
                doodle.y + doodle.height < platform.y + platform.height + doodle.velocityY) {
                
                // Прыжок
                if (platform.type === 'spring') {
                    doodle.velocityY = platform.jumpBoost;
                    tg.HapticFeedback.impactOccurred('heavy');
                } else if (hasSuperJump) {
                    doodle.velocityY = doodle.jumpPower * 1.5;
                    tg.HapticFeedback.impactOccurred('medium');
                } else {
                    doodle.velocityY = doodle.jumpPower;
                    tg.HapticFeedback.impactOccurred('light');
                }
                
                // Ломающаяся платформа
                if (platform.type === 'breakable') {
                    platform.broken = true;
                    platform.velocityY = 5;
                }
                
                gameScore = Math.floor(maxHeight / 10);
            }
        });
        
        // Проверка сбора винилов
        vinyls = vinyls.filter(vinyl => {
            if (!vinyl.collected) {
                vinyl.rotation += 0.1;
                vinyl.floatOffset = Math.sin(Date.now() * 0.003) * 5;
                
                // Проверка столкновения
                const dx = (doodle.x + doodle.width/2) - vinyl.x;
                const dy = (doodle.y + doodle.height/2) - (vinyl.y + vinyl.floatOffset);
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < doodle.width/2 + vinyl.radius) {
                    vinyl.collected = true;
                    
                    // Получаем случайный трек
                    const randomTrack = getRandomTrack();
                    const isNewTrack = !unlockedTracks.includes(randomTrack.id);
                    
                    if (isNewTrack) {
                        unlockedTracks.push(randomTrack.id);
                        updateTracksCount();
                    }
                    
                    showTrackPopup(randomTrack, isNewTrack);
                    gameScore += 100;
                    return false;
                }
            }
            
            return vinyl.y < canvas.height + 50 && !vinyl.collected;
        });
        
        // Проверка столкновений с врагами
        if (!hasShield) {
            enemies.forEach(enemy => {
                if (doodle.x < enemy.x + enemy.width &&
                    doodle.x + doodle.width > enemy.x &&
                    doodle.y < enemy.y + enemy.height &&
                    doodle.y + doodle.height > enemy.y) {
                    
                    // Если прыгаем на врага сверху
                    if (doodle.velocityY > 0 && doodle.y < enemy.y) {
                        enemy.defeated = true;
                        doodle.velocityY = doodle.jumpPower;
                        gameScore += 50;
                        tg.HapticFeedback.impactOccurred('medium');
                    } else if (!hasShield) {
                        // Игра окончена
                        gameRunning = false;
                        endGame();
                        return;
                    }
                }
                
                // Движение врагов
                enemy.x += enemy.velocityX;
                if (enemy.x <= 0 || enemy.x + enemy.width >= canvas.width) {
                    enemy.velocityX = -enemy.velocityX;
                }
            });
        }
        
        // Удаление врагов
        enemies = enemies.filter(enemy => enemy.y < canvas.height + 50 && !enemy.defeated);
        
        // Проверка сбора бонусов
        powerUps = powerUps.filter(powerUp => {
            if (!powerUp.collected &&
                doodle.x < powerUp.x + powerUp.width &&
                doodle.x + doodle.width > powerUp.x &&
                doodle.y < powerUp.y + powerUp.height &&
                doodle.y + doodle.height > powerUp.y) {
                
                powerUp.collected = true;
                
                switch(powerUp.type) {
                    case 'superJump':
                        hasSuperJump = true;
                        superJumpTimer = 300; // 5 секунд
                        break;
                    case 'shield':
                        hasShield = true;
                        shieldTimer = 300;
                        break;
                }
                
                tg.HapticFeedback.impactOccurred('heavy');
                return false;
            }
            
            return powerUp.y < canvas.height + 50 && !powerUp.collected;
        });
        
        // Удаление платформ внизу и создание новых вверху
        platforms = platforms.filter(platform => {
            if (platform.broken) {
                platform.y += platform.velocityY || 5;
            }
            return platform.y < canvas.height + 50;
        });
        
        // Генерация новых платформ
        while (platforms.length < 20) {
            let highestPlatform = platforms.reduce((prev, current) => 
                (prev.y < current.y) ? prev : current
            );
            let newPlatform = generatePlatform(highestPlatform.y - platformGap);
            platforms.push(newPlatform);
            
            // Шанс создать винил
            if (Math.random() < vinylSpawnChance) {
                createVinyl(
                    newPlatform.x + platformWidth/2 - 15, 
                    newPlatform.y - 40
                );
            }
            
            // Шанс создать врага
            if (Math.random() < enemySpawnChance && maxHeight > 1000) {
                createEnemy(newPlatform.y - 50);
            }
            
            // Шанс создать бонус
            if (Math.random() < 0.003 && maxHeight > 500) {
                let bonusType = Math.random() > 0.5 ? 'superJump' : 'shield';
                createPowerUp(
                    newPlatform.x + platformWidth/2 - 12,
                    newPlatform.y - 35,
                    bonusType
                );
            }
        }
        
        // Проверка падения
        if (doodle.y > canvas.height) {
            gameRunning = false;
            endGame();
            return;
        }
        
        drawStaticObjects();
        requestAnimationFrame(gameLoop);
    }
    
    // Отрисовка всех объектов
    function drawStaticObjects() {
        // Рисуем платформы
        platforms.forEach(platform => {
            if (!platform.broken) {
                // Тень платформы
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                ctx.fillRect(platform.x + 2, platform.y + 2, platform.width, platform.height);
                
                // Сама платформа
                ctx.fillStyle = platform.color;
                ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
                
                // Пружина
                if (platform.type === 'spring') {
                    ctx.fillStyle = '#feca57';
                    ctx.fillRect(platform.x + platform.width/2 - 5, platform.y - 5, 10, 5);
                }
                
                // Трещины на ломающейся платформе
                if (platform.type === 'breakable') {
                    ctx.strokeStyle = '#a00';
                    ctx.beginPath();
                    ctx.moveTo(platform.x + 10, platform.y + platform.height/2);
                    ctx.lineTo(platform.x + 20, platform.y + platform.height/2);
                    ctx.stroke();
                }
            }
        });
        
        // Рисуем врагов
        enemies.forEach(enemy => {
            ctx.fillStyle = enemy.color;
            if (enemy.type === 'monster') {
                // Монстр - круг с зубами
                ctx.beginPath();
                ctx.arc(enemy.x + enemy.width/2, enemy.y + enemy.height/2, enemy.width/2, 0, Math.PI * 2);
                ctx.fill();
                
                // Глаза
                ctx.fillStyle = '#fff';
                ctx.fillRect(enemy.x + 8, enemy.y + 8, 4, 4);
                ctx.fillRect(enemy.x + 18, enemy.y + 8, 4, 4);
            } else {
                // Шип - треугольник
                ctx.beginPath();
                ctx.moveTo(enemy.x + enemy.width/2, enemy.y);
                ctx.lineTo(enemy.x, enemy.y + enemy.height);
                ctx.lineTo(enemy.x + enemy.width, enemy.y + enemy.height);
                ctx.closePath();
                ctx.fill();
            }
        });
        
        // Рисуем бонусы
        powerUps.forEach(powerUp => {
            ctx.save();
            ctx.translate(powerUp.x + powerUp.width/2, powerUp.y + powerUp.height/2);
            ctx.rotate(Date.now() * 0.002);
            
            if (powerUp.type === 'superJump') {
                // Ракета
                ctx.fillStyle = '#ff6b6b';
                ctx.fillRect(-10, -10, 20, 20);
                ctx.fillStyle = '#feca57';
                ctx.beginPath();
                ctx.moveTo(0, -10);
                ctx.lineTo(-5, -15);
                ctx.lineTo(5, -15);
                ctx.closePath();
                ctx.fill();
            } else if (powerUp.type === 'shield') {
                // Щит
                ctx.fillStyle = '#45b7d1';
                ctx.beginPath();
                ctx.arc(0, 0, 12, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
            
            ctx.restore();
        });
        
        // Рисуем виниловые пластинки
        vinyls.forEach(vinyl => {
            if (!vinyl.collected) {
                ctx.save();
                ctx.translate(vinyl.x, vinyl.y + vinyl.floatOffset);
                ctx.rotate(vinyl.rotation);
                
                // Тень
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                ctx.beginPath();
                ctx.arc(2, 2, vinyl.radius, 0, Math.PI * 2);
                ctx.fill();
                
                // Пластинка
                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.arc(0, 0, vinyl.radius, 0, Math.PI * 2);
                ctx.fill();
                
                // Контур
                ctx.strokeStyle = '#4ecdc4';
                ctx.lineWidth = 2;
                ctx.stroke();
                
                // Центр
                ctx.fillStyle = '#4ecdc4';
                ctx.beginPath();
                ctx.arc(0, 0, 3, 0, Math.PI * 2);
                ctx.fill();
                
                // Дорожки
                ctx.strokeStyle = '#4ecdc4';
                ctx.lineWidth = 1;
                for (let i = 0; i < 2; i++) {
                    ctx.beginPath();
                    ctx.arc(0, 0, 6 + i * 4, 0, Math.PI * 2);
                    ctx.stroke();
                }
                
                ctx.restore();
                
                // Подсветка
                ctx.fillStyle = 'rgba(78, 205, 196, 0.3)';
                ctx.beginPath();
                ctx.arc(vinyl.x, vinyl.y + vinyl.floatOffset, vinyl.radius + 5, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        
        // Рисуем персонажа
        ctx.save();
        
        // Щит вокруг персонажа
        if (hasShield) {
            ctx.fillStyle = 'rgba(69, 183, 209, 0.3)';
            ctx.beginPath();
            ctx.arc(doodle.x + doodle.width/2, doodle.y + doodle.height/2, doodle.width, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#45b7d1';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        
        // Тень персонажа
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(doodle.x + 2, doodle.y + 2, doodle.width, doodle.height);
        
        // Тело персонажа
        ctx.fillStyle = doodle.color;
        ctx.fillRect(doodle.x, doodle.y, doodle.width, doodle.height);
        
        // Глаза
        ctx.fillStyle = '#fff';
        if (doodle.direction === 1) {
            ctx.fillRect(doodle.x + 18, doodle.y + 8, 6, 6);
            ctx.fillRect(doodle.x + 26, doodle.y + 8, 6, 6);
        } else {
            ctx.fillRect(doodle.x - 2, doodle.y + 8, 6, 6);
            ctx.fillRect(doodle.x + 6, doodle.y + 8, 6, 6);
        }
        
        // Супер-прыжок эффект
        if (hasSuperJump) {
            ctx.fillStyle = 'rgba(255, 107, 107, 0.5)';
            ctx.fillRect(doodle.x - 2, doodle.y + doodle.height, doodle.width + 4, 5);
            
            // Частицы огня
            for (let i = 0; i < 3; i++) {
                ctx.fillStyle = `rgba(255, ${100 + i * 50}, 0, ${0.8 - i * 0.2})`;
                ctx.fillRect(
                    doodle.x + Math.random() * doodle.width, 
                    doodle.y + doodle.height + Math.random() * 10,
                    3, 3
                );
            }
        }
        
        ctx.restore();
        
        // UI элементы
        // Высота
        ctx.fillStyle = '#4ecdc4';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Высота: ${Math.floor(maxHeight)}м`, 10, 20);
        
        // Индикаторы бонусов
        if (hasSuperJump) {
            ctx.fillStyle = '#ff6b6b';
            ctx.fillRect(10, 30, (superJumpTimer / 300) * 100, 5);
            ctx.strokeStyle = '#ff6b6b';
            ctx.strokeRect(10, 30, 100, 5);
        }
        
        if (hasShield) {
            ctx.fillStyle = '#45b7d1';
            ctx.fillRect(10, 40, (shieldTimer / 300) * 100, 5);
            ctx.strokeStyle = '#45b7d1';
            ctx.strokeRect(10, 40, 100, 5);
        }
    }
    
    // Конец игры
    function endGame() {
        updateScore(gameScore);
        document.getElementById('gameOverDiv').style.display = 'block';
        document.getElementById('gameInstructions').textContent = 
            `Игра окончена! Максимальная высота: ${Math.floor(maxHeight)}м`;
    }
    
    // Запуск игры
    createInitialPlatforms();
    gameRunning = true;
    gameLoop();
    updateGameStats();
}
