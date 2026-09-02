import { useMemo } from 'react'
import { CalendarCheck, Clock, Coins, ChartBar } from '@phosphor-icons/react'
import { GAZEBOS } from '../data/gazebos'
import { DOW, TODAY, dow, fmtMoney, fmtNum, fmtRange, holidayName, monthDays, parseISO, plural, rateType } from '../lib/date'
import { shortName } from '../lib/pricing'
import { useStore } from '../store'
import type { Booking } from '../types'
import { STATUS_META } from '../types'
import { Tile, cx } from '../components/ui'

const WORK_HOURS = 14 // 10:00–24:00

export function matchesSearch(b: Booking, q: string): boolean {
  if (!q) return true
  const digits = q.replace(/\D/g, '')
  return (
    b.clientName.toLowerCase().includes(q) ||
    (digits.length >= 3 && b.phone.replace(/\D/g, '').includes(digits)) ||
    (b.dealId !== undefined && String(b.dealId) === digits)
  )
}

export function MonthGrid({
  cursor,
  search,
  onOpen,
  onNew,
  onDay,
  fullscreen = false,
}: {
  cursor: string
  search: string
  onOpen: (id: string) => void
  onNew: (preset: { gazeboId: number; date: string }) => void
  onDay: (date: string) => void
  fullscreen?: boolean
}) {
  const bookings = useStore((s) => s.bookings)
  const days = useMemo(() => monthDays(cursor), [cursor])
  const prefix = cursor.slice(0, 7)
  const q = search.trim().toLowerCase()

  const { byKey, stats } = useMemo(() => {
    const byKey = new Map<string, Booking[]>()
    let count = 0
    let tentative = 0
    let hours = 0
    let revenue = 0
    let wkHours = 0
    for (const b of bookings) {
      if (!b.date.startsWith(prefix)) continue
      const k = `${b.date}|${b.gazeboId}`
      const arr = byKey.get(k)
      if (arr) arr.push(b)
      else byKey.set(k, [b])
      if (b.status === 'blocked') continue
      count++
      if (b.status === 'tentative') tentative++
      const h = b.end - b.start
      hours += h
      if (b.status !== 'tentative') revenue += b.total
      if (rateType(b.date) !== 'weekday') wkHours += h
    }
    for (const arr of byKey.values()) arr.sort((a, b) => a.start - b.start)
    const wkDays = days.filter((d) => rateType(d) !== 'weekday').length
    const load = wkDays ? wkHours / (wkDays * GAZEBOS.length * WORK_HOURS) : 0
    return { byKey, stats: { count, tentative, hours, revenue, load, wkDays } }
  }, [bookings, prefix, days])

  return (
    <div className={cx('flex flex-col anim-fade', fullscreen ? 'h-full gap-2' : 'gap-4')}>
      {!fullscreen && (
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <Tile
          icon={<CalendarCheck size={22} weight="fill" />}
          label="Броней в месяце"
          value={fmtNum(stats.count)}
          sub={`${stats.tentative} ${plural(stats.tentative, 'предварительная', 'предварительные', 'предварительных')}`}
        />
        <Tile icon={<Clock size={22} weight="fill" />} label="Часов аренды" value={fmtNum(stats.hours)} sub="по всем беседкам" />
        <Tile icon={<Coins size={22} weight="fill" />} label="Выручка" value={fmtMoney(stats.revenue)} sub="подтверждённые + оплаченные" />
        <Tile
          icon={<ChartBar size={22} weight="fill" />}
          label="Загрузка выходных"
          value={`${Math.round(stats.load * 100)} %`}
          sub={`${stats.wkDays} ${plural(stats.wkDays, 'день', 'дня', 'дней')} пт–вс и праздники`}
        />
      </div>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-1 text-[12px] text-muted">
        {(['tentative', 'booked', 'paid', 'blocked'] as const).map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5">
            <span className={cx('h-3 w-3 rounded-[4px]', STATUS_META[s].cls)} />
            {STATUS_META[s].label}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-[4px] bg-[#fff1dc] border border-[#f3d9a8]" />
          пт–вс и праздники — тариф выше
        </span>
        <span className="ml-auto hidden md:inline">Клик по пустой ячейке — новая бронь · клик по дате — таймлайн дня</span>
      </div>

      <div className={cx('glass rounded-3xl overflow-hidden', fullscreen && 'flex-1 min-h-0 flex flex-col')}>
        <div className={cx('overflow-auto scrollbar-thin', fullscreen ? 'flex-1 min-h-0' : 'max-h-[calc(100vh-300px)] min-h-[440px]')}>
          <table className="border-separate border-spacing-0 min-w-max text-left">
            <thead className="sticky top-0 z-30">
              <tr>
                <th className="sticky left-0 z-40 bg-[#f4f9f5]/95 backdrop-blur px-3 py-2.5 border-b border-r border-line text-[11.5px] font-bold uppercase tracking-[.06em] text-muted min-w-[104px]">
                  Дата
                </th>
                {GAZEBOS.map((g) => (
                  <th
                    key={g.id}
                    className="bg-[#f4f9f5]/95 backdrop-blur min-w-[148px] px-2.5 py-2 border-b border-l border-line align-top font-normal"
                  >
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[16px] font-extrabold tracking-tight">№ {g.id}</span>
                      <span className="text-[11px] text-muted font-semibold">{g.capacity} чел</span>
                    </div>
                    <div className="text-[11px] text-muted tabular-nums">
                      от {fmtNum(g.rates.weekday)} ₽/ч
                      {g.tags.length > 0 && <span className="text-accent font-semibold"> · {g.tags[0]}</span>}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map((d) => {
                const rt = rateType(d)
                const hol = holidayName(d)
                const isToday = d === TODAY
                const past = d < TODAY
                const rowBg = rt === 'holiday' ? 'bg-[#fff1dc]/75' : rt === 'weekend' ? 'bg-[#fff9ee]/80' : 'bg-white/35'
                return (
                  <tr key={d} className={cx(rowBg, past && 'opacity-[.72]')}>
                    <th
                      onClick={() => onDay(d)}
                      className={cx(
                        'sticky left-0 z-20 px-3 py-1.5 border-b border-r border-line align-top cursor-pointer font-normal transition hover:bg-white',
                        rt === 'holiday' ? 'bg-[#fff1dc]' : rt === 'weekend' ? 'bg-[#fff9ee]' : 'bg-[#f7faf8]',
                        isToday && 'shadow-[inset_3px_0_0_#1f8a4c]',
                      )}
                      title="Открыть день"
                    >
                      <div className="flex items-baseline gap-1.5">
                        <span className={cx('text-[18px] font-extrabold tabular-nums leading-none', isToday && 'text-accent')}>
                          {parseISO(d).getDate()}
                        </span>
                        <span className={cx('text-[11px] uppercase font-bold', rt !== 'weekday' ? 'text-amber' : 'text-muted')}>
                          {DOW[dow(d)]}
                        </span>
                      </div>
                      {hol && (
                        <div
                          className="mt-1 inline-block rounded-md bg-tent text-tent-ink text-[10px] font-semibold px-1.5 py-0.5 leading-tight max-w-[92px] truncate"
                          title={`Праздничный тариф: ${hol} (лист «Тарифы 2026»)`}
                        >
                          {hol}
                        </div>
                      )}
                      {isToday && <div className="mt-1 text-[10px] font-bold text-accent uppercase tracking-wide">сегодня</div>}
                    </th>
                    {GAZEBOS.map((g) => {
                      const list = byKey.get(`${d}|${g.id}`) ?? []
                      return (
                        <td
                          key={g.id}
                          onClick={() => onNew({ gazeboId: g.id, date: d })}
                          className="group relative align-top border-b border-l border-line/70 p-1 min-w-[148px] h-[76px] cursor-pointer transition-colors hover:bg-accent-soft/60"
                        >
                          <div className="flex flex-col gap-1">
                            {list.map((b) => {
                              const dim = q !== '' && !matchesSearch(b, q)
                              const blocked = b.status === 'blocked'
                              return (
                                <button
                                  key={b.id}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onOpen(b.id)
                                  }}
                                  className={cx(
                                    'w-full text-left rounded-lg px-1.5 py-1 leading-tight transition hover:brightness-95 hover:-translate-y-px',
                                    STATUS_META[b.status].cls,
                                    dim && 'opacity-20',
                                  )}
                                  title={`${fmtRange(b.start, b.end)} · ${b.clientName}${b.guests ? ` · ${b.guests} чел` : ''}`}
                                >
                                  {blocked ? (
                                    <span className="block text-[11.5px] font-bold truncate">{b.clientName}</span>
                                  ) : (
                                    <>
                                      <span className="block text-[12.5px] font-bold tabular-nums">{fmtRange(b.start, b.end)}</span>
                                      <span className="block text-[11.5px] font-medium opacity-90 truncate">
                                        {shortName(b.clientName)} · {b.guests}
                                      </span>
                                    </>
                                  )}
                                </button>
                              )
                            })}
                          </div>
                          {list.length === 0 && (
                            <span className="pointer-events-none absolute inset-0 grid place-items-center text-accent opacity-0 group-hover:opacity-100 transition text-xl font-bold">
                              +
                            </span>
                          )}
                        </td>
                      )
                    })}
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
