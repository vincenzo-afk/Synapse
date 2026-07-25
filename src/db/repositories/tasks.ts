import { v4 as uuid } from 'uuid'
import { db, type Task } from '../schema'

export async function listTasks(status?: Task['status']): Promise<Task[]> {
  if (status) {
    return db.tasks.where('status').equals(status).sortBy('orderIndex')
  }
  return db.tasks.orderBy('orderIndex').toArray()
}

export async function getTask(id: string): Promise<Task | undefined> {
  return db.tasks.get(id)
}

export async function listTasksForDate(date: string): Promise<Task[]> {
  return db.tasks
    .filter((t) => (t.dueDate === date || t.status === 'today') && t.status !== 'done')
    .sortBy('orderIndex')
}

export async function listSubtasks(parentTaskId: string): Promise<Task[]> {
  return db.tasks.where('parentTaskId').equals(parentTaskId).sortBy('orderIndex')
}

export async function createTask(data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
  const now = new Date().toISOString()
  // Generate a high orderIndex so new tasks go to the bottom
  const maxOrder = await db.tasks
    .where('status')
    .equals(data.status)
    .toArray()
    .then((tasks) => Math.max(0, ...tasks.map((t) => t.orderIndex)))
  const task: Task = {
    ...data,
    id: uuid(),
    orderIndex: maxOrder + 1000,
    createdAt: now,
    updatedAt: now,
  }
  await db.tasks.add(task)
  return task
}

export async function updateTask(id: string, data: Partial<Omit<Task, 'id' | 'createdAt'>>): Promise<void> {
  await db.tasks.update(id, { ...data, updatedAt: new Date().toISOString() })
}

export async function completeTask(id: string): Promise<void> {
  await db.tasks.update(id, {
    status: 'done',
    completedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })
}

export async function deleteTask(id: string): Promise<void> {
  await db.tasks.delete(id)
}

export async function reorderTask(id: string, newOrderIndex: number): Promise<void> {
  // Use fractional index — only update the moved task, not every sibling.
  // This avoids write storms on large lists (see failure mode: Kanban reorder).
  await db.tasks.update(id, { orderIndex: newOrderIndex, updatedAt: new Date().toISOString() })
}
