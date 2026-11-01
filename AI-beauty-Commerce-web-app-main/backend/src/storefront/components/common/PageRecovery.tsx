'use client';

/** Only rendered after a page exception; successful screens keep their UI. */
export function PageRecovery({ reset }: { reset?: () => void }) {
  return <main style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', padding: 24, background: '#FAF9F6', color: '#0F0F10', fontFamily: 'system-ui, sans-serif' }}>
    <div style={{ maxWidth: 420, textAlign: 'center' }}>
      <p style={{ fontWeight: 700 }}>DESLA!™</p>
      <h1 style={{ fontSize: 24 }}>This page couldn’t finish loading.</h1>
      <p>Please try again. If the site was recently updated, reload to get the latest version.</p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 24 }}>
        {reset && <button type="button" onClick={reset} style={{ padding: '10px 16px', cursor: 'pointer' }}>Try again</button>}
        <button type="button" onClick={() => window.location.reload()} style={{ padding: '10px 16px', cursor: 'pointer' }}>Reload page</button>
      </div>
    </div>
  </main>;
}
