import { useCallback, useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { Topbar } from './components/Topbar'
import { Toasts, type Toast } from './components/Toasts'
import { BookingModal, type ModalState } from './components/BookingModal'
import { MonthGrid } from './views/MonthGrid'
import { DayTimeline } from './views/DayTimeline'
import { BookingsList } from './views/BookingsList'
import { Tariffs } from './views/Tariffs'
import { Integration } from './views/Integration'
import { TODAY } from './lib/date'
import { useStore } from './store'
import type { Booking, View } from './types'

export default function App() {
  const [view, setView] = useState<View>('month')
  const [cursor, setCursor] = useState(TODAY)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<ModalState>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const reset = useStore((s) => s.reset)

  const toast = useCallback((text: string) => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, text }])
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200)
  }, [])

  const openNew = (preset: Partial<Booking> = {}) =>
    setModal({ mode: 'new', preset: { date: view === 'day' ? cursor : cursor.slice(0, 7) === TODAY.slice(0, 7) ? TODAY : cursor, ...preset } })
  const openBooking = (id: string) => setModal({ mode: 'edit', id })
  const goDay = (date: string) => {
    setCursor(date)
    setView('day')
  }

  return (
    <div className="min-h-screen flex">
      <div className="mesh" />
      <Sidebar
        view={view}
        setView={setView}
        onReset={() => {
          reset()
          toast('Демо-данные сброшены к исходному состоянию')
        }}
      />
      <main className="flex-1 min-w-0 flex flex-col px-4 lg:px-7 py-4 lg:py-5 pb-28 lg:pb-8">
        <Topbar view={view} cursor={cursor} setCursor={setCursor} search={search} setSearch={setSearch} onNew={() => openNew()} />
        <div className="mt-5" key={view}>
          {view === 'month' && <MonthGrid cursor={cursor} search={search} onOpen={openBooking} onNew={openNew} onDay={goDay} />}
          {view === 'day' && <DayTimeline date={cursor} search={search} onOpen={openBooking} onNew={openNew} />}
          {view === 'list' && <BookingsList search={search} onOpen={openBooking} />}
          {view === 'tariffs' && <Tariffs />}
          {view === 'b24' && <Integration />}
        </div>
      </main>
      <BookingModal state={modal} onClose={() => setModal(null)} toast={toast} />
      <Toasts items={toasts} />
    </div>
  )
}
