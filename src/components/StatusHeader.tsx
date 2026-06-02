interface Props {
  cityName?: string;
  statusLabel: string;
}

export function StatusHeader({ cityName, statusLabel }: Props) {
  return (
    <header className="px-4 pt-4 text-center">
      <h1 className="text-3xl font-bold text-white">{cityName || "J'allume ma rue"}</h1>
      <p className="mt-1 text-lg text-neutral-300">{statusLabel}</p>
    </header>
  );
}
