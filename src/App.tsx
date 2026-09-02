import { useCallback, useEffect, useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { Topbar } from './components/Topbar'
import { Toasts, type Toast } from './components/Toasts'
import { BookingModal, type ModalState } from './components/BookingModal'
import { cx } from './components/ui'
import { MonthGrid } from './views/MonthGrid'
import { DayTimeline } from './views/DayTimeline'
import { BookingsList } from './views/BookingsList'
import { Tariffs } from './views/Tariffs'
import { Integration } from './views/Integration'
import { TODAY } from './lib/date'
import { useStore } from './store'
import type { Booking, View } from './types'

const SIDEBAR_KEY = 'fp-sidebar-collapsed'

export default function App() {
  const [view, setView] = useState<View>('month')
  const [cursor, setCursor] = useState(TODAY)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<ModalState>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_KEY) === '1'
    } catch {
      return false
    }
  })
  const [fs, setFs] = useState(false)
  const reset = useStore((s) => s.reset)

  const toast = useCallback((text: string) => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, text }])
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200)
  }, [])

  const toggleSidebar = () =>
    setCollapsed((c) => {
      try {
        localStorage.setItem(SIDEBAR_KEY, c ? '0' : '1')
      } catch {
        /* storage unavailable */
      }
      return !c
    })

  const enterFs = () => {
    setFs(true)
    try {
      const p = document.documentElement.requestFullscreen?.()
      if (p && typeof p.catch === 'function') p.catch(() => {})
    } catch {
      /* fullscreen API unavailable — overlay mode still works */
    }
  }
  const exitFs = useCallback(() => {
    setFs(false)
    try {
      if (document.fullscreenElement) {
        const p = document.exitFullscreen?.()
        if (p && typeof p.catch === 'function') p.catch(() => {})
      }
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    const onChange = () => {
      if (!document.fullscreenElement) setFs(false)
    }
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  useEffect(() => {
    if (!fs) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !modal) exitFs()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [fs, modal, exitFs])

  const openNew = (preset: Partial<Booking> = {}) =>
    setModal({
      mode: 'new',
      preset: { date: view === 'day' ? cursor : cursor.slice(0, 7) === TODAY.slice(0, 7) ? TODAY : cursor, ...preset },
    })
  const openBooking = (id: string) => setModal({ mode: 'edit', id })
  const goDay = (date: string) => {
    setCursor(date)
    setView('day')
  }

  return (
    <div className="min-h-screen flex">
      <div className="mesh" />
      {!fs && (
        <Sidebar
          view={view}
          setView={setView}
          collapsed={collapsed}
          onToggle={toggleSidebar}
          onReset={() => {
            reset()
            toast('Демо-данные сброшены к исходному состоянию')
          }}
        />
      )}
      <main
        className={cx(
          'flex-1 min-w-0 flex flex-col',
          fs ? 'h-screen px-3 py-2 gap-2 overflow-hidden' : 'px-4 lg:px-7 py-4 lg:py-5 pb-28 lg:pb-8',
        )}
      >
        <Topbar
          view={view}
          cursor={cursor}
          setCursor={setCursor}
          search={search}
          setSearch={setSearch}
          onNew={() => openNew()}
          fullscreen={fs}
          onToggleFullscreen={fs ? exitFs : enterFs}
        />
        <div className={cx(fs ? 'flex-1 min-h-0' : 'mt-5')} key={view}>
          {view === 'month' && (
            <MonthGrid cursor={cursor} search={search} onOpen={openBooking} onNew={openNew} onDay={goDay} fullscreen={fs} />
          )}
          {view === 'day' && <DayTimeline date={cursor} search={search} onOpen={openBooking} onNew={openNew} fullscreen={fs} />}
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
