// App.tsx
import React, { useEffect, useState } from 'react';
import { useWebSocket } from './WebSocketContext';
import JoinGame from './components/JoinGame';
import { Game, MessageType, MoveMessage, StartMessage, EndMessage, ResetMessage } from './types';
import './App.css';

const App: React.FC = () => {
    const ws = useWebSocket();
    const [game, setGame] = useState<Game>({
        board: ["", "", "", "", "", "", "", "", ""],
        currentPlayer: 'X',
        gameOver: false,
        winner: null,
        player: ''
    });

    useEffect(() => {
        if (ws) {
            ws.onmessage = (event) => {
                const message: MessageType = JSON.parse(event.data);

                if (message.type === 'move') {
                    const moveMessage = message as MoveMessage;
                    setGame((prevGame) => ({
                        ...prevGame,
                        board: moveMessage.board,
                        currentPlayer: moveMessage.currentPlayer,
                    }));
                } else if (message.type === 'end') {
                    const endMessage = message as EndMessage;
                    setGame((prevGame) => ({
                        ...prevGame,
                        board: endMessage.board,
                        currentPlayer: endMessage.currentPlayer,
                        gameOver: endMessage.gameOver,
                        winner: endMessage.winner
                    }));
                } else if (message.type === 'start') {
                    const startMessage = message as StartMessage;
                    setGame({
                        board: startMessage.board,
                        currentPlayer: startMessage.currentPlayer,
                        gameOver: startMessage.gameOver,
                        winner: startMessage.winner,
                        player: startMessage.player
                    });
                } else if (message.type === 'reset') {
                    const resetMessage = message as ResetMessage;
                    setGame({
                        board: resetMessage.board,
                        currentPlayer: resetMessage.currentPlayer,
                        gameOver: resetMessage.gameOver,
                        winner: resetMessage.winner,
                        player: ''
                    });
                }
            };
        }
    }, [ws]);

    const handleCellClick = (index: number) => {
        if (!game.gameOver && game.board[index] === '' && ws) {
            const moveMessage: MoveMessage = { type: 'move', index, board: game.board, currentPlayer: game.currentPlayer };
            ws.send(JSON.stringify(moveMessage));
        }
    };

    const handleReset = () => {
        if (ws) {
            const resetMessage: ResetMessage = { 
                type: 'reset', 
                board: ["", "", "", "", "", "", "", "", ""], 
                currentPlayer: 'X', 
                gameOver: false, 
                winner: null 
            };
            ws.send(JSON.stringify(resetMessage));
    
            // Reset the game state on the frontend as well
            setGame({
                board: ["", "", "", "", "", "", "", "", ""],
                currentPlayer: 'X',
                gameOver: false,
                winner: null,
                player: game.player // Keep the player the same
            });
        }
    };

    return (
        <div className="App">
            <h1 className='title-heading'>Tic Tac Toe</h1>
            {!game.player && <JoinGame />}
            {game.player && (
                <div>
                    <h2 className='player-title'>Player: {game.player}</h2>
                    {game.gameOver && (
                        <div>
                            <h2>Game Over</h2>
                            {game.winner !== 'draw' ? <p>Winner: {game.winner}</p> : <p>It's a draw!</p>}
                            <button onClick={handleReset}>Reset</button>
                        </div>
                    )}
                    <div className="board">
                        {game.board.map((cell, index) => (
                            <div
                                key={index}
                                className="cell"
                                onClick={() => handleCellClick(index)}
                            >
                                {cell}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;
