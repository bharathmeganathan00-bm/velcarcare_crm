import { AlertTriangle } from 'lucide-react'
import { Skeleton } from '@/components/ui/Misc'

/** Renders loading skeletons / error / empty consistently around a query. */
export function QueryState({
  isLoading,
  error,
  isEmpty,
  empty,
  children,
  rows = 5,
}: {
  isLoading: boolean
  error?: unknown
  isEmpty?: boolean
  empty?: React.ReactNode
  children: React.ReactNode
  rows?: number
}) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="card p-4">
            <Skeleton className="mb-2 h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    )
  }
  if (error) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-status-dangerBg bg-status-dangerBg/40 px-6 py-10 text-center">
        <AlertTriangle className="mb-2 h-6 w-6 text-status-danger" />
        <p className="font-bold text-status-danger">Couldn't load data</p>
        <p className="mt-1 max-w-sm text-sm text-status-danger/80">{String((error as Error)?.message ?? error)}</p>
      </div>
    )
  }
  if (isEmpty) return <>{empty}</>
  return <>{children}</>
}
