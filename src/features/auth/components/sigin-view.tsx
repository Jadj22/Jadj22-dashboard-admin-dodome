import { Metadata } from 'next';
import Link from 'next/link';
import UserAuthForm from './user-auth-form';

export const metadata: Metadata = {
  title: 'Connexion — DODOME',
  description: 'Connectez-vous à votre espace de gestion DODOME.'
};

export default function SignInViewPage({ stars }: { stars?: number }) {
  return (
    <div className='relative h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0'>
      {/* Panneau latéral gauche */}
      <div className='bg-muted relative hidden h-full flex-col p-10 text-white lg:flex dark:border-r'>
        <div className='absolute inset-0 bg-zinc-900' />
        <div className='relative z-20 flex items-center gap-2 text-xl font-bold tracking-tight'>
          <div className='bg-primary text-primary-foreground flex aspect-square size-9 items-center justify-center rounded-lg font-extrabold'>
            D
          </div>
          DODOME
        </div>
        <div className='relative z-20 mt-auto space-y-2'>
          <blockquote className='space-y-2'>
            <p className='text-lg font-medium'>
              &ldquo;Gestion d'équipements, réservations, facturation et
              traçabilité de stock multi-tenant en toute simplicité.&rdquo;
            </p>
            <footer className='text-sm text-zinc-400'>
              Plateforme professionnelle DODOME
            </footer>
          </blockquote>
        </div>
      </div>

      {/* Panneau de connexion droit */}
      <div className='flex h-full items-center p-4 lg:p-8'>
        <div className='mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[360px]'>
          <div className='flex flex-col space-y-2 text-center'>
            <h1 className='text-2xl font-bold tracking-tight'>
              Bienvenue sur DODOME
            </h1>
            <p className='text-muted-foreground text-sm'>
              Connectez-vous avec votre compte Google pour accéder à vos
              organisations et équipements.
            </p>
          </div>

          <UserAuthForm />

          <p className='text-muted-foreground px-4 text-center text-xs'>
            En continuant, vous acceptez nos{' '}
            <Link
              href='/terms'
              className='hover:text-primary underline underline-offset-4'
            >
              Conditions Générales d'Utilisation
            </Link>{' '}
            et notre{' '}
            <Link
              href='/privacy'
              className='hover:text-primary underline underline-offset-4'
            >
              Politique de Confidentialité
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
