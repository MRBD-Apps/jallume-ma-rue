import { Text } from 'mrbd-ui-kit';

interface Props {
  cityName?: string;
  statusLabel: string;
}

export function StatusHeader({ cityName, statusLabel }: Props) {
  return (
    <header className="px-4 pt-4 text-center">
      <Text as="h1" size="lg" weight="bold" className="block">
        {cityName || "J'allume ma rue"}
      </Text>
      <Text as="p" weight="medium" className="mt-1 block text-gray-400">
        {statusLabel}
      </Text>
    </header>
  );
}
