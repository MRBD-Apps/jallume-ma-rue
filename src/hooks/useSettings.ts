import { useEffect, useState } from 'react';
import { CONFIG } from '../config';

export function useSettings() {
  const [demoMode, setDemoModeState] = useState(
    () => localStorage.getItem(CONFIG.STORAGE_KEY_DEMO) !== '0',
  );
  const [dark, setDarkState] = useState(
    () => localStorage.getItem(CONFIG.STORAGE_KEY_THEME) !== 'light',
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }, [dark]);

  const setDemoMode = (v: boolean) => {
    localStorage.setItem(CONFIG.STORAGE_KEY_DEMO, v ? '1' : '0');
    setDemoModeState(v);
  };
  const setDark = (v: boolean) => {
    localStorage.setItem(CONFIG.STORAGE_KEY_THEME, v ? 'dark' : 'light');
    setDarkState(v);
  };

  return { demoMode, setDemoMode, dark, setDark };
}
