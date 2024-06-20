import React, { useEffect, useState } from 'react';
import { useWebSocket } from './WebSocketContext';
import JoinGame from './components/JoinGame';
import './App.css';
import Board from './components/Board';

const App: React.FC = () => {
    const ws = useWebSocket();
    const [player, setPlayer] = useState<string>('');

    useEffect(() => {
        if (ws) {
            ws.onmessage = (event) => {
                const message = JSON.parse(event.data);

                if (message.type === 'start') {
                    const startMessage = message ;
                    setPlayer(startMessage.player);
                }
            };
        }
    }, [ws]);

    return (
        <div className="App">
            <h1 className='title-heading'>Tic Tac Toe</h1>
            {!player && <JoinGame />}
            {player && <Board ws={ws} player={player} />}
        </div>
    );
};

export default App;
