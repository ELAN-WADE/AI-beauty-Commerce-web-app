import { NextResponse } from 'next/server';
import { and, desc, eq, or } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { Errors, toErrorResponse } from '@/lib/errors';
import { creators } from '@/modules/creators/schema';
import { workspaceRecords } from '@/modules/workspaces/schema';
import { getProduct, listProducts } from '@/modules/catalog/service';

export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    const db = getDb();
    const cleanCode = code.toUpperCase();
    const cleanHandle = code.startsWith('@') ? code : `@${code}`;
    const [creator] = await db
      .select()
      .from(creators)
      .where(
        and(
          or(
            eq(creators.promoCode, cleanCode),
            eq(creators.handle, cleanHandle),
            eq(creators.handle, code)
          ),
          eq(creators.verified, true)
        )
      )
      .limit(1);

    if (!creator) throw Errors.notFound('Creator not found.');

    let collection: typeof workspaceRecords.$inferSelect | undefined;
    if (creator.userId) {
      [collection] = await db
        .select()
        .from(workspaceRecords)
        .where(
          and(
            eq(workspaceRecords.ownerId, creator.userId),
            eq(workspaceRecords.kind, 'STOREFRONT'),
            or(eq(workspaceRecords.status, 'APPROVED'), eq(workspaceRecords.status, 'SUBMITTED'))
          )
        )
        .orderBy(desc(workspaceRecords.updatedAt))
        .limit(1);
    }

    const title = collection?.title || `${creator.name}'s Curated Natural Regimen`;
    const body = collection?.body || `Welcome to ${creator.name}'s official Desla!™ storefront. Use promo code ${creator.promoCode} at checkout for ${creator.discountPercent}% off all natural formulations.`;
    const productSlugs = collection?.data?.productIds ?? [];

    let items: any[] = [];
    if (productSlugs.length > 0) {
      items = (await Promise.all(productSlugs.slice(0, 24).map(slug => getProduct(db, slug).catch(() => null)))).filter(Boolean);
    } else {
      // Fallback to top catalogue formulations
      const topProducts = await listProducts(db, { limit: 8, sort: 'rating' });
      items = topProducts.items;
    }

    return NextResponse.json(
      {
        creator: {
          name: creator.name,
          handle: creator.handle,
          promoCode: creator.promoCode,
          discountPercent: creator.discountPercent,
          commissionRate: creator.commissionRate,
        },
        collection: { title, body },
        products: items,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (e) {
    return toErrorResponse(e, crypto.randomUUID());
  }
}

