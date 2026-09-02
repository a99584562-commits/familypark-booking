import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Booking, BookingStatus, SyncEvent } from './types'
import { STATUS_META } from './types'
import { generateSeed } from './data/seed'
import { fmtDay, fmtMoney, fmtRange } from './lib/date'

const SEED_VERSION = 1
const LOG_LIMIT = 80

interface Data {
  bookings: Booking[]
  log: SyncEvent[]
  nextDeal: number
}
interface Actions {
  addBooking: (b: Omit<Booking, 'id' | 'dealId' | 'createdAt'>) => Booking
  updateBooking: (id: string, patch: Partial<Booking>) => void
  setStatus: (id: string, status: BookingStatus) => void
  removeBooking: (id: string) => void
  reset: () => void
}
export type State = Data & Actions

let uid = 0
const newId = () => `b${Date.now().toString(36)}${(uid++).toString(36)}`
const now = () => new Date().toISOString()
const ev = (kind: SyncEvent['kind'], text: string, dealId?: number): SyncEvent => ({ id: newId(), at: now(), kind, text, dealId })
const where = (b: Pick<Booking, 'gazeboId' | 'date' | 'start' | 'end'>) =>
  `№${b.gazeboId}, ${fmtDay(b.date)} ${fmtRange(b.start, b.end)}`

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...generateSeed(),

      addBooking(b) {
        const isBlock = b.status === 'blocked'
        const dealId = isBlock ? undefined : get().nextDeal
        const booking: Booking = { ...b, id: newId(), dealId, createdAt: now() }
        const e = isBlock
          ? ev('info', `Блокировка ${where(b)}: ${b.clientName}`)
          : ev('create', `Сделка #${dealId} создана → бронь ${where(b)} — ${b.clientName}, ${fmtMoney(b.total)}`, dealId)
        set((s) => ({
          bookings: [...s.bookings, booking],
          nextDeal: isBlock ? s.nextDeal : s.nextDeal + 1,
          log: [e, ...s.log].slice(0, LOG_LIMIT),
        }))
        return booking
      },

      updateBooking(id, patch) {
        set((s) => {
          const cur = s.bookings.find((x) => x.id === id)
          if (!cur) return s
          const next: Booking = { ...cur, ...patch }
          const e = cur.dealId
            ? ev('update', `Сделка #${cur.dealId} обновлена: ${where(next)} — ${next.clientName}, ${fmtMoney(next.total)}`, cur.dealId)
            : ev('info', `Блокировка изменена: ${where(next)} — ${next.clientName}`)
          return { bookings: s.bookings.map((x) => (x.id === id ? next : x)), log: [e, ...s.log].slice(0, LOG_LIMIT) }
        })
      },

      setStatus(id, status) {
        set((s) => {
          const cur = s.bookings.find((x) => x.id === id)
          if (!cur) return s
          const next: Booking = { ...cur, status, prepaid: status === 'paid' ? cur.total : cur.prepaid }
          const events = [ev('status', `Сделка #${cur.dealId} → стадия «${STATUS_META[status].stage}»`, cur.dealId)]
          if (status === 'paid')
            events.unshift(ev('payment', `Оплата ${fmtMoney(cur.total)} по сделке #${cur.dealId} — бронь ${where(cur)}`, cur.dealId))
          return { bookings: s.bookings.map((x) => (x.id === id ? next : x)), log: [...events, ...s.log].slice(0, LOG_LIMIT) }
        })
      },

      removeBooking(id) {
        set((s) => {
          const cur = s.bookings.find((x) => x.id === id)
          if (!cur) return s
          const e = cur.dealId
            ? ev('cancel', `Сделка #${cur.dealId} → «Отменена», бронь ${where(cur)} снята с календаря`, cur.dealId)
            : ev('info', `Блокировка ${where(cur)} снята`)
          return { bookings: s.bookings.filter((x) => x.id !== id), log: [e, ...s.log].slice(0, LOG_LIMIT) }
        })
      },

      reset() {
        set({ ...generateSeed() })
      },
    }),
    {
      name: 'familypark-booking-v1',
      version: SEED_VERSION,
      partialize: (s): Data => ({ bookings: s.bookings, log: s.log, nextDeal: s.nextDeal }),
      migrate: () => generateSeed(),
    },
  ),
)
