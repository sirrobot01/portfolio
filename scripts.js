// script.js
const GITHUB_USER = 'sirrobot01';
const STAR_CACHE_KEY = 'gh-stars';
const STAR_CACHE_TTL = 60 * 60 * 1000; // 1 hour
const MAN_PAGES = {
    decypharr: {
        summary: 'media gateway for Debrid and Usenet',
        synopsis: 'docker compose up -d        # image: cy01/blackhole:latest',
        description: [
            'Gives Sonarr, Radarr and other *Arr applications a single',
            'interface to Debrid providers and Usenet streaming, so they can',
            'talk to a debrid service the way they talk to a torrent client.'
        ],
        language: 'Go',
        license: 'MIT'
    },
    'django-request-viewer': {
        summary: 'log and view requests made on a Django app',
        synopsis: 'pip install django-request-viewer',
        description: [
            'Logs requests and exceptions raised by a Django application and',
            'renders them for inspection. Written after horus, a request',
            'logger for Go, to give the Django community the same tool.'
        ],
        language: 'Python',
        license: 'MIT'
    },
    lamba: {
        summary: 'a self-hosted AWS Lambda',
        synopsis: 'go install github.com/sirrobot01/lamba@latest',
        description: [
            'A self-hosted alternative to AWS Lambda, written in Go. Runs',
            'functions in containers on infrastructure you control, instead',
            'of in a managed cloud runtime.'
        ],
        language: 'Go',
        license: 'MIT'
    },
    protodex: {
        summary: 'self-hosted protobuf schema registry',
        synopsis: 'go install github.com/sirrobot01/protodex/cmd/protodex@latest',
        description: [
            'Stores and versions protobuf schemas, and generates client code',
            'from them, without depending on a hosted registry.'
        ],
        language: 'Go',
        license: 'MIT'
    },
    dbnest: {
        summary: 'self-hosted database manager',
        synopsis: 'docker run -d cy01/dbnest:latest',
        description: [
            'Provisions PostgreSQL, MySQL, MariaDB and Redis instances in',
            'containers and manages them from one web interface, with',
            'real-time metrics and scheduled backups.'
        ],
        language: 'TypeScript',
        license: 'MIT'
    },
    hearsay: {
        summary: 'shared observations between independent operators',
        synopsis: 'curl -fsSL https://hearsay.decypharr.com/install.sh | sh',
        description: [
            'Shares observations about external state between independent',
            'operators. The observations are byproducts of work the operators',
            'already do.',
            '',
            'Hearsay is a hint layer, not an authority. An answer tells you',
            'what other operators believe, how strongly, and how recently. It',
            'does not tell you what is true.'
        ],
        language: 'Go',
        license: '-'
    }
};

const SHELL_SECTIONS = ['projects', 'skills', 'blog', 'contact'];
const SHELL_FILES = ['about.md'];

class Portfolio {
    constructor() {
        this.currentSection = '';
        this.history = [];
        this.historyIndex = 0;
        this.githubStats = null;
        this.githubState = 'pending';
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupTerminalControls();
        this.setupKonamiCode();
        this.setupStarCounts();
        this.setupShell();
        this.setupRouting();
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
            // A cache written before stats were recorded is treated as a miss,
            // otherwise neofetch would read "loading..." until the entry expired.
            if (cached && cached.stats && Date.now() - cached.at < STAR_CACHE_TTL) {
                this.githubStats = cached.stats;
                this.githubState = 'ready';
                render(cached.stars);
                return;
            }
        } catch (e) {
            // Unreadable or unavailable storage - fall through and fetch.
        }

