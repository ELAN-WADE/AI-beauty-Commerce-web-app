import { notFound, redirect } from 'next/navigation';

const screens: Record<string, string> = {
  login: 'login', signup: 'signup', 'verify-email': 'verify-email', 'reset-password': 'reset-password',
  'forgot-password': 'forgot-password', creators: 'creators', 'creator-studio': 'creators',
  'creator-storefront': 'creator-storefront', distributors: 'distributors', distributor: 'distributor-portal',
  'distributor-portal': 'distributor-portal', 'partner-programme': 'partner-programme',
  account: 'account', orders: 'orders', catalogue: 'catalogue', cart: 'cart', checkout: 'checkout',
};
export default async function DeepLink({ params, searchParams }: { params: Promise<{ path: string[] }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const segments = (await params).path;
  const pathStr = segments.join('/');

  if (segments[0] === 'product' || segments[0] === 'products') {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(await searchParams)) if (typeof value === 'string') query.set(key, value);
    query.set('screen', 'product-details');
    if (segments[1]) query.set('product', segments[1]);
    redirect(`/?${query}`);
  }

  const screen = screens[pathStr];
  if (!screen) notFound();
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) if (typeof value === 'string') query.set(key, value);
  query.set('screen', screen);
  redirect(`/?${query}`);
}
