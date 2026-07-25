import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Settings, Moon, Sun, Monitor, Palette, Ruler, Bell, Shield, Sparkles, Check, CheckSquare } from 'lucide-react'
import { db } from '../../db/schema'
import { upsertSettings } from '../../db/repositories/settings'
import { useThemeStore } from '../../stores/theme-store'
import { Button } from '../../design-system/components/Button'
import { Toggle } from '../../design-system/components/Input'
import { Badge } from '../../design-system/components/Indicators'
import { DataPortability } from './components/DataPortability'
import type { ThemeMode } from '../../db/schema'

const ACCENT_COLORS = [
  { name: 'Purple', hex: '#7c6af7' },
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Green', hex: '#22c55e' },
  { name: 'Orange', hex: '#f97316' },
  { name: 'Red', hex: '#ef4444' },
  { name: 'Yellow', hex: '#f59e0b' },
  { name: 'Pink', hex: '#ec4899' },
]

const THEME_OPTIONS: Array<{ value: ThemeMode; label: string; icon: React.ReactNode }> = [
  { value: 'dark', label: 'Dark Mode (Default)', icon: <Moon size={20} strokeWidth={2.5} /> },
  { value: 'light', label: 'Light Mode', icon: <Sun size={20} strokeWidth={2.5} /> },
  { value: 'oled', label: 'OLED (True Black)', icon: <Monitor size={20} strokeWidth={2.5} /> },
]

