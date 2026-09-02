import { CalendarStar, Confetti, Info, Sparkle } from '@phosphor-icons/react'
import { EXTRAS, GAZEBOS, GRAD_PACKAGES, HOLIDAYS } from '../data/gazebos'
import { TODAY, fmtMoney, fmtNum, parseISO, MONTHS_GEN, rateType } from '../lib/date'
import { SectionTitle, cx } from '../components/ui'

function fmtPeriod(from: string, to: string): string {
  const a = parseISO(from)
  const b = parseISO(to)
  if (from === to) return `${a.getDate()} ${MONTHS_GEN[a.getMonth()]}`
  if (a.getMonth() === b.getMonth()) return `${a.getDate()}–${b.getDate()} ${MONTHS_GEN[a.getMonth()]}`
  return `${a.getDate()} ${MONTHS_GEN[a.getMonth()]} – ${b.getDate()} ${MONTHS_GEN[b.getMonth()]}`
}

export function Tariffs() {
  const todayType = rateType(TODAY)
  const cols: { key: 'weekday' | 'weekend' | 'holiday'; label: string }[] = [
    { key: 'weekday', label: 'пн–чт' },
    { key: 'weekend', label: 'пт, сб, вс' },
    { key: 'holiday', label: 'праздники' },
  ]
  return (
    <div className="flex flex-col gap-6 anim-fade">
      <div className="grid xl:grid-cols-[1fr_360px] gap-5 items-start">
        <div className="glass rounded-3xl overflow-hidden">
          <div className="px-5 pt-5 pb-3 flex flex-wrap items-end justify-between gap-2">
            <SectionTitle sub="Цена за час аренды. Подсвечен тариф, который действует сегодня.">Беседки и цены с 01.01.2026</SectionTitle>
          </div>
          <div className="overflow-auto scrollbar-thin">
            <table className="w-full min-w-[640px] text-left text-[13.5px]">
              <thead>
                <tr className="text-[11px] font-bold uppercase tracking-[.06em] text-muted bg-[#f4f9f5]">
                  <th className="px-5 py-2.5 border-y border-line">Беседка</th>
                  <th className="px-3 py-2.5 border-y border-line">Вместимость</th>
                  {cols.map((c) => (
                    <th key={c.key} className={cx('px-3 py-2.5 border-y border-line text-right', c.key === todayType && 'text-accent')}>
                      {c.label}
                      {c.key === todayType && ' · сегодня'}
                    </th>
                  ))}
                  <th className="px-3 py-2.5 border-y border-line">Особенности</th>
                </tr>
              </thead>
              <tbody>
                {GAZEBOS.map((g) => (
                  <tr key={g.id} className="hover:bg-white/70 transition">
                    <td className="px-5 py-2 border-b border-line/60 font-extrabold whitespace-nowrap">№ {g.id}</td>
                    <td className="px-3 py-2 border-b border-line/60 tabular-nums">{g.capacity} чел</td>
                    {cols.map((c) => (
                      <td
                        key={c.key}
                        className={cx(
                          'px-3 py-2 border-b border-line/60 text-right tabular-nums',
                          c.key === todayType ? 'font-extrabold text-accent bg-accent-soft/40' : 'font-medium',
                        )}
                      >
                        {fmtNum(g.rates[c.key])} ₽
                      </td>
                    ))}
                    <td className="px-3 py-2 border-b border-line/60 text-[12.5px] text-ink-soft">
                      <div className="flex flex-wrap gap-1">
                        {g.tags.map((t) => (
                          <span key={t} className="rounded-md bg-accent-soft text-accent px-1.5 py-0.5 text-[11px] font-semibold">
                            {t}
                          </span>
                        ))}
                        {g.turnover > 0 && (
                          <span className="rounded-md bg-[#eef2f7] text-ink-soft px-1.5 py-0.5 text-[11px] font-semibold">перезаезд 1 ч</span>
                        )}
                        {g.maxEnd && (
                          <span className="rounded-md bg-tent text-tent-ink px-1.5 py-0.5 text-[11px] font-semibold">до {g.maxEnd}:00</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="glass rounded-3xl p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="grid place-items-center h-9 w-9 rounded-xl bg-tent text-tent-ink">
                <CalendarStar size={20} weight="fill" />
              </div>
              <h3 className="font-extrabold text-[16px]">Праздничные дни</h3>
            </div>
            <ul className="flex flex-col divide-y divide-line/60">
              {HOLIDAYS.filter((h) => h.to >= TODAY.slice(0, 4) + '-01-01').map((h) => (
                <li key={h.from} className="flex items-baseline justify-between gap-3 py-2 text-[13px]">
                  <span className="font-semibold tabular-nums whitespace-nowrap">{fmtPeriod(h.from, h.to)}</span>
                  <span className="text-muted text-right">{h.name}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="glass rounded-3xl p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="grid place-items-center h-9 w-9 rounded-xl bg-accent-soft text-accent">
                <Sparkle size={20} weight="fill" />
              </div>
              <h3 className="font-extrabold text-[16px]">Доп. услуги</h3>
            </div>
            <ul className="flex flex-col divide-y divide-line/60">
              {EXTRAS.map((e) => (
                <li key={e.id} className="flex items-baseline justify-between gap-3 py-2 text-[13px]">
                  <span className="font-semibold">{e.name}</span>
                  <span className="tabular-nums text-ink-soft">
                    {fmtMoney(e.price)} <span className="text-muted">/ {e.unit}</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-[11.5px] text-muted mt-3">Цены услуг в демо условные — подставим ваши.</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_1fr] gap-5">
        <div className="glass rounded-3xl p-5">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="grid place-items-center h-9 w-9 rounded-xl bg-[#fde7f0] text-[#b23b6b]">
              <Confetti size={20} weight="fill" />
            </div>
            <div>
              <h3 className="font-extrabold text-[16px]">Выпускные 2026 · пакеты</h3>
              <div className="text-[12px] text-muted">21–31 мая · беседки от 20 человек</div>
            </div>
          </div>
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-[11px] font-bold uppercase tracking-[.06em] text-muted">
                <th className="text-left py-1.5">Беседка</th>
                <th className="text-right py-1.5">Пакет 1 · 2 ч</th>
                <th className="text-right py-1.5">Пакет 2 · 2 ч</th>
                <th className="text-right py-1.5">Пакет 3 · 2,5 ч</th>
              </tr>
            </thead>
            <tbody>
              {GRAD_PACKAGES.map((p) => (
                <tr key={p.gazeboId} className="border-t border-line/60">
                  <td className="py-2 font-extrabold">№ {p.gazeboId}</td>
                  <td className="py-2 text-right tabular-nums">{fmtMoney(p.p1)}</td>
                  <td className="py-2 text-right tabular-nums">{fmtMoney(p.p2)}</td>
                  <td className="py-2 text-right tabular-nums font-semibold">{fmtMoney(p.p3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="glass rounded-3xl p-5 flex gap-4">
          <div className="grid place-items-center h-9 w-9 rounded-xl bg-booked text-booked-ink shrink-0">
            <Info size={20} weight="fill" />
          </div>
          <div className="text-[13.5px] leading-relaxed text-ink-soft">
            <p className="font-extrabold text-ink text-[16px] mb-1.5">Где живут тарифы в боевой версии</p>
            <p>
              Цены, праздничные дни и пакеты хранятся в <b>Битрикс24</b> (справочник или смарт-процесс «Тарифы»). Меняете цену там —
              календарь пересчитывает новые брони автоматически, без программиста. Тип дня (будни / выходной / праздник)
              определяется сам, поэтому администратор не выбирает цену вручную и не ошибается.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
