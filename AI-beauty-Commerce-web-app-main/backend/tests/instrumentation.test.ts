import { afterEach, describe, expect, it, vi } from 'vitest';
const startup = vi.hoisted(() => ({ start: vi.fn(), configureImages: vi.fn(), commissions: vi.fn() }));
vi.mock('@/worker/embedded-account-email', () => ({ startEmbeddedAccountEmail: startup.start }));
vi.mock('@/worker/embedded-commissions', () => ({ startEmbeddedCommissions: startup.commissions }));
vi.mock('@/lib/image-runtime', () => ({ configureImageRuntime: startup.configureImages }));
import { register } from '@/instrumentation';
afterEach(() => { vi.unstubAllEnvs(); startup.start.mockReset(); startup.configureImages.mockReset(); startup.commissions.mockReset(); });
describe('only the launched node web runtime starts embedded email', () => {
  it.each([['nodejs', '0'], ['nodejs', ''], ['edge', '1']])('does not dispatch for runtime %s and marker %s', async (runtime, marker) => {
    vi.stubEnv('NEXT_RUNTIME', runtime); vi.stubEnv('DESLA_EMBEDDED_AUTH_EMAIL', marker);
    await register(); expect(startup.start).not.toHaveBeenCalled();
  });
  it('starts the in-process worker for the actual marked web process', async () => {
    vi.stubEnv('NEXT_RUNTIME', 'nodejs'); vi.stubEnv('DESLA_EMBEDDED_AUTH_EMAIL', '1');
    await register(); expect(startup.start).toHaveBeenCalledOnce();
    expect(startup.configureImages).toHaveBeenCalledOnce();
  });
});

it('starts commissions independently of email only in the marked node web process',async()=>{
 vi.stubEnv('NEXT_RUNTIME','nodejs');vi.stubEnv('DESLA_EMBEDDED_AUTH_EMAIL','0');vi.stubEnv('DESLA_EMBEDDED_COMMISSIONS','1');
 await register();expect(startup.commissions).toHaveBeenCalledOnce();expect(startup.start).not.toHaveBeenCalled();
 startup.commissions.mockClear();vi.stubEnv('NEXT_RUNTIME','edge');await register();expect(startup.commissions).not.toHaveBeenCalled();
});
