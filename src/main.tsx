import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { Game } from './Game';

function main() {
    let game: Game | null = null;

    const startGame = () => {
        if (game) {
            // Cleanup if needed
        }
        game = new Game(2);
        game.start();
    };

    const rootElement = document.getElementById('root');
    if (rootElement) {
        const root = ReactDOM.createRoot(rootElement);
        root.render(
            <React.StrictMode>
                <App onStartGame={startGame} />
            </React.StrictMode>
        );
    }
}

main();
