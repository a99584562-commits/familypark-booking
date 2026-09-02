import {
  ArrowRight,
  ArrowsLeftRight,
  ChatCircleDots,
  CheckCircle,
  ClockCounterClockwise,
  Info,
  ListChecks,
  Money,
  Phone,
  SquaresFour,
  XCircle,
} from '@phosphor-icons/react'
import { fmtDateTime } from '../lib/date'
import { useStore } from '../store'
import type { SyncEvent } from '../types'
import { SectionTitle, cx } from '../components/ui'

const MAPPING: [string, string][] = [
  ['Беседка', 'Поле сделки «Беседка» (список № 1–25)'],
  ['Дата и время', '«Дата брони», «Время с», «Время до»'],
  ['Клиент и телефон', 'Контакт сделки — дубли ищутся по телефону'],
  ['Гостей', '«Количество гостей»'],
  ['Доп. услуги', 'Товарные позиции сделки'],
  ['Сумма', 'Сумма сделки — считается по тарифу'],
  ['Предоплата', 'Поле «Предоплата» в сделке'],
  ['Статус брони', 'Стадия воронки «Бронирования»'],
  ['Комментарий', 'Комментарий в таймлайне сделки'],
]

const KIND_ICON: Record<SyncEvent['kind'], { icon: typeof CheckCircle; cls: string }> = {
  create: { icon: CheckCircle, cls: 'bg-booked text-booked-ink' },
  update: { icon: ArrowsLeftRight, cls: 'bg-[#eef2f7] text-ink-soft' },
  status: { icon: ListChecks, cls: 'bg-tent text-tent-ink' },
  payment: { icon: Money, cls: 'bg-paid text-paid-ink' },
  cancel: { icon: XCircle, cls: 'bg-block text-block-ink' },
  info: { icon: Info, cls: 'bg-[#eef2f7] text-ink-soft' },
}

function FlowCard({
  icon,
  title,
  lines,
  accent,
}: {
  icon: React.ReactNode
  title: string
  lines: string[]
  accent?: boolean
}) {
  return (
    <div
      className={cx(
        'glass rounded-3xl p-4 flex-1 min-w-[200px]',
        accent && 'bg-gradient-to-br from-white/90 to-accent-soft/90 ring-2 ring-accent/30',
      )}
    >
      <div className="flex items-center gap-2.5 mb-2">
        <div className={cx('grid place-items-center h-9 w-9 rounded-xl shrink-0', accent ? 'grad-accent text-white shadow-soft' : 'bg-white text-accent border border-line')}>
          {icon}
        </div>
        <div className="font-extrabold text-[14.5px] leading-tight">{title}</div>
      </div>
      <ul className="text-[12.5px] text-ink-soft leading-snug flex flex-col gap-0.5">
        {lines.map((l) => (
          <li key={l}>· {l}</li>
        ))}
      </ul>
    </div>
  )
}

