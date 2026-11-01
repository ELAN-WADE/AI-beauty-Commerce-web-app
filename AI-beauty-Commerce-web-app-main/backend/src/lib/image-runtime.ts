import sharp from 'sharp';

/** Next's image optimizer uses the same external Sharp module. Limit native
 * cache/thread memory without changing any image dimensions or storefront UI. */
export function configureImageRuntime() {
  sharp.concurrency(1);
  sharp.cache({ memory: 8, files: 0, items: 32 });
}
