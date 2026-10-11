import React from 'react';
import ReactDOM from 'react-dom/client';
import { Routes, BrowserRouter, Route, Navigate } from 'react-router-dom';

import { Provider as ChakraProvider } from './components/ui/provider';
import { StateProvider } from './state';
import { ProfileDialog } from './components/ProfileDialog';
import { Toaster } from './components/ui/toaster';

const Home = React.lazy(() => import('./routes/Home'));
const Lobby = React.lazy(() => import('./routes/Lobby'));
const Game = React.lazy(() => import('./routes/Game'));

function App() {
  return (
    <React.StrictMode>
      <ChakraProvider>
        <StateProvider>
          <ProfileDialog />
          <Toaster />
          <React.Suspense
            fallback={
              <div
                style={{
                  minHeight: '100vh',
                  background: '#030611',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'system-ui, sans-serif',
                }}
              >
                Loading Chain Reaction...
              </div>
            }
          >
            <BrowserRouter>
              <Routes>
                {/* 1. Home page: Where people create games */}
                <Route path="/" element={<Home />} />

                {/* 2. Lobby page / join game page: waiting room, settings, admin controls */}
                <Route path="/lobby/:roomId" element={<Lobby />} />

                {/* 3. Game page: board, timer, connected players with disconnect highlights */}
                <Route path="/game/:roomId" element={<Game />} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </React.Suspense>
        </StateProvider>
      </ChakraProvider>
    </React.StrictMode>
  );
}

ReactDOM.createRoot(document.getElementById('app')!).render(<App />);
