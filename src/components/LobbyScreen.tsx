import React from 'react';

interface LobbyScreenProps {
    onStart: () => void;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({ onStart }) => {
    return (
        <div className="screen lobby-screen">
            <h2>Lobby</h2>
            <p>Waiting for players...</p>
            <button onClick={onStart}>Start Game</button>
        </div>
    );
};
