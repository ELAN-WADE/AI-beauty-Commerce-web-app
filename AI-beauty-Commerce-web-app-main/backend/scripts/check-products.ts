import 'dotenv/config';
import { getDb, closeDb } from '../src/db/client';
import { products, categories } from '../src/modules/catalog/schema';

async function main() {
  const db = getDb();
  const prods = await db.select().from(products);
  console.log('Total products in database:', prods.length);
  for (const r of prods) {
    console.log(`- [${r.isActive ? 'ACTIVE' : 'INACTIVE'}] ${r.name} (${r.slug}) id=${r.id}`);
  }
  const cats = await db.select().from(categories);
  console.log('\nTotal categories in database:', cats.length);
  for (const c of cats) {
    console.log(`- [${c.isActive ? 'ACTIVE' : 'INACTIVE'}] ${c.name} (${c.slug})`);
  }
  await closeDb();
}
main();
