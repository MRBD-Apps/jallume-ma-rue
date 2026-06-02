import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useUserId } from './useUserId';
import { CONFIG } from '../config';

beforeEach(() => localStorage.clear());

describe('useUserId', () => {
  it('génère et persiste un id si absent', () => {
    const { result } = renderHook(() => useUserId());
    expect(result.current).toBeTruthy();
    expect(localStorage.getItem(CONFIG.STORAGE_KEY_USER_ID)).toBe(result.current);
  });

  it('réutilise l\'id existant', () => {
    localStorage.setItem(CONFIG.STORAGE_KEY_USER_ID, 'fixe-123');
    const { result } = renderHook(() => useUserId());
    expect(result.current).toBe('fixe-123');
  });
});
