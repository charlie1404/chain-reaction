import { useEffect, useRef, useState } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";

import { Game as GameApp } from "../lib/Game";

type GameState = "STARTED" | "LOBBY" | "END" | "LOADING";

type GameRouteParams = {
  roomId: string;
};

function Game() {
  const webSocket = useRef<WebSocket | null>(null);
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<GameState | null>("STARTED");
  const { roomId } = useParams<GameRouteParams>();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!webSocket.current) {
      webSocket.current = new WebSocket("http://localhost:3344/api/v1/game/join");

      webSocket.current.onopen = () => {
        console.log("WebSocket connected");
        webSocket.current?.send(JSON.stringify({ roomId }));
      };
    }
  }, []);

  useEffect(() => {
    if (gameState === "STARTED") {
      // start-game
      new GameApp(2, "l", canvasRef.current).start();
      return;
    }
  }, [gameState]);

  if (gameState === "LOADING") {
    return <div>Loading...</div>;
  }

  if (gameState === "STARTED") {
    return <canvas ref={canvasRef} style={{ margin: "0 auto" }}></canvas>;
  }

  return null;
}

export default Game;
