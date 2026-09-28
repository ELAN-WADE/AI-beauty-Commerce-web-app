export default function Home() {
  return (
    <main style={{ fontFamily: 'system-ui', padding: 32 }}>
      <h1>Glowly API</h1>
      <p>
        Backend only. Storefront is served separately. Health:{' '}
        <a href="/api/health">/api/health</a> · Readiness: <a href="/api/ready">/api/ready</a>
      </p>
    </main>
  );
}
