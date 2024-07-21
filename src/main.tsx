import React from 'react';
import ReactDOM from 'react-dom/client';
import { Routes, BrowserRouter, Route } from 'react-router-dom';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import type { ThemeConfig } from '@chakra-ui/react';

const theme: ThemeConfig = extendTheme({
  config: {},
  styles: {
    global: {
      body: {
        bg: 'black',
      },
    },
  },
});

const Home = React.lazy(() => import('./routes/Home'));
const Game = React.lazy(() => import('./routes/Game'));

function App() {
  return (
    <React.StrictMode>
      <ChakraProvider theme={theme}>
        <React.Suspense fallback="loading...">
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/create-game" element={<Home />} />
              <Route path="/room/:roomId" element={<Game />} />
            </Routes>
          </BrowserRouter>
        </React.Suspense>
      </ChakraProvider>
    </React.StrictMode>
  );
}

ReactDOM.createRoot(document.getElementById('app')!).render(<App />);
