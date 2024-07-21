import { useEffect, useRef } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';

import { Game as GameApp } from '../lib/Game';

type GameRouteParams = {
  roomId: string;
};

function Game() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { roomId } = useParams<GameRouteParams>();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!state) {
      navigate('/', { replace: true, state: { roomId } });
      return;
    }

    // start-game
    new GameApp(state.count, state.boardSize, canvasRef.current).start();
  }, []);

  if (!state) {
    return null;
  }

  return <canvas ref={canvasRef} style={{ margin: '0 auto' }}></canvas>;
}

export default Game;
