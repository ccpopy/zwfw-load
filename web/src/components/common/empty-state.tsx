import type { LucideIcon } from "lucide-react"

export function EmptyState({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="flex min-h-44 flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border/70 bg-muted/20 text-muted-foreground">
      <Icon className="size-6 opacity-50" />
      <div className="text-sm">{text}</div>
    </div>
  )
}
