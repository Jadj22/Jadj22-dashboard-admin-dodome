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

  // Définir le business ID par défaut si non défini
  if (!session.user.businessId) {
    // Première connexion - peut être défini via use-business plus tard
    localStorage.setItem('dodome_business_id', 'initial');
  }

  redirect('/dashboard/overview');
}
