import { toWhatsAppNumber, whatsAppLink } from './utils'

export type ShareMethod = 'web_share' | 'whatsapp_link' | 'pdf_download'
export type ShareStatus = 'share_started' | 'share_sheet_opened' | 'whatsapp_opened' | 'completed' | 'failed'

export interface ShareResult {
  method: ShareMethod
  ok: boolean
  cancelled?: boolean
  fallback?: boolean
}

type Logger = (method: ShareMethod, status: ShareStatus, error?: string) => void

/** Can this browser share a File through the native share sheet? */
export function canWebShareFile(file: File): boolean {
  const nav = navigator as Navigator & { canShare?: (data?: unknown) => boolean }
  return typeof navigator.share === 'function' && typeof nav.canShare === 'function' && nav.canShare({ files: [file] })
}

function triggerDownload(file: File) {
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}

/**
 * Share the invoice via the native share sheet (with the PDF attached) when
 * supported, else download the PDF and open the customer's WhatsApp chat with
 * the message pre-filled. The CRM cannot auto-send — the user taps Send.
 */
export async function shareInvoiceViaWebShare(args: {
  file: File
  message: string
  title: string
  phone: string
  log: Logger
}): Promise<ShareResult> {
  const { file, message, title, phone, log } = args
  if (canWebShareFile(file)) {
    log('web_share', 'share_started')
    try {
      log('web_share', 'share_sheet_opened')
      await navigator.share({ files: [file], text: message, title })
      log('web_share', 'completed')
      return { method: 'web_share', ok: true }
    } catch (e) {
      const err = e as { name?: string; message?: string }
      if (err?.name === 'AbortError') {
        log('web_share', 'failed', 'cancelled')
        return { method: 'web_share', ok: false, cancelled: true }
      }
      log('web_share', 'failed', err?.message ?? 'share failed')
      // fall through to fallback
    }
  }
  return shareInvoiceViaFallback({ file, message, phone, log })
}

/** Fallback: download the PDF, then open WhatsApp chat with the pre-filled text. */
export async function shareInvoiceViaFallback(args: {
  file: File
  message: string
  phone: string
  log: Logger
}): Promise<ShareResult> {
  const { file, message, phone, log } = args
  log('pdf_download', 'share_started')
  triggerDownload(file)
  const num = toWhatsAppNumber(phone)
  window.open(whatsAppLink(num, message), '_blank')
  log('whatsapp_link', 'whatsapp_opened')
  return { method: 'whatsapp_link', ok: true, fallback: true }
}
