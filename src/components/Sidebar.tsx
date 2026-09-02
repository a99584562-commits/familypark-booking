import {
  ArrowCounterClockwise,
  CalendarBlank,
  CaretDoubleLeft,
  CaretDoubleRight,
  Clock,
  ListChecks,
  PlugsConnected,
  Tag,
  TreeEvergreen,
} from '@phosphor-icons/react'
import type { View } from '../types'
import { cx } from './ui'

const NAV: { id: View; label: string; icon: typeof CalendarBlank }[] = [
  { id: 'month', label: 'Шахматка', icon: CalendarBlank },
  { id: 'day', label: 'День', icon: Clock },
  { id: 'list', label: 'Брони', icon: ListChecks },
  { id: 'tariffs', label: 'Тарифы', icon: Tag },
  { id: 'b24', label: 'Битрикс24', icon: PlugsConnected },
]

export function Sidebar({
  view,
  setView,
  onReset,
  collapsed,
  onToggle,
}: {
  view: View
  setView: (v: View) => void
  onReset: () => void
  collapsed: boolean
  onToggle: () => void
}) {
  return (
    <>
      {/* Desktop */}
      <aside
        className={cx(
          'hidden lg:flex flex-col shrink-0 sticky top-0 h-screen p-4 pr-0 transition-[width] duration-300',
          collapsed ? 'w-[92px]' : 'w-[252px]',
        )}
      >
        <div className={cx('glass rounded-[28px] flex-1 flex flex-col relative', collapsed ? 'p-3' : 'p-4')}>
          <button
            onClick={onToggle}
            title={collapsed ? 'Развернуть меню' : 'Свернуть меню'}
            aria-label={collapsed ? 'Развернуть меню' : 'Свернуть меню'}
            className="absolute -right-3.5 top-7 z-10 grid place-items-center h-7 w-7 rounded-full bg-white border border-line text-muted hover:text-accent shadow-soft transition active:scale-95"
          >
            {collapsed ? <CaretDoubleRight size={12} weight="bold" /> : <CaretDoubleLeft size={12} weight="bold" />}
          </button>

          <div className={cx('flex items-center gap-3 pt-1', collapsed ? 'justify-center' : 'px-2')}>
            <div className="grid place-items-center h-11 w-11 rounded-2xl grad-accent text-white shadow-soft shrink-0">
              <TreeEvergreen size={24} weight="fill" />
            </div>
            {!collapsed && (
              <div className="leading-tight">
                <div className="font-extrabold text-[15px] tracking-tight whitespace-nowrap">Фемили парк</div>
                <div className="text-[11.5px] text-muted font-medium whitespace-nowrap">Бронирование беседок</div>
              </div>
            )}
          </div>

          <nav className="mt-7 flex flex-col gap-1">
            {NAV.map((n) => {
              const active = view === n.id
              return (
                <button
                  key={n.id}
                  onClick={() => setView(n.id)}
                  title={n.label}
                  className={cx(
                    'flex items-center gap-3 h-11 rounded-2xl text-[14px] font-semibold transition-all',
                    collapsed ? 'justify-center px-0' : 'px-3',
                    active ? 'bg-white text-accent shadow-soft' : 'text-ink-soft hover:bg-white/60 hover:text-ink',
                  )}
                >
                  <n.icon size={20} weight={active ? 'fill' : 'regular'} />
                  {!collapsed && n.label}
                </button>
              )
            })}
          </nav>

          <div className="mt-auto flex flex-col gap-3">
            <div
              className={cx('rounded-2xl bg-white/60 border border-white/80 flex items-center gap-3', collapsed ? 'p-1.5 justify-center' : 'p-3')}
              title="Мария К. · администратор"
            >
              <div className="grid place-items-center h-9 w-9 rounded-full bg-gradient-to-br from-[#ffd89b] to-[#e9a23b] text-white font-bold text-sm shadow-soft shrink-0">
                МК
              </div>
              {!collapsed && (
                <div className="leading-tight min-w-0">
                  <div className="text-[13px] font-semibold truncate">Мария К.</div>
                  <div className="text-[11px] text-muted">администратор</div>
                </div>
              )}
            </div>
            <button
              onClick={onReset}
              title="Сбросить демо-данные"
              className="flex items-center justify-center gap-2 h-10 rounded-2xl text-[12.5px] font-semibold text-muted hover:text-ink hover:bg-white/60 transition"
            >
              <ArrowCounterClockwise size={16} weight="bold" />
              {!collapsed && 'Сбросить демо-данные'}
            </button>
            {!collapsed && (
              <div className="text-[11px] text-muted/80 text-center leading-snug px-2">Демо · данные условные, имена вымышленные</div>
            )}
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
