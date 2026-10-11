import React from 'react';
import { Box } from '@chakra-ui/react';

export type AvatarId =
  | 'cyber-bot'
  | 'cosmic-fox'
  | 'neon-dragon'
  | 'shadow-cat'
  | 'pixel-panda'
  | 'astro-knight'
  | 'plasma-wolf'
  | 'mystic-owl'
  | 'solar-falcon'
  | 'quantum-bear'
  | 'matrix-viper'
  | 'alien-voyager';

export const AVATAR_LIST: { id: AvatarId; name: string }[] = [
  { id: 'cyber-bot', name: 'Cyber Bot' },
  { id: 'cosmic-fox', name: 'Cosmic Fox' },
  { id: 'neon-dragon', name: 'Neon Dragon' },
  { id: 'shadow-cat', name: 'Shadow Cat' },
  { id: 'pixel-panda', name: 'Pixel Panda' },
  { id: 'astro-knight', name: 'Astro Knight' },
  { id: 'plasma-wolf', name: 'Plasma Wolf' },
  { id: 'mystic-owl', name: 'Mystic Owl' },
  { id: 'solar-falcon', name: 'Solar Falcon' },
  { id: 'quantum-bear', name: 'Quantum Bear' },
  { id: 'matrix-viper', name: 'Matrix Viper' },
  { id: 'alien-voyager', name: 'Alien Voyager' },
];

