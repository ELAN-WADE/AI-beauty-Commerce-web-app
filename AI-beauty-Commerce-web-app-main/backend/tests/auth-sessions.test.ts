/**
 * Batch-1 (Part VII): login rotates the session set — concurrent active
 * sessions are capped (default 10, newest kept), so stolen/forgotten tokens
 * die on next login without logging out normal multi-device users.
 * Service-level on PGlite — no request scope needed.
 */
import { describe, expect, it, beforeAll } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle, type PgliteDatabase } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { and, eq, isNull, gt } from 'drizzle-orm';
import * as schema from '@/db/schema';
import { users, userSessions } from '@/modules/auth/schema';
import { createSession, enforceSessionCap, getSessionUser, hashPassword, login } from '@/modules/auth/service';

let db: PgliteDatabase<typeof schema>;
let userId: string;

beforeAll(async () => {
  const { pgcrypto } = await import('@electric-sql/pglite/contrib/pgcrypto');
  const { uuid_ossp } = await import('@electric-sql/pglite/contrib/uuid_ossp');
  const client = new PGlite({ extensions: { pgcrypto, uuid_ossp } });
  db = drizzle(client, { schema });
  await migrate(db as never, { migrationsFolder: './drizzle' });
  const [user] = await db
    .insert(users)
    .values({ email: 'sessions@example.com', passwordHash: await hashPassword('Password123!'), emailVerifiedAt: new Date() })
    .returning({ id: users.id });
  userId = user.id;
}, 120000);

const pg = () => db as never;

async function activeCount(): Promise<number> {
  const rows = await db
    .select({ id: userSessions.id })
    .from(userSessions)
    .where(and(eq(userSessions.userId, userId), isNull(userSessions.revokedAt), gt(userSessions.expiresAt, new Date())));
  return rows.length;
}

describe('session rotation on login', () => {
  it('caps active sessions at 10 newest; oldest tokens die', async () => {
    const tokens: string[] = [];
    for (let i = 0; i < 12; i++) {
      tokens.push((await createSession(pg(), userId)).token);
    }
    expect(await activeCount()).toBe(12);
    expect(await getSessionUser(pg(), tokens[0])).not.toBeNull();

    const { token: fresh } = await login(pg(), { email: 'sessions@example.com', password: 'Password123!' });
    expect(await activeCount()).toBe(10);
    // Newest survive, oldest are revoked.
    expect(await getSessionUser(pg(), fresh)).not.toBeNull();
    expect(await getSessionUser(pg(), tokens[11])).not.toBeNull();
    expect(await getSessionUser(pg(), tokens[0])).toBeNull();
    expect(await getSessionUser(pg(), tokens[1])).toBeNull();
  });

  it('does not disturb users under the cap', async () => {
    const before = await activeCount();
    const { revoked } = await enforceSessionCap(pg(), '00000000-0000-0000-0000-000000000000');
    expect(revoked).toBe(0);
    expect(await activeCount()).toBe(before);
  });
});
