/**
 * College Module — Semesters, Subjects, Attendance tracking, Assignments, Exams, CGPA calculation.
 * See docs/09-modules/college.md.
 */
import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { GraduationCap, Plus, CheckCircle, XCircle, AlertCircle, BookOpen, Award, Calendar as CalendarIcon, Trash2 } from 'lucide-react'
import { db, type AttendanceStatus, type AssignmentStatus } from '../../db/schema'
import { localDateString } from '../../db/repositories/habits'
import { Card, CardHeader, CardTitle } from '../../design-system/components/Card'
import { Button } from '../../design-system/components/Button'
import { Badge, ProgressBar, EmptyState } from '../../design-system/components/Indicators'
import { Modal } from '../../design-system/components/Modal'
import { Input } from '../../design-system/components/Input'
import * as Tabs from '@radix-ui/react-tabs'
import { v4 as uuid } from 'uuid'

// Standard 4.0 scale conversion for CGPA
const GRADE_POINTS: Record<string, number> = {
  'A+': 4.0, 'A': 4.0, 'A-': 3.7,
  'B+': 3.3, 'B': 3.0, 'B-': 2.7,
  'C+': 2.3, 'C': 2.0, 'C-': 1.7,
  'D+': 1.3, 'D': 1.0, 'F': 0.0,
}

export function calculateCGPA(subjects: Array<{ grade?: string; credits: number }>): number {
  let totalPoints = 0
  let totalCredits = 0
  for (const sub of subjects) {
    if (sub.grade && sub.grade in GRADE_POINTS) {
      totalPoints += (GRADE_POINTS[sub.grade] ?? 0) * sub.credits
      totalCredits += sub.credits
    }
  }
  return totalCredits > 0 ? Math.round((totalPoints / totalCredits) * 100) / 100 : 0.0
}

