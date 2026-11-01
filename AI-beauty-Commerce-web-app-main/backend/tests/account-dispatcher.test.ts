import { afterEach, describe, expect, it, vi } from 'vitest';
const queue = vi.hoisted(() => ({ claimBatch: vi.fn(), discardAuthEmail: vi.fn(), markFailed: vi.fn(), markSent: vi.fn(), recoverStaleSending: vi.fn(), pendingAccountEmail: vi.fn() }));
vi.mock('@/modules/notifications/service', () => queue);
vi.mock('@/modules/notifications/account-email', () => ({ ACCOUNT_EMAIL_TEMPLATES: ['auth.verify-email', 'auth.reset-password', 'partner.application-decision'], pendingAccountEmail: queue.pendingAccountEmail }));
import { dispatchAccountEmails } from '@/modules/notifications/account-dispatcher';
const db = {} as never;
afterEach(() => { vi.resetAllMocks(); vi.restoreAllMocks(); });
describe('account-email dispatcher keeps durable outbox semantics', () => {
  it('only delivers valid claimed account messages and records their outcome', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {}); vi.spyOn(console, 'error').mockImplementation(() => {});
    queue.claimBatch.mockResolvedValue([{ id: 'expired', template: 'auth.verify-email' }, { id: 'valid', template: 'auth.verify-email' }, { id: 'failed', template: 'auth.reset-password' }]);
    queue.pendingAccountEmail.mockResolvedValueOnce(null).mockResolvedValue({ to: 'fixture@example.test', subject: 'Fixture', text: 'Not delivered externally' });
    const sender = { name: 'fixture', verify: vi.fn(), send: vi.fn().mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('Unavailable')) };
    expect(await dispatchAccountEmails(db, sender, { signal: new AbortController().signal, once: true })).toBe(true);
    expect(queue.claimBatch).toHaveBeenCalledWith(db, 10, expect.objectContaining({ templates: expect.arrayContaining(['auth.verify-email']) }));
    expect(queue.discardAuthEmail).toHaveBeenCalledWith(db, 'expired');
    expect(queue.markSent).toHaveBeenCalledWith(db, 'valid');
    expect(queue.markFailed).toHaveBeenCalledWith(db, 'failed');
    expect(sender.send).toHaveBeenCalledTimes(2);
  });
  it('never substitutes log delivery for a working verification provider', async () => {
    await expect(dispatchAccountEmails(db, { name: 'log', send: vi.fn() }, { signal: new AbortController().signal, once: true })).rejects.toMatchObject({ code: 'EMAIL_PROVIDER_REQUIRED' });
    expect(queue.claimBatch).not.toHaveBeenCalled();
  });
});
