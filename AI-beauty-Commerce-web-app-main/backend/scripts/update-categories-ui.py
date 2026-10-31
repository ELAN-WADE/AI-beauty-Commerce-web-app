for path in ['src/screens/catalog/Screen05Categories.tsx', 'backend/src/storefront/screens/catalog/Screen05Categories.tsx']:
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Remove import of categories from data/categories
    content = content.replace("import { categories } from '../../data/categories';", "")

    # Use categories from useApp
    target = "const { navigateTo, setSelectedCategory, goBack } = useApp();"
    replacement = """const { categories: liveCategories, products, navigateTo, setSelectedCategory, goBack } = useApp();
  const categories = liveCategories.length > 0
    ? liveCategories
    : Array.from(new Set(products.map(p => p.category))).filter(Boolean).map(slug => ({
        id: slug,
        name: slug.replace(/[-_]/g, ' ').replace(/\\b\\w/g, l => l.toUpperCase()),
        slug,
        description: 'Natural luxury formulation crafted for skin resilience.',
        image: slug === 'skincare' ? '/product_barrier_cream.jpg' : slug === 'body-care' ? '/carousel/photo_6_butter.jpg' : slug === 'fragrance' ? '/carousel/photo_3_apothecary.jpg' : slug === 'makeup' ? '/carousel/photo_7_application.jpg' : '/product_cleanser.jpg',
        itemCount: products.filter(p => p.category === slug).length,
        featured: true,
        subcategories: []
      }));"""

    content = content.replace(target, replacement)
    content = content.replace('From natural natural-barrier body washes', 'From natural barrier body washes')

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('Updated', path)

