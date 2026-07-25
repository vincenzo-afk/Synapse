import { v4 as uuid } from 'uuid'
import { db, type Settings, type NutritionGoals } from '../schema'

// Singleton ID — all reads/writes use this fixed key (failure mode #5 mitigation)
const SETTINGS_ID = 'singleton' as const
const NUTRITION_GOALS_ID = 'singleton' as const

const DEFAULT_SETTINGS: Settings = {
  id: SETTINGS_ID,
  theme: 'dark',
  accentColor: '#7c6af7',
  units: 'metric',
  language: 'en',
  dashboardLayout: [],
  defaultCurrency: 'USD',
  updatedAt: new Date().toISOString(),
}

export async function getSettings(): Promise<Settings> {
  const existing = await db.settings.get(SETTINGS_ID)
  if (existing) return existing
  await db.settings.add(DEFAULT_SETTINGS)
  return DEFAULT_SETTINGS
}

export async function upsertSettings(data: Partial<Omit<Settings, 'id'>>): Promise<void> {
  const existing = await db.settings.get(SETTINGS_ID)
  if (existing) {
    await db.settings.update(SETTINGS_ID, { ...data, updatedAt: new Date().toISOString() })
  } else {
    await db.settings.add({ ...DEFAULT_SETTINGS, ...data, id: SETTINGS_ID, updatedAt: new Date().toISOString() })
  }
}

const DEFAULT_NUTRITION_GOALS: NutritionGoals = {
  id: NUTRITION_GOALS_ID,
  waterTargetMl: 2500,
  updatedAt: new Date().toISOString(),
}

export async function getNutritionGoals(): Promise<NutritionGoals> {
  const existing = await db.nutritionGoals.get(NUTRITION_GOALS_ID)
  if (existing) return existing
  await db.nutritionGoals.add(DEFAULT_NUTRITION_GOALS)
  return DEFAULT_NUTRITION_GOALS
}

export async function upsertNutritionGoals(data: Partial<Omit<NutritionGoals, 'id'>>): Promise<void> {
  const existing = await db.nutritionGoals.get(NUTRITION_GOALS_ID)
  if (existing) {
    await db.nutritionGoals.update(NUTRITION_GOALS_ID, { ...data, updatedAt: new Date().toISOString() })
  } else {
    await db.nutritionGoals.add({ ...DEFAULT_NUTRITION_GOALS, ...data, id: NUTRITION_GOALS_ID })
  }
}
