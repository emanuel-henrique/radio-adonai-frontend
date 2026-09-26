import { Player } from '@/components/Player/Player';

export default function Home() {
  return (
    <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Player />
    </main>
  );
}
