import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { CompanySettings } from '@/lib/types'
import { COMPANY } from '@/data/mockData'
import * as api from '@/lib/api'

interface SettingsState {
  settings: CompanySettings
  loading: boolean
  update: (patch: Partial<CompanySettings>) => void
  save: (next: CompanySettings) => Promise<void>
}

const SettingsContext = createContext<SettingsState | undefined>(undefined)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  // COMPANY is used purely as the field-shape default until the live row loads.
  const [settings, setSettings] = useState<CompanySettings>(COMPANY)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .getSettings()
      .then((s) => { if (s) setSettings(s) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const value = useMemo<SettingsState>(
    () => ({
      settings,
      loading,
      update: (patch) => setSettings((s) => ({ ...s, ...patch })),
      save: async (next) => {
        await api.saveSettings(next)
        setSettings(next)
      },
    }),
    [settings, loading],
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}
