import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function getCurrentUserWithRole() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: roleData, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Role fetch failed', error);
    return { user, role: null };
  }
  console.log(roleData?.role);
  return {
    user,
    role: roleData?.role ?? 'user',
  };
}