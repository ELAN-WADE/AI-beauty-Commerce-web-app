# Enter a test formulation through the administrator

These are example inputs, not a product automatically inserted into the live database. The name and copy clearly identify a publishing test. Use the existing bundled image while media storage is being connected.

Open the private admin page, complete sign-in/MFA, then choose **Formulations & Taxonomy → + New Formulation**.

| Field | Example value |
| --- | --- |
| Name | TEST Formulation Preview |
| Slug / URL key | test-formulation-preview |
| Brand | DESLA Test |
| Category | Select an existing category, such as Facial Care |
| Subcategory | Preview |
| Tagline | Catalogue publishing test |
| Description | This is a test listing for checking administrator publication and storefront display. It is not a product offered for sale. |
| SKU | TEST-PREVIEW-50 |
| Size | 50ml |
| Price (NGN) | 15000 |
| Compare-at price | Leave empty |
| Stock | 0 |
| Direct Photo URL or Asset Path | /product_barrier_cream.jpg |
| Benefits / ingredients / claims | Leave empty for this test |
| Custom label | Leave empty |
| Publish Formulation to Live Storefront | On |

Choose **Publish to Catalog**, then open `/catalogue` in a separate storefront tab. Search for **TEST Formulation Preview**. Check the image, name, price and product details. Zero stock keeps this test listing unavailable for purchase.

Change the price to 16000 in the admin and select **Save & Update Product**. Confirm the storefront displays the update. Turn publication off and save when finished; the product should disappear from the public catalogue and its public details should become unavailable. Existing tabs receive catalogue sync notifications; public Next caches are invalidated on publication.

The regression in `backend/tests/catalog-portal-pg.test.ts` covers draft → publish → storefront mapping → edit → withdraw against an isolated PostgreSQL-compatible database. It does not create demo data in production or claim that a real hosted browser round trip has completed.
