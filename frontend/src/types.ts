// types.ts
export interface Game {
    board: string[];
    currentPlayer: string;
    gameOver: boolean;
    winner: string | null;
    player: string;
}

export interface MoveMessage {
    type: 'move';
    index:number;
    board: string[];
    currentPlayer: string;
}

export interface StartMessage {
    type: 'start';
    player: string;
    board: string[];
    currentPlayer: string;
    gameOver: boolean;
    winner: string | null;
}

export interface EndMessage {
    type: 'end';
    board: string[];
    currentPlayer: string;
    gameOver: boolean;
    winner: string | null;
}

export interface ResetMessage {
    type: 'reset';
    board: string[];
    currentPlayer: string;
    gameOver: boolean;
    winner: string | null;
}

export type MessageType = MoveMessage | StartMessage | EndMessage | ResetMessage;
