/**
 * Groq AI & Offline Natural Language Intent Parser Engine.
 * Converts natural user input ("Drink 4L water", "I study Japanese for 20 minutes", "I want to wake up at 5AM")
 * into structured Dexie entities across Habits, Tasks, Workout, Hydration, Sleep, Study, College, etc.
 */
import { v4 as uuid } from 'uuid'
import { db } from '../db/schema'
import { localDateString } from '../db/repositories/habits'

export interface AIParsedResult {
  success: boolean
  module: string
  actionSummary: string
  createdEntity: Record<string, unknown>
}

/**
 * Main parser entry point. Uses Groq API if API Key is configured in localStorage/env,
 * otherwise falls back to a high-speed offline heuristic parser.
 */
export async function parseAndExecuteNaturalLanguage(text: string): Promise<AIParsedResult> {
  const trimmed = text.trim()
  if (!trimmed) {
    throw new Error('Please enter a natural language command.')
  }

  const apiKey = localStorage.getItem('synapse_groq_api_key') || (import.meta as any).env?.VITE_GROQ_API_KEY

  if (apiKey) {
    try {
      return await parseWithGroqAPI(trimmed, apiKey)
    } catch (err) {
      console.warn('Groq API call failed or offline, falling back to local NLP parser:', err)
      return parseWithLocalNLP(trimmed)
    }
  }

  return parseWithLocalNLP(trimmed)
}

/**
 * Groq API Parser using LLaMA 3.3 70B JSON mode.
 */
async function parseWithGroqAPI(promptText: string, apiKey: string): Promise<AIParsedResult> {
  const systemPrompt = `You are the Synapse Personal OS Natural Language Parser.
Analyze the user's input and extract structured intent into a JSON object.
Return ONLY a valid JSON object matching this schema:
{
  "module": "hydration" | "habits" | "tasks" | "workout" | "sleep" | "study" | "college" | "nutrition" | "finance" | "journal" | "vault",
  "title": string,
  "category": string,
  "targetValue": number or null,
  "unit": string or null,
  "time": "HH:MM" or null,
  "reminderTime": "HH:MM" or null,
  "days": number[] (0=Sun, 1=Mon, ..., 6=Sat),
  "durationMinutes": number or null,
  "priority": "low" | "medium" | "high" | "none",
  "notes": string or null
}`

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: promptText },
      ],
      temperature: 0.1,
    }),
  })

  if (!response.ok) {
    throw new Error(`Groq API returned status ${response.status}`)
  }

  const data = await response.json()
  const content = data?.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('Empty response from Groq API')
  }

  const parsed = JSON.parse(content)
  return await commitParsedIntentToDatabase(parsed, promptText)
}

/**
 * Offline Fallback Rule-Based NLP Parser for zero-network execution.
 */
function parseWithLocalNLP(text: string): Promise<AIParsedResult> {
  const t = text.trim().toLowerCase()
  const now = new Date().toISOString()
  const today = localDateString()

  // 1. Hydration
  const waterMatch = t.match(/(?:drink\s+)?(\d+(?:\.\d+)?)\s*(l|litre|litres|liter|liters|ml)/i)
  if (waterMatch) {
    let val = parseFloat(waterMatch[1]!)
    const unit = waterMatch[2]!.toLowerCase()
    if (unit.startsWith('l')) val = val * 1000

    return commitParsedIntentToDatabase({
      module: 'hydration',
      title: `Hydration Target: ${val}ml`,
      targetValue: val,
      unit: 'ml',
    }, text)
  }

  // 2. Wake up / Morning Habit
  if (t.includes('wake up') || t.includes('waking up') || t.includes('5am') || t.includes('alarm')) {
    const timeMatch = t.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i)
    let timeStr = '05:00'
    if (timeMatch?.[1]) {
      let hrs = parseInt(timeMatch[1])
      if (timeMatch[3]?.toLowerCase() === 'pm' && hrs < 12) hrs += 12
      if (timeMatch[3]?.toLowerCase() === 'am' && hrs === 12) hrs = 0
      timeStr = `${hrs.toString().padStart(2, '0')}:${(timeMatch[2] ?? '00').padStart(2, '0')}`
    }

    return commitParsedIntentToDatabase({
      module: 'habits',
      title: 'Wake Up Early',
      category: 'Morning',
      time: timeStr,
      reminderTime: timeStr,
      days: [0, 1, 2, 3, 4, 5, 6],
    }, text)
  }

  // 3. Study Session / Habit
  const studyMatch = t.match(/study\s+(.*?)(?:\s+for\s+(\d+)\s*(min|minutes|hrs|hours))?$/i) || t.match(/(.*?)\s+(\d+)\s*minutes?/i)
  if (t.includes('study') || t.includes('japanese') || t.includes('read')) {
    const subject = studyMatch?.[1] ? studyMatch[1].replace(/study|for|read/gi, '').trim() : 'General Study'
    const duration = studyMatch?.[2] ? parseInt(studyMatch[2]) : 20

    return commitParsedIntentToDatabase({
      module: 'study',
      title: `Study ${subject.toUpperCase()}`,
      category: 'Learning',
      durationMinutes: duration,
      days: [0, 1, 2, 3, 4, 5, 6],
    }, text)
  }

  // 4. College Schedule
  if (t.includes('college') || t.includes('class') || t.includes('lecture')) {
    return commitParsedIntentToDatabase({
      module: 'college',
      title: 'College Schedule (9:00 AM - 4:30 PM)',
      category: 'Education',
      time: '09:00',
      durationMinutes: 450,
      days: [1, 2, 3, 4, 5],
    }, text)
  }

  // 5. Workout
  if (t.includes('workout') || t.includes('chest') || t.includes('gym') || t.includes('squat') || t.includes('bench')) {
    return commitParsedIntentToDatabase({
      module: 'workout',
      title: t.includes('chest') ? 'Chest Workout' : 'Strength Training',
      category: 'Fitness',
      days: [1, 2, 3, 4, 5, 6],
    }, text)
  }

  // 6. Sleep Log
  if (t.includes('sleep') || t.includes('bedtime')) {
    return commitParsedIntentToDatabase({
      module: 'sleep',
      title: 'Night Sleep',
      time: '22:00',
      reminderTime: '21:30',
    }, text)
  }

  // 7. Nutrition Entry
  if (t.includes('eat') || t.includes('food') || t.includes('egg') || t.includes('calories')) {
    return commitParsedIntentToDatabase({
      module: 'nutrition',
      title: text,
      targetValue: 200,
      unit: 'kcal',
    }, text)
  }

  // Default: Priority Task
  return commitParsedIntentToDatabase({
    module: 'tasks',
    title: text.replace(/^(task:|todo:)/i, '').trim(),
    priority: t.includes('urgent') || t.includes('important') ? 'high' : 'medium',
  }, text)
}

