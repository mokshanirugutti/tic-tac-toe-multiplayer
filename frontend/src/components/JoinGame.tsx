import React from 'react';
import { useWebSocket } from '../WebSocketContext';
import './JoinGame.css'

const JoinGame: React.FC = () => {
    const ws = useWebSocket();

    const joinGame = () => {
        if (ws) {
            ws.send(JSON.stringify({ type: 'join' }));
            alert('wait for another player');
        }
    };

    return (
        <div>
            <button onClick={joinGame} className="button">Join Game</button>
        </div>
    );
};

export default JoinGame
