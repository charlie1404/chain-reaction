import React from 'react';

interface WelcomeScreenProps {
    onCreate: () => void;
    onJoin: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onCreate, onJoin }) => {
    return (
        <div className="screen welcome-screen">
            <h1>Chain Reaction</h1>
            <div className="button-group">
                <button onClick={onCreate}>Create Game</button>
                <button onClick={onJoin}>Join Game</button>
            </div>
        </div>
    );
};
