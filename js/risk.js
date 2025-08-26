// RISK OF RAIN - КОСМИЧЕСКАЯ ВЕРСИЯ
function startRiskGame() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    document.getElementById('gameOverDiv').style.display = 'none';
    document.getElementById('gameInstructions').textContent = '🚀 Управление • ⚔️ Автоатака • 🌌 Исследуй миры';
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
    let bossesDefeated = 0;
    let currentWorld = 0;
    
    // Камера
    let cameraX = 0;
    let cameraY = 0;
    let screenShake = 0;
    
    // Уровень (платформы)
    const levelWidth = 800;
    const levelHeight = 240;
    let platforms = [];
    
    // Космический фон
    let stars = [];
    let planets = [];
    let nebulas = [];
    let backgroundHue = 220; // Начальный оттенок фона
    
    // Портал
    let portal = null;
    
    // Игрок - Астронавт
    let player = {
        x: 100,
        y: 150,
        width: 24,
        height: 32,
        velocityX: 0,
        velocityY: 0,
        speed: 3,
        jumpPower: -8,
        gravity: 0.4,
        onGround: false,
        facing: 1,
        
        // Анимация
        animationFrame: 0,
        animationTimer: 0,
        jetpackParticles: [],
        
        // Характеристики
        maxHealth: 100,
        health: 100,
        damage: 10,
        attackSpeed: 300,
        attackRange: 60,
        shootRange: 200,
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
    let boss = null;
    let enemySpawnTimer = 0;
    let enemySpawnDelay = 2000;
    let lastEnemySpawn = 0;
    let maxEnemiesPerWave = 3;
    
    // Типы врагов - Космические монстры
    const enemyTypes = {
        voidling: {
            name: 'Войдлинг',
            width: 24,
            height: 24,
            health: 40,
            damage: 8,
            speed: 1.2,
            color: '#9b59b6',
            glowColor: '#e74c3c',
            exp: 15,
            jumpHeight: -6,
            tentacles: true
        },
        starbeast: {
            name: 'Звёздный зверь',
            width: 30,
            height: 20,
            health: 60,
            damage: 12,
            speed: 1.5,
            color: '#3498db',
            glowColor: '#00ffff',
            exp: 25,
            jumpHeight: -7,
            spikes: true
        },
        cosmichorror: {
            name: 'Космический ужас',
            width: 40,
            height: 45,
            health: 180,
            damage: 25,
            speed: 0.6,
            color: '#e74c3c',
            glowColor: '#ff00ff',
            exp: 60,
            jumpHeight: -4,
            eyes: 3
        },
        nebulawraith: {
            name: 'Туманный дух',
            width: 20,
            height: 20,
            health: 30,
            damage: 10,
            speed: 2.5,
            color: '#1abc9c',
            glowColor: '#00ff00',
            exp: 20,
            flying: true,
            transparent: true
        }
    };
    
    // Боссы
    const bossTypes = {
        voidEmperor: {
            name: 'Император Пустоты',
            width: 60,
            height: 70,
            health: 500,
            damage: 30,
            speed: 0.8,
            color: '#8e44ad',
            glowColor: '#e74c3c',
            rarity: 'rare',
            attacks: ['voidBlast', 'summonMinions', 'teleport'],
            exp: 500
        },
        stellarTitan: {
            name: 'Звёздный Титан',
            width: 80,
            height: 90,
            health: 800,
            damage: 40,
            speed: 0.6,
            color: '#f39c12',
            glowColor: '#ffff00',
            rarity: 'epic',
            attacks: ['meteorShower', 'groundSlam', 'laserBeam'],
            exp: 1000
        },
        cosmicAbomination: {
            name: 'Космическая Аномалия',
            width: 100,
            height: 100,
            health: 1200,
            damage: 50,
            speed: 0.5,
            color: '#c0392b',
            glowColor: '#ff00ff',
            rarity: 'legendary',
            attacks: ['blackHole', 'dimensionRift', 'cosmicRay', 'timeStop'],
            exp: 2000
        }
    };
    
    // Предметы
    let items = [];
    let chests = [];
    
    // Типы предметов
    const itemTypes = {
        healthPotion: {
            name: 'Нано-медикаменты',
            color: '#ff6b6b',
            effect: () => {
                player.health = Math.min(player.maxHealth, player.health + 30);
            },
            instant: true
        },
        plasmaGun: {
            name: 'Плазменная пушка',
            color: '#feca57',
            effect: () => {
                player.damage += 5;
            }
        },
        jetBoots: {
            name: 'Реактивные ботинки',
            color: '#45b7d1',
            effect: () => {
                player.speed += 0.5;
                player.jumpPower -= 1;
            }
        },
        quantumShield: {
            name: 'Квантовый щит',
            color: '#4ecdc4',
            effect: () => {
                player.defense += 5;
                player.maxHealth += 20;
                player.health += 20;
            }
        }
    };
    
    // Снаряды
    let projectiles = [];
    let bossProjectiles = [];
    
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
    
    // Инициализация космического фона
    function initBackground() {
        stars = [];
        planets = [];
        nebulas = [];
        
        // Звёзды
        for (let i = 0; i < 100; i++) {
            stars.push({
                x: Math.random() * levelWidth,
                y: Math.random() * canvas.height,
                size: Math.random() * 2,
                brightness: Math.random(),
                twinkleSpeed: Math.random() * 0.02
            });
        }
        
        // Планеты
        for (let i = 0; i < 3; i++) {
            planets.push({
                x: Math.random() * levelWidth,
                y: 20 + Math.random() * 80,
                radius: 15 + Math.random() * 25,
                hue: Math.random() * 360,
                rings: Math.random() > 0.5,
                rotation: 0
            });
        }
        
        // Туманности
        for (let i = 0; i < 2; i++) {
            nebulas.push({
                x: Math.random() * levelWidth,
                y: Math.random() * 100,
                width: 200 + Math.random() * 100,
                height: 100 + Math.random() * 50,
                hue: backgroundHue + Math.random() * 60 - 30,
                opacity: 0.2 + Math.random() * 0.3
            });
        }
    }
    
    // Создание уровня
    function createLevel() {
        platforms = [];
        
        // Космическая станция (основная платформа)
        platforms.push({
            x: 0,
            y: 200,
            width: levelWidth,
            height: 40,
            color: '#34495e',
            metallic: true
        });
        
        // Летающие платформы
        platforms.push({
            x: 150,
            y: 150,
            width: 100,
            height: 10,
            color: '#2c3e50',
            metallic: true,
            floating: true,
            floatOffset: 0
        });
        
        platforms.push({
            x: 300,
            y: 120,
            width: 80,
            height: 10,
            color: '#2c3e50',
            metallic: true,
            floating: true,
            floatOffset: Math.PI
        });
        
        platforms.push({
            x: 450,
            y: 160,
            width: 120,
            height: 10,
            color: '#2c3e50',
            metallic: true
        });
        
        platforms.push({
            x: 600,
            y: 100,
            width: 100,
            height: 10,
            color: '#2c3e50',
            metallic: true,
            floating: true,
            floatOffset: Math.PI / 2
        });
        
        // Начальные враги
        setTimeout(() => {
            for (let i = 0; i < 2; i++) {
                spawnEnemy();
            }
        }, 1000);
    }
    
    // Спавн врага
    function spawnEnemy() {
        const types = Object.keys(enemyTypes);
        let availableTypes = types.slice(0, Math.min(types.length, Math.floor(waveNumber / 2) + 1));
        const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        const template = enemyTypes[type];
        
        const spawnX = Math.random() > 0.5 ? 
            cameraX - 50 : 
            cameraX + canvas.width + 50;
        
        const enemy = {
            ...template,
            x: spawnX,
            y: template.flying ? 50 + Math.random() * 100 : 50,
            velocityX: 0,
            velocityY: 0,
            maxHealth: template.health * (1 + (waveNumber - 1) * 0.2) * difficulty,
            health: template.health * (1 + (waveNumber - 1) * 0.2) * difficulty,
            damage: template.damage * (1 + (waveNumber - 1) * 0.15) * difficulty,
            type: type,
            onGround: false,
            lastAttackTime: 0,
            stunned: false,
            stunnedTime: 0,
            animationFrame: 0,
            animationTimer: 0
        };
        
        enemies.push(enemy);
        
        // Эффект появления
        createParticles(enemy.x + enemy.width/2, enemy.y + enemy.height/2, enemy.glowColor, 15);
    }
    
    // Спавн босса
    function spawnBoss() {
        const bossTypeKeys = Object.keys(bossTypes);
        let bossType;
        
        // Выбор босса по редкости
        const roll = Math.random();
        if (roll < 0.5) {
            bossType = 'voidEmperor'; // rare
        } else if (roll < 0.85) {
            bossType = 'stellarTitan'; // epic
        } else {
            bossType = 'cosmicAbomination'; // legendary
        }
        
        const template = bossTypes[bossType];
        
        boss = {
            ...template,
            x: cameraX + canvas.width/2 - template.width/2,
            y: 50,
            velocityX: 0,
            velocityY: 0,
            maxHealth: template.health * (1 + (waveNumber - 1) * 0.1),
            health: template.health * (1 + (waveNumber - 1) * 0.1),
            type: bossType,
            onGround: false,
            lastAttackTime: 0,
            currentAttack: null,
            attackCooldown: 0,
            phase: 1,
            animationFrame: 0,
            animationTimer: 0
        };
        
        // Эффект появления босса
        screenShake = 20;
        createParticles(boss.x + boss.width/2, boss.y + boss.height/2, boss.glowColor, 50);
        
        // Очищаем обычных врагов
        enemies = [];
    }
    
    // Атаки босса
    function bossAttack() {
        if (!boss || boss.attackCooldown > 0) return;
        
        const attack = boss.attacks[Math.floor(Math.random() * boss.attacks.length)];
        boss.currentAttack = attack;
        boss.attackCooldown = 120;
        
        switch(attack) {
            case 'voidBlast':
                // Выстрел в игрока
                for (let i = 0; i < 5; i++) {
                    setTimeout(() => {
                        const angle = Math.atan2(player.y - boss.y, player.x - boss.x) + (Math.random() - 0.5) * 0.5;
                        bossProjectiles.push({
                            x: boss.x + boss.width/2,
                            y: boss.y + boss.height/2,
                            velocityX: Math.cos(angle) * 5,
                            velocityY: Math.sin(angle) * 5,
                            damage: boss.damage * 0.5,
                            color: boss.glowColor,
                            size: 8,
                            lifetime: 120
                        });
                    }, i * 200);
                }
                break;
                
            case 'summonMinions':
                // Призыв миньонов
                for (let i = 0; i < 3; i++) {
                    setTimeout(() => spawnEnemy(), i * 500);
                }
                break;
                
            case 'teleport':
                // Телепортация
                createParticles(boss.x + boss.width/2, boss.y + boss.height/2, boss.glowColor, 20);
                boss.x = player.x + (Math.random() > 0.5 ? 100 : -100);
                boss.y = 50;
                createParticles(boss.x + boss.width/2, boss.y + boss.height/2, boss.glowColor, 20);
                break;
                
            case 'meteorShower':
                // Метеоритный дождь
                for (let i = 0; i < 8; i++) {
                    setTimeout(() => {
                        bossProjectiles.push({
                            x: cameraX + Math.random() * canvas.width,
                            y: -20,
                            velocityX: (Math.random() - 0.5) * 2,
                            velocityY: 3 + Math.random() * 2,
                            damage: boss.damage * 0.7,
                            color: '#ff6b6b',
                            size: 12,
                            lifetime: 200,
                            meteor: true
                        });
                    }, i * 300);
                }
                break;
                
            case 'groundSlam':
                // Удар по земле
                if (boss.onGround) {
                    boss.velocityY = -15;
                    setTimeout(() => {
                        if (boss.onGround) {
                            screenShake = 15;
                            // Ударная волна
                            for (let i = -3; i <= 3; i++) {
                                if (i !== 0) {
                                    bossProjectiles.push({
                                        x: boss.x + boss.width/2,
                                        y: boss.y + boss.height,
                                        velocityX: i * 2,
                                        velocityY: -5,
                                        damage: boss.damage * 0.6,
                                        color: '#e74c3c',
                                        size: 10,
                                        lifetime: 60
                                    });
                                }
                            }
                        }
                    }, 800);
                }
                break;
                
            case 'laserBeam':
                // Лазерный луч
                boss.currentAttack = 'laserBeam_charging';
                setTimeout(() => {
                    if (boss) {
                        for (let i = 0; i < 30; i++) {
                            bossProjectiles.push({
                                x: boss.x + boss.width/2 + i * 10 * boss.facing,
                                y: boss.y + boss.height/2,
                                velocityX: 0,
                                velocityY: 0,
                                damage: boss.damage * 0.2,
                                color: '#ffff00',
                                size: 15,
                                lifetime: 10,
                                laser: true
                            });
                        }
                        screenShake = 10;
                    }
                }, 1000);
                break;
                
            case 'blackHole':
                // Чёрная дыра
                bossProjectiles.push({
                    x: player.x,
                    y: player.y - 50,
                    velocityX: 0,
                    velocityY: 0,
                    damage: boss.damage * 0.1,
                    color: '#000000',
                    size: 30,
                    lifetime: 300,
                    blackHole: true,
                    pullForce: 2
                });
                break;
        }
    }
    
    // Создание портала
    function createPortal() {
        portal = {
            x: boss.x + boss.width/2 - 30,
            y: boss.y,
            width: 60,
            height: 80,
            active: true,
            particles: [],
            rotation: 0
        };
        
        // Частицы портала
        for (let i = 0; i < 20; i++) {
            portal.particles.push({
                angle: Math.random() * Math.PI * 2,
                radius: 20 + Math.random() * 20,
                speed: 0.02 + Math.random() * 0.02,
                size: 2 + Math.random() * 3,
                color: `hsl(${180 + Math.random() * 60}, 100%, 50%)`
            });
        }
    }
    
    // Спавн сундука
    function spawnChest(x, y) {
        chests.push({
            x: x,
            y: y,
            width: 25,
            height: 20,
            opened: false,
            color: '#feca57',
            glow: 0
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
            collected: false,
            glow: 0
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
            floatOffset: 0,
            glow: 0
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
                lifetime: 30,
                glow: true
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
    
    // Полноэкранный режим
    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            canvas.requestFullscreen().catch(err => {
                console.log(`Ошибка полноэкранного режима: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    }
    
    // Обработка управления
    document.addEventListener('keydown', (e) => {
        keys[e.key] = true;
        
        // F для полного экрана
        if (e.key === 'f' || e.key === 'F') {
            toggleFullscreen();
        }
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
            
            // Кнопка полного экрана (левый верхний угол)
            if (touchX < 40 && touchY < 40) {
                toggleFullscreen();
            }
            // Кнопка атаки
            else if (touchX > canvas.width - 60 && touchY > canvas.height - 60) {
                attackButtonPressed = true;
                playerMeleeAttack();
            }
            // Джойстик
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
    
    canvas.addEventListener('touchend', () => {
        let joystickTouchEnded = true;
        for (let i = 0; i < event.touches.length; i++) {
            const rect = canvas.getBoundingClientRect();
            const touchX = event.touches[i].clientX - rect.left;
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
    
    // Ближняя атака
    function playerMeleeAttack() {
        const now = Date.now();
        if (now - player.lastAttackTime < player.attackSpeed) return;
        
        player.lastAttackTime = now;
        player.isAttacking = true;
        player.attackAnimation = 10;
        
        // Атака врагов
        const targets = boss ? [boss, ...enemies] : enemies;
        targets.forEach(enemy => {
            const dx = enemy.x + enemy.width/2 - (player.x + player.width/2);
            const dy = enemy.y + enemy.height/2 - (player.y + player.height/2);
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < player.attackRange) {
                const isCrit = Math.random() < player.critChance;
                const damage = player.damage * (isCrit ? 2 : 1);
                
                enemy.health -= damage;
                if (!boss || enemy !== boss) {
                    enemy.stunned = true;
                    enemy.stunnedTime = 10;
                    enemy.velocityX = (enemy.x > player.x ? 1 : -1) * 3;
                    enemy.velocityY = -3;
                }
                
                showDamage(enemy.x + enemy.width/2, enemy.y, damage, isCrit);
                createParticles(enemy.x + enemy.width/2, enemy.y + enemy.height/2, enemy.glowColor || enemy.color);
                
                if (player.lifeSteal > 0) {
                    const heal = damage * player.lifeSteal;
                    player.health = Math.min(player.maxHealth, player.health + heal);
                    createParticles(player.x + player.width/2, player.y, '#ff6b6b', 3);
                }
                
                tg.HapticFeedback.impactOccurred('medium');
            }
        });
    }
    
    // Автострельба
    function autoShoot() {
        const now = Date.now();
        if (now - player.lastShootTime < player.attackSpeed * 2) return;
        
        let nearestEnemy = null;
        let nearestDistance = player.shootRange;
        
        const targets = boss ? [boss, ...enemies] : enemies;
        targets.forEach(enemy => {
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
            
            const dx = nearestEnemy.x + nearestEnemy.width/2 - (player.x + player.width/2);
            const dy = nearestEnemy.y + nearestEnemy.height/2 - (player.y + player.height/2);
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            projectiles.push({
                x: player.x + player.width/2,
                y: player.y + player.height/2,
                velocityX: (dx / distance) * 8,
                velocityY: (dy / distance) * 8,
                damage: player.damage * 0.7,
                color: '#00ffff',
                size: 4,
                lifetime: 60,
                trail: []
            });
            
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
        const newWave = Math.floor(gameTime / 30) + 1;
        
        // Новая волна
        if (newWave > waveNumber) {
            waveNumber = newWave;
            maxEnemiesPerWave = 3 + Math.floor(waveNumber / 2);
            
            // Босс каждые 5 волн
            if (waveNumber % 5 === 0 && !boss) {
                spawnBoss();
            }
        }
        
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
    
    // Основной игровой цикл (продолжение следует...)
    function gameLoop() {
        if (!gameRunning) return;
        
        // Очистка канваса
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        if (gamePaused) {
            drawStaticObjects();
            requestAnimationFrame(gameLoop);
            return;
        }
        
        // Обновление экранной тряски
        if (screenShake > 0) {
            screenShake *= 0.9;
            cameraX += (Math.random() - 0.5) * screenShake;
            cameraY += (Math.random() - 0.5) * screenShake;
        }
        
        // Обновление камеры
        const targetCameraX = Math.max(0, Math.min(levelWidth - canvas.width, player.x - canvas.width/2));
        cameraX += (targetCameraX - cameraX) * 0.1;
        cameraY = 0;
        
        ctx.save();
        ctx.translate(-Math.floor(cameraX), -Math.floor(cameraY));
        
        // Рисуем космический фон
        drawBackground();
        
        // Управление игроком
        handlePlayerControls();
        updatePlayer();
        
        // Автострельба
        autoShoot();
        
        // Спавн врагов
        updateEnemySpawn();
        
        // Обновление врагов
        updateEnemies();
        
        // Обновление босса
        if (boss) {
            updateBoss();
        }
        
        // Обновление снарядов
        updateProjectiles();
        
        // Обновление предметов
        updateItems();
        
        // Обновление сундуков
        updateChests();
        
        // Обновление винилов
        updateVinyls();
        
        // Обновление портала
        if (portal) {
            updatePortal();
        }
        
        // Обновление частиц
        updateParticles();
        
        // Обновление чисел урона
        updateDamageNumbers();
        
        // Проверка смерти игрока
        if (player.health <= 0 || player.y > canvas.height + 100) {
            gameRunning = false;
            endGame();
            ctx.restore();
            return;
        }
        
        // Рисуем все объекты
        drawStaticObjects();
        ctx.restore();
        
        // UI
        drawUI();
        
        requestAnimationFrame(gameLoop);
    }
    
    // Управление игроком
    function handlePlayerControls() {
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
            // Частицы от джетпака
            for (let i = 0; i < 3; i++) {
                player.jetpackParticles.push({
                    x: player.x + player.width/2,
                    y: player.y + player.height,
                    velocityX: (Math.random() - 0.5) * 2,
                    velocityY: 2 + Math.random(),
                    size: 3,
                    lifetime: 20
                });
            }
        }
        
        if (keys['x'] || keys['Enter']) {
            playerMeleeAttack();
        }
    }
    
    // Обновление игрока
    function updatePlayer() {
        // Физика
        player.velocityY += player.gravity;
        player.x += player.velocityX;
        player.y += player.velocityY;
        
        // Ограничения
        player.x = Math.max(0, Math.min(levelWidth - player.width, player.x));
        
        // Анимация
        player.animationTimer++;
        if (player.animationTimer > 5) {
            player.animationTimer = 0;
            player.animationFrame = (player.animationFrame + 1) % 4;
        }
        
        // Столкновения с платформами
        player.onGround = false;
        platforms.forEach(platform => {
            // Анимация плавающих платформ
            if (platform.floating) {
                platform.floatOffset += 0.02;
            }
            
            const platY = platform.y + (platform.floating ? Math.sin(platform.floatOffset) * 5 : 0);
            
            if (player.x < platform.x + platform.width &&
                player.x + player.width > platform.x &&
                player.y < platY + platform.height &&
                player.y + player.height > platY) {
                
                if (player.velocityY > 0 && player.y < platY) {
                    player.y = platY - player.height;
                    player.velocityY = 0;
                    player.onGround = true;
                } else if (player.velocityY < 0 && player.y > platY) {
                    player.y = platY + platform.height;
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
        
        // Частицы джетпака
        player.jetpackParticles = player.jetpackParticles.filter(p => {
            p.x += p.velocityX;
            p.y += p.velocityY;
            p.velocityY += 0.1;
            p.lifetime--;
            p.size *= 0.95;
            return p.lifetime > 0;
        });
    }
    
    // Спавн врагов
    function updateEnemySpawn() {
        if (boss) return; // Не спавним врагов во время боя с боссом
        
        const now = Date.now();
        const currentEnemyCount = enemies.length;
        const maxEnemies = maxEnemiesPerWave;
        
        if (now - lastEnemySpawn >= enemySpawnDelay / difficulty && currentEnemyCount < maxEnemies) {
            spawnEnemy();
            lastEnemySpawn = now;
            
            // Дополнительные враги на высоких волнах
            if (waveNumber > 3 && Math.random() < 0.3) {
                setTimeout(() => {
                    if (enemies.length < maxEnemies) spawnEnemy();
                }, 500);
            }
        }
    }
      // Обновление врагов
    function updateEnemies() {
        enemies = enemies.filter(enemy => {
            // Анимация
            enemy.animationTimer++;
            if (enemy.animationTimer > 6) {
                enemy.animationTimer = 0;
                enemy.animationFrame = (enemy.animationFrame + 1) % 4;
            }
            
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
                    
                    // Волнообразное движение
                    enemy.y += Math.sin(Date.now() * 0.003 + enemy.x) * 0.5;
                } else {
                    // Наземные враги
                    if (distance < 300) {
                        enemy.velocityX = Math.sign(dx) * enemy.speed;
                        
                        // Прыжок
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
            
            // Столкновения с платформами
            if (!enemy.flying) {
                enemy.onGround = false;
                platforms.forEach(platform => {
                    const platY = platform.y + (platform.floating ? Math.sin(platform.floatOffset) * 5 : 0);
                    
                    if (enemy.x < platform.x + platform.width &&
                        enemy.x + enemy.width > platform.x &&
                        enemy.y < platY + platform.height &&
                        enemy.y + enemy.height > platY) {
                        
                        if (enemy.velocityY > 0 && enemy.y < platY) {
                            enemy.y = platY - enemy.height;
                            enemy.velocityY = 0;
                            enemy.onGround = true;
                        }
                    }
                });
            }
            
            // Атака врага
            const attackDistance = 35;
            const dx = player.x - enemy.x;
            const dy = player.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < attackDistance && !player.invulnerable) {
                const now = Date.now();
                if (now - enemy.lastAttackTime > 1000) {
                    enemy.lastAttackTime = now;
                    const damage = Math.max(1, enemy.damage - player.defense);
                    player.health -= damage;
                    player.invulnerable = true;
                    player.invulnerableTime = 60;
                    
                    showDamage(player.x + player.width/2, player.y, damage);
                    createParticles(player.x + player.width/2, player.y + player.height/2, '#ff6b6b');
                    screenShake = 5;
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
                
                createParticles(enemy.x + enemy.width/2, enemy.y + enemy.height/2, enemy.glowColor, 20);
                
                // Шанс выпадения предмета (уменьшен)
                if (Math.random() < 0.15) {
                    spawnItem(enemy.x + enemy.width/2, enemy.y);
                }
                
                // Шанс выпадения сундука (сильно уменьшен)
                if (Math.random() < 0.02) {
                    spawnChest(enemy.x + enemy.width/2, enemy.y);
                }
                
                return false;
            }
            
            // Удаление упавших врагов
            if (enemy.y > canvas.height + 100) {
                return false;
            }
            
            return true;
        });
    }
    
    // Обновление босса
    function updateBoss() {
        if (!boss) return;
        
        // Анимация
        boss.animationTimer++;
        if (boss.animationTimer > 4) {
            boss.animationTimer = 0;
            boss.animationFrame = (boss.animationFrame + 1) % 4;
        }
        
        // Фазы босса
        if (boss.health < boss.maxHealth * 0.5 && boss.phase === 1) {
            boss.phase = 2;
            boss.speed *= 1.3;
            screenShake = 15;
            createParticles(boss.x + boss.width/2, boss.y + boss.height/2, boss.glowColor, 40);
        }
        
        // ИИ босса
        const dx = player.x - boss.x;
        const dy = player.y - boss.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Движение к игроку
        if (distance > 100) {
            boss.velocityX = Math.sign(dx) * boss.speed;
            boss.facing = Math.sign(dx);
        } else {
            boss.velocityX *= 0.9;
        }
        
        boss.velocityY += player.gravity * 0.7;
        boss.x += boss.velocityX;
        boss.y += boss.velocityY;
        
        // Столкновения с платформами
        boss.onGround = false;
        platforms.forEach(platform => {
            const platY = platform.y + (platform.floating ? Math.sin(platform.floatOffset) * 5 : 0);
            
            if (boss.x < platform.x + platform.width &&
                boss.x + boss.width > platform.x &&
                boss.y < platY + platform.height &&
                boss.y + boss.height > platY) {
                
                if (boss.velocityY > 0 && boss.y < platY) {
                    boss.y = platY - boss.height;
                    boss.velocityY = 0;
                    boss.onGround = true;
                }
            }
        });
        
        // Атаки босса
        if (boss.attackCooldown > 0) {
            boss.attackCooldown--;
        } else {
            bossAttack();
        }
        
        // Смерть босса
        if (boss.health <= 0) {
            bossesDefeated++;
            gameScore += boss.exp;
            
            // Эпический взрыв
            screenShake = 30;
            for (let i = 0; i < 100; i++) {
                setTimeout(() => {
                    createParticles(
                        boss.x + Math.random() * boss.width,
                        boss.y + Math.random() * boss.height,
                        boss.glowColor,
                        5
                    );
                }, i * 20);
            }
            
            // Создание портала
            createPortal();
            
            // Награды
            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    spawnItem(
                        boss.x + boss.width/2 + (Math.random() - 0.5) * 100,
                        boss.y
                    );
                }, i * 200);
            }
            
            // Гарантированный сундук
            spawnChest(boss.x + boss.width/2, boss.y);
            
            boss = null;
            tg.HapticFeedback.impactOccurred('heavy');
        }
    }
    
    // Обновление снарядов
    function updateProjectiles() {
        // Снаряды игрока
        projectiles = projectiles.filter(projectile => {
            // След снаряда
            projectile.trail.push({ x: projectile.x, y: projectile.y });
            if (projectile.trail.length > 5) {
                projectile.trail.shift();
            }
            
            projectile.x += projectile.velocityX;
            projectile.y += projectile.velocityY;
            projectile.lifetime--;
            
            // Столкновение с врагами
            let hit = false;
            const targets = boss ? [boss, ...enemies] : enemies;
            
            targets.forEach(enemy => {
                const dx = enemy.x + enemy.width/2 - projectile.x;
                const dy = enemy.y + enemy.height/2 - projectile.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < enemy.width/2 + projectile.size && !hit) {
                    const isCrit = Math.random() < player.critChance;
                    const damage = projectile.damage * (isCrit ? 2 : 1);
                    
                    enemy.health -= damage;
                    showDamage(enemy.x + enemy.width/2, enemy.y, damage, isCrit);
                    createParticles(projectile.x, projectile.y, projectile.color, 5);
                    hit = true;
                    
                    if (!boss || enemy !== boss) {
                        enemy.velocityX += projectile.velocityX * 0.2;
                        enemy.velocityY -= 2;
                    }
                }
            });
            
            return projectile.lifetime > 0 && !hit;
        });
        
        // Снаряды босса
        bossProjectiles = bossProjectiles.filter(projectile => {
            projectile.x += projectile.velocityX;
            projectile.y += projectile.velocityY;
            projectile.lifetime--;
            
            // Чёрная дыра
            if (projectile.blackHole) {
                const dx = player.x - projectile.x;
                const dy = player.y - projectile.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 100) {
                    const force = projectile.pullForce * (1 - distance / 100);
                    player.velocityX += (dx / distance) * force;
                    player.velocityY += (dy / distance) * force;
                }
                
                // Визуальный эффект
                for (let i = 0; i < 2; i++) {
                    particles.push({
                        x: projectile.x + (Math.random() - 0.5) * 60,
                        y: projectile.y + (Math.random() - 0.5) * 60,
                        velocityX: 0,
                        velocityY: 0,
                        size: 2,
                        color: '#9b59b6',
                        lifetime: 20,
                        gravityPoint: { x: projectile.x, y: projectile.y }
                    });
                }
            }
            
            // Метеорит
            if (projectile.meteor) {
                createParticles(projectile.x, projectile.y, projectile.color, 2);
            }
            
            // Столкновение с игроком
            if (!player.invulnerable) {
                const dx = player.x + player.width/2 - projectile.x;
                const dy = player.y + player.height/2 - projectile.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < player.width/2 + projectile.size) {
                    const damage = Math.max(1, projectile.damage - player.defense);
                    player.health -= damage;
                    player.invulnerable = true;
                    player.invulnerableTime = 30;
                    
                    showDamage(player.x + player.width/2, player.y, damage);
                    createParticles(player.x + player.width/2, player.y, '#ff6b6b', 10);
                    screenShake = 8;
                    
                    if (projectile.meteor) {
                        player.velocityX = projectile.velocityX * 2;
                        player.velocityY = -8;
                    }
                    
                    return false;
                }
            }
            
            // Столкновение с платформами
            let hitPlatform = false;
            platforms.forEach(platform => {
                if (projectile.x > platform.x &&
                    projectile.x < platform.x + platform.width &&
                    projectile.y > platform.y &&
                    projectile.y < platform.y + platform.height) {
                    hitPlatform = true;
                    
                    if (projectile.meteor) {
                        createParticles(projectile.x, projectile.y, projectile.color, 15);
                        screenShake = 5;
                    }
                }
            });
            
            return projectile.lifetime > 0 && !hitPlatform && projectile.y < canvas.height + 50;
        });
    }
    
    // Обновление предметов
    function updateItems() {
        items = items.filter(item => {
            if (!item.collected) {
                item.velocityY += 0.2;
                item.y += item.velocityY;
                item.glow = (item.glow + 0.1) % (Math.PI * 2);
                
                // Отскок от платформ
                platforms.forEach(platform => {
                    const platY = platform.y + (platform.floating ? Math.sin(platform.floatOffset) * 5 : 0);
                    
                    if (item.x < platform.x + platform.width &&
                        item.x + item.width > platform.x &&
                        item.y < platY + platform.height &&
                        item.y + item.height > platY) {
                        
                        item.y = platY - item.height;
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
                    
                    createParticles(item.x + item.width/2, item.y + item.height/2, item.data.color, 15);
                    tg.HapticFeedback.impactOccurred('light');
                    
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
    }
    
    // Обновление сундуков
    function updateChests() {
        chests.forEach(chest => {
            if (!chest.opened) {
                chest.glow = (chest.glow + 0.05) % (Math.PI * 2);
                
                const dx = player.x + player.width/2 - (chest.x + chest.width/2);
                const dy = player.y + player.height/2 - (chest.y + chest.height/2);
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 30) {
                    chest.opened = true;
                    
                    // Выпадение предметов
                    for (let i = 0; i < 3; i++) {
                        setTimeout(() => {
                            spawnItem(
                                chest.x + chest.width/2 + (Math.random() - 0.5) * 40,
                                chest.y - 10
                            );
                        }, i * 100);
                    }
                    
                    createParticles(chest.x + chest.width/2, chest.y + chest.height/2, chest.color, 30);
                    screenShake = 3;
                    tg.HapticFeedback.impactOccurred('heavy');
                }
            }
        });
    }
    
    // Обновление винилов
    function updateVinyls() {
        vinyls = vinyls.filter(vinyl => {
            if (!vinyl.collected) {
                vinyl.rotation += 0.05;
                vinyl.floatOffset = Math.sin(Date.now() * 0.003) * 5;
                vinyl.glow = (vinyl.glow + 0.1) % (Math.PI * 2);
                
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
                    
                    createParticles(vinyl.x, vinyl.y, '#4ecdc4', 30);
                    screenShake = 5;
                    return false;
                }
            }
            
            return !vinyl.collected;
        });
    }
    
    // Обновление портала
    function updatePortal() {
        if (!portal || !portal.active) return;
        
        portal.rotation += 0.02;
        
        // Анимация частиц портала
        portal.particles.forEach(p => {
            p.angle += p.speed;
            p.radius += Math.sin(p.angle * 4) * 0.5;
        });
        
        // Проверка контакта с игроком
        const dx = player.x + player.width/2 - (portal.x + portal.width/2);
        const dy = player.y + player.height/2 - (portal.y + portal.height/2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 40) {
            portal.active = false;
            currentWorld++;
            
            // Смена мира
            backgroundHue = (backgroundHue + 60) % 360;
            initBackground();
            
            // Визуальный эффект
            screenShake = 20;
            for (let i = 0; i < 50; i++) {
                createParticles(
                    portal.x + portal.width/2,
                    portal.y + portal.height/2,
                    `hsl(${Math.random() * 360}, 100%, 50%)`,
                    1
                );
            }
            
            // Бонус к характеристикам
            player.maxHealth += 10;
            player.health = player.maxHealth;
            player.damage += 2;
            
            portal = null;
            tg.HapticFeedback.impactOccurred('heavy');
        }
    }
    
    // Обновление частиц
    function updateParticles() {
        particles = particles.filter(particle => {
            if (particle.gravityPoint) {
                const dx = particle.gravityPoint.x - particle.x;
                const dy = particle.gravityPoint.y - particle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                particle.velocityX += (dx / distance) * 0.5;
                particle.velocityY += (dy / distance) * 0.5;
            } else {
                particle.x += particle.velocityX;
                particle.y += particle.velocityY;
                particle.velocityX *= 0.95;
                particle.velocityY += 0.1;
            }
            
            particle.lifetime--;
            particle.size *= 0.95;
            
            return particle.lifetime > 0;
        });
    }
    
    // Обновление чисел урона
    function updateDamageNumbers() {
        damageNumbers = damageNumbers.filter(number => {
            number.y += number.velocityY;
            number.velocityY += 0.1;
            number.lifetime--;
            
            return number.lifetime > 0;
        });
    }
    
    // Отрисовка космического фона
    function drawBackground() {
        // Градиент космоса
        const gradient = ctx.createLinearGradient(cameraX, 0, cameraX, canvas.height);
        gradient.addColorStop(0, `hsl(${backgroundHue}, 30%, 5%)`);
        gradient.addColorStop(0.5, `hsl(${backgroundHue + 20}, 40%, 10%)`);
        gradient.addColorStop(1, `hsl(${backgroundHue + 40}, 30%, 15%)`);
        ctx.fillStyle = gradient;
        ctx.fillRect(cameraX, 0, canvas.width, canvas.height);
        
        // Туманности
        nebulas.forEach(nebula => {
            const parallaxX = nebula.x - cameraX * 0.3;
            if (parallaxX > cameraX - 100 && parallaxX < cameraX + canvas.width + 100) {
                const gradient = ctx.createRadialGradient(
                    parallaxX + nebula.width/2, nebula.y + nebula.height/2, 0,
                    parallaxX + nebula.width/2, nebula.y + nebula.height/2, nebula.width/2
                );
                gradient.addColorStop(0, `hsla(${nebula.hue}, 70%, 50%, ${nebula.opacity})`);
                gradient.addColorStop(1, `hsla(${nebula.hue}, 70%, 30%, 0)`);
                ctx.fillStyle = gradient;
                ctx.fillRect(parallaxX, nebula.y, nebula.width, nebula.height);
            }
        });
        
        // Звёзды
        stars.forEach(star => {
            const parallaxX = star.x - cameraX * 0.2;
            if (parallaxX > cameraX - 10 && parallaxX < cameraX + canvas.width + 10) {
                star.brightness += star.twinkleSpeed;
                const brightness = (Math.sin(star.brightness) + 1) * 0.5;
                ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
                ctx.fillRect(parallaxX, star.y, star.size, star.size);
            }
        });
        
        // Планеты
        planets.forEach(planet => {
            const parallaxX = planet.x - cameraX * 0.4;
            if (parallaxX > cameraX - 50 && parallaxX < cameraX + canvas.width + 50) {
                planet.rotation += 0.01;
                
                // Планета
                const gradient = ctx.createRadialGradient(
                    parallaxX, planet.y, 0,
                    parallaxX, planet.y, planet.radius
                );
                gradient.addColorStop(0, `hsl(${planet.hue}, 50%, 60%)`);
                gradient.addColorStop(1, `hsl(${planet.hue}, 70%, 30%)`);
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(parallaxX, planet.y, planet.radius, 0, Math.PI * 2);
                ctx.fill();
                
                // Кольца
                if (planet.rings) {
                    ctx.save();
                    ctx.translate(parallaxX, planet.y);
                    ctx.rotate(planet.rotation);
                    ctx.strokeStyle = `hsla(${planet.hue}, 50%, 70%, 0.3)`;
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.ellipse(0, 0, planet.radius * 1.5, planet.radius * 0.5, 0, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.restore();
                }
            }
        });
    }
    
    // Отрисовка всех объектов
    function drawStaticObjects() {
        // Платформы
        platforms.forEach(platform => {
            const platY = platform.y + (platform.floating ? Math.sin(platform.floatOffset) * 5 : 0);
            
            // Тень платформы
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(platform.x + 3, platY + 3, platform.width, platform.height);
            
            // Платформа
            if (platform.metallic) {
                const gradient = ctx.createLinearGradient(platform.x, platY, platform.x, platY + platform.height);
                gradient.addColorStop(0, '#445566');
                gradient.addColorStop(0.5, platform.color);
                gradient.addColorStop(1, '#223344');
                ctx.fillStyle = gradient;
            } else {
                ctx.fillStyle = platform.color;
            }
            ctx.fillRect(platform.x, platY, platform.width, platform.height);
            
            // Световые индикаторы
            if (platform.floating) {
                ctx.fillStyle = '#00ffff';
                ctx.fillRect(platform.x + 5, platY + platform.height/2 - 1, 2, 2);
                ctx.fillRect(platform.x + platform.width - 7, platY + platform.height/2 - 1, 2, 2);
            }
        });
        
        // Портал
        if (portal && portal.active) {
            ctx.save();
            ctx.translate(portal.x + portal.width/2, portal.y + portal.height/2);
            ctx.rotate(portal.rotation);
            
            // Вихрь портала
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 40);
            gradient.addColorStop(0, 'rgba(0, 255, 255, 0.8)');
            gradient.addColorStop(0.5, 'rgba(138, 43, 226, 0.5)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(-40, -40, 80, 80);
            
            // Частицы портала
            portal.particles.forEach(p => {
                const x = Math.cos(p.angle) * p.radius;
                const y = Math.sin(p.angle) * p.radius;
                ctx.fillStyle = p.color;
                ctx.fillRect(x - p.size/2, y - p.size/2, p.size, p.size);
            });
            
            ctx.restore();
        }
                // Сундуки
        chests.forEach(chest => {
            if (!chest.opened) {
                // Свечение сундука
                const glowSize = 5 + Math.sin(chest.glow) * 2;
                ctx.fillStyle = `rgba(254, 202, 87, ${0.3 + Math.sin(chest.glow) * 0.1})`;
                ctx.fillRect(chest.x - glowSize, chest.y - glowSize, chest.width + glowSize*2, chest.height + glowSize*2);
                
                // Тень
                ctx.fillStyle = 'rgba(0,0,0,0.5)';
                ctx.fillRect(chest.x + 2, chest.y + 2, chest.width, chest.height);
                
                // Корпус сундука
                const gradient = ctx.createLinearGradient(chest.x, chest.y, chest.x, chest.y + chest.height);
                gradient.addColorStop(0, '#f39c12');
                gradient.addColorStop(1, '#d68910');
                ctx.fillStyle = gradient;
                ctx.fillRect(chest.x, chest.y, chest.width, chest.height);
                
                // Крышка
                ctx.fillStyle = '#e67e22';
                ctx.fillRect(chest.x, chest.y, chest.width, chest.height/2);
                
                // Замок
                ctx.fillStyle = '#34495e';
                ctx.fillRect(chest.x + chest.width/2 - 3, chest.y + chest.height/2 - 3, 6, 8);
                
                // Блики
                ctx.fillStyle = 'rgba(255,255,255,0.3)';
                ctx.fillRect(chest.x + 2, chest.y + 2, chest.width - 4, 2);
            }
        });
        
        // Предметы
        items.forEach(item => {
            if (!item.collected) {
                // Свечение предмета
                const glowRadius = 10 + Math.sin(item.glow) * 3;
                const gradient = ctx.createRadialGradient(
                    item.x + item.width/2, item.y + item.height/2, 0,
                    item.x + item.width/2, item.y + item.height/2, glowRadius
                );
                gradient.addColorStop(0, `${item.data.color}66`);
                gradient.addColorStop(1, `${item.data.color}00`);
                ctx.fillStyle = gradient;
                ctx.fillRect(item.x - glowRadius, item.y - glowRadius, item.width + glowRadius*2, item.height + glowRadius*2);
                
                // Предмет
                ctx.fillStyle = item.data.color;
                ctx.fillRect(item.x, item.y, item.width, item.height);
                
                // Иконка
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 10px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('⚡', item.x + item.width/2, item.y + item.height/2 + 3);
            }
        });
        
        // Виниловые пластинки
        vinyls.forEach(vinyl => {
            if (!vinyl.collected) {
                ctx.save();
                ctx.translate(vinyl.x, vinyl.y + vinyl.floatOffset);
                ctx.rotate(vinyl.rotation);
                
                // Свечение
                const glowSize = 25 + Math.sin(vinyl.glow) * 5;
                const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize);
                gradient.addColorStop(0, 'rgba(78, 205, 196, 0.6)');
                gradient.addColorStop(0.5, 'rgba(78, 205, 196, 0.3)');
                gradient.addColorStop(1, 'rgba(78, 205, 196, 0)');
                ctx.fillStyle = gradient;
                ctx.fillRect(-glowSize, -glowSize, glowSize*2, glowSize*2);
                
                // Пластинка
                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.arc(0, 0, vinyl.radius, 0, Math.PI * 2);
                ctx.fill();
                
                // Блики
                const blingGradient = ctx.createLinearGradient(-vinyl.radius, -vinyl.radius, vinyl.radius, vinyl.radius);
                blingGradient.addColorStop(0, 'rgba(255,255,255,0.3)');
                blingGradient.addColorStop(0.5, 'rgba(255,255,255,0)');
                blingGradient.addColorStop(1, 'rgba(255,255,255,0.1)');
                ctx.fillStyle = blingGradient;
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
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(enemy.x + 3, enemy.y + 3, enemy.width, enemy.height);
            
            // Тело монстра
            ctx.save();
            
            if (enemy.type === 'voidling') {
                // Войдлинг - существо с щупальцами
                ctx.fillStyle = enemy.stunned ? '#666' : enemy.color;
                ctx.fillRect(enemy.x + 2, enemy.y + 5, enemy.width - 4, enemy.height - 10);
                
                // Щупальца
                for (let i = 0; i < 4; i++) {
                    const tentacleX = enemy.x + i * 6;
                    const tentacleY = enemy.y + enemy.height - 5;
                    ctx.strokeStyle = enemy.stunned ? '#444' : enemy.glowColor;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(tentacleX, tentacleY);
                    ctx.quadraticCurveTo(
                        tentacleX + Math.sin(Date.now() * 0.01 + i) * 3,
                        tentacleY + 5,
                        tentacleX,
                        tentacleY + 8
                    );
                    ctx.stroke();
                }
                
            } else if (enemy.type === 'starbeast') {
                // Звёздный зверь - с шипами
                ctx.fillStyle = enemy.stunned ? '#666' : enemy.color;
                ctx.fillRect(enemy.x, enemy.y + 3, enemy.width, enemy.height - 6);
                
                // Шипы
                ctx.fillStyle = enemy.stunned ? '#444' : enemy.glowColor;
                for (let i = 0; i < 3; i++) {
                    ctx.beginPath();
                    ctx.moveTo(enemy.x + i * 10 + 5, enemy.y);
                    ctx.lineTo(enemy.x + i * 10 + 3, enemy.y + 5);
                    ctx.lineTo(enemy.x + i * 10 + 7, enemy.y + 5);
                    ctx.closePath();
                    ctx.fill();
                }
                
            } else if (enemy.type === 'cosmichorror') {
                // Космический ужас - многоглазый
                ctx.fillStyle = enemy.stunned ? '#666' : enemy.color;
                ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
                
                // Множество глаз
                ctx.fillStyle = enemy.stunned ? '#fff' : enemy.glowColor;
                for (let i = 0; i < enemy.eyes; i++) {
                    const eyeX = enemy.x + 5 + i * 12;
                    const eyeY = enemy.y + enemy.height/3;
                    ctx.beginPath();
                    ctx.arc(eyeX, eyeY, 3, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Зрачки
                    ctx.fillStyle = '#000';
                    ctx.beginPath();
                    ctx.arc(eyeX, eyeY, 1, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = enemy.stunned ? '#fff' : enemy.glowColor;
                }
                
            } else if (enemy.type === 'nebulawraith') {
                // Туманный дух - полупрозрачный
                ctx.globalAlpha = enemy.transparent ? 0.6 : 1;
                
                // Туманное тело
                const gradient = ctx.createRadialGradient(
                    enemy.x + enemy.width/2, enemy.y + enemy.height/2, 0,
                    enemy.x + enemy.width/2, enemy.y + enemy.height/2, enemy.width/2
                );
                gradient.addColorStop(0, enemy.stunned ? '#666' : enemy.color);
                gradient.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = gradient;
                ctx.fillRect(enemy.x - 5, enemy.y - 5, enemy.width + 10, enemy.height + 10);
                
                // Светящиеся глаза
                ctx.fillStyle = enemy.glowColor;
                ctx.fillRect(enemy.x + 5, enemy.y + 5, 3, 3);
                ctx.fillRect(enemy.x + enemy.width - 8, enemy.y + 5, 3, 3);
                
                ctx.globalAlpha = 1;
            }
            
            // Свечение вокруг монстра
            if (!enemy.stunned) {
                ctx.strokeStyle = enemy.glowColor + '44';
                ctx.lineWidth = 3;
                ctx.strokeRect(enemy.x - 2, enemy.y - 2, enemy.width + 4, enemy.height + 4);
            }
            
            ctx.restore();
            
            // Полоска здоровья
            if (enemy.health < enemy.maxHealth) {
                ctx.fillStyle = 'rgba(0,0,0,0.7)';
                ctx.fillRect(enemy.x, enemy.y - 8, enemy.width, 4);
                
                const healthPercent = enemy.health / enemy.maxHealth;
                const healthColor = healthPercent > 0.5 ? '#4CAF50' : healthPercent > 0.25 ? '#ff9800' : '#f44336';
                ctx.fillStyle = healthColor;
                ctx.fillRect(enemy.x, enemy.y - 8, enemy.width * healthPercent, 4);
            }
        });
        
        // Босс
        if (boss) {
            // Тень босса
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(boss.x + 5, boss.y + 5, boss.width, boss.height);
            
            // Аура босса
            const auraSize = 10 + Math.sin(Date.now() * 0.003) * 5;
            const auraGradient = ctx.createRadialGradient(
                boss.x + boss.width/2, boss.y + boss.height/2, boss.width/2,
                boss.x + boss.width/2, boss.y + boss.height/2, boss.width/2 + auraSize
            );
            auraGradient.addColorStop(0, `${boss.glowColor}00`);
            auraGradient.addColorStop(1, `${boss.glowColor}66`);
            ctx.fillStyle = auraGradient;
            ctx.fillRect(boss.x - auraSize, boss.y - auraSize, boss.width + auraSize*2, boss.height + auraSize*2);
            
            // Тело босса
            const bossGradient = ctx.createLinearGradient(boss.x, boss.y, boss.x, boss.y + boss.height);
            bossGradient.addColorStop(0, boss.color);
            bossGradient.addColorStop(0.5, boss.glowColor);
            bossGradient.addColorStop(1, boss.color);
            ctx.fillStyle = bossGradient;
            ctx.fillRect(boss.x, boss.y, boss.width, boss.height);
            
            // Детали босса по типу
            if (boss.type === 'voidEmperor') {
                // Корона из пустоты
                ctx.fillStyle = boss.glowColor;
                for (let i = 0; i < 5; i++) {
                    const spikeX = boss.x + 10 + i * 10;
                    ctx.beginPath();
                    ctx.moveTo(spikeX, boss.y);
                    ctx.lineTo(spikeX - 3, boss.y - 10);
                    ctx.lineTo(spikeX + 3, boss.y - 10);
                    ctx.closePath();
                    ctx.fill();
                }
            } else if (boss.type === 'stellarTitan') {
                // Звёздные кристаллы
                ctx.fillStyle = '#ffff00';
                for (let i = 0; i < 3; i++) {
                    for (let j = 0; j < 3; j++) {
                        const crystalX = boss.x + 15 + i * 25;
                        const crystalY = boss.y + 15 + j * 25;
                        ctx.save();
                        ctx.translate(crystalX, crystalY);
                        ctx.rotate(Date.now() * 0.002);
                        ctx.fillRect(-5, -5, 10, 10);
                        ctx.restore();
                    }
                }
            } else if (boss.type === 'cosmicAbomination') {
                // Множество глаз и щупалец
                for (let i = 0; i < 6; i++) {
                    const eyeX = boss.x + 10 + (i % 3) * 30;
                    const eyeY = boss.y + 20 + Math.floor(i / 3) * 30;
                    
                    // Глаз
                    ctx.fillStyle = '#ff00ff';
                    ctx.beginPath();
                    ctx.arc(eyeX, eyeY, 8, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Зрачок
                    ctx.fillStyle = '#000';
                    ctx.beginPath();
                    ctx.arc(eyeX + Math.sin(Date.now() * 0.003 + i) * 2, eyeY, 3, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            
            // Индикатор атаки босса
            if (boss.currentAttack === 'laserBeam_charging') {
                ctx.fillStyle = `rgba(255, 255, 0, ${0.3 + Math.sin(Date.now() * 0.01) * 0.3})`;
                ctx.fillRect(boss.x + boss.width/2 - 2, boss.y + boss.height/2 - 2, 300 * boss.facing, 4);
            }
            
            // Полоска здоровья босса
            ctx.fillStyle = 'rgba(0,0,0,0.8)';
            ctx.fillRect(boss.x, boss.y - 15, boss.width, 8);
            
            const bossHealthPercent = boss.health / boss.maxHealth;
            const bossHealthGradient = ctx.createLinearGradient(boss.x, boss.y - 15, boss.x + boss.width, boss.y - 15);
            
            if (boss.rarity === 'legendary') {
                bossHealthGradient.addColorStop(0, '#ff00ff');
                bossHealthGradient.addColorStop(1, '#ff6b6b');
            } else if (boss.rarity === 'epic') {
                bossHealthGradient.addColorStop(0, '#9b59b6');
                bossHealthGradient.addColorStop(1, '#e74c3c');
            } else {
                bossHealthGradient.addColorStop(0, '#3498db');
                bossHealthGradient.addColorStop(1, '#2ecc71');
            }
            
            ctx.fillStyle = bossHealthGradient;
            ctx.fillRect(boss.x, boss.y - 15, boss.width * bossHealthPercent, 8);
            
            // Название босса
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(boss.name, boss.x + boss.width/2, boss.y - 20);
        }
        
        // Снаряды игрока
        projectiles.forEach(projectile => {
            // След снаряда
            projectile.trail.forEach((point, index) => {
                ctx.fillStyle = projectile.color + Math.floor((index / projectile.trail.length) * 255).toString(16);
                ctx.fillRect(point.x - 1, point.y - 1, 2, 2);
            });
            
            // Снаряд
            ctx.fillStyle = projectile.color;
            ctx.beginPath();
            ctx.arc(projectile.x, projectile.y, projectile.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Свечение
            ctx.strokeStyle = projectile.color + '66';
            ctx.lineWidth = projectile.size;
            ctx.stroke();
        });
        
        // Снаряды босса
        bossProjectiles.forEach(projectile => {
            if (projectile.blackHole) {
                // Чёрная дыра
                const blackGradient = ctx.createRadialGradient(
                    projectile.x, projectile.y, 0,
                    projectile.x, projectile.y, projectile.size
                );
                blackGradient.addColorStop(0, '#000');
                blackGradient.addColorStop(0.7, '#4b0082');
                blackGradient.addColorStop(1, 'rgba(75, 0, 130, 0)');
                ctx.fillStyle = blackGradient;
                ctx.fillRect(projectile.x - projectile.size, projectile.y - projectile.size, projectile.size * 2, projectile.size * 2);
                
                // Вращающиеся частицы вокруг
                for (let i = 0; i < 8; i++) {
                    const angle = (Date.now() * 0.002 + i * Math.PI / 4) % (Math.PI * 2);
                    const particleX = projectile.x + Math.cos(angle) * (projectile.size + 10);
                    const particleY = projectile.y + Math.sin(angle) * (projectile.size + 10);
                    ctx.fillStyle = '#9b59b6';
                    ctx.fillRect(particleX - 2, particleY - 2, 4, 4);
                }
            } else if (projectile.meteor) {
                // Метеорит
                ctx.fillStyle = projectile.color;
                ctx.beginPath();
                ctx.arc(projectile.x, projectile.y, projectile.size, 0, Math.PI * 2);
                ctx.fill();
                
                // Огненный след
                for (let i = 0; i < 5; i++) {
                    ctx.fillStyle = `rgba(255, ${100 + i * 30}, 0, ${0.5 - i * 0.1})`;
                    ctx.fillRect(
                        projectile.x - projectile.velocityX * i * 2,
                        projectile.y - projectile.velocityY * i * 2 - 5,
                        projectile.size - i,
                        projectile.size - i
                    );
                }
            } else if (projectile.laser) {
                // Лазер
                ctx.fillStyle = projectile.color;
                ctx.fillRect(projectile.x - projectile.size/2, projectile.y - projectile.size/2, projectile.size, projectile.size);
                
                // Свечение лазера
                ctx.fillStyle = projectile.color + '44';
                ctx.fillRect(projectile.x - projectile.size, projectile.y - projectile.size, projectile.size * 2, projectile.size * 2);
            } else {
                // Обычный снаряд босса
                ctx.fillStyle = projectile.color;
                ctx.beginPath();
                ctx.arc(projectile.x, projectile.y, projectile.size, 0, Math.PI * 2);
                ctx.fill();
                
                // Свечение
                ctx.strokeStyle = projectile.color + '66';
                ctx.lineWidth = projectile.size/2;
                ctx.stroke();
            }
        });
        
        // Игрок - Астронавт
        if (!player.invulnerable || Math.floor(Date.now() / 100) % 2) {
            // Тень
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(player.x + 3, player.y + 3, player.width, player.height);
            
            // Джетпак
            ctx.fillStyle = '#34495e';
            ctx.fillRect(player.x + 2, player.y + 10, 4, 12);
            ctx.fillRect(player.x + player.width - 6, player.y + 10, 4, 12);
            
            // Тело скафандра
            const suitGradient = ctx.createLinearGradient(player.x, player.y, player.x, player.y + player.height);
            suitGradient.addColorStop(0, '#ecf0f1');
            suitGradient.addColorStop(0.5, '#bdc3c7');
            suitGradient.addColorStop(1, '#95a5a6');
            ctx.fillStyle = suitGradient;
            ctx.fillRect(player.x + 3, player.y + 8, player.width - 6, player.height - 10);
            
            // Шлем
            ctx.fillStyle = '#ecf0f1';
            ctx.beginPath();
            ctx.arc(player.x + player.width/2, player.y + 8, 8, 0, Math.PI * 2);
            ctx.fill();
            
            // Стекло шлема
            const helmetGradient = ctx.createRadialGradient(
                player.x + player.width/2, player.y + 8, 0,
                player.x + player.width/2, player.y + 8, 6
            );
            helmetGradient.addColorStop(0, 'rgba(52, 152, 219, 0.6)');
            helmetGradient.addColorStop(1, 'rgba(41, 128, 185, 0.8)');
            ctx.fillStyle = helmetGradient;
            ctx.beginPath();
            ctx.arc(player.x + player.width/2, player.y + 8, 6, 0, Math.PI * 2);
            ctx.fill();
            
            // Отражение на шлеме
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.beginPath();
            ctx.arc(player.x + player.width/2 - 2, player.y + 6, 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Руки
            ctx.fillStyle = '#bdc3c7';
            if (player.facing === 1) {
                ctx.fillRect(player.x + player.width - 3, player.y + 12, 6, 3);
            } else {
                ctx.fillRect(player.x - 3, player.y + 12, 6, 3);
            }
            
            // Ноги (анимация ходьбы)
            const legOffset = Math.sin(player.animationFrame * 0.5) * 2;
            ctx.fillStyle = '#95a5a6';
            ctx.fillRect(player.x + 4, player.y + player.height - 5, 4, 5);
            ctx.fillRect(player.x + player.width - 8, player.y + player.height - 5 + legOffset, 4, 5);
            
            // Оружие (если атакует)
            if (player.isAttacking) {
                ctx.fillStyle = '#3498db';
                const weaponX = player.facing === 1 ? player.x + player.width : player.x - 20;
                const weaponY = player.y + 12;
                
                // Энергетический меч
                ctx.fillRect(weaponX, weaponY, 20, 3);
                
                // Свечение меча
                ctx.fillStyle = 'rgba(52, 152, 219, 0.5)';
                ctx.fillRect(weaponX - 2, weaponY - 2, 24, 7);
            }
            
            // Частицы джетпака
            player.jetpackParticles.forEach(p => {
                ctx.fillStyle = `rgba(255, ${100 + Math.random() * 100}, 0, ${p.lifetime / 20})`;
                ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
            });
        }
        
        // Частицы
        particles.forEach(particle => {
            if (particle.glow) {
                ctx.fillStyle = particle.color + Math.floor(particle.lifetime * 8).toString(16);
                ctx.fillRect(particle.x - 1, particle.y - 1, particle.size + 2, particle.size + 2);
            }
            ctx.fillStyle = particle.color + Math.floor(particle.lifetime * 8).toString(16);
            ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
        });
        
        // Числа урона
        damageNumbers.forEach(number => {
            ctx.fillStyle = number.color + Math.floor(number.lifetime * 8).toString(16);
            ctx.font = `bold ${number.size}px Arial`;
            ctx.textAlign = 'center';
            ctx.strokeStyle = 'rgba(0,0,0,0.5)';
            ctx.lineWidth = 2;
            ctx.strokeText(number.text, number.x, number.y);
            ctx.fillText(number.text, number.x, number.y);
        });
    }
    
    // Отрисовка UI
    function drawUI() {
        // Полоска здоровья
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(8, 8, 104, 14);
        
        const healthGradient = ctx.createLinearGradient(10, 10, 110, 10);
        healthGradient.addColorStop(0, '#e74c3c');
        healthGradient.addColorStop(1, '#c0392b');
        ctx.fillStyle = healthGradient;
        ctx.fillRect(10, 10, 100 * (player.health / player.maxHealth), 10);
        
        ctx.strokeStyle = '#ecf0f1';
        ctx.lineWidth = 1;
        ctx.strokeRect(8, 8, 104, 14);
        
        // Текст здоровья
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 9px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.floor(player.health)}/${player.maxHealth}`, 60, 18);
        
        // Информация об игре
        ctx.fillStyle = '#4ecdc4';
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Очки: ${gameScore}`, 10, 35);
        ctx.fillText(`Волна: ${waveNumber}`, 10, 48);
        ctx.fillText(`Убито: ${totalEnemiesKilled}`, 10, 61);
        
        if (boss) {
            ctx.fillStyle = '#ff6b6b';
            ctx.fillText(`БОСС!`, 10, 74);
        } else {
            ctx.fillText(`Врагов: ${enemies.length}/${maxEnemiesPerWave}`, 10, 74);
        }
        
        // Мир
        ctx.fillStyle = '#feca57';
        ctx.fillText(`Мир: ${currentWorld + 1}`, 10, 87);
        
        // Характеристики
        ctx.font = '9px Arial';
        ctx.fillStyle = '#ecf0f1';
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
        
        // Кнопка полного экрана
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(10, canvas.height - 35, 30, 25);
        ctx.strokeStyle = '#ecf0f1';
        ctx.strokeRect(10, canvas.height - 35, 30, 25);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('⛶', 25, canvas.height - 18);
        
        // Кнопка атаки
        ctx.fillStyle = attackButtonPressed ? 'rgba(255, 107, 107, 0.5)' : 'rgba(255, 107, 107, 0.3)';
        ctx.beginPath();
        ctx.arc(canvas.width - 35, canvas.height - 35, 25, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#ff6b6b';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('⚔', canvas.width - 35, canvas.height - 28);
        
        // Джойстик
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
        
        // Уведомление о боссе
        if (boss && boss.health === boss.maxHealth) {
            const bossAlpha = Math.sin(Date.now() * 0.005) * 0.5 + 0.5;
            ctx.fillStyle = `rgba(255, 0, 0, ${bossAlpha})`;
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('⚠ БОСС ПОЯВИЛСЯ ⚠', canvas.width/2, 50);
        }
    }
    
    // Конец игры
    function endGame() {
        updateScore(gameScore);
        document.getElementById('gameOverDiv').style.display = 'block';
        document.getElementById('gameInstructions').innerHTML = 
            `🎮 Игра окончена!<br>
             📊 Очки: ${gameScore}<br>
             🌊 Волна: ${waveNumber}<br>
             ⚔️ Убито: ${totalEnemiesKilled}<br>
             👑 Боссов побеждено: ${bossesDefeated}<br>
             🌌 Миров исследовано: ${currentWorld + 1}`;
    }
    
    // Инициализация
    initBackground();
    createLevel();
    gameRunning = true;
    gameLoop();
    updateGameStats();
}
