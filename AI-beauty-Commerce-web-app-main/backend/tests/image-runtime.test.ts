import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { configureImageRuntime } from '@/lib/image-runtime';

describe('native image resource limits', () => {
  it('bounds the real Sharp module used by the image optimizer', () => {
    const previousThreads = sharp.concurrency();
    const previous = sharp.cache();
    try {
      configureImageRuntime();
      expect(sharp.concurrency()).toBe(1);
      const limits = sharp.cache();
      expect(limits.memory.max).toBe(8);
      expect(limits.files.max).toBe(0);
      expect(limits.items.max).toBe(32);
    } finally {
      sharp.concurrency(previousThreads);
      sharp.cache({ memory: previous.memory.max, files: previous.files.max, items: previous.items.max });
    }
  });
});
