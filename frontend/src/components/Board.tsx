import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Game,
  MessageType,
  MoveMessage,
  StartMessage,
  EndMessage,
  ResetMessage,
} from "../types";
import ReconnectingWebSocket from "reconnecting-websocket";
import './Board.css'


interface BoardProps {
  ws: ReconnectingWebSocket | null;
  player: string;
}

const Board: React.FC<BoardProps> = ({ ws, player }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const pc = new RTCPeerConnection();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [game, setGame] = useState<Game>({
    board: ["", "", "", "", "", "", "", "", ""],
    currentPlayer: "X",
    gameOver: false,
    winner: null,
    player,
  });
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (ws) {
      ws.onmessage = (event) => {
        const message: MessageType = JSON.parse(event.data);

        if (message.type === "move") {
          const moveMessage = message as MoveMessage;
          setGame((prevGame) => ({
            ...prevGame,
            board: moveMessage.board,
            currentPlayer: moveMessage.currentPlayer,
          }));
        } else if (message.type === "end") {
          const endMessage = message as EndMessage;
          setGame((prevGame) => ({
            ...prevGame,
            board: endMessage.board,
            currentPlayer: endMessage.currentPlayer,
            gameOver: endMessage.gameOver,
            winner: endMessage.winner,
          }));
        } else if (message.type === "start") {
          const startMessage = message as StartMessage;
          setGame({
            board: startMessage.board,
            currentPlayer: startMessage.currentPlayer,
            gameOver: startMessage.gameOver,
            winner: startMessage.winner,
            player: startMessage.player,
          });
        } else if (message.type === "reset") {
          const resetMessage = message as ResetMessage;
          setGame({
            board: resetMessage.board,
            currentPlayer: resetMessage.currentPlayer,
            gameOver: resetMessage.gameOver,
            winner: resetMessage.winner,
            player: game.player,
          });
        } else if (message.type === "webrtc") {
          handleWebRTCSignaling(message);
        }
      };
    }
  }, [ws, game.player]);

  const startCall = async () => {
    try {
      setPeerConnection(pc);

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          ws!.send(JSON.stringify({
            type: "webrtc",
            candidate: event.candidate
          }));
        }
      };

      pc.onnegotiationneeded = async () => {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          console.log('Sending SDP offer:', offer);
          ws?.send(JSON.stringify({
            type: "webrtc",
            sdp: pc.localDescription
          }));
        } catch (error) {
          console.error('Error during negotiation:', error);
        }
      };
  
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio:true });
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });
        const video = document.createElement('video');
        video.srcObject = stream;
        video.play();
        
      } catch (error) {
        console.error('Error accessing media devices:', error);
      }
     
    } catch (error) {
      console.error("Error starting call:", error);
    }
    
  };

  const startReceiving = async () => {
    try {
      
    console.log('tring to receive audio');
    
    
      pc.ontrack = (event) => {
        console.log('Track received:', event.track);
        if (videoRef.current) {
          if (!videoRef.current.srcObject) {
            videoRef.current.srcObject = new MediaStream();
          }
          const stream = videoRef.current.srcObject as MediaStream;
          stream.addTrack(event.track);
          videoRef.current.play().catch(e => console.error('Error playing video:', e));
        }
      };
  
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('Sending ICE candidate:', event.candidate);
          ws!.send(JSON.stringify({
            type: 'iceCandidate',
            candidate: event.candidate
          }));
        }
      };
  
      ws!.onmessage = async (event : any) => {
        const message = JSON.parse(event.data);
        console.log('Message received:', message);
  
        if (message.type === 'offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(message.sdp));
          console.log('SDP offer set:', message.sdp);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          console.log('Sending SDP answer:', answer);
          ws?.send(JSON.stringify({
            type: 'answer',
            sdp: pc.localDescription
          }));
        } else if (message.type === 'iceCandidate') {
          await pc.addIceCandidate(new RTCIceCandidate(message.candidate));
          console.log('ICE candidate added:', message.candidate);
        } else if (message.type === 'answer') {
          await pc.setRemoteDescription(new RTCSessionDescription(message.sdp));
          console.log('SDP answer set:', message.sdp);
        }
      };
  
      pc.oniceconnectionstatechange = () => {
        console.log('ICE connection state change:', pc.iceConnectionState);
      };
  
      // Notify server that we are ready to receive calls
      ws?.send(JSON.stringify({ type: 'readyToReceive' }));
  
    } catch (error) {
      console.error('Error starting receiving:', error);
    }
  };
  

  const handleWebRTCSignaling = async (message: any) => {
    if (peerConnection) {
      try {
        if (message.sdp) {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(message.sdp));
          if (message.sdp.type === "offer") {
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            if (ws) {
              ws.send(JSON.stringify({
                type: "webrtc",
                sdp: peerConnection.localDescription
              }));
            }
          }
        } else if (message.candidate) {
          await peerConnection.addIceCandidate(new RTCIceCandidate(message.candidate));
        }
      } catch (error) {
        console.error("Error handling WebRTC signaling message:", error);
      }
    }
  };

  const handleCellClick = useCallback(
    (index: number) => {
      if (!game.gameOver && game.board[index] === "" && ws) {
        const moveMessage: MoveMessage = {
          type: "move",
          index,
          board: game.board,
          currentPlayer: game.currentPlayer,
        };
        ws.send(JSON.stringify(moveMessage));
      }
    },
    [game, ws]
  );




  const handleReset = useCallback(() => {
    setIsModalOpen(false);
    if (ws) {
      const resetMessage: ResetMessage = {
        type: "reset",
        board: ["", "", "", "", "", "", "", "", ""],
        currentPlayer: "X",
        gameOver: false,
        winner: null,
      };
      ws.send(JSON.stringify(resetMessage));

      setGame({
        board: ["", "", "", "", "", "", "", "", ""],
        currentPlayer: "X",
        gameOver: false,
        winner: null,
        player: game.player,
      });
    }
  }, [game.player, ws]);

  useEffect(() => {
    if (game.gameOver) {
      setIsModalOpen(true);
    }
  }, [game.gameOver]);

  useEffect(() => {
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (peerConnection) {
        peerConnection.close();
      }
    };
  }, [localStream, peerConnection]);

  const handlecalls = () =>{
    startCall();
    startReceiving();
  }

  return (
    <>
      <div>
        <button className="button" onClick={handlecalls}>Call</button> 
        <video ref={videoRef} autoPlay controls />
        <h2 className="player-title">Player: {game.player}</h2>
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

      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h2>Game Over</h2>
            {game.winner !== "draw" ? (
              <p>Winner: {game.winner}</p>
            ) : (
              <p>It's a draw!</p>
            )}
            <button className="reset-button" onClick={handleReset}>
              Reset
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Board;
