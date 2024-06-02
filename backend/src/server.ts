import { WebSocketServer } from 'ws';
import { gameManager } from './gameManager';
const port : any = process.env.PORT || 8000;
const wss = new WebSocketServer({ port });
const gamemanager = new gameManager();

wss.on('connection', function connection(ws) {
  ws.on('error', console.error);
  gamemanager.addUser(ws);
  ws.on('close', () => gamemanager.removeUser(ws)); 
});
