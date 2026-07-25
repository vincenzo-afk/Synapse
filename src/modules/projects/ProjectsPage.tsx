/**
 * Projects Module — Rich project management reusing `projects` table and task grouping.
 * Features: Roadmap stage, Milestones, Progress % calculation, Task integration.
 * See docs/09-modules/projects.md.
 */
import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Briefcase, Plus, CheckCircle2, Circle, Target, Calendar as CalendarIcon, ChevronRight, Folder } from 'lucide-react'
import { db, type Project, type Milestone } from '../../db/schema'
import { localDateString } from '../../db/repositories/habits'
import { Card, CardHeader, CardTitle } from '../../design-system/components/Card'
import { Button } from '../../design-system/components/Button'
import { Badge, ProgressBar, EmptyState } from '../../design-system/components/Indicators'
import { Modal } from '../../design-system/components/Modal'
import { Input } from '../../design-system/components/Input'
import { v4 as uuid } from 'uuid'

const STAGES = ['Idea', 'Planning', 'In Progress', 'Testing', 'Completed', 'Archived']
const COLORS = ['#7c6af7', '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#ec4899', '#06b6d4']

export default function ProjectsPage() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [projName, setProjName] = useState('')
  const [projColor, setProjColor] = useState('#7c6af7')
  const [projStage, setProjStage] = useState('In Progress')

  const [msOpen, setMsOpen] = useState(false)
  const [msTitle, setMsTitle] = useState('')
  const [msDue, setMsDue] = useState(localDateString())

  const projects = useLiveQuery(() => db.projects.filter((p) => !p.archivedAt).toArray()) ?? []
  const activeProject = projects.find((p) => p.id === selectedProjectId) ?? projects[0]

  const projectTasks = useLiveQuery(() => 
    activeProject ? db.tasks.where('projectId').equals(activeProject.id).toArray() : []
  , [activeProject?.id]) ?? []

  const saveProject = async () => {
    if (!projName.trim()) return
    const now = new Date().toISOString()
    const id = uuid()
    await db.projects.add({
      id, name: projName, color: projColor, roadmapStage: projStage,
      milestones: [], createdAt: now, updatedAt: now,
    })
    setSelectedProjectId(id)
    setProjName(''); setCreateOpen(false)
  }

  const addMilestone = async () => {
    if (!msTitle.trim() || !activeProject) return
    const now = new Date().toISOString()
    const updatedMs: Milestone[] = [
      ...(activeProject.milestones ?? []),
      { id: uuid(), title: msTitle, dueDate: msDue, completed: false }
    ]
    await db.projects.update(activeProject.id, { milestones: updatedMs, updatedAt: now })
    setMsTitle(''); setMsOpen(false)
  }

  const toggleMilestone = async (msId: string) => {
    if (!activeProject) return
    const now = new Date().toISOString()
    const updatedMs = (activeProject.milestones ?? []).map((m) => 
      m.id === msId ? { ...m, completed: !m.completed } : m
    )
    await db.projects.update(activeProject.id, { milestones: updatedMs, updatedAt: now })
  }

  const updateStage = async (stage: string) => {
    if (!activeProject) return
    await db.projects.update(activeProject.id, { roadmapStage: stage, updatedAt: new Date().toISOString() })
  }

  const completedTasksCount = projectTasks.filter((t) => t.status === 'done').length
  const progressPct = projectTasks.length > 0 
    ? Math.round((completedTasksCount / projectTasks.length) * 100)
    : activeProject && (activeProject.milestones?.length ?? 0) > 0
    ? Math.round(((activeProject.milestones?.filter((m) => m.completed).length ?? 0) / (activeProject.milestones?.length ?? 1)) * 100)
    : 0

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Briefcase size={22} className="text-[var(--color-accent)]" />
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Projects & Roadmap</h1>
        </div>
        <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => setCreateOpen(true)}>
          New Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={<Folder size={28} />}
          title="No Projects Yet"
          description="Create your first project to track roadmaps, milestones, and linked tasks."
          action={<Button onClick={() => setCreateOpen(true)} leftIcon={<Plus size={14} />}>Create Project</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sidebar Project List */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase px-1 mb-2">Active Projects ({projects.length})</div>
            {projects.map((proj) => {
              const isSelected = activeProject?.id === proj.id
              return (
                <div
                  key={proj.id}
                  onClick={() => setSelectedProjectId(proj.id)}
                  className={`flex items-center gap-3 p-3 rounded-[var(--radius-md)] cursor-pointer border transition-all ${
                    isSelected
                      ? 'bg-[var(--color-surface)] border-[var(--color-accent)] shadow-sm'
                      : 'bg-[var(--color-surface-elevated)] border-transparent hover:border-[var(--color-border)]'
                  }`}
                >
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: proj.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-[var(--color-text-primary)] truncate">{proj.name}</div>
                    <div className="text-xs text-[var(--color-text-tertiary)]">{proj.roadmapStage ?? 'Planning'}</div>
                  </div>
                  <ChevronRight size={14} className="text-[var(--color-text-tertiary)]" />
                </div>
              )
            })}
          </div>

          {/* Active Project Details */}
          {activeProject ? (
            <div className="md:col-span-2 space-y-6">
              <Card className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: activeProject.color }} />
                      <h2 className="text-xl font-bold text-[var(--color-text-primary)]">{activeProject.name}</h2>
                    </div>
                    <div className="flex gap-1.5 flex-wrap mt-2">
                      {STAGES.map((stg) => (
                        <button
                          key={stg}
                          onClick={() => void updateStage(stg)}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                            (activeProject.roadmapStage ?? 'In Progress') === stg
                              ? 'bg-[var(--color-accent)] text-white'
                              : 'bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                          }`}
                        >
                          {stg}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Badge variant="accent">{progressPct}% Complete</Badge>
                </div>

                <ProgressBar value={progressPct} color={activeProject.color} height={8} />

                {/* Milestones */}
                <div className="pt-3 border-t border-[var(--color-border)] space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Roadmap Milestones</h3>
                    <Button size="xs" variant="ghost" leftIcon={<Plus size={12} />} onClick={() => setMsOpen(true)}>Add Milestone</Button>
                  </div>

                  {(activeProject.milestones ?? []).length === 0 ? (
                    <p className="text-xs text-[var(--color-text-tertiary)] py-2">No milestones set for this project.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {(activeProject.milestones ?? []).map((ms) => (
                        <div key={ms.id} className="flex items-center gap-2.5 p-2 rounded-[var(--radius-sm)] bg-[var(--color-surface-elevated)]">
                          <button onClick={() => void toggleMilestone(ms.id)} className="text-[var(--color-accent)] hover:scale-110 transition-transform">
                            {ms.completed ? <CheckCircle2 size={16} className="text-[var(--color-success)]" /> : <Circle size={16} className="text-[var(--color-text-tertiary)]" />}
                          </button>
                          <span className={`text-sm flex-1 ${ms.completed ? 'line-through text-[var(--color-text-tertiary)]' : 'text-[var(--color-text-primary)]'}`}>
                            {ms.title}
                          </span>
                          {ms.dueDate && <span className="text-xs text-[var(--color-text-tertiary)] font-mono">{ms.dueDate}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>

              {/* Linked Tasks */}
              <Card className="space-y-3">
                <CardHeader>
                  <CardTitle>Linked Tasks ({projectTasks.length})</CardTitle>
                </CardHeader>
                {projectTasks.length === 0 ? (
                  <p className="text-xs text-[var(--color-text-tertiary)] py-4 text-center">No tasks linked to this project in the Tasks module.</p>
                ) : (
                  <div className="space-y-1.5">
                    {projectTasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-2 rounded-[var(--radius-sm)] bg-[var(--color-surface-elevated)] text-sm">
                        <span className={task.status === 'done' ? 'line-through text-[var(--color-text-tertiary)]' : 'text-[var(--color-text-primary)]'}>
                          {task.title}
                        </span>
                        <Badge variant={task.status === 'done' ? 'success' : 'default'} className="capitalize">{task.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          ) : null}
        </div>
      )}

      {/* New Project Modal */}
      <Modal open={createOpen} onOpenChange={(v) => !v && setCreateOpen(false)} title="New Project" size="sm">
        <div className="space-y-4">
          <Input label="Project Name" value={projName} onChange={(e) => setProjName(e.target.value)} placeholder="e.g. Synapse PWA, Novel Draft" />
          <div>
            <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-2 block">Color</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setProjColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${projColor === c ? 'border-[var(--color-text-primary)] scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={() => void saveProject()}>Create Project</Button>
          </div>
        </div>
      </Modal>

      {/* New Milestone Modal */}
      <Modal open={msOpen} onOpenChange={(v) => !v && setMsOpen(false)} title="Add Milestone" size="sm">
        <div className="space-y-4">
          <Input label="Milestone Title" value={msTitle} onChange={(e) => setMsTitle(e.target.value)} placeholder="e.g. v1.0 Alpha Release" />
          <Input label="Target Date" type="date" value={msDue} onChange={(e) => setMsDue(e.target.value)} />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setMsOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={() => void addMilestone()}>Add Milestone</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
