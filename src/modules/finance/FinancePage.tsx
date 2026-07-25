import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion } from 'framer-motion'
import { Wallet, Plus, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { db } from '../../db/schema'
import { localDateString } from '../../db/repositories/habits'
import { createFinanceEntry } from '../../db/repositories/finance'
import { Card, CardHeader, CardTitle } from '../../design-system/components/Card'
import { Button } from '../../design-system/components/Button'
import { Modal } from '../../design-system/components/Modal'
import { Badge } from '../../design-system/components/Indicators'

const EXPENSE_CATEGORIES = ['Food', 'Transport', 'Entertainment', 'Health', 'Shopping', 'Bills', 'Other']

export default function FinancePage() {
  const [addOpen, setAddOpen] = useState(false)
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Food')
  const [note, setNote] = useState('')
  const today = localDateString()

  const entries = useLiveQuery(() => db.financeEntries.orderBy('date').reverse().limit(50).toArray()) ?? []
  const thisMonth = useLiveQuery(() => {
    const d = new Date()
    const from = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
    return db.financeEntries.where('date').between(from, today, true, true).toArray()
  }, [today]) ?? []

  const income = thisMonth.filter((e) => e.type === 'income').reduce((s, e) => s + e.amount, 0)
  const expenses = thisMonth.filter((e) => e.type === 'expense').reduce((s, e) => s + e.amount, 0)
  const balance = income - expenses

  const save = async () => {
    if (!amount) return
    await createFinanceEntry({ type, amount: parseFloat(amount), currency: 'USD', category, date: today, note })
    setAmount('')
    setNote('')
    setAddOpen(false)
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Wallet size={20} className="text-[var(--color-finance)]" />
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Finance</h1>
        </div>
        <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => setAddOpen(true)}>Add Entry</Button>
      </div>

      {/* Monthly summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Income', value: income, icon: <TrendingUp size={16} />, color: 'var(--color-success)' },
          { label: 'Expenses', value: expenses, icon: <TrendingDown size={16} />, color: 'var(--color-danger)' },
          { label: 'Balance', value: balance, icon: <DollarSign size={16} />, color: balance >= 0 ? 'var(--color-success)' : 'var(--color-danger)' },
        ].map((stat) => (
          <Card key={stat.label} padding="md">
            <div className="flex items-center gap-1.5 mb-2" style={{ color: stat.color }}>
              {stat.icon}
              <span className="text-xs font-medium">{stat.label}</span>
            </div>
            <div className="font-mono text-lg font-bold" style={{ color: stat.color }}>
              ${Math.abs(stat.value).toFixed(2)}
            </div>
          </Card>
        ))}
      </div>

      {/* Recent entries */}
      <Card>
        <CardHeader><CardTitle>Recent Transactions</CardTitle></CardHeader>
        {entries.length === 0 ? (
          <p className="text-center text-sm text-[var(--color-text-tertiary)] py-8">No transactions yet</p>
        ) : (
          <div className="space-y-1">
            {entries.map((entry) => (
              <div key={entry.id} className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] hover:bg-[var(--color-surface-elevated)] transition-colors">
                <div className={`w-2 h-2 rounded-full shrink-0 ${entry.type === 'income' ? 'bg-[var(--color-success)]' : 'bg-[var(--color-danger)]'}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-[var(--color-text-primary)] truncate">{entry.note || entry.category}</div>
                  <div className="text-xs text-[var(--color-text-tertiary)]">{entry.date} · {entry.category}</div>
                </div>
                <span className={`font-mono text-sm font-semibold ${entry.type === 'income' ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>
                  {entry.type === 'income' ? '+' : '-'}${entry.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={addOpen} onOpenChange={(v) => !v && setAddOpen(false)} title="Add Transaction" size="sm">
        <div className="space-y-4">
          <div className="flex gap-2">
            {(['expense', 'income'] as const).map((t) => (
              <button key={t} onClick={() => setType(t)} className={`flex-1 h-10 rounded-[var(--radius-md)] text-sm font-medium transition-all capitalize ${type === t ? (t === 'income' ? 'bg-[var(--color-success)] text-white' : 'bg-[var(--color-danger)] text-white') : 'bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-[var(--color-text-secondary)]'}`}>
                {t}
              </button>
            ))}
          </div>
          <input type="number" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)}
            className="w-full h-10 px-3 rounded-[var(--radius-md)] bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:border-[var(--color-accent)] placeholder:text-[var(--color-text-tertiary)]" />
          <select value={category} onChange={(e) => setCategory(e.target.value)}
            className="w-full h-10 px-3 rounded-[var(--radius-md)] bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:border-[var(--color-accent)]">
            {EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <input placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)}
            className="w-full h-10 px-3 rounded-[var(--radius-md)] bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:border-[var(--color-accent)] placeholder:text-[var(--color-text-tertiary)]" />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={() => void save()}>Save</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
