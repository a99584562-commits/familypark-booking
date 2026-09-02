import { CheckCircle } from '@phosphor-icons/react'

export interface Toast {
  id: number
  text: string
}

export function Toasts({ items }: { items: Toast[] }) {
  if (!items.length) return null
  return (
    <div className="fixed z-[60] bottom-24 lg:bottom-6 right-4 lg:right-6 flex flex-col gap-2 max-w-[92vw] sm:max-w-md">
      {items.map((t) => (
        <div key={t.id} className="glass-strong rounded-2xl px-4 py-3 flex items-start gap-3 anim-toast">
          <CheckCircle size={20} weight="fill" className="text-accent shrink-0 mt-0.5" />
          <div className="text-[13.5px] font-medium leading-snug">{t.text}</div>
        </div>
      ))}
    </div>
  )
}
