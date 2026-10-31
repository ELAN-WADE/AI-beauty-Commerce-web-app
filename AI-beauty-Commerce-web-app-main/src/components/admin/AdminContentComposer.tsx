import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { apiFetch, uploadProductMediaApi } from '../../lib/owned-api';
export function AdminContentComposer() {
  const { products, navigateTo, authUser } = useApp();
  const [content, setContent] = useState(''), [media, setMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null), [productSlug, setProductSlug] = useState('');
  const [busy, setBusy] = useState(false), [uploading, setUploading] = useState(false), [message, setMessage] = useState('');
  const retry = useRef<{ body: string; key: string } | null>(null);
  const [posts, setPosts] = useState<{ id: string; content: string; authorName: string; visible: boolean }[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null), [reviewError, setReviewError] = useState(''), [refresh, setRefresh] = useState(0);
  const generation = useRef(0);
  async function loadPosts(cursor?: string) {
    const attempt = ++generation.current;
    try {
      const result = await apiFetch<{ posts: typeof posts; nextCursor: string | null }>('/api/admin/community/posts' + (cursor ? '?cursor=' + encodeURIComponent(cursor) : ''));
      if (attempt !== generation.current) return;
      setPosts(previous => cursor ? [...previous, ...result.posts.filter(post => !previous.some(existing => existing.id === post.id))] : result.posts); setNextCursor(result.nextCursor); setReviewError('');
    } catch (error) { if (attempt === generation.current) setReviewError(error instanceof Error ? error.message : 'Could not load community posts.'); }
  }
  useEffect(() => { setPosts([]); void loadPosts(); return () => { generation.current++; }; }, [authUser?.id, refresh]);
  async function moderate(id: string, visible: boolean) {
    try { await apiFetch('/api/admin/community/posts/' + id, { method: 'PATCH', body: JSON.stringify({ visible }) }); setRefresh(value => value + 1); }
    catch (error) { setReviewError(error instanceof Error ? error.message : 'Moderation failed.'); }
  }
  async function upload(file?: File) {
    if (!file) return;
    setUploading(true); setMessage('');
    try { const saved = await uploadProductMediaApi(file); setMedia({ url: saved.url, type: saved.mimeType.startsWith('video/') ? 'video' : 'image' }); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Upload failed.'); }
    finally { setUploading(false); }
  }
  async function publish() {
    if (!content.trim() || busy || uploading) return;
    setBusy(true); setMessage('');
    const body = JSON.stringify({ content: content.trim(), ...(media ? { mediaType: media.type, mediaUrl: media.url } : {}), ...(productSlug ? { productSlug } : {}) });
    if (retry.current?.body !== body) retry.current = { body, key: crypto.randomUUID() };
    try {
      await apiFetch('/api/admin/community/posts', { method: 'POST', body, headers: { 'Idempotency-Key': retry.current.key } });
      setMessage('Published to the signed-in community feed.'); setContent(''); setMedia(null); setProductSlug(''); retry.current = null;
      setRefresh(value => value + 1);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Publication failed. Your draft is preserved.'); }
    finally { setBusy(false); }
  }
  return <section className="p-6 rounded-3xl bg-white border border-[#EAE8E3] space-y-4">
    <h3 className="font-heading font-bold">Publish community content</h3>
    <label className="block text-xs">Post text<textarea aria-label="Post text" disabled={busy} value={content} maxLength={2000} rows={5} onChange={e => setContent(e.target.value)} className="block mt-2 w-full rounded-xl border border-[#EAE8E3] bg-[#FAF9F6] p-4" /></label>
    <label className="block text-xs">Image or video<input aria-label="Post media" disabled={busy || uploading} type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" onChange={e => { void upload(e.target.files?.[0]); e.target.value = ''; }} className="mt-2 block" /></label>
    {media && <div className="space-y-2">{media.type === 'video' ? <video src={media.url} controls preload="metadata" className="max-h-72 rounded-2xl" /> : <img src={media.url} alt="Post media preview" className="max-h-72 rounded-2xl" />}<button type="button" disabled={busy} onClick={() => setMedia(null)} className="text-xs underline">Remove media</button></div>}
    <label className="block text-xs">Tag a product<select value={productSlug} disabled={busy} onChange={e => setProductSlug(e.target.value)} className="block mt-2 w-full rounded-xl border bg-[#FAF9F6] p-3"><option value="">No product</option>{products.map(product => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label>
    <div className="flex gap-4 items-center"><button type="button" disabled={busy || uploading || !content.trim()} onClick={() => void publish()} className="rounded-full bg-[#0F0F10] px-6 py-3 text-white text-xs disabled:opacity-40">{uploading ? 'Uploading…' : busy ? 'Publishing…' : 'Publish post'}</button><button type="button" onClick={() => navigateTo('community')} className="underline text-xs">View community</button></div>
    {message && <p role="status" className="text-sm">{message}</p>}
    <div className="space-y-3 pt-5 border-t border-[#EAE8E3]"><h3 className="font-heading font-bold">Review community posts</h3>
      {reviewError && <p role="alert" className="text-xs text-rose-700">{reviewError} <button className="underline" onClick={() => setRefresh(value => value + 1)}>Retry posts</button></p>}
      {posts.map(post => <article key={post.id} className="rounded-2xl border border-[#EAE8E3] p-4 space-y-2"><p className="text-xs font-semibold">{post.authorName} · {post.visible ? 'Published' : 'Hidden'}</p><p className="text-sm whitespace-pre-wrap">{post.content}</p><button type="button" className="text-xs underline min-h-11" onClick={() => void moderate(post.id, !post.visible)}>{post.visible ? 'Hide post' : 'Restore post'}</button></article>)}
      {nextCursor && <button type="button" className="text-xs underline min-h-11" onClick={() => void loadPosts(nextCursor)}>Load older posts</button>}
    </div>
  </section>;
}
