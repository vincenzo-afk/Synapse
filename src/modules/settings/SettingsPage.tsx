import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Settings, Moon, Sun, Monitor, Palette, Ruler, Bell, Shield } from 'lucide-react'
import { db } from '../../db/schema'
import { upsertSettings } from '../../db/repositories/settings'
import { useThemeStore } from '../../stores/theme-store'
import { Card, CardHeader, CardTitle } from '../../design-system/components/Card'
import { Toggle } from '../../design-system/components/Input'
import { DataPortability } from './components/DataPortability'
import type { ThemeMode } from '../../db/schema'

const ACCENT_COLORS = [
  '#7c6af7', '#3b82f6', '#ef4444', '#22c55e',
  '#f59e0b', '#ec4899', '#06b6d4', '#f97316',
]

const THEME_OPTIONS: Array<{ value: ThemeMode; label: string; icon: React.ReactNode }> = [
  { value: 'light', label: 'Light', icon: <Sun size={16} /> },
  { value: 'dark', label: 'Dark', icon: <Moon size={16} /> },
  { value: 'oled', label: 'OLED', icon: <Monitor size={16} /> },
]

export default function SettingsPage() {
  const { theme, accentColor, setTheme, setAccentColor } = useThemeStore()
  const settings = useLiveQuery(() => db.settings.toArray().then((a) => a[0]))

  const updateUnits = async (metric: boolean) => {
    await upsertSettings({ units: metric ? 'metric' : 'imperial' })
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <Settings size={20} className="text-[var(--color-text-secondary)]" />
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Settings</h1>
      </div>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Palette size={16} className="text-[var(--color-accent)]" />
              Appearance
            </span>
          </CardTitle>
        </CardHeader>
        <div className="space-y-5">
          {/* Theme */}
          <div>
            <div className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">Theme</div>
            <div className="flex gap-2">
              {THEME_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTheme(opt.value)}
                  className={`
                    flex-1 flex items-center justify-center gap-2 h-10 rounded-[var(--radius-md)]
                    text-sm font-medium transition-all duration-150
                    ${theme === opt.value
                      ? 'bg-[var(--color-accent)] text-white shadow-sm'
                      : 'bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                    }
                  `}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Accent color */}
          <div>
            <div className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">Accent Color</div>
            <div className="flex gap-2 flex-wrap">
              {ACCENT_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setAccentColor(color)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${accentColor === color ? 'border-[var(--color-text-primary)] scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: color }}
                  aria-label={`Accent color ${color}`}
                />
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Units */}
      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Ruler size={16} className="text-[var(--color-accent)]" />
              Units
            </span>
          </CardTitle>
        </CardHeader>
        <Toggle
          label="Use metric units (kg, km, ml)"
          checked={settings?.units !== 'imperial'}
          onCheckedChange={(checked) => void updateUnits(checked)}
        />
      </Card>

      {/* Reminders */}
      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Bell size={16} className="text-[var(--color-accent)]" />
              Reminders
            </span>
          </CardTitle>
        </CardHeader>
        <div className="space-y-3">
          <div className="text-sm text-[var(--color-text-secondary)]">
            Reminders are delivered via browser notifications. Permission is only requested when you first set a reminder.
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[var(--color-text-tertiary)] mb-1.5 block">Quiet Hours Start</label>
              <input
                type="time"
                defaultValue={settings?.quietHoursStart ?? '22:00'}
                onChange={(e) => void upsertSettings({ quietHoursStart: e.target.value })}
                className="w-full h-10 px-3 rounded-[var(--radius-md)] bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)]"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--color-text-tertiary)] mb-1.5 block">Quiet Hours End</label>
              <input
                type="time"
                defaultValue={settings?.quietHoursEnd ?? '07:00'}
                onChange={(e) => void upsertSettings({ quietHoursEnd: e.target.value })}
                className="w-full h-10 px-3 rounded-[var(--radius-md)] bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)]"
              />
            </div>
          </div>
          <div className="text-xs text-[var(--color-text-tertiary)] bg-[var(--color-warning-subtle)] text-[var(--color-warning)] px-3 py-2 rounded-[var(--radius-md)]">
            ⚠️ Background reminders when the browser is closed depend on OS/browser support and may not be reliable — this is a web platform limitation.
          </div>
        </div>
      </Card>

      {/* Data Portability & Backup */}
      <DataPortability />

      {/* Privacy */}
      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Shield size={16} className="text-[var(--color-success)]" />
              Privacy
            </span>
          </CardTitle>
        </CardHeader>
        <div className="text-sm text-[var(--color-text-secondary)] space-y-2">
          <p>✅ All your data stays on <strong>this device</strong>, in your browser's storage (IndexedDB).</p>
          <p>✅ Zero network calls — no analytics, no crash reporting, no cloud sync.</p>
          <p>✅ No account, no login, no third party ever sees your data.</p>
        </div>
      </Card>
    </div>
  )
}
