import { afterAll, beforeAll, beforeEach, expect, it, vi } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { eq } from 'drizzle-orm';
import * as schema from '@/db/schema';
import { createConversation, getMessages, postMessage } from '@/modules/ai/service';
const provider = vi.hoisted(() => ({ chat: vi.fn() }));
vi.mock('@/lib/ai-provider', () => ({ getAiProvider: () => ({ name: 'gemini', chat: provider.chat }) }));
let client: PGlite, db: ReturnType<typeof drizzle<typeof schema>>, user: string, other: string;
const pg = () => db as never;
beforeAll(async () => {
  const { pgcrypto } = await import('@electric-sql/pglite/contrib/pgcrypto'); const { uuid_ossp } = await import('@electric-sql/pglite/contrib/uuid_ossp');
  client = new PGlite({ extensions: { pgcrypto, uuid_ossp } }); db = drizzle(client, { schema }); await migrate(db, { migrationsFolder: './drizzle' });
  const people = await db.insert(schema.users).values(['owner','other'].map(name => ({ email:name+'@ai-thread.test', passwordHash:'fixture' }))).returning(); [user,other] = people.map(row => row.id);
}, 120000);
beforeEach(() => { provider.chat.mockReset().mockResolvedValue('Catalogue-grounded reply.'); });
afterAll(async () => { await client?.close(); });
it('uses the latest context and saves a correctly ordered complete turn', async () => {
  const conversation = await createConversation(pg(), user, 'History');
  await db.insert(schema.aiMessages).values(Array.from({ length:14 }, (_, index) => ({ conversationId:conversation.id, role:index%2?'assistant':'user', content:'message-'+index, createdAt:new Date(1000+index) })));
  const result = await postMessage(pg(), user, conversation.id, 'Current request');
  const history = provider.chat.mock.calls[0][0].history;
  expect(history.map((message: {content:string}) => message.content)).toEqual([...Array.from({length:9},(_,index)=>'message-'+(index+5)), 'Current request']);
  expect(result.userMessage.createdAt.getTime()).toBeLessThan(result.assistantMessage.createdAt.getTime());
  const messages = await getMessages(pg(),user,conversation.id); expect(messages.slice(-2).map(row=>row.role)).toEqual(['user','assistant']);
});
it('does not leave a partial message or mutate conversation time when the provider fails', async () => {
  const conversation = await createConversation(pg(), user, 'Failure'); provider.chat.mockRejectedValue(new Error('upstream unavailable'));
  await expect(postMessage(pg(), user, conversation.id, 'Please help')).rejects.toMatchObject({ status:503,code:'assistant_unavailable',retryable:true });
  expect(await getMessages(pg(), user, conversation.id)).toEqual([]);
  const [unchanged] = await db.select().from(schema.aiConversations).where(eq(schema.aiConversations.id,conversation.id)); expect(unchanged.updatedAt).toEqual(conversation.updatedAt);
});
it('rejects another account before calling the provider',async()=>{
  const conversation=await createConversation(pg(),user,'Owned');
  await expect(postMessage(pg(),other,conversation.id,'Read this')).rejects.toMatchObject({status:404});
  await expect(getMessages(pg(),other,conversation.id)).rejects.toMatchObject({status:404});expect(provider.chat).not.toHaveBeenCalled();
});
it('returns the latest 100 messages in chronological order',async()=>{
  const conversation=await createConversation(pg(),user,'Long thread');
  await db.insert(schema.aiMessages).values(Array.from({length:110},(_,index)=>({conversationId:conversation.id,role:index%2?'assistant':'user',content:String(index),createdAt:new Date(1000+index)})));
  const messages=await getMessages(pg(),user,conversation.id); expect(messages).toHaveLength(100); expect(messages[0].content).toBe('10');expect(messages[99].content).toBe('109');
});
