import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import AdminScreen from '../admin/admin-screen';

const validRoots = new Set(['profile','news','threads','career','contact','security']);

export default async function AdminSubdomainRoute({ params }: { params: Promise<{ adminPath: string[] }> }) {
  const { adminPath } = await params;
  const host = (await headers()).get('host')?.split(':')[0];
  if (host !== 'admin.fadialhazim.com' || !validRoots.has(adminPath[0])) notFound();
  return <AdminScreen />;
}
