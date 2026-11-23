export default function Loading() {
  return (
    <div className="page-loading" role="status" aria-label="Memuat halaman">
      <div className="skeleton skeleton-heading" />
      <div className="skeleton skeleton-copy" />
      <div className="game-grid">
        {[0, 1, 2].map((key) => (
          <div key={key} className="skeleton skeleton-card" />
        ))}
      </div>
      <span className="sr-only">Memuat halaman…</span>
    </div>
  );
}
