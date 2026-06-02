import { useState } from 'react';
import { DisplayRoot, Button } from 'mrbd-ui-kit';
import { Lightbulb, Map as MapIcon, Settings as SettingsIcon } from 'lucide-react';

import { useUserId } from './hooks/useUserId';
import { useGeolocation } from './hooks/useGeolocation';
import { useSettings } from './hooks/useSettings';
import { useJallume } from './hooks/useJallume';

import { MainScreen } from './screens/MainScreen';
import { MapScreen } from './screens/MapScreen';
import { SettingsScreen } from './screens/SettingsScreen';

type Screen = 'main' | 'map' | 'settings';

const NAV = [
  { id: 'main', label: 'Accueil', icon: Lightbulb },
  { id: 'map', label: 'Carte', icon: MapIcon },
  { id: 'settings', label: 'Réglages', icon: SettingsIcon },
] as const;

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

  void geoError; // disponible pour un affichage d'erreur futur

  return (
    <DisplayRoot>
      <div
        className="flex flex-col bg-black text-mrbd-text"
        style={{ width: '100%', height: '100%' }}
      >
        {/* Zone de contenu */}
        <div className="flex-1 overflow-hidden">
          {screen === 'main' && (
            <div className="h-full overflow-y-auto">
              <MainScreen
                status={status}
                config={config}
                lighting={lighting}
                timeLeft={timeLeft}
                demoMode={demoMode}
                onLightUp={lightUp}
              />
            </div>
          )}
          {screen === 'map' && (
            <MapScreen coords={coords} accuracy={accuracy} config={config} dark={dark} />
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

        {/* Barre de navigation (composants du kit) */}
        <nav className="flex shrink-0 items-center justify-around gap-2 border-t border-white/10 px-2 py-2">
          {NAV.map((item) => (
            <Button
              key={item.id}
              id={`nav-${item.id}`}
              icon={item.icon}
              variant={screen === item.id ? 'secondary' : 'ghost'}
              autoFocus={false}
              onClick={() => setScreen(item.id)}
            >
              {item.label}
            </Button>
          ))}
        </nav>
      </div>
    </DisplayRoot>
  );
}

export default App;
