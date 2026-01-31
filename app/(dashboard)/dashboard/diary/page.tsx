'use client';

import { useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/app/providers/auth-providers';
import { createClient } from '@/lib/supabase/client';
import Loader from '@/components/Loader';
import './diary.css';

const today = new Date().toISOString().split('T')[0];

type DiaryEntry = {
    title: string;
    content: string;
    mood: number | null;
    entry_date: string;
};

enum Mood {
    '😀' = 1,
    '🙂' = 2,
    '😐' = 3,
    '🙁' = 4,
    '😞' = 5,
    'null' = 'How are you feeling today?',
}
type CalendarButton = {
    icon?: React.ReactNode;
    label?: (selectedDate: string) => React.ReactNode;
    onClick: (key: string) => void;
}

const calendarButtonKeys = ['previous', 'selected', 'next'] as const;
type CalendarButtonKey = typeof calendarButtonKeys[number];


const CalendarButtons: Record<CalendarButtonKey, CalendarButton> = {
    previous: {
        icon: <ChevronLeft />,
        onClick: (key: string) => {
            console.log(key)
        }
    },
    selected: {
        label: (selectedDate: string) => {
            return <span className='text-sm font-medium'>{selectedDate || ''}</span>
        },
        onClick: (key: string) => {
            console.log(key)
        }
    },
    next: {
        icon: <ChevronRight />,
        onClick: (key: string) => {
            console.log(key)
        }
    },
}
export default function Diary() {
    const supabase = createClient();
    const { user, authLoading } = useAuth();

    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<DiaryEntry>({
        title: '',
        content: '',
        mood: null,
        entry_date: today,
    });

    const fetchEntry = useCallback(async () => {
        if (!user) return;

        setLoading(true);

        const { data: entry, error } = await supabase
            .from('diary_entries')
            .select('title, content, mood, entry_date')
            .eq('user_id', user.id)
            .eq('entry_date', today)
            .maybeSingle();

        if (error) {
            console.error('Fetch error:', error);
        }

        if (entry) {
            setData(entry);
        }

        setLoading(false);
    }, [user, supabase]);

    useEffect(() => {
        if (user) {
            fetchEntry();
        }
    }, [user, fetchEntry]);

    const onSave = async () => {
        if (!user) return;

        setLoading(true);

        const { error } = await supabase
            .from('diary_entries')
            .upsert(
                {
                    ...data,
                    user_id: user.id,
                    entry_date: today,
                },
                {
                    onConflict: 'user_id,entry_date',
                }
            );

        if (error) {
            console.error('Save error:', error);
        }

        setLoading(false);
    };

    if (authLoading || loading) {
        return <Loader />;
    }

    return (
        <div className="flex flex-1 flex-col items-center min-h-full gap-4">
            <div className="flex items-center justify-between w-full max-w-md">
                {calendarButtonKeys.map((key) => {
                    const button = CalendarButtons[key];
                    return (
                        <button
                            key={key}
                            className="cursor-pointer hover:bg-muted/50 p-2"
                            onClick={() => button.onClick(key)}
                        >
                            {button.icon ?? button.label?.(today)}
                        </button>
                    );
                })}
            </div>
            <div className="bg-card border border-primary/30 rounded-xl p-4 diary-card">
                <form className='flex flex-col gap-4 p-10' onSubmit={onSave}>
                    <div className='flex flex-col gap-2'>
                        <label htmlFor="title">Title</label>
                        <input type="text" value={data.title} onChange={(e) => setData({ ...data, title: e.target.value })} />
                    </div>
                    <div className='flex flex-col gap-2'>
                        <label htmlFor="content">Content</label>
                        <textarea value={data.content} onChange={(e) => setData({ ...data, content: e.target.value })} />
                    </div>
                    <button type='submit'>Save</button>
                </form>
            </div>
        </div>
    );
}
