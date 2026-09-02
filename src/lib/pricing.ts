import { EXTRA_BY_ID, GAZEBO_BY_ID, type RateType } from '../data/gazebos'
import { rateType } from './date'
import type { Booking } from '../types'

export interface PriceBreakdown {
  type: RateType
  rate: number
  hours: number
  base: number
  extrasSum: number
  total: number
}

export function priceOf(gazeboId: number, date: string, start: number, end: number, extras: string[]): PriceBreakdown {
  const g = GAZEBO_BY_ID[gazeboId]
  const type = rateType(date)
  const rate = g ? g.rates[type] : 0
  const hours = Math.max(0, end - start)
  const base = Math.round(rate * hours)
  const extrasSum = extras.reduce((s, id) => s + (EXTRA_BY_ID[id]?.price ?? 0), 0)
  return { type, rate, hours, base, extrasSum, total: base + extrasSum }
}

export interface Slot {
  gazeboId: number
  date: string
  start: number
  end: number
}

export function overlaps(a: Slot, b: Slot, buffer: number): boolean {
  return a.start < b.end + buffer && b.start < a.end + buffer
}

export function findConflicts(all: Booking[], cand: Slot, excludeId?: string): Booking[] {
  const buf = GAZEBO_BY_ID[cand.gazeboId]?.turnover ?? 0
  return all.filter(
    (b) => b.id !== excludeId && b.gazeboId === cand.gazeboId && b.date === cand.date && overlaps(b, cand, buf),
  )
}

/** Короткое имя для плашки: «Ковалёва Анна Сергеевна» → «Ковалёва А. С.» */
export function shortName(full: string): string {
  const parts = full.trim().split(/\s+/)
  if (parts.length < 2 || /[«"]/.test(full)) return full
  return parts[0] + ' ' + parts.slice(1, 3).map((p) => p[0] + '.').join(' ')
}
