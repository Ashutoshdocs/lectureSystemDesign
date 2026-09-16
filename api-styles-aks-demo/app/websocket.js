// ---------------------------------------------------------------------------
// WebSocket  ->  "used for real-time communication"
// Full-duplex: server pushes a live tick every 2s; also echoes client messages.
// ---------------------------------------------------------------------------
function setupWebSocket(wss) {
  wss.on('connection', (ws) => {
    ws.send(JSON.stringify({ type: 'welcome', message: 'Connected to WebSocket demo', at: new Date().toISOString() }));

    // Server -> client push (this is what REST cannot do)
    const interval = setInterval(() => {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ type: 'tick', time: new Date().toISOString() }));
      }
    }, 2000);

    // Client -> server, and echo back
    ws.on('message', (data) => {
      ws.send(JSON.stringify({ type: 'echo', received: data.toString(), at: new Date().toISOString() }));
    });

    ws.on('close', () => clearInterval(interval));
    ws.on('error', () => clearInterval(interval));
  });

  console.log('WebSocket server ready on path /ws');
}

module.exports = { setupWebSocket };
