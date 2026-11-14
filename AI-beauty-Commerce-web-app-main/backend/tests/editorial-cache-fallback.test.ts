import {beforeEach,expect,it,vi} from 'vitest';
const fixtures=vi.hoisted(()=>({read:vi.fn()}));
vi.mock('next/cache',()=>({unstable_cache:()=>async()=>{throw Error('incremental cache unavailable')}}));
vi.mock('@/db/client',()=>({getDb:()=>({})}));
vi.mock('@/modules/workspaces/storefront',()=>({readStorefront:fixtures.read}));
import {getStorefrontSeed} from '@/lib/server-storefront';
beforeEach(()=>{fixtures.read.mockReset();});
it('reads the actual CMS when the Next cache context is unavailable',async()=>{fixtures.read.mockResolvedValue({version:3,config:null});await expect(getStorefrontSeed()).resolves.toEqual({version:3,config:null});expect(fixtures.read).toHaveBeenCalledOnce();});
it('degrades to an empty seed when cache and database are both unavailable',async()=>{fixtures.read.mockRejectedValue(Error('offline'));await expect(getStorefrontSeed()).resolves.toEqual({version:0,config:null});});
