import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function Home() {
  const supabase = await createClient();

  // Use getSession instead of getUser - faster since middleware already verified
  // getSession reads from cookie, getUser makes a network call to Supabase
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect('/login');
  }

  // Check if user has completed onboarding
  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', session.user.id)
    .single();

  if (!profile || profile.username.startsWith('user_')) {
    redirect('/onboarding');
  }

  redirect('/checkin');
}
