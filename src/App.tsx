import { useState } from 'react';
import { DisplayRoot, Focusable } from 'mrbd-ui-kit';

import { useUserId } from './hooks/useUserId';
import { useGeolocation } from './hooks/useGeolocation';
import { useSettings } from './hooks/useSettings';
import { useJallume } from './hooks/useJallume';

import { MainScreen } from './screens/MainScreen';
import { MapScreen } from './screens/MapScreen';
import { SettingsScreen } from './screens/SettingsScreen';

type Screen = 'main' | 'map' | 'settings';

function App() {
  const [screen, setScreen] = useState<Screen>('main');

  const userId = useUserId();
  const { coords, accuracy, error: geoError } = useGeolocation();
  const { demoMode, setDemoMode, dark, setDark } = useSettings();
  const { config, status, lighting, timeLeft, lightUp } = useJallume({
    coords,
    userId,
    demoMode,
  });

  void geoError; // available for future error display

  return (
    <DisplayRoot>
      <div
        className="flex flex-col bg-black text-white"
        style={{ width: '100%', height: '100%' }}
      >
        {/* Content area */}
        <div className="flex-1 overflow-hidden">
          {screen === 'main' && (
            <div className="h-full overflow-y-auto">
              <MainScreen
                status={status}
                config={config}
                coords={coords}
                userId={userId}
                lighting={lighting}
                timeLeft={timeLeft}
                demoMode={demoMode}
                onLightUp={lightUp}
              />
            </div>
          )}
          {screen === 'map' && (
            <MapScreen
              coords={coords}
              accuracy={accuracy}
              config={config}
              dark={dark}
            />
          )}
          {screen === 'settings' && (
            <div className="h-full overflow-y-auto">
              <SettingsScreen
                demoMode={demoMode}
                dark={dark}
                onToggleDemo={() => setDemoMode(!demoMode)}
                onToggleTheme={() => setDark(!dark)}
              />
            </div>
          )}
        </div>

        {/* Bottom navigation bar */}
        <nav
          className="flex shrink-0 items-center justify-around border-t border-white/15 bg-black/90 py-2"
        >
          <Focusable id="nav-main" onSelect={() => setScreen('main')}>
            <button
              type="button"
              onClick={() => setScreen('main')}
              className={`flex flex-col items-center gap-0.5 px-4 py-1 text-xs font-semibold transition-colors ${
                screen === 'main' ? 'text-white' : 'text-white/50'
              }`}
            >
              <span className="text-lg leading-none">💡</span>
              Accueil
            </button>
          </Focusable>

          <Focusable id="nav-map" onSelect={() => setScreen('map')}>
            <button
              type="button"
              onClick={() => setScreen('map')}
              className={`flex flex-col items-center gap-0.5 px-4 py-1 text-xs font-semibold transition-colors ${
                screen === 'map' ? 'text-white' : 'text-white/50'
              }`}
            >
              <span className="text-lg leading-none">🗺</span>
              Carte
            </button>
          </Focusable>

          <Focusable id="nav-settings" onSelect={() => setScreen('settings')}>
            <button
              type="button"
              onClick={() => setScreen('settings')}
              className={`flex flex-col items-center gap-0.5 px-4 py-1 text-xs font-semibold transition-colors ${
                screen === 'settings' ? 'text-white' : 'text-white/50'
              }`}
            >
              <span className="text-lg leading-none">⚙️</span>
              Réglages
            </button>
          </Focusable>
        </nav>
      </div>
    </DisplayRoot>
  );
}

export default App;
