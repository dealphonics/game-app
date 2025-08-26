// =====================================================
// АНИМАЦИИ И ЭФФЕКТЫ
// =====================================================

class ParticleSystem {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.mouseX = 0;
        this.mouseY = 0;
        
        this.init();
    }
    
    init() {
        this.resize();
        this.createParticles();
        this.animate();
        
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        });
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    createParticles() {
        const particleCount = 50;
        
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2 + 0.5,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: (Math.random() - 0.5) * 0.5,
                opacity: Math.random() * 0.5 + 0.2,
                hue: Math.random() * 60 + 200 // Blue-purple range
            });
        }
    }
    
    updateParticles() {
        this.particles.forEach(particle => {
            particle.x += particle.speedX;
            particle.y += particle.speedY;
            
            // Mouse interaction
            const dx = this.mouseX - particle.x;
            const dy = this.mouseY - particle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 100) {
                const force = (100 - distance) / 100;
                particle.x -= dx * force * 0.02;
                particle.y -= dy * force * 0.02;
            }
            
            // Wrap around edges
            if (particle.x < 0) particle.x = this.canvas.width;
            if (particle.x > this.canvas.width) particle.x = 0;
            if (particle.y < 0) particle.y = this.canvas.height;
            if (particle.y > this.canvas.height) particle.y = 0;
        });
    }
    
    drawParticles() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw connections
        this.particles.forEach((particle, i) => {
            this.particles.slice(i + 1).forEach(otherParticle => {
                const dx = particle.x - otherParticle.x;
                const dy = particle.y - otherParticle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 150) {
                    this.ctx.beginPath();
                    this.ctx.strokeStyle = `hsla(${particle.hue}, 70%, 50%, ${0.2 * (1 - distance / 150)})`;
                    this.ctx.lineWidth = 0.5;
                    this.ctx.moveTo(particle.x, particle.y);
                    this.ctx.lineTo(otherParticle.x, otherParticle.y);
                    this.ctx.stroke();
                }
            });
            
            // Draw particle
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `hsla(${particle.hue}, 70%, 50%, ${particle.opacity})`;
            this.ctx.fill();
        });
    }
    
    animate() {
        this.updateParticles();
        this.drawParticles();
        requestAnimationFrame(() => this.animate());
    }
}

// Инициализация системы частиц
document.addEventListener('DOMContentLoaded', () => {
    new ParticleSystem('particlesCanvas');
    
    // Анимация чисел
    animateNumbers();
    
    // Intersection Observer для анимаций при прокрутке
    setupScrollAnimations();
    
    // Динамическая смена темы фона
    setupDynamicBackground();
});

// Анимация чисел при загрузке
function animateNumbers() {
    const numbers = document.querySelectorAll('.stat-value');
    
    numbers.forEach(num => {
        const target = parseInt(num.textContent) || 0;
        const duration = 1000;
        const start = Date.now();
        
        const animate = () => {
            const progress = Math.min((Date.now() - start) / duration, 1);
            const current = Math.floor(progress * target);
            
            if (num.id === 'scoreDisplay') {
                num.textContent = current;
            }
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    });
}

// Анимации при прокрутке
function setupScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    document.querySelectorAll('.game-card, .stat-card, .reward-item').forEach(el => {
        observer.observe(el);
    });
}

// Динамический фон
function setupDynamicBackground() {
    const spheres = document.querySelectorAll('.gradient-sphere');
    let time = 0;
    
    setInterval(() => {
        time += 0.01;
        
        spheres.forEach((sphere, index) => {
            const x = Math.sin(time + index) * 50;
            const y = Math.cos(time + index) * 50;
            sphere.style.transform = `translate(${x}px, ${y}px)`;
        });
    }, 50);
}

// Эффект ряби при клике
document.addEventListener('click', (e) => {
    if (e.target.closest('button') || e.target.closest('.game-card')) {
        createRipple(e);
    }
});

function createRipple(e) {
    const button = e.target.closest('button') || e.target.closest('.game-card');
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
        left: ${x}px;
        top: ${y}px;
        pointer-events: none;
        animation: ripple 0.6s ease-out;
    `;
    
    button.style.position = 'relative';
    button.style.overflow = 'hidden';
    button.appendChild(ripple);
    
    setTimeout(() => ripple.remove(), 600);
}

// Добавляем CSS для анимации ряби
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        from {
            transform: scale(0);
            opacity: 1;
        }
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