export default function CollegePage() {
  const today = localDateString()
  const [activeSemesterId, setActiveSemesterId] = useState<string | null>(null)

  // Modals
  const [semOpen, setSemOpen] = useState(false)
  const [semName, setSemName] = useState('')
  const [semStart, setSemStart] = useState('2026-01-15')
  const [semEnd, setSemEnd] = useState('2026-05-30')

  const [subOpen, setSubOpen] = useState(false)
  const [subName, setSubName] = useState('')
  const [subCredits, setSubCredits] = useState('3')
  const [subGrade, setSubGrade] = useState('')

  const [assignOpen, setAssignOpen] = useState(false)
  const [assignTitle, setAssignTitle] = useState('')
  const [assignDue, setAssignDue] = useState(today)
  const [assignSubId, setAssignSubId] = useState('')

  const semesters = useLiveQuery(() => db.collegeSemesters.orderBy('startDate').reverse().toArray()) ?? []
  const currentSemId = activeSemesterId ?? semesters[0]?.id

  const subjects = useLiveQuery(() => 
    currentSemId && typeof currentSemId === 'string' ? db.collegeSubjects.where('semesterId').equals(currentSemId).toArray() : []
  , [currentSemId]) ?? []

  const allSubjects = useLiveQuery(() => db.collegeSubjects.toArray()) ?? []
  const attendance = useLiveQuery(() => db.collegeAttendance.toArray()) ?? []
  const assignments = useLiveQuery(() => 
    currentSemId ? db.collegeAssignments.toArray() : []
  , [currentSemId]) ?? []

  const cgpa = calculateCGPA(allSubjects)

  // Save handlers
  const saveSemester = async () => {
    if (!semName.trim()) return
    const now = new Date().toISOString()
    const id = uuid()
    await db.collegeSemesters.add({ id, name: semName, startDate: semStart, endDate: semEnd, createdAt: now, updatedAt: now })
    setActiveSemesterId(id)
    setSemName(''); setSemOpen(false)
  }

  const saveSubject = async () => {
    if (!subName.trim() || !currentSemId) return
    const now = new Date().toISOString()
    await db.collegeSubjects.add({
      id: uuid(), semesterId: currentSemId, name: subName,
      credits: parseFloat(subCredits) || 3,
      targetGrade: subGrade || undefined,
      createdAt: now, updatedAt: now,
    })
    setSubName(''); setSubGrade(''); setSubOpen(false)
  }

  const saveAssignment = async () => {
    if (!assignTitle.trim()) return
    const now = new Date().toISOString()
    const targetSubId = assignSubId || subjects[0]?.id
    if (!targetSubId) return
    await db.collegeAssignments.add({
      id: uuid(), subjectId: targetSubId, title: assignTitle,
      dueDate: assignDue, status: 'todo',
      createdAt: now, updatedAt: now,
    })
    setAssignTitle(''); setAssignOpen(false)
  }

  const logAttendance = async (subjectId: string, status: AttendanceStatus) => {
    const now = new Date().toISOString()
    // Remove existing for today if any, then add
    const existing = await db.collegeAttendance.where({ subjectId, date: today }).first()
    if (existing) {
      await db.collegeAttendance.update(existing.id, { status })
    } else {
      await db.collegeAttendance.add({ id: uuid(), subjectId, date: today, status, createdAt: now, updatedAt: now })
    }
  }

  const toggleAssignmentStatus = async (id: string, current: AssignmentStatus) => {
    const next: AssignmentStatus = current === 'todo' ? 'submitted' : current === 'submitted' ? 'graded' : 'todo'
    await db.collegeAssignments.update(id, { status: next })
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GraduationCap size={22} className="text-[var(--color-college)]" />
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">College & Academics</h1>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => setSemOpen(true)}>+ Semester</Button>
          {currentSemId && <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => setSubOpen(true)}>Add Subject</Button>}
        </div>
      </div>

      {/* CGPA & Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card padding="md">
          <div className="text-xs text-[var(--color-text-tertiary)] mb-1">Cumulative GPA</div>
          <div className="font-mono text-2xl font-bold text-[var(--color-text-primary)]">{cgpa.toFixed(2)}</div>
          <div className="text-[10px] text-[var(--color-text-tertiary)] mt-0.5">4.0 standard scale</div>
        </Card>
        <Card padding="md">
          <div className="text-xs text-[var(--color-text-tertiary)] mb-1">Active Semester</div>
          <div className="font-semibold text-sm text-[var(--color-text-primary)] truncate">
            {semesters.find((s) => s.id === currentSemId)?.name ?? 'None selected'}
          </div>
          <div className="text-[10px] text-[var(--color-text-tertiary)] mt-0.5">{subjects.length} subjects</div>
        </Card>
        <Card padding="md">
          <div className="text-xs text-[var(--color-text-tertiary)] mb-1">Total Credits</div>
          <div className="font-mono text-2xl font-bold text-[var(--color-text-primary)]">
            {allSubjects.reduce((s, sub) => s + sub.credits, 0)}
          </div>
        </Card>
      </div>

      {/* Semester Selector Tabs */}
      {semesters.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {semesters.map((sem) => (
            <button
              key={sem.id}
              onClick={() => setActiveSemesterId(sem.id)}
              className={`px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold whitespace-nowrap transition-all ${
                currentSemId === sem.id ? 'bg-[var(--color-college)] text-white shadow-sm' : 'bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-[var(--color-text-secondary)]'
              }`}
            >
              {sem.name}
            </button>
          ))}
        </div>
      )}

      {/* Main Content Tabs */}
      {semesters.length === 0 ? (
        <EmptyState
          icon={<GraduationCap size={28} />}
          title="No Semesters Added"
          description="Create your first semester to add subjects, track attendance, and log assignments."
          action={<Button onClick={() => setSemOpen(true)} leftIcon={<Plus size={14} />}>Create Semester</Button>}
        />
      ) : (
        <Tabs.Root defaultValue="subjects" className="space-y-4">
          <Tabs.List className="flex gap-1 p-1 bg-[var(--color-surface-elevated)] rounded-[var(--radius-lg)] border border-[var(--color-border)]">
            <Tabs.Trigger value="subjects" className="flex-1 py-1.5 text-xs font-medium rounded-[var(--radius-md)] data-[state=active]:bg-[var(--color-surface)] data-[state=active]:text-[var(--color-text-primary)] text-[var(--color-text-secondary)]">Subjects & Attendance</Tabs.Trigger>
            <Tabs.Trigger value="assignments" className="flex-1 py-1.5 text-xs font-medium rounded-[var(--radius-md)] data-[state=active]:bg-[var(--color-surface)] data-[state=active]:text-[var(--color-text-primary)] text-[var(--color-text-secondary)]">Assignments ({assignments.length})</Tabs.Trigger>
          </Tabs.List>

          {/* Subjects & Attendance View */}
          <Tabs.Content value="subjects">
            <div className="space-y-3">
              {subjects.length === 0 ? (
                <Card><p className="text-center text-sm text-[var(--color-text-tertiary)] py-6">No subjects in this semester.</p></Card>
              ) : (
                subjects.map((sub) => {
                  const subAtt = attendance.filter((a) => a.subjectId === sub.id)
                  const present = subAtt.filter((a) => a.status === 'present').length
                  const total = subAtt.filter((a) => a.status !== 'excused').length
                  const pct = total > 0 ? Math.round((present / total) * 100) : 100
                  const todayAtt = subAtt.find((a) => a.date === today)?.status

                  return (
                    <Card key={sub.id} padding="md" className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-semibold text-base text-[var(--color-text-primary)]">{sub.name}</div>
                          <div className="text-xs text-[var(--color-text-tertiary)]">{sub.credits} Credits {sub.targetGrade && `· Target: ${sub.targetGrade}`}</div>
                        </div>
                        <div className="text-right">
                          <div className={`font-mono text-lg font-bold ${pct < 75 ? 'text-[var(--color-danger)]' : 'text-[var(--color-success)]'}`}>
                            {pct}%
                          </div>
                          <div className="text-[10px] text-[var(--color-text-tertiary)]">{present} / {total} classes</div>
                        </div>
                      </div>

                      <ProgressBar value={pct} color={pct < 75 ? 'var(--color-danger)' : 'var(--color-college)'} height={6} />

                      <div className="flex items-center justify-between pt-1 border-t border-[var(--color-border)]">
                        <span className="text-xs text-[var(--color-text-secondary)]">Today's Attendance:</span>
                        <div className="flex gap-1.5">
                          {(['present', 'absent', 'excused'] as const).map((st) => (
                            <button
                              key={st}
                              onClick={() => void logAttendance(sub.id, st)}
                              className={`px-2.5 py-1 rounded-[var(--radius-sm)] text-xs font-medium capitalize transition-all ${
                                todayAtt === st
                                  ? st === 'present' ? 'bg-[var(--color-success)] text-white' : st === 'absent' ? 'bg-[var(--color-danger)] text-white' : 'bg-[var(--color-warning)] text-white'
                                  : 'bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </div>
                    </Card>
                  )
                })
              )}
            </div>
          </Tabs.Content>

          {/* Assignments View */}
          <Tabs.Content value="assignments">
            <Card className="space-y-4">
              <div className="flex justify-between items-center">
                <CardTitle>Assignments</CardTitle>
                <Button size="xs" leftIcon={<Plus size={12} />} onClick={() => setAssignOpen(true)}>Add Assignment</Button>
              </div>

              {assignments.length === 0 ? (
                <p className="text-center text-sm text-[var(--color-text-tertiary)] py-8">No assignments logged</p>
              ) : (
                <div className="space-y-2">
                  {assignments.map((ass) => {
                    const sub = subjects.find((s) => s.id === ass.subjectId)
                    return (
                      <div key={ass.id} className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] bg-[var(--color-surface-elevated)] border border-[var(--color-border)]">
                        <button
                          onClick={() => void toggleAssignmentStatus(ass.id, ass.status)}
                          className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                            ass.status === 'graded' ? 'bg-[var(--color-success)] border-[var(--color-success)] text-white' :
                            ass.status === 'submitted' ? 'bg-[var(--color-college)] border-[var(--color-college)] text-white' :
                            'border-[var(--color-text-tertiary)]'
                          }`}
                        >
                          {ass.status !== 'todo' && <CheckCircle size={12} />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-medium truncate ${ass.status !== 'todo' ? 'line-through text-[var(--color-text-tertiary)]' : 'text-[var(--color-text-primary)]'}`}>
                            {ass.title}
                          </div>
                          <div className="text-xs text-[var(--color-text-tertiary)]">{sub?.name ?? 'Subject'} · Due: {ass.dueDate}</div>
                        </div>
                        <Badge variant={ass.status === 'graded' ? 'success' : ass.status === 'submitted' ? 'accent' : 'default'} className="capitalize">
                          {ass.status}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          </Tabs.Content>
        </Tabs.Root>
      )}

      {/* Create Semester Modal */}
      <Modal open={semOpen} onOpenChange={(v) => !v && setSemOpen(false)} title="New Semester" size="sm">
        <div className="space-y-4">
          <Input label="Semester Name" value={semName} onChange={(e) => setSemName(e.target.value)} placeholder="e.g. Spring 2026, Semester 4" />
          <div className="grid grid-cols-2 gap-2">
            <Input label="Start Date" type="date" value={semStart} onChange={(e) => setSemStart(e.target.value)} />
            <Input label="End Date" type="date" value={semEnd} onChange={(e) => setSemEnd(e.target.value)} />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setSemOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={() => void saveSemester()}>Create Semester</Button>
          </div>
        </div>
      </Modal>

      {/* Add Subject Modal */}
      <Modal open={subOpen} onOpenChange={(v) => !v && setSubOpen(false)} title="Add Subject" size="sm">
        <div className="space-y-4">
          <Input label="Subject Name" value={subName} onChange={(e) => setSubName(e.target.value)} placeholder="e.g. Data Structures, Linear Algebra" />
          <div className="grid grid-cols-2 gap-2">
            <Input label="Credits" type="number" min={1} max={6} value={subCredits} onChange={(e) => setSubCredits(e.target.value)} />
            <Input label="Target Grade / Current Grade" value={subGrade} onChange={(e) => setSubGrade(e.target.value)} placeholder="e.g. A, B+, 4.0" />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setSubOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={() => void saveSubject()}>Add Subject</Button>
          </div>
        </div>
      </Modal>

      {/* Add Assignment Modal */}
      <Modal open={assignOpen} onOpenChange={(v) => !v && setAssignOpen(false)} title="Add Assignment" size="sm">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1.5 block">Subject</label>
            <select
              value={assignSubId || subjects[0]?.id || ''}
              onChange={(e) => setAssignSubId(e.target.value)}
              className="w-full h-10 px-3 rounded-[var(--radius-md)] bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)]"
            >
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <Input label="Assignment Title" value={assignTitle} onChange={(e) => setAssignTitle(e.target.value)} placeholder="e.g. Homework 3, Project Proposal" />
          <Input label="Due Date" type="date" value={assignDue} onChange={(e) => setAssignDue(e.target.value)} />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={() => void saveAssignment()}>Add Assignment</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
