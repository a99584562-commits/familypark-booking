import { ArrowsInSimple, ArrowsOutSimple, CaretLeft, CaretRight, MagnifyingGlass, Plus, TreeEvergreen } from '@phosphor-icons/react'
import type { View } from '../types'
import { TODAY, addDays, addMonths, fmtDayLong, fmtMonth, holidayName } from '../lib/date'
import { Btn, IconBtn, Input, cx } from './ui'

const TITLES: Record<View, string> = {
  month: '',
  day: '',
  list: 'Брони',
  tariffs: 'Тарифы 2026',
  b24: 'Интеграция с Битрикс24',
}
const SUBS: Record<View, string> = {
  month: 'Даты × беседки — как в вашей таблице, только живая',
  day: 'Таймлайн по часам: сразу видно окна между бронями',
  list: 'Реестр броней с поиском, фильтрами и сделками Битрикс24',
  tariffs: 'Будни, выходные, праздники, выпускные пакеты и доп. услуги',
  b24: 'Одна запись — везде: сделка в Битрикс24 и шахматка синхронны',
}

export function Topbar({
  view,
  cursor,
  setCursor,
  search,
  setSearch,
  onNew,
  fullscreen,
  onToggleFullscreen,
}: {
  view: View
  cursor: string
  setCursor: (d: string) => void
  search: string
  setSearch: (s: string) => void
  onNew: () => void
  fullscreen: boolean
  onToggleFullscreen: () => void
}) {
  const nav = view === 'month' || view === 'day'
  const step = (n: number) => setCursor(view === 'month' ? addMonths(cursor, n) : addDays(cursor, n))
  const title = view === 'month' ? fmtMonth(cursor) : view === 'day' ? fmtDayLong(cursor) : TITLES[view]
  const hol = view === 'day' ? holidayName(cursor) : null

  return (
    <header className="flex flex-col gap-3">
      {!fullscreen && (
        <div className="flex items-center gap-3 lg:hidden">
          <div className="grid place-items-center h-9 w-9 rounded-xl grad-accent text-white shadow-soft">
            <TreeEvergreen size={20} weight="fill" />
          </div>
          <div className="font-extrabold tracking-tight">Фемили парк</div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {nav && (
            <div className="flex items-center gap-1">
              <IconBtn aria-label="Назад" onClick={() => step(-1)}>
                <CaretLeft size={18} weight="bold" />
              </IconBtn>
              <IconBtn aria-label="Вперёд" onClick={() => step(1)}>
                <CaretRight size={18} weight="bold" />
              </IconBtn>
            </div>
          )}
          <div className="min-w-0">
            <h1 className={cx('font-extrabold tracking-tight leading-tight', fullscreen ? 'text-[20px]' : 'text-[22px] sm:text-[26px]')}>
              {title}
              {hol && (
                <span
                  className="ml-2 align-middle inline-flex items-center rounded-full bg-tent text-tent-ink text-[12px] font-semibold px-2.5 py-1"
                  title="Праздничный тариф (лист «Тарифы 2026»)"
                >
                  {hol}
                </span>
              )}
            </h1>
            {!fullscreen && <div className="text-[12.5px] text-muted mt-1">{SUBS[view]}</div>}
          </div>
          {nav && cursor.slice(0, view === 'month' ? 7 : 10) !== TODAY.slice(0, view === 'month' ? 7 : 10) && (
            <Btn variant="outline" size="sm" onClick={() => setCursor(TODAY)} className="ml-1">
              Сегодня
            </Btn>
          )}
          {view === 'day' && (
            <Input
              type="date"
              value={cursor}
              onChange={(e) => e.target.value && setCursor(e.target.value)}
              className="w-[150px] h-10 hidden xl:block"
            />
          )}
        </div>

        <div className="ml-auto flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-[260px]">
            <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Клиент, телефон, № сделки"
              className="pl-9 h-10"
            />
          </div>
          {nav && (
            <IconBtn
              onClick={onToggleFullscreen}
              title={fullscreen ? 'Выйти из полного экрана (Esc)' : 'На весь экран'}
              aria-label={fullscreen ? 'Выйти из полного экрана' : 'На весь экран'}
              className="hidden lg:inline-grid"
            >
              {fullscreen ? <ArrowsInSimple size={18} weight="bold" /> : <ArrowsOutSimple size={18} weight="bold" />}
            </IconBtn>
          )}
          <Btn onClick={onNew} size="md" className="h-10">
            <Plus size={16} weight="bold" />
            <span className="hidden sm:inline">Новая бронь</span>
          </Btn>
        </div>
      </div>
    </header>
  )
}
