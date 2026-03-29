const ws = new WebSocket('wss://quantdesk-api-5vu4.onrender.com/ws/market');
ws.on('open', () => console.log('Connected!'));
ws.on('error', (e) => console.log('Error:', e));
