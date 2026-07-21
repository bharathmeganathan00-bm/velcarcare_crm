import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { isConfigured } from '@/lib/supabase'
import { AuthProvider } from '@/context/AuthContext'
import { SettingsProvider } from '@/context/SettingsContext'
import { ProtectedRoute, PermissionGuard, ManagerOnly } from '@/components/common/Guards'
import { AppLayout } from '@/components/layout/AppLayout'

import { ConfigNeeded } from '@/pages/ConfigNeeded'
import { Login } from '@/pages/Login'
import { Dashboard } from '@/pages/Dashboard'
import { CustomersList } from '@/pages/customers/CustomersList'
import { CustomerWizard } from '@/pages/customers/CustomerWizard'
import { CustomerDetail } from '@/pages/customers/CustomerDetail'
import { VehiclesList } from '@/pages/vehicles/VehiclesList'
import { VehicleForm } from '@/pages/vehicles/VehicleForm'
import { VehicleDetail } from '@/pages/vehicles/VehicleDetail'
import { JobCardsList } from '@/pages/jobcards/JobCardsList'
import { JobCardBuilder } from '@/pages/jobcards/JobCardBuilder'
import { JobCardDetail } from '@/pages/jobcards/JobCardDetail'
import { Inspection } from '@/pages/Inspection'
import { Services } from '@/pages/Services'
import { InvoicesList } from '@/pages/invoices/InvoicesList'
import { InvoiceBuilder } from '@/pages/invoices/InvoiceBuilder'
import { InvoiceDetail } from '@/pages/invoices/InvoiceDetail'
import { Payments } from '@/pages/Payments'
import { Reminders } from '@/pages/Reminders'
import { Reports } from '@/pages/Reports'
import { Staff } from '@/pages/Staff'
import { Settings } from '@/pages/Settings'
import { More } from '@/pages/More'

export default function App() {
  if (!isConfigured) return <ConfigNeeded />
  return (
    <AuthProvider>
      <SettingsProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<PermissionGuard module="dashboard"><Dashboard /></PermissionGuard>} />

              <Route path="/customers" element={<PermissionGuard module="customers"><CustomersList /></PermissionGuard>} />
              <Route path="/customers/new" element={<PermissionGuard module="customers" action="add"><CustomerWizard /></PermissionGuard>} />
              <Route path="/customers/:id" element={<PermissionGuard module="customers"><CustomerDetail /></PermissionGuard>} />

              <Route path="/vehicles" element={<PermissionGuard module="vehicles"><VehiclesList /></PermissionGuard>} />
              <Route path="/vehicles/new" element={<PermissionGuard module="vehicles" action="add"><VehicleForm /></PermissionGuard>} />
              <Route path="/vehicles/:id" element={<PermissionGuard module="vehicles"><VehicleDetail /></PermissionGuard>} />

              <Route path="/job-cards" element={<PermissionGuard module="jobcards"><JobCardsList /></PermissionGuard>} />
              <Route path="/job-cards/new" element={<PermissionGuard module="jobcards" action="add"><JobCardBuilder /></PermissionGuard>} />
              <Route path="/job-cards/:id" element={<PermissionGuard module="jobcards"><JobCardDetail /></PermissionGuard>} />

              <Route path="/inspection" element={<PermissionGuard module="inspection"><Inspection /></PermissionGuard>} />
              <Route path="/services" element={<PermissionGuard module="services"><Services /></PermissionGuard>} />

              <Route path="/invoices" element={<PermissionGuard module="invoices"><InvoicesList /></PermissionGuard>} />
              <Route path="/invoices/new" element={<PermissionGuard module="invoices" action="add"><InvoiceBuilder /></PermissionGuard>} />
              <Route path="/invoices/:id" element={<PermissionGuard module="invoices"><InvoiceDetail /></PermissionGuard>} />

              <Route path="/payments" element={<PermissionGuard module="payments"><Payments /></PermissionGuard>} />

              <Route path="/reminders" element={<PermissionGuard module="reminders"><Reminders /></PermissionGuard>} />
              <Route path="/reports" element={<PermissionGuard module="reports"><Reports /></PermissionGuard>} />

              <Route path="/staff" element={<ManagerOnly><Staff /></ManagerOnly>} />
              <Route path="/settings" element={<ManagerOnly><Settings /></ManagerOnly>} />
              <Route path="/more" element={<More />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster position="top-center" richColors closeButton />
        </BrowserRouter>
      </SettingsProvider>
    </AuthProvider>
  )
}
