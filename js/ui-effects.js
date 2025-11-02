class UIEffects {
    static initGlassEffects() {
        const glassCards = document.querySelectorAll('.glass-card');
        
        glassCards.forEach(card => {
            let isHovering = false;
            let animationFrame;
            
            // Оптимизированная версия с requestAnimationFrame
            const handleMouseMove = (e) => {
                if (!isHovering) return;
                
                if (animationFrame) {
                    cancelAnimationFrame(animationFrame);
                }
                
                animationFrame = requestAnimationFrame(() => {
                    const rect = card.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    
                    const centerX = rect.width / 2;
                    const centerY = rect.height / 2;
                    
                    // Меньшая чувствительность для более плавного эффекта
                    const rotateY = ((x - centerX) / centerX) * 2; // Уменьшил с 25 до 2 градусов
                    const rotateX = ((centerY - y) / centerY) * 2;
                    
                    // Добавляем ограничения чтобы избежать резких поворотов
                    const limitedRotateX = Math.max(Math.min(rotateX, 3), -3);
                    const limitedRotateY = Math.max(Math.min(rotateY, 3), -3);
                    
                    // Плавный переход
                    card.style.transform = `
                        perspective(1000px) 
                        rotateX(${limitedRotateX}deg) 
                        rotateY(${limitedRotateY}deg)
                        scale(1.02)
                    `;
                    
                    // Добавляем эффект свечения
                    const glowX = (x / rect.width) * 100;
                    const glowY = (y / rect.height) * 100;
                    
                    card.style.background = `
                        radial-gradient(
                            circle at ${glowX}% ${glowY}%,
                            rgba(255, 255, 255, 0.15) 0%,
                            rgba(255, 255, 255, 0.1) 20%,
                            rgba(255, 255, 255, 0.05) 40%,
                            transparent 70%
                        ),
                        rgba(255, 255, 255, 0.1)
                    `;
                });
            };
            
            const handleMouseEnter = () => {
                isHovering = true;
                card.style.transition = 'transform 0.3s ease, background 0.3s ease';
                card.style.willChange = 'transform'; // Оптимизация для браузера
            };
            
            const handleMouseLeave = () => {
                isHovering = false;
                
                if (animationFrame) {
                    cancelAnimationFrame(animationFrame);
                }
                
                // Плавный возврат к исходному состоянию
                card.style.transition = 'transform 0.5s ease, background 0.5s ease';
                card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
                card.style.background = 'rgba(255, 255, 255, 0.1)';
            };
            
            // Добавляем обработчики
            card.addEventListener('mouseenter', handleMouseEnter);
            card.addEventListener('mousemove', handleMouseMove);
            card.addEventListener('mouseleave', handleMouseLeave);
            
            // Предотвращаем накопление обработчиков
            card._handlers = {
                mouseenter: handleMouseEnter,
                mousemove: handleMouseMove,
                mouseleave: handleMouseLeave
            };
        });
    }
    
    // Альтернативный вариант - более простой и стабильный
    static initSimpleTiltEffect() {
        const glassCards = document.querySelectorAll('.glass-card');
        
        glassCards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                // Очень мягкий эффект
                const rotateY = ((x - centerX) / centerX) * 1; // Всего 1 градус максимум
                const rotateX = ((centerY - y) / centerY) * 1;
                
                card.style.transform = `
                    perspective(1000px) 
                    rotateX(${rotateX}deg) 
                    rotateY(${rotateY}deg)
                `;
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
            });
        });
    }
    
    // Самый простой вариант - только подъем без наклона
    static initHoverEffect() {
        const glassCards = document.querySelectorAll('.glass-card');
        
        glassCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-5px) scale(1.02)';
                card.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.2)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) scale(1)';
                card.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
            });
        });
    }
    
    static initSmoothScrolling() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }
    
    // Новый метод - комбинированный эффект (рекомендуется)
    static initCombinedEffect() {
        const glassCards = document.querySelectorAll('.glass-card');
        
        glassCards.forEach(card => {
            let mouseX = 0;
            let mouseY = 0;
            let currentX = 0;
            let currentY = 0;
            let animationFrame;
            
            const updateCardStyle = () => {
                // Плавное следование за курсором с интерполяцией
                currentX += (mouseX - currentX) * 0.1;
                currentY += (mouseY - currentY) * 0.1;
                
                // Очень мягкий наклон
                const tiltX = currentY * 0.5;
                const tiltY = currentX * 0.5;
                
                card.style.transform = `
                    perspective(1000px)
                    rotateX(${tiltX}deg)
                    rotateY(${tiltY}deg)
                    translateY(-3px)
                    scale(1.01)
                `;
                
                // Свечение
                card.style.background = `
                    radial-gradient(
                        circle at ${50 + currentX * 10}% ${50 + currentY * 10}%,
                        rgba(255, 255, 255, 0.15) 0%,
                        rgba(255, 255, 255, 0.1) 30%,
                        transparent 70%
                    ),
                    rgba(255, 255, 255, 0.1)
                `;
                
                animationFrame = requestAnimationFrame(updateCardStyle);
            };
            
            card.addEventListener('mouseenter', () => {
                card.style.transition = 'transform 0.3s ease, background 0.3s ease';
                animationFrame = requestAnimationFrame(updateCardStyle);
            });
            
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                // Нормализуем координаты от -1 до 1
                mouseX = (x / rect.width - 0.5) * 2;
                mouseY = (y / rect.height - 0.5) * 2;
            });
            
            card.addEventListener('mouseleave', () => {
                if (animationFrame) {
                    cancelAnimationFrame(animationFrame);
                }
                
                card.style.transition = 'transform 0.5s ease, background 0.5s ease';
                card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0) scale(1)';
                card.style.background = 'rgba(255, 255, 255, 0.1)';
                
                mouseX = 0;
                mouseY = 0;
                currentX = 0;
                currentY = 0;
            });
        });
    }
}