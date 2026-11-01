import { afterEach, describe, expect, it, vi } from 'vitest';
const startup = vi.hoisted(() => ({ start: vi.fn() }));
vi.mock('@/worker/embedded-account-email', () => ({ startEmbeddedAccountEmail: startup.start }));
import { register } from '@/instrumentation';
afterEach(() => { vi.unstubAllEnvs(); startup.start.mockReset(); });
describe('only the launched node web runtime starts embedded email', () => {
  it.each([['nodejs', '0'], ['nodejs', ''], ['edge', '1']])('does not dispatch for runtime %s and marker %s', async (runtime, marker) => {
    vi.stubEnv('NEXT_RUNTIME', runtime); vi.stubEnv('DESLA_EMBEDDED_AUTH_EMAIL', marker);
    await register(); expect(startup.start).not.toHaveBeenCalled();
  });
  it('starts the in-process worker for the actual marked web process', async () => {
    vi.stubEnv('NEXT_RUNTIME', 'nodejs'); vi.stubEnv('DESLA_EMBEDDED_AUTH_EMAIL', '1');
    await register(); expect(startup.start).toHaveBeenCalledOnce();
  });
});
