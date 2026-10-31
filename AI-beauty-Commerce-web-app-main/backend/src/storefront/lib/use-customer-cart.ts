import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CartItem, Product } from '../types';
import { apiFetch, mapOwned, syncCartToServer } from './owned-api';
import { cartFromServer, claimPendingBag, readPendingBag, rememberPendingBag, validChoices, type CartChoice, type SavedCartLine } from './customer-journey';

type AddChoice = { product: Product; size?: string; quantity?: number; fulfillmentType?: 'local' | 'central' };
export function useCustomerCart({ userId, authLoading, onSignIn, onResumed, catalogue }: {
  userId?: string; authLoading: boolean; onSignIn: (returnTo?: string) => void; onResumed: () => void; catalogue: Product[];
}) {
  const [state, setState] = useState<{ owner?: string; items: CartItem[] }>({ items: [] });
  const [readyOwner, setReadyOwner] = useState<string>();
  const [cartError, setCartError] = useState('');
  const [cartSaving, setCartSaving] = useState(false);
  const [revision, setRevision] = useState(0);
  const [retry, setRetry] = useState(0);
  const [requested, setRequested] = useState(false);
  const [isAddToCartSheetOpen, setIsAddToCartSheetOpen] = useState(false);
  const [lastAddedCartItem, setLastAddedCartItem] = useState<CartItem | null>(null);
  const owner = useRef(userId);
  const snapshot = useRef<CartItem[]>([]);
  const sequence = useRef(0);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const dirty = useRef(false);
  const cartItems = useMemo(() => state.owner === userId && userId ? state.items.map(item => ({ ...item, product: catalogue.find(product => product.id === item.productId) || item.product })) : [], [state, userId, catalogue]);
  const cartReady = !!userId && readyOwner === userId;

  useEffect(() => {
    owner.current = userId;
    snapshot.current = []; dirty.current = false; sequence.current++;
    setState({ owner: userId, items: [] }); setReadyOwner(undefined); setCartError(''); setCartSaving(false);
    setIsAddToCartSheetOpen(false); setLastAddedCartItem(null);
    if (!userId) return;
    let cancelled = false;
    apiFetch<{ ownerId: string; lines: SavedCartLine[] }>('/api/cart').then(view => {
      if (cancelled || owner.current !== userId) return;
      if (view.ownerId !== userId) throw new Error('Your account changed. Refresh your bag.');
      const items = cartFromServer(view.lines, []);
      snapshot.current = items; setState({ owner: userId, items }); setReadyOwner(userId);
    }).catch(error => { if (!cancelled) setCartError(error instanceof Error ? error.message : 'Could not load your bag. Retry before changing it.'); });
    return () => { cancelled = true; };
  }, [userId, retry]);

  const commit = useCallback((items: CartItem[]) => {
    snapshot.current = items; sequence.current++; dirty.current = true;
    setState({ owner: userId, items }); setRevision(value => value + 1);
  }, [userId]);

  const save = useCallback(async () => {
    if (!userId || owner.current !== userId || !cartReady) throw new Error('Wait for your account bag to load.');
    const items = snapshot.current; const version = sequence.current;
    const work = queue.current.catch(() => {}).then(async () => {
      if (owner.current !== userId || sequence.current !== version) return;
      setCartSaving(true);
      try {
        const saved = await syncCartToServer(items.map(item => ({ productId: item.productId, size: item.size, quantity: item.quantity })), userId);
        if (owner.current !== userId || sequence.current !== version) return;
        const mapped = cartFromServer(saved.lines, items.map(item => item.product));
        snapshot.current = mapped; dirty.current = false; setState({ owner: userId, items: mapped }); setCartError('');
      } catch (error) {
        if (owner.current === userId) setCartError(error instanceof Error ? error.message : 'Your bag could not be saved. Retry before checkout.');
        throw error;
      } finally { if (owner.current === userId) setCartSaving(false); }
    });
    queue.current = work;
    await work;
  }, [userId, cartReady]);

  useEffect(() => {
    if (!cartReady || !dirty.current) return;
    const timer = setTimeout(() => { void save().catch(() => {}); }, 250);
    return () => clearTimeout(timer);
  }, [cartReady, revision, save]);

  const append = useCallback((choices: AddChoice[]) => {
    const items = [...snapshot.current];
    for (const choice of choices) {
      const size = choice.size || choice.product.sizes[0] || 'Standard';
      const index = items.findIndex(item => item.productId === choice.product.id && item.size === size);
      const quantity = Math.min(99, (index >= 0 ? items[index].quantity : 0) + (choice.quantity || 1));
      const item: CartItem = { id: index >= 0 ? items[index].id : crypto.randomUUID(), productId: choice.product.id, product: choice.product, size, quantity, unitPrice: index >= 0 ? items[index].unitPrice : choice.product.price, fulfillmentType: choice.fulfillmentType || 'local' };
      if (index >= 0) items[index] = item; else items.push(item);
      setLastAddedCartItem(item);
    }
    commit(items);
  }, [commit]);

  const addToCartBatch = useCallback((choices: AddChoice[]): boolean => {
    const selections: CartChoice[] = choices.map(choice => ({ productId: choice.product.id, size: choice.size || choice.product.sizes[0] || 'Standard', quantity: choice.quantity ?? 1, fulfillmentType: choice.fulfillmentType }));
    if (!validChoices(selections)) { setCartError('Choose a valid product, size and quantity.'); return false; }
    if (!userId || !cartReady) {
      try { rememberPendingBag(selections); setRequested(true); }
      catch { setCartError('Your selection could not be saved in this browser. Enable session storage and try again.'); }
      return false;
    }
    append(choices); return true;
  }, [userId, cartReady, authLoading, onSignIn, append]);
  const addToCart = useCallback((product: Product, size = 'Standard', quantity = 1, fulfillmentType: 'local' | 'central' = 'local') =>
    addToCartBatch([{ product, size, quantity, fulfillmentType }]), [addToCartBatch]);

  useEffect(() => {
    if (requested && !userId && !authLoading) { setRequested(false); onSignIn('/cart'); }
  }, [requested, userId, authLoading, onSignIn]);
  useEffect(() => {
    if (!userId || !cartReady) return;
    const pending = readPendingBag();
    if (!pending) return;
    let cancelled = false;
    Promise.all(pending.items.map(async choice => ({
      ...choice, product: mapOwned(await apiFetch<any>('/api/products/' + encodeURIComponent(choice.productId))),
    }))).then(choices => {
      if (cancelled || owner.current !== userId || !claimPendingBag(pending.id)) return;
      append(choices); setRequested(false); onResumed();
    }).catch(error => {
      if (!cancelled && owner.current === userId) setCartError(error instanceof Error ? error.message : 'Your selected product could not be loaded. Retry your bag or choose it again from the catalogue.');
    });
    return () => { cancelled = true; };
  }, [userId, cartReady, append, onResumed]);

  const removeFromCart = useCallback((id: string) => { if (cartReady) commit(snapshot.current.filter(item => item.id !== id)); }, [cartReady, commit]);
  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (!cartReady || !Number.isInteger(quantity) || quantity > 99) return;
    commit(quantity <= 0 ? snapshot.current.filter(item => item.id !== id) : snapshot.current.map(item => item.id === id ? { ...item, quantity } : item));
  }, [cartReady, commit]);
  const clearCart = useCallback(() => { if (cartReady) commit([]); }, [cartReady, commit]);
  const closeAddToCartSheet = useCallback(() => setIsAddToCartSheetOpen(false), []);
  const retryCart = useCallback(() => { if (cartReady) void save().catch(() => {}); else setRetry(value => value + 1); }, [cartReady, save]);
  return { cartItems, cartReady, cartError, cartSaving, addToCart, addToCartBatch, removeFromCart, updateQuantity, clearCart,
    isAddToCartSheetOpen, lastAddedCartItem, closeAddToCartSheet, retryCart, flushCart: save };
}

