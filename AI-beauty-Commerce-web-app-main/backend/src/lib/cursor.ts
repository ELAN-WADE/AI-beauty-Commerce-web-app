/** Opaque keyset cursor shared by paginated reads (invalid → restart from head). */
export interface Cursor {
  k: string; // sort-key value (ISO date | number-as-string)
  id: string; // tiebreak
}

export function encodeCursor(c: Cursor): string {
  return Buffer.from(JSON.stringify(c)).toString('base64url');
}

export function decodeCursor(raw: string | undefined): Cursor | null {
  if (!raw) return null;
  try {
    const c = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8')) as Cursor;
    if (typeof c.k !== 'string' || typeof c.id !== 'string') return null;
    return c;
  } catch {
    return null;
  }
}
