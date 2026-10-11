import { useState, useEffect, useRef, useCallback } from 'react';
import { PlayerInfo, LobbySettings, GameStatus } from './types';
import { useAppState } from '../state';

interface UseGameSyncOptions {
  roomId: string;
  initialSettings?: LobbySettings;
}

export function useGameSync({ roomId, initialSettings }: UseGameSyncOptions) {
  const { user } = useAppState();

  const [settings, setSettings] = useState<LobbySettings>(
    initialSettings || {
      boardSize: 's',
      turnWaitSeconds: 60,
    },
  );

  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [gameStatus, setGameStatus] = useState<GameStatus>('waiting');
  const [activePlayerIndex, setActivePlayerIndex] = useState<number>(0);
  const [turnTimeRemaining, setTurnTimeRemaining] = useState<number>(settings.turnWaitSeconds);
  const [winner, setWinner] = useState<PlayerInfo | null>(null);

  const [isValidRoom, setIsValidRoom] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [backendIsHost, setBackendIsHost] = useState<boolean>(false);

  const timerRef = useRef<number | null>(null);

  // Sync lobby state from backend API
  const fetchLobby = useCallback(async () => {
    if (!roomId) return;

    try {
      const res = await fetch(`/api/v1/game/lobby?roomId=${encodeURIComponent(roomId)}`, {
        credentials: 'include',
      });

      if (res.status === 404) {
        setIsValidRoom(false);
        setErrorMessage('Game not found. Room does not exist or has expired.');
        setIsLoading(false);
        return;
      }

      if (res.status === 409) {
        setIsValidRoom(false);
        setErrorMessage('Lobby is full. Maximum player capacity reached.');
        setIsLoading(false);
        return;
      }

      if (!res.ok) {
        setIsValidRoom(false);
        setErrorMessage('Failed to connect to lobby.');
        setIsLoading(false);
        return;
      }

      const data = await res.json();
      if (data.valid) {
        setIsValidRoom(true);
        setErrorMessage(null);

        // Avoid re-rendering if players array hasn't changed
        if (Array.isArray(data.players)) {
          setPlayers((prev) => {
            if (JSON.stringify(prev) === JSON.stringify(data.players)) {
              return prev;
            }
            return data.players;
          });
        }

        if (data.settings) {
          setSettings((prev) => {
            if (
              prev.boardSize === data.settings.boardSize &&
              prev.turnWaitSeconds === data.settings.turnWaitSeconds
            ) {
              return prev;
            }
            return data.settings;
          });
        }

        if (typeof data.isHost === 'boolean') {
          setBackendIsHost((prev) => (prev === data.isHost ? prev : data.isHost));
        }

        if (data.status) {
          const st = String(data.status).toLowerCase();
          const nextStatus: GameStatus =
            st === 'playing' || st === 'started'
              ? 'playing'
              : st === 'finished' || st === 'game_over'
                ? 'finished'
                : 'waiting';

          setGameStatus((prev) => (prev === nextStatus ? prev : nextStatus));
        }

        if (data.winner) {
          setWinner((prev) => {
            if (prev?.id === data.winner.id) return prev;
            return data.winner;
          });
        } else if (data.status === 'waiting') {
          setWinner(null);
        }
      }
    } catch {
      // Network failure
    } finally {
      setIsLoading(false);
    }
  }, [roomId]);

  // Periodic heartbeat to keep player connected status active on backend
  useEffect(() => {
    if (!roomId) return;

    const sendHeartbeat = async () => {
      try {
        await fetch(`/api/v1/game/heartbeat?roomId=${encodeURIComponent(roomId)}`, {
          method: 'POST',
          credentials: 'include',
        });
      } catch {
        // ignore network error
      }
    };

    void sendHeartbeat();
    const heartbeatInterval = setInterval(sendHeartbeat, 2000);

    return () => clearInterval(heartbeatInterval);
  }, [roomId]);

  // Initial lobby sync and short-polling for real-time multiplayer updates across all states
  useEffect(() => {
    if (!roomId) return;

    // oxlint-disable-next-line react/set-state-in-effect
    void fetchLobby();

    const pollInterval = setInterval(() => {
      void fetchLobby();
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [roomId, fetchLobby]);


  // Turn timer countdown effect during gameplay (pure countdown without cascading setState calls)
  useEffect(() => {
    if (gameStatus !== 'playing' || settings.turnWaitSeconds === 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = window.setInterval(() => {
      setTurnTimeRemaining((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameStatus, settings.turnWaitSeconds]);

  // Reset turn timer to initial configured seconds
  const resetTurnTimer = useCallback(() => {
    setTurnTimeRemaining(settings.turnWaitSeconds);
  }, [settings.turnWaitSeconds]);

  // Update lobby settings on backend
  const updateSettings = useCallback(
    async (newSettings: LobbySettings) => {
      setSettings(newSettings);
      try {
        const res = await fetch('/api/v1/game/lobby/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            roomId,
            boardSize: newSettings.boardSize,
            turnWaitSeconds: newSettings.turnWaitSeconds,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.players) setPlayers(data.players);
          if (data.settings) setSettings(data.settings);
        }
      } catch (err) {
        console.error('Failed to update settings', err);
      }
    },
    [roomId],
  );

  // Start the game on backend
  const startGame = useCallback(async () => {
    setGameStatus('playing');
    setActivePlayerIndex(0);
    setTurnTimeRemaining(settings.turnWaitSeconds);

    try {
      await fetch('/api/v1/game/lobby/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ roomId }),
      });
    } catch (err) {
      console.error('Failed to start game', err);
    }
  }, [roomId, settings.turnWaitSeconds]);

  // Finish the game on backend and record winner
  const finishGame = useCallback(
    async (winnerId: string, winningPlayer?: PlayerInfo) => {
      setGameStatus('finished');
      if (winningPlayer) {
        setWinner(winningPlayer);
      }

      try {
        const res = await fetch('/api/v1/game/lobby/finish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ roomId, winnerId }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.winner) setWinner(data.winner);
        }
      } catch (err) {
        console.error('Failed to finish game', err);
      }
    },
    [roomId],
  );

  // Reset lobby back to waiting state (Rematch)
  const resetGame = useCallback(async () => {
    setGameStatus('waiting');
    setWinner(null);

    try {
      const res = await fetch('/api/v1/game/lobby/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ roomId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.players) setPlayers(data.players);
        setWinner(null);
        setGameStatus('waiting');
      }
    } catch (err) {
      console.error('Failed to reset game', err);
    }
  }, [roomId]);

  // Remove a player from lobby
  const removePlayer = useCallback(
    async (playerId: string) => {
      setPlayers((prev) => prev.filter((p) => p.id !== playerId));
      try {
        const res = await fetch('/api/v1/game/lobby/remove', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ roomId, playerId }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.players) setPlayers(data.players);
        }
      } catch (err) {
        console.error('Failed to remove player', err);
      }
    },
    [roomId],
  );

  const isHost = backendIsHost || (players.find((p) => p.id === user.id)?.isHost ?? false);
  const currentUser = players.find((p) => p.id === user.id) || null;
  const activePlayer = players[activePlayerIndex] ?? players[0];

  return {
    players,
    settings,
    gameStatus,
    activePlayerIndex,
    activePlayer,
    turnTimeRemaining,
    isHost,
    currentUser,
    isValidRoom,
    errorMessage,
    isLoading,
    winner,
    setGameStatus,
    setActivePlayerIndex,
    resetTurnTimer,
    updateSettings,
    startGame,
    finishGame,
    resetGame,
    removePlayer,
    fetchLobby,
  };
}
