import React, { useState } from 'react';
import { WelcomeScreen } from './components/WelcomeScreen';
import { LobbyScreen } from './components/LobbyScreen';

interface AppProps {
    onStartGame: () => void;
}

export const App: React.FC<AppProps> = ({ onStartGame }) => {
    const [screen, setScreen] = useState<'welcome' | 'lobby' | 'game'>('welcome');

    const handleCreateGame = () => {
        setScreen('lobby');
    };

    const handleJoinGame = () => {
        setScreen('lobby');
    };

    const handleStartGame = () => {
        setScreen('game');
        onStartGame();
    };

    if (screen === 'game') {
        return null; // Or return a game overlay if needed
    }

    return (
        <div id="ui-container">
            {screen === 'welcome' && (
                <WelcomeScreen onCreate={handleCreateGame} onJoin={handleJoinGame} />
            )}
            {screen === 'lobby' && (
                <LobbyScreen onStart={handleStartGame} />
            )}
        </div>
    );
};
