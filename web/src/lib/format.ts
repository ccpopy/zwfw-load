export function formatDate(input?: string | null) {
  if (!input) return "-"
  const date = parseAppDate(input)
  if (Number.isNaN(date.getTime())) return input
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export function formatHour(input: string) {
  const date = parseAppDate(input)
  if (Number.isNaN(date.getTime())) return input.slice(-5)
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) return `${hours}小时${minutes}分`
  return `${minutes}分`
}

export function truncateLabel(value: string) {
  return value.length > 8 ? `${value.slice(0, 8)}…` : value
}

export function paginationPages(page: number, totalPages: number) {
  const start = Math.max(1, Math.min(page - 1, totalPages - 2))
  return Array.from({ length: Math.min(3, totalPages) }, (_, index) => start + index)
}

function parseAppDate(input: string) {
  const normalized = input.trim()
  const hasExplicitTimezone = /(?:z|[+-]\d{2}:?\d{2})$/i.test(normalized)
  const isoLike = normalized.includes("T")
    ? normalized
    : normalized.replace(" ", "T")

  return new Date(hasExplicitTimezone ? isoLike : `${isoLike}Z`)
}
