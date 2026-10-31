// DTO adapter shared by both storefronts; the API returns Drizzle camelCase fields.
export interface CommunityPostDto {
  id: string; authorName: string; authorHandle: string; authorAvatar: string; authorRole: string;
  content: string; mediaType: 'image' | 'video' | null; mediaUrl: string | null;
  taggedProductSlug?: string | null; taggedProductId: string | null; taggedHashtag: string | null; likesCount: number; commentsCount: number;
  createdAt: string; likedByMe?: boolean;
}
export type CommunityAuthorRole = 'Verified Buyer' | 'Member' | 'Creator / MUA' | 'Dermatologist' | 'Distributor';
const authorRoles = new Set<string>(['Verified Buyer', 'Member', 'Creator / MUA', 'Dermatologist', 'Distributor']);
export const communityAuthorRole = (value: string): CommunityAuthorRole =>
  (value === 'Creator' ? 'Creator / MUA' : authorRoles.has(value) ? value : 'Member') as CommunityAuthorRole;
export const communityPostFromApi = (p: CommunityPostDto) => ({
  id: p.id, authorName: p.authorName, authorHandle: p.authorHandle, authorAvatar: p.authorAvatar,
  authorRole: communityAuthorRole(p.authorRole), content: p.content, mediaType: p.mediaType ?? undefined, mediaUrl: p.mediaUrl ?? undefined,
  taggedProductId: p.taggedProductSlug || p.taggedProductId || undefined, taggedProductHashtag: p.taggedHashtag ?? undefined,
  likesCount: p.likesCount, commentsCount: p.commentsCount, timestamp: p.createdAt, likedByMe: p.likedByMe ?? false,
});
