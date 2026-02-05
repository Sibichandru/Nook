'use client';

import { useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/app/providers/auth-providers';
import { createClient } from '@/lib/supabase/client';
import { Calendar as MantineCalendar } from '@mantine/dates';
import dayjs from 'dayjs';
import Loader from '@/components/Loader';
import './diary.css';

type DiaryEntry = {
    title: string;
    content: string;
    mood: number | null;
    entry_date: string;
};

const MOODS = [
    { value: 1, emoji: '😀', label: 'Great' },
    { value: 2, emoji: '🙂', label: 'Good' },
    { value: 3, emoji: '😐', label: 'Okay' },
    { value: 4, emoji: '🙁', label: 'Low' },
    { value: 5, emoji: '😞', label: 'Bad' },
];

function formatDisplayDate(dateStr: string): string {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

function dateToString(date: Date): string {
    return date.toISOString().split('T')[0];
}

export default function Diary() {
    const supabase = createClient();
    const { user, authLoading } = useAuth();

    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [showCalendar, setShowCalendar] = useState(false);
    const [showMoodPicker, setShowMoodPicker] = useState(false);
    const [selected, setSelected] = useState<string[]>([]);
    const [data, setData] = useState<DiaryEntry>({
        title: '',
        content: '',
        mood: null,
        entry_date: selectedDate,
    });

    const fetchEntry = useCallback(async () => {
        if (!user) return;

        setLoading(true);

        const { data: entry, error } = await supabase
            .from('diary_entries')
            .select('title, content, mood, entry_date')
            .eq('user_id', user.id)
            .eq('entry_date', selectedDate)
            .maybeSingle();

        if (error) {
            console.error('Fetch error:', error);
        }

        if (entry) {
            setData(entry);
        } else {
            setData({
                title: '',
                content: '',
                mood: null,
                entry_date: selectedDate,
            });
        }

        setLoading(false);
    }, [user, supabase, selectedDate]);

    useEffect(() => {
        if (user) {
            fetchEntry();
        }
    }, [user, fetchEntry]);

    const navigateDate = (direction: 'prev' | 'next') => {
        const current = new Date(selectedDate + 'T12:00:00');
        console.log(current, 'current')
        if (direction === 'prev') {
            current.setDate(current.getDate() - 1);

        } else {
            current.setDate(current.getDate() + 1);
        }
        setSelectedDate(dateToString(current));
    };

    const goToToday = () => {
        setSelectedDate(dateToString(new Date()));
        setSelected([]);
        setShowCalendar(false);
    };

    const selectMood = (value: number) => {
        setData({ ...data, mood: value });
        setShowMoodPicker(false);
    };

    const onSave = async (e: React.SubmitEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);

        const { error } = await supabase
            .from('diary_entries')
            .upsert(
                {
                    ...data,
                    user_id: user.id,
                    entry_date: selectedDate,
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

    const currentMood = MOODS.find(m => m.value === data.mood);
    const handleSelect = (date: string) => {
        console.log(date)
        setSelected([date]);
        setSelectedDate(date);
        setShowCalendar(false);
    };

    if (authLoading) {
        return <Loader />;
    }

    return (
        <div className="diary-container">
            <div className="date-picker-wrapper">
                <button
                    type="button"
                    className="date-nav-btn"
                    onClick={() => navigateDate('prev')}
                    aria-label="Previous day"
                >
                    <ChevronLeft size={20} />
                </button>

                <div className="relative">
                    <span
                        className="date-display"
                        onClick={() => setShowCalendar(!showCalendar)}
                    >
                        {formatDisplayDate(selectedDate)}
                    </span>

                    {showCalendar && (
                        <div className="calendar-dropdown">
                            <MantineCalendar
                                withCellSpacing={false}
                                getDayProps={(date) => ({
                                    selected: selected.some((s) => dayjs(date).isSame(s, 'date')),
                                    onClick: () => handleSelect(date),
                                })}
                            />
                            <button
                                type="button"
                                className="calendar-today-btn"
                                onClick={goToToday}
                            >
                                Today
                            </button>
                        </div>
                    )}
                </div>

                <button
                    type="button"
                    className="date-nav-btn"
                    onClick={() => navigateDate('next')}
                    aria-label="Next day"
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* Diary Card */}
            {loading && <Loader className='diary-loader'/>}
            {!loading && (
                <div className="diary-card">
                    <form className="diary-form" onSubmit={onSave}>
                        {/* Mood Selector */}
                        <div className="relative">
                            <button
                                type="button"
                                className="mood-selector"
                                onClick={() => setShowMoodPicker(!showMoodPicker)}
                            >
                                <span>Mood:</span>
                                <span className="mood-emoji">
                                    {currentMood?.emoji ?? '🙂'}
                                </span>
                                <ChevronRight size={16} className="mood-chevron" />
                            </button>

                            {showMoodPicker && (
                                <div className="mood-picker">
                                    {MOODS.map((mood) => (
                                        <button
                                            key={mood.value}
                                            type="button"
                                            className={`mood-option ${data.mood === mood.value ? 'selected' : ''}`}
                                            onClick={() => selectMood(mood.value)}
                                            title={mood.label}
                                        >
                                            {mood.emoji}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Title Field */}
                        <div className="form-field">
                            <label htmlFor="title" className="form-label">Title</label>
                            <input
                                type="text"
                                id="title"
                                className="form-input"
                                placeholder="A calm day"
                                value={data.title}
                                onChange={(e) => setData({ ...data, title: e.target.value })}
                            />
                        </div>

                        {/* Entry Field */}
                        <div className="form-field">
                            <label htmlFor="entry" className="form-label">Entry</label>
                            <textarea
                                id="entry"
                                className="form-input form-textarea"
                                placeholder="Today I felt relaxed and productive."
                                value={data.content}
                                onChange={(e) => setData({ ...data, content: e.target.value })}
                            />
                        </div>

                        {/* Save Button */}
                        <button type="submit" className="save-btn">
                            Save Entry
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
