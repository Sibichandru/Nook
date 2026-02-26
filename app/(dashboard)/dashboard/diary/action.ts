'use server'

import { getCurrentUserWithRole } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { DiaryEntry } from "@/types/Diary"

export async function saveDiaryEntry(entry: DiaryEntry) {
    const supabase = await createSupabaseServerClient();
    const { user } = await getCurrentUserWithRole();
    if (!user) {
        return { error: 'Unauthorized' };
    }
    console.log({...entry, user_id: user.id}, 'entry');
    const { data, error } = await supabase.from('diary_entries').upsert({...entry, user_id: user.id}).select().maybeSingle();
    if (error) {
        return { error: error.message };
    }
    return { data };
}

export async function fetchEntry(date: string) {
    const supabase = await createSupabaseServerClient();
    const { user } = await getCurrentUserWithRole();
    if (!user) {
        return { error: 'Unauthorized' };
    }
    const { data: entry, error } = await supabase.from('diary_entries').select('*').eq('entry_date', date).eq('user_id', user.id).maybeSingle();
    if (error) {
        return { error: error.message };
    }
    return { data: entry };
}