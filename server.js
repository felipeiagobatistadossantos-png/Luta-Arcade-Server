const http = require('http');
const WebSocket = require('ws');

const port = process.env.PORT || 8765;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Servidor Relay Online\n');
});

const wss = new WebSocket.Server({ server });

let filaEspera = null;

wss.on('connection', (ws) => {
  console.log('Novo jogador conectado');

  if (filaEspera && filaEspera.readyState === WebSocket.OPEN) {
    const oponente = filaEspera;
    filaEspera = null;

    ws.oponente = oponente;
    oponente.oponente = ws;

    ws.send(JSON.stringify({ tipo: 'pareado', jogador: 2 }));
    oponente.send(JSON.stringify({ tipo: 'pareado', jogador: 1 }));
  } else {
    filaEspera = ws;
  }

  ws.on('message', (data, isBinary) => {
    if (ws.oponente && ws.oponente.readyState === WebSocket.OPEN) {
      ws.oponente.send(data, { binary: isBinary });
    }
  });

  ws.on('close', () => {
    if (filaEspera === ws) {
      filaEspera = null;
    }
    if (ws.oponente && ws.oponente.readyState === WebSocket.OPEN) {
      ws.oponente.send(JSON.stringify({ tipo: 'desconectado' }));
      ws.oponente.oponente = null;
    }
  });
});

server.listen(port, () => {
  console.log(`Servidor Relay rodando na porta ${port}`);
});
