'use client';
import { DiaryEntry } from "@/types/Diary"
import { useEffect, useState, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Calendar as MantineCalendar } from '@mantine/dates';
import dayjs from 'dayjs';
import './diary.css';
import { fetchEntry, saveDiaryEntry } from "./action";

const MOODS = [
  { value: 1, emoji: '😀', label: 'Great' },
  { value: 2, emoji: '🙂', label: 'Good' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '🙁', label: 'Low' },
  { value: 5, emoji: '😞', label: 'Bad' },
];
const DEFAULT_ENTRY: DiaryEntry = {
  title: '',
  content: '',
  mood: null,
  entry_date: '',
};

function DiaryClient({ initialEntry }: { initialEntry: DiaryEntry }) {
  const [selectedDate, setSelectedDate] = useState(() => dayjs().format('YYYY-MM-DD'));
  const [showCalendar, setShowCalendar] = useState(false);
  const [showMoodPicker, setShowMoodPicker] = useState(false);

  // Data State
  const [isLoadingEntry, setIsLoadingEntry] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<DiaryEntry>({ ...initialEntry, entry_date: selectedDate });

  // Cache
  const entriesCache = useRef<Map<string, DiaryEntry>>(new Map());
  const abortController = useRef<AbortController | null>(null);

  // Fetch entry for a specific date
  const getEntry = useCallback(async (date: string) => {

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
      const { data: entry, error } = await fetchEntry(date);
      if (error) throw error;
      const newEntry = entry ?? {
        ...DEFAULT_ENTRY,
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
  }, [selectedDate]);

  // Initial load and date changes
  useEffect(() => {
    // Update current entry date immediately for UI responsiveness
    setCurrentEntry(prev => ({ ...prev, entry_date: selectedDate }));

    // If in cache, load immediately
    if (entriesCache.current.has(selectedDate)) {
      getEntry(selectedDate);
      return;
    }

    // Otherwise debounce the fetch
    const timeoutId = setTimeout(() => {
      getEntry(selectedDate);
    }, 500);

    return () => {
      clearTimeout(timeoutId);
      // Also abort any in-flight requests if we leave this date
      if (abortController.current) {
        abortController.current.abort();
      }
    };

  }, [selectedDate,getEntry]);

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

  const onSave = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const { error } = await saveDiaryEntry(currentEntry);

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

export default DiaryClient