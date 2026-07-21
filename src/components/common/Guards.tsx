import { Navigate } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import type { PermissionAction, PermissionModule } from '@/lib/types'
import { EmptyState } from '@/components/ui/Misc'

/** Requires an authenticated session; otherwise redirect to /login. */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-page">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-red border-t-transparent" />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

/** Gates a page/section on a module+action permission. */
export function PermissionGuard({
  module,
  action = 'view',
  children,
}: {
  module: PermissionModule
  action?: PermissionAction
  children: React.ReactNode
}) {
  const { can } = useAuth()
  if (!can(module, action)) {
    return (
      <EmptyState
        icon={<ShieldAlert className="h-6 w-6" />}
        title="Access restricted"
        description="You don't have permission to view this section. Ask your Manager to enable access."
      />
    )
  }
  return <>{children}</>
}

/** Manager-only gate. */
export function ManagerOnly({ children }: { children: React.ReactNode }) {
  const { isManager } = useAuth()
  if (!isManager) {
    return (
      <EmptyState
        icon={<ShieldAlert className="h-6 w-6" />}
        title="Managers only"
        description="This section is available to Managers only."
      />
    )
  }
  return <>{children}</>
}
