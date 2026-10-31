import { EventEmitter } from 'node:events';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const { spawn } = vi.hoisted(() => ({ spawn: vi.fn() }));
vi.mock('node:child_process', () => ({ spawn }));
import { superviseAccountEmail } from '../scripts/auth-email-supervisor.mjs';

type Child = EventEmitter & { exitCode: number | null; kill: ReturnType<typeof vi.fn> };
let children: Child[];
let stop: (() => void) | undefined;
beforeEach(() => {
  vi.useFakeTimers(); children = []; stop = undefined;
  vi.spyOn(console, 'error').mockImplementation(() => {});
  spawn.mockImplementation(() => {
    const child = Object.assign(new EventEmitter(), { exitCode: null, kill: vi.fn() }) as Child;
    children.push(child); return child;
  });
});
afterEach(() => { stop?.(); vi.clearAllTimers(); vi.useRealTimers(); vi.restoreAllMocks(); spawn.mockReset(); });

describe('embedded account-email dispatcher', () => {
  it('starts only the account dispatcher with the existing backend', () => {
    stop = superviseAccountEmail('/srv/backend');
    expect(spawn).toHaveBeenCalledWith(process.execPath, ['--import', 'tsx', 'scripts/auth-email-worker.ts'], expect.objectContaining({ cwd: '/srv/backend', windowsHide: true }));
    expect(children).toHaveLength(1);
    expect(spawn.mock.calls[0][2].env.DATABASE_POOL_MAX).toBe('2');
  });
  it('restarts after failure with backoff and handles error/exit only once', () => {
    stop = superviseAccountEmail('/srv/backend');
    children[0].emit('error', new Error('test')); children[0].emit('exit', 1);
    vi.advanceTimersByTime(1000); expect(children).toHaveLength(2);
    children[1].emit('exit', 1); vi.advanceTimersByTime(1999); expect(children).toHaveLength(2);
    vi.advanceTimersByTime(1); expect(children).toHaveLength(3);
  });
  it('cancels a scheduled restart when the web service shuts down', () => {
    stop = superviseAccountEmail('/srv/backend');
    children[0].emit('exit', 1); stop(); vi.advanceTimersByTime(30000);
    expect(children).toHaveLength(1);
  });
  it('allows graceful shutdown and never restarts after stopping', () => {
    stop = superviseAccountEmail('/srv/backend'); stop(); stop();
    expect(children[0].kill).toHaveBeenCalledTimes(1);
    expect(children[0].kill).toHaveBeenCalledWith('SIGTERM');
    children[0].exitCode = 0; children[0].emit('exit', 0); vi.advanceTimersByTime(30000);
    expect(children[0].kill).toHaveBeenCalledTimes(1); expect(children).toHaveLength(1);
  });
  it('terminates an unresponsive dispatcher after its shutdown deadline', () => {
    stop = superviseAccountEmail('/srv/backend'); stop(); vi.advanceTimersByTime(10000);
    expect(children[0].kill).toHaveBeenLastCalledWith('SIGKILL');
  });
});
