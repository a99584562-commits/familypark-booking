export type RateType = 'weekday' | 'weekend' | 'holiday'

export interface Gazebo {
  id: number
  capacity: number
  rates: Record<RateType, number> // ₽ / час
  tags: string[]
  turnover: number // перезаезд, часов между бронями
  note?: string
  maxEnd?: number // последний час брони (рыбалка — до 23:00)
}

const G = (
  id: number,
  capacity: number,
  weekday: number,
  weekend: number,
  holiday: number,
  extra: Partial<Omit<Gazebo, 'id' | 'capacity' | 'rates'>> = {},
): Gazebo => ({
  id,
  capacity,
  rates: { weekday, weekend, holiday },
  tags: [],
  turnover: 0,
  ...extra,
})

// Из листа «Тарифы 2026» и шапки шахматки клиента. №13 и №22 отсутствуют — как в таблице.
export const GAZEBOS: Gazebo[] = [
  G(1, 20, 1700, 2200, 2400),
  G(2, 15, 1500, 1900, 2100),
  G(3, 20, 1700, 2200, 2400),
  G(4, 15, 1500, 1900, 2100),
  G(5, 20, 1700, 2200, 2400),
  G(6, 20, 2100, 2300, 2500),
  G(7, 35, 2800, 3100, 3400, { tags: ['банкетная'] }),
  G(8, 15, 2100, 2300, 2500),
  G(9, 20, 2100, 2300, 2500),
  G(10, 40, 3800, 4100, 4600, { tags: ['банкетная'] }),
  G(11, 20, 2100, 2300, 2500),
  G(12, 25, 3800, 4100, 4500, {
    tags: ['бассейн + сауна', 'купель'],
    turnover: 1,
    note: 'Купель летом не топим. Перезаезд — 1 час.',
  }),
  G(14, 20, 2100, 2300, 2500),
  G(15, 15, 1500, 1700, 1900),
  G(16, 15, 1500, 1700, 1900),
  G(17, 15, 2300, 2500, 2700),
  G(18, 15, 2300, 2500, 2700),
  G(19, 20, 2500, 2800, 3000),
  G(20, 20, 2800, 3100, 3400, { turnover: 1, note: 'Перезаезд — 1 час.' }),
  G(21, 20, 2800, 3100, 3400, { turnover: 1, note: 'Перезаезд — 1 час.' }),
  G(23, 12, 1500, 1700, 1900, { tags: ['рыбалка'], maxEnd: 23, note: 'Бронирование только до 23:00. На ночь не селим.' }),
  G(24, 25, 2500, 2800, 3000, {
    tags: ['рыбалка'],
    turnover: 1,
    maxEnd: 23,
    note: 'Перезаезд — 1 час. Бронирование только до 23:00.',
  }),
  G(25, 12, 1500, 1700, 1900, { tags: ['рыбалка'], maxEnd: 23, note: 'Бронирование только до 23:00. На ночь не селим.' }),
]

export const GAZEBO_BY_ID: Record<number, Gazebo> = Object.fromEntries(GAZEBOS.map((g) => [g.id, g]))

export interface Extra {
  id: string
  name: string
  price: number
  unit: string
}

// Доп. услуги — цены в демо условные.
export const EXTRAS: Extra[] = [
  { id: 'mangal', name: 'Мангал + уголь', price: 500, unit: 'разово' },
  { id: 'anim', name: 'Аниматор', price: 3500, unit: 'час' },
  { id: 'laser', name: 'Лазертаг', price: 6000, unit: 'игра' },
  { id: 'kupel', name: 'Купель', price: 3000, unit: 'разово' },
  { id: 'proj', name: 'Проектор + экран', price: 1500, unit: 'разово' },
]
export const EXTRA_BY_ID: Record<string, Extra> = Object.fromEntries(EXTRAS.map((e) => [e.id, e]))

export interface Holiday {
  from: string
  to: string
  name: string
}

// Праздничные дни — из листа «Тарифы 2026» (+ новогодние).
export const HOLIDAYS: Holiday[] = [
  { from: '2026-01-01', to: '2026-01-08', name: 'Новогодние каникулы' },
  { from: '2026-02-20', to: '2026-02-22', name: 'День защитника Отечества' },
  { from: '2026-03-06', to: '2026-03-08', name: '8 Марта' },
  { from: '2026-05-01', to: '2026-05-03', name: 'Майские' },
  { from: '2026-05-08', to: '2026-05-09', name: 'День Победы' },
  { from: '2026-06-11', to: '2026-06-13', name: 'День России · День медика' },
  { from: '2026-07-24', to: '2026-07-25', name: 'День торговли' },
  { from: '2026-08-08', to: '2026-08-09', name: 'День строителя' },
  { from: '2026-09-05', to: '2026-09-06', name: 'Арбузники' },
  { from: '2026-09-12', to: '2026-09-13', name: 'Арбузники' },
  { from: '2026-12-31', to: '2027-01-08', name: 'Новогодние каникулы' },
  { from: '2027-02-20', to: '2027-02-23', name: 'День защитника Отечества' },
  { from: '2027-03-06', to: '2027-03-08', name: '8 Марта' },
]

export interface GradPackage {
  gazeboId: number
  p1: number
  p2: number
  p3: number
}

// «Тарифы выпускн 2026»: пакеты на 2 / 2 / 2,5 часа, период 21–31 мая.
export const GRAD_PACKAGES: GradPackage[] = [
  { gazeboId: 7, p1: 37000, p2: 42000, p3: 50000 },
  { gazeboId: 10, p1: 42000, p2: 48000, p3: 55000 },
  { gazeboId: 20, p1: 37000, p2: 42000, p3: 50000 },
  { gazeboId: 21, p1: 37000, p2: 42000, p3: 50000 },
  { gazeboId: 14, p1: 35000, p2: 40000, p3: 47000 },
]
