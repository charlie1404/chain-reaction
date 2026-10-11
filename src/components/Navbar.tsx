import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Box, Flex, HStack, Text, Button, IconButton } from '@chakra-ui/react';
import { FaCopy, FaCheck, FaPen } from 'react-icons/fa6';
import { useAppState } from '../state';
import { Avatar } from './Avatar';

interface NavbarProps {
  roomId?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ roomId }) => {
  const { user, openProfile } = useAppState();
  const [copied, setCopied] = useState(false);
  const location = useLocation();

  const handleCopyLink = () => {
    if (!roomId) return;
    const url = `${window.location.origin}/lobby/${roomId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isGameRoute = location.pathname.startsWith('/game/');
  const isLobbyRoute = location.pathname.startsWith('/lobby/');

  return (
    <Box
      as="header"
      position="sticky"
      top={0}
      zIndex={100}
      bg="rgba(10, 15, 29, 0.85)"
      backdropFilter="blur(12px)"
      borderBottom="1px solid rgba(255, 255, 255, 0.08)"
      px={{ base: 4, md: 8 }}
      py={3}
    >
      <Flex justify="space-between" align="center" maxW="1400px" mx="auto">
        {/* Left: Brand */}
        <Link to="/" style={{ textDecoration: 'none' }}>
          <HStack gap={2.5} cursor="pointer">
            <Box
              w="32px"
              h="32px"
              borderRadius="lg"
              bg="linear-gradient(135deg, #ef4444 0%, #3b82f6 50%, #22c55e 100%)"
              display="flex"
              alignItems="center"
              justifyContent="center"
              boxShadow="0 0 15px rgba(59, 130, 246, 0.5)"
            >
              <Box w="14px" h="14px" borderRadius="full" bg="#0f172a" />
            </Box>
            <Text
              fontSize={{ base: 'md', md: 'lg' }}
              fontWeight="extrabold"
              letterSpacing="wider"
              color="white"
              textTransform="uppercase"
            >
              Chain{' '}
              <Text as="span" color="#38bdf8">
                Reaction
              </Text>
            </Text>
          </HStack>
        </Link>

        {/* Center: Room Indicator if in lobby or game */}
        {roomId && (isLobbyRoute || isGameRoute) && (
          <HStack gap={2} bg="#1e293b" px={3} py={1.5} borderRadius="full" border="1px solid rgba(255, 255, 255, 0.12)">
            <Text fontSize="xs" color="gray.400" display={{ base: 'none', sm: 'inline' }}>
              Room:
            </Text>
            <Text fontSize="xs" fontWeight="bold" fontFamily="mono" color="yellow.400">
              {roomId}
            </Text>
            <IconButton
              aria-label="Copy Room Link"
              size="2xs"
              variant="ghost"
              color={copied ? 'green.400' : 'gray.400'}
              onClick={handleCopyLink}
              title="Copy room link"
            >
              {copied ? <FaCheck /> : <FaCopy />}
            </IconButton>
          </HStack>
        )}

        {/* Right Corner: Sound + Profile Trigger */}
        <HStack gap={{ base: 2, md: 3 }}>
          {/* Profile Trigger button on top corner on every page */}
          <Button
            onClick={openProfile}
            variant="ghost"
            p={1.5}
            pr={{ base: 1.5, sm: 3 }}
            borderRadius="full"
            bg="rgba(30, 41, 59, 0.7)"
            border="1px solid rgba(255, 255, 255, 0.12)"
            _hover={{
              bg: 'rgba(51, 65, 85, 0.9)',
              borderColor: 'rgba(56, 189, 248, 0.4)',
              boxShadow: '0 0 12px rgba(56, 189, 248, 0.2)',
            }}
            transition="all 0.15s ease"
          >
            <HStack gap={2}>
              <Avatar id={user.avatar} size={28} borderColor="#38bdf8" />
              <Text
                fontSize="sm"
                fontWeight="semibold"
                color="white"
                maxW="110px"
                lineClamp={1}
                display={{ base: 'none', sm: 'block' }}
              >
                {user.name}
              </Text>
              <Box color="cyan.400" fontSize="xs" ml={0.5} display={{ base: 'none', sm: 'block' }}>
                <FaPen size={10} />
              </Box>
            </HStack>
          </Button>
        </HStack>
      </Flex>
    </Box>
  );
};
