export interface CreatorSubmissionInput {
  format: 'video' | 'routine' | 'review' | 'tutorial';
  videoTitle: string; videoCaption: string; mediaUrl: string; selectedProductIds: string[];
  routineTitle: string; routineCategory: string; routineSkinType: string; routineTimeOfDay: string;
  routineSteps: { name: string; productId: string; proTip: string }[];
  reviewProductId: string; reviewVerdict: string; testingDuration: string; textureScore: number; absorptionScore: number; longevityScore: number;
  tutorialTitle: string; tutorialDifficulty: string; tutorialSteps: { title: string; detail: string }[];
}
export function creatorMediaUrl(value: string): string {
  const raw = value.trim();
  if (!raw) return '';
  if (/^\/uploads\/partner\/[a-zA-Z0-9_.-]+$/.test(raw)) return raw;
  try {
    const url = new URL(raw);
    const local = process.env.NODE_ENV !== 'production' && url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    if (!url.username && !url.password && (url.protocol === 'https:' || local)) return url.toString();
  } catch { /* Show a recoverable field error below. */ }
  throw new Error('Upload the selected file successfully, or enter its hosted HTTPS media URL before saving.');
}
export function buildCreatorSubmission(input: CreatorSubmissionInput, products: { id: string; name: string }[], submitted: boolean) {
  let title = ''; let body = ''; let productIds: string[] = [];
  const product = (id: string) => products.find(item => item.id === id);
  if (input.format === 'video') { title = input.videoTitle; body = input.videoCaption; productIds = input.selectedProductIds; }
  if (input.format === 'routine') {
    title = input.routineTitle; productIds = input.routineSteps.map(step => step.productId).filter(Boolean);
    if (submitted && (!input.routineSteps.length || input.routineSteps.some(step => !step.name.trim() || !product(step.productId)))) throw new Error('Give every routine step a name and select its current catalogue formulation.');
    body = [input.routineCategory, input.routineSkinType, input.routineTimeOfDay, ...input.routineSteps.map((step, index) => `${index + 1}. ${step.name}\n${product(step.productId)?.name || 'No formulation selected'}\n${step.proTip}`)].filter(Boolean).join('\n\n');
  }
  if (input.format === 'review') {
    const selected = product(input.reviewProductId);
    if (!selected) throw new Error('Choose the formulation you are reviewing.');
    if (submitted && (!input.reviewVerdict.trim() || [input.textureScore, input.absorptionScore, input.longevityScore].some(score => score < 1 || score > 5))) throw new Error('Add your review and choose each product score before submitting.');
    title = `Review: ${selected.name}`; productIds = [selected.id];
    body = `${input.reviewVerdict}\n\nTest duration: ${input.testingDuration || 'Not recorded'}\nTexture: ${input.textureScore || 'Not rated'}/5\nAbsorption: ${input.absorptionScore || 'Not rated'}/5\nLongevity: ${input.longevityScore || 'Not rated'}/5`;
  }
  if (input.format === 'tutorial') {
    title = input.tutorialTitle; productIds = input.selectedProductIds;
    if (submitted && (!input.tutorialSteps.length || input.tutorialSteps.some(step => !step.title.trim() || !step.detail.trim()))) throw new Error('Complete each tutorial step before submitting.');
    body = [input.tutorialDifficulty, ...input.tutorialSteps.map((step, index) => `${index + 1}. ${step.title}\n${step.detail}`)].join('\n\n');
  }
  if (title.trim().length < 2) throw new Error('Enter a content title before saving.');
  if (body.length > 5000) throw new Error('Shorten the content to 5,000 characters before saving.');
  productIds = [...new Set(productIds)];
  if (productIds.some(id => !product(id))) throw new Error('A tagged formulation is no longer available. Update the selection.');
  const url = creatorMediaUrl(input.mediaUrl);
  if (submitted && input.format === 'video' && !url) throw new Error('Upload a video or add its hosted media URL before submitting.');
  return { title: title.trim(), body, url, productIds };
}
