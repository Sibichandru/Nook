'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Alert,
  Badge,
  Box,
  Card,
  Group,
  NumberInput,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  TextInput,
  Title,
  UnstyledButton,
} from '@mantine/core'
import { DateTimePicker } from '@mantine/dates'
import { Bell, BellOff, Droplets, Coffee, Plus, Trash2, Loader2 } from 'lucide-react'
import { Reminder, ReminderType } from '@/types/Reminder'
import { useNotifications } from '@/hooks/useNotifications'
import { useReminderScheduler } from '@/hooks/useReminderScheduler'
import { createReminder, deleteReminder, toggleReminder, updateReminder } from './action'
import './reminders.css'

interface QuickPreset {
  key: string
  label: string
  icon: typeof Droplets
  defaultInterval: number
}

const QUICK_PRESETS: QuickPreset[] = [
  { key: 'drink-water', label: 'Drink Water', icon: Droplets, defaultInterval: 30 },
  { key: 'take-a-rest', label: 'Take a Rest', icon: Coffee, defaultInterval: 60 },
]

/* ------------------------------------------------------------------ */
/*  Countdown Ring                                                     */
/* ------------------------------------------------------------------ */

function CountdownRing({ remainingMs, totalMs }: { remainingMs: number; totalMs: number }) {
  const size = 96
  const strokeWidth = 5
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  const progress = Math.max(0, Math.min(1, remainingMs / totalMs))
  const offset = circumference * (1 - progress)

  const totalSec = Math.max(0, Math.ceil(remainingMs / 1000))
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60

  const display =
    h > 0
      ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
      : `${m}:${s.toString().padStart(2, '0')}`

  return (
    <div className="countdown-ring">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="countdown-track"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`countdown-indicator ${progress <= 0.15 ? 'countdown-indicator--urgent' : ''}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className="countdown-time">{display}</span>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

function RemindersClient({ initialReminders }: { initialReminders: Reminder[] }) {
  const [reminders, setReminders] = useState<Reminder[]>(initialReminders)
  const [isCreating, setIsCreating] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [type, setType] = useState<ReminderType>('one_time')
  const [intervalMinutes, setIntervalMinutes] = useState<number | string>('')
  const [scheduledAt, setScheduledAt] = useState<string | null>(null)

  const { permission, sendNotification } = useNotifications()
  const countdowns = useReminderScheduler(reminders, sendNotification)

  // --- Quick Preset logic ---
  const getPresetReminder = useCallback(
    (preset: QuickPreset) =>
      reminders.find(
        (r) => r.title === preset.label && r.type === 'recurring',
      ),
    [reminders],
  )

  // Debounce ref for interval changes
  const debounceTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  useEffect(() => {
    const timers = debounceTimers.current
    return () => {
      timers.forEach((t) => clearTimeout(t))
    }
  }, [])

  const handlePresetToggle = async (preset: QuickPreset, checked: boolean) => {
    const existing = getPresetReminder(preset)

    if (checked && !existing) {
      const { data } = await createReminder({
        title: preset.label,
        type: 'recurring',
        interval_minutes: preset.defaultInterval,
        scheduled_at: null,
      })
      if (data) {
        setReminders((prev) => [data, ...prev])
      }
    } else if (checked && existing && !existing.is_active) {
      setReminders((prev) =>
        prev.map((r) => (r.id === existing.id ? { ...r, is_active: true } : r)),
      )
      const { error } = await toggleReminder(existing.id, true)
      if (error) {
        setReminders((prev) =>
          prev.map((r) => (r.id === existing.id ? { ...r, is_active: false } : r)),
        )
      }
    } else if (!checked && existing) {
      setReminders((prev) =>
        prev.map((r) => (r.id === existing.id ? { ...r, is_active: false } : r)),
      )
      const { error } = await toggleReminder(existing.id, false)
      if (error) {
        setReminders((prev) =>
          prev.map((r) => (r.id === existing.id ? { ...r, is_active: true } : r)),
        )
      }
    }
  }

  const handlePresetIntervalChange = (preset: QuickPreset, value: number | string) => {
    const minutes = typeof value === 'string' ? null : value
    const existing = getPresetReminder(preset)
    if (!existing || minutes === null || minutes < 1) return

    setReminders((prev) =>
      prev.map((r) =>
        r.id === existing.id ? { ...r, interval_minutes: minutes } : r,
      ),
    )

    const prev = debounceTimers.current.get(existing.id)
    if (prev) clearTimeout(prev)

    const timer = setTimeout(async () => {
      debounceTimers.current.delete(existing.id)
      const { error } = await updateReminder(existing.id, { interval_minutes: minutes })
      if (error) {
        setReminders((r) =>
          r.map((rem) =>
            rem.id === existing.id
              ? { ...rem, interval_minutes: existing.interval_minutes }
              : rem,
          ),
        )
      }
    }, 500)

    debounceTimers.current.set(existing.id, timer)
  }

  // --- Custom Reminder logic ---
  const customReminders = reminders.filter(
    (r) => !QUICK_PRESETS.some((p) => p.label === r.title && r.type === 'recurring'),
  )

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setIsCreating(true)
    const { data, error } = await createReminder({
      title: title.trim(),
      type,
      interval_minutes: type === 'recurring' ? (Number(intervalMinutes) || null) : null,
      scheduled_at: type === 'one_time' && scheduledAt ? new Date(scheduledAt).toISOString() : null,
    })
    if (!error && data) {
      setReminders((prev) => [data, ...prev])
      setTitle('')
      setIntervalMinutes('')
      setScheduledAt(null)
    }
    setIsCreating(false)
  }

  const handleToggle = async (id: string, isActive: boolean) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, is_active: isActive } : r)),
    )
    const { error } = await toggleReminder(id, isActive)
    if (error) {
      setReminders((prev) =>
        prev.map((r) => (r.id === id ? { ...r, is_active: !isActive } : r)),
      )
    }
  }

  const handleDelete = async (id: string) => {
    const prev = reminders
    setReminders((r) => r.filter((rem) => rem.id !== id))
    const { error } = await deleteReminder(id)
    if (error) {
      setReminders(prev)
    }
  }

  return (
    <div className="reminders-container">
      <Title order={2} className="reminders-title">Reminders</Title>

      {/* Notification permission banner */}
      {permission !== 'granted' && permission !== 'unsupported' && (
        <Alert
          variant="light"
          color="yellow"
          icon={<BellOff size={18} />}
          className="reminders-alert"
        >
          {permission === 'denied'
            ? 'Notifications are blocked. Enable them in your browser settings to receive reminder alerts.'
            : 'Allow notifications to receive reminder alerts.'}
        </Alert>
      )}

      {permission === 'unsupported' && (
        <Alert variant="light" color="red" icon={<BellOff size={18} />} className="reminders-alert">
          Your browser does not support desktop notifications.
        </Alert>
      )}

      {/* Quick Reminders */}
      <section className="reminders-section">
        <Group gap="xs" mb="md">
          <Bell size={18} className="reminders-section-icon" />
          <Title order={4}>Quick Reminders</Title>
        </Group>

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          {QUICK_PRESETS.map((preset) => {
            const existing = getPresetReminder(preset)
            const isActive = existing?.is_active ?? false
            const interval = existing?.interval_minutes ?? preset.defaultInterval
            const Icon = preset.icon
            const remainingMs = existing ? countdowns[existing.id] : undefined

            return (
              <Card
                key={preset.key}
                className={`preset-card ${isActive ? 'preset-card--active' : ''}`}
                padding="lg"
                withBorder
              >
                <Group justify="space-between" mb={isActive && remainingMs !== undefined ? 4 : 'sm'}>
                  <Group gap="sm">
                    <Box className={`preset-icon-wrapper ${isActive ? 'preset-icon-wrapper--active' : ''}`}>
                      <Icon size={20} />
                    </Box>
                    <Text fw={600} size="sm">{preset.label}</Text>
                  </Group>
                  <Switch
                    checked={isActive}
                    onChange={(e) => handlePresetToggle(preset, e.currentTarget.checked)}
                    color="electricIndigo"
                    size="md"
                  />
                </Group>

                {isActive && remainingMs !== undefined && (
                  <CountdownRing
                    remainingMs={remainingMs}
                    totalMs={interval * 60_000}
                  />
                )}

                <Group gap="xs" align="center" mt={isActive && remainingMs !== undefined ? 4 : 0}>
                  <Text size="xs" c="dimmed">Every</Text>
                  <NumberInput
                    value={interval}
                    onChange={(val) => handlePresetIntervalChange(preset, val)}
                    min={1}
                    max={1440}
                    step={5}
                    size="xs"
                    w={80}
                    disabled={!isActive}
                    classNames={{ input: 'preset-interval-input' }}
                  />
                  <Text size="xs" c="dimmed">min</Text>
                </Group>
              </Card>
            )
          })}
        </SimpleGrid>
      </section>

      {/* Custom Reminders */}
      <section className="reminders-section">
        <Group gap="xs" mb="md">
          <Plus size={18} className="reminders-section-icon" />
          <Title order={4}>Custom Reminders</Title>
        </Group>

        {/* Create form */}
        <Card className="custom-form-card" padding="lg" withBorder mb="md">
          <form onSubmit={handleCreate}>
            <Stack gap="sm">
              <TextInput
                placeholder="Reminder title"
                value={title}
                onChange={(e) => setTitle(e.currentTarget.value)}
                required
                size="sm"
              />

              <SegmentedControl
                value={type}
                onChange={(val) => setType(val as ReminderType)}
                data={[
                  { label: 'One-time', value: 'one_time' },
                  { label: 'Recurring', value: 'recurring' },
                ]}
                size="sm"
                fullWidth
                color="electricIndigo"
              />

              {type === 'recurring' ? (
                <NumberInput
                  placeholder="Interval (minutes)"
                  value={intervalMinutes}
                  onChange={setIntervalMinutes}
                  min={1}
                  max={1440}
                  required
                  size="sm"
                />
              ) : (
                <DateTimePicker
                  placeholder="Pick date and time"
                  value={scheduledAt}
                  onChange={setScheduledAt}
                  minDate={new Date()}
                  required
                  size="sm"
                  clearable
                />
              )}

              <UnstyledButton
                type="submit"
                className="save-btn"
                disabled={isCreating}
              >
                {isCreating ? (
                  <Group gap={8} justify="center">
                    <Loader2 className="animate-spin" size={16} />
                    <span>Creating...</span>
                  </Group>
                ) : (
                  'Add Reminder'
                )}
              </UnstyledButton>
            </Stack>
          </form>
        </Card>

        {/* List */}
        {customReminders.length === 0 ? (
          <Text ta="center" c="dimmed" size="sm" py="xl">
            No custom reminders yet.
          </Text>
        ) : (
          <Stack gap="sm">
            {customReminders.map((r) => (
              <Card
                key={r.id}
                className={`reminder-item ${r.is_active ? '' : 'reminder-item--paused'}`}
                padding="sm"
                withBorder
              >
                <Group justify="space-between" wrap="nowrap">
                  <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
                    <Switch
                      checked={r.is_active}
                      onChange={(e) => handleToggle(r.id, e.currentTarget.checked)}
                      color="electricIndigo"
                      size="sm"
                    />
                    <Box style={{ minWidth: 0 }}>
                      <Text size="sm" fw={600} truncate="end">{r.title}</Text>
                      <Badge
                        size="xs"
                        variant="light"
                        color={r.type === 'recurring' ? 'electricIndigo' : 'teal'}
                        mt={4}
                      >
                        {r.type === 'recurring'
                          ? `Every ${r.interval_minutes}m`
                          : r.scheduled_at
                            ? new Date(r.scheduled_at).toLocaleString()
                            : 'No date'}
                      </Badge>
                    </Box>
                  </Group>

                  <UnstyledButton
                    className="reminder-delete-btn"
                    onClick={() => handleDelete(r.id)}
                    aria-label={`Delete ${r.title}`}
                  >
                    <Trash2 size={16} />
                  </UnstyledButton>
                </Group>
              </Card>
            ))}
          </Stack>
        )}
      </section>
    </div>
  )
}

export default RemindersClient
