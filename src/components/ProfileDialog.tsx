import React, { useState } from 'react';
import { Box, Button, Flex, Grid, Input, Text, VStack, HStack, IconButton } from '@chakra-ui/react';
import { FaCheck, FaXmark } from 'react-icons/fa6';
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
import { useAppState } from '../state';
import { Avatar, AVATAR_LIST, AvatarId } from './Avatar';

const ProfileDialogInner: React.FC = () => {
  const { user, updateProfile, closeProfile } = useAppState();
  const [name, setName] = useState(user.name);
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarId>(user.avatar);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsSaving(true);
    await updateProfile(name, selectedAvatar);
    setIsSaving(false);
    closeProfile();
  };

  return (
    <DialogContent
      bg="#0f172a"
      borderColor="rgba(255, 255, 255, 0.12)"
      borderRadius="2xl"
      boxShadow="0 20px 40px -15px rgba(0,0,0,0.8), 0 0 30px rgba(59, 130, 246, 0.2)"
      color="white"
      p={6}
      maxW="480px"
      w="92vw"
    >
      <DialogHeader p={0} mb={4}>
        <Flex justify="space-between" align="center">
          <HStack gap={3}>
            <Avatar id={selectedAvatar} size={40} borderColor="#3b82f6" showGlow />
            <Box>
              <DialogTitle fontSize="xl" fontWeight="bold" color="white">
                Player Profile
              </DialogTitle>
              <Text fontSize="xs" color="gray.400">
                ID:{' '}
                <Text as="span" fontFamily="mono" color="cyan.400">
                  {user.id}
                </Text>
              </Text>
            </Box>
          </HStack>
          <IconButton
            aria-label="Close"
            size="sm"
            variant="ghost"
            color="gray.400"
            onClick={closeProfile}
            borderRadius="full"
          >
            <FaXmark />
          </IconButton>
        </Flex>
      </DialogHeader>

      <DialogBody p={0} mb={5}>
        <VStack gap={4} align="stretch">
          {/* Username Input with Randomize */}
          <Box>
            <Text fontSize="sm" fontWeight="semibold" mb={1.5} color="gray.300">
              Display Name
            </Text>
            <HStack gap={2}>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter username"
                maxLength={24}
                bg="#1e293b"
                borderColor="rgba(255, 255, 255, 0.15)"
                color="white"
                borderRadius="xl"
                _focus={{
                  borderColor: '#3b82f6',
                  boxShadow: '0 0 0 1px #3b82f6',
                }}
              />
            </HStack>
          </Box>

          {/* Sample Avatar Grid */}
          <Box>
            <Flex justify="space-between" align="center" mb={2}>
              <Text fontSize="sm" fontWeight="semibold" color="gray.300">
                Choose Avatar
              </Text>
            </Flex>

            <Grid
              templateColumns="repeat(4, 1fr)"
              gap={3}
              p={2}
              bg="#090d16"
              borderRadius="xl"
              border="1px solid rgba(255, 255, 255, 0.08)"
              maxH="220px"
              overflowY="auto"
            >
              {AVATAR_LIST.map((av) => {
                const isSelected = selectedAvatar === av.id;
                return (
                  <Box
                    key={av.id}
                    as="button"
                    onClick={() => setSelectedAvatar(av.id)}
                    p={1.5}
                    borderRadius="xl"
                    position="relative"
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    bg={isSelected ? 'rgba(59, 130, 246, 0.15)' : 'transparent'}
                    border={isSelected ? '2px solid #3b82f6' : '2px solid transparent'}
                    cursor="pointer"
                    transition="all 0.15s ease"
                    _hover={{
                      bg: 'rgba(255, 255, 255, 0.05)',
                      transform: 'scale(1.05)',
                    }}
                  >
                    <Avatar id={av.id} size={48} />
                    <Text
                      fontSize="2xs"
                      color={isSelected ? 'cyan.300' : 'gray.400'}
                      mt={1}
                      textAlign="center"
                      lineClamp={1}
                    >
                      {av.name}
                    </Text>
                    {isSelected && (
                      <Box
                        position="absolute"
                        top="2px"
                        right="2px"
                        bg="#3b82f6"
                        color="white"
                        borderRadius="full"
                        p="2px"
                        fontSize="8px"
                      >
                        <FaCheck />
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Grid>
          </Box>
        </VStack>
      </DialogBody>

      <DialogFooter p={0}>
        <Flex w="100%" justify="flex-end" gap={3}>
          <Button
            variant="outline"
            borderColor="rgba(255, 255, 255, 0.2)"
            color="gray.300"
            borderRadius="xl"
            onClick={closeProfile}
          >
            Cancel
          </Button>
          <Button
            bg="#2563eb"
            color="white"
            borderRadius="xl"
            onClick={handleSave}
            loading={isSaving}
            _hover={{ bg: '#1d4ed8' }}
          >
            Save Profile
          </Button>
        </Flex>
      </DialogFooter>
    </DialogContent>
  );
};

export const ProfileDialog: React.FC = () => {
  const { isProfileOpen, closeProfile } = useAppState();

  return (
    <DialogRoot
      open={isProfileOpen}
      onOpenChange={(details) => {
        if (!details.open) closeProfile();
      }}
      size="md"
      placement="center"
    >
      <DialogBackdrop bg="rgba(0, 0, 0, 0.75)" backdropFilter="blur(8px)" />
      <DialogPositioner>{isProfileOpen && <ProfileDialogInner />}</DialogPositioner>
    </DialogRoot>
  );
};
