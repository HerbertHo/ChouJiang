export default function Home() {
  return (
    <main className="game-frame-shell">
      <iframe
        className="game-frame"
        src="/game.html"
        title="幸运翻牌抽奖"
        allow="fullscreen"
      />
    </main>
  );
}
