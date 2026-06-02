import { useState } from 'react';
import { DisplayRoot, Button } from 'mrbd-ui-kit';
import { Lightbulb, Map as MapIcon } from 'lucide-react';

import { useUserId } from './hooks/useUserId';
import { useGeolocation } from './hooks/useGeolocation';
import { useJallume } from './hooks/useJallume';

import { MainScreen } from './screens/MainScreen';
import { MapScreen } from './screens/MapScreen';

type Screen = 'main' | 'map';

const NAV = [
  { id: 'main', label: 'Accueil', icon: Lightbulb },
  { id: 'map', label: 'Carte', icon: MapIcon },
] as const;

function App() {
  const [screen, setScreen] = useState<Screen>('main');

  const userId = useUserId();
  const { coords, accuracy, error: geoError } = useGeolocation();
  const { config, status, lighting, timeLeft, lightUp } = useJallume({
    coords,
    userId,
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
                onLightUp={lightUp}
              />
            </div>
          )}
          {screen === 'map' && (
            <MapScreen coords={coords} accuracy={accuracy} config={config} />
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
