import { useMemo } from 'react'
import { ArrowsClockwise } from '@phosphor-icons/react'
import { GAZEBOS } from '../data/gazebos'
import { TODAY, RATE_LABEL, fmtMoney, fmtNum, fmtRange, holidayName, plural, rateType } from '../lib/date'
import { useStore } from '../store'
import type { Booking } from '../types'
import { STATUS_META } from '../types'
import { cx } from '../components/ui'
import { matchesSearch } from './MonthGrid'

const H0 = 8
const H1 = 24
const HOURS = Array.from({ length: H1 - H0 }, (_, i) => H0 + i)
const pct = (h: number) => ((Math.min(H1, Math.max(H0, h)) - H0) / (H1 - H0)) * 100

export function DayTimeline({
  date,
  search,
  onOpen,
  onNew,
  fullscreen = false,
}: {
  date: string
  search: string
  onOpen: (id: string) => void
  onNew: (preset: { gazeboId: number; date: string; start: number; end: number }) => void
  fullscreen?: boolean
}) {
  const bookings = useStore((s) => s.bookings)
  const q = search.trim().toLowerCase()
  const now = new Date()
  const nowH = date === TODAY ? now.getHours() + now.getMinutes() / 60 : null

  const { byG, list, hours, sum, freeNow } = useMemo(() => {
    const byG = new Map<number, Booking[]>()
    const list = bookings.filter((b) => b.date === date)
    for (const b of list) {
      const arr = byG.get(b.gazeboId)
      if (arr) arr.push(b)
      else byG.set(b.gazeboId, [b])
    }
    for (const arr of byG.values()) arr.sort((a, b) => a.start - b.start)
    const real = list.filter((b) => b.status !== 'blocked')
    const hours = real.reduce((s, b) => s + (b.end - b.start), 0)
    const sum = real.filter((b) => b.status !== 'tentative').reduce((s, b) => s + b.total, 0)
    const ref = nowH ?? 12
    const freeNow = GAZEBOS.filter((g) => !(byG.get(g.id) ?? []).some((b) => b.start <= ref && b.end > ref)).length
    return { byG, list, hours, sum, freeNow }
  }, [bookings, date, nowH])

  const rt = rateType(date)
  const hol = holidayName(date)

  return (
    <div className={cx('flex flex-col anim-fade', fullscreen ? 'h-full gap-2' : 'gap-4')}>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-1 text-[13px] text-ink-soft">
        <span className="inline-flex items-center gap-1.5">
          <span
            className={cx('h-2.5 w-2.5 rounded-full', rt === 'holiday' ? 'bg-amber' : rt === 'weekend' ? 'bg-[#f3c76b]' : 'bg-accent')}
          />
          Тариф: <b className="text-ink">{RATE_LABEL[rt]}</b>
          {hol && <span className="text-muted">· {hol}</span>}
        </span>
        <span>
          <b className="text-ink">{list.filter((b) => b.status !== 'blocked').length}</b>{' '}
          {plural(list.length, 'бронь', 'брони', 'броней')} · <b className="text-ink">{fmtNum(hours)}</b> ч ·{' '}
          <b className="text-ink">{fmtMoney(sum)}</b>
        </span>
        <span>
          {nowH !== null ? 'Свободно сейчас' : 'Свободно в 12:00'}: <b className="text-accent">{freeNow}</b> из {GAZEBOS.length}
        </span>
        <span className="ml-auto text-[12px] text-muted hidden md:inline">Клик по свободному месту в строке — новая бронь с этого часа</span>
      </div>

      <div className={cx('glass rounded-3xl overflow-hidden', fullscreen && 'flex-1 min-h-0 flex flex-col')}>
        <div className={cx('overflow-auto scrollbar-thin', fullscreen ? 'flex-1 min-h-0' : 'max-h-[calc(100vh-250px)]')}>
          <div className="min-w-[1180px]">
            <div className="grid sticky top-0 z-30" style={{ gridTemplateColumns: '200px 1fr' }}>
              <div className="sticky left-0 z-40 bg-[#f4f9f5]/95 backdrop-blur px-3 py-2.5 border-b border-r border-line text-[11.5px] font-bold uppercase tracking-[.06em] text-muted">
                Беседка
              </div>
              <div className="relative h-10 bg-[#f4f9f5]/95 backdrop-blur border-b border-line">
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className="absolute top-0 bottom-0 pl-1.5 pt-2.5 text-[11px] font-semibold text-muted border-l border-line/80 tabular-nums"
                    style={{ left: `${pct(h)}%` }}
                  >
                    {h}:00
                  </div>
                ))}
              </div>
            </div>

            {GAZEBOS.map((g) => {
              const rows = byG.get(g.id) ?? []
              return (
                <div key={g.id} className="grid" style={{ gridTemplateColumns: '200px 1fr' }}>
                  <div className="sticky left-0 z-20 bg-[#f7faf8] px-3 py-2 border-b border-r border-line flex items-center gap-2">
                    <span className="text-[15px] font-extrabold tracking-tight whitespace-nowrap">№ {g.id}</span>
                    <span className="text-[11px] text-muted font-semibold whitespace-nowrap">{g.capacity} чел</span>
                    {g.tags[0] && <span className="text-[10.5px] text-accent font-semibold truncate">{g.tags[0]}</span>}
                    {g.turnover > 0 && (
                      <span className="ml-auto inline-flex items-center gap-0.5 text-[10.5px] text-muted" title="Перезаезд 1 час">
                        <ArrowsClockwise size={12} weight="bold" />1ч
                      </span>
                    )}
                  </div>
                  <div
                    className="relative h-[66px] border-b border-line/70 cursor-pointer transition-colors hover:bg-accent-soft/40"
                    onClick={(e) => {
                      const r = e.currentTarget.getBoundingClientRect()
                      const frac = (e.clientX - r.left) / r.width
                      const h = Math.round((H0 + frac * (H1 - H0)) * 2) / 2
                      const start = Math.min(H1 - 1, Math.max(H0, h))
                      onNew({ gazeboId: g.id, date, start, end: Math.min(g.maxEnd ?? H1, start + 3) })
                    }}
                  >
                    {HOURS.map((h) => (
                      <div key={h} className="absolute top-0 bottom-0 border-l border-line/60" style={{ left: `${pct(h)}%` }} />
                    ))}
                    {rows.map((b) => {
                      const dim = q !== '' && !matchesSearch(b, q)
                      const blocked = b.status === 'blocked'
                      const left = pct(b.start)
                      const width = pct(b.end) - left
                      return (
                        <div key={b.id} className={cx('contents', dim && 'opacity-20')}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onOpen(b.id)
                            }}
                            className={cx(
                              'absolute top-2 bottom-2 rounded-xl px-2.5 text-left leading-tight overflow-hidden transition hover:brightness-95 hover:-translate-y-px shadow-[0_1px_0_rgba(255,255,255,.7)_inset,0_4px_10px_-6px_rgba(16,60,40,.35)]',
                              STATUS_META[b.status].cls,
                              dim && 'opacity-20',
                            )}
                            style={{ left: `${left}%`, width: `${width}%` }}
                            title={`${fmtRange(b.start, b.end)} · ${b.clientName}`}
                          >
                            <div className="text-[11.5px] font-bold tabular-nums">{blocked ? b.clientName : fmtRange(b.start, b.end)}</div>
                            {!blocked && (
                              <div className="text-[11px] font-medium opacity-90 truncate">
                                {b.clientName} · {b.guests} чел
                              </div>
                            )}
                          </button>
                          {g.turnover > 0 && !blocked && b.end < H1 && (
                            <div
                              className={cx('absolute top-2 bottom-2 hatch rounded-r-xl opacity-70', dim && 'opacity-10')}
                              style={{ left: `${pct(b.end)}%`, width: `${pct(b.end + g.turnover) - pct(b.end)}%` }}
                              title="Перезаезд — 1 час на уборку"
                            />
                          )}
                        </div>
                      )
                    })}
                    {nowH !== null && nowH >= H0 && nowH <= H1 && (
                      <div className="absolute top-0 bottom-0 w-[2px] bg-coral z-10 pointer-events-none" style={{ left: `${pct(nowH)}%` }} />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
