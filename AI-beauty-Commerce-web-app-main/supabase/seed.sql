-- Desla!™ Backend — Seed Data (maps 1:1 to src/data/*.ts mocks)
-- Run AFTER schema.sql in Supabase SQL Editor.
-- Idempotent: all inserts use ON CONFLICT DO NOTHING / DO UPDATE.

-- ============ CATEGORIES (src/data/categories.ts) ============
insert into public.categories (id, name, slug, item_count, image_url, is_featured, description) values
  ('body-care','Body Care','body-care',32,'https://images.unsplash.com/photo-1608248597359-0c679234b4c7?auto=format&fit=crop&w=600&q=80',true,'Nourishing body washes, micro-polishing scrubs, radiant dry oils, and whipped butters.'),
  ('skincare','Skincare','skincare',14,'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80',true,'Safe-conscious pH 5.5 face cleansers and 100% invisible SPF50+ broad spectrum defense.'),
  ('fragrance','Haute Fragrance','fragrance',18,'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=600&q=80',true,'10ml concentrated artisanal perfume oils and 50ml luxury unisex Eau de Parfum.'),
  ('makeup','Makeup & Lips','makeup',45,'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=600&q=80',true,'High-shine peptide lip glosses, velvet matte lipsticks, and handcrafted faux mink lashes.'),
  ('lifestyle','Fashion & Lifestyle','lifestyle',12,'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=600&q=80',false,'Unisex loungewear, raw silk head accessories, and minimalist beauty lifestyle essentials.')
on conflict (id) do update set name=excluded.name, item_count=excluded.item_count;

-- ============ PRODUCTS (core SKUs; full catalog mirrors src/data/products.ts) ============
-- Note: prices in NGN. gallery/sizes stored as arrays; rich copy as jsonb.
insert into public.products (id, sku, name, brand, tagline, rating, reviews_count, price, original_price, discount_percentage, image_url, gallery_images, category_id, sub_category, sizes, in_stock, stock_count, is_bestseller, is_flash_sale, hashtag, description, what_it_does, key_ingredients, how_to_use, who_its_for, brand_info) values
  ('des-bo-01','DES-BO-01-100ML','DESLA!™ Radiant Golden Body Oil','DESLA!™','Fast-absorbing dry botanical body oil with shimmering golden undertones',4.9,218,24000,28000,14,
   'https://images.unsplash.com/photo-1608248597359-0c679234b4c7?auto=format&fit=crop&w=800&q=80',
   array['https://images.unsplash.com/photo-1608248597359-0c679234b4c7?auto=format&fit=crop&w=800&q=80','https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80'],
   'body-care','Body Oil',array['100ml','200ml'],true,84,true,true,'#DeslaBodyOil',
   'An ultra-lightweight, non-greasy unisex dry body elixir infused with cold-pressed Jojoba, Kalahari Melon, and Vitamin E.',
   array['Delivers instant 24-hour lipid moisture retention without residue','Infuses skin with a warm subtle radiant glow','Restores elasticity in harmattan weather'],
   '[{"name":"Cold-Pressed Jojoba Seed Oil","percentage":"35%","description":"Mimics skin sebum for instant absorption."},{"name":"Kalahari Melon Seed Oil","percentage":"20%","description":"Repairs moisture barrier."},{"name":"Tocopherol (Vitamin E)","percentage":"2%","description":"Antioxidant shield."}]',
   '{"routine":"AM & PM","step":"Step 3: Moisture Seal","instructions":"Dispense 4-6 pumps, warm, glide across body.","precautions":"External use only."}',
   '{"skinTypes":["All Skin Types","Dry Skin","Sensitive","Normal"],"concerns":["Dryness","Dull Tone","Rough Texture"]}',
   '{"origin":"Lagos, Nigeria","crueltyFree":true,"guarantee":"100% Authentic Laboratory Batch Guarantee"}'),
  ('des-bb-01','DES-BB-01-200ML','DESLA!™ Whipped Shea & Ceramide Butter','DESLA!™','Velvety whipped barrier restoration butter with pure West African Shea',4.95,312,19500,23000,15,
   'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=800&q=80',
   array['https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=800&q=80'],
   'body-care','Body Butter',array['200ml','400ml'],true,65,true,false,'#DeslaBodyButter',
   'Decadent airy whipped formula merging raw unrefined West African Shea with 3 biomimetic ceramides.',
   array['Soothes compromised barriers','Fast absorption, zero chalky heaviness','Locks moisture up to 48 hours'],
   '[{"name":"Artisanal Whipped Shea Butter","percentage":"40%","description":"Vitamins A, E and fatty acids."}]',
   '{"routine":"AM & PM","step":"Step 3: Moisture Seal","instructions":"Scoop, warm between palms, massage in.","precautions":"External use only."}',
   '{"skinTypes":["Dry","Very Dry","Sensitive"],"concerns":["Dryness","Rough Texture","Ashen Skin"]}',
   '{"origin":"Lagos, Nigeria","crueltyFree":true,"guarantee":"100% Authentic Laboratory Batch Guarantee"}'),
  ('des-ss-01','DES-SS-01-50ML','DESLA!™ Invisible Shield Sunscreen SPF50+','DESLA!™','Zero white-cast fluid for melanin-rich skin',4.9,410,16500,18500,11,
   'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80',array['https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80'],
   'skincare','Sunscreen',array['50ml'],true,120,true,false,'#DeslaSunscreen',
   'Photostable organic UV filters that melt into melanin-rich skin with zero white cast and zero eye sting.',
   array['SPF50+ broad spectrum','Zero white cast on Fitzpatrick V-VI','No eye sting'],
   '[{"name":"Photostable UV filters","description":"High-dispersion organic filters."}]',
   '{"routine":"AM","step":"Step 4: Protect","instructions":"Two finger-lengths 15 min before sun.","precautions":"Reapply every 2h in sun."}',
   '{"skinTypes":["All Skin Types"],"concerns":["Sun Protection","Hyperpigmentation"]}',
   '{"origin":"Lagos, Nigeria","crueltyFree":true,"guarantee":"100% Authentic Laboratory Batch Guarantee"}'),
  ('des-fc-01','DES-FC-01-150ML','DESLA!™ pH 5.5 Gentle Face Cleanser','DESLA!™','Barrier-safe daily cleanse, zero strip',4.8,190,12500,null,null,
   'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80',array['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80'],
   'skincare','Face Cleanser',array['150ml'],true,95,false,false,'#DeslaCleanser',
   'Safe-conscious pH 5.5 gel cleanser that lifts sunscreen and city grime without stripping.',
   array['pH 5.5','Non-stripping','Unisex daily use'],
   '[{"name":"Gentle surfactant blend","description":"Low-foam, barrier-safe."}]',
   '{"routine":"AM & PM","step":"Step 1: Cleanse","instructions":"Massage 60 seconds, rinse.","precautions":"Avoid eyes."}',
   '{"skinTypes":["All Skin Types","Sensitive"],"concerns":["Sensitivity","Congestion"]}',
   '{"origin":"Lagos, Nigeria","crueltyFree":true,"guarantee":"100% Authentic Laboratory Batch Guarantee"}'),
  ('des-po-01','DES-PO-01-10ML','DESLA!™ Royal Amber Perfume Oil','DESLA!™','12-hour alcohol-free intimate sillage',5.0,264,18000,null,null,
   'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80',array['https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80'],
   'fragrance','Perfume Oil',array['10ml'],true,70,true,false,'#DeslaPerfumeOil',
   'Alcohol-free 10ml roll-on: Royal Amber & Madagascar Vanilla, unisex, 12+ hour wear.',
   array['12+ hour wear','Alcohol-free','Unisex amber-vanilla'],
   '[{"name":"Amber accord","description":"Warm resinous base."},{"name":"Madagascar Vanilla","description":"Soft gourmand heart."}]',
   '{"routine":"AM & PM","step":"Pulse points","instructions":"Roll on wrists, neck, behind ears.","precautions":"External use only."}',
   '{"skinTypes":["All"],"concerns":["Fragrance"]}',
   '{"origin":"Lagos, Nigeria","crueltyFree":true,"guarantee":"100% Authentic Laboratory Batch Guarantee"}')
on conflict (id) do nothing;

-- ============ DISTRIBUTORS (src/data/distributors.ts) ============
insert into public.distributors (id, name, business_name, city, state, address, phone, whatsapp, verified, tier, is_online_only, pickup_available, operating_hours, rating, reviews_count, stocked_skus) values
  ('dist-lagos-hq','Desla!™ Central Laboratory & HQ','Desla Beauty and Lifestyle Limited','Lagos','Lagos State','Plot 14 Admiralty Way, Lekki Phase 1, Lagos','08148120642','2348148120642',true,'Gold',false,true,'Mon - Fri (9:00 AM - 5:00 PM)',5.0,384,array['DES-BW-01-250ML','DES-BO-01-100ML','DES-BB-01-200ML','DES-SS-01-50ML','DES-PO-01-10ML','DES-PF-01-50ML']),
  ('dist-abuja-wuse','Desla Abuja Capital Hub','Aura Luxe Beauty Co.','Abuja','FCT','Suite 204, Aminu Kano Crescent, Wuse 2, Abuja','09030456510','2349030456510',true,'Gold',false,true,'Mon - Sat (10:00 AM - 7:00 PM)',4.9,198,array['DES-BO-01-100ML','DES-BB-01-200ML','DES-SS-01-50ML','DES-PO-01-10ML']),
  ('dist-abuja-gwarinpa','Desla Express Abuja North','GlowSphere Abuja','Abuja','FCT','3rd Avenue, Gwarinpa Estate, Abuja','08148120642','2348148120642',true,'Silver',true,false,'Same-day instant dispatch across Gwarinpa & Jabi',4.8,84,array['DES-BO-01-100ML','DES-BB-01-200ML']),
  ('dist-ph-gra','Desla Port Harcourt Luxury Partner','Eden Glow Studio PH','Port Harcourt','Rivers State','18 Tombia Street, GRA Phase 2, Port Harcourt','09030456510','2349030456510',true,'Gold',false,true,'Mon - Sat (9:30 AM - 6:30 PM)',4.9,142,array['DES-BO-01-100ML','DES-BB-01-200ML','DES-SS-01-50ML']),
  ('dist-ibadan-bodija','Desla Ibadan Stockist','Velvet Horizon Beauty','Ibadan','Oyo State','Awolowo Avenue, Old Bodija, Ibadan','08148120642','2348148120642',true,'Silver',false,true,'Mon - Sat (9:00 AM - 6:00 PM)',4.8,67,array['DES-BO-01-100ML','DES-BB-01-200ML']),
  ('dist-kano-nasarawa','Desla Northern Express','Sahara Luxe Essentials','Kano','Kano State','Bompai Road, Nasarawa GRA, Kano','09030456510','2349030456510',true,'Silver',false,true,'Mon - Sat (10:00 AM - 5:00 PM)',4.7,53,array['DES-BO-01-100ML','DES-BB-01-200ML'])
on conflict (id) do update set rating=excluded.rating, reviews_count=excluded.reviews_count, stocked_skus=excluded.stocked_skus;

-- ============ INVENTORY (derived from Product.distributorStock) ============
insert into public.inventory (distributor_id, product_id, city, quantity, available) values
  ('dist-abuja-wuse','des-bo-01','Abuja',24,true),
  ('dist-lagos-hq','des-bo-01','Lagos',45,true),
  ('dist-ph-gra','des-bo-01','Port Harcourt',18,true),
  ('dist-ibadan-bodija','des-bo-01','Ibadan',12,true),
  ('dist-abuja-wuse','des-bb-01','Abuja',18,true),
  ('dist-lagos-hq','des-bb-01','Lagos',38,true),
  ('dist-ph-gra','des-bb-01','Port Harcourt',14,true),
  ('dist-kano-nasarawa','des-bb-01','Kano',10,true)
on conflict (distributor_id, product_id) do update set quantity=excluded.quantity, available=excluded.available;

-- ============ CREATORS (src/data/creators.ts) ============
insert into public.creators (id, name, handle, platform, niche, avatar_url, promo_code, discount_percent, commission_rate, total_sales_ngn, commission_earned_ngn, clicks, orders_count, verified) values
  ('creator-amara','Amara Nnadi','@amara_glows','Instagram','Clinical Skincare & Melanin Sun Care','https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80','AMARA10',10,12,4850000,582000,1420,184,true),
  ('creator-tunde','Tunde Adeleke','@tundethemua','TikTok','Editorial MUA & Luxury Complexion','https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80','TUNDEGLAM',10,15,6200000,930000,2890,265,true),
  ('creator-zainab','Dr. Zainab Bello','@drzainab_skin','Instagram','Aesthetic Dermatology & Barrier Health','https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80','DRZAINAB',10,12,8900000,1068000,3450,390,true)
on conflict (id) do update set promo_code=excluded.promo_code, total_sales_ngn=excluded.total_sales_ngn;

-- ============ REVIEWS (src/data/reviews.ts) ============
insert into public.reviews (id, product_id, product_sku, author_name, author_avatar, rating, title, comment, verified_purchase, city, skin_type, photo_url, helpful_count) values
  ('rev-01','des-bo-01','DES-BO-01-100ML','Folake Adeleke','https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',5,'The golden radiance is unmatched in Lagos heat!','I was hesitant about oil during humid months, but this dry oil absorbs in under 30 seconds. Zero grease on clothes. Got it from the Lekki hub same day!',true,'Lagos','Combination','https://images.unsplash.com/photo-1608248597359-0c679234b4c7?auto=format&fit=crop&w=400&q=80',42),
  ('rev-02','des-bo-01','DES-BO-01-100ML','Ibrahim Bello','https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',5,'Perfect unisex grooming oil','Clean formulation, subtle woody amber scent. Cold-pressed jojoba calmed my post-shave skin instantly.',true,'Abuja','Normal',null,28),
  ('rev-03','des-bb-01','DES-BB-01-200ML','Ngozi Okonjo','https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=150&q=80',5,'Whipped like cloud cream','Whipped like gelato. My dry elbows and ankles transformed in 10 days.',true,'Port Harcourt','Very Dry','https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=400&q=80',35),
  ('rev-04','des-ss-01','DES-SS-01-50ML','Dr. Kelechi Nwosu','https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',5,'Finally: ZERO white cast on deep melanin skin','Melts like a hydrating serum. No eye stinging either.',true,'Abuja','Fitzpatrick VI',null,64),
  ('rev-05','des-po-01','DES-PO-01-10ML','Halima Yusuf','https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80',5,'Pure intoxicating luxury','Amber and vanilla stayed from 8 AM until 9 PM. Picked up in Wuse 2 without courier fees.',true,'Abuja','Unisex',null,51)
on conflict (id) do nothing;

-- ============ COMMUNITY POSTS (src/data/communityPosts.ts) ============
insert into public.community_posts (id, author_name, author_handle, author_avatar, author_role, skin_type, content, media_type, media_url, video_duration, tagged_product_id, tagged_product_sku, tagged_product_hashtag, tagged_product_name, likes_count, comments_count, is_transformation) values
  ('post-01','Chioma Alabi','@chioma_glow','https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80','Verified Buyer','Fitzpatrick V • Dry / Sensitive','My 3-week transformation using Whipped Shea Butter + Radiant Body Oil. No more ashy skin in Abuja dry heat. #DeslaBodyOil #DeslaBodyButter','image','https://images.unsplash.com/photo-1608248597359-0c679234b4c7?auto=format&fit=crop&w=600&q=80',null,'des-bo-01','DES-BO-01-100ML','#DeslaBodyOil','DESLA!™ Radiant Golden Body Oil',142,29,true),
  ('post-02','Dr. Zainab Bello','@drzainab_skin','https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80','Dermatologist','Board Certified Dermatologist','Clinical Tip for melanin-rich skin: DESLA!™ Invisible Shield SPF50+ uses high-dispersion organic filters. #DeslaSunscreen','video','https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=600&q=80','0:45','des-ss-01','DES-SS-01-50ML','#DeslaSunscreen','DESLA!™ Invisible Shield Sunscreen SPF50+',388,54,false),
  ('post-03','Tunde Adeleke','@tundethemua','https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80','Creator / MUA','Editorial Makeup Artist','Backstage at Lagos Fashion Week. Prepped lips with Restorative Lip Balm + High-Shine Glaze in Champagne Gold. #DeslaLipGlaze','image','https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=600&q=80',null,'des-bo-01','DES-BO-01-100ML','#DeslaLipGlaze','DESLA!™ High-Shine Glaze Lip Gloss',512,76,false),
  ('post-04','Amina Danjuma','@amina_dan','https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=200&q=80','Verified Buyer','Abuja Partner Verified • Normal','Ordered Royal Amber Perfume Oil from the Wuse 2 partner and picked it up within 40 minutes. #DeslaPerfumeOil','image','https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=600&q=80',null,'des-po-01','DES-PO-01-10ML','#DeslaPerfumeOil','DESLA!™ Royal Amber Perfume Oil',224,31,false)
on conflict (id) do nothing;

-- ============ AUTHENTICITY DEMO CODES ============
insert into public.authenticity_codes (code, product_id, batch, manufactured_at, is_valid) values
  ('DESLA-AUTH-DEMO-001','des-bo-01','LAG-2026-09-A', '2026-09-01', true),
  ('DESLA-AUTH-DEMO-002','des-bb-01','LAG-2026-09-B', '2026-09-05', true)
on conflict (code) do nothing;
