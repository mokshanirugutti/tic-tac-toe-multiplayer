import React from 'react';
import { useWebSocket } from '../WebSocketContext';

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
            <button onClick={joinGame}>Join Game</button>
        </div>
    );
};

export default JoinGame
