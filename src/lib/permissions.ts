import type {
  ModulePermissions,
  PermissionAction,
  PermissionMap,
  PermissionModule,
} from './types'

export const PERMISSION_MODULES: { key: PermissionModule; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'customers', label: 'Customers' },
  { key: 'vehicles', label: 'Vehicles' },
  { key: 'jobcards', label: 'Job Cards' },
  { key: 'inspection', label: 'Inspection' },
  { key: 'services', label: 'Services' },
  { key: 'invoices', label: 'Invoices' },
  { key: 'payments', label: 'Payments' },
  { key: 'reminders', label: 'Reminders' },
  { key: 'reports', label: 'Reports' },
]

export const PERMISSION_ACTIONS: { key: PermissionAction; label: string }[] = [
  { key: 'view', label: 'View' },
  { key: 'add', label: 'Add' },
  { key: 'edit', label: 'Edit' },
  { key: 'delete', label: 'Delete' },
  { key: 'print', label: 'Print' },
  { key: 'download', label: 'Download' },
  { key: 'whatsapp', label: 'WhatsApp' },
]

function makeModule(value: boolean): ModulePermissions {
  return {
    view: value,
    add: value,
    edit: value,
    delete: value,
    print: value,
    download: value,
    whatsapp: value,
  }
}

export function buildPermissionMap(value: boolean): PermissionMap {
  return PERMISSION_MODULES.reduce((acc, m) => {
    acc[m.key] = makeModule(value)
    return acc
  }, {} as PermissionMap)
}

/** Manager: everything on. */
export const MANAGER_PERMISSIONS: PermissionMap = buildPermissionMap(true)

/** Sensible default for a new staff member: view-heavy, limited delete. */
export function defaultStaffPermissions(): PermissionMap {
  const map = buildPermissionMap(false)
  const enabledView: PermissionModule[] = [
    'dashboard',
    'customers',
    'vehicles',
    'jobcards',
    'inspection',
    'services',
    'invoices',
    'payments',
  ]
  enabledView.forEach((m) => {
    map[m].view = true
    map[m].add = true
    map[m].edit = true
    map[m].print = true
    map[m].download = true
    map[m].whatsapp = true
  })
  return map
}

export function can(
  permissions: PermissionMap | undefined,
  module: PermissionModule,
  action: PermissionAction,
): boolean {
  return Boolean(permissions?.[module]?.[action])
}
