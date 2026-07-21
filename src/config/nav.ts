import {
  LayoutDashboard,
  Users,
  Car,
  ClipboardList,
  SearchCheck,
  Wrench,
  ReceiptText,
  Wallet,
  BellRing,
  BarChart3,
  UserCog,
  Settings,
  type LucideIcon,
} from 'lucide-react'
import type { PermissionModule } from '@/lib/types'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  /** Permission module gate; omitted items are always visible (e.g. Settings for manager). */
  module?: PermissionModule
  managerOnly?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard, module: 'dashboard' },
  { label: 'Customers', to: '/customers', icon: Users, module: 'customers' },
  { label: 'Vehicles', to: '/vehicles', icon: Car, module: 'vehicles' },
  { label: 'Job Cards', to: '/job-cards', icon: ClipboardList, module: 'jobcards' },
  { label: 'Inspection', to: '/inspection', icon: SearchCheck, module: 'inspection' },
  { label: 'Services', to: '/services', icon: Wrench, module: 'services' },
  { label: 'Invoices', to: '/invoices', icon: ReceiptText, module: 'invoices' },
  { label: 'Payments', to: '/payments', icon: Wallet, module: 'payments' },
  { label: 'Reminders', to: '/reminders', icon: BellRing, module: 'reminders' },
  { label: 'Reports', to: '/reports', icon: BarChart3, module: 'reports' },
  { label: 'Staff', to: '/staff', icon: UserCog, managerOnly: true },
  { label: 'Settings', to: '/settings', icon: Settings, managerOnly: true },
]
