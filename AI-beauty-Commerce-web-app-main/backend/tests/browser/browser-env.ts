function port(value: string | undefined, fallback: number) {
  const parsed = value ? Number(value) : fallback;
  if (!Number.isInteger(parsed) || parsed < 1024 || parsed > 65535) throw new Error('Browser test ports must be integers between 1024 and 65535.');
  return parsed;
}
export const appPort = port(process.env.BROWSER_APP_PORT, 3100);
export const apiPort = port(process.env.BROWSER_API_PORT, 3105);
export const appOrigin = `http://localhost:${appPort}`;
export const apiOrigin = `http://localhost:${apiPort}`;
