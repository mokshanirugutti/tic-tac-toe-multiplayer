import { WebSocketServer } from 'ws';
import { gameManager } from './gameManager';

const wss = new WebSocketServer({ port: 8000 });
const gamemanager = new gameManager();

wss.on('connection', function connection(ws) {
  ws.on('error', console.error);
  gamemanager.addUser(ws);
  ws.on('close', () => gamemanager.removeUser(ws)); // Updated from 'disconnect' to 'close'
});
