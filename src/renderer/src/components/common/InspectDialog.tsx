/**
 * 공용 Inspect Dialog 컴포넌트
 * - JSON 형식으로 리소스 상세 정보 표시
 * - 민감한 정보 마스킹
 */

import { useState, useMemo } from 'react'
import { Copy, Check, ChevronRight, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

interface InspectDialogProps {
  title: string
  data: unknown
  open: boolean
  onOpenChange: (open: boolean) => void
}

const SENSITIVE_KEYS = ['password', 'secret', 'token', 'key', 'credential', 'auth']

function maskSensitiveData(obj: unknown): unknown {
  if (typeof obj !== 'object' || obj === null) return obj
  if (Array.isArray(obj)) return obj.map(maskSensitiveData)
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const isSensitive = SENSITIVE_KEYS.some((k) => key.toLowerCase().includes(k))
    if (isSensitive && typeof value === 'string') {
      result[key] = '********'
    } else {
      result[key] = maskSensitiveData(value)
    }
  }
  return result
}

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }

function JsonTree({ data, level = 0 }: { data: JsonValue; level?: number }): JSX.Element {
  if (data === null) return <span className="text-muted-foreground">null</span>
  if (typeof data === 'boolean') return <span className="text-yellow-500">{String(data)}</span>
  if (typeof data === 'number') return <span className="text-cyan-400">{data}</span>
  if (typeof data === 'string') return <span className="text-green-400">&quot;{data}&quot;</span>
  if (Array.isArray(data)) {
    if (data.length === 0) return <span className="text-muted-foreground">[]</span>
    return <JsonArrayView data={data} level={level} />
  }
  if (typeof data === 'object') {
    const entries = Object.entries(data as { [key: string]: JsonValue })
    if (entries.length === 0) return <span className="text-muted-foreground">{'{}'}</span>
    return <JsonObjectView data={data as { [key: string]: JsonValue }} level={level} />
  }
  return <span>{String(data)}</span>
}

function JsonObjectView({
  data,
  level
}: {
  data: { [key: string]: JsonValue }
  level: number
}): JSX.Element {
  const [expanded, setExpanded] = useState(level < 2)
  const entries = Object.entries(data)
  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="inline-flex items-center text-muted-foreground hover:text-foreground"
      >
        {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        <span className="ml-1 text-xs">{`{${entries.length}}`}</span>
      </button>
      {expanded && (
        <div className="ml-4 border-l border-border pl-2">
          {entries.map(([key, value]) => (
            <div key={key} className="py-0.5">
              <span className="text-purple-400">&quot;{key}&quot;</span>
              <span className="text-muted-foreground">: </span>
              <JsonTree data={value} level={level + 1} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function JsonArrayView({ data, level }: { data: JsonValue[]; level: number }): JSX.Element {
  const [expanded, setExpanded] = useState(level < 2)
  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="inline-flex items-center text-muted-foreground hover:text-foreground"
      >
        {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        <span className="ml-1 text-xs">{`[${data.length}]`}</span>
      </button>
      {expanded && (
        <div className="ml-4 border-l border-border pl-2">
          {data.map((item, index) => (
            <div key={index} className="py-0.5">
              <span className="text-muted-foreground">{index}: </span>
              <JsonTree data={item} level={level + 1} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function InspectDialog({ title, data, open, onOpenChange }: InspectDialogProps): JSX.Element {
  const [copied, setCopied] = useState(false)
  const maskedData = useMemo(() => (data ? maskSensitiveData(data) : null), [data])

  const handleCopy = async (): Promise<void> => {
    if (!data) return
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // 클립보드 에러
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[80vh] max-w-2xl flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex items-center justify-end border-b border-border pb-2">
          <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 text-xs">
            {copied ? (
              <>
                <Check className="mr-1.5 h-3.5 w-3.5" />
                Copied
              </>
            ) : (
              <>
                <Copy className="mr-1.5 h-3.5 w-3.5" />
                Copy JSON
              </>
            )}
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-3 font-mono text-sm">
            {maskedData ? <JsonTree data={maskedData as JsonValue} /> : null}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
