import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '@/lib/api'

// ---- Customers ----
export const useCustomers = (search = '') =>
  useQuery({ queryKey: ['customers', search], queryFn: () => api.listCustomers(search) })
export const useCustomer = (id?: string) =>
  useQuery({ queryKey: ['customer', id], queryFn: () => api.getCustomer(id!), enabled: !!id })

// ---- Vehicles ----
export const useVehicles = (search = '') =>
  useQuery({ queryKey: ['vehicles', search], queryFn: () => api.listVehicles(search) })
export const useVehicle = (id?: string) =>
  useQuery({ queryKey: ['vehicle', id], queryFn: () => api.getVehicle(id!), enabled: !!id })
export const useCustomerVehicles = (customerId?: string) =>
  useQuery({ queryKey: ['vehicles', 'customer', customerId], queryFn: () => api.listVehiclesForCustomer(customerId!), enabled: !!customerId })

// ---- Job cards ----
export const useJobCards = (search = '', status = 'all') =>
  useQuery({ queryKey: ['jobcards', search, status], queryFn: () => api.listJobCards(search, status) })
export const useJobCard = (id?: string) =>
  useQuery({ queryKey: ['jobcard', id], queryFn: () => api.getJobCard(id!), enabled: !!id })

// ---- Invoices ----
export const useInvoices = (search = '', status = 'all') =>
  useQuery({ queryKey: ['invoices', search, status], queryFn: () => api.listInvoices(search, status) })
export const useInvoice = (id?: string) =>
  useQuery({ queryKey: ['invoice', id], queryFn: () => api.getInvoice(id!), enabled: !!id })
export const useInvoiceItems = (id?: string) =>
  useQuery({ queryKey: ['invoice-items', id], queryFn: () => api.getInvoiceItems(id!), enabled: !!id })

// ---- Inspection ----
export const useInspection = (jobCardId?: string | null) =>
  useQuery({ queryKey: ['inspection', jobCardId], queryFn: () => api.getInspectionByJobCard(jobCardId!), enabled: !!jobCardId })

// ---- Inventory / services ----
export const useSpareParts = (search = '') =>
  useQuery({ queryKey: ['spareparts', search], queryFn: () => api.listSpareParts(search) })
export const useServices = () => useQuery({ queryKey: ['services'], queryFn: api.listServices })

// ---- Catalogue ----
export const useBrands = () => useQuery({ queryKey: ['brands'], queryFn: api.listBrands })
export const useModels = (brandId?: string) =>
  useQuery({ queryKey: ['models', brandId], queryFn: () => api.listModels(brandId!), enabled: !!brandId })

// ---- Dashboard ----
export const useDashboard = () => useQuery({ queryKey: ['dashboard'], queryFn: api.getDashboard })

// ---- Staff ----
export const useStaff = () => useQuery({ queryKey: ['staff'], queryFn: api.listStaff })

// ---- Mutations ----
export function useCreateCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.createCustomer,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  })
}
export function useUpdateCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Record<string, unknown> }) => api.updateCustomer(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] })
      qc.invalidateQueries({ queryKey: ['customer'] })
    },
  })
}
export function useDeleteCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteCustomer(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] })
      qc.invalidateQueries({ queryKey: ['vehicles'] })
    },
  })
}
export function useCreateVehicle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.createVehicle,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicles'] }),
  })
}
export function useUpdateJobCardStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.updateJobCardStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobcards'] })
      qc.invalidateQueries({ queryKey: ['jobcard'] })
    },
  })
}
export function useCreateSparePart() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.createSparePart,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['spareparts'] }),
  })
}
export function useUpdateSparePart() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Record<string, unknown> }) => api.updateSparePart(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['spareparts'] }),
  })
}
export function useDeleteSparePart() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteSparePart(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['spareparts'] }),
  })
}
export function useCreateService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.createService,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services'] }),
  })
}
export function useUpdateService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Record<string, unknown> }) => api.updateService(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services'] }),
  })
}
export function useDeleteService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteService(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services'] }),
  })
}
export function useCreateJobCard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.createJobCard,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobcards'] }),
  })
}
export function useCreateInvoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.createInvoice,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] })
      qc.invalidateQueries({ queryKey: ['spareparts'] })
    },
  })
}
export function useCreateStaff() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.createStaffAccount,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff'] }),
  })
}
export function useSetStaffStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'inactive' }) => api.setStaffStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff'] }),
  })
}
export function useUpdateStaffPermissions() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, permissions }: { id: string; permissions: unknown }) => api.updateStaffPermissions(id, permissions),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff'] }),
  })
}
