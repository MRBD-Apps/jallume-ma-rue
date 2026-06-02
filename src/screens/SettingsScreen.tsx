import { Button, Card, Text } from 'mrbd-ui-kit';

interface Props {
  demoMode: boolean;
  dark: boolean;
  onToggleDemo: () => void;
  onToggleTheme: () => void;
}

export function SettingsScreen({ demoMode, dark, onToggleDemo, onToggleTheme }: Props) {
  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <Text as="h1" size="lg" weight="bold" className="block text-center">
        Réglages
      </Text>

      <Card className="flex items-center justify-between">
        <div className="flex flex-col">
          <Text weight="semibold">Mode démo</Text>
          <Text size="sm" className="text-gray-400">
            N'allume pas réellement les lampadaires
          </Text>
        </div>
        <Button
          id="toggle-demo"
          variant={demoMode ? 'primary' : 'secondary'}
          onClick={onToggleDemo}
        >
          {demoMode ? 'ON' : 'OFF'}
        </Button>
      </Card>

      <Card className="flex items-center justify-between">
        <Text weight="semibold">Thème</Text>
        <Button id="toggle-theme" variant="secondary" onClick={onToggleTheme}>
          {dark ? 'Sombre' : 'Clair'}
        </Button>
      </Card>
    </div>
  );
}
