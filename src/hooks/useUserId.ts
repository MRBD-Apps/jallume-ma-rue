import { useState } from 'react';
import { CONFIG } from '../config';

export function useUserId(): string {
  const [id] = useState(() => {
    const existing = localStorage.getItem(CONFIG.STORAGE_KEY_USER_ID);
    if (existing) return existing;
    const generated = String(Date.now() + Math.floor(Math.random() * 1000 + 1));
    localStorage.setItem(CONFIG.STORAGE_KEY_USER_ID, generated);
    return generated;
  });
  return id;
}
