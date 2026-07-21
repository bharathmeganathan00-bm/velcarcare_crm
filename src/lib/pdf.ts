import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { CompanySettings } from './types'

export interface InvoiceLine {
  description: string
  qty: number
  rate: number
  amount: number
}

export interface InvoicePdfData {
  invoiceNo: string
  date: string
  jobCardNo?: string
  customerName: string
  customerPhone?: string
  vehicleLabel: string
  regNumber: string
  odometer?: number | null
  services: InvoiceLine[]
  parts: InvoiceLine[]
  labour: number
  discount: number
  cgst: number
  sgst: number
  grandTotal: number
  paid: number
  balance: number
  inspection?: { item: string; status: string }[]
}

const RED: [number, number, number] = [225, 29, 42]
const INK: [number, number, number] = [30, 37, 48]
const GREY: [number, number, number] = [120, 120, 120]

/**
 * jsPDF's built-in Helvetica has no ₹ glyph, so money is written as "Rs. 1,200"
 * with Indian digit grouping. This keeps numbers aligned and readable.
 */
function money(n: number) {
  return 'Rs. ' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n || 0)
}

/** Load the company logo as a PNG data URL (rasterises /logo.png, else /logo.svg). */
async function loadLogo(): Promise<{ dataUrl: string; w: number; h: number } | null> {
  const tryLoad = (src: string) =>
    new Promise<{ dataUrl: string; w: number; h: number } | null>((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const scale = 3
        const w = (img.naturalWidth || 320) * scale
        const h = (img.naturalHeight || 150) * scale
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) return resolve(null)
        ctx.drawImage(img, 0, 0, w, h)
        try {
          resolve({ dataUrl: canvas.toDataURL('image/png'), w, h })
        } catch {
          resolve(null)
        }
      }
      img.onerror = () => resolve(null)
      img.src = src
    })
  return (await tryLoad('/logo.svg')) ?? (await tryLoad('/logo.png'))
}

