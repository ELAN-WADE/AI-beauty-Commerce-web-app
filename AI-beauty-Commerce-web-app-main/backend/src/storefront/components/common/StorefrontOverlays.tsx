import { scheduleBackgroundWarmup } from '../../lib/background-warmup';
import React, { lazy, Suspense, useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';

const loadProductQuickModal = () => import('./ProductQuickModal');
const ProductQuickModal = lazy(() => loadProductQuickModal().then(module => ({ default: module.ProductQuickModal })));
const loadFilterSortSheet = () => import('../sheets/FilterSortSheet');
const FilterSortSheet = lazy(() => loadFilterSortSheet().then(module => ({ default: module.FilterSortSheet })));
const loadAIAssistantDrawer = () => import('../sheets/AIAssistantDrawer');
const AIAssistantDrawer = lazy(() => loadAIAssistantDrawer().then(module => ({ default: module.AIAssistantDrawer })));
const loadCommunityChatDrawer = () => import('../community/CommunityChatDrawer');
const CommunityChatDrawer = lazy(() => loadCommunityChatDrawer().then(module => ({ default: module.CommunityChatDrawer })));
const loadLocationSelector = () => import('./LocationSelector');
const LocationSelector = lazy(() => loadLocationSelector().then(module => ({ default: module.LocationSelector })));

// Keep visited tools mounted so closing a drawer preserves its draft.
function useHasOpened(open: boolean) {
  const [opened, setOpened] = useState(open);
  useEffect(() => { if (open) setOpened(true); }, [open]);
  return open || opened;
}

export const StorefrontOverlays: React.FC = () => {
  useEffect(() => scheduleBackgroundWarmup([loadProductQuickModal,loadFilterSortSheet,loadAIAssistantDrawer,loadCommunityChatDrawer,loadLocationSelector]), []);
  const { products, quickModalProduct, closeQuickModal, isFilterSheetOpen,
    isAIAssistantOpen, isCommunityOpen, isLocationModalOpen } = useApp();
  const quick = useHasOpened(!!quickModalProduct);
  const filters = useHasOpened(isFilterSheetOpen);
  const ai = useHasOpened(isAIAssistantOpen);
  const chat = useHasOpened(isCommunityOpen);
  const location = useHasOpened(isLocationModalOpen);
  useEffect(() => scheduleBackgroundWarmup(products.slice(0, 12).filter(product => product.image).map(product => async () => {
    const image = new Image();
    image.decoding = 'async'; image.fetchPriority = 'low'; image.src = product.image;
    if (image.decode) await image.decode().catch(() => {});
  })), [products]);
  return (
    <>
      <Suspense fallback={null}>{quick && <ProductQuickModal product={quickModalProduct} isOpen={!!quickModalProduct} onClose={closeQuickModal} />}</Suspense>
      <Suspense fallback={null}>{filters && <FilterSortSheet />}</Suspense>
      <Suspense fallback={null}>{ai && <AIAssistantDrawer />}</Suspense>
      <Suspense fallback={null}>{chat && <CommunityChatDrawer />}</Suspense>
      <Suspense fallback={null}>{location && <LocationSelector />}</Suspense>
    </>
  );
};

