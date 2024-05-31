
import WebSocket from "ws";
import { Game } from "./Game";

export class gameManager {
    private games: Game[];
    private pendingUser: WebSocket | null;
    private users: WebSocket[];

    constructor() {
        this.games = [];
        this.pendingUser = null;
        this.users = [];
    }

    addUser(socket: WebSocket) {
        this.users.push(socket);
        this.handler(socket);
    }

    removeUser(socket: WebSocket) {
        this.users = this.users.filter(user => user !== socket);

        // Handle the case where a pending user disconnects
        if (this.pendingUser === socket) {
            this.pendingUser = null;
        }

        // Handle the case where a player in a game disconnects
        this.games = this.games.filter(game => {
            if (game["player1"] === socket || game["player2"] === socket) {
                const opponent = game["player1"] === socket ? game["player2"] : game["player1"];
                opponent.send(JSON.stringify({
                    type: "end",
                    board: game.getBoard(),
                    currentPlayer: game.getCurrentPlayer(),
                    gameOver: true,
                    winner: "opponent disconnected"
                }));
                return false;
            }
            return true;
        });
    }

    private handler(socket: WebSocket) {
        socket.on('message', (data) => {
            const message = JSON.parse(data.toString());
            if (message.type === 'join') {
                if (this.pendingUser) {
                    const game = new Game(this.pendingUser, socket);
                    this.games.push(game);
                    this.pendingUser = null;
                } else {
                    this.pendingUser = socket;
                }
           }  else if (message.type === 'reset') {
            // Find the game the socket is part of and reset it
            const game = this.games.find(game => game["player1"] === socket || game["player2"] === socket);
            if (game) {
                game.resetGame();
            }
        }
        });

        socket.on('close', () => {
            this.removeUser(socket);
        });
    }
}
