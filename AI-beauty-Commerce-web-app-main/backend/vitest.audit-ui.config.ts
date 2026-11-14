import path from 'node:path';
import {defineConfig} from 'vitest/config';
export default defineConfig({resolve:{alias:{'@':path.resolve(__dirname,'src')}},test:{environment:'node',include:['tests/assistant-thread.browser.ts','tests/admin-mfa.browser.ts','tests/availability.browser.ts'],maxWorkers:1,minWorkers:1,testTimeout:20000,hookTimeout:60000}});
