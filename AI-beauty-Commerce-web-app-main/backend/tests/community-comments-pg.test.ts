import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { eq } from 'drizzle-orm';
import * as schema from '@/db/schema';
import {
  createPost,
  createPostComment,
  listPostComments,
  togglePostLike,
} from '@/modules/community/service';

let client: PGlite;
let db: ReturnType<typeof drizzle<typeof schema>>;
const pg = () => db as never;

beforeAll(async () => {
  const { pgcrypto } = await import('@electric-sql/pglite/contrib/pgcrypto');
  const { uuid_ossp } = await import('@electric-sql/pglite/contrib/uuid_ossp');
  client = new PGlite({ extensions: { pgcrypto, uuid_ossp } });
  db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: './drizzle' });
}, 120000);

afterAll(async () => {
  await client?.close();
});

describe('community likes, threaded comments, and review isolation', () => {
  it('toggles likes persistently, supports threaded comments, and never writes to product reviews', async () => {
    const [member] = await db
      .insert(schema.users)
      .values({ email: 'member@comments.test', passwordHash: 'hash', emailVerifiedAt: new Date() })
      .returning();
    const [creatorUser] = await db
      .insert(schema.users)
      .values({ email: 'creator@comments.test', passwordHash: 'hash', emailVerifiedAt: new Date() })
      .returning();

    await db.insert(schema.creators).values({
      userId: creatorUser.id,
      name: 'Ada Glow',
      handle: '@adaglow',
      promoCode: 'ADAGLOW10',
      verified: true,
    });

    const [brand] = await db
      .insert(schema.brands)
      .values({ name: 'Delsla Lab', slug: 'delsla-lab-comments' })
      .returning();
    const [category] = await db
      .insert(schema.categories)
      .values({ name: 'Skincare', slug: 'skincare-comments' })
      .returning();
    const [product] = await db
      .insert(schema.products)
      .values({
        brandId: brand.id,
        categoryId: category.id,
        name: 'Barrier Lipid Cream',
        slug: 'barrier-lipid-cream-comments',
      })
      .returning();

    const post1 = await createPost(
      pg(),
      creatorUser.id,
      { name: 'Ada Glow', handle: '@adaglow' },
      { content: 'Using Barrier Lipid Cream every night.', taggedProductId: product.id },
    );
    const post2 = await createPost(
      pg(),
      member.id,
      { name: 'Chidi Member' },
      { content: 'Separate post for isolation check.' },
    );

    // Toggle like on & off
    const liked = await togglePostLike(pg(), member.id, post1.id);
    expect(liked).toEqual({ liked: true, likesCount: 1 });
    const unliked = await togglePostLike(pg(), member.id, post1.id);
    expect(unliked).toEqual({ liked: false, likesCount: 0 });

    // Top-level comment by member
    const top = await createPostComment(
      pg(),
      member.id,
      post1.id,
      { name: 'Chidi Member' },
      { content: 'How does it layer under sunscreen?' },
    );
    expect(top.comment.authorRole).toBe('Member');
    expect(top.comment.parentCommentId).toBeNull();
    expect(top.commentsCount).toBe(1);

    // Threaded reply by verified creator
    const reply = await createPostComment(
      pg(),
      creatorUser.id,
      post1.id,
      { name: 'Ada Glow' },
      { content: 'Wait 60 seconds and it settles cleanly.', parentCommentId: top.comment.id },
    );
    expect(reply.comment.authorRole).toBe('Creator / MUA');
    expect(reply.comment.parentCommentId).toBe(top.comment.id);
    expect(reply.commentsCount).toBe(2);

    // Cross-post parent comment must be rejected
    await expect(
      createPostComment(
        pg(),
        member.id,
        post2.id,
        { name: 'Chidi Member' },
        { content: 'Invalid cross-post reply', parentCommentId: top.comment.id },
      ),
    ).rejects.toMatchObject({ status: 400, code: 'bad_request' });

    const comments = await listPostComments(pg(), post1.id);
    expect(comments).toHaveLength(2);
    expect(comments[0].id).toBe(top.comment.id);
    expect(comments[1].parentCommentId).toBe(top.comment.id);

    // Strict separation from verified product reviews
    const [freshProduct] = await db
      .select({ reviewsCount: schema.products.reviewsCount })
      .from(schema.products)
      .where(eq(schema.products.id, product.id));
    expect(freshProduct.reviewsCount).toBe(0);
    const productReviews = await db
      .select()
      .from(schema.reviews)
      .where(eq(schema.reviews.productId, product.id));
    expect(productReviews).toHaveLength(0);
  });
});

