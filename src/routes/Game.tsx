import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Button, Flex, HStack, Heading, Text, VStack, Badge, Container, Spinner } from '@chakra-ui/react';
import { FaClock, FaArrowLeft, FaTrophy, FaRotateRight, FaHand } from 'react-icons/fa6';
import { Game as GameApp } from '../lib/Game';
import { Navbar } from '../components/Navbar';
import { Avatar } from '../components/Avatar';
import { useAppState } from '../state';
import { useGameSync } from '../lib/useGameSync';
import { PLAYER_COLORS, PlayerInfo } from '../lib/types';

export default function Game() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  if (!roomId) {
    navigate('/');
    return null;
  }

  const { user } = useAppState();
  const {
    players,
    settings,
    gameStatus,
    isValidRoom,
    activePlayerIndex,
    turnTimeRemaining,
    isLoading,
    finishGame,
    resetGame,
    setActivePlayerIndex,
    resetTurnTimer,
  } = useGameSync({
    roomId,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameAppRef = useRef<GameApp | null>(null);

  const finishGameRef = useRef(finishGame);
  useEffect(() => {
    finishGameRef.current = finishGame;
  }, [finishGame]);

  const resetTurnTimerRef = useRef(resetTurnTimer);
  useEffect(() => {
    resetTurnTimerRef.current = resetTurnTimer;
  }, [resetTurnTimer]);

  const playersRef = useRef(players);
  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  const currentTurnIndexRef = useRef(activePlayerIndex);
  useEffect(() => {
    currentTurnIndexRef.current = activePlayerIndex;
  }, [activePlayerIndex]);

  // Modal state when a user tries to place an atom out of turn
  const [showNotMyTurnModal, setShowNotMyTurnModal] = useState(false);

  useEffect(() => {
    if (!showNotMyTurnModal) return;
    const timer = setTimeout(() => {
      setShowNotMyTurnModal(false);
    }, 2800);
    return () => clearTimeout(timer);
  }, [showNotMyTurnModal]);

  // Access Gate: /game/:roomId should ONLY open if game is in "playing" state.
  // If in any other state ("waiting" or "finished"), redirect to /lobby/:roomId.
  useEffect(() => {
    if (isLoading) return;
    if (isValidRoom === false) {
      navigate('/', { replace: true });
      return;
    }
    if (gameStatus !== 'playing') {
      navigate(`/lobby/${roomId}`, { replace: true });
    }
  }, [isLoading, isValidRoom, gameStatus, roomId, navigate]);

  const [gameOverWinner, setGameOverWinner] = useState<PlayerInfo | null>(null);

  const hasLoadedPlayers = players.length > 0;

  // Initialize Three.js Game ONCE when canvas is ready and player list has loaded
  useEffect(() => {
    if (!canvasRef.current || !hasLoadedPlayers) return;

    if (gameAppRef.current) {
      gameAppRef.current.destroy();
      gameAppRef.current = null;
    }

    const playerCount = Math.min(Math.max(playersRef.current.length, 2), 8);
    const gridSize = settings.boardSize;

    const gameInstance = new GameApp(playerCount, gridSize, canvasRef.current, {
      playersInfo: playersRef.current.map((p) => ({ id: p.id, colorIndex: p.colorIndex })),
      onTurnChange: (playerIdx: number) => {
        currentTurnIndexRef.current = playerIdx;
        setActivePlayerIndex(playerIdx);
        if (resetTurnTimerRef.current) {
          resetTurnTimerRef.current();
        }
      },
      onGameOver: (winnerIndex: number) => {
        const winningPlayer = playersRef.current[winnerIndex] || playersRef.current[0];
        setGameOverWinner(winningPlayer);
        if (winningPlayer && finishGameRef.current) {
          void finishGameRef.current(winningPlayer.id, winningPlayer);
        }
      },
      // Rule 3: Checks if player is connected prior to giving them their turn
      isPlayerConnected: (playerIdx: number) => {
        const player = playersRef.current[playerIdx];
        return player ? player.isConnected : true;
      },
      // Multiplayer turn blocking: block atom placement if not local user's turn
      isMyTurn: () => {
        const turnIdx = currentTurnIndexRef.current;
        const turnPlayer = playersRef.current[turnIdx];
        return turnPlayer ? turnPlayer.id === user.id : false;
      },
      onNotMyTurn: () => {
        setShowNotMyTurnModal(true);
      },
    });

    gameInstance.start();
    gameAppRef.current = gameInstance;

    return () => {
      gameInstance.destroy();
      gameAppRef.current = null;
    };
  }, [roomId, settings.boardSize, hasLoadedPlayers, setActivePlayerIndex, user.id]);

  const hasTimer = settings.turnWaitSeconds > 0;

  // Rule 1: Normal turn wait with countdown timer. When timer reaches 0, auto-skip turn.
  useEffect(() => {
    if (turnTimeRemaining <= 0 && gameAppRef.current && hasTimer) {
      gameAppRef.current.skipTurn();
      if (resetTurnTimerRef.current) {
        resetTurnTimerRef.current();
      }
    }
  }, [turnTimeRemaining, hasTimer]);

  // Rule 2: If the active player disconnects in the middle of their turn, immediately jump to next user
  useEffect(() => {
    if (gameStatus !== 'playing') return;

    const hasAnyConnected = players.some((p) => p.isConnected);
    if (!hasAnyConnected) return;

    const activePlayer = players[activePlayerIndex];
    if (activePlayer && !activePlayer.isConnected && gameAppRef.current) {
      gameAppRef.current.skipTurn();
      if (resetTurnTimerRef.current) {
        resetTurnTimerRef.current();
      }
    }
  }, [players, activePlayerIndex, gameStatus]);

  // Loading State: wait for room/players to hydrate and ensure match is in "playing" status before mounting canvas
  if (isLoading || gameStatus !== 'playing') {
    return (
      <Box minH="100vh" bg="#030611" color="white" display="flex" flexDirection="column">
        <Navbar roomId={roomId} />
        <Container maxW="560px" py={20} flex={1} display="flex" alignItems="center" justifyContent="center">
          <VStack gap={4} textAlign="center">
            <Spinner size="xl" color="blue.solid" />
            <Heading size="lg" fontWeight="bold" color="white">
              Entering Match Arena...
            </Heading>
            <Text color="gray.400" fontSize="sm">
              Loading participants and verifying match status...
            </Text>
          </VStack>
        </Container>
      </Box>
    );
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const activePlayer = players[activePlayerIndex];
  const isMyTurn = activePlayer ? activePlayer.id === user.id : false;

  const timerPercent = hasTimer
    ? Math.max(0, Math.min(100, (turnTimeRemaining / settings.turnWaitSeconds) * 100))
    : 100;

  const isTimerCritical = hasTimer && turnTimeRemaining <= 10;
  const isTimerWarning = hasTimer && turnTimeRemaining <= settings.turnWaitSeconds / 2;

  const timerColor = isTimerCritical ? '#ef4444' : isTimerWarning ? '#eab308' : '#22c55e';

  return (
    <Box minH="100vh" bg="#030611" color="white" display="flex" flexDirection="column">
      <Navbar roomId={roomId} />

      {/* Top Game HUD Bar */}
      <Box
        bg="rgba(15, 23, 42, 0.85)"
        borderBottom="1px solid rgba(255, 255, 255, 0.08)"
        px={{ base: 4, md: 8 }}
        py={1.5}
        backdropFilter="blur(16px)"
        zIndex={10}
      >
        <Flex justify="space-between" align="center" maxW="1400px" mx="auto" gap={3}>
          {/* Back to Lobby Button */}
          <Button
            size="sm"
            variant="ghost"
            color="gray.400"
            onClick={() => navigate(`/lobby/${roomId}`)}
            _hover={{ color: 'white', bg: 'rgba(255, 255, 255, 0.08)' }}
          >
            <FaArrowLeft /> Lobby
          </Button>

          {/* Turn Wait Timer (if enabled) */}
          {hasTimer ? (
            <HStack
              gap={2}
              bg="#090d16"
              px={3}
              py={1}
              borderRadius="full"
              border={`1px solid ${isTimerCritical ? '#ef4444' : 'rgba(255, 255, 255, 0.15)'}`}
              boxShadow={isTimerCritical ? '0 0 14px rgba(239, 68, 68, 0.5)' : 'none'}
            >
              <FaClock color={timerColor} size={13} />
              <Text fontSize="xs" fontWeight="bold" fontFamily="mono" color={timerColor}>
                {formatTime(turnTimeRemaining)}
              </Text>
              <Box w="36px" h="4px" bg="rgba(255, 255, 255, 0.1)" borderRadius="full" overflow="hidden">
                <Box w={`${timerPercent}%`} h="100%" bg={timerColor} transition="width 1s linear" />
              </Box>
            </HStack>
          ) : (
            <Text fontSize="2xs" color="gray.500" fontFamily="mono">
              No Timer
            </Text>
          )}
        </Flex>
      </Box>

      {/* Main Game Arena: 3D Canvas + Connected Players Sidebar */}
      <Flex
        flex={1}
        direction={{ base: 'column', lg: 'row' }}
        maxW="1400px"
        w="100%"
        mx="auto"
        p={{ base: 2, md: 4 }}
        gap={4}
        align="stretch"
      >
        {/* Canvas Center Area */}
        <Box
          flex={1}
          display="flex"
          alignItems="center"
          justifyContent="center"
          bg="#050814"
          borderRadius="2xl"
          border="1px solid rgba(255, 255, 255, 0.08)"
          p={2}
          position="relative"
          overflow="hidden"
          minH={{ base: '450px', lg: 'auto' }}
        >
          <canvas
            ref={canvasRef}
            style={{
              display: 'block',
              margin: '0 auto',
              maxWidth: '100%',
              maxHeight: '100%',
              borderRadius: '12px',
              boxShadow: '0 0 40px rgba(0,0,0,0.8)',
              cursor: isMyTurn ? 'pointer' : 'not-allowed',
            }}
          />

          {/* Quick Controls floating overlay */}
          <HStack
            position="absolute"
            bottom={4}
            left={4}
            bg="rgba(15, 23, 42, 0.85)"
            px={3}
            py={1.5}
            borderRadius="full"
            border={`1px solid ${isMyTurn ? 'rgba(34, 197, 94, 0.35)' : 'rgba(255, 255, 255, 0.1)'}`}
            backdropFilter="blur(8px)"
            display={{ base: 'none', sm: 'flex' }}
            gap={2}
          >
            <Badge
              bg={isMyTurn ? '#22c55e' : 'rgba(255, 255, 255, 0.1)'}
              color={isMyTurn ? 'black' : 'gray.300'}
              fontWeight="black"
              fontSize="2xs"
              borderRadius="full"
              px={2}
            >
              {isMyTurn ? 'YOUR TURN' : 'OPPONENT TURN'}
            </Badge>
            <Text fontSize="2xs" color={isMyTurn ? 'green.300' : 'gray.400'}>
              {isMyTurn ? 'Click cell to drop atom' : `Waiting for ${activePlayer?.name || 'opponent'}...`}
            </Text>
            <Text fontSize="2xs" color="gray.600">
              •
            </Text>
            <Text fontSize="2xs" color="gray.500">
              {settings.boardSize === 's' ? '6 × 10' : '10 × 18'}
            </Text>
          </HStack>
        </Box>

        {/* Right Sidebar: Connected Users List */}
        <Box
          w={{ base: '100%', lg: '340px' }}
          bg="rgba(15, 23, 42, 0.75)"
          borderRadius="2xl"
          border="1px solid rgba(255, 255, 255, 0.1)"
          p={4}
          backdropFilter="blur(16px)"
          display="flex"
          flexDirection="column"
          maxH={{ lg: 'calc(100vh - 140px)' }}
          overflowY="auto"
        >
          <Flex justify="space-between" align="center" mb={3} pb={2} borderBottom="1px solid rgba(255, 255, 255, 0.08)">
            <Box>
              <Heading size="xs" textTransform="uppercase" letterSpacing="wider" color="gray.300">
                Connected Players
              </Heading>
              <Text fontSize="2xs" color="gray.500">
                Turn order & live connection
              </Text>
            </Box>
            <Badge colorPalette="blue" variant="solid" fontSize="2xs" borderRadius="full">
              {players.filter((p) => p.isConnected).length} / {players.length} Online
            </Badge>
          </Flex>

          <VStack gap={2.5} align="stretch" flex={1}>
            {players.map((player, idx) => {
              const colorDef = PLAYER_COLORS[player.colorIndex % PLAYER_COLORS.length];
              const isCurrentTurn = idx === activePlayerIndex;
              const isDisconnected = !player.isConnected;

              return (
                <Box
                  key={player.id}
                  p={3}
                  borderRadius="xl"
                  bg={isDisconnected ? 'rgba(239, 68, 68, 0.08)' : isCurrentTurn ? colorDef.bgRgba : '#090d16'}
                  border={
                    isDisconnected
                      ? '2px solid #ef4444'
                      : isCurrentTurn
                        ? `2px solid ${colorDef.hex}`
                        : '1px solid rgba(255, 255, 255, 0.06)'
                  }
                  boxShadow={isCurrentTurn ? `0 0 16px ${colorDef.bgRgba}` : 'none'}
                  opacity={isCurrentTurn ? 1 : 0.45}
                  transform={isCurrentTurn ? 'scale(1.02)' : 'none'}
                  transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
                  position="relative"
                >
                  <Flex justify="space-between" align="center">
                    <HStack gap={3}>
                      <Avatar
                        id={player.avatar}
                        size={36}
                        borderColor={isCurrentTurn ? colorDef.hex : 'transparent'}
                        showGlow={isCurrentTurn}
                      />
                      <Box>
                        <HStack gap={1.5}>
                          <Text
                            fontWeight={isCurrentTurn ? 'extrabold' : 'semibold'}
                            fontSize="sm"
                            color={isCurrentTurn ? 'white' : 'gray.300'}
                            lineClamp={1}
                          >
                            {player.name}
                          </Text>
                          {player.isHost && (
                            <Badge bg="yellow.500" color="black" fontSize="2xs" px={1} py={0} borderRadius="xs">
                              H
                            </Badge>
                          )}
                          {player.id === user.id && (
                            <Badge bg="blue.600" color="white" fontSize="2xs" px={1} py={0} borderRadius="xs">
                              YOU
                            </Badge>
                          )}
                        </HStack>

                        <HStack gap={1.5} mt={0.5}>
                          <Box w="6px" h="6px" borderRadius="full" bg={colorDef.hex} />
                          <Text fontSize="2xs" color="gray.400" fontWeight="medium">
                            {colorDef.name}
                          </Text>
                        </HStack>
                      </Box>
                    </HStack>

                    <HStack gap={1.5}>
                      <Box
                        w="7px"
                        h="7px"
                        borderRadius="full"
                        bg={player.isConnected ? '#22c55e' : '#ef4444'}
                        boxShadow={player.isConnected ? '0 0 6px #22c55e' : '0 0 6px #ef4444'}
                      />
                      <Text fontSize="2xs" color={player.isConnected ? 'gray.400' : 'red.400'}>
                        {player.isConnected ? 'Live' : 'Off'}
                      </Text>
                    </HStack>
                  </Flex>
                </Box>
              );
            })}
          </VStack>
        </Box>
      </Flex>

      {/* Game Over Victory Modal */}
      {gameOverWinner && (
        <Box
          position="fixed"
          inset={0}
          bg="rgba(0, 0, 0, 0.85)"
          backdropFilter="blur(10px)"
          display="flex"
          alignItems="center"
          justifyContent="center"
          zIndex={100}
          p={4}
        >
          <Box
            bg="#0f172a"
            border="2px solid #eab308"
            borderRadius="2xl"
            p={8}
            maxW="420px"
            w="100%"
            textAlign="center"
            boxShadow="0 0 50px rgba(234, 179, 8, 0.4)"
          >
            <Box
              w="60px"
              h="60px"
              borderRadius="full"
              bg="rgba(234, 179, 8, 0.2)"
              display="flex"
              alignItems="center"
              justifyContent="center"
              mx="auto"
              mb={4}
              color="yellow.400"
            >
              <FaTrophy size={32} />
            </Box>

            <Heading size="xl" color="white" fontWeight="black" mb={2}>
              VICTORY!
            </Heading>
            <Text fontSize="sm" color="gray.400" mb={6}>
              All opponent atoms have been eliminated!
            </Text>

            <Box bg="#1e293b" p={4} borderRadius="xl" border="1px solid rgba(255, 255, 255, 0.1)" mb={6}>
              <Avatar id={gameOverWinner.avatar} size={72} borderColor="#eab308" showGlow />
              <Text fontWeight="extrabold" fontSize="lg" color="white" mt={2}>
                {gameOverWinner.name}
              </Text>
              <Text fontSize="xs" color="yellow.400" fontWeight="bold">
                WINNER
              </Text>
            </Box>

            <HStack gap={3}>
              <Button
                flex={1}
                variant="outline"
                borderColor="rgba(255, 255, 255, 0.2)"
                color="white"
                borderRadius="xl"
                onClick={() => navigate(`/lobby/${roomId}`)}
              >
                View Lobby Results
              </Button>
              <Button
                flex={1}
                bg="#22c55e"
                color="black"
                fontWeight="bold"
                borderRadius="xl"
                onClick={async () => {
                  setGameOverWinner(null);
                  await resetGame();
                  navigate(`/lobby/${roomId}`);
                }}
              >
                <FaRotateRight /> Play Again
              </Button>
            </HStack>
          </Box>
        </Box>
      )}

      {/* Not Your Turn - Small Error Modal */}
      {showNotMyTurnModal && (
        <Box
          position="fixed"
          inset={0}
          bg="rgba(0, 0, 0, 0.7)"
          backdropFilter="blur(8px)"
          display="flex"
          alignItems="center"
          justifyContent="center"
          zIndex={95}
          p={4}
          onClick={() => setShowNotMyTurnModal(false)}
        >
          <Box
            bg="#0f172a"
            border="1px solid rgba(239, 68, 68, 0.45)"
            borderRadius="2xl"
            p={6}
            maxW="340px"
            w="100%"
            textAlign="center"
            boxShadow="0 20px 40px rgba(0, 0, 0, 0.85), 0 0 30px rgba(239, 68, 68, 0.25)"
            onClick={(e) => e.stopPropagation()}
          >
            <Box
              w="48px"
              h="48px"
              borderRadius="full"
              bg="rgba(239, 68, 68, 0.15)"
              border="1px solid rgba(239, 68, 68, 0.35)"
              display="flex"
              alignItems="center"
              justifyContent="center"
              mx="auto"
              mb={3}
              color="red.400"
            >
              <FaHand size={22} />
            </Box>

            <Heading size="md" color="white" fontWeight="black" mb={1.5}>
              It's Not Your Turn!
            </Heading>
            <Text fontSize="xs" color="gray.300" mb={4} lineHeight="tall">
              Please wait for your turn before placing an atom. It is currently{' '}
              <Text as="span" fontWeight="bold" color="cyan.400">
                {activePlayer?.name || 'opponent'}
              </Text>
              's turn.
            </Text>

            <Button
              w="100%"
              size="sm"
              bg="rgba(255, 255, 255, 0.1)"
              color="white"
              borderRadius="xl"
              _hover={{ bg: 'rgba(255, 255, 255, 0.18)' }}
              onClick={() => setShowNotMyTurnModal(false)}
            >
              Got it
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}
