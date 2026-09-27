import { Player } from '@/components/Player/Player';

export default function Home() {
  return (
    <main
      className="home-page"
      style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
    >
      <Player />
    </main>
  );
}
