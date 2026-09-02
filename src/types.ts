export type BookingStatus = 'tentative' | 'booked' | 'paid' | 'blocked'
export type Source = 'phone' | 'whatsapp' | 'vk' | 'site' | 'walkin'

export interface Booking {
  id: string
  gazeboId: number
  date: string // YYYY-MM-DD
  start: number // hour, 0.5 step (16.5 = 16:30)
  end: number
  clientName: string // for 'blocked' — reason (e.g. "Ремонт кровли")
  phone: string
  guests: number
  status: BookingStatus
  extras: string[]
  prepaid: number
  total: number
  comment: string
  dealId?: number // Bitrix24 deal id (mock)
  source: Source
  manager: string
  createdAt: string
}

export interface SyncEvent {
  id: string
  at: string
  kind: 'create' | 'update' | 'status' | 'payment' | 'cancel' | 'info'
  text: string
  dealId?: number
}

export const STATUS_META: Record<
  BookingStatus,
  { label: string; stage: string; cls: string; dot: string }
> = {
  tentative: { label: 'Предварительно', stage: 'Новая бронь', cls: 'bg-tent text-tent-ink', dot: 'bg-amber' },
  booked: { label: 'Бронь', stage: 'Подтверждена', cls: 'bg-booked text-booked-ink', dot: 'bg-[#3b78d8]' },
  paid: { label: 'Оплачено', stage: 'Оплачено', cls: 'bg-paid text-paid-ink', dot: 'bg-accent' },
  blocked: { label: 'Ремонт / блок', stage: '—', cls: 'bg-block text-block-ink hatch', dot: 'bg-block-ink' },
}

export const SOURCE_LABEL: Record<Source, string> = {
  phone: 'Телефон',
  whatsapp: 'WhatsApp',
  vk: 'ВКонтакте',
  site: 'Сайт',
  walkin: 'На месте',
}

export const MANAGERS = ['Мария К.', 'Светлана Р.', 'Дмитрий В.']

export type View = 'month' | 'day' | 'list' | 'tariffs' | 'b24'
