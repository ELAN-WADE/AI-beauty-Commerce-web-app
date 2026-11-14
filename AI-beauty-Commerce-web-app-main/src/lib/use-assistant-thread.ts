import { useCallback, useEffect, useRef, useState } from 'react';
import { aiChat, apiFetch, resetAiConversation, type ChatMsg } from './owned-api';
import { authSessionRevision } from './auth-session';

const emptyMessages: ChatMsg[] = [];

/** Account changes hide the previous thread immediately and discard delayed replies. */
export function useAssistantThread(owner: string | null, mode: 'guest' | 'account') {
  const identity = useRef({ owner });
  if (identity.current.owner !== owner) identity.current = { owner };
  const [thread, setThread] = useState<{ identity: object; messages: ChatMsg[] }>({ identity: identity.current, messages: [] });
  const [pending, setPending] = useState<object | null>(null);
  const pendingRef = useRef<object | null>(null);
  const send = useCallback(async (text: string) => {
    const content = text.trim();
    const requestIdentity = identity.current;
    if (!content || pendingRef.current === requestIdentity || mode === 'account' && !owner) return;
    const session = authSessionRevision();
    const active = () => identity.current === requestIdentity && session === authSessionRevision();
    pendingRef.current = requestIdentity; setPending(requestIdentity);
    const message: ChatMsg = { id: crypto.randomUUID(), sender: 'user', text: content, timestamp: 'Just now' };
    setThread(previous => ({ identity: requestIdentity, messages: [...(previous.identity === requestIdentity ? previous.messages : []), message] }));
    try {
      let assistant: ChatMsg;
      if (mode === 'account') assistant = (await aiChat(content, owner!)).assistant;
      else {
        const reply = await apiFetch<{ text: string; recommendedProductIds: string[] }>('/api/ai/guest-chat', { method: 'POST', body: JSON.stringify({ content }) });
        assistant = { id: crypto.randomUUID(), sender: 'assistant', text: reply.text, timestamp: 'Just now', recommendedProductIds: reply.recommendedProductIds };
      }
      if (active()) setThread(previous => previous.identity === requestIdentity ? { ...previous, messages: [...previous.messages, assistant] } : previous);
    } catch (error) {
      if (active()) setThread(previous => previous.identity === requestIdentity ? { ...previous, messages: [...previous.messages, { id: crypto.randomUUID(), sender: 'assistant', text: error instanceof Error ? error.message : 'The assistant is unavailable. Please try again.', timestamp: 'Just now' }] } : previous);
    } finally {
      if (pendingRef.current === requestIdentity) { pendingRef.current = null; setPending(null); }
    }
  }, [owner, mode]);
  const reset = useCallback(() => {
    if (mode === 'account' && owner) resetAiConversation(owner);
    identity.current = { owner };
    pendingRef.current = null; setPending(null);
    setThread({ identity: identity.current, messages: [] });
  }, [owner, mode]);
  return { reset, messages: thread.identity === identity.current ? thread.messages : emptyMessages, busy: pending === identity.current, send };
}

/** Configuration indicator only; it never claims a successful model response. */
export function useAssistantAvailability() {
  const [configured, setConfigured] = useState(false);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    void apiFetch<{ available: boolean }>('/api/ai/guest-chat', { signal: controller.signal })
      .then(result => { if (active) setConfigured(result.available === true); })
      .catch(() => { if (active) setConfigured(false); });
    return () => { active = false; controller.abort(); };
  }, []);
  return configured;
}
