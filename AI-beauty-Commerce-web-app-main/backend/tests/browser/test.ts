export { appOrigin, apiOrigin } from './browser-env';
import { test as base } from '@playwright/test';
export { expect } from '@playwright/test';
export type { Page } from '@playwright/test';
// Freeze only Next development refresh messages during an acceptance journey.
// Source edits in other tasks must not discard a form midway through the test.
// All application HTTP requests, cookies, database writes and permissions are real.
export const test = base.extend({
  context: async ({ context }, use) => {
    await context.routeWebSocket(/\/_next\/webpack-hmr(?:\?|$)/, () => {});
    await use(context);
  },
});
