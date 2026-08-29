import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function Dashboard() {
  const session = await auth();

  if (!session?.user) {
    return redirect('/');
  }

  // Vérifier que l'utilisateur a un rôle valide (admin ou invité)
  const user = session.user as any;
  const validRoles = ['admin', 'owner', 'member'];
  if (!user.role || !validRoles.includes(user.role)) {
    return redirect('/');
  }

  redirect('/dashboard/overview');
}