interface AvatarProps {
  id?: AvatarId | string;
  size?: number | string;
  borderColor?: string;
  showGlow?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({ id = 'cyber-bot', size = 48, borderColor, showGlow = false }) => {
  const pixelSize = typeof size === 'number' ? `${size}px` : size;

  const renderSvg = () => {
    switch (id) {
      case 'cyber-bot':
        return (
          <svg viewBox="0 0 100 100" width="100%" height="100%">
            <defs>
              <linearGradient id="botGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            <rect width="100" height="100" rx="28" fill="#0f172a" />
            {/* Antenna */}
            <circle cx="50" cy="18" r="5" fill="#38bdf8" />
            <line x1="50" y1="23" x2="50" y2="32" stroke="#38bdf8" strokeWidth="4" />
            {/* Head */}
            <rect x="25" y="32" width="50" height="42" rx="10" fill="url(#botGrad)" />
            {/* Eyes */}
            <rect x="33" y="44" width="12" height="12" rx="3" fill="#ffffff" />
            <circle cx="39" cy="50" r="3" fill="#0f172a" />
            <rect x="55" y="44" width="12" height="12" rx="3" fill="#ffffff" />
            <circle cx="61" cy="50" r="3" fill="#0f172a" />
            {/* Mouth */}
            <rect x="38" y="63" width="24" height="4" rx="2" fill="#0f172a" />
            {/* Cheek bolts */}
            <circle cx="21" cy="53" r="3" fill="#94a3b8" />
            <circle cx="79" cy="53" r="3" fill="#94a3b8" />
          </svg>
        );

      case 'cosmic-fox':
        return (
          <svg viewBox="0 0 100 100" width="100%" height="100%">
            <defs>
              <linearGradient id="foxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
            </defs>
            <rect width="100" height="100" rx="28" fill="#18181b" />
            {/* Ears */}
            <polygon points="25,20 45,45 20,50" fill="#ea580c" />
            <polygon points="75,20 55,45 80,50" fill="#ea580c" />
            <polygon points="30,26 42,42 26,45" fill="#fbcfe8" />
            <polygon points="70,26 58,42 74,45" fill="#fbcfe8" />
            {/* Face */}
            <polygon points="50,82 18,48 82,48" fill="url(#foxGrad)" />
            {/* White cheeks */}
            <polygon points="50,82 18,48 38,62" fill="#fef2f2" />
            <polygon points="50,82 82,48 62,62" fill="#fef2f2" />
            {/* Eyes */}
            <polygon points="32,50 44,52 36,56" fill="#1e1b4b" />
            <polygon points="68,50 56,52 64,56" fill="#1e1b4b" />
            {/* Nose */}
            <circle cx="50" cy="78" r="4" fill="#18181b" />
          </svg>
        );

      case 'neon-dragon':
        return (
          <svg viewBox="0 0 100 100" width="100%" height="100%">
            <defs>
              <linearGradient id="dragonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
            <rect width="100" height="100" rx="28" fill="#0f0728" />
            {/* Horns */}
            <path d="M 28 40 Q 15 20 12 12 Q 28 22 36 32 Z" fill="#ec4899" />
            <path d="M 72 40 Q 85 20 88 12 Q 72 22 64 32 Z" fill="#ec4899" />
            {/* Head */}
            <polygon points="50,22 76,46 68,78 50,88 32,78 24,46" fill="url(#dragonGrad)" />
            {/* Crest */}
            <polygon points="50,26 58,40 50,48 42,40" fill="#f43f5e" />
            {/* Eyes */}
            <polygon points="35,52 46,55 38,60" fill="#facc15" />
            <polygon points="65,52 54,55 62,60" fill="#facc15" />
            {/* Snout */}
            <circle cx="45" cy="74" r="2.5" fill="#3b0764" />
            <circle cx="55" cy="74" r="2.5" fill="#3b0764" />
          </svg>
        );

      case 'shadow-cat':
        return (
          <svg viewBox="0 0 100 100" width="100%" height="100%">
            <defs>
              <linearGradient id="catGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#047857" />
              </linearGradient>
            </defs>
            <rect width="100" height="100" rx="28" fill="#064e3b" />
            {/* Ears */}
            <polygon points="22,18 42,38 20,44" fill="#059669" />
            <polygon points="78,18 58,38 80,44" fill="#059669" />
            <polygon points="26,24 38,36 24,40" fill="#a7f3d0" />
            <polygon points="74,24 62,36 76,40" fill="#a7f3d0" />
            {/* Head */}
            <circle cx="50" cy="55" r="28" fill="#047857" />
            {/* Eyes */}
            <ellipse cx="38" cy="50" rx="6" ry="10" fill="#facc15" />
            <ellipse cx="38" cy="50" rx="2" ry="8" fill="#064e3b" />
            <ellipse cx="62" cy="50" rx="6" ry="10" fill="#facc15" />
            <ellipse cx="62" cy="50" rx="2" ry="8" fill="#064e3b" />
            {/* Nose & whiskers */}
            <polygon points="50,62 46,67 54,67" fill="#f43f5e" />
            <line x1="28" y1="62" x2="12" y2="60" stroke="#a7f3d0" strokeWidth="2" />
            <line x1="28" y1="68" x2="14" y2="72" stroke="#a7f3d0" strokeWidth="2" />
            <line x1="72" y1="62" x2="88" y2="60" stroke="#a7f3d0" strokeWidth="2" />
            <line x1="72" y1="68" x2="86" y2="72" stroke="#a7f3d0" strokeWidth="2" />
          </svg>
        );

      case 'pixel-panda':
        return (
          <svg viewBox="0 0 100 100" width="100%" height="100%">
            <rect width="100" height="100" rx="28" fill="#1e293b" />
            {/* Ears */}
            <circle cx="28" cy="28" r="14" fill="#0f172a" />
            <circle cx="72" cy="28" r="14" fill="#0f172a" />
            {/* Head */}
            <rect x="22" y="32" width="56" height="48" rx="20" fill="#f8fafc" />
            {/* Gamer Headphones */}
            <path d="M 18 52 A 32 32 0 0 1 82 52" fill="none" stroke="#6366f1" strokeWidth="5" />
            <rect x="14" y="44" width="8" height="18" rx="4" fill="#ec4899" />
            <rect x="78" y="44" width="8" height="18" rx="4" fill="#ec4899" />
            {/* Eye Patches */}
            <ellipse cx="37" cy="52" rx="9" ry="11" fill="#0f172a" />
            <ellipse cx="63" cy="52" rx="9" ry="11" fill="#0f172a" />
            <circle cx="38" cy="51" r="3.5" fill="#38bdf8" />
            <circle cx="62" cy="51" r="3.5" fill="#38bdf8" />
            {/* Nose */}
            <ellipse cx="50" cy="65" rx="5" ry="3" fill="#0f172a" />
          </svg>
        );

      case 'astro-knight':
        return (
          <svg viewBox="0 0 100 100" width="100%" height="100%">
            <defs>
              <linearGradient id="knightGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#475569" />
                <stop offset="100%" stopColor="#1e293b" />
              </linearGradient>
            </defs>
            <rect width="100" height="100" rx="28" fill="#090d16" />
            {/* Plume */}
            <path d="M 50 12 Q 35 18 38 32 Q 50 24 50 12" fill="#ef4444" />
            <path d="M 50 12 Q 65 18 62 32 Q 50 24 50 12" fill="#ef4444" />
            {/* Helmet */}
            <polygon points="50,24 76,40 70,80 50,88 30,80 24,40" fill="url(#knightGrad)" />
            {/* Visor slit */}
            <rect x="30" y="46" width="40" height="10" rx="3" fill="#38bdf8" />
            <line x1="50" y1="46" x2="50" y2="56" stroke="#0284c7" strokeWidth="2" />
            <line x1="38" y1="64" x2="62" y2="64" stroke="#94a3b8" strokeWidth="3" />
            <line x1="42" y1="71" x2="58" y2="71" stroke="#94a3b8" strokeWidth="3" />
          </svg>
        );

      case 'plasma-wolf':
        return (
          <svg viewBox="0 0 100 100" width="100%" height="100%">
            <defs>
              <linearGradient id="wolfGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#1d4ed8" />
              </linearGradient>
            </defs>
            <rect width="100" height="100" rx="28" fill="#172554" />
            {/* Ears */}
            <polygon points="26,14 44,40 18,44" fill="#1e40af" />
            <polygon points="74,14 56,40 82,44" fill="#1e40af" />
            <polygon points="30,22 42,38 24,42" fill="#60a5fa" />
            <polygon points="70,22 58,38 76,42" fill="#60a5fa" />
            {/* Snout & Face */}
            <polygon points="50,28 78,54 62,82 50,88 38,82 22,54" fill="url(#wolfGrad)" />
            {/* Eyes */}
            <polygon points="34,48 44,52 38,58" fill="#38bdf8" />
            <polygon points="66,48 56,52 62,58" fill="#38bdf8" />
            {/* Markings */}
            <polygon points="50,42 56,58 50,70 44,58" fill="#93c5fd" />
            <circle cx="50" cy="78" r="4" fill="#0f172a" />
          </svg>
        );

      case 'mystic-owl':
        return (
          <svg viewBox="0 0 100 100" width="100%" height="100%">
            <defs>
              <linearGradient id="owlGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#7e22ce" />
              </linearGradient>
            </defs>
            <rect width="100" height="100" rx="28" fill="#2e1065" />
            {/* Feathers top */}
            <polygon points="28,20 40,36 22,40" fill="#9333ea" />
            <polygon points="72,20 60,36 78,40" fill="#9333ea" />
            {/* Body */}
            <ellipse cx="50" cy="56" rx="30" ry="28" fill="url(#owlGrad)" />
            {/* Big Eyes */}
            <circle cx="38" cy="50" r="12" fill="#f8fafc" />
            <circle cx="38" cy="50" r="7" fill="#fbbf24" />
            <circle cx="38" cy="50" r="3.5" fill="#0f172a" />
            <circle cx="62" cy="50" r="12" fill="#f8fafc" />
            <circle cx="62" cy="50" r="7" fill="#fbbf24" />
            <circle cx="62" cy="50" r="3.5" fill="#0f172a" />
            {/* Beak */}
            <polygon points="50,56 46,66 54,66" fill="#f59e0b" />
          </svg>
        );

      case 'solar-falcon':
        return (
          <svg viewBox="0 0 100 100" width="100%" height="100%">
            <defs>
              <linearGradient id="falconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#eab308" />
                <stop offset="100%" stopColor="#ca8a04" />
              </linearGradient>
            </defs>
            <rect width="100" height="100" rx="28" fill="#422006" />
            {/* Feathers */}
            <polygon points="50,14 62,34 50,44 38,34" fill="#f59e0b" />
            <circle cx="50" cy="52" r="28" fill="url(#falconGrad)" />
            {/* Sharp Eyes */}
            <polygon points="32,46 44,48 36,54" fill="#0f172a" />
            <circle cx="38" cy="49" r="2" fill="#ffffff" />
            <polygon points="68,46 56,48 64,54" fill="#0f172a" />
            <circle cx="62" cy="49" r="2" fill="#ffffff" />
            {/* Curved Beak */}
            <path d="M 44 58 L 56 58 L 50 78 Q 42 70 44 58 Z" fill="#78350f" />
          </svg>
        );

      case 'quantum-bear':
        return (
          <svg viewBox="0 0 100 100" width="100%" height="100%">
            <defs>
              <linearGradient id="bearGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0284c7" />
                <stop offset="100%" stopColor="#0369a1" />
              </linearGradient>
            </defs>
            <rect width="100" height="100" rx="28" fill="#082f49" />
            {/* Round ears */}
            <circle cx="26" cy="30" r="12" fill="#0369a1" />
            <circle cx="26" cy="30" r="6" fill="#38bdf8" />
            <circle cx="74" cy="30" r="12" fill="#0369a1" />
            <circle cx="74" cy="30" r="6" fill="#38bdf8" />
            {/* Head */}
            <circle cx="50" cy="54" r="28" fill="url(#bearGrad)" />
            {/* Eyes */}
            <circle cx="38" cy="48" r="4" fill="#ffffff" />
            <circle cx="38" cy="48" r="2" fill="#082f49" />
            <circle cx="62" cy="48" r="4" fill="#ffffff" />
            <circle cx="62" cy="48" r="2" fill="#082f49" />
            {/* Snout */}
            <ellipse cx="50" cy="62" rx="13" ry="10" fill="#bae6fd" />
            <ellipse cx="50" cy="58" rx="6" ry="4" fill="#0c4a6e" />
          </svg>
        );

      case 'matrix-viper':
        return (
          <svg viewBox="0 0 100 100" width="100%" height="100%">
            <defs>
              <linearGradient id="viperGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22c55e" />
                <stop offset="100%" stopColor="#15803d" />
              </linearGradient>
            </defs>
            <rect width="100" height="100" rx="28" fill="#052e16" />
            {/* Snake Hood */}
            <ellipse cx="50" cy="50" rx="34" ry="24" fill="#166534" />
            {/* Head */}
            <polygon points="50,22 72,50 50,78 28,50" fill="url(#viperGrad)" />
            {/* Slit eyes */}
            <ellipse cx="40" cy="46" rx="4" ry="7" fill="#facc15" />
            <line x1="40" y1="41" x2="40" y2="51" stroke="#052e16" strokeWidth="2" />
            <ellipse cx="60" cy="46" rx="4" ry="7" fill="#facc15" />
            <line x1="60" y1="41" x2="60" y2="51" stroke="#052e16" strokeWidth="2" />
            {/* Fangs */}
            <polygon points="45,66 48,74 46,66" fill="#f8fafc" />
            <polygon points="55,66 52,74 54,66" fill="#f8fafc" />
          </svg>
        );

      case 'alien-voyager':
      default:
        return (
          <svg viewBox="0 0 100 100" width="100%" height="100%">
            <defs>
              <linearGradient id="alienGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
            <rect width="100" height="100" rx="28" fill="#134e4a" />
            {/* Alien Head */}
            <polygon points="50,18 78,42 62,80 50,86 38,80 22,42" fill="url(#alienGrad)" />
            {/* Large Dark Eyes */}
            <ellipse cx="37" cy="48" rx="8" ry="14" transform="rotate(-15 37 48)" fill="#0f172a" />
            <circle cx="35" cy="44" r="3" fill="#67e8f9" />
            <ellipse cx="63" cy="48" rx="8" ry="14" transform="rotate(15 63 48)" fill="#0f172a" />
            <circle cx="61" cy="44" r="3" fill="#67e8f9" />
            {/* Little mouth */}
            <line x1="46" y1="72" x2="54" y2="72" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
          </svg>
        );
    }
  };

  return (
    <Box
      width={pixelSize}
      height={pixelSize}
      minWidth={pixelSize}
      minHeight={pixelSize}
      borderRadius="2xl"
      overflow="hidden"
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      border={borderColor ? `2px solid ${borderColor}` : '2px solid rgba(255, 255, 255, 0.15)'}
      boxShadow={
        showGlow && borderColor ? `0 0 16px ${borderColor}, 0 0 3px ${borderColor}` : '0 2px 8px rgba(0,0,0,0.4)'
      }
      transition="all 0.2s ease"
    >
      {renderSvg()}
    </Box>
  );
};
