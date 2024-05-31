import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import ReconnectingWebSocket from 'reconnecting-websocket';

const WebSocketContext = createContext<ReconnectingWebSocket | null>(null);

export const useWebSocket = () => {
    return useContext(WebSocketContext);
};

export const WebSocketProvider: React.FC<{ url: string, children : React.ReactNode }> = ({ url, children }) => {
    const wsRef = useRef<ReconnectingWebSocket | null>(null);
    const [ws, setWs] = useState<ReconnectingWebSocket | null>(null);

    useEffect(() => {
        wsRef.current = new ReconnectingWebSocket(url);
        setWs(wsRef.current);

        return () => {
            wsRef.current?.close();
        };
    }, [url]);

    return (
        <WebSocketContext.Provider value={ws}>
            {children}
        </WebSocketContext.Provider>
    );
};
