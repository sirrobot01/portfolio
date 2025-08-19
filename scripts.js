// script.js
class Portfolio {
    constructor() {
        this.currentSection = 'projects';
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupAnimations();
        this.setupTypingEffect();
        this.setupTerminalControls();
        this.setupRoverTimestamp();
    }

    setupNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');
        const sections = document.querySelectorAll('.section');

        navButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetSection = button.getAttribute('data-section');

                // Update active button
                navButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                // Update active section
                sections.forEach(section => section.classList.remove('active'));
                document.getElementById(targetSection).classList.add('active');

                this.currentSection = targetSection;

                // Trigger animations for the new section
                this.animateSection(targetSection);
            });
        });
    }

    setupTerminalControls() {
        const redControl = document.querySelector('.control.red');
        const yellowControl = document.querySelector('.control.yellow');
        const greenControl = document.querySelector('.control.green');
        const container = document.querySelector('.container');
        const terminalContent = document.querySelector('.terminal-content');
        
        let isMinimized = false;
        let isFullscreen = false;
        let isClosed = false;
        
        // Store reference to this for use in nested functions
        const self = this;

        // Red button - Close terminal and show reload button
        redControl.addEventListener('click', () => {
            if (!isClosed) {
                // Hide terminal
                container.style.display = 'none';
                isClosed = true;
                
                // Create and show reload button
                this.showReloadButton();
            }
        });

        // Yellow button - Minimize to bottom with dock icon
        yellowControl.addEventListener('click', () => {
            if (!isMinimized && !isClosed) {
                // Hide the main terminal
                container.style.display = 'none';
                
                // Create Mac-style dock icon
                self.showDockIcon(() => {
                    isMinimized = false;
                });
                isMinimized = true;
            }
        });

        // Green button - Fullscreen
        greenControl.addEventListener('click', () => {
            if (!isFullscreen && !isClosed) {
                // Go fullscreen
                container.style.position = 'fixed';
                container.style.top = '0';
                container.style.left = '0';
                container.style.width = '100vw';
                container.style.height = '100vh';
                container.style.maxWidth = 'none';
                container.style.margin = '0';
                container.style.padding = '10px';
                container.style.zIndex = '9999';
                container.style.transition = 'all 0.5s ease';
                
                // Enable scrolling in fullscreen
                terminalContent.style.overflow = 'auto';
                terminalContent.style.height = 'calc(100vh - 80px)';
                
                isFullscreen = true;
            } else if (isFullscreen) {
                // Exit fullscreen
                container.style.position = 'static';
                container.style.top = 'auto';
                container.style.left = 'auto';
                container.style.width = 'auto';
                container.style.height = 'auto';
                container.style.maxWidth = '1200px';
                container.style.margin = '0 auto';
                container.style.padding = '20px';
                container.style.zIndex = 'auto';
                
                // Reset scrolling
                terminalContent.style.overflow = 'visible';
                terminalContent.style.height = 'auto';
                
                isFullscreen = false;
            }
        });

        // Add body click to restore from minimized
        document.body.addEventListener('click', (e) => {
            if (isMinimized && !e.target.closest('.dock-icon') && !e.target.closest('.terminal-controls')) {
                self.restoreFromMinimized(() => {
                    isMinimized = false;
                });
            }
        });
    }

    showDockIcon(onRestore) {
        // Create Mac-style dock icon
        const dockIcon = document.createElement('div');
        dockIcon.className = 'dock-icon';
        dockIcon.innerHTML = `
            <div class="dock-icon-inner">
                <div class="terminal-icon">⬛</div>
                <div class="dock-tooltip">Terminal</div>
            </div>
        `;
        
        // Position at bottom center
        dockIcon.style.position = 'fixed';
        dockIcon.style.bottom = '20px';
        dockIcon.style.left = '50%';
        dockIcon.style.transform = 'translateX(-50%)';
        dockIcon.style.zIndex = '9999';
        
        document.body.appendChild(dockIcon);
        
        // Add click handler to restore
        dockIcon.addEventListener('click', () => {
            this.restoreFromMinimized(onRestore);
        });
    }

    restoreFromMinimized(callback) {
        // Remove dock icon
        const dockIcon = document.querySelector('.dock-icon');
        if (dockIcon) {
            document.body.removeChild(dockIcon);
        }
        
        // Restore terminal
        const container = document.querySelector('.container');
        container.style.display = 'block';
        
        // Execute callback to update state
        if (callback) {
            callback();
        }
    }

    showReloadButton() {
        // Create reload button
        const reloadButton = document.createElement('div');
        reloadButton.className = 'reload-button';
        reloadButton.innerHTML = `
            <div class="reload-icon">⟳</div>
            <span>Click to reload terminal</span>
        `;
        
        // Position in center of screen
        reloadButton.style.position = 'fixed';
        reloadButton.style.top = '50%';
        reloadButton.style.left = '50%';
        reloadButton.style.transform = 'translate(-50%, -50%)';
        reloadButton.style.cursor = 'pointer';
        
        document.body.appendChild(reloadButton);
        
        // Add click handler to reload
        reloadButton.addEventListener('click', () => {
            location.reload();
        });
    }

    setupRoverTimestamp() {
        const timestampElement = document.getElementById('rover-timestamp');
        if (!timestampElement) return;

        const updateTimestamp = () => {
            const now = new Date();
            const utcTime = now.toUTCString().replace('GMT', 'UTC');
            timestampElement.textContent = utcTime;
        };

        // Update immediately and then every 30 seconds
        updateTimestamp();
        setInterval(updateTimestamp, 30000);
    }

    setupAnimations() {
        // Animate skill bars when skills section is viewed
        this.animateSkillBars();

        // Add hover effects to project cards
        this.setupProjectCardEffects();

        // Setup terminal cursor blinking
        this.setupCursorBlink();
    }

    animateSkillBars() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const skillFills = entry.target.querySelectorAll('.skill-fill');
                    skillFills.forEach((fill, index) => {
                        setTimeout(() => {
                            fill.style.transform = 'scaleX(1)';
                        }, index * 200);
                    });
                }
            });
        });

        const skillsSection = document.getElementById('skills');
        if (skillsSection) {
            observer.observe(skillsSection);
        }
    }

    setupProjectCardEffects() {
        const projectCards = document.querySelectorAll('.project-card');

        projectCards.forEach(card => {
            // Remove glitch effects - cards now just use CSS hover effects
        });
    }

    setupCursorBlink() {
        const cursors = document.querySelectorAll('.terminal-cursor');
        cursors.forEach(cursor => {
            setInterval(() => {
                cursor.style.opacity = cursor.style.opacity === '0' ? '1' : '0';
            }, 1000);
        });
    }

    setupTypingEffect() {
        const typeWriter = (element, text, speed = 50) => {
            let i = 0;
            element.innerHTML = '';

            const typing = () => {
                if (i < text.length) {
                    element.innerHTML += text.charAt(i);
                    i++;
                    setTimeout(typing, speed);
                } else {
                    element.innerHTML += '<span class="terminal-cursor">_</span>';
                }
            };

            typing();
        };

        // Add typing effect to command outputs when section changes
        this.typeWriter = typeWriter;
    }

    animateSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (!section) return;

        // Add entrance animation
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';

        setTimeout(() => {
            section.style.transition = 'all 0.4s ease-out';
            section.style.opacity = '1';
            section.style.transform = 'translateY(0)';
        }, 100);

        // Special animations for specific sections
        switch(sectionId) {
            case 'projects':
                this.animateProjectCards();
                break;
            case 'skills':
                this.animateSkillBars();
                break;
            case 'blog':
                this.animateBlogSection();
                break;
            case 'contact':
                this.animateContactSection();
                break;
        }
    }

    animateProjectCards() {
        const cards = document.querySelectorAll('.project-card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';

            setTimeout(() => {
                card.style.transition = 'all 0.5s ease-out';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 150);
        });
    }

    animateBlogSection() {
        const placeholder = document.querySelector('.blog-placeholder');
        if (placeholder) {
            const text = placeholder.querySelector('p:first-of-type');
            if (text) {
                this.typeWriter(text, 'Blog system initializing...', 80);
            }
        }
    }

    animateContactSection() {
        const contactItems = document.querySelectorAll('.contact-item');
        contactItems.forEach((item, index) => {
            item.style.opacity = '0';
            item.style.transform = 'translateX(-20px)';

            setTimeout(() => {
                item.style.transition = 'all 0.4s ease-out';
                item.style.opacity = '1';
                item.style.transform = 'translateX(0)';
            }, index * 100);
        });
    }

    // Matrix rain effect (optional enhancement)
    setupMatrixRain() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '-1';
        canvas.style.opacity = '0.1';

        document.body.appendChild(canvas);

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        const matrix = "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789@#$%^&*()_+-=[]{}|;':\",./<>?";
        const matrixArray = matrix.split("");

        const fontSize = 10;
        const columns = canvas.width / fontSize;
        const drops = [];

        for(let x = 0; x < columns; x++) {
            drops[x] = 1;
        }

        const draw = () => {
            ctx.fillStyle = 'rgba(13, 17, 23, 0.04)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#3fb950';
            ctx.font = fontSize + 'px JetBrains Mono';

            for(let i = 0; i < drops.length; i++) {
                const text = matrixArray[Math.floor(Math.random() * matrixArray.length)];
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);

                if(drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        };

        setInterval(draw, 35);
    }

    // System status simulator
    setupSystemStatus() {
        const statusElement = document.querySelector('.status.online');
        if (!statusElement) return;

        const statuses = [
            '● SYSTEM ONLINE',
            '● SERVICES RUNNING',
            '● ALL SYSTEMS GO',
            '● READY FOR DEPLOYMENT',
            '● BACKEND OPERATIONAL'
        ];

        let currentIndex = 0;
        setInterval(() => {
            statusElement.textContent = statuses[currentIndex];
            currentIndex = (currentIndex + 1) % statuses.length;
        }, 5000);
    }

    // Konami code easter egg
    setupKonamiCode() {
        const konamiCode = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];
        let konamiIndex = 0;

        document.addEventListener('keydown', (e) => {
            if (e.keyCode === konamiCode[konamiIndex]) {
                konamiIndex++;
                if (konamiIndex === konamiCode.length) {
                    this.activateEasterEgg();
                    konamiIndex = 0;
                }
            } else {
                konamiIndex = 0;
            }
        });
    }

    activateEasterEgg() {
        // Add some fun effects
        document.body.style.filter = 'hue-rotate(180deg)';

        // Show a terminal message
        const terminal = document.querySelector('.terminal-content');
        const easterEgg = document.createElement('div');
        easterEgg.innerHTML = `
           <div class="prompt">
               <span class="user">root@biodun</span><span class="separator">:</span><span class="path">~/secret</span><span class="dollar">$</span>
               <span class="command">execute order_66.sh</span>
           </div>
           <div style="margin-left: 20px; color: var(--accent-orange); animation: glitch 0.5s infinite;">
                May the Force be with your code! The rebellion needs backend engineers like you.
           </div>
       `;
        easterEgg.style.position = 'fixed';
        easterEgg.style.top = '50%';
        easterEgg.style.left = '50%';
        easterEgg.style.transform = 'translate(-50%, -50%)';
        easterEgg.style.background = 'var(--bg-secondary)';
        easterEgg.style.border = '2px solid var(--accent-orange)';
        easterEgg.style.padding = '20px';
        easterEgg.style.borderRadius = '12px';
        easterEgg.style.zIndex = '1000';

        document.body.appendChild(easterEgg);

        setTimeout(() => {
            document.body.removeChild(easterEgg);
            document.body.style.filter = '';
        }, 3000);
    }

    // Performance monitoring
    setupPerformanceMonitoring() {
        if ('performance' in window) {
            window.addEventListener('load', () => {
                const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
                console.log(` Rebel Base loaded in ${loadTime}ms - faster than the Millennium Falcon!`);

                // Update system info if element exists
                const systemInfo = document.querySelector('.system-info');
                if (systemInfo) {
                    const performanceInfo = document.createElement('div');
                    performanceInfo.className = 'info-line';
                    performanceInfo.innerHTML = `
                       <span class="info-label">Load Time:</span>
                       <span class="info-value">${loadTime}ms</span>
                   `;
                    systemInfo.appendChild(performanceInfo);
                }
            });
        }
    }
}

// Utility functions
const utils = {
    // Throttle function for performance
    throttle(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Debounce function for search/input
    debounce(func, wait, immediate) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    },

    // Smooth scroll to element
    scrollToElement(element, offset = 0) {
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }
};

// Initialize portfolio when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const portfolio = new Portfolio();

    // Optional enhancements
    portfolio.setupSystemStatus();
    portfolio.setupKonamiCode();
    portfolio.setupPerformanceMonitoring();

    // Uncomment for matrix rain effect (heavy on performance)
    // portfolio.setupMatrixRain();

    console.log(' Rebel Base Terminal v1.0 initialized');
    console.log('💻 Built with the power of the Force (and vanilla JS)');
    console.log('🔧 Try the Konami code... the Force will guide you!');
});


// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Portfolio, utils };
}
