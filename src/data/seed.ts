import type { Booking, BookingStatus, Source, SyncEvent } from '../types'
import { MANAGERS, SOURCE_LABEL } from '../types'
import { GAZEBOS } from './gazebos'
import { TODAY, addDays, parseISO, rateType, fmtDay, fmtRange } from '../lib/date'
import { priceOf, findConflicts } from '../lib/pricing'

// Детерминированный генератор: у всех, кто открывает демо, одинаковая картина вокруг «сегодня».
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Имена вымышленные.
const SURNAMES = [
  'Ковалёв', 'Смирнов', 'Лебедев', 'Морозов', 'Зайцев', 'Соколов', 'Павлов', 'Орлов', 'Фролов', 'Егоров',
  'Тимофеев', 'Беляев', 'Громов', 'Ильин', 'Кузнецов', 'Волков', 'Романов', 'Захаров', 'Макаров', 'Носов',
  'Данилов', 'Тихонов', 'Абрамов', 'Ефимов', 'Яковлев', 'Комаров', 'Мельников', 'Крылов', 'Сорокин', 'Гусев',
  'Пономарёв', 'Осипов', 'Жуков', 'Максимов', 'Филиппов', 'Богданов', 'Воробьёв', 'Куликов', 'Исаев', 'Титов',
  'Гаврилов', 'Кириллов', 'Русаков', 'Щукин', 'Шарипов', 'Галимов', 'Мустафин', 'Гареев', 'Ахметов', 'Валиев',
  'Нуриев', 'Сафин', 'Чирков', 'Перевощиков', 'Вахрушев', 'Байков', 'Наговицын', 'Широбоков',
]
const NAMES_M = [
  'Александр', 'Дмитрий', 'Максим', 'Сергей', 'Андрей', 'Алексей', 'Артём', 'Илья', 'Кирилл', 'Михаил',
  'Никита', 'Матвей', 'Роман', 'Егор', 'Иван', 'Денис', 'Евгений', 'Даниил', 'Тимур', 'Владислав',
  'Игорь', 'Владимир', 'Павел', 'Руслан', 'Марат', 'Ринат', 'Айрат', 'Ильдар',
]
const NAMES_F = [
  'Анна', 'Мария', 'Елена', 'Ольга', 'Наталья', 'Екатерина', 'Татьяна', 'Ирина', 'Светлана', 'Юлия',
  'Дарья', 'Алина', 'Ксения', 'Полина', 'Виктория', 'Анастасия', 'Марина', 'Людмила', 'Оксана', 'Вероника',
  'Гульнара', 'Алсу', 'Эльвира', 'Регина', 'Лилия', 'Диана',
]
const PATR_M = [
  'Александрович', 'Сергеевич', 'Андреевич', 'Алексеевич', 'Дмитриевич', 'Николаевич', 'Владимирович',
  'Игоревич', 'Олегович', 'Павлович', 'Русланович', 'Маратович', 'Ринатович', 'Ильдарович',
]
const PATR_F = PATR_M.map((p) => p.slice(0, -2) + 'на')
const COMPANIES = [
  'ООО «Родник»', 'ИП Семёнова', 'Компания «Вектор»', 'Студия «Бриз»', 'ООО «Уралпром»', 'Школа №27, 4 «Б»',
  'Детский сад «Радуга»', 'Клуб «Горизонт»', 'ООО «СтройМастер»', 'Салон «Аврора»', 'Команда «Спартак-Юниор»',
]
const COMMENTS = [
  'ДР ребёнка, 7 лет', 'Юбилей 50 лет', 'Корпоратив отдела', 'Нужен холодильник для торта', 'Скидка ДР −10%',
  'Просили стулья +5', 'Придут с собакой', 'Позвонить за день — подтвердить', 'Оплатят на месте',
  'Хотят бассейн, уточнить температуру', 'Свадьба, второй день', 'Выпускной 9 класс', 'Будут с аниматором своим',
  'Просили место для мангала поближе', 'Постоянные гости, 4-й раз',
]
const PHONE_CODES = ['912', '950', '951', '982', '919', '904', '963']

const WEEKEND_SLOTS: [number, number][] = [
  [10, 13], [10, 14], [11, 15], [12, 16], [13, 17], [14, 18], [15, 19], [16, 20], [17, 22], [18, 22], [18, 23], [19, 23], [19, 24],
]
const WEEKDAY_SLOTS: [number, number][] = [[11, 14], [12, 16], [13, 17], [15, 19], [17, 21], [18, 22], [19, 23]]

function daysBetween(a: string, b: string): number {
  return Math.round((parseISO(b).getTime() - parseISO(a).getTime()) / 86400000)
}

export interface SeedResult {
  bookings: Booking[]
  log: SyncEvent[]
  nextDeal: number
}

