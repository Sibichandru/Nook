export type ReminderType = 'recurring' | 'one_time';

export type Reminder = {
    id: string;
    user_id: string;
    title: string;
    type: ReminderType;
    interval_minutes: number | null;
    scheduled_at: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
};
