import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSettings } from './useSettings';

beforeEach(() => localStorage.clear());

describe('useSettings', () => {
  it('démo ON et thème sombre par défaut', () => {
    const { result } = renderHook(() => useSettings());
    expect(result.current.demoMode).toBe(true);
    expect(result.current.dark).toBe(true);
  });

  it('toggle démo persiste', () => {
    const { result } = renderHook(() => useSettings());
    act(() => result.current.setDemoMode(false));
    expect(localStorage.getItem('jallume_demo_mode')).toBe('0');
  });
});