export function generateSeed(): SeedResult {
  const rand = mulberry32(20260902)
  const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)]
  const chance = (p: number) => rand() < p

  const genName = (): string => {
    if (rand() < 0.06) return pick(COMPANIES)
    const female = rand() < 0.62
    const sur = pick(SURNAMES) + (female ? 'а' : '')
    const name = female ? pick(NAMES_F) : pick(NAMES_M)
    const patr = female ? pick(PATR_F) : pick(PATR_M)
    const f = rand()
    if (f < 0.55) return `${sur} ${name} ${patr}`
    if (f < 0.9) return `${sur} ${name}`
    return name
  }
  const d1 = () => Math.floor(rand() * 10)
  const genPhone = (): string => `+7 ${pick(PHONE_CODES)} ${d1()}${d1()}${d1()}-${d1()}${d1()}-${d1()}${d1()}`
  const genSource = (): Source => {
    const r = rand()
    if (r < 0.45) return 'phone'
    if (r < 0.67) return 'whatsapp'
    if (r < 0.77) return 'vk'
    if (r < 0.9) return 'site'
    return 'walkin'
  }
  const genStatus = (date: string): BookingStatus => {
    const r = rand()
    if (date < TODAY) return r < 0.9 ? 'paid' : 'booked'
    const horizon = daysBetween(TODAY, date)
    if (horizon <= 14) return r < 0.45 ? 'paid' : r < 0.9 ? 'booked' : 'tentative'
    return r < 0.15 ? 'paid' : r < 0.7 ? 'booked' : 'tentative'
  }

  const bookings: Booking[] = []
  let n = 0
  const from = addDays(TODAY, -35)
  const to = addDays(TODAY, 95)

  for (let d = from; d <= to; d = addDays(d, 1)) {
    const rt = rateType(d)
    const weekend = rt !== 'weekday'
    const month = parseISO(d).getMonth() + 1
    for (const g of GAZEBOS) {
      const big = g.capacity >= 25
      const p = rt === 'holiday' ? 0.88 : weekend ? (big ? 0.8 : 0.68) : big ? 0.26 : 0.17
      if (!chance(p)) continue
      const slots = weekend ? WEEKEND_SLOTS : WEEKDAY_SLOTS
      const count = weekend ? (chance(0.5) ? 2 : 1) : 1
      for (let i = 0; i < count; i++) {
        const [start, end] = pick(slots)
        if (g.maxEnd !== undefined && end > g.maxEnd) continue
        const cand = { gazeboId: g.id, date: d, start, end }
        if (findConflicts(bookings, cand).length) continue
        const status = genStatus(d)
        const guests = Math.max(4, Math.round(g.capacity * (0.5 + rand() * 0.5)))
        const extras: string[] = []
        if (chance(0.3)) extras.push('mangal')
        if (chance(0.12)) extras.push('anim')
        if (guests >= 8 && chance(0.08)) extras.push('laser')
        if (g.id === 12 && ![6, 7, 8].includes(month) && chance(0.4)) extras.push('kupel')
        if (big && chance(0.15)) extras.push('proj')
        const { total } = priceOf(g.id, d, start, end, extras)
        const prepaid =
          status === 'paid' ? total : status === 'booked' ? Math.round((total * (0.3 + rand() * 0.2)) / 500) * 500 : 0
        const createdDay = addDays(d, -Math.floor(2 + rand() * 40))
        const cd = parseISO(createdDay > TODAY ? TODAY : createdDay)
        cd.setHours(9 + Math.floor(rand() * 12), Math.floor(rand() * 60))
        bookings.push({
          id: `s${n++}`,
          gazeboId: g.id,
          date: d,
          start,
          end,
          clientName: genName(),
          phone: genPhone(),
          guests,
          status,
          extras,
          prepaid,
          total,
          comment: chance(0.3) ? pick(COMMENTS) : '',
          source: genSource(),
          manager: pick(MANAGERS),
          createdAt: cd.toISOString(),
        })
      }
    }
  }

  // Блокировки (ремонт, слив бассейна) — как в таблице клиента.
  const blocks = [
    { gazeboId: 4, dates: [addDays(TODAY, 6), addDays(TODAY, 7), addDays(TODAY, 8)], reason: 'Ремонт кровли' },
    { gazeboId: 12, dates: [addDays(TODAY, 3)], reason: 'Слив бассейна — не бронировать' },
    { gazeboId: 17, dates: [addDays(TODAY, -1), TODAY], reason: 'Покраска пола' },
  ]
  let filtered = bookings
  for (const bl of blocks) {
    filtered = filtered.filter((b) => !(b.gazeboId === bl.gazeboId && bl.dates.includes(b.date)))
    for (const date of bl.dates) {
      filtered.push({
        id: `s${n++}`,
        gazeboId: bl.gazeboId,
        date,
        start: 8,
        end: 24,
        clientName: bl.reason,
        phone: '',
        guests: 0,
        status: 'blocked',
        extras: [],
        prepaid: 0,
        total: 0,
        comment: '',
        source: 'walkin',
        manager: MANAGERS[2],
        createdAt: new Date(parseISO(addDays(TODAY, -3)).setHours(10, 15)).toISOString(),
      })
    }
  }

  // Номера сделок Битрикс24 — по порядку создания.
  const sorted = [...filtered].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  let deal = 4100
  for (const b of sorted) if (b.status !== 'blocked') b.dealId = deal++

  const recent = sorted.filter((b) => b.status !== 'blocked').slice(-9).reverse()
  const log: SyncEvent[] = recent.map((b, i) => ({
    id: `l${i}`,
    at: b.createdAt,
    kind: 'create',
    dealId: b.dealId,
    text: `Сделка #${b.dealId} создана (${SOURCE_LABEL[b.source]}) → бронь №${b.gazeboId}, ${fmtDay(b.date)} ${fmtRange(b.start, b.end)} — ${b.clientName}`,
  }))
  log.push({
    id: 'l-init',
    at: new Date(parseISO(addDays(TODAY, -1)).setHours(8, 0)).toISOString(),
    kind: 'info',
    text: 'Синхронизация с Битрикс24: воронка «Бронирования», 23 беседки, тарифы 2026 загружены',
  })

  return { bookings: filtered, log, nextDeal: deal }
}
