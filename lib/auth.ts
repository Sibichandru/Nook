import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function getCurrentUserWithRole() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, role: null };

  const { data, error } = await supabase
    .from('profiles')
    .select('roles(role)')
    .eq('id', user.id)
    .maybeSingle();
  if (error) {
    console.error('Role fetch failed', error);
    // throw error if role is not found
    throw new Error('Role not found');
  }

  const roleEntry = Array.isArray(data?.roles) ? data.roles[0] : data?.roles;
  return { user, role: roleEntry?.role ?? null };
}