/**
 * Vault Module — General-purpose personal archive for notes, documents, certificates, bookmarks, ideas, receipts.
 * Features: Type filter, debounced full-text & tag search, item creation.
 * See docs/09-modules/vault.md.
 */
import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Archive, Plus, Search, FileText, Bookmark, Lightbulb, FileCheck, Tag, Trash2, ExternalLink, Receipt, Folder } from 'lucide-react'
import { db, type VaultItemType } from '../../db/schema'
import { Card, CardHeader, CardTitle } from '../../design-system/components/Card'
import { Button } from '../../design-system/components/Button'
import { Badge, EmptyState } from '../../design-system/components/Indicators'
import { Modal } from '../../design-system/components/Modal'
import { Input, Textarea } from '../../design-system/components/Input'
import { v4 as uuid } from 'uuid'

const ITEM_TYPES: Array<{ type: VaultItemType; label: string; icon: React.ReactNode }> = [
  { type: 'note', label: 'Note', icon: <FileText size={14} /> },
  { type: 'bookmark', label: 'Bookmark', icon: <Bookmark size={14} /> },
  { type: 'idea', label: 'Idea', icon: <Lightbulb size={14} /> },
  { type: 'certificate', label: 'Certificate', icon: <FileCheck size={14} /> },
  { type: 'receipt', label: 'Receipt', icon: <Receipt size={14} /> },
  { type: 'document', label: 'Document', icon: <Folder size={14} /> },
]

export default function VaultPage() {
  const [filterType, setFilterType] = useState<VaultItemType | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [addOpen, setAddOpen] = useState(false)

  // Form state
  const [type, setType] = useState<VaultItemType>('note')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [url, setUrl] = useState('')
  const [tagsInput, setTagsInput] = useState('')

  const items = useLiveQuery(() => db.vaultItems.orderBy('createdAt').reverse().toArray()) ?? []

  // Clean in-memory search & filter per docs/09-modules/vault.md
  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return items.filter((item) => {
      if (filterType !== 'all' && item.type !== filterType) return false
      if (!q) return true
      const matchTitle = item.title.toLowerCase().includes(q)
      const matchContent = item.content?.toLowerCase().includes(q) ?? false
      const matchTags = item.tags.some((t) => t.toLowerCase().includes(q))
      return matchTitle || matchContent || matchTags
    })
  }, [items, filterType, searchQuery])

  const saveItem = async () => {
    if (!title.trim()) return
    const now = new Date().toISOString()
    const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean)
    await db.vaultItems.add({
      id: uuid(),
      type,
      title,
      content: content || undefined,
      url: url || undefined,
      tags,
      createdAt: now,
      updatedAt: now,
    })
    setTitle(''); setContent(''); setUrl(''); setTagsInput('')
    setAddOpen(false)
  }

  const deleteItem = async (id: string) => {
    await db.vaultItems.delete(id)
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Archive size={22} className="text-[var(--color-vault)]" />
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Vault Archive</h1>
        </div>
        <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => setAddOpen(true)}>
          Add to Vault
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes, ideas, bookmarks, or #tags..."
            className="w-full h-10 pl-9 pr-4 rounded-[var(--radius-md)] bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] placeholder:text-[var(--color-text-tertiary)]"
          />
        </div>

        <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold whitespace-nowrap transition-all ${
              filterType === 'all' ? 'bg-[var(--color-text-primary)] text-[var(--color-surface)]' : 'bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-[var(--color-text-secondary)]'
            }`}
          >
            All ({items.length})
          </button>
          {ITEM_TYPES.map((t) => (
            <button
              key={t.type}
              onClick={() => setFilterType(t.type)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold whitespace-nowrap transition-all ${
                filterType === t.type ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-[var(--color-text-secondary)]'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Item Grid */}
      {filteredItems.length === 0 ? (
        <EmptyState
          icon={<Archive size={28} />}
          title="No items found"
          description={searchQuery || filterType !== 'all' ? 'Try adjusting your search or filter.' : 'Your vault is empty. Save your first note, idea, or bookmark.'}
          action={!searchQuery && filterType === 'all' ? <Button onClick={() => setAddOpen(true)} leftIcon={<Plus size={14} />}>Add Item</Button> : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item) => {
            const typeInfo = ITEM_TYPES.find((t) => t.type === item.type) ?? ITEM_TYPES[0]!
            return (
              <Card key={item.id} padding="md" className="flex flex-col justify-between hover:border-[var(--color-text-tertiary)] transition-colors group">
                <div className="space-y-2 mb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-tertiary)] uppercase">
                      {typeInfo.icon}
                      <span>{typeInfo.label}</span>
                    </div>
                    <button
                      onClick={() => void deleteItem(item.id)}
                      className="opacity-0 group-hover:opacity-100 text-[var(--color-text-tertiary)] hover:text-[var(--color-danger)] transition-all p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <h3 className="font-bold text-base text-[var(--color-text-primary)]">{item.title}</h3>

                  {item.content && (
                    <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-line line-clamp-4">{item.content}</p>
                  )}

                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-[var(--color-accent)] hover:underline break-all"
                    >
                      <ExternalLink size={12} />
                      {item.url}
                    </a>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)] text-xs text-[var(--color-text-tertiary)]">
                  <span className="font-mono">{new Date(item.createdAt).toLocaleDateString()}</span>
                  <div className="flex gap-1 flex-wrap">
                    {item.tags.map((tag, idx) => (
                      <Badge key={idx} variant="outline" size="sm">#{tag}</Badge>
                    ))}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add Item Modal */}
      <Modal open={addOpen} onOpenChange={(v) => !v && setAddOpen(false)} title="Add to Vault" size="sm">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-2 block">Item Type</label>
            <div className="grid grid-cols-3 gap-1.5">
              {ITEM_TYPES.map((t) => (
                <button
                  key={t.type}
                  onClick={() => setType(t.type)}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-[var(--radius-md)] text-xs font-semibold transition-all ${
                    type === t.type ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-[var(--color-text-secondary)]'
                  }`}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <Input label="Title *" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Wi-Fi Password, Reading List, Idea..." />

          {type === 'bookmark' || type === 'link' ? (
            <Input label="URL" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
          ) : null}

          <Textarea label="Content / Notes" rows={4} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write details here..." />

          <Input label="Tags (comma-separated)" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="e.g. work, important, recipe" />

          <div className="flex gap-2 justify-end pt-2">
            <Button variant="ghost" size="sm" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={() => void saveItem()}>Save to Vault</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
