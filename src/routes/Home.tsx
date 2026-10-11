import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Container, Grid, Heading, HStack, Text, VStack } from '@chakra-ui/react';
import { FaChessBoard, FaClock, FaAtom, FaBurst, FaTrophy } from 'react-icons/fa6';
import { Navbar } from '../components/Navbar';
import { GameLogo } from '../components/Logo';
import { TIMER_OPTIONS } from '../lib/types';

export default function Home() {
  const navigate = useNavigate();

  const [boardSize, setBoardSize] = useState<'s' | 'l'>('s');
  const [turnWaitSeconds, setTurnWaitSeconds] = useState<number>(60);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateGame = async () => {
    setIsCreating(true);

    let roomId = '';
    try {
      // Send selected settings to backend create game API
      const res = await fetch('/api/v1/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          boardSize,
          turnWaitSeconds,
        }),
      });
      if (res.ok) {
        const text = await res.text();
        try {
          const data = JSON.parse(text);
          roomId = data.roomId || text;
        } catch {
          roomId = text.trim();
        }
      }
    } catch {
      alert('Cannot Play Game');
      return;
    }

    setIsCreating(false);
    navigate(`/lobby/${roomId}`);
  };

  return (
    <Box minH="100vh" bg="#030611" color="white" display="flex" flexDirection="column">
      <Navbar />

      <Container maxW="900px" py={{ base: 6, md: 10 }} px={{ base: 4, md: 6 }} flex={1}>
        {/* Hero Section */}
        <VStack gap={4} textAlign="center" mb={10}>
          <Box maxW="240px" mx="auto">
            <GameLogo />
          </Box>

          <Heading size={{ base: '2xl', md: '3xl' }} fontWeight="black" letterSpacing="tight" color="white">
            CHAIN{' '}
            <Text as="span" color="#38bdf8">
              REACTION
            </Text>
          </Heading>

          <Text fontSize={{ base: 'sm', md: 'md' }} color="gray.400" maxW="520px">
            The explosive multiplayer arcade strategy game. Place atoms, trigger chain explosions, and dominate the
            grid.
          </Text>
        </VStack>

        {/* Main Game Setup Card */}
        <Box
          bg="rgba(15, 23, 42, 0.85)"
          borderRadius="2xl"
          border="1px solid rgba(255, 255, 255, 0.12)"
          p={{ base: 5, md: 8 }}
          boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(56, 189, 248, 0.15)"
          backdropFilter="blur(20px)"
          mb={10}
        >
          {/* Game Settings */}
          <VStack gap={6} align="stretch">
            {/* Board Size Option */}
            <Box>
              <HStack gap={2} mb={2.5} color="green.400">
                <FaChessBoard size={14} />
                <Text fontSize="sm" fontWeight="bold" color="gray.200">
                  Grid Size
                </Text>
              </HStack>
              <Grid templateColumns="repeat(2, 1fr)" gap={3}>
                <Box
                  as="button"
                  onClick={() => setBoardSize('s')}
                  p={3.5}
                  borderRadius="xl"
                  textAlign="center"
                  border={boardSize === 's' ? '2px solid #22c55e' : '1px solid rgba(255, 255, 255, 0.12)'}
                  bg={boardSize === 's' ? 'rgba(34, 197, 94, 0.15)' : '#1e293b'}
                  cursor="pointer"
                  transition="all 0.15s ease"
                  _hover={{ bg: 'rgba(34, 197, 94, 0.1)' }}
                >
                  <Text fontWeight="extrabold" fontSize="md" color="white">
                    Small Grid
                  </Text>
                  <Text fontSize="xs" color="gray.400" mt={0.5}>
                    6 × 10 (Fast & Intense)
                  </Text>
                </Box>

                <Box
                  as="button"
                  onClick={() => setBoardSize('l')}
                  p={3.5}
                  borderRadius="xl"
                  textAlign="center"
                  border={boardSize === 'l' ? '2px solid #22c55e' : '1px solid rgba(255, 255, 255, 0.12)'}
                  bg={boardSize === 'l' ? 'rgba(34, 197, 94, 0.15)' : '#1e293b'}
                  cursor="pointer"
                  transition="all 0.15s ease"
                  _hover={{ bg: 'rgba(34, 197, 94, 0.1)' }}
                >
                  <Text fontWeight="extrabold" fontSize="md" color="white">
                    Large Grid
                  </Text>
                  <Text fontSize="xs" color="gray.400" mt={0.5}>
                    10 × 18 (Epic & Tactical)
                  </Text>
                </Box>
              </Grid>
            </Box>

            {/* Wait Per User Option */}
            <Box>
              <HStack gap={2} mb={2.5} color="cyan.400">
                <FaClock size={14} />
                <Text fontSize="sm" fontWeight="bold" color="gray.200">
                  Wait Per User (Turn Timer)
                </Text>
              </HStack>
              <HStack gap={2} wrap="wrap">
                {TIMER_OPTIONS.map((opt) => {
                  const isSelected = turnWaitSeconds === opt.seconds;
                  return (
                    <Button
                      key={opt.label}
                      size="sm"
                      borderRadius="xl"
                      variant={isSelected ? 'solid' : 'outline'}
                      bg={isSelected ? '#2563eb' : 'transparent'}
                      borderColor={isSelected ? '#3b82f6' : 'rgba(255,255,255,0.15)'}
                      color={isSelected ? 'white' : 'gray.300'}
                      onClick={() => setTurnWaitSeconds(opt.seconds)}
                      _hover={{ bg: isSelected ? '#1d4ed8' : 'rgba(255,255,255,0.06)' }}
                    >
                      {opt.label}
                    </Button>
                  );
                })}
              </HStack>
              <Text fontSize="xs" color="gray.500" mt={1.5}>
                Maximum time a player has to respond during their turn before auto-advance.
              </Text>
            </Box>

            {/* Submit Button */}
            <Button
              size="lg"
              bg="#2563eb"
              color="white"
              fontWeight="extrabold"
              borderRadius="xl"
              py={6}
              onClick={handleCreateGame}
              loading={isCreating}
              boxShadow="0 0 25px rgba(37, 99, 235, 0.4)"
              _hover={{ bg: '#1d4ed8' }}
            >
              Create Game & Go to Lobby
            </Button>
          </VStack>
        </Box>

        {/* Quick Rules / Instructions Section */}
        <Box>
          <Heading size="md" fontWeight="bold" color="gray.300" mb={4} textAlign="center">
            How to Play
          </Heading>

          <Grid templateColumns={{ base: 'repeat(1, 1fr)', sm: 'repeat(3, 1fr)' }} gap={4}>
            <Box bg="#090d16" p={5} borderRadius="xl" border="1px solid rgba(255, 255, 255, 0.08)">
              <Box color="cyan.400" mb={3}>
                <FaAtom size={22} />
              </Box>
              <Text fontWeight="bold" fontSize="sm" color="white" mb={1}>
                1. Place Atoms
              </Text>
              <Text fontSize="xs" color="gray.400">
                On your turn, place an atom in any empty cell or a cell already containing your own color.
              </Text>
            </Box>

            <Box bg="#090d16" p={5} borderRadius="xl" border="1px solid rgba(255, 255, 255, 0.08)">
              <Box color="yellow.400" mb={3}>
                <FaBurst size={22} />
              </Box>
              <Text fontWeight="bold" fontSize="sm" color="white" mb={1}>
                2. Critical Mass
              </Text>
              <Text fontSize="xs" color="gray.400">
                Cells burst when full: Corners (2 atoms), Edges (3 atoms), Center cells (4 atoms)!
              </Text>
            </Box>

            <Box bg="#090d16" p={5} borderRadius="xl" border="1px solid rgba(255, 255, 255, 0.08)">
              <Box color="green.400" mb={3}>
                <FaTrophy size={22} />
              </Box>
              <Text fontWeight="bold" fontSize="sm" color="white" mb={1}>
                3. Eliminate & Win
              </Text>
              <Text fontSize="xs" color="gray.400">
                Bursting atoms fly outward, converting adjacent cells into your color. Last player standing wins!
              </Text>
            </Box>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
}
