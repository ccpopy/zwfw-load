import { Loader2, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ConnectionBadge } from "@/components/common/status-badge"

export function AppHeader({
  title,
  connectionState,
  loading,
  onRefresh,
}: {
  title: string
  connectionState: "online" | "offline" | "connecting"
  loading: boolean
  onRefresh: () => void
}) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b bg-card/70 px-4 backdrop-blur-sm">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="h-5" />
        <h1 className="truncate text-sm font-semibold tracking-tight">{title}</h1>
        <Separator orientation="vertical" className="hidden h-5 sm:block" />
        <span className="hidden sm:inline-flex">
          <ConnectionBadge state={connectionState} />
        </span>
      </div>
      <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
        {loading ? <Loader2 className="animate-spin" /> : <RefreshCw />}
        刷新
      </Button>
    </header>
  )
}
