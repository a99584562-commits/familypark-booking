import { ArrowCounterClockwise, CalendarBlank, Clock, ListChecks, PlugsConnected, Tag, TreeEvergreen } from '@phosphor-icons/react'
import type { View } from '../types'
import { cx } from './ui'

const NAV: { id: View; label: string; icon: typeof CalendarBlank }[] = [
  { id: 'month', label: 'Шахматка', icon: CalendarBlank },
  { id: 'day', label: 'День', icon: Clock },
  { id: 'list', label: 'Брони', icon: ListChecks },
  { id: 'tariffs', label: 'Тарифы', icon: Tag },
  { id: 'b24', label: 'Битрикс24', icon: PlugsConnected },
]

export function Sidebar({ view, setView, onReset }: { view: View; setView: (v: View) => void; onReset: () => void }) {
  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:flex flex-col w-[252px] shrink-0 sticky top-0 h-screen p-4 pr-0">
        <div className="glass rounded-[28px] flex-1 flex flex-col p-4">
          <div className="flex items-center gap-3 px-2 pt-1">
            <div className="grid place-items-center h-11 w-11 rounded-2xl grad-accent text-white shadow-soft">
              <TreeEvergreen size={24} weight="fill" />
            </div>
            <div className="leading-tight">
              <div className="font-extrabold text-[15px] tracking-tight">Фемили парк</div>
              <div className="text-[11.5px] text-muted font-medium">Бронирование беседок</div>
            </div>
          </div>

          <nav className="mt-7 flex flex-col gap-1">
            {NAV.map((n) => {
              const active = view === n.id
              return (
                <button
                  key={n.id}
                  onClick={() => setView(n.id)}
                  className={cx(
                    'flex items-center gap-3 h-11 px-3 rounded-2xl text-[14px] font-semibold transition-all',
                    active
                      ? 'bg-white text-accent shadow-soft'
                      : 'text-ink-soft hover:bg-white/60 hover:text-ink',
                  )}
                >
                  <n.icon size={20} weight={active ? 'fill' : 'regular'} />
                  {n.label}
                </button>
              )
            })}
          </nav>

          <div className="mt-auto flex flex-col gap-3">
            <div className="rounded-2xl bg-white/60 border border-white/80 p-3 flex items-center gap-3">
              <div className="grid place-items-center h-9 w-9 rounded-full bg-gradient-to-br from-[#ffd89b] to-[#e9a23b] text-white font-bold text-sm shadow-soft">
                МК
              </div>
              <div className="leading-tight min-w-0">
                <div className="text-[13px] font-semibold truncate">Мария К.</div>
                <div className="text-[11px] text-muted">администратор</div>
              </div>
            </div>
            <button
              onClick={onReset}
              className="flex items-center justify-center gap-2 h-10 rounded-2xl text-[12.5px] font-semibold text-muted hover:text-ink hover:bg-white/60 transition"
            >
              <ArrowCounterClockwise size={16} weight="bold" />
              Сбросить демо-данные
            </button>
            <div className="text-[11px] text-muted/80 text-center leading-snug px-2">
              Демо · данные условные, имена вымышленные
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 p-3 pt-0">
        <div className="glass-strong rounded-3xl flex justify-around p-1.5">
          {NAV.map((n) => {
            const active = view === n.id
            return (
              <button
                key={n.id}
                onClick={() => setView(n.id)}
                className={cx(
                  'flex flex-col items-center gap-0.5 rounded-2xl px-3 py-1.5 text-[10.5px] font-semibold transition',
                  active ? 'text-accent bg-accent-soft' : 'text-muted',
                )}
              >
                <n.icon size={20} weight={active ? 'fill' : 'regular'} />
                {n.label}
              </button>
            )
          })}
        </div>
      </nav>
    </>
  )
}
