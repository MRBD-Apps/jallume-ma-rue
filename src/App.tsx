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

        {/* Dock de navigation — Button du kit, en cercles icône-seule (cf. Herald) */}
        <nav className="flex shrink-0 items-center justify-center gap-2 py-3">
          {NAV.map((item) => (
            <Button
              key={item.id}
              id={`nav-${item.id}`}
              variant={screen === item.id ? 'secondary' : 'ghost'}
              size="lg"
              icon={item.icon}
              autoFocus={false}
              onClick={() => setScreen(item.id)}
              className="h-14 w-14 rounded-full p-0"
            >
              <span className="sr-only">{item.label}</span>
            </Button>
          ))}
        </nav>
      </div>
    </DisplayRoot>
  );
}

export default App;
