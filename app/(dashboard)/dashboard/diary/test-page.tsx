'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
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

const INITIAL_ENTRY: DiaryEntry = {
    title: '',
    content: '',
    mood: null,
    entry_date: '',
};

export default function Diary() {
    const supabase = createClient();
    const { user, authLoading } = useAuth();
    
    // UI State
    const [selectedDate, setSelectedDate] = useState(() => dayjs().format('YYYY-MM-DD'));
    const [showCalendar, setShowCalendar] = useState(false);
    const [showMoodPicker, setShowMoodPicker] = useState(false);
    
    // Data State
    const [isLoadingEntry, setIsLoadingEntry] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [currentEntry, setCurrentEntry] = useState<DiaryEntry>({ ...INITIAL_ENTRY, entry_date: selectedDate });
    
    // Cache
    const entriesCache = useRef<Map<string, DiaryEntry>>(new Map());
    const abortController = useRef<AbortController | null>(null);

    // Fetch entry for a specific date
    const fetchEntry = useCallback(async (date: string) => {
        if (!user) return;

        // cancel previous request if any
        if (abortController.current) {
            abortController.current.abort();
        }
        
        // Check cache first
        if (entriesCache.current.has(date)) {
            setCurrentEntry(entriesCache.current.get(date)!);
            return;
        }

        setIsLoadingEntry(true);
        abortController.current = new AbortController();

        try {
            const { data: entry, error } = await supabase
                .from('diary_entries')
                .select('title, content, mood, entry_date')
                .eq('user_id', user.id)
                .eq('entry_date', date)
                .maybeSingle();

            if (error) throw error;

            const newEntry = entry || {
                ...INITIAL_ENTRY,
                entry_date: date,
            };

            // Update cache and state
            entriesCache.current.set(date, newEntry);
            
            // Only update state if this is still the selected date (handling race conditions)
            if (date === selectedDate) {
                setCurrentEntry(newEntry);
            }
        } catch (error) {
            if (error instanceof Error && error.name !== 'AbortError') {
                console.error('Fetch error:', error);
            }
        } finally {
            if (date === selectedDate) {
                setIsLoadingEntry(false);
            }
        }
    }, [user, supabase, selectedDate]);

    // Initial load and date changes
    useEffect(() => {
        if (user) {
            // Update current entry date immediately for UI responsiveness
            setCurrentEntry(prev => ({ ...prev, entry_date: selectedDate }));

            // If in cache, load immediately
            if (entriesCache.current.has(selectedDate)) {
                fetchEntry(selectedDate);
                return;
            }

            // Otherwise debounce the fetch
            const timeoutId = setTimeout(() => {
                fetchEntry(selectedDate);
            }, 500);

            return () => {
                clearTimeout(timeoutId);
                // Also abort any in-flight requests if we leave this date
                if (abortController.current) {
                    abortController.current.abort();
                }
            };
        }
    }, [user, selectedDate, fetchEntry]);

    const navigateDate = (direction: 'prev' | 'next') => {
        const nextDate = direction === 'prev' 
            ? dayjs(selectedDate).subtract(1, 'day') 
            : dayjs(selectedDate).add(1, 'day');
        setSelectedDate(nextDate.format('YYYY-MM-DD'));
    };

    const goToToday = () => {
        const today = dayjs().format('YYYY-MM-DD');
        setSelectedDate(today);
        setShowCalendar(false);
    };

    const handleDateSelect = (date: Date | string) => {
        setSelectedDate(dayjs(date).format('YYYY-MM-DD'));
        setShowCalendar(false);
    };

    const updateEntryState = (updates: Partial<DiaryEntry>) => {
        const updated = { ...currentEntry, ...updates };
        setCurrentEntry(updated);
        // Optimistically update cache
        entriesCache.current.set(selectedDate, updated);
    };

    const onSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsSaving(true);
        const { error } = await supabase
            .from('diary_entries')
            .upsert(
                {
                    ...currentEntry,
                    user_id: user.id,
                    entry_date: selectedDate,
                },
                { onConflict: 'user_id,entry_date' }
            );

        if (error) {
            console.error('Save error:', error);
            // Optionally revert cache/state here on error
        } else {
            // Confirm cache update
            entriesCache.current.set(selectedDate, currentEntry);
        }
        setIsSaving(false);
    };

    const currentMood = MOODS.find(m => m.value === currentEntry.mood);

    if (authLoading) return <Loader />;

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
                    <button
                        type="button"
                        className="date-display"
                        onClick={() => setShowCalendar(!showCalendar)}
                    >
                        {dayjs(selectedDate).format('MMM D, YYYY')}
                    </button>

                    {showCalendar && (
                        <div className="calendar-dropdown">
                            <MantineCalendar
                                withCellSpacing={false}
                                getDayProps={(date) => ({
                                    selected: dayjs(date).isSame(selectedDate, 'day'),
                                    onClick: () => handleDateSelect(date),
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
            <div className={`diary-card transition-opacity duration-200 ${isLoadingEntry ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
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
                            <ChevronRight size={16} className={`mood-chevron transition-transform ${showMoodPicker ? 'rotate-90' : ''}`} />
                        </button>

                        {showMoodPicker && (
                            <>
                                <div 
                                    className="fixed inset-0 z-10" 
                                    onClick={() => setShowMoodPicker(false)}
                                />
                                <div className="mood-picker z-20">
                                    {MOODS.map((mood) => (
                                        <button
                                            key={mood.value}
                                            type="button"
                                            className={`mood-option ${currentEntry.mood === mood.value ? 'selected' : ''}`}
                                            onClick={() => {
                                                updateEntryState({ mood: mood.value });
                                                setShowMoodPicker(false);
                                            }}
                                            title={mood.label}
                                        >
                                            {mood.emoji}
                                        </button>
                                    ))}
                                </div>
                            </>
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
                            value={currentEntry.title}
                            onChange={(e) => updateEntryState({ title: e.target.value })}
                        />
                    </div>

                    {/* Entry Field */}
                    <div className="form-field">
                        <label htmlFor="entry" className="form-label">Entry</label>
                        <textarea
                            id="entry"
                            className="form-input form-textarea"
                            placeholder="Today I felt relaxed and productive."
                            value={currentEntry.content}
                            onChange={(e) => updateEntryState({ content: e.target.value })}
                        />
                    </div>

                    {/* Save Button */}
                    <button 
                        type="submit" 
                        className="save-btn flex items-center justify-center gap-2"
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="animate-spin" size={16} />
                                Saving...
                            </>
                        ) : (
                            'Save Entry'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
