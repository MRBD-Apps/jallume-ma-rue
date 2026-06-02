import { Card, Focusable } from 'mrbd-ui-kit';

interface Props {
  demoMode: boolean;
  dark: boolean;
  onToggleDemo: () => void;
  onToggleTheme: () => void;
}

export function SettingsScreen({ demoMode, dark, onToggleDemo, onToggleTheme }: Props) {
  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-center text-2xl font-bold text-white">Réglages</h1>

      <Card className="flex items-center justify-between px-4 py-3">
        <span className="text-base font-medium text-neutral-200">Mode démo</span>
        <Focusable id="toggle-demo" onSelect={onToggleDemo}>
          <button
            type="button"
            onClick={onToggleDemo}
            className="rounded-full px-4 py-1 text-sm font-semibold text-white transition-colors"
          >
            {demoMode ? 'ON' : 'OFF'}
          </button>
        </Focusable>
      </Card>

      <Card className="flex items-center justify-between px-4 py-3">
        <span className="text-base font-medium text-neutral-200">Thème</span>
        <Focusable id="toggle-theme" onSelect={onToggleTheme}>
          <button
            type="button"
            onClick={onToggleTheme}
            className="rounded-full px-4 py-1 text-sm font-semibold text-white transition-colors"
          >
            {dark ? 'Sombre' : 'Clair'}
          </button>
        </Focusable>
      </Card>
    </div>
  );
}
