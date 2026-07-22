import { useEffect, useState } from 'react'
import { Plus, Shield, UserCog } from 'lucide-react'
import { toast } from 'sonner'
import { SectionTitle, Avatar, EmptyState } from '@/components/ui/Misc'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Input, Field } from '@/components/ui/Input'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { QueryState } from '@/components/common/QueryState'
import { PERMISSION_ACTIONS, PERMISSION_MODULES, defaultStaffPermissions } from '@/lib/permissions'
import { sequentialId } from '@/lib/utils'
import { useCreateStaff, useSetStaffStatus, useStaff, useUpdateStaffPermissions } from '@/hooks/data'
import type { PermissionMap, Profile } from '@/lib/types'

export function Staff() {
  const { data: staff = [], isLoading, error } = useStaff()
  const createStaff = useCreateStaff()
  const setStatus = useSetStaffStatus()
  const updatePerms = useUpdateStaffPermissions()

  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<Profile | null>(null)
  const [form, setForm] = useState({ name: '', mobile: '', email: '', username: '', password: '' })

  const staffCount = staff.filter((s) => s.role === 'staff').length

  async function addStaff() {
    if (!form.name || !form.username || !form.email || !form.password) {
      toast.error('Name, username, email and password are required')
      return
    }
    try {
      await createStaff.mutateAsync({
        name: form.name,
        username: form.username,
        email: form.email,
        mobile: form.mobile,
        password: form.password,
        staff_id: sequentialId('VCC-STF', staffCount + 1),
        permissions: defaultStaffPermissions(),
      })
      setAddOpen(false)
      setForm({ name: '', mobile: '', email: '', username: '', password: '' })
      toast.success('Staff account created')
    } catch (e) {
      toast.error(String((e as Error).message))
    }
  }

  function togglePerm(module: string, action: string) {
    if (!editing) return
    const perms = structuredClone(editing.permissions) as PermissionMap
    // @ts-expect-error dynamic index
    perms[module][action] = !perms[module][action]
    setEditing({ ...editing, permissions: perms })
  }

  async function savePerms() {
    if (!editing) return
    try {
      await updatePerms.mutateAsync({ id: editing.id, permissions: editing.permissions })
      setEditing(null)
      toast.success('Permissions updated')
    } catch (e) {
      toast.error(String((e as Error).message))
    }
  }

  return (
    <div>
      <SectionTitle
        title="Staff"
        subtitle={`${staffCount} staff accounts`}
        action={<Button onClick={() => setAddOpen(true)}><Plus className="h-4 w-4" /> Add Staff</Button>}
      />

      <QueryState
        isLoading={isLoading}
        error={error}
        isEmpty={staff.length === 0}
        empty={<EmptyState icon={<UserCog className="h-6 w-6" />} title="No staff yet" description="Create staff logins so your team can use the CRM." action={<Button onClick={() => setAddOpen(true)}><Plus className="h-4 w-4" /> Add Staff</Button>} />}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {staff.map((s) => (
            <Card key={s.id}>
              <CardContent>
                <div className="flex items-start gap-3">
                  <Avatar name={s.name} src={s.photo_url} size={46} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-brand-charcoal">{s.name}</p>
                    <p className="text-xs text-slate-400">{s.staff_id} · @{s.username}</p>
                    <p className="text-xs text-slate-400">{s.mobile}</p>
                  </div>
                  <StatusBadge tone={s.status === 'active' ? 'success' : 'neutral'}>{s.status}</StatusBadge>
                </div>
                {s.role === 'manager' ? (
                  <div className="mt-3"><StatusBadge tone="red">Manager · full access</StatusBadge></div>
                ) : (
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => setEditing(s)}>
                      <Shield className="h-4 w-4" /> Permissions
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setStatus.mutate({ id: s.id, status: s.status === 'active' ? 'inactive' : 'active' })}
                    >
                      {s.status === 'active' ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </QueryState>

      {/* Add staff dialog */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} title="Add Staff" description="Creates a secure staff login. Staff ID auto-generates. Password must be at least 6 characters.">
        <div className="space-y-4 p-5">
          <Field label="Staff Name" required><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Mobile"><Input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} /></Field>
            <Field label="Email" required><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Username" required><Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></Field>
            <Field label="Temp Password" required><Input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min 6 chars" /></Field>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button className="flex-1" onClick={addStaff} loading={createStaff.isPending}><UserCog className="h-4 w-4" /> Create Staff</Button>
          </div>
        </div>
      </Dialog>

      {/* Permission matrix dialog */}
      <Dialog open={!!editing} onClose={() => setEditing(null)} title={`Permissions · ${editing?.name}`} size="lg">
        <div className="max-h-[60vh] overflow-auto p-4">
          <table className="w-full min-w-[440px] text-sm">
            <thead className="sticky top-0 bg-white">
              <tr className="text-xs font-bold uppercase text-slate-400">
                <th className="py-2 text-left">Module</th>
                {PERMISSION_ACTIONS.map((a) => (
                  <th key={a.key} className="py-2 text-center font-semibold">{a.label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {PERMISSION_MODULES.map((m) => (
                <tr key={m.key}>
                  <td className="py-2 pr-2 font-semibold text-brand-charcoal">{m.label}</td>
                  {PERMISSION_ACTIONS.map((a) => {
                    const on = editing?.permissions[m.key]?.[a.key]
                    return (
                      <td key={a.key} className="py-2 text-center">
                        <button
                          onClick={() => togglePerm(m.key, a.key)}
                          className={`h-5 w-5 rounded-md border-2 transition ${on ? 'border-brand-red bg-brand-red' : 'border-slate-300'}`}
                        />
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex gap-3 border-t border-surface-border p-4">
          <Button variant="outline" className="flex-1" onClick={() => setEditing(null)}>Cancel</Button>
          <Button className="flex-1" onClick={savePerms} loading={updatePerms.isPending}>Save Permissions</Button>
        </div>
      </Dialog>
    </div>
  )
}
