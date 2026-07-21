import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merge Tailwind classes with conditional logic. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format a number as Indian Rupees. */
export function formatCurrency(value: number, opts: { decimals?: boolean } = {}) {
  const { decimals = false } = opts
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  }).format(value || 0)
}

/** Compact number, e.g. 1,248 */
export function formatNumber(value: number) {
  return new Intl.NumberFormat('en-IN').format(value || 0)
}

/** Initials from a full name, e.g. "Ramesh Kumar" -> "RK" */
export function initials(name?: string | null) {
  if (!name) return '?'
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}

/** Normalize an Indian phone number to a WhatsApp wa.me target (91XXXXXXXXXX). */
export function toWhatsAppNumber(phone?: string | null) {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) return `91${digits}`
  if (digits.length === 12 && digits.startsWith('91')) return digits
  return digits
}

/** Build a wa.me link with a prefilled message. */
export function whatsAppLink(phone?: string | null, message = '') {
  const num = toWhatsAppNumber(phone)
  return `https://wa.me/${num}?text=${encodeURIComponent(message)}`
}

/** Build a tel: link. */
export function telLink(phone?: string | null) {
  return `tel:${(phone ?? '').replace(/\s/g, '')}`
}

/** Generate a zero-padded sequential id, e.g. sequentialId('VCC-STF', 1) -> 'VCC-STF-001' */
export function sequentialId(prefix: string, n: number, pad = 3) {
  return `${prefix}-${String(n).padStart(pad, '0')}`
}
