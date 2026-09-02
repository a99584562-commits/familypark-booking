import { HOLIDAYS, type RateType } from '../data/gazebos'

export const DOW = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс']
export const DOW_LONG = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']
export const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
]
export const MONTHS_GEN = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
]
export const MONTHS_SHORT = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']

const pad = (n: number) => String(n).padStart(2, '0')

export function toISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
export function parseISO(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
export function addDays(iso: string, n: number): string {
  const d = parseISO(iso)
  d.setDate(d.getDate() + n)
  return toISO(d)
}
export function addMonths(iso: string, n: number): string {
  const d = parseISO(iso)
  d.setDate(1)
  d.setMonth(d.getMonth() + n)
  return toISO(d)
}
/** 0 = пн … 6 = вс */
export function dow(iso: string): number {
  return (parseISO(iso).getDay() + 6) % 7
}
export const TODAY = toISO(new Date())

export function monthDays(iso: string): string[] {
  const d = parseISO(iso)
  const y = d.getFullYear()
  const m = d.getMonth()
  const n = new Date(y, m + 1, 0).getDate()
  return Array.from({ length: n }, (_, i) => `${y}-${pad(m + 1)}-${pad(i + 1)}`)
}

export function fmtTime(h: number): string {
  const hh = Math.floor(h)
  const mm = Math.round((h - hh) * 60)
  return `${hh}:${pad(mm)}`
}
export function fmtRange(s: number, e: number): string {
  return `${fmtTime(s)}–${fmtTime(e)}`
}
export function fmtDay(iso: string): string {
  const d = parseISO(iso)
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}, ${DOW[dow(iso)]}`
}
export function fmtDayLong(iso: string): string {
  const d = parseISO(iso)
  return `${DOW_LONG[dow(iso)]}, ${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`
}
export function fmtMonth(iso: string): string {
  const d = parseISO(iso)
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}
export function fmtDateTime(isoTs: string): string {
  const d = new Date(isoTs)
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
const nf = new Intl.NumberFormat('ru-RU')
export function fmtMoney(n: number): string {
  return `${nf.format(Math.round(n))} ₽`
}
export function fmtNum(n: number): string {
  return nf.format(Math.round(n))
}

export function holidayName(iso: string): string | null {
  for (const h of HOLIDAYS) if (iso >= h.from && iso <= h.to) return h.name
  return null
}
export function rateType(iso: string): RateType {
  if (holidayName(iso)) return 'holiday'
  return dow(iso) >= 4 ? 'weekend' : 'weekday'
}
export const RATE_LABEL: Record<RateType, string> = {
  weekday: 'будни (пн–чт)',
  weekend: 'выходной (пт–вс)',
  holiday: 'праздничный',
}

/** Варианты времени для селектов: 8:00 … 24:00 с шагом 30 мин */
export const TIME_OPTIONS: number[] = Array.from({ length: 33 }, (_, i) => 8 + i * 0.5)

export function plural(n: number, one: string, few: string, many: string): string {
  const a = Math.abs(n) % 100
  const b = a % 10
  if (a > 10 && a < 20) return many
  if (b > 1 && b < 5) return few
  if (b === 1) return one
  return many
}
