import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile, fetchBackendProfile, saveBackendProfile } from './lib/user';
import { AvatarId } from './components/Avatar';

interface StateContextType {
  user: UserProfile;
  updateProfile: (name: string, avatar: AvatarId) => Promise<void>;
  isProfileOpen: boolean;
  openProfile: () => void;
  closeProfile: () => void;
}

const StateContext = createContext<StateContextType | null>(null);

export const StateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // On mount, check if backend provides user identity and profile
  useEffect(() => {
    fetchBackendProfile().then((beProfile) => {
      if (beProfile) {
        setUser(beProfile);
      }
    });
  }, []);

  const updateProfile = async (name: string, avatar: AvatarId) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    if (!user) {
      return;
    }

    // Optimistically update
    const updated: UserProfile = {
      ...user,
      name: trimmed,
      avatar,
    };
    setUser(updated);

    // Save to backend
    const saved = await saveBackendProfile(trimmed, avatar);
    if (saved) {
      setUser(saved);
    }
  };

  const openProfile = () => setIsProfileOpen(true);
  const closeProfile = () => setIsProfileOpen(false);

  if (!user) {
    return null;
  }

  return (
    <StateContext.Provider
      value={{
        user,
        updateProfile,
        isProfileOpen,
        openProfile,
        closeProfile,
      }}
    >
      {children}
    </StateContext.Provider>
  );
};

export function useAppState(): StateContextType {
  const context = useContext(StateContext);
  if (!context) {
    throw new Error('useAppState must be used within a StateProvider');
  }
  return context;
}
