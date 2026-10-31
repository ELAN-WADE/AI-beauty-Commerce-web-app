import { headers } from 'next/headers';
import ClientEntry from './ClientEntry';
export default async function HomePage() {
  const privateAdmin = (await headers()).get('x-desla-private-admin') === '1';
  return <ClientEntry initialScreen={privateAdmin ? 'admin-console' : undefined} />;
}
