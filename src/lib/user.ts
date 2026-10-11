import { AvatarId } from '../components/Avatar';

export interface UserProfile {
  id: string;
  name: string;
  avatar: AvatarId;
}

export async function fetchBackendProfile(): Promise<UserProfile | null> {
  try {
    const res = await fetch('/api/v1/profile', { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      if (data && data.name) {
        return {
          id: data.id,
          name: data.name,
          avatar: data.avatar || 'cyber-bot',
        };
      }
    }
  } catch {
    alert('Failing');
  }
  return null;
}

export async function saveBackendProfile(name: string, avatar: AvatarId): Promise<UserProfile | null> {
  try {
    const res = await fetch('/api/v1/profile', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, avatar }),
    });
    if (res.ok) {
      const data = await res.json();
      return {
        id: data.id,
        name: data.name,
        avatar: data.avatar || avatar,
      };
    }
  } catch {
    alert('Failing');
  }
  return null;
}