        fetch(`https://api.github.com/users/${GITHUB_USER}/repos?per_page=100`)
            .then(response => response.ok ? response.json() : Promise.reject(response.status))
            .then(repos => {
                const owned = repos.filter(repo => !repo.fork);
                // Weighted by stars, not repo count: a pile of small old repos
                // should not outrank where the work that landed actually is.
                const byLanguage = {};
                owned.forEach(repo => {
                    if (!repo.language) return;
                    byLanguage[repo.language] = (byLanguage[repo.language] || 0) + repo.stargazers_count + 1;
                });
                const top = owned.reduce((best, repo) =>
                    repo.stargazers_count > (best ? best.stargazers_count : -1) ? repo : best, null);

                this.githubState = 'ready';
                this.githubStats = {
                    repos: owned.length,
                    stars: owned.reduce((total, repo) => total + repo.stargazers_count, 0),
                    topRepo: top ? { name: top.name, stars: top.stargazers_count } : null,
                    languages: Object.keys(byLanguage)
                        .sort((a, b) => byLanguage[b] - byLanguage[a])
                        .slice(0, 3)
                };

                const stars = {};
                repos.forEach(repo => {
                    stars[repo.name] = repo.stargazers_count;
                });
                render(stars);
                try {
                    localStorage.setItem(STAR_CACHE_KEY, JSON.stringify({
                        at: Date.now(),
                        stars,
                        stats: this.githubStats
                    }));
                } catch (e) {
                    // Storage full or blocked - the counts still rendered.
                }
            })
            .catch(() => {
                // Offline or rate limited - keep the counts already in the markup.
                this.githubState = 'failed';
            });
    }

    setupNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');
        const sections = document.querySelectorAll('.section');

        navButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetSection = button.getAttribute('data-section');

                this.showSection(targetSection);
            });
        });
    }

    promptPath() {
        return this.currentSection ? `~/${this.currentSection}` : '~';
    }

    // id of null closes everything and returns to the bare prompt.
    showSection(id, updateHash = true) {
        const section = id ? document.getElementById(id) : null;
        if (id && !section) return false;

        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-section') === id);
        });
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        if (section) section.classList.add('active');

        this.currentSection = id || '';

        const path = document.getElementById('shell-path');
        if (path) path.textContent = this.promptPath();

        if (updateHash) {
            if (id) {
                if (location.hash !== `#${id}`) location.hash = `#${id}`;
            } else if (location.hash) {
                history.replaceState(null, '', location.pathname + location.search);
            }
        }

        if (section) this.animateSection(id);
        return true;
    }

    // Sections are addressable, so a link to one can be shared.
    setupRouting() {
        const apply = () => {
            const id = decodeURIComponent(location.hash.replace(/^#/, ''));
            this.showSection(SHELL_SECTIONS.includes(id) ? id : null, false);
        };
        window.addEventListener('hashchange', apply);
        apply();
    }

    setupShell() {
        const form = document.getElementById('shell-form');
        const input = document.getElementById('shell-input');
        const output = document.getElementById('shell-output');
        if (!form || !input || !output) return;

        this.shellInput = input;
        this.shellLine = form;
        this.shellOutput = output;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const raw = input.value;
            input.value = '';
            if (raw.trim()) {
                this.history.push(raw.trim());
            }
            this.historyIndex = this.history.length;
            this.runCommand(raw);
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (this.historyIndex > 0) {
                    this.historyIndex--;
                    input.value = this.history[this.historyIndex];
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (this.historyIndex < this.history.length - 1) {
                    this.historyIndex++;
                    input.value = this.history[this.historyIndex];
                } else {
                    this.historyIndex = this.history.length;
                    input.value = '';
                }
            } else if (e.key === 'Tab') {
                e.preventDefault();
                this.completeInput(input);
            } else if (e.key === 'l' && e.ctrlKey) {
                e.preventDefault();
                output.replaceChildren();
            }
        });

        // Clicking anywhere in the shell area puts the caret back in the input.
        document.getElementById('shell').addEventListener('click', (e) => {
            if (!e.target.closest('a')) input.focus();
        });

        // Focusing on load would pop the keyboard open on phones.
        if (!window.matchMedia('(max-width: 768px)').matches) {
            input.focus();
        }

        const path = document.getElementById('shell-path');
        if (path) path.textContent = `~/${this.currentSection}`;

        this.printLines([
            'biodun.dev - Mukhtar Akere',
            'Software engineer. Backend systems and developer tools, mostly Go and Python.'
        ]);
        this.printLines([
            "Type 'help' to see what you can do here, or 'cat about.md' for the long version."
        ], 'shell-hint');
    }

    completeInput(input) {
        const value = input.value;
        const parts = value.split(/\s+/);
        const repos = Array.from(document.querySelectorAll('.stat[data-repo]'))
            .map(node => node.dataset.repo);

        let pool = Object.keys(this.shellCommands());
        if (parts.length > 1) {
            if (parts[0] === 'cd') pool = SHELL_SECTIONS;
            else if (parts[0] === 'cat') pool = SHELL_FILES;
            else if (parts[0] === 'open') pool = repos;
            else if (parts[0] === 'man') pool = Object.keys(MAN_PAGES);
            else return;
        }

        const fragment = parts[parts.length - 1];
        const matches = pool.filter(name => name.startsWith(fragment));
        if (!matches.length) return;

        if (matches.length === 1) {
            parts[parts.length - 1] = matches[0];
            input.value = parts.join(' ') + ' ';
            return;
        }
        this.echo(value);
        this.printLines([matches.join('   ')]);
    }

    shellCommands() {
        return {
            help: () => [
                'Available commands:',
                '',
                '  help              show this message',
                '  ls                list what is here',
                '  cd <section>      go to projects, skills, blog or contact',
                '  cd ~              close the current section',
                '  cat about.md      read the long version',
                '  whoami            the short version',
                '  neofetch          the stats',
                '  man <project>     read the manual for a project',
                '  open <project>    open a project on GitHub',
                '  clear             clear the output',
                '',
                'Tab completes. The up arrow walks back through history.'
            ],

            ls: () => ['projects/   skills/   blog/   contact/   about.md'],

            whoami: () => [
                'Mukhtar Akere - Software Engineer',
                'Backend systems and developer tools, mostly Go and Python.'
            ],

            cd: (args) => {
                const target = (args[0] || '~').replace(/\/$/, '');
                if (target === '~' || target === '/' || target === '..') {
                    this.showSection(null);
                    return [];
                }
                if (!SHELL_SECTIONS.includes(target)) {
                    return { error: [`cd: no such section: ${target}`] };
                }
                this.showSection(target);
                return [];
            },

            cat: (args) => {
                const file = args[0];
                if (!file) return ['cat: missing file. Try: cat about.md'];
                if (file !== 'about.md') {
                    return { error: [`cat: ${file}: No such file or directory`] };
                }
                const stats = this.githubStats;
                const scale = stats
                    ? `${stats.repos} public repositories and ${stats.stars.toLocaleString()} stars`
                    : 'a few dozen public repositories';
                return [
                    'Mukhtar Akere - Software Engineer',
                    '',
                    'I build backend systems and developer tools, mostly in Go and',
                    'Python. Most of that work is open source: ' + scale + '.',
                    '',
                    'The largest is Decypharr, a media gateway for Debrid and Usenet',
                    'that gives Sonarr, Radarr and other *Arr applications one',
                    'interface to talk to. More recently I have been building',
                    'infrastructure in Go - a protobuf schema registry, a shared hint',
                    'layer for independent operators, and a self-hosted alternative to',
                    'AWS Lambda.',
                    '',
                    'I write about backend engineering at blog.biodun.dev.',
                    '',
                    'Reach me at akeremukhtar10@gmail.com.'
                ];
            },

            open: (args) => {
                const name = args[0];
                const repos = Array.from(document.querySelectorAll('.stat[data-repo]'))
                    .map(node => node.dataset.repo);
                if (!name) return [`open: missing project. Try: open ${repos[0] || 'decypharr'}`];
                if (!repos.includes(name)) {
                    return { error: [`open: unknown project: ${name}`, `Known: ${repos.join(', ')}`] };
                }
                window.open(`https://github.com/${GITHUB_USER}/${name}`, '_blank', 'noopener');
                return [`Opening github.com/${GITHUB_USER}/${name} ...`];
            },

            man: (args) => {
                const name = args[0];
                const known = Object.keys(MAN_PAGES);
                if (!name) {
                    return ['What manual page do you want?', `Available: ${known.join(', ')}`];
                }
                const page = MAN_PAGES[name];
                if (!page) {
                    return { error: [`No manual entry for ${name}`, `Available: ${known.join(', ')}`] };
                }

                const count = document.querySelector(`.stat[data-repo="${name}"] .stat-count`);
                const stars = count ? count.textContent : '-';
                const indent = '       ';
                const tag = `${name.toUpperCase()}(1)`;
                const lines = [];

                // The centred header only fits on a wide screen.
                if (window.matchMedia('(max-width: 768px)').matches) {
                    lines.push(tag);
                } else {
                    const mid = 'User Commands';
                    const gap = 72 - (tag.length * 2) - mid.length;
                    const left = Math.max(1, Math.floor(gap / 2));
                    lines.push(tag + ' '.repeat(left) + mid + ' '.repeat(Math.max(1, gap - left)) + tag);
                }

                lines.push('', 'NAME', `${indent}${name} - ${page.summary}`);
                lines.push('', 'SYNOPSIS', `${indent}${page.synopsis}`);
                lines.push('', 'DESCRIPTION');
                page.description.forEach(line => lines.push(line ? indent + line : ''));
                lines.push('', 'STATUS');
                lines.push(`${indent}Stars: ${stars}    Language: ${page.language}    License: ${page.license}`);
                lines.push('', 'SEE ALSO');
                lines.push(`${indent}github.com/${GITHUB_USER}/${name}`);
                return lines;
            },

            neofetch: () => {
                const stats = this.githubStats;
                const art = [
                    '    \u256d\u2500\u2500\u2500\u2500\u2500\u256e',
                    '    \u2502 \u25c9 \u25c9 \u2502',
                    '    \u2570\u2500\u2500\u2500\u2500\u2500\u256f',
                    '      \u2551 \u2551',
                    '\u2554\u2550\u2550\u2550\u2550\u2550\u2569\u2550\u2569\u2550\u2550\u2550\u2550\u2557',
                    '\u2551PERSEVERANCE\u2551',
                    '\u2551    ROVER   \u2551',
                    '\u255a\u2550\u2567\u2550\u2567\u2550\u2550\u2550\u2550\u2567\u2550\u2567\u2550\u255d',
                    '  \u25cf \u25cf \u25cf \u25cf \u25cf'
                ];

                const pending = this.githubState === 'failed' ? 'unavailable' : 'loading...';
                const languages = stats && stats.languages.length
                    ? stats.languages.join(', ')
                    : 'Go, Python, TypeScript';
                const info = [
                    'mukhtar@biodun',
                    '--------------',
                    `Role:      Software Engineer`,
                    `Focus:     Backend, distributed systems`,
                    `Languages: ${languages}`,
                    `Repos:     ${stats ? stats.repos + ' public' : pending}`,
                    `Stars:     ${stats ? stats.stars.toLocaleString() : pending}`,
                    `Top repo:  ${stats && stats.topRepo ? `${stats.topRepo.name} (${stats.topRepo.stars.toLocaleString()})` : 'decypharr'}`,
                    `Blog:      blog.biodun.dev`,
                    `GitHub:    github.com/${GITHUB_USER}`
                ];

                // Side by side is unreadable once the lines have to wrap.
                if (window.matchMedia('(max-width: 768px)').matches) {
                    this.printLines([...art, '', ...info]);
                    this.printPalette();
                    return null;
                }

                const gutter = Math.max(...art.map(line => line.length)) + 4;
                const lines = [];
                for (let i = 0; i < Math.max(art.length, info.length); i++) {
                    lines.push(((art[i] || '').padEnd(gutter) + (info[i] || '')).trimEnd());
                }
                this.printLines(lines);
                this.printPalette();
                return null;
            },

            clear: () => {
                this.shellOutput.replaceChildren();
                return null;
            }
        };
    }

    runCommand(raw) {
        const trimmed = raw.trim();
        this.echo(raw);
        if (!trimmed) return;

        const parts = trimmed.split(/\s+/);
        const handler = this.shellCommands()[parts[0]];
        if (!handler) {
            this.printLines([
                `${parts[0]}: command not found`,
                "Type 'help' for a list of commands."
            ], 'shell-error');
            return;
        }

        const result = handler(parts.slice(1));
        if (Array.isArray(result) && result.length) this.printLines(result);
        else if (result && result.error) this.printLines(result.error, 'shell-error');

        this.scrollShell();
    }

    // Keep the newest output and the prompt both on screen.
    scrollShell() {
        this.shellOutput.scrollTop = this.shellOutput.scrollHeight;
        (this.shellLine || this.shellInput).scrollIntoView({ block: 'nearest' });
    }

    // Echo the command back above its output, the way a real shell does.
    echo(command) {
        const row = document.createElement('div');
        row.className = 'shell-row shell-echo';
        row.innerHTML = '<span class="user">root@biodun</span><span class="separator">:</span>'
            + '<span class="path"></span><span class="dollar">$</span> ';
        row.querySelector('.path').textContent = this.promptPath();
        // The command is user input, so it goes in as text, never as markup.
        row.appendChild(document.createTextNode(command));
        this.shellOutput.appendChild(row);
    }

    printPalette() {
        const colors = ['#ff5f56', '#ffbd2e', '#27ca3f', '#58a6ff', '#a5a4ff', '#8b949e'];
        const block = document.createElement('div');
        block.className = 'shell-block';
        const row = document.createElement('div');
        row.className = 'shell-row shell-palette';
        colors.forEach(color => {
            const swatch = document.createElement('span');
            swatch.className = 'shell-swatch';
            swatch.style.background = color;
            row.appendChild(swatch);
        });
        block.appendChild(row);
        this.shellOutput.appendChild(block);
    }

    printLines(lines, className) {
        const block = document.createElement('div');
        block.className = 'shell-block';
        lines.forEach(line => {
            const row = document.createElement('div');
            row.className = className ? `shell-row ${className}` : 'shell-row';
            row.textContent = line;
            block.appendChild(row);
        });
        this.shellOutput.appendChild(block);
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
            if (e.target === this.shellInput) return;
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