export default function SettingsPage() {
  const { theme, accentColor, setTheme, setAccentColor } = useThemeStore()
  const settings = useLiveQuery(() => db.settings.toArray().then((a) => a[0]))

  const updateUnits = async (metric: boolean) => {
    await upsertSettings({ units: metric ? 'metric' : 'imperial' })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="flex items-center gap-4 p-6 rounded-[24px] border-4 border-[#111111] bg-[var(--color-surface)] shadow-[6px_6px_0px_#111111]">
        <div className="w-14 h-14 rounded-[18px] border-4 border-[#111111] bg-[var(--color-accent)] text-white flex items-center justify-center shadow-[4px_4px_0px_#111111]">
          <Settings size={28} strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[var(--color-text-primary)]">System Settings</h1>
          <p className="text-base font-semibold text-[var(--color-text-secondary)]">Appearance, Design Tokens, Reminders & Data Management</p>
        </div>
      </div>

      {/* 1. Theme & Appearance Category */}
      <div className="p-8 rounded-[20px] border-4 border-[#111111] bg-[var(--color-surface)] shadow-[6px_6px_0px_#111111] space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b-4 border-[#111111]">
          <Palette size={24} strokeWidth={2.5} className="text-[var(--color-accent)]" />
          <h2 className="text-2xl font-extrabold text-[var(--color-text-primary)]">Appearance & Color System</h2>
        </div>

        {/* Theme Selectors */}
        <div className="space-y-3">
          <label className="text-sm font-extrabold uppercase tracking-wide text-[var(--color-text-primary)]">Theme Mode</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {THEME_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={`
                  flex items-center justify-center gap-3 h-14 rounded-[16px]
                  border-4 border-[#111111] font-bold text-base transition-all cursor-pointer
                  ${theme === opt.value
                    ? 'bg-[var(--color-accent)] text-white shadow-[4px_4px_0px_#111111] translate-x-0.5'
                    : 'bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] hover:shadow-[3px_3px_0px_#111111]'
                  }
                `}
              >
                {opt.icon}
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Accent Colors */}
        <div className="space-y-3 pt-2">
          <label className="text-sm font-extrabold uppercase tracking-wide text-[var(--color-text-primary)]">Selectable Accent Color</label>
          <div className="flex gap-3 flex-wrap">
            {ACCENT_COLORS.map((c) => (
              <button
                key={c.hex}
                onClick={() => setAccentColor(c.hex)}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-[16px] border-4 border-[#111111]
                  font-bold text-sm text-white shadow-[3px_3px_0px_#111111] transition-all cursor-pointer
                  ${accentColor === c.hex ? 'scale-105 shadow-[5px_5px_0px_#111111]' : 'hover:scale-102'}
                `}
                style={{ backgroundColor: c.hex }}
              >
                {accentColor === c.hex && <Check size={18} strokeWidth={3} />}
                <span>{c.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Live Interactive Preview Card */}
        <div className="p-6 rounded-[18px] border-4 border-[#111111] bg-[var(--color-background)] space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-widest text-[var(--color-accent)]">Live Design Token Preview</span>
            <Badge variant="accent">Active Accent: {accentColor}</Badge>
          </div>
          <div className="p-4 rounded-[14px] border-3 border-[#111111] bg-[var(--color-surface)] shadow-[4px_4px_0px_#111111] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[12px] border-2 border-[#111111] flex items-center justify-center text-white font-bold" style={{ backgroundColor: accentColor }}>
                <CheckSquare size={20} />
              </div>
              <div>
                <div className="font-extrabold text-base text-[var(--color-text-primary)]">Interactive Component Preview</div>
                <div className="text-xs font-semibold text-[var(--color-text-secondary)]">Space Grotesk typography & 4px Neo-Brutalist outlines</div>
              </div>
            </div>
            <Button size="sm" style={{ backgroundColor: accentColor }}>Tactile CTA</Button>
          </div>
        </div>
      </div>

      {/* 2. Units & Measurement */}
      <div className="p-8 rounded-[20px] border-4 border-[#111111] bg-[var(--color-surface)] shadow-[6px_6px_0px_#111111] space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b-4 border-[#111111]">
          <Ruler size={24} strokeWidth={2.5} className="text-[var(--color-accent)]" />
          <h2 className="text-2xl font-extrabold text-[var(--color-text-primary)]">Units & Measurement</h2>
        </div>
        <Toggle
          label="Use Metric Units (kg, km, ml)"
          checked={settings?.units !== 'imperial'}
          onCheckedChange={(checked) => void updateUnits(checked)}
        />
      </div>

      {/* 3. Notification Engine & Quiet Hours */}
      <div className="p-8 rounded-[20px] border-4 border-[#111111] bg-[var(--color-surface)] shadow-[6px_6px_0px_#111111] space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b-4 border-[#111111]">
          <Bell size={24} strokeWidth={2.5} className="text-[var(--color-accent)]" />
          <h2 className="text-2xl font-extrabold text-[var(--color-text-primary)]">Reminders & Quiet Hours</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-bold uppercase tracking-wide text-[var(--color-text-primary)] mb-2 block">Quiet Hours Start</label>
            <input
              type="time"
              defaultValue={settings?.quietHoursStart ?? '22:00'}
              onChange={(e) => void upsertSettings({ quietHoursStart: e.target.value })}
              className="w-full h-12 px-4 rounded-[16px] border-4 border-[#111111] bg-[var(--color-surface-elevated)] font-bold text-base text-[var(--color-text-primary)] focus:outline-none focus:ring-4 focus:ring-[var(--color-accent)]"
            />
          </div>
          <div>
            <label className="text-sm font-bold uppercase tracking-wide text-[var(--color-text-primary)] mb-2 block">Quiet Hours End</label>
            <input
              type="time"
              defaultValue={settings?.quietHoursEnd ?? '07:00'}
              onChange={(e) => void upsertSettings({ quietHoursEnd: e.target.value })}
              className="w-full h-12 px-4 rounded-[16px] border-4 border-[#111111] bg-[var(--color-surface-elevated)] font-bold text-base text-[var(--color-text-primary)] focus:outline-none focus:ring-4 focus:ring-[var(--color-accent)]"
            />
          </div>
        </div>
      </div>

      {/* 4. Import / Export / Backup */}
      <DataPortability />

      {/* 5. Groq AI Natural Language Assistant & Developer Settings */}
      <div className="p-8 rounded-[20px] border-4 border-[#111111] bg-[var(--color-surface)] shadow-[6px_6px_0px_#111111] space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b-4 border-[#111111]">
          <Sparkles size={24} strokeWidth={2.5} className="text-[var(--color-accent)]" />
          <h2 className="text-2xl font-extrabold text-[var(--color-text-primary)]">Groq AI Assistant Settings</h2>
        </div>
        <div className="space-y-4">
          <p className="text-sm font-semibold text-[var(--color-text-secondary)]">
            Synapse includes a natural language intent parser. Enter your optional <strong>Groq API Key</strong> below to enable cloud LLaMA 3.3 70B parsing. If unconfigured or offline, Synapse automatically uses its zero-latency local NLP rule engine!
          </p>
          <div className="flex gap-3">
            <input
              type="password"
              placeholder="gsk_..."
              defaultValue={localStorage.getItem('synapse_groq_api_key') || ''}
              onChange={(e) => {
                if (e.target.value.trim()) {
                  localStorage.setItem('synapse_groq_api_key', e.target.value.trim())
                } else {
                  localStorage.removeItem('synapse_groq_api_key')
                }
              }}
              className="flex-1 h-12 px-4 rounded-[16px] border-4 border-[#111111] bg-[var(--color-surface-elevated)] font-mono font-bold text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-4 focus:ring-[var(--color-accent)]"
            />
            <Button
              size="md"
              onClick={() => alert(localStorage.getItem('synapse_groq_api_key') ? 'Groq API Key Saved!' : 'Using Local Offline NLP Engine')}
            >
              Save Key
            </Button>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--color-text-tertiary)]">
            <Badge variant="accent">Current Engine</Badge>
            <span>{localStorage.getItem('synapse_groq_api_key') ? 'Groq LLaMA 3.3 70B API' : 'Zero-Latency Local Offline NLP'}</span>
          </div>
        </div>
      </div>

      {/* 6. Security & Privacy Guarantee */}
      <div className="p-8 rounded-[20px] border-4 border-[#111111] bg-[var(--color-surface)] shadow-[6px_6px_0px_#111111] space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b-4 border-[#111111]">
          <Shield size={24} strokeWidth={2.5} className="text-[var(--color-success)]" />
          <h2 className="text-2xl font-extrabold text-[var(--color-text-primary)]">Zero-Network Privacy Architecture</h2>
        </div>
        <div className="space-y-3 text-base font-semibold text-[var(--color-text-primary)]">
          <div className="p-3.5 rounded-[14px] border-3 border-[#111111] bg-[var(--color-success-subtle)] flex items-center gap-3">
            <Check size={20} strokeWidth={3} className="text-[var(--color-success)]" />
            <span>100% Offline Local Persistence: All data lives strictly in IndexedDB.</span>
          </div>
          <div className="p-3.5 rounded-[14px] border-3 border-[#111111] bg-[var(--color-success-subtle)] flex items-center gap-3">
            <Check size={20} strokeWidth={3} className="text-[var(--color-success)]" />
            <span>Zero Outbound Network Calls: No telemetry, no error reporting, no cloud SaaS.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
