import { AvatarId } from '../components/Avatar';

export interface PlayerColorDef {
  index: number;
  name: string;
  hex: string;
  threeColor: number;
  glow: string;
  bgRgba: string;
}

export const PLAYER_COLORS: PlayerColorDef[] = [
  { index: 0, name: 'Red', hex: '#ef4444', threeColor: 0xff0000, glow: '#ef4444', bgRgba: 'rgba(239, 68, 68, 0.2)' },
  { index: 1, name: 'Green', hex: '#22c55e', threeColor: 0x00ff00, glow: '#22c55e', bgRgba: 'rgba(34, 197, 94, 0.2)' },
  { index: 2, name: 'Blue', hex: '#3b82f6', threeColor: 0x0000ff, glow: '#3b82f6', bgRgba: 'rgba(59, 130, 246, 0.2)' },
  { index: 3, name: 'Yellow', hex: '#eab308', threeColor: 0xffff00, glow: '#eab308', bgRgba: 'rgba(234, 179, 8, 0.2)' },
  {
    index: 4,
    name: 'Magenta',
    hex: '#d946ef',
    threeColor: 0xff00ff,
    glow: '#d946ef',
    bgRgba: 'rgba(217, 70, 239, 0.2)',
  },
  { index: 5, name: 'Cyan', hex: '#06b6d4', threeColor: 0x00ffff, glow: '#06b6d4', bgRgba: 'rgba(6, 182, 212, 0.2)' },
  {
    index: 6,
    name: 'Orange',
    hex: '#f97316',
    threeColor: 0xff7f00,
    glow: '#f97316',
    bgRgba: 'rgba(249, 115, 22, 0.2)',
  },
  {
    index: 7,
    name: 'White',
    hex: '#f8fafc',
    threeColor: 0xffffff,
    glow: '#f8fafc',
    bgRgba: 'rgba(248, 250, 252, 0.2)',
  },
];

export interface PlayerInfo {
  id: string;
  name: string;
  avatar: AvatarId;
  colorIndex: number;
  slot?: number;
  isHost: boolean;
  isConnected: boolean;
  isEliminated: boolean;
  atomCount?: number;
}

export interface LobbySettings {
  boardSize: 's' | 'l';
  turnWaitSeconds: number; // wait per user (0 means no timer)
}

export interface TimerOption {
  label: string;
  seconds: number;
}

export const TIMER_OPTIONS: TimerOption[] = [
  { label: '1m', seconds: 60 },
  { label: '2m', seconds: 120 },
  { label: '3m', seconds: 180 },
  { label: '4m', seconds: 240 },
  { label: '5m', seconds: 300 },
  { label: 'No Timer', seconds: 0 },
];

export type GameStatus = 'waiting' | 'playing' | 'finished';
