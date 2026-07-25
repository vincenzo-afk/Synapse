/**
 * Personal & Contacts Module — Birthdays, important dates, gift ideas, CRM.
 * Features: Leap year birthday math, Reminder Engine integration.
 * See docs/09-modules/personal.md.
 */
import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Users, Plus, Gift, Calendar as CalendarIcon, Heart, UserPlus, Trash2, Bell, Sparkles } from 'lucide-react'
import { db, type ContactRelationship, type EventCategory } from '../../db/schema'
import { localDateString } from '../../db/repositories/habits'
import { reminderEngine } from '../../engines/reminder-engine'
import { Card, CardHeader, CardTitle } from '../../design-system/components/Card'
import { Button } from '../../design-system/components/Button'
import { Badge, EmptyState } from '../../design-system/components/Indicators'
import { Modal } from '../../design-system/components/Modal'
import { Input, Textarea } from '../../design-system/components/Input'
import * as Tabs from '@radix-ui/react-tabs'
import { v4 as uuid } from 'uuid'

const RELATIONSHIPS: Array<{ value: ContactRelationship; label: string }> = [
  { value: 'friend', label: 'Friend' },
  { value: 'family', label: 'Family' },
  { value: 'other', label: 'Other' },
]

/**
 * Computes the next occurrence of a yearly recurring date (YYYY-MM-DD).
 * Handles Feb 29 leap year fallback to Feb 28 on non-leap years per docs/09-modules/personal.md §Failure risks.
 */
export function getNextOccurrence(dateStr: string): { nextDateStr: string; daysAway: number } {
  if (!dateStr) return { nextDateStr: '—', daysAway: 999 }
  const parts = dateStr.split('-')
  if (parts.length < 3) return { nextDateStr: '—', daysAway: 999 }
  const month = parseInt(parts[1]!, 10) - 1 // 0-indexed
  const day = parseInt(parts[2]!, 10)

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  let targetYear = now.getFullYear()

  // Leap year check helper
  const isLeapYear = (yr: number) => (yr % 4 === 0 && yr % 100 !== 0) || (yr % 400 === 0)
  let targetDay = day
  if (month === 1 && day === 29 && !isLeapYear(targetYear)) {
    targetDay = 28 // Fallback to Feb 28 on non-leap years
  }

  let nextDate = new Date(targetYear, month, targetDay)
  if (nextDate < todayStart) {
    targetYear += 1
    if (month === 1 && day === 29 && !isLeapYear(targetYear)) {
      targetDay = 28
    } else {
      targetDay = day
    }
    nextDate = new Date(targetYear, month, targetDay)
  }

  const diffTime = nextDate.getTime() - todayStart.getTime()
  const daysAway = Math.round(diffTime / (1000 * 60 * 60 * 24))
  const nextDateStr = `${targetYear}-${String(month + 1).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`

  return { nextDateStr, daysAway }
}

