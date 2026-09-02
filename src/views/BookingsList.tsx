import { useMemo, useState } from 'react'
import { GAZEBO_BY_ID } from '../data/gazebos'
import { TODAY, addDays, addMonths, fmtDay, fmtMoney, fmtNum, fmtRange, plural } from '../lib/date'
import { useStore } from '../store'
import type { BookingStatus } from '../types'
import { SOURCE_LABEL, STATUS_META } from '../types'
import { Segmented, StatusBadge, cx } from '../components/ui'
import { matchesSearch } from './MonthGrid'

type Period = 'today' | 'week' | 'month' | 'future' | 'past' | 'all'
type StatusFilter = 'all' | BookingStatus

export function BookingsList({ search, onOpen }: { search: string; onOpen: (id: string) => void }) {
  const bookings = useStore((s) => s.bookings)
  const [period, setPeriod] = useState<Period>('week')
  const [status, setStatus] = useState<StatusFilter>('all')
  const q = search.trim().toLowerCase()

  const rows = useMemo(() => {
    const week = addDays(TODAY, 7)
    const month = addMonths(TODAY, 1)
    return bookings
      .filter((b) => {
        if (status !== 'all' && b.status !== status) return false
        if (!matchesSearch(b, q)) return false
        switch (period) {
          case 'today':
            return b.date === TODAY
          case 'week':
            return b.date >= TODAY && b.date < week
          case 'month':
            return b.date >= TODAY && b.date < month
          case 'future':
            return b.date >= TODAY
          case 'past':
            return b.date < TODAY
          default:
            return true
        }
      })
      .sort((a, b) => a.date.localeCompare(b.date) || a.start - b.start || a.gazeboId - b.gazeboId)
  }, [bookings, period, status, q])

  const real = rows.filter((b) => b.status !== 'blocked')
  const total = real.reduce((s, b) => s + b.total, 0)
  const prepaid = real.reduce((s, b) => s + b.prepaid, 0)

  return (
    <div className="flex flex-col gap-4 anim-fade">
      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          value={period}
          onChange={setPeriod}
          options={[
            { value: 'today', label: 'Сегодня' },
            { value: 'week', label: '7 дней' },
            { value: 'month', label: 'Месяц' },
            { value: 'future', label: 'Все будущие' },
            { value: 'past', label: 'Прошедшие' },
            { value: 'all', label: 'Все' },
          ]}
        />
        <Segmented
          value={status}
          onChange={setStatus}
          options={[
            { value: 'all', label: 'Любой статус' },
            { value: 'tentative', label: 'Предварительно' },
            { value: 'booked', label: 'Бронь' },
            { value: 'paid', label: 'Оплачено' },
            { value: 'blocked', label: 'Блок' },
          ]}
        />
        <div className="ml-auto text-[13px] text-ink-soft">
          <b className="text-ink">{fmtNum(real.length)}</b> {plural(real.length, 'бронь', 'брони', 'броней')} · сумма{' '}
          <b className="text-ink">{fmtMoney(total)}</b> · предоплат <b className="text-ink">{fmtMoney(prepaid)}</b>
        </div>
      </div>

      <div className="glass rounded-3xl overflow-hidden">
        <div className="overflow-auto max-h-[calc(100vh-250px)] scrollbar-thin">
          <table className="w-full min-w-[1080px] text-left text-[13px]">
            <thead className="sticky top-0 z-10">
              <tr className="bg-[#f4f9f5]/95 backdrop-blur text-[11px] font-bold uppercase tracking-[.06em] text-muted">
                {['Дата', 'Время', 'Беседка', 'Клиент', 'Телефон', 'Гостей', 'Статус', 'Сумма', 'Предоплата', 'Сделка Б24', 'Источник', 'Менеджер'].map((h) => (
                  <th key={h} className="px-3 py-2.5 border-b border-line font-bold whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-4 py-10 text-center text-muted">
                    Ничего не найдено — измените период или запрос
                  </td>
                </tr>
              )}
              {rows.map((b) => {
                const g = GAZEBO_BY_ID[b.gazeboId]
                const blocked = b.status === 'blocked'
                return (
                  <tr
                    key={b.id}
                    onClick={() => onOpen(b.id)}
                    className={cx('cursor-pointer transition hover:bg-white/80', b.date < TODAY && 'opacity-70', b.date === TODAY && 'bg-accent-soft/40')}
                  >
                    <td className="px-3 py-2 border-b border-line/60 whitespace-nowrap font-semibold">{fmtDay(b.date)}</td>
                    <td className="px-3 py-2 border-b border-line/60 tabular-nums">{fmtRange(b.start, b.end)}</td>
                    <td className="px-3 py-2 border-b border-line/60 whitespace-nowrap">
                      <b>№ {b.gazeboId}</b> <span className="text-muted">· {g?.capacity} чел</span>
                    </td>
                    <td className="px-3 py-2 border-b border-line/60 max-w-[260px] truncate font-medium">{b.clientName}</td>
                    <td className="px-3 py-2 border-b border-line/60 tabular-nums whitespace-nowrap">{b.phone || '—'}</td>
                    <td className="px-3 py-2 border-b border-line/60 tabular-nums">{blocked ? '—' : b.guests}</td>
                    <td className="px-3 py-2 border-b border-line/60">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="px-3 py-2 border-b border-line/60 tabular-nums font-semibold whitespace-nowrap">{blocked ? '—' : fmtMoney(b.total)}</td>
                    <td className="px-3 py-2 border-b border-line/60 tabular-nums whitespace-nowrap">
                      {blocked ? '—' : b.prepaid > 0 ? fmtMoney(b.prepaid) : <span className="text-muted">нет</span>}
                    </td>
                    <td className="px-3 py-2 border-b border-line/60 whitespace-nowrap">
                      {b.dealId ? (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-[#e8f0fb] text-[#1d4f9a] px-2 py-0.5 text-[12px] font-semibold tabular-nums">
                          #{b.dealId} · {STATUS_META[b.status].stage}
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 border-b border-line/60 text-muted whitespace-nowrap">{blocked ? '—' : SOURCE_LABEL[b.source]}</td>
                    <td className="px-3 py-2 border-b border-line/60 text-muted whitespace-nowrap">{b.manager}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
