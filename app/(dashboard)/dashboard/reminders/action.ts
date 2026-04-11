'use server'

import { getCurrentUserWithRole } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { Reminder } from "@/types/Reminder"

export async function getReminders() {
    const supabase = await createSupabaseServerClient();
    const { user } = await getCurrentUserWithRole();
    if (!user) {
        return { error: 'Unauthorized' };
    }
    const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
    if (error) {
        return { error: error.message };
    }
    return { data };
}

export async function createReminder(reminder: Omit<Reminder, 'id' | 'user_id' | 'is_active' | 'created_at' | 'updated_at'>) {
    const supabase = await createSupabaseServerClient();
    const { user } = await getCurrentUserWithRole();
    if (!user) {
        return { error: 'Unauthorized' };
    }
    const { data, error } = await supabase
        .from('reminders')
        .insert({ ...reminder, user_id: user.id })
        .select()
        .maybeSingle();
    if (error) {
        return { error: error.message };
    }
    return { data };
}

export async function updateReminder(id: string, updates: Partial<Omit<Reminder, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) {
    const supabase = await createSupabaseServerClient();
    const { user } = await getCurrentUserWithRole();
    if (!user) {
        return { error: 'Unauthorized' };
    }
    const { data, error } = await supabase
        .from('reminders')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .maybeSingle();
    if (error) {
        return { error: error.message };
    }
    return { data };
}

export async function deleteReminder(id: string) {
    const supabase = await createSupabaseServerClient();
    const { user } = await getCurrentUserWithRole();
    if (!user) {
        return { error: 'Unauthorized' };
    }
    const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
    if (error) {
        return { error: error.message };
    }
    return { data: null };
}

export async function toggleReminder(id: string, is_active: boolean) {
    return updateReminder(id, { is_active });
}
