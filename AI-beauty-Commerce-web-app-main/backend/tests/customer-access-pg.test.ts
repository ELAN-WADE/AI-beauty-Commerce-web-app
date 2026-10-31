import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import * as schema from '@/db/schema';
import { createSession } from '@/modules/auth/service';
import { GET as cartGet } from '@/app/api/cart/route';
import { POST as cartSync } from '@/app/api/cart/sync/route';
import { POST as checkout } from '@/app/api/checkout/route';
import { GET as posts } from '@/app/api/community/posts/route';
import { GET as chat } from '@/app/api/community/chat/route';
import { GET as reviews } from '@/app/api/products/[slug]/reviews/route';
const state = vi.hoisted(() => ({ db: null as unknown, token: '' }));
vi.mock('@/db/client', () => ({ getDb: () => state.db }));
vi.mock('next/headers', () => ({ cookies: async () => ({ get: () => state.token ? { value: state.token } : undefined }), headers: async () => new Headers() }));
let client: PGlite, db: ReturnType<typeof drizzle<typeof schema>>, userId: string, otherId: string, token: string, unverified: string;
const request = (path: string, body?: unknown) => new Request('http://localhost:3005/api/' + path, { method: body === undefined ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json', 'x-session-id': '11111111-2222-4333-8555-666666666666' }, body: body === undefined ? undefined : JSON.stringify(body) });
beforeAll(async () => {
  const { pgcrypto } = await import('@electric-sql/pglite/contrib/pgcrypto');
  const { uuid_ossp } = await import('@electric-sql/pglite/contrib/uuid_ossp');
  client = new PGlite({ extensions: { pgcrypto, uuid_ossp } }); db = drizzle(client, { schema }); state.db = db;
  await migrate(db, { migrationsFolder: './drizzle' });
  const [user, other, pending] = await db.insert(schema.users).values([{ email: 'shopper@access.example', passwordHash: 'fixture', emailVerifiedAt: new Date() }, { email: 'other@access.example', passwordHash: 'fixture', emailVerifiedAt: new Date() }, { email: 'pending@access.example', passwordHash: 'fixture' }]).returning();
  userId = user.id; otherId = other.id;
  token = (await createSession(db as never, userId)).token;
  unverified = (await createSession(db as never, pending.id)).token;
  const [brand] = await db.insert(schema.brands).values({ name: 'Access brand', slug: 'access-brand' }).returning();
  const [category] = await db.insert(schema.categories).values({ name: 'Access category', slug: 'access-category' }).returning();
  const [product] = await db.insert(schema.products).values({ name: 'Saved product', slug: 'saved-product', brandId: brand.id, categoryId: category.id }).returning();
  await db.insert(schema.productVariants).values({ productId: product.id, sku: 'ACCESS-50', sizeLabel: '50ml', priceKobo: 12345 });
}, 120000);
afterAll(async () => { await client?.close(); });
describe('customer session boundaries and durable bag', () => {
  it('requires verified sign-in even when a guest session id is supplied', async () => {
    state.token = '';
    for (const [handler, req] of [[cartGet, request('cart')], [cartSync, request('cart/sync', { items: [] })], [checkout, request('checkout', {})], [posts, request('community/posts')], [chat, request('community/chat')]] as const) {
      expect((await handler(req)).status).toBe(401);
    }
    state.token = unverified;
    expect((await cartGet(request('cart'))).status).toBe(403);
    state.token = '';
    expect((await reviews(request('products/saved-product/reviews'), { params: Promise.resolve({ slug: 'saved-product' }) })).status).toBe(401);
  });
  it('saves exact selections with server prices and returns only the signed-in owner’s bag', async () => {
    state.token = token;
    const response = await cartSync(request('cart/sync', { expectedUserId: userId, items: [{ productId: 'saved-product', size: '50ml', quantity: 2 }] }));
    expect(response.status).toBe(200);
    const saved = await response.json();
    expect(saved.ownerId).toBe(userId);
    expect(saved.lines).toHaveLength(1);
    expect(saved.lines[0]).toMatchObject({ qty: 2, unitPriceKobo: 12345 });
    const reload = await cartGet(request('cart'));
    expect(reload.headers.get('cache-control')).toContain('no-store');
    expect((await reload.json()).ownerId).toBe(userId);
    expect((await reviews(request('products/saved-product/reviews'), { params: Promise.resolve({ slug: 'saved-product' }) })).status).toBe(200);
    state.token = (await createSession(db as never, otherId)).token;
    const otherBag = await (await cartGet(request('cart'))).json();
    expect(otherBag.ownerId).toBe(otherId); expect(otherBag.lines).toHaveLength(0);
  });
  it('rejects a stale account snapshot and preserves the prior cart if any line is invalid', async () => {
    state.token = token;
    expect((await cartSync(request('cart/sync', { expectedUserId: otherId, items: [] }))).status).toBe(409);
    const failed = await cartSync(request('cart/sync', { items: [{ productId: 'missing-product', size: '50ml', quantity: 1 }] }));
    expect(failed.status).not.toBe(200);
    const bag = await (await cartGet(request('cart'))).json();
    expect(bag.lines[0].qty).toBe(2);
  });
});