export function Integration() {
  const log = useStore((s) => s.log)

  return (
    <div className="flex flex-col gap-6 anim-fade">
      <div className="glass rounded-3xl p-6 lg:p-8 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-accent-2/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-28 -left-16 h-72 w-72 rounded-full bg-amber/20 blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="text-[12px] font-bold uppercase tracking-[.08em] text-accent">Как это работает</div>
          <h2 className="text-[28px] lg:text-[34px] font-extrabold tracking-tight leading-[1.05] mt-1 max-w-3xl">
            Одна запись — <span className="grad-text">везде</span>
          </h2>
          <p className="text-[15px] text-ink-soft mt-3 max-w-3xl leading-relaxed">
            Сейчас администратор заводит сделку в Битрикс24, а потом вручную дублирует её в Excel-шахматку, чтобы видеть свободные
            беседки. Календарь читает сделки прямо из воронки «Бронирования» и показывает занятость сам — в реальном времени, на
            любом устройстве.
          </p>

          <div className="mt-6 flex flex-col lg:flex-row items-stretch gap-3">
            <FlowCard
              icon={<Phone size={20} weight="fill" />}
              title="Заявка"
              lines={['Звонок, WhatsApp, ВКонтакте', 'Форма на сайте', 'Гость на месте']}
            />
            <div className="hidden lg:grid place-items-center text-accent">
              <ArrowRight size={22} weight="bold" />
            </div>
            <FlowCard
              icon={<SquaresFour size={20} weight="fill" />}
              title="Битрикс24"
              lines={['Сделка в воронке «Бронирования»', 'Контакт клиента, задачи', 'Стадии = статусы брони']}
              accent
            />
            <div className="hidden lg:grid place-items-center text-accent">
              <ArrowsLeftRight size={22} weight="bold" />
            </div>
            <FlowCard
              icon={<ListChecks size={20} weight="fill" />}
              title="Календарь беседок"
              lines={['Шахматка и таймлайн дня', 'Проверка пересечений и перезаезда', 'Цена по тарифу автоматически']}
              accent
            />
            <div className="hidden lg:grid place-items-center text-accent">
              <ArrowRight size={22} weight="bold" />
            </div>
            <FlowCard
              icon={<ChatCircleDots size={20} weight="fill" />}
              title="Клиент"
              lines={['Подтверждение в WhatsApp / SMS', 'Напоминание за день', 'История визитов в CRM']}
            />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {[
          { n: '1', t: 'Видит свободные окна', d: 'Шахматка на месяц — как в таблице, плюс таймлайн дня по часам: видно, между какими бронями ещё влезет компания.' },
          { n: '2', t: 'Нажимает на окно', d: 'Карточка брони: беседка, время, гости, доп. услуги. Цена считается по тарифу дня, пересечения подсвечиваются сразу.' },
          { n: '3', t: 'Сохраняет — и всё', d: 'В Битрикс24 появляется сделка с полями, контакт клиента и задача-напоминание. Стадии сделки двигают статус брони и обратно.' },
        ].map((s) => (
          <div key={s.n} className="glass rounded-3xl p-5 flex gap-4">
            <div className="grid place-items-center h-10 w-10 rounded-2xl grad-accent text-white font-extrabold shadow-soft shrink-0">{s.n}</div>
            <div>
              <div className="font-extrabold text-[15px]">{s.t}</div>
              <p className="text-[13px] text-ink-soft leading-relaxed mt-1">{s.d}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid xl:grid-cols-[1fr_1fr] gap-5 items-start">
        <div className="glass rounded-3xl p-5">
          <SectionTitle sub="Каждое поле брони живёт в сделке Битрикс24 — ничего не теряется и не расходится.">Бронь ↔ сделка</SectionTitle>
          <table className="w-full text-[13px] mt-4">
            <tbody>
              {MAPPING.map(([a, b]) => (
                <tr key={a} className="border-t border-line/60">
                  <td className="py-2 pr-3 font-semibold whitespace-nowrap">{a}</td>
                  <td className="py-2 text-accent w-6">
                    <ArrowRight size={14} weight="bold" />
                  </td>
                  <td className="py-2 text-ink-soft">{b}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 rounded-2xl bg-[#f4f9f5] border border-line p-3.5 text-[12.5px] text-ink-soft leading-relaxed">
            <b className="text-ink">Стадии воронки:</b> Новая бронь → Подтверждена → Оплачено · Отменена снимает бронь с календаря.
            Предоплата отмечается в сделке — как сейчас в таблице, только в одном месте.
          </div>
        </div>

        <div className="glass rounded-3xl p-5 flex flex-col">
          <div className="flex items-center justify-between gap-3">
            <SectionTitle sub="Живой журнал: создайте или измените бронь в демо — событие появится здесь.">Журнал синхронизации</SectionTitle>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-paid text-paid-ink px-2.5 py-1 text-[11.5px] font-bold whitespace-nowrap">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              онлайн
            </span>
          </div>
          <ul className="mt-4 flex flex-col divide-y divide-line/60 max-h-[420px] overflow-auto scrollbar-thin -mx-2 px-2">
            {log.map((e) => {
              const k = KIND_ICON[e.kind]
              return (
                <li key={e.id} className="flex items-start gap-3 py-2.5">
                  <span className={cx('grid place-items-center h-8 w-8 rounded-xl shrink-0', k.cls)}>
                    <k.icon size={16} weight="fill" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-[13px] leading-snug">{e.text}</div>
                    <div className="text-[11px] text-muted mt-0.5 tabular-nums inline-flex items-center gap-1">
                      <ClockCounterClockwise size={12} /> {fmtDateTime(e.at)}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </div>
  )
}
