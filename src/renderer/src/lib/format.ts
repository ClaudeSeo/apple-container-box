/**
 * 바이트 단위를 사람이 읽기 쉬운 형식으로 변환
 * @example formatBytes(1024) => "1.00 KB"
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const value = parseFloat((bytes / Math.pow(k, i)).toFixed(dm))

  return `${value} ${sizes[i]}`
}

/**
 * 초 단위를 사람이 읽기 쉬운 업타임 형식으로 변환
 * @example formatUptime(3661) => "1h 1m 1s"
 */
export function formatUptime(seconds: number): string {
  if (seconds < 0) return '0s'

  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  const parts: string[] = []
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`)

  return parts.join(' ')
}

/**
 * ISO 날짜 문자열을 상대적 시간으로 변환
 * @example formatRelativeTime('2024-01-01T00:00:00Z') => "2 months ago"
 */
export function formatRelativeTime(isoDate: string): string {
  if (!isoDate) return '-'
  const date = new Date(isoDate)
  if (isNaN(date.getTime())) return '-'
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)

  if (diffSecs < 60) return 'just now'
  if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`
  if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h ago`
  if (diffSecs < 2592000) return `${Math.floor(diffSecs / 86400)}d ago`
  if (diffSecs < 31536000) return `${Math.floor(diffSecs / 2592000)}mo ago`
  return `${Math.floor(diffSecs / 31536000)}y ago`
}

/**
 * ISO 날짜 문자열을 로컬 날짜/시간 형식으로 변환
 * @example formatDateTime('2024-01-01T00:00:00Z') => "2024-01-01 09:00:00"
 */
export function formatDateTime(isoDate: string): string {
  const date = new Date(isoDate)
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(/\. /g, '-').replace('.', '')
}

/**
 * 퍼센트 값 포맷팅
 * @example formatPercent(0.456) => "45.6%"
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`
}

/**
 * 컨테이너 ID를 짧은 형식으로 변환 (12자)
 * @example truncateId('abc123def456ghi789') => "abc123def456"
 */
export function truncateId(id: string, length = 12): string {
  return id.slice(0, length)
}