/** Generates a branded VELCARCARE invoice PDF and returns the jsPDF instance. */
export async function buildInvoicePdf(company: CompanySettings, data: InvoicePdfData): Promise<jsPDF> {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const M = 40
  const logo = await loadLogo()

  // ---- Header (white, logo left / invoice meta right) ----
  let leftY = 40
  if (logo) {
    const aspect = logo.w / logo.h
    let h = 52
    let w = h * aspect
    if (w > 150) {
      w = 150
      h = w / aspect
    }
    doc.addImage(logo.dataUrl, 'PNG', M, 28, w, h)
    leftY = 28 + h + 14
  } else {
    doc.setTextColor(...INK)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(22)
    doc.text(company.name, M, 46)
    leftY = 64
  }

  // Company contact block (under logo)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(...GREY)
  doc.text(company.address, M, leftY, { maxWidth: W * 0.55 })
  doc.text(`${company.phones.filter(Boolean).join('  |  ')}`, M, leftY + 22)
  doc.text(company.email, M, leftY + 34)

  // Invoice meta (right)
  doc.setTextColor(...RED)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.text(company.gst_enabled ? 'TAX INVOICE' : 'INVOICE', W - M, 46, { align: 'right' })
  doc.setTextColor(...INK)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.text(`Invoice No:  ${data.invoiceNo}`, W - M, 66, { align: 'right' })
  doc.text(`Date:  ${data.date}`, W - M, 80, { align: 'right' })
  if (data.jobCardNo) doc.text(`Job Card:  ${data.jobCardNo}`, W - M, 94, { align: 'right' })
  if (company.gst_enabled && company.gst_number) doc.text(`GSTIN:  ${company.gst_number}`, W - M, 108, { align: 'right' })

  // Divider
  const dividerY = Math.max(leftY + 44, 118)
  doc.setDrawColor(...RED)
  doc.setLineWidth(1.4)
  doc.line(M, dividerY, W - M, dividerY)

  // ---- Bill to / Vehicle ----
  const infoY = dividerY + 22
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(...INK)
  doc.text('BILL TO', M, infoY)
  doc.text('VEHICLE', W / 2, infoY)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text([data.customerName, data.customerPhone ?? ''].filter(Boolean).join('\n'), M, infoY + 15)
  doc.text(
    [data.vehicleLabel, data.regNumber, data.odometer ? `Odometer: ${data.odometer} km` : '']
      .filter(Boolean)
      .join('\n'),
    W / 2,
    infoY + 15,
  )

  // ---- Items table ----
  const body: (string | number)[][] = []
  data.services.forEach((s) => body.push([s.description, 'Service', s.qty, money(s.rate), money(s.amount)]))
  data.parts.forEach((p) => body.push([p.description, 'Part', p.qty, money(p.rate), money(p.amount)]))
  if (data.labour) body.push(['Labour Charges', 'Labour', 1, money(data.labour), money(data.labour)])

  autoTable(doc, {
    startY: infoY + 52,
    head: [['Description', 'Type', 'Qty', 'Rate', 'Amount']],
    body,
    theme: 'grid',
    headStyles: { fillColor: INK, textColor: [255, 255, 255], fontSize: 9, halign: 'left', cellPadding: 6 },
    bodyStyles: { fontSize: 9.5, textColor: INK, cellPadding: 6 },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 60, halign: 'center' },
      2: { cellWidth: 40, halign: 'center' },
      3: { cellWidth: 85, halign: 'right' },
      4: { cellWidth: 90, halign: 'right' },
    },
    margin: { left: M, right: M },
  })

  // @ts-expect-error autotable adds lastAutoTable
  const itemsFinalY: number = doc.lastAutoTable.finalY

  // ---- Inspection report (left column, optional) ----
  let inspectionFinalY = itemsFinalY
  if (data.inspection?.length) {
    autoTable(doc, {
      startY: itemsFinalY + 20,
      head: [['Inspection', 'Status']],
      body: data.inspection.map((i) => [i.item, i.status === 'good' ? 'Good' : 'Not OK']),
      theme: 'grid',
      headStyles: { fillColor: INK, textColor: [255, 255, 255], fontSize: 8.5, cellPadding: 4 },
      bodyStyles: { fontSize: 8.5, textColor: INK, cellPadding: 4 },
      columnStyles: { 1: { halign: 'right', cellWidth: 56 } },
      margin: { left: M },
      tableWidth: W * 0.44,
    })
    // @ts-expect-error autotable adds lastAutoTable
    inspectionFinalY = doc.lastAutoTable.finalY
  }

  // ---- Totals (right column) ----
  let ty = itemsFinalY + 24
  const labelX = W - M - 190
  const line = (label: string, val: string, bold = false, color: [number, number, number] = INK) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setFontSize(bold ? 12 : 10)
    doc.setTextColor(...color)
    doc.text(label, labelX, ty)
    doc.text(val, W - M, ty, { align: 'right' })
    ty += bold ? 22 : 16
  }
  const subtotal = data.grandTotal - data.cgst - data.sgst + data.discount
  line('Sub Total', money(subtotal))
  if (data.discount) line('Discount', `- ${money(data.discount)}`)
  if (company.gst_enabled) {
    line(`CGST ${company.cgst_percent}%`, money(data.cgst))
    line(`SGST ${company.sgst_percent}%`, money(data.sgst))
  }
  doc.setDrawColor(...RED)
  doc.setLineWidth(1)
  doc.line(labelX, ty - 8, W - M, ty - 8)
  line('Grand Total', money(data.grandTotal), true, RED)
  line('Paid', money(data.paid))
  line('Balance', money(data.balance), false, data.balance > 0 ? RED : INK)

  // ---- Footer ----
  const footY = Math.max(ty, inspectionFinalY) + 30
  doc.setFontSize(8.5)
  doc.setTextColor(...GREY)
  doc.text(company.terms ?? '', M, footY, { maxWidth: W * 0.6 })

  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.5)
  doc.line(W - M - 150, footY + 22, W - M, footY + 22)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...INK)
  doc.text('Authorised Signature', W - M, footY + 34, { align: 'right' })

  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...RED)
  doc.setFontSize(11)
  doc.text('Thank you for choosing VELCARCARE!', M, footY + 52)

  return doc
}

export async function downloadInvoicePdf(company: CompanySettings, data: InvoicePdfData) {
  const doc = await buildInvoicePdf(company, data)
  doc.save(`${data.invoiceNo}.pdf`)
}