export default function PersonalPage() {
  const [activeContactId, setActiveContactId] = useState<string | null>(null)

  // Modals
  const [contactOpen, setContactOpen] = useState(false)
  const [name, setName] = useState('')
  const [rel, setRel] = useState<ContactRelationship>('friend')
  const [birthday, setBirthday] = useState('')
  const [notes, setNotes] = useState('')
  const [giftInput, setGiftInput] = useState('')

  const [eventOpen, setEventOpen] = useState(false)
  const [eventTitle, setEventTitle] = useState('')
  const [eventDate, setEventDate] = useState(localDateString())
  const [eventCat, setEventCat] = useState<EventCategory>('anniversary')

  const contacts = useLiveQuery(() => db.contacts.orderBy('name').toArray()) ?? []
  const activeContact = contacts.find((c) => c.id === activeContactId) ?? contacts[0]

  const events = useLiveQuery(() => db.personalEvents.orderBy('date').toArray()) ?? []

  // Create Contact & register Reminder
  const saveContact = async () => {
    if (!name.trim()) return
    const now = new Date().toISOString()
    const id = uuid()
    const gifts = giftInput.split(',').map((g) => g.trim()).filter(Boolean)
    await db.contacts.add({
      id, name, relationship: rel, birthday: birthday || undefined,
      notes: notes || undefined, giftIdeas: gifts, createdAt: now, updatedAt: now,
    })

    // Register reminder if birthday exists (3 days before at 09:00) per docs/09-modules/personal.md
    if (birthday) {
      await reminderEngine.register({
        sourceType: 'birthday', sourceId: id,
        time: '09:00', days: [], repeat: true,
      })
    }

    setActiveContactId(id)
    setName(''); setBirthday(''); setNotes(''); setGiftInput('')
    setContactOpen(false)
  }

  const saveEvent = async () => {
    if (!eventTitle.trim()) return
    const now = new Date().toISOString()
    const id = uuid()
    await db.personalEvents.add({
      id, contactId: activeContactId ?? undefined, title: eventTitle,
      date: eventDate, recurring: true, category: eventCat,
      createdAt: now, updatedAt: now,
    })

    // Register default reminder
    await reminderEngine.register({
      sourceType: 'custom', sourceId: id,
      time: '09:00', days: [], repeat: true,
    })

    setEventTitle(''); setEventOpen(false)
  }

  const addGiftToActive = async (gift: string) => {
    if (!activeContact || !gift.trim()) return
    const now = new Date().toISOString()
    const gifts = [...activeContact.giftIdeas, gift.trim()]
    await db.contacts.update(activeContact.id, { giftIdeas: gifts, updatedAt: now })
  }

  const removeGift = async (index: number) => {
    if (!activeContact) return
    const now = new Date().toISOString()
    const gifts = activeContact.giftIdeas.filter((_, i) => i !== index)
    await db.contacts.update(activeContact.id, { giftIdeas: gifts, updatedAt: now })
  }

  // Upcoming Birthdays list sorted by days away
  const upcomingBirthdays = contacts
    .filter((c) => !!c.birthday)
    .map((c) => ({ contact: c, ...getNextOccurrence(c.birthday!) }))
    .sort((a, b) => a.daysAway - b.daysAway)

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={22} className="text-[var(--color-personal)]" />
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Personal & Contacts</h1>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => setEventOpen(true)}>+ Event / Date</Button>
          <Button size="sm" leftIcon={<UserPlus size={14} />} onClick={() => setContactOpen(true)}>Add Contact</Button>
        </div>
      </div>

      {/* Upcoming Birthdays & Events Banner */}
      <Card className="bg-gradient-to-r from-[var(--color-surface-elevated)] to-[var(--color-surface)] border-[var(--color-border)]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm font-bold text-[var(--color-text-primary)]">
            <Sparkles size={16} className="text-[var(--color-warning)]" />
            <span>Upcoming Important Dates</span>
          </div>
          <Badge variant="outline" size="sm">Auto-reminders active</Badge>
        </div>

        {upcomingBirthdays.length === 0 && events.length === 0 ? (
          <p className="text-xs text-[var(--color-text-tertiary)] py-2">No birthdays or important dates logged yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {upcomingBirthdays.slice(0, 3).map((item) => (
              <div key={item.contact.id} className="p-2.5 rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm text-[var(--color-text-primary)]">{item.contact.name}'s Birthday</div>
                  <div className="text-xs text-[var(--color-text-tertiary)] font-mono">{item.nextDateStr}</div>
                </div>
                <Badge variant={item.daysAway === 0 ? 'success' : item.daysAway <= 7 ? 'warning' : 'default'} size="sm">
                  {item.daysAway === 0 ? 'Today! 🎉' : `in ${item.daysAway}d`}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Main Content */}
      {contacts.length === 0 ? (
        <EmptyState
          icon={<Users size={28} />}
          title="No Contacts Added"
          description="Keep track of birthdays, anniversaries, notes, and gift ideas for people who matter."
          action={<Button onClick={() => setContactOpen(true)} leftIcon={<UserPlus size={14} />}>Add First Contact</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Contact Directory Sidebar */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase px-1 mb-2">Directory ({contacts.length})</div>
            {contacts.map((c) => {
              const isSelected = activeContact?.id === c.id
              return (
                <div
                  key={c.id}
                  onClick={() => setActiveContactId(c.id)}
                  className={`flex items-center justify-between p-3 rounded-[var(--radius-md)] cursor-pointer border transition-all ${
                    isSelected ? 'bg-[var(--color-surface)] border-[var(--color-personal)] shadow-sm' : 'bg-[var(--color-surface-elevated)] border-transparent hover:border-[var(--color-border)]'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-sm text-[var(--color-text-primary)]">{c.name}</div>
                    <div className="text-xs text-[var(--color-text-tertiary)] capitalize">{c.relationship} {c.birthday && `· 🎂`}</div>
                  </div>
                  {c.giftIdeas.length > 0 && <Gift size={14} className="text-[var(--color-personal)]" />}
                </div>
              )
            })}
          </div>

          {/* Active Contact Details */}
          {activeContact ? (
            <div className="md:col-span-2 space-y-6">
              <Card className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold text-[var(--color-text-primary)]">{activeContact.name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="capitalize">{activeContact.relationship}</Badge>
                      {activeContact.birthday && (
                        <span className="text-xs text-[var(--color-text-secondary)]">🎂 Birthday: {activeContact.birthday}</span>
                      )}
                    </div>
                  </div>
                  <Button size="xs" variant="ghost" onClick={() => void db.contacts.delete(activeContact.id)}>
                    <Trash2 size={14} className="text-[var(--color-danger)]" />
                  </Button>
                </div>

                {activeContact.notes && (
                  <div className="p-3 rounded-[var(--radius-md)] bg-[var(--color-surface-elevated)] text-sm text-[var(--color-text-secondary)] whitespace-pre-line">
                    {activeContact.notes}
                  </div>
                )}

                {/* Gift Ideas List */}
                <div className="pt-3 border-t border-[var(--color-border)] space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-[var(--color-text-primary)]">
                      <Gift size={16} className="text-[var(--color-personal)]" />
                      <span>Gift Ideas</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add a gift idea..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          void addGiftToActive(e.currentTarget.value)
                          e.currentTarget.value = ''
                        }
                      }}
                      className="flex-1 h-9 px-3 rounded-[var(--radius-md)] bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)]"
                    />
                  </div>

                  {activeContact.giftIdeas.length === 0 ? (
                    <p className="text-xs text-[var(--color-text-tertiary)] py-1">No gift ideas logged yet.</p>
                  ) : (
                    <div className="flex gap-1.5 flex-wrap">
                      {activeContact.giftIdeas.map((gift, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-sm)] bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-xs text-[var(--color-text-primary)]">
                          <span>🎁 {gift}</span>
                          <button onClick={() => void removeGift(idx)} className="text-[var(--color-text-tertiary)] hover:text-[var(--color-danger)]">×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Card>

              {/* Linked Important Events */}
              <Card className="space-y-3">
                <CardHeader>
                  <CardTitle>Linked Events & Anniversaries</CardTitle>
                  <Button size="xs" variant="ghost" onClick={() => setEventOpen(true)}>+ Add Event</Button>
                </CardHeader>
                {events.filter((e) => e.contactId === activeContact.id).length === 0 ? (
                  <p className="text-xs text-[var(--color-text-tertiary)] py-3 text-center">No important events linked to this contact.</p>
                ) : (
                  <div className="space-y-2">
                    {events.filter((e) => e.contactId === activeContact.id).map((ev) => (
                      <div key={ev.id} className="flex justify-between items-center p-2.5 rounded-[var(--radius-md)] bg-[var(--color-surface-elevated)]">
                        <div>
                          <div className="text-sm font-medium text-[var(--color-text-primary)]">{ev.title}</div>
                          <div className="text-xs text-[var(--color-text-tertiary)] font-mono">{ev.date} · {ev.category}</div>
                        </div>
                        <Badge variant="outline">Recurring</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          ) : null}
        </div>
      )}

      {/* Add Contact Modal */}
      <Modal open={contactOpen} onOpenChange={(v) => !v && setContactOpen(false)} title="Add Contact" size="sm">
        <div className="space-y-4">
          <Input label="Name *" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Alex, Mom, Sarah" />
          <div>
            <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1.5 block">Relationship</label>
            <div className="flex gap-2">
              {RELATIONSHIPS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setRel(r.value)}
                  className={`flex-1 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold capitalize transition-all ${
                    rel === r.value ? 'bg-[var(--color-personal)] text-white' : 'bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-[var(--color-text-secondary)]'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <Input label="Birthday (optional, YYYY-MM-DD or 2000-MM-DD)" type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} />
          <Input label="Initial Gift Ideas (comma-separated)" value={giftInput} onChange={(e) => setGiftInput(e.target.value)} placeholder="e.g. Watch, Book on design, Coffee beans" />
          <Textarea label="Notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Favorite colors, hobbies, preferences..." />

          <div className="flex gap-2 justify-end pt-2">
            <Button variant="ghost" size="sm" onClick={() => setContactOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={() => void saveContact()}>Save Contact</Button>
          </div>
        </div>
      </Modal>

      {/* Add Event Modal */}
      <Modal open={eventOpen} onOpenChange={(v) => !v && setEventOpen(false)} title="Add Important Date" size="sm">
        <div className="space-y-4">
          <Input label="Event Title *" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} placeholder="e.g. Wedding Anniversary, Graduation Day" />
          <Input label="Date" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
          <div>
            <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1.5 block">Category</label>
            <select
              value={eventCat}
              onChange={(e) => setEventCat(e.target.value as EventCategory)}
              className="w-full h-10 px-3 rounded-[var(--radius-md)] bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)]"
            >
              <option value="anniversary">Anniversary</option>
              <option value="birthday">Birthday</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="ghost" size="sm" onClick={() => setEventOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={() => void saveEvent()}>Save Event</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
