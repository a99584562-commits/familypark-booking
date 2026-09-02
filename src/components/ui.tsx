import { useEffect } from 'react'
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'
import { createPortal } from 'react-dom'
import { CaretDown } from '@phosphor-icons/react'
import type { BookingStatus } from '../types'
import { STATUS_META } from '../types'

export function cx(...a: Array<string | false | null | undefined>): string {
  return a.filter(Boolean).join(' ')
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'soft' | 'ghost' | 'outline' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}
export function Btn({ variant = 'primary', size = 'md', className, type = 'button', ...p }: BtnProps) {
  const base =
    'inline-flex items-center justify-center gap-2 font-semibold rounded-2xl transition-all duration-200 active:scale-[.98] disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap select-none'
  const sizes = { sm: 'h-9 px-3.5 text-[13px]', md: 'h-11 px-5 text-sm', lg: 'h-12 px-6 text-[15px]' }
  const variants = {
    primary:
      'grad-accent text-white shadow-[0_10px_22px_-10px_rgba(31,138,76,.75),inset_0_1px_0_rgba(255,255,255,.35)] hover:brightness-105 hover:-translate-y-px',
    soft: 'bg-accent-soft text-accent hover:bg-[#d3eddc]',
    ghost: 'bg-transparent text-ink-soft hover:bg-white/70',
    outline: 'bg-white/70 border border-line text-ink hover:bg-white shadow-[0_1px_0_rgba(255,255,255,.9)_inset]',
    danger: 'bg-[#fdeaea] text-[#b3261e] hover:bg-[#fbdcdc]',
  }
  return <button type={type} className={cx(base, sizes[size], variants[variant], className)} {...p} />
}

export function IconBtn({ className, type = 'button', ...p }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={cx(
        'inline-grid place-items-center h-10 w-10 rounded-xl bg-white/70 border border-line text-ink-soft hover:bg-white hover:text-ink transition active:scale-95 disabled:opacity-40',
        className,
      )}
      {...p}
    />
  )
}

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: ReactNode
  hint?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <label className={cx('flex flex-col gap-1.5 min-w-0', className)}>
      <span className="text-[11.5px] font-bold uppercase tracking-[.06em] text-muted">{label}</span>
      {children}
      {hint && <span className="text-[12px] text-muted leading-snug">{hint}</span>}
    </label>
  )
}

const inputCls =
  'h-11 w-full rounded-2xl bg-white/85 border border-line px-3.5 text-sm text-ink outline-none transition shadow-[0_1px_0_rgba(255,255,255,.9)_inset] focus:border-accent focus:ring-4 focus:ring-accent/15 placeholder:text-muted/70 disabled:opacity-60'

export function Input({ className, ...p }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx(inputCls, className)} {...p} />
}
export function Select({ className, children, ...p }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className="relative block min-w-0">
      <select className={cx(inputCls, 'appearance-none pr-9 cursor-pointer', className)} {...p}>
        {children}
      </select>
      <CaretDown size={14} weight="bold" className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted" />
    </span>
  )
}
export function Textarea({ className, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx(inputCls, 'h-auto min-h-[84px] py-2.5 resize-y', className)} {...p} />
}

export function Modal({
  open,
  onClose,
  children,
  width = 'max-w-4xl',
}: {
  open: boolean
  onClose: () => void
  children: ReactNode
  width?: string
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6">
      <div className="absolute inset-0 bg-[#10231a]/35 backdrop-blur-sm anim-fade-in" onMouseDown={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className={cx(
          'relative w-full glass-strong rounded-t-[28px] sm:rounded-[28px] anim-pop max-h-[94vh] sm:max-h-[90vh] overflow-y-auto scrollbar-thin',
          width,
        )}
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}

export function StatusBadge({ status, className }: { status: BookingStatus; className?: string }) {
  const m = STATUS_META[status]
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold', m.cls, className)}>
      <span className={cx('h-1.5 w-1.5 rounded-full', m.dot)} />
      {m.label}
    </span>
  )
}

export function Tile({
  icon,
  label,
  value,
  sub,
}: {
  icon?: ReactNode
  label: string
  value: ReactNode
  sub?: ReactNode
}) {
  return (
    <div className="glass rounded-3xl px-4 py-3 flex items-center gap-3.5 min-w-0">
      {icon && (
        <div className="grid place-items-center h-10 w-10 rounded-2xl grad-accent text-white shadow-soft shrink-0">{icon}</div>
      )}
      <div className="min-w-0">
        <div className="text-[11.5px] font-bold uppercase tracking-[.06em] text-muted">{label}</div>
        <div className="text-[20px] font-extrabold leading-tight tabular-nums truncate">{value}</div>
        {sub && <div className="text-[12px] text-muted mt-0.5 truncate">{sub}</div>}
      </div>
    </div>
  )
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: ReactNode }[]
  className?: string
}) {
  return (
    <div className={cx('inline-flex rounded-2xl bg-white/60 border border-line p-1 gap-1', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cx(
            'h-9 px-3.5 rounded-xl text-[13px] font-semibold transition whitespace-nowrap',
            value === o.value ? 'bg-white shadow-soft text-ink' : 'text-muted hover:text-ink',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function SectionTitle({ children, sub, className }: { children: ReactNode; sub?: ReactNode; className?: string }) {
  return (
    <div className={cx('flex flex-col gap-1', className)}>
      <h2 className="text-xl font-extrabold tracking-tight">{children}</h2>
      {sub && <p className="text-sm text-muted max-w-3xl leading-relaxed">{sub}</p>}
    </div>
  )
}
