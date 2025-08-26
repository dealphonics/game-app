// RISK OF RAIN - УПРОЩЕННАЯ ВЕРСИЯ
function startRiskGame() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    document.getElementById('gameOverDiv').style.display = 'none';
    document.getElementById('gameInstructions').textContent = 'Управление: движение • Автоатака';
    document.getElementById('levelTransitionDiv').innerHTML = '';
    
    // Игровые переменные
    let gameScore = 0;
    let gameLevel = 1;
    let gameStartTime = Date.now();
    let lastTrackTime = Date.now();
    let difficulty = 1;
    let waveNumber = 1;
    let enemiesKilled = 0;
    let totalEnemiesKilled = 0;
    
    // Камера
    let cameraX = 0;
    let cameraY = 0;
    
    // Уровень (платформы)
    const levelWidth = 800;
    const levelHeight = 240;
    let platforms = [];
    
    // Игрок
    let player = {
        x: 100,
        y: 150,
        width: 20,
        height: 30,
        velocityX: 0,
        velocityY: 0,
        speed: 3,
        jumpPower: -8,
        gravity: 0.4,
        onGround: false,
        facing: 1, // 1 - вправо, -1 - влево
        
        // Характеристики
        maxHealth: 100,
        health: 100,
        damage: 10,
        attackSpeed: 300, // мс между атаками
        attackRange: 50,
        shootRange: 150,
        defense: 0,
        critChance: 0.1,
        lifeSteal: 0,
        
        // Состояния
        lastAttackTime: 0,
        lastShootTime: 0,
        isAttacking: false,
        attackAnimation: 0,
        invulnerable: false,
        invulnerableTime: 0,
        
        // Инвентарь
        items: [],
        exp: 0,
        level: 1,
        skillPoints: 0
    };
    
    // Враги
    let enemies = [];
    let enemySpawnTimer = 0;
    let enemySpawnDelay = 2000; // мс между спавнами (уменьшил с 3000)
    let lastEnemySpawn = 0;
    
    // Типы врагов
    const enemyTypes = {
        slime: {
            width: 20,
            height: 20,
            health: 30,
            damage: 5,
            speed: 1,
            color: '#96ceb4',
            exp: 10,
            jumpHeight: -5
        },
        beetle: {
            width: 25,
            height: 15,
            health: 50,
            damage: 10,
            speed: 1.5,
            color: '#ff6b6b',
            exp: 20,
            jumpHeight: -6
        },
        golem: {
            width: 35,
            height: 40,
            health: 150,
            damage: 20,
            speed: 0.5,
            color: '#e17055',
            exp: 50,
            jumpHeight: -4
        },
        fly: {
            width: 15,
            height: 15,
            health: 20,
            damage: 8,
            speed: 2,
            color: '#45b7d1',
            exp: 15,
            flying: true
        }
    };
    
    // Предметы и апгрейды
    let items = [];
    let chests = [];
    
    // Типы предметов
    const itemTypes = {
        healthPotion: {
            name: 'Зелье здоровья',
            color: '#ff6b6b',
            effect: () => {
                player.health = Math.min(player.maxHealth, player.health + 30);
            },
            instant: true
        },
        damageUp: {
            name: 'Острый клинок',
            color: '#feca57',
            effect: () => {
                player.damage += 5;
            }
        },
        speedUp: {
            name: 'Ботинки скорости',
            color: '#45b7d1',
            effect: () => {
                player.speed += 0.5;
            }
        },
        critUp: {
            name: 'Критический удар',
            color: '#9C27B0',
            effect: () => {
                player.critChance += 0.1;
            }
        },
        lifeSteal: {
            name: 'Вампиризм',
            color: '#e17055',
            effect: () => {
                player.lifeSteal += 0.1;
            }
        },
        shield: {
            name: 'Щит',
            color: '#4ecdc4',
            effect: () => {
                player.defense += 5;
            }
        },
        attackSpeed: {
            name: 'Скорострельность',
            color: '#ff00ff',
            effect: () => {
                player.attackSpeed = Math.max(100, player.attackSpeed - 50);
            }
        }
    };
    
    // Снаряды
    let projectiles = [];
    
    // Эффекты
    let particles = [];
    let damageNumbers = [];
    
    // Виниловые пластинки
    let vinyls = [];
    
    // Управление
    let keys = {};
    let touchStartX = null;
    let touchStartY = null;
    let joystickActive = false;
    let joystickBase = { x: 0, y: 0 };
    let joystickKnob = { x: 0, y: 0 };
    let attackButtonPressed = false;
    
    gameRunning = false;
    gamePaused = false;
    
    // Создание уровня
    function createLevel() {
        platforms = [];
        
        // Основная платформа (земля)
        platforms.push({
            x: 0,
            y: 200,
            width: levelWidth,
            height: 40,
            color: '#2d3436'
        });
        
        // Дополнительные платформы
        platforms.push({
            x: 150,
            y: 150,
            width: 100,
            height: 10,
            color: '#2d3436'
        });
        
        platforms.push({
            x: 300,
            y: 120,
            width: 80,
            height: 10,
            color: '#2d3436'
        });
        
        platforms.push({
            x: 450,
            y: 160,
            width: 120,
            height: 10,
            color: '#2d3436'
        });
        
        platforms.push({
            x: 600,
            y: 100,
            width: 100,
            height: 10,
            color: '#2d3436'
        });
        
        // Спавним начальных врагов
        for (let i = 0; i < 3; i++) {
            setTimeout(() => spawnEnemy(), i * 500);
        }
    }
    
    // Спавн врага
    function spawnEnemy() {
        const types = Object.keys(enemyTypes);
        let availableTypes = types.slice(0, Math.min(types.length, Math.floor(waveNumber / 2) + 1));
        const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        const template = enemyTypes[type];
        
        // Спавн с обеих сторон экрана
        const spawnX = Math.random() > 0.5 ? 
            cameraX - 50 : 
            cameraX + canvas.width + 50;
        
        const enemy = {
            x: spawnX,
            y: template.flying ? 50 + Math.random() * 100 : 50,
            width: template.width,
            height: template.height,
            velocityX: 0,
            velocityY: 0,
            maxHealth: template.health * difficulty,
            health: template.health * difficulty,
            damage: template.damage * difficulty,
            speed: template.speed,
            color: template.color,
            type: type,
            exp: template.exp,
            jumpHeight: template.jumpHeight || -5,
            flying: template.flying || false,
            onGround: false,
            lastAttackTime: 0,
            stunned: false,
            stunnedTime: 0
        };
        
        enemies.push(enemy);
        
        // Создаем частицы спавна
        createParticles(enemy.x + enemy.width/2, enemy.y + enemy.height/2, enemy.color, 8);
    }
    
    // Спавн сундука
    function spawnChest(x, y) {
        chests.push({
            x: x,
            y: y,
            width: 25,
            height: 20,
            opened: false,
            color: '#feca57'
        });
    }
    
    // Спавн предмета
    function spawnItem(x, y, type = null) {
        const itemTypeKeys = Object.keys(itemTypes);
        const itemType = type || itemTypeKeys[Math.floor(Math.random() * itemTypeKeys.length)];
        
        items.push({
            x: x,
            y: y,
            width: 15,
            height: 15,
            type: itemType,
            data: itemTypes[itemType],
            velocityY: -3,
            collected: false
        });
    }
    
    // Спавн винила
    function spawnVinyl(x, y) {
        vinyls.push({
            x: x,
            y: y,
            radius: 18,
            rotation: 0,
            collected: false,
            floatOffset: 0
        });
    }
    
    // Создание частиц
    function createParticles(x, y, color, count = 5) {
        for (let i = 0; i < count; i++) {
            particles.push({
                x: x,
                y: y,
                velocityX: (Math.random() - 0.5) * 4,
                velocityY: (Math.random() - 0.5) * 4,
                size: Math.random() * 3 + 1,
                color: color,
                lifetime: 30
            });
        }
    }
    
    // Показ урона
    function showDamage(x, y, damage, isCrit = false) {
        damageNumbers.push({
            x: x,
            y: y,
            text: Math.floor(damage).toString(),
            color: isCrit ? '#feca57' : '#fff',
            velocityY: -2,
            lifetime: 30,
            size: isCrit ? 16 : 12
        });
    }
    
    // Обработка управления
    document.addEventListener('keydown', (e) => {
        keys[e.key] = true;
    });
    
    document.addEventListener('keyup', (e) => {
        keys[e.key] = false;
    });
    
    // Мобильное управление
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        
        for (let i = 0; i < e.touches.length; i++) {
            const touch = e.touches[i];
            const touchX = touch.clientX - rect.left;
            const touchY = touch.clientY - rect.top;
            
            // Кнопка атаки в правом нижнем углу
            if (touchX > canvas.width - 60 && touchY > canvas.height - 60) {
                attackButtonPressed = true;
                playerMeleeAttack();
            }
            // Джойстик в левой части
            else if (touchX < canvas.width / 2 && !joystickActive) {
                joystickActive = true;
                joystickBase.x = touchX;
                joystickBase.y = touchY;
                joystickKnob.x = touchX;
                joystickKnob.y = touchY;
            }
        }
    });
    
    canvas.addEventListener('touchmove', (e) => {
        if (!joystickActive) return;
        e.preventDefault();
        
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const touchX = touch.clientX - rect.left;
        const touchY = touch.clientY - rect.top;
        
        const dx = touchX - joystickBase.x;
        const dy = touchY - joystickBase.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 30;
        
        if (distance <= maxDistance) {
            joystickKnob.x = touchX;
            joystickKnob.y = touchY;
        } else {
            const angle = Math.atan2(dy, dx);
            joystickKnob.x = joystickBase.x + Math.cos(angle) * maxDistance;
            joystickKnob.y = joystickBase.y + Math.sin(angle) * maxDistance;
        }
        
        // Движение игрока
        const moveX = (joystickKnob.x - joystickBase.x) / maxDistance;
        const moveY = (joystickKnob.y - joystickBase.y) / maxDistance;
        
        if (Math.abs(moveX) > 0.3) {
            player.velocityX = moveX * player.speed;
            player.facing = moveX > 0 ? 1 : -1;
        }
        
        if (moveY < -0.5 && player.onGround) {
            player.velocityY = player.jumpPower;
        }
    });
    
    canvas.addEventListener('touchend', (e) => {
        // Проверяем, закончилось ли касание джойстика
        let joystickTouchEnded = true;
        for (let i = 0; i < e.touches.length; i++) {
            const rect = canvas.getBoundingClientRect();
            const touchX = e.touches[i].clientX - rect.left;
            if (touchX < canvas.width / 2) {
                joystickTouchEnded = false;
                break;
            }
        }
        
        if (joystickTouchEnded) {
            joystickActive = false;
            player.velocityX = 0;
        }
        
        attackButtonPressed = false;
    });
    
    // Ближняя атака игрока
    function playerMeleeAttack() {
        const now = Date.now();
        if (now - player.lastAttackTime < player.attackSpeed) return;
        
        player.lastAttackTime = now;
        player.isAttacking = true;
        player.attackAnimation = 10;
        
        // Ближний бой
        enemies.forEach(enemy => {
            const dx = enemy.x + enemy.width/2 - (player.x + player.width/2);
            const dy = enemy.y + enemy.height/2 - (player.y + player.height/2);
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < player.attackRange) {
                const isCrit = Math.random() < player.critChance;
                const damage = player.damage * (isCrit ? 2 : 1);
                
                enemy.health -= damage;
                enemy.stunned = true;
                enemy.stunnedTime = 10;
                enemy.velocityX = (enemy.x > player.x ? 1 : -1) * 3;
                enemy.velocityY = -3;
                
                showDamage(enemy.x + enemy.width/2, enemy.y, damage, isCrit);
                createParticles(enemy.x + enemy.width/2, enemy.y + enemy.height/2, enemy.color);
                
                // Вампиризм
                if (player.lifeSteal > 0) {
                    const heal = damage * player.lifeSteal;
                    player.health = Math.min(player.maxHealth, player.health + heal);
                    createParticles(player.x + player.width/2, player.y, '#ff6b6b', 3);
                }
                
                tg.HapticFeedback.impactOccurred('medium');
            }
        });
    }
    
    // Автоматическая стрельба
    function autoShoot() {
        const now = Date.now();
        if (now - player.lastShootTime < player.attackSpeed * 2) return;
        
        // Находим ближайшего врага
        let nearestEnemy = null;
        let nearestDistance = player.shootRange;
        
        enemies.forEach(enemy => {
            const dx = enemy.x + enemy.width/2 - (player.x + player.width/2);
            const dy = enemy.y + enemy.height/2 - (player.y + player.height/2);
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestEnemy = enemy;
            }
        });
        
        if (nearestEnemy) {
            player.lastShootTime = now;
            
            // Направление к врагу
            const dx = nearestEnemy.x + nearestEnemy.width/2 - (player.x + player.width/2);
            const dy = nearestEnemy.y + nearestEnemy.height/2 - (player.y + player.height/2);
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            projectiles.push({
                x: player.x + player.width/2,
                y: player.y + player.height/2,
                velocityX: (dx / distance) * 8,
                velocityY: (dy / distance) * 8,
                damage: player.damage * 0.7,
                color: '#feca57',
                size: 3,
                lifetime: 60
            });
            
            // Обновляем направление взгляда
            player.facing = dx > 0 ? 1 : -1;
        }
    }
    
    // Обновление игровой статистики
    function updateGameStats() {
        if (!gameRunning) return;
        
        const gameTime = Math.floor((Date.now() - gameStartTime) / 1000);
        const minutes = Math.floor(gameTime / 60);
        const seconds = gameTime % 60;
        document.getElementById('gameTime').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // Увеличение сложности
        difficulty = 1 + (gameTime / 60) * 0.5;
        waveNumber = Math.floor(gameTime / 30) + 1;
        
        // Спавн винила
        const timeSinceTrack = Math.floor((Date.now() - lastTrackTime) / 1000);
        const timeToTrack = Math.max(0, 60 - timeSinceTrack);
        document.getElementById('timeToTrack').textContent = `${timeToTrack}s`;
        
        if (timeSinceTrack >= 60 && vinyls.length === 0) {
            spawnVinyl(
                player.x + (Math.random() - 0.5) * 200,
                player.y - 50
            );
            lastTrackTime = Date.now();
        }
        
        document.getElementById('gameLevel').textContent = waveNumber;
        document.getElementById('currentGameScore').textContent = `Очки: ${gameScore}`;
        
        setTimeout(updateGameStats, 1000);
    }
    
    // Основной игровой цикл
    function gameLoop() {
        if (!gameRunning) return;
        
        // Очистка канваса
        ctx.fillStyle = '#0f0f23';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Фоновый градиент
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#0f0f23');
        gradient.addColorStop(1, '#16213e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        if (gamePaused) {
            drawStaticObjects();
            requestAnimationFrame(gameLoop);
            return;
        }
        
        // Обновление камеры
        cameraX = Math.max(0, Math.min(levelWidth - canvas.width, player.x - canvas.width/2));
        
        ctx.save();
        ctx.translate(-cameraX, -cameraY);
        
        // Управление игроком
        if (keys['ArrowLeft'] || keys['a']) {
            player.velocityX = -player.speed;
            player.facing = -1;
        } else if (keys['ArrowRight'] || keys['d']) {
            player.velocityX = player.speed;
            player.facing = 1;
        } else if (!joystickActive) {
            player.velocityX *= 0.8;
        }
        
        if ((keys['ArrowUp'] || keys['w'] || keys[' ']) && player.onGround) {
            player.velocityY = player.jumpPower;
        }
        
        if (keys['x'] || keys['Enter']) {
            playerMeleeAttack();
        }
        
        // Автоматическая стрельба
        autoShoot();
        
        // Физика игрока
        player.velocityY += player.gravity;
        player.x += player.velocityX;
        player.y += player.velocityY;
        
        // Ограничения уровня
        player.x = Math.max(0, Math.min(levelWidth - player.width, player.x));
        
        // Столкновения с платформами
        player.onGround = false;
        platforms.forEach(platform => {
            if (player.x < platform.x + platform.width &&
                player.x + player.width > platform.x &&
                player.y < platform.y + platform.height &&
                player.y + player.height > platform.y) {
                
                // Сверху
                if (player.velocityY > 0 && player.y < platform.y) {
                    player.y = platform.y - player.height;
                    player.velocityY = 0;
                    player.onGround = true;
                }
                // Снизу
                else if (player.velocityY < 0 && player.y > platform.y) {
                    player.y = platform.y + platform.height;
                    player.velocityY = 0;
                }
            }
        });
        
        // Анимация атаки
        if (player.attackAnimation > 0) {
            player.attackAnimation--;
            if (player.attackAnimation === 0) {
                player.isAttacking = false;
            }
        }
        
        // Неуязвимость
        if (player.invulnerable) {
            player.invulnerableTime--;
            if (player.invulnerableTime <= 0) {
                player.invulnerable = false;
            }
        }
        
        // Спавн врагов
        const now = Date.now();
        if (now - lastEnemySpawn >= enemySpawnDelay / difficulty) {
            spawnEnemy();
            lastEnemySpawn = now;
            
            // Увеличиваем количество врагов с волнами
            if (waveNumber > 2 && Math.random() < 0.3) {
                setTimeout(() => spawnEnemy(), 500);
            }
        }
        
        // Обновление врагов
        enemies = enemies.filter(enemy => {
            // Оглушение
            if (enemy.stunned) {
                enemy.stunnedTime--;
                if (enemy.stunnedTime <= 0) {
                    enemy.stunned = false;
                }
            }
            
            // ИИ врага
            if (!enemy.stunned) {
                const dx = player.x - enemy.x;
                const dy = player.y - enemy.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (enemy.flying) {
                    // Летающие враги
                    enemy.velocityX = (dx / distance) * enemy.speed;
                    enemy.velocityY = (dy / distance) * enemy.speed;
                } else {
                    // Наземные враги
                    if (distance < 300) {
                        enemy.velocityX = Math.sign(dx) * enemy.speed;
                        
                        // Прыжок если игрок выше
                        if (dy < -30 && enemy.onGround && Math.random() < 0.02) {
                            enemy.velocityY = enemy.jumpHeight;
                        }
                    } else {
                        enemy.velocityX *= 0.9;
                    }
                    
                    enemy.velocityY += player.gravity;
                }
            }
            
            enemy.x += enemy.velocityX;
            enemy.y += enemy.velocityY;
            
            // Столкновения врагов с платформами
            if (!enemy.flying) {
                enemy.onGround = false;
                platforms.forEach(platform => {
                    if (enemy.x < platform.x + platform.width &&
                        enemy.x + enemy.width > platform.x &&
                        enemy.y < platform.y + platform.height &&
                        enemy.y + enemy.height > platform.y) {
                        
                        if (enemy.velocityY > 0 && enemy.y < platform.y) {
                            enemy.y = platform.y - enemy.height;
                            enemy.velocityY = 0;
                            enemy.onGround = true;
                        }
                    }
                });
            }
            
            // Атака врага
            const attackDistance = 30;
            const dx = player.x - enemy.x;
            const dy = player.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < attackDistance && !player.invulnerable) {
                if (now - enemy.lastAttackTime > 1000) {
                    enemy.lastAttackTime = now;
                    const damage = Math.max(1, enemy.damage - player.defense);
                    player.health -= damage;
                    player.invulnerable = true;
                    player.invulnerableTime = 60;
                    
                    showDamage(player.x + player.width/2, player.y, damage);
                    createParticles(player.x + player.width/2, player.y + player.height/2, '#ff6b6b');
                    tg.HapticFeedback.impactOccurred('heavy');
                    
                    // Отбрасывание
                    player.velocityX = (player.x > enemy.x ? 1 : -1) * 5;
                    player.velocityY = -5;
                }
            }
            
            // Смерть врага
            if (enemy.health <= 0) {
                enemiesKilled++;
                totalEnemiesKilled++;
                gameScore += enemy.exp;
                player.exp += enemy.exp;
                
                createParticles(enemy.x + enemy.width/2, enemy.y + enemy.height/2, enemy.color, 10);
                
                // Шанс выпадения предмета
                if (Math.random() < 0.25) {
                    spawnItem(enemy.x + enemy.width/2, enemy.y);
                }
                
                // Шанс выпадения сундука
                if (Math.random() < 0.1) {
                    spawnChest(enemy.x + enemy.width/2, enemy.y);
                }
                
                return false;
            }
            
            // Удаляем врагов, которые упали слишком низко
            if (enemy.y > canvas.height + 100) {
                return false;
            }
            
            return true;
        });
        
        // Обновление снарядов
        projectiles = projectiles.filter(projectile => {
            projectile.x += projectile.velocityX;
            projectile.y += projectile.velocityY;
            projectile.lifetime--;
            
            // Столкновение с врагами
            let hit = false;
            enemies.forEach(enemy => {
                const dx = enemy.x + enemy.width/2 - projectile.x;
                const dy = enemy.y + enemy.height/2 - projectile.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < enemy.width/2 + projectile.size && !hit) {
                    const isCrit = Math.random() < player.critChance;
                    const damage = projectile.damage * (isCrit ? 2 : 1);
                    
                    enemy.health -= damage;
                    showDamage(enemy.x + enemy.width/2, enemy.y, damage, isCrit);
                    createParticles(projectile.x, projectile.y, projectile.color, 3);
                    hit = true;
                }
            });
            
            return projectile.lifetime > 0 && !hit;
        });
        
        // Обновление предметов
        items = items.filter(item => {
            if (!item.collected) {
                item.velocityY += 0.2;
                item.y += item.velocityY;
                
                // Отскок от платформ
                platforms.forEach(platform => {
                    if (item.x < platform.x + platform.width &&
                        item.x + item.width > platform.x &&
                        item.y < platform.y + platform.height &&
                        item.y + item.height > platform.y) {
                        
                        item.y = platform.y - item.height;
                        item.velocityY = -item.velocityY * 0.5;
                    }
                });
                
                // Сбор предмета
                const dx = player.x + player.width/2 - (item.x + item.width/2);
                const dy = player.y + player.height/2 - (item.y + item.height/2);
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 20) {
                    item.collected = true;
                    item.data.effect();
                    
                    if (!item.data.instant) {
                        player.items.push(item.type);
                    }
                    
                    createParticles(item.x + item.width/2, item.y + item.height/2, item.data.color, 8);
                    tg.HapticFeedback.impactOccurred('light');
                    
                    // Показываем название предмета
                    damageNumbers.push({
                        x: item.x,
                        y: item.y - 10,
                        text: item.data.name,
                        color: item.data.color,
                        velocityY: -1,
                        lifetime: 60,
                        size: 10
                    });
                }
            }
            
            return !item.collected && item.y < canvas.height + 50;
        });
        
        // Обновление сундуков
        chests.forEach(chest => {
            if (!chest.opened) {
                const dx = player.x + player.width/2 - (chest.x + chest.width/2);
                const dy = player.y + player.height/2 - (chest.y + chest.height/2);
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 30) {
                    chest.opened = true;
                    
                    // Выпадение предметов
                    for (let i = 0; i < 3; i++) {
                        spawnItem(
                            chest.x + chest.width/2 + (Math.random() - 0.5) * 40,
                            chest.y - 10
                        );
                    }
                    
                    createParticles(chest.x + chest.width/2, chest.y + chest.height/2, chest.color, 15);
                    tg.HapticFeedback.impactOccurred('heavy');
                }
            }
        });
        
        // Обновление винилов
        vinyls = vinyls.filter(vinyl => {
            if (!vinyl.collected) {
                vinyl.rotation += 0.05;
                vinyl.floatOffset = Math.sin(Date.now() * 0.003) * 5;
                
                const dx = player.x + player.width/2 - vinyl.x;
                const dy = player.y + player.height/2 - (vinyl.y + vinyl.floatOffset);
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < player.width/2 + vinyl.radius) {
                    vinyl.collected = true;
                    
                    const randomTrack = getRandomTrack();
                    const isNewTrack = !unlockedTracks.includes(randomTrack.id);
                    
                    if (isNewTrack) {
                        unlockedTracks.push(randomTrack.id);
                        updateTracksCount();
                    }
                    
                    showTrackPopup(randomTrack, isNewTrack);
                    gameScore += 200;
                    
                    createParticles(vinyl.x, vinyl.y, '#4ecdc4', 20);
                    return false;
                }
            }
            
            return !vinyl.collected;
        });
        
        // Обновление частиц
        particles = particles.filter(particle => {
            particle.x += particle.velocityX;
            particle.y += particle.velocityY;
            particle.velocityX *= 0.95;
            particle.velocityY += 0.1;
            particle.lifetime--;
            particle.size *= 0.95;
            
            return particle.lifetime > 0;
        });
        
        // Обновление чисел урона
        damageNumbers = damageNumbers.filter(number => {
            number.y += number.velocityY;
            number.velocityY += 0.1;
            number.lifetime--;
            
            return number.lifetime > 0;
        });
        
        // Проверка смерти игрока
        if (player.health <= 0) {
            gameRunning = false;
            endGame();
            ctx.restore();
            return;
        }
        
        // Падение с уровня
        if (player.y > canvas.height + 100) {
            player.health = 0;
        }
        
        drawStaticObjects();
        ctx.restore();
        
        // UI (не двигается с камерой)
        drawUI();
        
        requestAnimationFrame(gameLoop);
    }
    
    // Отрисовка объектов
    function drawStaticObjects() {
        // Платформы
        platforms.forEach(platform => {
            ctx.fillStyle = platform.color;
            ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
            
            // Контур
            ctx.strokeStyle = '#4ecdc4';
            ctx.lineWidth = 1;
            ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
        });
        
        // Сундуки
        chests.forEach(chest => {
            if (!chest.opened) {
                // Тень
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                ctx.fillRect(chest.x + 2, chest.y + 2, chest.width, chest.height);
                
                // Сундук
                ctx.fillStyle = chest.color;
                ctx.fillRect(chest.x, chest.y, chest.width, chest.height);
                
                // Крышка
                ctx.fillStyle = '#f39c12';
                ctx.fillRect(chest.x, chest.y, chest.width, chest.height/2);
                
                // Замок
                ctx.fillStyle = '#2c3e50';
                ctx.fillRect(chest.x + chest.width/2 - 3, chest.y + chest.height/2 - 3, 6, 8);
            }
        });
        
        // Предметы
        items.forEach(item => {
            if (!item.collected) {
                // Подсветка
                ctx.fillStyle = `${item.data.color}33`;
                ctx.beginPath();
                ctx.arc(item.x + item.width/2, item.y + item.height/2, item.width, 0, Math.PI * 2);
                ctx.fill();
                
                // Предмет
                ctx.fillStyle = item.data.color;
                ctx.fillRect(item.x, item.y, item.width, item.height);
                
                // Иконка
                ctx.fillStyle = '#fff';
                ctx.font = '10px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('★', item.x + item.width/2, item.y + item.height/2 + 3);
            }
        });
        
        // Виниловые пластинки
        vinyls.forEach(vinyl => {
            if (!vinyl.collected) {
                ctx.save();
                ctx.translate(vinyl.x, vinyl.y + vinyl.floatOffset);
                ctx.rotate(vinyl.rotation);
                
                // Свечение
                ctx.fillStyle = 'rgba(78, 205, 196, 0.3)';
                ctx.beginPath();
                ctx.arc(0, 0, vinyl.radius + 8, 0, Math.PI * 2);
                ctx.fill();
                
                // Пластинка
                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.arc(0, 0, vinyl.radius, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.strokeStyle = '#4ecdc4';
                ctx.lineWidth = 2;
                ctx.stroke();
                
                // Центр
                ctx.fillStyle = '#4ecdc4';
                ctx.beginPath();
                ctx.arc(0, 0, 4, 0, Math.PI * 2);
                ctx.fill();
                
                // Дорожки
                for (let i = 0; i < 3; i++) {
                    ctx.beginPath();
                    ctx.arc(0, 0, 6 + i * 4, 0, Math.PI * 2);
                    ctx.strokeStyle = '#4ecdc4';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
                
                ctx.restore();
            }
        });
        
        // Враги
        enemies.forEach(enemy => {
            // Тень
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(enemy.x + 2, enemy.y + 2, enemy.width, enemy.height);
            
            // Тело врага
            ctx.fillStyle = enemy.stunned ? '#888' : enemy.color;
            
            if (enemy.type === 'slime') {
                // Слизень - круглый
                ctx.beginPath();
                ctx.arc(enemy.x + enemy.width/2, enemy.y + enemy.height/2, enemy.width/2, 0, Math.PI * 2);
                ctx.fill();
            } else if (enemy.type === 'fly') {
                // Летающий враг - с крыльями
                ctx.fillRect(enemy.x + 2, enemy.y, enemy.width - 4, enemy.height);
                // Крылья
                ctx.fillStyle = `${enemy.color}66`;
                ctx.fillRect(enemy.x - 3, enemy.y + 2, 6, enemy.height - 4);
                ctx.fillRect(enemy.x + enemy.width - 3, enemy.y + 2, 6, enemy.height - 4);
            } else {
                // Остальные - прямоугольные
                ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            }
            
            // Глаза
            ctx.fillStyle = enemy.stunned ? '#fff' : '#000';
            const eyeY = enemy.y + enemy.height/3;
            ctx.fillRect(enemy.x + enemy.width/3 - 2, eyeY, 3, 3);
            ctx.fillRect(enemy.x + 2*enemy.width/3 - 2, eyeY, 3, 3);
            
            // Полоска здоровья
            if (enemy.health < enemy.maxHealth) {
                ctx.fillStyle = '#000';
                ctx.fillRect(enemy.x, enemy.y - 8, enemy.width, 3);
                ctx.fillStyle = '#ff6b6b';
                ctx.fillRect(enemy.x, enemy.y - 8, enemy.width * (enemy.health / enemy.maxHealth), 3);
            }
        });
        
        // Снаряды
        projectiles.forEach(projectile => {
            ctx.fillStyle = projectile.color;
            ctx.beginPath();
            ctx.arc(projectile.x, projectile.y, projectile.size, 0, Math.PI * 2);
            ctx.fill();
            
            // След
            ctx.fillStyle = `${projectile.color}66`;
            ctx.fillRect(projectile.x - projectile.velocityX, projectile.y, projectile.size * 2, projectile.size);
        });
        
        // Игрок
        if (!player.invulnerable || Math.floor(Date.now() / 100) % 2) {
            // Тень
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(player.x + 2, player.y + 2, player.width, player.height);
            
            // Тело
            ctx.fillStyle = '#4ecdc4';
            ctx.fillRect(player.x, player.y, player.width, player.height);
            
            // Голова
            ctx.fillStyle = '#45b7d1';
            ctx.fillRect(player.x + 2, player.y + 2, player.width - 4, 8);
            
            // Глаза
            ctx.fillStyle = '#fff';
            if (player.facing === 1) {
                ctx.fillRect(player.x + 12, player.y + 4, 3, 3);
                ctx.fillRect(player.x + 16, player.y + 4, 3, 3);
            } else {
                ctx.fillRect(player.x + 1, player.y + 4, 3, 3);
                ctx.fillRect(player.x + 5, player.y + 4, 3, 3);
            }
            
            // Оружие (если атакует)
            if (player.isAttacking) {
                ctx.fillStyle = '#feca57';
                const swordX = player.facing === 1 ? player.x + player.width : player.x - 15;
                const swordY = player.y + player.height/2 - 2;
                ctx.fillRect(swordX, swordY, 15, 4);
            }
        }
        
        // Частицы
        particles.forEach(particle => {
            ctx.fillStyle = particle.color + Math.floor(particle.lifetime * 8).toString(16);
            ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
        });
        
        // Числа урона
        damageNumbers.forEach(number => {
            ctx.fillStyle = number.color + Math.floor(number.lifetime * 4).toString(16);
            ctx.font = `bold ${number.size}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText(number.text, number.x, number.y);
        });
    }
    
    // Отрисовка UI
    function drawUI() {
        // Полоска здоровья
        ctx.fillStyle = '#000';
        ctx.fillRect(8, 8, 104, 12);
        ctx.fillStyle = '#ff6b6b';
        ctx.fillRect(10, 10, 100 * (player.health / player.maxHealth), 8);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(8, 8, 104, 12);
        
        // Текст здоровья
        ctx.fillStyle = '#fff';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.floor(player.health)}/${player.maxHealth}`, 60, 17);
        
        // Счёт
        ctx.fillStyle = '#4ecdc4';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Очки: ${gameScore}`, 10, 35);
        
        // Волна
        ctx.fillText(`Волна: ${waveNumber}`, 10, 50);
        
        // Убито врагов
        ctx.fillText(`Убито: ${totalEnemiesKilled}`, 10, 65);
        
        // Количество врагов на экране
        ctx.fillStyle = '#ff6b6b';
        ctx.fillText(`Врагов: ${enemies.length}`, 10, 80);
        
        // Характеристики игрока
        ctx.font = '9px Arial';
        ctx.fillStyle = '#feca57';
        ctx.textAlign = 'right';
        ctx.fillText(`ATK: ${player.damage}`, canvas.width - 10, 25);
        ctx.fillText(`SPD: ${player.speed.toFixed(1)}`, canvas.width - 10, 35);
        ctx.fillText(`CRIT: ${(player.critChance * 100).toFixed(0)}%`, canvas.width - 10, 45);
        if (player.lifeSteal > 0) {
            ctx.fillText(`VAMP: ${(player.lifeSteal * 100).toFixed(0)}%`, canvas.width - 10, 55);
        }
        if (player.defense > 0) {
            ctx.fillText(`DEF: ${player.defense}`, canvas.width - 10, 65);
        }
        
        // Кнопка атаки (для мобильных)
        ctx.fillStyle = 'rgba(255, 107, 107, 0.3)';
        ctx.beginPath();
        ctx.arc(canvas.width - 35, canvas.height - 35, 25, 0, Math.PI * 2);
        ctx.fill();
        
        if (attackButtonPressed) {
            ctx.fillStyle = 'rgba(255, 107, 107, 0.6)';
            ctx.beginPath();
            ctx.arc(canvas.width - 35, canvas.height - 35, 25, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.strokeStyle = '#ff6b6b';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Иконка меча
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('⚔', canvas.width - 35, canvas.height - 28);
        
        // Джойстик (мобильное управление)
        if (joystickActive) {
            // База
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.beginPath();
            ctx.arc(joystickBase.x, joystickBase.y, 30, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.5)';
            ctx.stroke();
            
            // Ручка
            ctx.fillStyle = 'rgba(78,205,196,0.5)';
            ctx.beginPath();
            ctx.arc(joystickKnob.x, joystickKnob.y, 15, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // Конец игры
    function endGame() {
        updateScore(gameScore);
        document.getElementById('gameOverDiv').style.display = 'block';
        document.getElementById('gameInstructions').textContent = 
            `Игра окончена! Очки: ${gameScore} | Волна: ${waveNumber} | Убито: ${totalEnemiesKilled}`;
    }
    
    // Инициализация
    createLevel();
    gameRunning = true;
    gameLoop();
    updateGameStats();
}
