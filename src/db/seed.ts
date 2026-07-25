/**
 * Demo Data Seeder — Generates realistic sample data across all 18 modules for E2E testing and performance validation.
 * See docs/15-build-roadmap.md §Phase 8 and docs/14-failure-modes-and-pitfalls.md §18.
 */
import { v4 as uuid } from 'uuid'
import { db } from './schema'
import { localDateString } from './repositories/habits'

export async function seedDemoData(): Promise<void> {
  const todayStr = localDateString()
  const nowStr = new Date().toISOString()

  // Helper for past dates (YYYY-MM-DD)
  const daysAgo = (n: number) => {
    const d = new Date()
    d.setDate(d.getDate() - n)
    return d.toISOString().split('T')[0]!
  }

  const daysAgoIso = (n: number, hours = 10, mins = 0) => {
    const d = new Date()
    d.setDate(d.getDate() - n)
    d.setHours(hours, mins, 0, 0)
    return d.toISOString()
  }

  // Clear existing data for clean seed
  const allTables = [
    'habits', 'habitLogs', 'tasks', 'projects', 'areas',
    'exercises', 'workouts', 'workoutSessions', 'bodyMeasurements', 'personalRecords',
    'nutritionEntries', 'nutritionGoals', 'waterLogs', 'sleepLogs',
    'studySubjects', 'studySessions', 'collegeSemesters', 'collegeSubjects',
    'collegeAttendance', 'collegeAssignments', 'collegeExams',
    'journalEntries', 'vaultItems', 'personalEvents', 'calendarEvents',
    'reminders', 'timers', 'financeEntries'
  ]

  const dexieTables = allTables.map((t) => (db as any)[t]).filter(Boolean)

  await db.transaction('rw', dexieTables, async () => {
    for (const t of dexieTables) {
      await t.clear()
    }

    // 1. Areas & Projects
    const areaWork = uuid()
    const areaHealth = uuid()
    const areaStudy = uuid()
    await db.areas.bulkAdd([
      { id: areaWork, name: 'Career & Engineering', color: '#7c6af7', createdAt: nowStr, updatedAt: nowStr },
      { id: areaHealth, name: 'Fitness & Longevity', color: '#22c55e', createdAt: nowStr, updatedAt: nowStr },
      { id: areaStudy, name: 'University Studies', color: '#3b82f6', createdAt: nowStr, updatedAt: nowStr },
    ])

    const projSynapse = uuid()
    const projMarathon = uuid()
    await db.projects.bulkAdd([
      {
        id: projSynapse,
        name: 'Build Synapse PWA Operating System',
        color: '#7c6af7',
        areaId: areaWork,
        roadmapStage: 'development',
        milestones: [
          { id: uuid(), title: 'Core Engines & App Shell', completed: true },
          { id: uuid(), title: 'Body & Health Modules', completed: true },
          { id: uuid(), title: 'Analytics & Widget System', completed: true },
        ],
        createdAt: daysAgoIso(20),
        updatedAt: nowStr,
      },
      {
        id: projMarathon,
        name: 'Autumn Half-Marathon Prep',
        color: '#22c55e',
        areaId: areaHealth,
        roadmapStage: 'planning',
        milestones: [
          { id: uuid(), title: 'Base building 30km/week', completed: true },
          { id: uuid(), title: '15km tempo benchmark', completed: false },
        ],
        createdAt: daysAgoIso(15),
        updatedAt: nowStr,
      },
    ])

    // 2. Habits & Logs (14 days history)
    const hWater = uuid()
    const hRead = uuid()
    const hCode = uuid()
    const hGym = uuid()
    await db.habits.bulkAdd([
      { id: hWater, name: 'Morning Hydration (500ml)', icon: '💧', color: '#3b82f6', type: 'binary', target: 1, frequency: 'daily', days: [], reminders: [], streakCurrent: 12, streakBest: 24, createdAt: daysAgoIso(30), updatedAt: nowStr },
      { id: hRead, name: 'Read Research Papers (30m)', icon: '📖', color: '#f59e0b', type: 'value', target: 30, unit: 'min', frequency: 'daily', days: [], reminders: [], streakCurrent: 7, streakBest: 14, createdAt: daysAgoIso(30), updatedAt: nowStr },
      { id: hCode, name: 'Deep Work Coding Focus', icon: '⚡', color: '#7c6af7', type: 'binary', target: 1, frequency: 'daily', days: [], reminders: [], streakCurrent: 14, streakBest: 14, createdAt: daysAgoIso(30), updatedAt: nowStr },
      { id: hGym, name: 'Strength Training Session', icon: '🏋️', color: '#22c55e', type: 'binary', target: 1, frequency: 'custom', days: [1, 3, 5], reminders: [], streakCurrent: 4, streakBest: 10, createdAt: daysAgoIso(30), updatedAt: nowStr },
    ])

    const habitLogs: any[] = []
    for (let i = 14; i >= 0; i--) {
      const dStr = daysAgo(i)
      habitLogs.push({ id: uuid(), habitId: hWater, date: dStr, value: 1, completed: true, loggedAt: daysAgoIso(i, 8, 30) })
      if (i !== 3 && i !== 8) {
        habitLogs.push({ id: uuid(), habitId: hRead, date: dStr, value: 30, completed: true, loggedAt: daysAgoIso(i, 21, 0) })
      }
      habitLogs.push({ id: uuid(), habitId: hCode, date: dStr, value: 1, completed: true, loggedAt: daysAgoIso(i, 11, 15) })
      const dayOfWeek = new Date(dStr).getDay()
      if ([1, 3, 5].includes(dayOfWeek)) {
        habitLogs.push({ id: uuid(), habitId: hGym, date: dStr, value: 1, completed: true, loggedAt: daysAgoIso(i, 17, 30) })
      }
    }
    await db.habitLogs.bulkAdd(habitLogs)

    // 3. Tasks
    await db.tasks.bulkAdd([
      { id: uuid(), title: 'Audit Dexie transactional restore guarantees', projectId: projSynapse, areaId: areaWork, tags: ['database', 'dexie'], priority: 'high', dueDate: todayStr, status: 'today', dependsOn: [], orderIndex: 1, createdAt: daysAgoIso(2), updatedAt: nowStr },
      { id: uuid(), title: 'Perform 10km threshold tempo run', projectId: projMarathon, areaId: areaHealth, tags: ['running'], priority: 'medium', dueDate: todayStr, status: 'today', dependsOn: [], orderIndex: 2, createdAt: daysAgoIso(3), updatedAt: nowStr },
      { id: uuid(), title: 'Review Chapter 4 Differential Equations', areaId: areaStudy, tags: ['math'], priority: 'medium', dueDate: daysAgo(-1), status: 'upcoming', dependsOn: [], orderIndex: 3, createdAt: daysAgoIso(4), updatedAt: nowStr },
      { id: uuid(), title: 'Finalize PWA Service Worker offline caching', projectId: projSynapse, areaId: areaWork, tags: ['pwa', 'workbox'], priority: 'high', dueDate: daysAgo(1), completedAt: daysAgoIso(1, 16, 0), status: 'done', dependsOn: [], orderIndex: 4, createdAt: daysAgoIso(5), updatedAt: daysAgoIso(1) },
      { id: uuid(), title: 'Prepare monthly finance budget audit', tags: ['finance'], priority: 'low', dueDate: daysAgo(-3), status: 'inbox', dependsOn: [], orderIndex: 5, createdAt: daysAgoIso(3), updatedAt: nowStr },
    ])

    // 4. Hydration & Sleep (14 days)
    await db.nutritionGoals.add({ id: 'singleton', waterTargetMl: 2750, updatedAt: nowStr })
    const waterLogs: any[] = []
    const sleepLogs: any[] = []
    for (let i = 14; i >= 0; i--) {
      const dStr = daysAgo(i)
      waterLogs.push({ id: uuid(), date: dStr, amountMl: 2500 + (i % 3) * 250, loggedAt: daysAgoIso(i, 14, 0) })
      sleepLogs.push({
        id: uuid(),
        date: dStr,
        sleepTime: daysAgoIso(i + 1, 23, 15),
        wakeTime: daysAgoIso(i, 7, 30),
        durationMinutes: 495,
        quality: (i % 4 === 0 ? 4 : 5) as 4 | 5,
        notes: i % 3 === 0 ? 'Deep restorative sleep, woke up energized without alarm.' : undefined,
        createdAt: nowStr,
        updatedAt: nowStr,
      })
    }
    await db.waterLogs.bulkAdd(waterLogs)
    await db.sleepLogs.bulkAdd(sleepLogs)

    // 5. Workouts & Exercises
    const exBench = uuid()
    const exSquat = uuid()
    const exPullup = uuid()
    await db.exercises.bulkAdd([
      { id: exBench, name: 'Barbell Bench Press', muscleGroup: 'Chest', equipment: 'Barbell', instructions: 'Retract scapula, keep heels planted, lower bar to mid-chest.', createdAt: daysAgoIso(30), updatedAt: nowStr },
      { id: exSquat, name: 'Barbell Back Squat', muscleGroup: 'Legs', equipment: 'Barbell', instructions: 'Brace core, break at hips and knees simultaneously, achieve parallel depth.', createdAt: daysAgoIso(30), updatedAt: nowStr },
      { id: exPullup, name: 'Strict Weighted Pull-up', muscleGroup: 'Back', equipment: 'Bodyweight', instructions: 'Full dead hang extension, pull chest to bar with controlled eccentric.', createdAt: daysAgoIso(30), updatedAt: nowStr },
    ])

    const wPush = uuid()
    await db.workouts.add({
      id: wPush,
      name: 'Upper Body Power Push',
      splitDay: 'Monday',
      exercises: [
        { exerciseId: exBench, sets: 4, reps: 6, weight: 85 },
        { exerciseId: exPullup, sets: 4, reps: 8, weight: 10 },
      ],
      createdAt: daysAgoIso(20),
      updatedAt: nowStr,
    })

    await db.workoutSessions.bulkAdd([
      {
        id: uuid(),
        workoutId: wPush,
        date: daysAgo(2),
        durationSeconds: 3420,
        notes: 'Felt strong on bench press, increased top set by 2.5kg.',
        exercisesLogged: [
          { exerciseId: exBench, name: 'Barbell Bench Press', sets: [{ reps: 6, weight: 85, rpe: 8 }, { reps: 6, weight: 85, rpe: 8.5 }, { reps: 5, weight: 87.5, rpe: 9.5 }] },
          { exerciseId: exPullup, name: 'Strict Weighted Pull-up', sets: [{ reps: 8, weight: 10, rpe: 8 }, { reps: 8, weight: 10, rpe: 8.5 }] },
        ],
        createdAt: daysAgoIso(2, 18, 0),
        updatedAt: daysAgoIso(2, 19, 0),
      },
      {
        id: uuid(),
        workoutId: wPush,
        date: daysAgo(5),
        durationSeconds: 3150,
        notes: 'Good solid session, maintained volume.',
        exercisesLogged: [
          { exerciseId: exBench, name: 'Barbell Bench Press', sets: [{ reps: 6, weight: 82.5, rpe: 8 }, { reps: 6, weight: 82.5, rpe: 8 }, { reps: 6, weight: 82.5, rpe: 8.5 }] },
          { exerciseId: exPullup, name: 'Strict Weighted Pull-up', sets: [{ reps: 8, weight: 10, rpe: 8 }, { reps: 7, weight: 10, rpe: 9 }] },
        ],
        createdAt: daysAgoIso(5, 17, 30),
        updatedAt: daysAgoIso(5, 18, 30),
      },
    ])

    // 6. Finance Ledger
    await db.financeEntries.bulkAdd([
      { id: uuid(), type: 'income', amount: 4800, currency: 'USD', category: 'Salary', date: daysAgo(10), note: 'Monthly Software Engineering Stipend', createdAt: daysAgoIso(10), updatedAt: daysAgoIso(10) },
      { id: uuid(), type: 'expense', amount: 1250, currency: 'USD', category: 'Housing', date: daysAgo(10), note: 'Apartment Rent & Utilities', createdAt: daysAgoIso(10), updatedAt: daysAgoIso(10) },
      { id: uuid(), type: 'expense', amount: 165, currency: 'USD', category: 'Groceries', date: daysAgo(6), note: 'Whole Foods organic produce & protein', createdAt: daysAgoIso(6), updatedAt: daysAgoIso(6) },
      { id: uuid(), type: 'expense', amount: 45, currency: 'USD', category: 'Health', date: daysAgo(12), note: 'Equinox Gym Membership', createdAt: daysAgoIso(12), updatedAt: daysAgoIso(12) },
      { id: uuid(), type: 'expense', amount: 18, currency: 'USD', category: 'Subscriptions', date: daysAgo(14), note: 'Spotify Premium Family', createdAt: daysAgoIso(14), updatedAt: daysAgoIso(14) },
      { id: uuid(), type: 'income', amount: 450, currency: 'USD', category: 'Freelance', date: daysAgo(4), note: 'Technical writing consultation', createdAt: daysAgoIso(4), updatedAt: daysAgoIso(4) },
    ])

    // 7. College & Study
    const semFall = uuid()
    const subAlgo = uuid()
    const subML = uuid()
    await db.collegeSemesters.add({ id: semFall, name: 'Fall Semester 2026', startDate: daysAgo(45), endDate: daysAgo(-75), createdAt: nowStr, updatedAt: nowStr })
    await db.collegeSubjects.bulkAdd([
      { id: subAlgo, semesterId: semFall, name: 'Advanced Algorithms & Graph Theory', credits: 4, targetGrade: 'A', createdAt: nowStr, updatedAt: nowStr },
      { id: subML, semesterId: semFall, name: 'Deep Learning & Neural Architectures', credits: 4, targetGrade: 'A+', createdAt: nowStr, updatedAt: nowStr },
    ])

    await db.collegeAttendance.bulkAdd([
      { id: uuid(), subjectId: subAlgo, date: daysAgo(1), status: 'present', createdAt: nowStr, updatedAt: nowStr },
      { id: uuid(), subjectId: subAlgo, date: daysAgo(3), status: 'present', createdAt: nowStr, updatedAt: nowStr },
      { id: uuid(), subjectId: subAlgo, date: daysAgo(5), status: 'absent', createdAt: nowStr, updatedAt: nowStr },
      { id: uuid(), subjectId: subML, date: daysAgo(2), status: 'present', createdAt: nowStr, updatedAt: nowStr },
      { id: uuid(), subjectId: subML, date: daysAgo(4), status: 'present', createdAt: nowStr, updatedAt: nowStr },
    ])

    await db.collegeAssignments.bulkAdd([
      { id: uuid(), subjectId: subAlgo, title: 'Implement Red-Black Tree in TypeScript', dueDate: daysAgo(-5), status: 'todo', createdAt: nowStr, updatedAt: nowStr },
      { id: uuid(), subjectId: subML, title: 'Train ResNet-18 on CIFAR-10 from scratch', dueDate: daysAgo(2), status: 'graded', grade: 'A+', createdAt: nowStr, updatedAt: nowStr },
    ])

    await db.studySubjects.bulkAdd([
      { id: subAlgo, name: 'Advanced Algorithms', color: '#7c6af7', goalHoursWeekly: 10, createdAt: nowStr, updatedAt: nowStr },
      { id: subML, name: 'Deep Learning', color: '#3b82f6', goalHoursWeekly: 8, createdAt: nowStr, updatedAt: nowStr },
    ])
    await db.studySessions.bulkAdd([
      { id: uuid(), subjectId: subAlgo, durationMinutes: 120, date: daysAgo(1), technique: 'pomodoro', notes: 'Mastered bellman-ford shortest path proofs.', createdAt: nowStr, updatedAt: nowStr },
      { id: uuid(), subjectId: subML, durationMinutes: 90, date: daysAgo(2), technique: 'pomodoro', notes: 'PyTorch attention matrix multiplication debugging.', createdAt: nowStr, updatedAt: nowStr },
      { id: uuid(), subjectId: subAlgo, durationMinutes: 150, date: daysAgo(4), technique: 'freeform', notes: 'NP-completeness reduction exercises.', createdAt: nowStr, updatedAt: nowStr },
    ])

    // 8. Journal & Vault Notes
    await db.journalEntries.bulkAdd([
      {
        id: uuid(),
        date: todayStr,
        createdAt: nowStr,
        updatedAt: nowStr,
        body: '# Breakthrough on Architecture Design\nSpent the morning designing the offline-first IndexedDB schema. The single-source-of-truth principle is keeping the codebase remarkably clean and resilient against network disconnects.',
        mood: 5,
        gratitude: ['Clean Dexie architecture', 'Fast local tests', 'Zero network lag'],
        wins: ['Fixed all-or-nothing transaction logic'],
        lessons: ['Index every queried field for performance at scale'],
        photoIds: [],
        voiceNoteIds: [],
      },
      {
        id: uuid(),
        date: daysAgo(2),
        createdAt: daysAgoIso(2, 21, 30),
        updatedAt: daysAgoIso(2, 21, 30),
        body: '# Reflections on Endurance & Discipline\nRunning 15km in the rain taught me that discipline is just deciding in advance what you will do when the motivation fades. The habit tracker streak is a great visual anchor.',
        mood: 4,
        gratitude: ['Healthy legs', 'Rainy mornings'],
        wins: ['15km completed in target pace'],
        lessons: ['Pace consistency beats early sprinting'],
        photoIds: [],
        voiceNoteIds: [],
      },
    ])

    await db.vaultItems.bulkAdd([
      {
        id: uuid(),
        title: 'Dexie.js Offline Persistence Best Practices',
        type: 'note',
        content: '1. Never store computed aggregates in DB; compute on demand via memoized hooks.\n2. Use singleton keys for global settings.\n3. Wrap multi-table restores in all-or-nothing rw transactions.',
        tags: ['dexie', 'database', 'docs'],
        createdAt: daysAgoIso(10),
        updatedAt: daysAgoIso(10),
      },
      {
        id: uuid(),
        title: 'Tailwind CSS v4 Token Architecture',
        type: 'note',
        content: 'All tokens defined in index.css under @theme block with CSS custom properties. Use var(--color-accent) and var(--color-surface) for seamless dark mode transitions without JS rerenders.',
        tags: ['css', 'design-system'],
        createdAt: daysAgoIso(12),
        updatedAt: daysAgoIso(12),
      },
    ])

    // 9. Personal Contacts & Events
    await db.personalEvents.bulkAdd([
      { id: uuid(), title: 'Alex Chen (Birthday)', date: '1995-08-15', recurring: true, category: 'birthday', createdAt: daysAgoIso(30), updatedAt: daysAgoIso(30) },
      { id: uuid(), title: 'University Fall Registration Deadline', date: daysAgo(-10), recurring: false, category: 'other', createdAt: daysAgoIso(20), updatedAt: daysAgoIso(20) },
      { id: uuid(), title: 'Annual Health Checkup & Bloodwork', date: daysAgo(-20), recurring: true, category: 'other', createdAt: daysAgoIso(15), updatedAt: daysAgoIso(15) },
    ])
  })
}
