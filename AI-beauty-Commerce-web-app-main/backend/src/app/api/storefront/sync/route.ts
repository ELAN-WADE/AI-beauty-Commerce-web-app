import { subscribeStorefrontSync } from '@/lib/storefront-revalidate';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const encoder = new TextEncoder();
  let stop = () => {};
  const stream = new ReadableStream({
    start(controller) {
      let closed = false;
      let unsubscribe = () => {};
      let heartbeat: ReturnType<typeof setInterval> | undefined;
      stop = () => {
        if (closed) return;
        closed = true;
        clearInterval(heartbeat);
        unsubscribe();
        req.signal.removeEventListener('abort', stop);
        try { controller.close(); } catch { /* The consumer already cancelled. */ }
      };
      const send = (message: string) => {
        if (closed) return;
        // Slow/disconnected consumers must not retain an unbounded event queue.
        // A reconnect refreshes saved content, so no business event is lost.
        if ((controller.desiredSize ?? 0) <= 0) { stop(); return; }
        try { controller.enqueue(encoder.encode(message)); } catch { stop(); }
      };
      if (req.signal.aborted) { stop(); return; }
      req.signal.addEventListener('abort', stop, { once: true });
      send(`retry: 15000\nevent: connected\ndata: {"status":"connected"}\n\n`);
      unsubscribe = subscribeStorefrontSync(event => send(`event: sync\ndata: ${JSON.stringify(event)}\n\n`));
      heartbeat = setInterval(() => send(': heartbeat\n\n'), 25000);
      heartbeat.unref?.();
    },
    // HTTP stream cancellation does not always fire Request.signal on every
    // adapter. Both paths must release the listener, timer and captured request.
    cancel() { stop(); },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

