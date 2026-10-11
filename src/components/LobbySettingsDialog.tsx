import React, { useState } from 'react';
import { Box, Button, Flex, HStack, IconButton, Text, VStack } from '@chakra-ui/react';
import { FaClock, FaChessBoard, FaXmark } from 'react-icons/fa6';
import {
  DialogRoot,
  DialogBackdrop,
  DialogPositioner,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from './ui/dialog';
import { LobbySettings, TIMER_OPTIONS } from '../lib/types';

interface LobbySettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  settings: LobbySettings;
  onSave: (newSettings: LobbySettings) => void;
  isAdmin: boolean;
}

export const LobbySettingsDialog: React.FC<LobbySettingsDialogProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
  isAdmin,
}) => {
  const [boardSize, setBoardSize] = useState<'s' | 'l'>(settings.boardSize);
  const [turnWaitSeconds, setTurnWaitSeconds] = useState<number>(settings.turnWaitSeconds);

  const handleSave = () => {
    onSave({
      boardSize,
      turnWaitSeconds,
    });
    onClose();
  };

  return (
    <DialogRoot
      open={isOpen}
      onOpenChange={(details) => {
        if (!details.open) onClose();
      }}
      size="md"
      placement="center"
    >
      <DialogBackdrop bg="rgba(0, 0, 0, 0.75)" backdropFilter="blur(8px)" />
      <DialogPositioner>
        <DialogContent
          bg="#0f172a"
          borderColor="rgba(255, 255, 255, 0.12)"
          borderRadius="2xl"
          boxShadow="0 20px 40px -15px rgba(0,0,0,0.8)"
          color="white"
          p={6}
          maxW="450px"
          w="92vw"
        >
          <DialogHeader p={0} mb={4}>
            <Flex justify="space-between" align="center">
              <DialogTitle fontSize="lg" fontWeight="bold">
                Game Settings
              </DialogTitle>
              <IconButton
                aria-label="Close"
                size="sm"
                variant="ghost"
                color="gray.400"
                onClick={onClose}
                borderRadius="full"
              >
                <FaXmark />
              </IconButton>
            </Flex>
          </DialogHeader>

          <DialogBody p={0} mb={5}>
            <VStack gap={5} align="stretch">
              {/* Wait per user / Turn timer */}
              <Box>
                <HStack gap={2} mb={2} color="cyan.400">
                  <FaClock size={14} />
                  <Text fontSize="sm" fontWeight="semibold" color="gray.200">
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
                        disabled={!isAdmin}
                        onClick={() => setTurnWaitSeconds(opt.seconds)}
                        borderRadius="xl"
                        variant={isSelected ? 'solid' : 'outline'}
                        bg={isSelected ? '#2563eb' : 'transparent'}
                        borderColor={isSelected ? '#3b82f6' : 'rgba(255,255,255,0.15)'}
                        color={isSelected ? 'white' : 'gray.300'}
                        _hover={{ bg: isSelected ? '#1d4ed8' : 'rgba(255,255,255,0.06)' }}
                      >
                        {opt.label}
                      </Button>
                    );
                  })}
                </HStack>
                <Text fontSize="xs" color="gray.500" mt={1.5}>
                  Time allowed for each player to make a move before turn is passed.
                </Text>
              </Box>

              {/* Board Size */}
              <Box>
                <HStack gap={2} mb={2} color="green.400">
                  <FaChessBoard size={14} />
                  <Text fontSize="sm" fontWeight="semibold" color="gray.200">
                    Board Size
                  </Text>
                </HStack>
                <HStack gap={3}>
                  <Box
                    as="button"
                    aria-disabled={!isAdmin}
                    onClick={() => {
                      if (isAdmin) setBoardSize('s');
                    }}
                    flex={1}
                    p={3}
                    borderRadius="xl"
                    textAlign="center"
                    border={boardSize === 's' ? '2px solid #22c55e' : '1px solid rgba(255, 255, 255, 0.12)'}
                    bg={boardSize === 's' ? 'rgba(34, 197, 94, 0.15)' : '#1e293b'}
                    cursor={isAdmin ? 'pointer' : 'default'}
                    transition="all 0.15s ease"
                  >
                    <Text fontWeight="bold" fontSize="sm" color="white">
                      Small
                    </Text>
                    <Text fontSize="xs" color="gray.400">
                      6 × 10 grid (Faster)
                    </Text>
                  </Box>

                  <Box
                    as="button"
                    aria-disabled={!isAdmin}
                    onClick={() => {
                      if (isAdmin) setBoardSize('l');
                    }}
                    flex={1}
                    p={3}
                    borderRadius="xl"
                    textAlign="center"
                    border={boardSize === 'l' ? '2px solid #22c55e' : '1px solid rgba(255, 255, 255, 0.12)'}
                    bg={boardSize === 'l' ? 'rgba(34, 197, 94, 0.15)' : '#1e293b'}
                    cursor={isAdmin ? 'pointer' : 'default'}
                    transition="all 0.15s ease"
                  >
                    <Text fontWeight="bold" fontSize="sm" color="white">
                      Large
                    </Text>
                    <Text fontSize="xs" color="gray.400">
                      10 × 18 grid (Epic)
                    </Text>
                  </Box>
                </HStack>
              </Box>

              {!isAdmin && (
                <Text fontSize="xs" color="amber.300" bg="rgba(245, 158, 11, 0.1)" p={2.5} borderRadius="lg">
                  Only the room host can modify these settings.
                </Text>
              )}
            </VStack>
          </DialogBody>

          <DialogFooter p={0}>
            <Flex w="100%" justify="flex-end" gap={3}>
              <Button
                variant="outline"
                borderColor="rgba(255, 255, 255, 0.2)"
                color="gray.300"
                borderRadius="xl"
                onClick={onClose}
              >
                {isAdmin ? 'Cancel' : 'Close'}
              </Button>
              {isAdmin && (
                <Button bg="#2563eb" color="white" borderRadius="xl" onClick={handleSave} _hover={{ bg: '#1d4ed8' }}>
                  Apply Settings
                </Button>
              )}
            </Flex>
          </DialogFooter>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  );
};
