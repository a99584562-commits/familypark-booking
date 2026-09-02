import { useState } from 'react'
import {
  ArrowSquareOut,
  CheckCircle,
  Coins,
  Info,
  SquaresFour,
  Users,
  Warning,
  X,
} from '@phosphor-icons/react'
import { EXTRAS, GAZEBOS, GAZEBO_BY_ID } from '../data/gazebos'
import { RATE_LABEL, TIME_OPTIONS, TODAY, fmtDay, fmtMoney, fmtNum, fmtRange, fmtTime, holidayName } from '../lib/date'
import { findConflicts, priceOf } from '../lib/pricing'
import { useStore } from '../store'
import type { Booking, BookingStatus, Source } from '../types'
import { MANAGERS, SOURCE_LABEL, STATUS_META } from '../types'
import { Btn, Field, Input, Modal, Segmented, Select, StatusBadge, Textarea, cx } from './ui'

export type ModalState = null | { mode: 'new'; preset: Partial<Booking> } | { mode: 'edit'; id: string }

type Kind = 'booking' | 'block'
interface Form {
  kind: Kind
  gazeboId: number
  date: string
  start: number
  end: number
  clientName: string
  phone: string
  guests: number
  status: BookingStatus
  extras: string[]
  prepaid: number
  comment: string
  source: Source
  manager: string
}

function fromBooking(b: Booking): Form {
  return {
    kind: b.status === 'blocked' ? 'block' : 'booking',
    gazeboId: b.gazeboId,
    date: b.date,
    start: b.start,
    end: b.end,
    clientName: b.clientName,
    phone: b.phone,
    guests: b.guests,
    status: b.status === 'blocked' ? 'booked' : b.status,
    extras: b.extras,
    prepaid: b.prepaid,
    comment: b.comment,
    source: b.source,
    manager: b.manager,
  }
}

export function BookingModal({ state, onClose, toast }: { state: ModalState; onClose: () => void; toast: (t: string) => void }) {
  const key = !state
    ? 'none'
    : state.mode === 'edit'
      ? `e-${state.id}`
      : `n-${state.preset.gazeboId}-${state.preset.date}-${state.preset.start}`
  return (
    <Modal open={!!state} onClose={onClose}>
      {state && <BookingForm key={key} state={state} onClose={onClose} toast={toast} />}
    </Modal>
  )
}

