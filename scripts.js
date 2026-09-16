// script.js
const GITHUB_USER = 'sirrobot01';
const STAR_CACHE_KEY = 'gh-stars';
const STAR_CACHE_TTL = 60 * 60 * 1000; // 1 hour

class Portfolio {
    constructor() {
        this.currentSection = 'projects';
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupTerminalControls();
        this.setupKonamiCode();
        this.setupStarCounts();
    }

    // Refresh the server-rendered star counts from the GitHub API.
    // One list request covers every repo; the markup stays as the fallback.
    setupStarCounts() {
        const nodes = document.querySelectorAll('.stat[data-repo]');
        if (!nodes.length) return;

        const grid = document.querySelector('.projects-grid');

        const render = (stars) => {
            nodes.forEach(node => {
                const count = stars[node.dataset.repo];
                if (typeof count !== 'number') return;
                node.querySelector('.stat-count').textContent = count.toLocaleString();
            });

            // Reorder to match the counts now on screen, so the two never disagree.
            // Cards already in star order re-append unchanged, so nothing visibly moves.
            const cards = Array.from(grid.querySelectorAll('.project-card'));
            cards.sort((a, b) => starsOf(b) - starsOf(a));
            cards.forEach(card => grid.appendChild(card));
        };

        const starsOf = (card) => {
            const count = card.querySelector('.stat-count');
            return count ? Number(count.textContent.replace(/,/g, '')) : -1;
        };

        try {
            const cached = JSON.parse(localStorage.getItem(STAR_CACHE_KEY));
            if (cached && Date.now() - cached.at < STAR_CACHE_TTL) {
                render(cached.stars);
                return;
            }
        } catch (e) {
            // Unreadable or unavailable storage - fall through and fetch.
        }

        fetch(`https://api.github.com/users/${GITHUB_USER}/repos?per_page=100`)
            .then(response => response.ok ? response.json() : Promise.reject(response.status))
            .then(repos => {
                const stars = {};
                repos.forEach(repo => {
                    stars[repo.name] = repo.stargazers_count;
                });
                render(stars);
                try {
                    localStorage.setItem(STAR_CACHE_KEY, JSON.stringify({ at: Date.now(), stars }));
                } catch (e) {
                    // Storage full or blocked - the counts still rendered.
                }
            })
            .catch(() => {
                // Offline or rate limited - keep the counts already in the markup.
            });
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
                this.showDockIcon(() => {
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
                this.restoreFromMinimized(() => {
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
        const easterEgg = document.createElement('div');
        easterEgg.innerHTML = `
           <div class="prompt">
               <span class="user">root@biodun</span><span class="separator">:</span><span class="path">~/secret</span><span class="dollar">$</span>
               <span class="command">execute order_66.sh</span>
           </div>
           <div style="margin-left: 20px; color: var(--accent-orange);">
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
}

// Initialize portfolio when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Portfolio();

    console.log('Rebel Base Terminal v1.0 initialized');
    console.log('Try the Konami code... the Force will guide you!');
});
