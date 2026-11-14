import { afterEach,beforeEach,describe,expect,it,vi } from 'vitest';
const clients=[['hosted',()=>import('../src/storefront/lib/owned-api')],['root',()=>import('../../src/lib/owned-api')]] as const;
let fetcher:ReturnType<typeof vi.fn>,storage:Map<string,string>;
beforeEach(()=>{vi.resetModules();storage=new Map();vi.stubGlobal('window',Object.assign(new EventTarget(),{location:new URL('https://shop.example.test/ask-ai')}));vi.stubGlobal('localStorage',{getItem:(key:string)=>storage.get(key)??null,setItem:(key:string,value:string)=>storage.set(key,value),removeItem:(key:string)=>storage.delete(key)});fetcher=vi.fn();vi.stubGlobal('fetch',fetcher);});
afterEach(()=>{vi.unstubAllGlobals();vi.restoreAllMocks();});
const reply=(content='Reply')=>Response.json({userMessage:{id:'u',content:'Request'},assistantMessage:{id:'a',content},grounded:[],provider:'gemini'});
describe.each(clients)('%s account-scoped AI threads',(_name,load)=>{
 it('never reuses a previous account or legacy global conversation',async()=>{
  storage.set('glowly-ai-conv','legacy');storage.set('desla-ai-conversation:alice','alice-thread');
  fetcher.mockResolvedValueOnce(Response.json({conversation:{id:'bob-thread'}})).mockResolvedValueOnce(reply());
  const {aiChat}=await load();await aiChat('Request','bob');
  expect(fetcher.mock.calls[1][0]).toContain('/bob-thread/messages');expect(storage.get('desla-ai-conversation:alice')).toBe('alice-thread');expect(storage.has('glowly-ai-conv')).toBe(false);
 });
 it('recovers a deleted conversation once without retrying other failures',async()=>{
  storage.set('desla-ai-conversation:alice','removed');fetcher.mockResolvedValueOnce(Response.json({error:{code:'not_found',message:'Gone'}},{status:404})).mockResolvedValueOnce(Response.json({conversation:{id:'fresh'}})).mockResolvedValueOnce(reply());
  const {aiChat}=await load();await expect(aiChat('Request','alice')).resolves.toMatchObject({provider:'gemini'});expect(fetcher).toHaveBeenCalledTimes(3);expect(storage.get('desla-ai-conversation:alice')).toBe('fresh');
  fetcher.mockResolvedValueOnce(Response.json({error:{code:'assistant_unavailable',message:'Unavailable'}},{status:503}));await expect(aiChat('Again','alice')).rejects.toMatchObject({status:503});expect(fetcher).toHaveBeenCalledTimes(4);
 });
 it('restarts only the requested account and ignores late thread creation',async()=>{
  storage.set('desla-ai-conversation:bob','keep-bob');let release:(response:Response)=>void;fetcher.mockImplementationOnce(()=>new Promise<Response>(resolve=>{release=resolve}));
  const {aiChat,resetAiConversation}=await load();const pending=aiChat('Request','alice').catch(error=>error);resetAiConversation('alice');release!(Response.json({conversation:{id:'old-thread'}}));expect(await pending).toMatchObject({code:'conversation_changed'});expect(storage.has('desla-ai-conversation:alice')).toBe(false);expect(storage.get('desla-ai-conversation:bob')).toBe('keep-bob');
 });
 it('discards a thread creation that completes after sign-out',async()=>{
  let release:(response:Response)=>void;fetcher.mockImplementationOnce(()=>new Promise<Response>(resolve=>{release=resolve})).mockResolvedValueOnce(Response.json({ok:true}));
  const {aiChat,apiFetch}=await load();const pending=aiChat('Request','alice');const outcome=pending.catch(error=>error);await apiFetch('/api/auth/logout',{method:'POST'});release!(Response.json({conversation:{id:'old-session'}}));expect(await outcome).toMatchObject({code:'session_changed'});expect(storage.has('desla-ai-conversation:alice')).toBe(false);expect(fetcher).toHaveBeenCalledTimes(2);
 });
});
