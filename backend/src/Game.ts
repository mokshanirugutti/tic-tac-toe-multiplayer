// game.ts
import WebSocket from "ws";

export class Game {
    private player1: WebSocket;
    private player2: WebSocket;
    private board: string[];
    private currentPlayer: WebSocket;
    private gameOver: boolean;

    constructor(player1: WebSocket, player2: WebSocket) {
        this.player1 = player1;
        this.player2 = player2;
        this.board = ["", "", "", "", "", "", "", "", ""];
        this.currentPlayer = player1; // Player 1 starts
        this.gameOver = false;

        // Notify players that the game has started
        this.sendMessage(this.player1, { type: "start", player: "X", board: this.board, currentPlayer: "X", gameOver: false, winner: null });
        this.sendMessage(this.player2, { type: "start", player: "O", board: this.board, currentPlayer: "X", gameOver: false, winner: null });

        // Handle incoming messages
        this.player1.on('message', (message) => this.handleMessage(this.player1, message));
        this.player2.on('message', (message) => this.handleMessage(this.player2, message));
    }

    private sendMessage(player: WebSocket, message: any) {
        player.send(JSON.stringify(message));
    }

    private handleMessage(player: WebSocket, data: WebSocket.Data) {
        const message = JSON.parse(data.toString());
        if (message.type === 'move') {
            this.handleMove(player, message.index);
        }
    }

    private handleMove(player: WebSocket, index: number) {
        if (this.board[index] !== "" || player !== this.currentPlayer || this.gameOver) {
            return; // Invalid move
        }

        const symbol = player === this.player1 ? "X" : "O";
        this.board[index] = symbol;
        this.currentPlayer = player === this.player1 ? this.player2 : this.player1;

        // Notify players of the move
        this.sendMessage(this.player1, { type: "move", board: this.board, currentPlayer: this.currentPlayer === this.player1 ? "X" : "O", gameOver: this.gameOver, winner: null });
        this.sendMessage(this.player2, { type: "move", board: this.board, currentPlayer: this.currentPlayer === this.player1 ? "X" : "O", gameOver: this.gameOver, winner: null });

        const winner = this.checkWinner();
        if (winner) {
            this.gameOver = true;
            this.sendMessage(this.player1, { type: "end", board: this.board, currentPlayer: this.currentPlayer === this.player1 ? "X" : "O", gameOver: this.gameOver, winner });
            this.sendMessage(this.player2, { type: "end", board: this.board, currentPlayer: this.currentPlayer === this.player1 ? "X" : "O", gameOver: this.gameOver, winner });
            this.resetGame();
        } else if (this.board.every(cell => cell !== "")) {
            this.gameOver = true;
            this.sendMessage(this.player1, { type: "end", board: this.board, currentPlayer: this.currentPlayer === this.player1 ? "X" : "O", gameOver: this.gameOver, winner: "draw" });
            this.sendMessage(this.player2, { type: "end", board: this.board, currentPlayer: this.currentPlayer === this.player1 ? "X" : "O", gameOver: this.gameOver, winner: "draw" });
            this.resetGame();
        }
    }
    public getBoard(): string[] {
        return this.board;
    }
    public getCurrentPlayer(): WebSocket{
        return this.currentPlayer;
    }
    private checkWinner(): string | null {
        const winningCombinations = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6] // Diagonals
        ];

        for (const combination of winningCombinations) {
            const [a, b, c] = combination;
            if (this.board[a] && this.board[a] === this.board[b] && this.board[a] === this.board[c]) {
                return this.board[a];
            }
        }

        return null;
    }

    public resetGame() {
        this.board = ["", "", "", "", "", "", "", "", ""];
        this.currentPlayer = this.player1; // Assuming player1 always starts
        this.gameOver = false;
    
        // Notify both players that the game has been reset
        const resetMessage = {
            type: 'reset',
            board: this.board,
            currentPlayer: 'X', // Assuming player1 is always 'X'
            gameOver: this.gameOver,
            winner: null
        };
        this.sendMessage(this.player1, resetMessage);
        this.sendMessage(this.player2, resetMessage);
    }
}