/**
 * Database Persistence Router — Automatically writes parsed intent into Dexie DB.
 */
async function commitParsedIntentToDatabase(intent: any, originalText: string): Promise<AIParsedResult> {
  const now = new Date().toISOString()
  const today = localDateString()
  const mod = intent.module || 'tasks'

  switch (mod) {
    case 'hydration': {
      const amount = intent.targetValue || 4000
      await db.nutritionGoals.add({
        id: 'singleton',
        waterTargetMl: amount,
        updatedAt: now,
      }).catch(() => db.nutritionGoals.update('singleton', { waterTargetMl: amount, updatedAt: now }))

      await db.waterLogs.add({
        id: uuid(),
        date: today,
        amountMl: 250,
        loggedAt: now,
      })

      return {
        success: true,
        module: 'Hydration',
        actionSummary: `Updated Daily Hydration Goal to ${amount}ml and logged +250ml water intake.`,
        createdEntity: { goalMl: amount },
      }
    }

    case 'habits': {
      const habitId = uuid()
      const title = intent.title || 'Daily Habit'
      await db.habits.add({
        id: habitId,
        name: title,
        icon: title.toLowerCase().includes('wake') ? '⏰' : title.toLowerCase().includes('read') ? '📖' : '⚡',
        color: '#7c6af7',
        type: 'binary',
        target: 1,
        frequency: 'daily',
        days: intent.days || [],
        reminders: intent.time ? [{ time: intent.time, days: [], enabled: true }] : [],
        streakCurrent: 0,
        streakBest: 0,
        createdAt: now,
        updatedAt: now,
      })

      return {
        success: true,
        module: 'Habits',
        actionSummary: `Created Habit "${title}" with daily schedule${intent.time ? ` at ${intent.time}` : ''}.`,
        createdEntity: { habitId, name: title },
      }
    }

    case 'study': {
      const title = intent.title || 'Study Session'
      const subjectId = uuid()
      await db.studySubjects.add({
        id: subjectId,
        name: title,
        color: '#f59e0b',
        goalHoursWeekly: 5,
        createdAt: now,
        updatedAt: now,
      })
      await db.studySessions.add({
        id: uuid(),
        subjectId,
        date: today,
        durationMinutes: intent.durationMinutes || 20,
        technique: 'pomodoro',
        notes: originalText,
        createdAt: now,
        updatedAt: now,
      })

      return {
        success: true,
        module: 'Study',
        actionSummary: `Logged ${intent.durationMinutes || 20}m Study Session for "${title}".`,
        createdEntity: { title, duration: intent.durationMinutes || 20 },
      }
    }

    case 'workout': {
      const title = intent.title || 'Strength Training'
      const exId = uuid()
      await db.exercises.add({
        id: exId,
        name: title,
        muscleGroup: title.toLowerCase().includes('chest') ? 'Chest' : 'Full Body',
        equipment: 'Gym',
        createdAt: now,
        updatedAt: now,
      })

      return {
        success: true,
        module: 'Workout',
        actionSummary: `Added exercise "${title}" to Workout Database.`,
        createdEntity: { exId, name: title },
      }
    }

    case 'college': {
      const semId = uuid()
      const subId = uuid()
      await db.collegeSemesters.add({
        id: semId,
        name: 'Active Semester',
        startDate: today,
        endDate: today,
        createdAt: now,
        updatedAt: now,
      }).catch(() => {})

      await db.collegeSubjects.add({
        id: subId,
        semesterId: semId,
        name: intent.title || 'College Course',
        credits: 4,
        createdAt: now,
        updatedAt: now,
      })

      return {
        success: true,
        module: 'College',
        actionSummary: `Scheduled College Subject "${intent.title || 'College Course'}".`,
        createdEntity: { name: intent.title },
      }
    }

    case 'tasks':
    default: {
      const taskId = uuid()
      const title = intent.title || originalText
      await db.tasks.add({
        id: taskId,
        title,
        status: 'today',
        priority: intent.priority || 'medium',
        tags: ['ai-parsed'],
        dependsOn: [],
        orderIndex: Date.now(),
        createdAt: now,
        updatedAt: now,
      })

      return {
        success: true,
        module: 'Tasks',
        actionSummary: `Created Priority Task "${title}".`,
        createdEntity: { taskId, title },
      }
    }
  }
}
