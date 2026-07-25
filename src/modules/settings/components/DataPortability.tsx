/**
 * Data Portability & Backup Engine — Full JSON snapshot/restore, CSV exports, and weekly backup reminders.
 * See docs/11-import-export-backup.md.
 */
import { useState } from 'react'
import { Database, Download, Upload, FileSpreadsheet, ShieldAlert, CheckCircle2, AlertTriangle, Clock, RefreshCw } from 'lucide-react'
import Papa from 'papaparse'
import { db } from '../../../db/schema'
import { reminderEngine } from '../../../engines/reminder-engine'
import { Card, CardHeader, CardTitle } from '../../../design-system/components/Card'
import { Button } from '../../../design-system/components/Button'
import { Toggle } from '../../../design-system/components/Input'
import { Modal } from '../../../design-system/components/Modal'
import { Badge } from '../../../design-system/components/Indicators'

const CURRENT_SCHEMA_VERSION = 1

interface BackupPayload {
  schemaVersion: number
  exportedAt: string
  data: Record<string, unknown[]>
}

export function DataPortability() {
  const [includeBlobs, setIncludeBlobs] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [restoreModalOpen, setRestoreModalOpen] = useState(false)
  const [restoreCandidate, setRestoreCandidate] = useState<BackupPayload | null>(null)
  const [restoreSummary, setRestoreSummary] = useState<Record<string, number>>({})
  const [restoreError, setRestoreError] = useState<string | null>(null)
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // ─── Full JSON Backup ──────────────────────────────────────────────────
  const handleBackup = async () => {
    setIsExporting(true)
    setStatusMsg(null)
    try {
      const allTables = [
        'habits', 'habitLogs', 'tasks', 'projects', 'areas',
        'exercises', 'workouts', 'workoutSessions', 'bodyMeasurements', 'personalRecords',
        'nutritionEntries', 'nutritionGoals', 'waterLogs', 'sleepLogs',
        'studySubjects', 'studySessions', 'collegeSemesters', 'collegeSubjects',
        'collegeAttendance', 'collegeAssignments', 'collegeExams',
        'journalEntries', 'vaultItems', 'personalEvents', 'calendarEvents',
        'reminders', 'timerRecords', 'settings', 'transactions'
      ]
      if (includeBlobs) {
        allTables.push('fileBlobs')
      }

      const snapshot: Record<string, unknown[]> = {}
      for (const tableName of allTables) {
        const table = (db as any)[tableName]
        if (table) {
          snapshot[tableName] = await table.toArray()
        }
      }

      const payload: BackupPayload = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        exportedAt: new Date().toISOString(),
        data: snapshot,
      }

      const jsonStr = JSON.stringify(payload, null, 2)
      const blob = new Blob([jsonStr], { type: 'application/json' })
      const fileName = `synapse-backup-v${CURRENT_SCHEMA_VERSION}-${new Date().toISOString().split('T')[0]}.json`

      // Try File System Access API first per docs/11-import-export-backup.md
      if ('showSaveFilePicker' in window) {
        try {
          const handle = await (window as any).showSaveFilePicker({
            suggestedName: fileName,
            types: [{ description: 'Synapse JSON Backup', accept: { 'application/json': ['.json'] } }],
          })
          const writable = await handle.createWritable()
          await writable.write(blob)
          await writable.close()
          setStatusMsg({ type: 'success', text: `Backup saved successfully to ${fileName}` })
          setIsExporting(false)
          return
        } catch (e: any) {
          if (e.name === 'AbortError') {
            setIsExporting(false)
            return
          }
          // Fall through to standard download if FSA fails
        }
      }

      // Standard <a download> fallback
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setStatusMsg({ type: 'success', text: `Backup downloaded: ${fileName}` })
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: `Backup failed: ${err?.message || 'Unknown error'}` })
    } finally {
      setIsExporting(false)
    }
  }

  // ─── File Selection & Preview for Restore ──────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setRestoreError(null)

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string
        const parsed = JSON.parse(content) as BackupPayload

        if (typeof parsed.schemaVersion !== 'number' || !parsed.data) {
          throw new Error('Invalid backup file format. Missing schemaVersion or data object.')
        }

        // Generate summary counts
        const counts: Record<string, number> = {}
        let totalRecords = 0
        for (const [key, arr] of Object.entries(parsed.data)) {
          if (Array.isArray(arr)) {
            counts[key] = arr.length
            totalRecords += arr.length
          }
        }

        if (totalRecords === 0) {
          throw new Error('Backup file contains 0 records.')
        }

        setRestoreCandidate(parsed)
        setRestoreSummary(counts)
        setRestoreModalOpen(true)
      } catch (err: any) {
        setRestoreError(`Could not read backup file: ${err?.message || 'Invalid JSON'}`)
      }
    }
    reader.readAsText(file)
  }

  // ─── All-or-Nothing Restore Transaction ────────────────────────────────
  const executeRestore = async () => {
    if (!restoreCandidate) return
    setIsRestoring(true)
    try {
      const allTables = [
        'habits', 'habitLogs', 'tasks', 'projects', 'areas',
        'exercises', 'workouts', 'workoutSessions', 'bodyMeasurements', 'personalRecords',
        'nutritionEntries', 'nutritionGoals', 'waterLogs', 'sleepLogs',
        'studySubjects', 'studySessions', 'collegeSemesters', 'collegeSubjects',
        'collegeAttendance', 'collegeAssignments', 'collegeExams',
        'journalEntries', 'vaultItems', 'personalEvents', 'calendarEvents',
        'reminders', 'timerRecords', 'fileBlobs', 'settings', 'transactions'
      ]

      const dexieTables = allTables.map((t) => (db as any)[t]).filter(Boolean)

      // All-or-nothing Dexie transaction per docs/11-import-export-backup.md §Failure risks
      await db.transaction('rw', dexieTables, async () => {
        for (const tableName of allTables) {
          const table = (db as any)[tableName]
          const records = restoreCandidate.data[tableName]
          if (table) {
            await table.clear()
            if (Array.isArray(records) && records.length > 0) {
              await table.bulkAdd(records)
            }
          }
        }
      })

      setRestoreModalOpen(false)
      setRestoreCandidate(null)
      setStatusMsg({ type: 'success', text: 'Database restored successfully! Reloading application...' })
      setTimeout(() => window.location.reload(), 1500)
    } catch (err: any) {
      setRestoreError(`Restore failed during transaction: ${err?.message || 'Database error'}`)
    } finally {
      setIsRestoring(false)
    }
  }

  // ─── Tabular CSV Exports ───────────────────────────────────────────────
  const exportCSV = async (tableName: string, label: string) => {
    try {
      const table = (db as any)[tableName]
      if (!table) return
      const records = await table.toArray()
      if (records.length === 0) {
        setStatusMsg({ type: 'error', text: `No records found in ${label} to export.` })
        return
      }

      const csvStr = Papa.unparse(records)
      const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `synapse-${tableName}-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setStatusMsg({ type: 'success', text: `Exported ${records.length} ${label} to CSV.` })
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: `CSV export failed: ${err?.message}` })
    }
  }

  // ─── Schedule Weekly Backup Reminder ───────────────────────────────────
  const scheduleBackupReminder = async () => {
    await reminderEngine.register({
      sourceType: 'custom' as any,
      sourceId: 'backup',
      time: '10:00',
      days: [0], // Sundays
      repeat: true,
    })
    setStatusMsg({ type: 'success', text: 'Weekly backup reminder scheduled for Sundays at 10:00 AM!' })
  }

  return (
    <Card className="space-y-6">
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <Database size={18} className="text-[var(--color-accent)]" />
            Data Portability & Backup
          </span>
        </CardTitle>
        <p className="text-xs text-[var(--color-text-tertiary)]">
          Export, backup, or restore your complete personal operating system data.
        </p>
      </CardHeader>

      {statusMsg && (
        <div className={`p-3 rounded-[var(--radius-md)] text-xs flex items-center gap-2 ${
          statusMsg.type === 'success' ? 'bg-[var(--color-success-subtle)] text-[var(--color-success)] border border-[var(--color-success)]' : 'bg-[var(--color-danger-subtle)] text-[var(--color-danger)] border border-[var(--color-danger)]'
        }`}>
          {statusMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {restoreError && (
        <div className="p-3 rounded-[var(--radius-md)] text-xs bg-[var(--color-danger-subtle)] text-[var(--color-danger)] border border-[var(--color-danger)] flex items-center gap-2">
          <AlertTriangle size={16} />
          <span>{restoreError}</span>
        </div>
      )}

      {/* Full Database Backup / Restore */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        {/* Backup Box */}
        <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--color-surface-elevated)] border border-[var(--color-border)] space-y-3">
          <div className="flex items-center gap-2 font-bold text-sm text-[var(--color-text-primary)]">
            <Download size={16} className="text-[var(--color-accent)]" />
            <span>Full System Backup</span>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Serializes your entire Dexie database (all 20+ modules) into a single JSON file.
          </p>
          <Toggle
            label="Include attached files & blobs"
            checked={includeBlobs}
            onCheckedChange={setIncludeBlobs}
          />
          <Button
            size="sm"
            className="w-full mt-2"
            onClick={() => void handleBackup()}
            disabled={isExporting}
          >
            {isExporting ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
            <span>{isExporting ? 'Generating...' : 'Export Backup JSON'}</span>
          </Button>
        </div>

        {/* Restore Box */}
        <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--color-surface-elevated)] border border-[var(--color-border)] space-y-3">
          <div className="flex items-center gap-2 font-bold text-sm text-[var(--color-text-primary)]">
            <Upload size={16} className="text-[var(--color-warning)]" />
            <span>Restore from Backup</span>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Import a previously exported Synapse JSON backup file. Triggers a validation preview first.
          </p>
          <label className="block mt-4">
            <span className="sr-only">Choose backup file</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="block w-full text-xs text-[var(--color-text-secondary)]
                file:mr-3 file:py-1.5 file:px-3
                file:rounded-[var(--radius-md)] file:border-0
                file:text-xs file:font-semibold
                file:bg-[var(--color-surface)] file:text-[var(--color-text-primary)]
                hover:file:bg-[var(--color-border)]
                cursor-pointer"
            />
          </label>
          <div className="text-[10px] text-[var(--color-text-tertiary)] flex items-center gap-1">
            <ShieldAlert size={12} className="text-[var(--color-warning)]" />
            All-or-nothing atomic restore transaction.
          </div>
        </div>
      </div>

      {/* Tabular CSV Exports */}
      <div className="border-t border-[var(--color-border)] pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            <FileSpreadsheet size={16} className="text-[var(--color-success)]" />
            <span>Tabular CSV Exports</span>
          </div>
          <Badge variant="default" size="sm">Spreadsheet Compatible</Badge>
        </div>
        <p className="text-xs text-[var(--color-text-secondary)]">
          Export individual tables as CSV files for analysis in Excel, Google Sheets, or R.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Button size="xs" variant="secondary" onClick={() => void exportCSV('tasks', 'Tasks')}>
            Tasks CSV
          </Button>
          <Button size="xs" variant="secondary" onClick={() => void exportCSV('habitLogs', 'Habit Logs')}>
            Habit Logs CSV
          </Button>
          <Button size="xs" variant="secondary" onClick={() => void exportCSV('transactions', 'Finance Ledger')}>
            Finance CSV
          </Button>
          <Button size="xs" variant="secondary" onClick={() => void exportCSV('workoutSessions', 'Workouts')}>
            Workouts CSV
          </Button>
        </div>
      </div>

      {/* Automatic Backup Reminder */}
      <div className="border-t border-[var(--color-border)] pt-4 flex items-center justify-between bg-[var(--color-surface-elevated)] p-3 rounded-[var(--radius-md)]">
        <div className="flex items-center gap-2.5">
          <Clock size={18} className="text-[var(--color-warning)]" />
          <div>
            <div className="text-xs font-bold text-[var(--color-text-primary)]">Automatic Backup Prompts</div>
            <div className="text-[10px] text-[var(--color-text-tertiary)]">Schedule a recurring Sunday 10:00 AM notification to remind you to export a local backup.</div>
          </div>
        </div>
        <Button size="xs" onClick={() => void scheduleBackupReminder()}>
          Enable Reminder
        </Button>
      </div>

      {/* Demo Data Seeder for Testing & Hardening */}
      <div className="border-t border-[var(--color-border)] pt-4 flex items-center justify-between bg-[var(--color-accent-subtle)] p-3 rounded-[var(--radius-md)] border border-[var(--color-accent)]">
        <div className="flex items-center gap-2.5">
          <RefreshCw size={18} className="text-[var(--color-accent)]" />
          <div>
            <div className="text-xs font-bold text-[var(--color-text-primary)]">E2E Hardening & Demo Seeder</div>
            <div className="text-[10px] text-[var(--color-text-tertiary)]">Populates Dexie with realistic sample data across all 18 modules (14-day history, projects, workouts, finance).</div>
          </div>
        </div>
        <Button
          size="xs"
          variant="primary"
          onClick={() => {
            void import('../../../db/seed').then((m) => m.seedDemoData()).then(() => {
              setStatusMsg({ type: 'success', text: 'Demo data seeded successfully! Reloading...' })
              setTimeout(() => window.location.reload(), 1200)
            })
          }}
        >
          Seed Sample Data
        </Button>
      </div>

      {/* Restore Preview Modal */}
      <Modal
        open={restoreModalOpen}
        onOpenChange={(v) => !v && !isRestoring && setRestoreModalOpen(false)}
        title="Confirm System Restore"
        size="md"
      >
        <div className="space-y-4 text-sm text-[var(--color-text-secondary)]">
          <div className="p-3 rounded-[var(--radius-md)] bg-[var(--color-warning-subtle)] border border-[var(--color-warning)] text-[var(--color-warning)] text-xs flex items-start gap-2">
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
            <div>
              <strong>Warning: Overwrite Existing Data</strong>
              <p className="mt-0.5">
                Restoring this backup will atomically clear and replace all current records in your Synapse database. This action cannot be undone unless you export a backup of your current state first.
              </p>
            </div>
          </div>

          <div>
            <div className="text-xs font-bold text-[var(--color-text-primary)] mb-2">Backup Snapshot Details:</div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-[var(--color-surface-elevated)] p-3 rounded-[var(--radius-md)] border border-[var(--color-border)] max-h-[160px] overflow-y-auto">
              <div>Schema Version: <span className="font-bold text-[var(--color-text-primary)]">v{restoreCandidate?.schemaVersion}</span></div>
              <div>Export Date: <span className="font-bold text-[var(--color-text-primary)]">{restoreCandidate?.exportedAt?.split('T')[0]}</span></div>
              {Object.entries(restoreSummary).map(([table, count]) => (
                <div key={table} className="truncate">
                  {table}: <span className="font-bold text-[var(--color-text-primary)]">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[var(--color-border)]">
            <Button size="sm" variant="ghost" onClick={() => setRestoreModalOpen(false)} disabled={isRestoring}>
              Cancel
            </Button>
            <Button size="sm" variant="danger" onClick={() => void executeRestore()} disabled={isRestoring}>
              {isRestoring ? 'Restoring Database...' : 'Confirm & Overwrite All Data'}
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  )
}
