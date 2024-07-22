import React from "react";
import ReactDOM from "react-dom/client";
import { Routes, BrowserRouter, Route } from "react-router-dom";

import { Provider as ChakraProvider } from "./components/ui/provider";
import { StateProvider } from "./state";
/**
 * On home user can create a game, and join a game
 */
const Home = React.lazy(() => import("./routes/Home"));
/**
 * Game page has multiple states 'STARTED' | 'LOBBY' | 'END' | 'LOADING'
 */
const Game = React.lazy(() => import("./routes/Game"));

function App() {
  return (
    <React.StrictMode>
      <ChakraProvider>
        <StateProvider>
          <React.Suspense fallback="loading...">
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/join/:roomId" element={<Home />} />
                <Route path="/game/:roomId" element={<Game />} />
              </Routes>
            </BrowserRouter>
          </React.Suspense>
        </StateProvider>
      </ChakraProvider>
    </React.StrictMode>
  );
}

ReactDOM.createRoot(document.getElementById("app")!).render(<App />);