function BookingForm({ state, onClose, toast }: { state: NonNullable<ModalState>; onClose: () => void; toast: (t: string) => void }) {
  const bookings = useStore((s) => s.bookings)
  const addBooking = useStore((s) => s.addBooking)
  const updateBooking = useStore((s) => s.updateBooking)
  const setStatus = useStore((s) => s.setStatus)
  const removeBooking = useStore((s) => s.removeBooking)

  const existing = state.mode === 'edit' ? bookings.find((b) => b.id === state.id) : undefined
  const [f, setF] = useState<Form>(() =>
    existing
      ? fromBooking(existing)
      : {
          kind: 'booking',
          gazeboId: state.mode === 'new' ? (state.preset.gazeboId ?? 1) : 1,
          date: state.mode === 'new' ? (state.preset.date ?? TODAY) : TODAY,
          start: state.mode === 'new' ? (state.preset.start ?? 12) : 12,
          end: state.mode === 'new' ? (state.preset.end ?? 16) : 16,
          clientName: '',
          phone: '',
          guests: 10,
          status: 'booked',
          extras: [],
          prepaid: 0,
          comment: '',
          source: 'phone',
          manager: MANAGERS[0],
        },
  )
  const [touched, setTouched] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)

  if (state.mode === 'edit' && !existing) {
    return (
      <div className="p-8 text-center text-muted">
        Бронь не найдена.
        <div className="mt-4">
          <Btn variant="outline" onClick={onClose}>
            Закрыть
          </Btn>
        </div>
      </div>
    )
  }

  const patch = (p: Partial<Form>) => setF((x) => ({ ...x, ...p }))
  const g = GAZEBO_BY_ID[f.gazeboId]
  const isBlock = f.kind === 'block'
  const price = priceOf(f.gazeboId, f.date, f.start, f.end, f.extras)
  const conflicts = findConflicts(bookings, f, existing?.id)
  const badTime = f.end <= f.start
  const overCap = !isBlock && f.guests > g.capacity
  const lateEnd = !isBlock && g.maxEnd !== undefined && f.end > g.maxEnd
  const nameMissing = f.clientName.trim().length === 0
  const canSave = !badTime && conflicts.length === 0 && !nameMissing
  const hol = holidayName(f.date)
  const isPast = f.date < TODAY
  const toggleExtra = (id: string) =>
    patch({ extras: f.extras.includes(id) ? f.extras.filter((x) => x !== id) : [...f.extras, id] })

  const save = () => {
    setTouched(true)
    if (!canSave) return
    const base: Omit<Booking, 'id' | 'dealId' | 'createdAt'> = {
      gazeboId: f.gazeboId,
      date: f.date,
      start: f.start,
      end: f.end,
      clientName: f.clientName.trim(),
      phone: isBlock ? '' : f.phone.trim(),
      guests: isBlock ? 0 : f.guests,
      status: isBlock ? 'blocked' : f.status,
      extras: isBlock ? [] : f.extras,
      prepaid: isBlock ? 0 : f.status === 'paid' ? price.total : f.prepaid,
      total: isBlock ? 0 : price.total,
      comment: f.comment.trim(),
      source: f.source,
      manager: f.manager,
    }
    if (existing) {
      updateBooking(existing.id, base)
      toast(existing.dealId ? `Бронь сохранена · сделка #${existing.dealId} обновлена в Битрикс24` : 'Блокировка сохранена')
    } else {
      const b = addBooking(base)
      toast(b.dealId ? `Бронь создана · сделка #${b.dealId} появилась в Битрикс24` : 'Блокировка добавлена в календарь')
    }
    onClose()
  }

  const quickStatus = (s: BookingStatus) => {
    if (!existing) return
    setStatus(existing.id, s)
    patch({ status: s, prepaid: s === 'paid' ? price.total : f.prepaid })
    toast(
      s === 'paid'
        ? `Оплата ${fmtMoney(existing.total)} зафиксирована · сделка #${existing.dealId} → «Оплачено»`
        : `Бронь подтверждена · сделка #${existing.dealId} → «Подтверждена»`,
    )
  }
  const cancel = () => {
    if (!existing) return
    removeBooking(existing.id)
    toast(existing.dealId ? `Бронь отменена · сделка #${existing.dealId} → «Отменена»` : 'Блокировка снята')
    onClose()
  }

  const timeOpts = (filter: (h: number) => boolean) =>
    TIME_OPTIONS.filter(filter).map((h) => (
      <option key={h} value={h}>
        {fmtTime(h)}
      </option>
    ))

  return (
    <div className="flex flex-col">
      <div className="flex items-start gap-3 px-5 sm:px-7 pt-5 sm:pt-6 pb-4 border-b border-line/70">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[20px] sm:text-[22px] font-extrabold tracking-tight leading-none">
              {existing ? (isBlock ? 'Блокировка' : 'Бронь') : isBlock ? 'Новая блокировка' : 'Новая бронь'}
            </h2>
            {existing && !isBlock && <StatusBadge status={existing.status} />}
            {existing?.dealId && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f0fb] text-[#1d4f9a] px-2.5 py-1 text-[12px] font-semibold tabular-nums">
                <SquaresFour size={13} weight="fill" /> Сделка #{existing.dealId}
              </span>
            )}
          </div>
          <div className="text-[13px] text-muted mt-1.5">
            Беседка № {f.gazeboId} · {fmtDay(f.date)} · {fmtRange(f.start, f.end)}
            {hol && <span className="text-tent-ink"> · {hol}</span>}
          </div>
        </div>
        <button onClick={onClose} className="grid place-items-center h-9 w-9 rounded-xl hover:bg-white/80 text-muted hover:text-ink transition" aria-label="Закрыть">
          <X size={18} weight="bold" />
        </button>
      </div>

      <div className="grid md:grid-cols-[1fr_300px] gap-0">
        <div className="px-5 sm:px-7 py-5 flex flex-col gap-4">
          {!existing && (
            <Segmented<Kind>
              value={f.kind}
              onChange={(kind) => patch({ kind })}
              options={[
                { value: 'booking', label: 'Бронь клиента' },
                { value: 'block', label: 'Блокировка (ремонт)' },
              ]}
              className="self-start"
            />
          )}

          <div className="grid grid-cols-2 sm:grid-cols-[1.4fr_1fr] gap-3">
            <Field label="Беседка">
              <Select value={f.gazeboId} onChange={(e) => patch({ gazeboId: Number(e.target.value) })}>
                {GAZEBOS.map((x) => (
                  <option key={x.id} value={x.id}>
                    № {x.id} · {x.capacity} чел{x.tags[0] ? ` · ${x.tags[0]}` : ''}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Дата">
              <Input type="date" value={f.date} onChange={(e) => e.target.value && patch({ date: e.target.value })} />
            </Field>
          </div>

          <div className={cx('grid gap-3', isBlock ? 'grid-cols-2' : 'grid-cols-3')}>
            <Field label="С">
              <Select value={f.start} onChange={(e) => patch({ start: Number(e.target.value) })}>
                {timeOpts((h) => h < 24)}
              </Select>
            </Field>
            <Field label="До">
              <Select value={f.end} onChange={(e) => patch({ end: Number(e.target.value) })}>
                {timeOpts((h) => h > 8)}
              </Select>
            </Field>
            {!isBlock && (
              <Field label="Гостей">
                <Input
                  type="number"
                  min={1}
                  max={99}
                  value={f.guests}
                  onChange={(e) => patch({ guests: Math.max(0, Number(e.target.value)) })}
                  className={cx(overCap && 'border-amber ring-4 ring-amber/15')}
                />
              </Field>
            )}
          </div>

          <Field label={isBlock ? 'Причина блокировки' : 'Клиент'}>
            <Input
              value={f.clientName}
              onChange={(e) => patch({ clientName: e.target.value })}
              placeholder={isBlock ? 'Ремонт кровли, слив бассейна…' : 'Фамилия Имя Отчество или компания'}
              autoFocus={!existing}
              className={cx(touched && nameMissing && 'border-coral ring-4 ring-coral/15')}
            />
          </Field>

          {!isBlock && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Field label="Телефон">
                  <Input value={f.phone} onChange={(e) => patch({ phone: e.target.value })} placeholder="+7 912 000-00-00" inputMode="tel" />
                </Field>
                <Field label="Источник">
                  <Select value={f.source} onChange={(e) => patch({ source: e.target.value as Source })}>
                    {(Object.keys(SOURCE_LABEL) as Source[]).map((s) => (
                      <option key={s} value={s}>
                        {SOURCE_LABEL[s]}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Менеджер" className="col-span-2 sm:col-span-1">
                  <Select value={f.manager} onChange={(e) => patch({ manager: e.target.value })}>
                    {MANAGERS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              <Field label="Статус" hint="Статус = стадия сделки в Битрикс24">
                <Segmented<BookingStatus>
                  value={f.status}
                  onChange={(status) => patch({ status })}
                  options={[
                    { value: 'tentative', label: 'Предварительно' },
                    { value: 'booked', label: 'Бронь' },
                    { value: 'paid', label: 'Оплачено' },
                  ]}
                  className="self-start"
                />
              </Field>

              <Field label="Доп. услуги">
                <div className="flex flex-wrap gap-2">
                  {EXTRAS.map((e) => {
                    const on = f.extras.includes(e.id)
                    return (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => toggleExtra(e.id)}
                        className={cx(
                          'inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[13px] font-semibold border transition',
                          on ? 'bg-accent text-white border-accent shadow-soft' : 'bg-white/80 border-line text-ink-soft hover:bg-white',
                        )}
                      >
                        {on && <CheckCircle size={14} weight="fill" />}
                        {e.name}
                        <span className={cx('text-[11px] tabular-nums', on ? 'text-white/80' : 'text-muted')}>{fmtNum(e.price)} ₽</span>
                      </button>
                    )
                  })}
                </div>
              </Field>

              <div className="grid grid-cols-[150px_1fr] gap-3">
                <Field label="Предоплата, ₽">
                  <Input
                    type="number"
                    min={0}
                    step={500}
                    value={f.status === 'paid' ? price.total : f.prepaid}
                    disabled={f.status === 'paid'}
                    onChange={(e) => patch({ prepaid: Math.max(0, Number(e.target.value)) })}
                  />
                </Field>
                <Field label="Комментарий">
                  <Textarea value={f.comment} onChange={(e) => patch({ comment: e.target.value })} placeholder="ДР ребёнка, нужен холодильник для торта…" className="min-h-[44px] h-11" />
                </Field>
              </div>
            </>
          )}
          {isBlock && (
            <Field label="Комментарий">
              <Textarea value={f.comment} onChange={(e) => patch({ comment: e.target.value })} placeholder="Кто отвечает, когда закончат…" />
            </Field>
          )}
        </div>

        <aside className="md:border-l border-line/70 bg-white/40 px-5 sm:px-6 py-5 flex flex-col gap-4">
          <div>
            <div className="text-[11.5px] font-bold uppercase tracking-[.06em] text-muted">Беседка</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-[22px] font-extrabold tracking-tight">№ {g.id}</span>
              <span className="text-[13px] text-muted inline-flex items-center gap-1">
                <Users size={14} weight="fill" /> до {g.capacity} чел
              </span>
            </div>
            {g.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {g.tags.map((t) => (
                  <span key={t} className="rounded-md bg-accent-soft text-accent px-1.5 py-0.5 text-[11px] font-semibold">
                    {t}
                  </span>
                ))}
              </div>
            )}
            {g.note && <p className="text-[12px] text-muted mt-1.5 leading-snug">{g.note}</p>}
          </div>

          {!isBlock && (
            <div className="rounded-2xl bg-white/85 border border-white p-4 shadow-soft">
              <div className="flex items-center justify-between text-[12.5px] text-muted">
                <span>Тариф: {RATE_LABEL[price.type]}</span>
                <span className="tabular-nums">{fmtNum(price.rate)} ₽/ч</span>
              </div>
              <div className="flex items-center justify-between text-[13.5px] mt-2">
                <span>
                  {fmtNum(price.hours)} ч × {fmtNum(price.rate)} ₽
                </span>
                <span className="tabular-nums font-semibold">{fmtMoney(price.base)}</span>
              </div>
              {f.extras.map((id) => {
                const e = EXTRAS.find((x) => x.id === id)
                if (!e) return null
                return (
                  <div key={id} className="flex items-center justify-between text-[13px] mt-1 text-ink-soft">
                    <span>{e.name}</span>
                    <span className="tabular-nums">{fmtMoney(e.price)}</span>
                  </div>
                )
              })}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-line">
                <span className="font-bold inline-flex items-center gap-1.5">
                  <Coins size={16} weight="fill" className="text-accent" /> Итого
                </span>
                <span className="text-[22px] font-extrabold tabular-nums tracking-tight">{fmtMoney(price.total)}</span>
              </div>
              {f.status !== 'paid' && f.prepaid > 0 && (
                <div className="flex items-center justify-between text-[12.5px] text-muted mt-1">
                  <span>Предоплата {fmtMoney(f.prepaid)}</span>
                  <span className="tabular-nums">остаток {fmtMoney(Math.max(0, price.total - f.prepaid))}</span>
                </div>
              )}
              {f.status === 'paid' && <div className="text-[12.5px] text-paid-ink font-semibold mt-1">Оплачено полностью</div>}
            </div>
          )}

          <div className="flex flex-col gap-2">
            {badTime && <Note tone="bad">Время окончания должно быть позже начала.</Note>}
            {conflicts.map((c) => (
              <Note key={c.id} tone="bad">
                Пересекается: {fmtRange(c.start, c.end)} — {c.clientName}
                {g.turnover > 0 && ' (учтён перезаезд 1 ч)'}
              </Note>
            ))}
            {overCap && (
              <Note tone="warn">
                Гостей больше вместимости ({g.capacity}). Предложите № {suggestBigger(g.capacity, f.guests)}.
              </Note>
            )}
            {lateEnd && <Note tone="warn">Эта беседка бронируется только до {g.maxEnd}:00.</Note>}
            {touched && nameMissing && <Note tone="bad">Укажите клиента или причину.</Note>}
            {g.turnover > 0 && !badTime && conflicts.length === 0 && (
              <Note tone="info">Перезаезд 1 ч: следующая бронь возможна с {fmtTime(Math.min(24, f.end + g.turnover))}.</Note>
            )}
            {isPast && !existing && <Note tone="info">Дата в прошлом — бронь будет записана задним числом.</Note>}
          </div>

          <div className="mt-auto rounded-2xl bg-[#e8f0fb]/70 border border-[#d4e2f7] p-3.5 text-[12.5px] leading-snug text-[#1d4f9a]">
            {existing?.dealId ? (
              <>
                <div className="font-bold">Сделка #{existing.dealId} · стадия «{STATUS_META[existing.status].stage}»</div>
                <button
                  type="button"
                  onClick={() => toast('В демо переход в портал отключён — в боевой версии откроется карточка сделки')}
                  className="mt-1.5 inline-flex items-center gap-1 font-semibold hover:underline"
                >
                  Открыть в Битрикс24 <ArrowSquareOut size={14} weight="bold" />
                </button>
              </>
            ) : isBlock ? (
              <div>Блокировка видна в шахматке и не даёт поставить бронь. В сделки Битрикс24 не попадает.</div>
            ) : (
              <div>
                <b>При сохранении</b> в Битрикс24 создастся сделка в воронке «Бронирования» и контакт клиента.
              </div>
            )}
          </div>
        </aside>
      </div>

      <div className="flex flex-wrap items-center gap-2 px-5 sm:px-7 py-4 border-t border-line/70 bg-white/50 sticky bottom-0 backdrop-blur">
        {existing && !confirmCancel && (
          <Btn variant="danger" size="md" onClick={() => setConfirmCancel(true)}>
            {isBlock ? 'Снять блокировку' : 'Отменить бронь'}
          </Btn>
        )}
        {existing && confirmCancel && (
          <div className="inline-flex items-center gap-2 text-[13px]">
            <span className="text-ink-soft">Точно?</span>
            <Btn variant="danger" size="sm" onClick={cancel}>
              Да, {isBlock ? 'снять' : 'отменить'}
            </Btn>
            <Btn variant="ghost" size="sm" onClick={() => setConfirmCancel(false)}>
              Нет
            </Btn>
          </div>
        )}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {existing && existing.status === 'tentative' && (
            <Btn variant="soft" onClick={() => quickStatus('booked')}>
              <CheckCircle size={16} weight="fill" /> Подтвердить
            </Btn>
          )}
          {existing && existing.status === 'booked' && (
            <Btn variant="soft" onClick={() => quickStatus('paid')}>
              <Coins size={16} weight="fill" /> Оплачено
            </Btn>
          )}
          <Btn variant="ghost" onClick={onClose}>
            Закрыть
          </Btn>
          <Btn onClick={save} disabled={touched && !canSave}>
            {existing ? 'Сохранить' : isBlock ? 'Заблокировать' : 'Забронировать'}
          </Btn>
        </div>
      </div>
    </div>
  )
}

function suggestBigger(capacity: number, guests: number): string {
  const c = GAZEBOS.filter((x) => x.capacity >= guests && x.capacity > capacity).sort((a, b) => a.capacity - b.capacity)
  return c.length ? c.slice(0, 3).map((x) => x.id).join(', ') : '7 или 10'
}

function Note({ tone, children }: { tone: 'bad' | 'warn' | 'info'; children: React.ReactNode }) {
  const cls = {
    bad: 'bg-[#fdeaea] text-[#b3261e] border-[#f7c9c9]',
    warn: 'bg-tent text-tent-ink border-[#f3d9a8]',
    info: 'bg-[#eef2f7] text-ink-soft border-line',
  }[tone]
  const Icon = tone === 'info' ? Info : Warning
  return (
    <div className={cx('flex items-start gap-2 rounded-xl border px-3 py-2 text-[12.5px] leading-snug', cls)}>
      <Icon size={15} weight="fill" className="shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  )
}
