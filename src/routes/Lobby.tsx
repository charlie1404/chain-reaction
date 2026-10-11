import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Flex,
  Grid,
  Heading,
  HStack,
  IconButton,
  Spinner,
  Text,
  Badge,
  VStack,
} from '@chakra-ui/react';
import {
  FaPlay,
  FaGear,
  FaCopy,
  FaCheck,
  FaCrown,
  FaArrowLeft,
  FaClock,
  FaChessBoard,
  FaCircleExclamation,
  FaUser,
  FaTrophy,
  FaRotateRight,
  FaDice,
} from 'react-icons/fa6';
import { Navbar } from '../components/Navbar';
import { Avatar } from '../components/Avatar';
import { LobbySettingsDialog } from '../components/LobbySettingsDialog';
import { useGameSync } from '../lib/useGameSync';
import { PLAYER_COLORS } from '../lib/types';

export default function Lobby() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  // If no room ID exists, redirect to create / home page
  if (!roomId) {
    navigate('/');
    return null;
  }

  const {
    players,
    settings,
    isHost,
    currentUser,
    isValidRoom,
    errorMessage,
    isLoading,
    gameStatus,
    winner,
    updateSettings,
    startGame,
    resetGame,
    removePlayer,
  } = useGameSync({ roomId });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Playing state: redirect directly to game page
  useEffect(() => {
    if (gameStatus === 'playing') {
      navigate(`/game/${roomId}`);
    }
  }, [gameStatus, roomId, navigate]);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/lobby/${roomId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartGame = async () => {
    await startGame();
    navigate(`/game/${roomId}`);
  };

  // Error State: Room Not Found or Lobby Full
  if (isValidRoom === false) {
    return (
      <Box minH="100vh" bg="#050814" color="white" display="flex" flexDirection="column">
        <Navbar />
        <Container maxW="560px" py={16} px={4} flex={1} display="flex" alignItems="center" justifyContent="center">
          <Box
            w="100%"
            bg="rgba(15, 23, 42, 0.9)"
            border="1px solid rgba(239, 68, 68, 0.35)"
            borderRadius="2xl"
            p={8}
            textAlign="center"
            boxShadow="0 20px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(239, 68, 68, 0.15)"
            backdropFilter="blur(16px)"
          >
            <Box color="red.400" mb={4} display="flex" justifyContent="center">
              <FaCircleExclamation size={48} />
            </Box>
            <Heading size="xl" fontWeight="black" color="white" mb={2}>
              Unable to Join Lobby
            </Heading>
            <Text color="gray.300" fontSize="md" mb={6}>
              {errorMessage || 'This game lobby either does not exist, has expired, or is currently full.'}
            </Text>
            <Button
              size="lg"
              bg="#2563eb"
              color="white"
              fontWeight="bold"
              borderRadius="xl"
              px={8}
              onClick={() => navigate('/')}
              _hover={{ bg: '#1d4ed8' }}
            >
              <FaArrowLeft /> Return to Home
            </Button>
          </Box>
        </Container>
      </Box>
    );
  }

  // Initial Loading State
  if (isLoading && players.length === 0) {
    return (
      <Box minH="100vh" bg="#050814" color="white" display="flex" flexDirection="column">
        <Navbar roomId={roomId} />
        <Container maxW="560px" py={20} flex={1} display="flex" alignItems="center" justifyContent="center">
          <VStack gap={4} textAlign="center">
            <Spinner size="xl" color="blue.solid" />
            <Heading size="lg" fontWeight="bold" color="white">
              Connecting to Room #{roomId}...
            </Heading>
            <Text color="gray.400" fontSize="sm">
              Connecting to lobby...
            </Text>
          </VStack>
        </Container>
      </Box>
    );
  }

  // Playing State: redirecting view
  if (gameStatus === 'playing') {
    return (
      <Box minH="100vh" bg="#030611" color="white" display="flex" flexDirection="column">
        <Navbar roomId={roomId} />
        <Container maxW="560px" py={20} flex={1} display="flex" alignItems="center" justifyContent="center">
          <VStack gap={4} textAlign="center">
            <Spinner size="xl" color="green.solid" />
            <Heading size="lg" fontWeight="bold" color="white">
              Match In Progress!
            </Heading>
            <Text color="gray.400" fontSize="sm">
              Entering the game arena...
            </Text>
          </VStack>
        </Container>
      </Box>
    );
  }

  // Finished State: Result state showing who won
  if (gameStatus === 'finished') {
    const winnerPlayer = winner || players[0];
    const winnerColorDef =
      winnerPlayer && winnerPlayer.colorIndex != null && winnerPlayer.colorIndex >= 0
        ? PLAYER_COLORS[winnerPlayer.colorIndex % PLAYER_COLORS.length]
        : PLAYER_COLORS[0];

    return (
      <Box minH="100vh" bg="#030611" color="white" display="flex" flexDirection="column">
        <Navbar roomId={roomId} />

        <Container maxW="900px" py={{ base: 6, md: 10 }} px={{ base: 4, md: 6 }} flex={1}>
          {/* Header */}
          <VStack gap={2} textAlign="center" mb={6}>
            <Badge colorPalette="yellow" variant="solid" px={3} py={1} borderRadius="full" fontSize="xs">
              MATCH RESULT
            </Badge>
            <Heading size="2xl" fontWeight="black" letterSpacing="tight">
              GAME OVER
            </Heading>
            <Text color="gray.400" fontSize="sm">
              Room #{roomId}
            </Text>
          </VStack>

          {/* Grand Winner Showcase Card */}
          <Box
            bg="rgba(15, 23, 42, 0.9)"
            border={`2px solid ${winnerColorDef.hex}`}
            borderRadius="3xl"
            p={{ base: 6, md: 8 }}
            mb={8}
            textAlign="center"
            boxShadow={`0 0 50px ${winnerColorDef.bgRgba}, 0 20px 40px rgba(0, 0, 0, 0.7)`}
            backdropFilter="blur(20px)"
          >
            <Box
              w="72px"
              h="72px"
              borderRadius="full"
              bg={winnerColorDef.bgRgba}
              border={`2px solid ${winnerColorDef.hex}`}
              display="flex"
              alignItems="center"
              justifyContent="center"
              mx="auto"
              mb={4}
              color={winnerColorDef.hex}
              boxShadow={`0 0 25px ${winnerColorDef.hex}`}
            >
              <FaTrophy size={36} />
            </Box>

            <Heading size="xl" fontWeight="black" color="white" mb={1}>
              {winnerPlayer ? `${winnerPlayer.name} Won the Game!` : 'Victory!'}
            </Heading>
            <Text color="gray.300" fontSize="sm" mb={6}>
              Dominator of the Chain Reaction Grid
            </Text>

            {/* Winner Profile Badge */}
            {winnerPlayer && (
              <Box
                display="inline-flex"
                flexDirection="column"
                alignItems="center"
                bg="#090d16"
                p={5}
                borderRadius="2xl"
                border="1px solid rgba(255, 255, 255, 0.12)"
                mb={6}
              >
                <Avatar id={winnerPlayer.avatar} size={84} borderColor={winnerColorDef.hex} showGlow />
                <HStack gap={2} mt={3}>
                  <Badge
                    bg={winnerColorDef.hex}
                    color="black"
                    fontWeight="black"
                    px={2.5}
                    py={0.5}
                    borderRadius="full"
                    fontSize="xs"
                  >
                    CHAMPION
                  </Badge>
                  {winnerPlayer.isHost && (
                    <Badge
                      bg="yellow.500"
                      color="black"
                      fontWeight="bold"
                      px={2}
                      py={0.5}
                      borderRadius="full"
                      fontSize="xs"
                    >
                      HOST
                    </Badge>
                  )}
                </HStack>
              </Box>
            )}

            {/* Action Buttons */}
            <HStack justify="center" gap={4} wrap="wrap">
              {isHost ? (
                <Button
                  size="lg"
                  bg="#22c55e"
                  color="black"
                  fontWeight="extrabold"
                  borderRadius="xl"
                  px={8}
                  py={6}
                  onClick={resetGame}
                  boxShadow="0 0 25px rgba(34, 197, 94, 0.4)"
                  _hover={{ bg: '#16a34a' }}
                >
                  <FaRotateRight /> Play Again (Reset Lobby)
                </Button>
              ) : (
                <HStack bg="#1e293b" px={5} py={3} borderRadius="xl" border="1px solid rgba(255, 255, 255, 0.1)">
                  <Spinner size="sm" color="blue.solid" />
                  <Text fontSize="sm" color="gray.300">
                    Waiting for host to start rematch...
                  </Text>
                </HStack>
              )}

              <Button
                size="lg"
                variant="outline"
                borderColor="rgba(255, 255, 255, 0.2)"
                color="white"
                borderRadius="xl"
                px={6}
                onClick={() => navigate('/')}
                _hover={{ bg: 'rgba(255, 255, 255, 0.08)' }}
              >
                <FaArrowLeft /> Exit to Home
              </Button>
            </HStack>
          </Box>

          {/* All Participants List */}
          <Box>
            <Heading size="md" fontWeight="bold" color="gray.200" mb={4}>
              Match Participants ({players.length})
            </Heading>
            <Grid templateColumns={{ base: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }} gap={4}>
              {players.map((p) => {
                const isWinner = winnerPlayer?.id === p.id;
                const pColor =
                  p.colorIndex != null && p.colorIndex >= 0
                    ? PLAYER_COLORS[p.colorIndex % PLAYER_COLORS.length]
                    : PLAYER_COLORS[0];
                return (
                  <Box
                    key={p.id}
                    bg="#0f172a"
                    p={4}
                    borderRadius="2xl"
                    border={isWinner ? `2px solid ${pColor.hex}` : '1px solid rgba(255, 255, 255, 0.1)'}
                    textAlign="center"
                    position="relative"
                  >
                    {isWinner && (
                      <Badge
                        position="absolute"
                        top={3}
                        left={3}
                        bg="yellow.500"
                        color="black"
                        fontSize="2xs"
                        fontWeight="bold"
                        borderRadius="full"
                      >
                        WINNER
                      </Badge>
                    )}
                    <Box mt={isWinner ? 4 : 2} mb={2}>
                      <Avatar id={p.avatar} size={54} borderColor={pColor.hex} />
                    </Box>
                    <Text fontWeight="bold" fontSize="sm" color="white" lineClamp={1}>
                      {p.name}
                    </Text>
                    <Text fontSize="xs" color={pColor.hex} mt={1} fontWeight="semibold">
                      {pColor.name} {p.slot != null && p.slot >= 0 ? `(Turn ${p.slot + 1})` : ''}
                    </Text>
                  </Box>
                );
              })}
            </Grid>
          </Box>
        </Container>
      </Box>
    );
  }

  // Waiting State: Waiting room for players to join
  const maxSlots = 8;
  const slots = Array.from({ length: maxSlots }, (_, index) => {
    return players[index] || null;
  });

  return (
    <Box minH="100vh" bg="#050814" color="white" display="flex" flexDirection="column">
      <Navbar roomId={roomId} />

      <Container maxW="1100px" py={8} px={{ base: 4, md: 6 }} flex={1}>
        {/* Top Header Card */}
        <Box
          bg="rgba(15, 23, 42, 0.75)"
          border="1px solid rgba(255, 255, 255, 0.1)"
          borderRadius="2xl"
          p={{ base: 4, md: 6 }}
          mb={6}
          backdropFilter="blur(16px)"
          boxShadow="0 10px 30px rgba(0, 0, 0, 0.5)"
        >
          <Flex
            direction={{ base: 'column', md: 'row' }}
            justify="space-between"
            align={{ base: 'flex-start', md: 'center' }}
            gap={4}
          >
            <Box>
              <HStack gap={2} mb={1}>
                <Badge colorPalette="blue" variant="solid" px={2.5} py={0.5} borderRadius="full" fontSize="xs">
                  WAITING ROOM
                </Badge>
                <Text fontSize="xs" color="gray.400">
                  Lobby
                </Text>
              </HStack>
              <Heading size="xl" fontWeight="black" letterSpacing="tight">
                Room #{roomId}
              </Heading>
              <Text fontSize="sm" color="gray.400" mt={1}>
                Share this room link with your friends to play together (up to 8 players).
              </Text>
            </Box>

            {/* Quick Share Link */}
            <HStack gap={3} w={{ base: '100%', md: 'auto' }}>
              <Button
                variant="outline"
                borderColor="rgba(255, 255, 255, 0.2)"
                color="white"
                borderRadius="xl"
                onClick={handleCopyLink}
                flex={{ base: 1, md: 'initial' }}
              >
                {copied ? <FaCheck color="#22c55e" /> : <FaCopy />}
                {copied ? 'Link Copied!' : 'Copy Invite Link'}
              </Button>

              {isHost && (
                <IconButton
                  aria-label="Settings"
                  variant="surface"
                  bg="#1e293b"
                  color="gray.300"
                  borderRadius="xl"
                  onClick={() => setIsSettingsOpen(true)}
                  title="Configure game settings"
                >
                  <FaGear />
                </IconButton>
              )}
            </HStack>
          </Flex>

          {/* Settings Overview Chips */}
          <HStack gap={3} mt={5} pt={4} borderTop="1px solid rgba(255, 255, 255, 0.08)" wrap="wrap">
            <HStack
              gap={2}
              bg="rgba(59, 130, 246, 0.12)"
              border="1px solid rgba(59, 130, 246, 0.25)"
              px={3}
              py={1.5}
              borderRadius="xl"
            >
              <FaClock color="#38bdf8" size={13} />
              <Text fontSize="xs" color="gray.300">
                Turn Timer:{' '}
                <Text as="span" fontWeight="bold" color="cyan.300">
                  {settings.turnWaitSeconds === 0 ? 'No Timer' : `${settings.turnWaitSeconds / 60}m`}
                </Text>
              </Text>
            </HStack>

            <HStack
              gap={2}
              bg="rgba(34, 197, 94, 0.12)"
              border="1px solid rgba(34, 197, 94, 0.25)"
              px={3}
              py={1.5}
              borderRadius="xl"
            >
              <FaChessBoard color="#4ade80" size={13} />
              <Text fontSize="xs" color="gray.300">
                Board:{' '}
                <Text as="span" fontWeight="bold" color="green.300">
                  {settings.boardSize === 's' ? 'Small (6×10)' : 'Large (10×18)'}
                </Text>
              </Text>
            </HStack>

            <HStack
              gap={2}
              bg="rgba(234, 179, 8, 0.12)"
              border="1px solid rgba(234, 179, 8, 0.25)"
              px={3}
              py={1.5}
              borderRadius="xl"
            >
              <Text fontSize="xs" color="gray.300">
                Players:{' '}
                <Text as="span" fontWeight="bold" color="yellow.300">
                  {players.length} / 8
                </Text>
              </Text>
            </HStack>
          </HStack>
        </Box>

        {/* Players Grid (8 slots) */}
        <Box mb={8}>
          <Flex justify="space-between" align="center" mb={4}>
            <Heading size="md" fontWeight="bold" color="gray.200">
              Joined Players ({players.length}/8)
            </Heading>
          </Flex>

          <Grid
            templateColumns={{
              base: 'repeat(1, 1fr)',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(4, 1fr)',
            }}
            gap={4}
          >
            {slots.map((player, idx) => {
              if (player) {
                const hasAssignedColor = player.colorIndex != null && player.colorIndex >= 0;
                const colorDef = hasAssignedColor ? PLAYER_COLORS[player.colorIndex % PLAYER_COLORS.length] : null;
                const isCurrentPlayer = currentUser?.id === player.id;

                return (
                  <Box
                    key={player.id}
                    bg="#0f172a"
                    p={4}
                    borderRadius="2xl"
                    border={
                      colorDef
                        ? `2px solid ${colorDef.hex}`
                        : isCurrentPlayer
                          ? '2px solid #3b82f6'
                          : '1px solid rgba(255, 255, 255, 0.12)'
                    }
                    boxShadow={
                      colorDef
                        ? `0 0 16px ${colorDef.bgRgba}`
                        : isCurrentPlayer
                          ? '0 0 16px rgba(59, 130, 246, 0.25)'
                          : 'none'
                    }
                    position="relative"
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    textAlign="center"
                    transition="all 0.2s ease"
                  >
                    {/* Host Badge / You Badge */}
                    <HStack position="absolute" top={3} left={3} gap={1}>
                      {player.isHost && (
                        <Badge
                          bg="yellow.500"
                          color="black"
                          borderRadius="full"
                          px={2}
                          py={0.5}
                          fontSize="2xs"
                          fontWeight="bold"
                          display="flex"
                          alignItems="center"
                          gap={1}
                        >
                          <FaCrown size={10} /> HOST
                        </Badge>
                      )}
                      {isCurrentPlayer && (
                        <Badge
                          bg="blue.500"
                          color="white"
                          borderRadius="full"
                          px={2}
                          py={0.5}
                          fontSize="2xs"
                          fontWeight="bold"
                          display="flex"
                          alignItems="center"
                          gap={1}
                        >
                          <FaUser size={8} /> YOU
                        </Badge>
                      )}
                    </HStack>

                    {/* Disconnect indicator */}
                    <Box
                      position="absolute"
                      top={3}
                      right={3}
                      display="flex"
                      alignItems="center"
                      gap={1}
                      title={player.isConnected ? 'Connected' : 'Disconnected'}
                    >
                      <Box
                        w="8px"
                        h="8px"
                        borderRadius="full"
                        bg={player.isConnected ? '#22c55e' : '#ef4444'}
                        boxShadow={player.isConnected ? '0 0 8px #22c55e' : '0 0 8px #ef4444'}
                      />
                      <Text fontSize="2xs" color={player.isConnected ? 'green.400' : 'red.400'} fontWeight="semibold">
                        {player.isConnected ? 'Online' : 'Offline'}
                      </Text>
                    </Box>

                    {/* Avatar */}
                    <Box mt={player.isHost || isCurrentPlayer ? 3 : 1} mb={3}>
                      <Avatar
                        id={player.avatar}
                        size={64}
                        borderColor={colorDef ? colorDef.hex : isCurrentPlayer ? '#3b82f6' : 'rgba(255, 255, 255, 0.2)'}
                        showGlow={Boolean(colorDef || isCurrentPlayer)}
                      />
                    </Box>

                    {/* Name */}
                    <Text fontWeight="bold" fontSize="md" color="white" lineClamp={1}>
                      {player.name}
                    </Text>

                    {/* Color Swatch & Slot or Randomized Notice */}
                    {colorDef ? (
                      <HStack
                        gap={1.5}
                        mt={2}
                        px={2.5}
                        py={1}
                        borderRadius="full"
                        bg={colorDef.bgRgba}
                        border={`1px solid ${colorDef.hex}`}
                      >
                        <Box w="8px" h="8px" borderRadius="full" bg={colorDef.hex} />
                        <Text fontSize="xs" fontWeight="bold" color="white">
                          {colorDef.name} (Turn {player.slot != null && player.slot >= 0 ? player.slot + 1 : idx + 1})
                        </Text>
                      </HStack>
                    ) : (
                      <HStack
                        gap={1.5}
                        mt={2}
                        px={2.5}
                        py={1}
                        borderRadius="full"
                        bg="rgba(255, 255, 255, 0.06)"
                        border="1px solid rgba(255, 255, 255, 0.12)"
                      >
                        <FaDice color="#94a3b8" size={11} />
                        <Text fontSize="xs" fontWeight="medium" color="gray.300">
                          Assigned on start
                        </Text>
                      </HStack>
                    )}

                    {/* Kick / Remove option for Host */}
                    {isHost && !player.isHost && (
                      <Button
                        size="2xs"
                        variant="ghost"
                        color="gray.500"
                        _hover={{ color: 'red.400' }}
                        mt={3}
                        onClick={() => removePlayer(player.id)}
                      >
                        Remove
                      </Button>
                    )}
                  </Box>
                );
              }

              // Empty Slot
              return (
                <Box
                  key={`empty_${idx}`}
                  bg="rgba(15, 23, 42, 0.4)"
                  p={6}
                  borderRadius="2xl"
                  border="2px dashed rgba(255, 255, 255, 0.12)"
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="center"
                  textAlign="center"
                  minH="180px"
                  color="gray.500"
                >
                  <Box
                    w="44px"
                    h="44px"
                    borderRadius="full"
                    border="1px dashed rgba(255, 255, 255, 0.2)"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    mb={2}
                  >
                    <Text fontSize="xs" color="gray.500">
                      #{idx + 1}
                    </Text>
                  </Box>
                  <Text fontSize="sm" fontWeight="medium" color="gray.400">
                    Empty Slot
                  </Text>
                  <Text fontSize="2xs" color="gray.600">
                    Waiting for player...
                  </Text>
                </Box>
              );
            })}
          </Grid>
        </Box>

        {/* Loader & Status Indicator */}
        <Box
          bg="#0b1120"
          border="1px solid rgba(255, 255, 255, 0.08)"
          borderRadius="2xl"
          p={6}
          mb={6}
          textAlign="center"
        >
          <HStack justify="center" gap={3} mb={2}>
            <Spinner size="md" color="blue.solid" />
            <Text fontSize="md" fontWeight="semibold" color="gray.200">
              {players.length < 2
                ? 'Waiting for more players to join...'
                : isHost
                  ? 'Lobby is ready! Host can start the game.'
                  : 'Waiting for host to launch the game...'}
            </Text>
          </HStack>
          <Text fontSize="xs" color="gray.500">
            {players.length < 2
              ? 'At least 2 players are required to start Chain Reaction.'
              : `Total of ${players.length} players ready in the lobby.`}
          </Text>
        </Box>

        {/* Action Controls */}
        <Flex justify="space-between" align="center" gap={4} wrap="wrap">
          <Button
            variant="outline"
            borderColor="rgba(255, 255, 255, 0.15)"
            color="gray.400"
            borderRadius="xl"
            onClick={() => navigate('/')}
            _hover={{ color: 'white', bg: 'rgba(255, 255, 255, 0.05)' }}
          >
            <FaArrowLeft /> Back to Home
          </Button>

          <HStack gap={3}>
            {isHost ? (
              <Button
                size="lg"
                bg={players.length >= 2 ? '#22c55e' : '#334155'}
                color={players.length >= 2 ? 'black' : 'gray.400'}
                fontWeight="extrabold"
                borderRadius="xl"
                px={8}
                disabled={players.length < 2}
                onClick={handleStartGame}
                boxShadow={players.length >= 2 ? '0 0 25px rgba(34, 197, 94, 0.4)' : 'none'}
                _hover={players.length >= 2 ? { bg: '#16a34a' } : {}}
              >
                <FaPlay /> Start Game
              </Button>
            ) : (
              <Badge bg="blue.600" color="white" px={4} py={2} borderRadius="xl" fontSize="sm">
                {'Ready & Waiting'}
              </Badge>
            )}
          </HStack>
        </Flex>
      </Container>

      {/* Settings Modal */}
      <LobbySettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={updateSettings}
        isAdmin={isHost}
      />
    </Box>
  );
}
