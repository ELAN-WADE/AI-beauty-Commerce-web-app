import { afterEach, describe, expect, it, vi } from 'vitest';
const fixture = vi.hoisted(() => ({ getDb: vi.fn(() => ({ shared: true })), closeDb: vi.fn(), dispatch: vi.fn(), sender: { name: 'fixture' } }));
vi.mock('@/db/client', () => ({ getDb: fixture.getDb, closeDb: fixture.closeDb }));
vi.mock('@/lib/email', () => ({ getEmailSender: () => fixture.sender }));
vi.mock('@/modules/notifications/account-dispatcher', () => ({ dispatchAccountEmails: fixture.dispatch }));
import { startEmbeddedAccountEmail } from '@/worker/embedded-account-email';
const globalState = globalThis as typeof globalThis & { __deslaEmbeddedAccountEmail?: ReturnType<typeof startEmbeddedAccountEmail> };

afterEach(async () => {
  globalState.__deslaEmbeddedAccountEmail?.stop();
  await globalState.__deslaEmbeddedAccountEmail?.done;
  delete globalState.__deslaEmbeddedAccountEmail;
  vi.useRealTimers(); vi.restoreAllMocks(); fixture.getDb.mockClear(); fixture.closeDb.mockClear(); fixture.dispatch.mockReset();
});
function waitForShutdown(_db: unknown, _sender: unknown, options: { signal: AbortSignal }) {
  return new Promise<boolean>(resolve => options.signal.addEventListener('abort', () => resolve(true), { once: true }));
}
describe('embedded email shares the existing web runtime', () => {
  it('starts once per process and never closes the web database on shutdown', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    fixture.dispatch.mockImplementation(waitForShutdown);
    const before = process.listenerCount('SIGTERM');
    const first = startEmbeddedAccountEmail();
    expect(startEmbeddedAccountEmail()).toBe(first);
    expect(fixture.dispatch).toHaveBeenCalledOnce();
    expect(fixture.getDb).toHaveBeenCalledOnce();
    first.stop(); await first.done;
    expect(fixture.closeDb).not.toHaveBeenCalled();
    expect(process.listenerCount('SIGTERM')).toBe(before);
  });
  it('retries a failed email provider without terminating the web process', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    fixture.dispatch.mockRejectedValueOnce(Object.assign(new Error('private provider detail'), { code: 'ECONNECTION' })).mockImplementation(waitForShutdown);
    const worker = startEmbeddedAccountEmail();
    await vi.waitFor(() => expect(fixture.dispatch).toHaveBeenCalledTimes(2), { timeout: 2500 });
    expect(console.error).toHaveBeenCalledWith(expect.not.stringContaining('private provider detail'));
    worker.stop(); await worker.done;
  });
});
