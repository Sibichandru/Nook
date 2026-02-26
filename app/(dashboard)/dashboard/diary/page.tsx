import { getCurrentUserWithRole } from "@/lib/auth";
import DiaryClient from "./DiaryClient";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import dayjs from "dayjs";

export default async function DiaryPage() {
  const session = await getCurrentUserWithRole();
  if (!session?.user) {
    redirect('/login');
  }

  const supabase = await createSupabaseServerClient();
  const today = dayjs().format('YYYY-MM-DD');
  const { data: entry } = await supabase.from('diary_entries').select('*').eq('user_id', session.user.id).eq('entry_date', today).single();
  return (
    <DiaryClient initialEntry={entry ?? {
      title: '',
      content: '',
      mood: 1,
      entry_date: today,
    }} />
  )
}
