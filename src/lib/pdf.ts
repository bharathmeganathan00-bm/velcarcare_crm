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
  customerAddress?: string
  vehicleLabel: string
  regNumber: string
  odometer?: number | null
  fuelType?: string
  serviceDate?: string
  services: InvoiceLine[]
  parts: InvoiceLine[]
  labour: number
  discount: number
  cgst: number
  sgst: number
  grandTotal: number
  paid: number
  balance: number
  paymentMode?: string
  paymentStatus?: string
  transactionId?: string
  inspection?: { item: string; status: string }[]
}

type RGB = [number, number, number]
const RED: RGB = [225, 29, 42]
const INK: RGB = [24, 26, 32]
const CHARCOAL: RGB = [30, 37, 48]
const WHITE: RGB = [255, 255, 255]
const GREY: RGB = [110, 116, 126]
const BORDER: RGB = [226, 230, 235]
const LIGHT: RGB = [247, 248, 250]
const GREEN: RGB = [22, 163, 74]
const ORANGE: RGB = [217, 119, 6]
const GRAYDOT: RGB = [148, 163, 184]

/** jsPDF core fonts have no ₹ glyph, so money is written "Rs. 1,200(.00)" — Indian grouping. */
function money(n: number) {
  const v = Number(n) || 0
  const frac = Math.round(v * 100) % 100 !== 0
  return 'Rs. ' + new Intl.NumberFormat('en-IN', { minimumFractionDigits: frac ? 2 : 0, maximumFractionDigits: 2 }).format(v)
}

/**
 * Load the company logo as a small PNG data URL (rasterises /logo.svg, else
 * /logo.png). The logo only prints ~150pt wide, so we cap the raster at ~460px
 * on the longest side — this keeps the embedded image tiny (a few tens of KB)
 * so invoice PDFs stay small and share cleanly on WhatsApp.
 */
async function loadLogo(): Promise<{ dataUrl: string; w: number; h: number } | null> {
  const MAX = 460
  const tryLoad = (src: string) =>
    new Promise<{ dataUrl: string; w: number; h: number } | null>((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const natW = img.naturalWidth || 320
        const natH = img.naturalHeight || 150
        const scale = Math.min(MAX / natW, MAX / natH, 2) // cap size, never upscale >2x
        const w = Math.max(1, Math.round(natW * scale))
        const h = Math.max(1, Math.round(natH * scale))
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

function inspectionStatus(raw: string): { label: string; color: RGB } {
  const s = (raw || '').toLowerCase()
  if (s === 'good' || s === 'ok') return { label: 'OK', color: GREEN }
  if (s === 'attention' || s === 'needs_attention' || s === 'not') return { label: 'Attention', color: ORANGE }
  if (s === 'replace' || s === 'replaced' || s === 'urgent') return { label: 'Replace', color: RED }
  if (s === 'na' || s === 'not_checked' || s === 'not applicable') return { label: 'Not Checked', color: GRAYDOT }
  return { label: 'OK', color: GREEN }
}

/** Generates the premium automotive VELCARCARE invoice and returns the jsPDF instance. */
export async function buildInvoicePdf(company: CompanySettings, data: InvoicePdfData): Promise<jsPDF> {
  const doc = new jsPDF({ unit: 'pt', format: 'a4', compress: true })
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  const M = 28
  const CW = W - 2 * M
  const logo = await loadLogo()

  const fill = (c: RGB) => doc.setFillColor(c[0], c[1], c[2])
  const stroke = (c: RGB) => doc.setDrawColor(c[0], c[1], c[2])
  const text = (c: RGB) => doc.setTextColor(c[0], c[1], c[2])

  // ------------------------------------------------------------------ HEADER
  // Logo (top-left)
  if (logo) {
    const aspect = logo.w / logo.h
    let h = 46
    let w = h * aspect
    if (w > 190) { w = 190; h = w / aspect }
    doc.addImage(logo.dataUrl, 'PNG', M, 28, w, h)
  } else {
    text(INK); doc.setFont('helvetica', 'bold'); doc.setFontSize(20)
    doc.text(company.name, M, 52)
  }

  // Company contact (under logo)
  let cy = 88
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.2); text(GREY)
  const marker = (y: number) => { fill(RED); doc.circle(M + 2.5, y - 2.6, 1.8, 'F') }
  const addr = (company.address || '').trim()
  if (addr) { marker(cy); doc.text(addr, M + 9, cy, { maxWidth: W * 0.42 }); cy += addr.length > 46 ? 22 : 12 }
  const phones = (company.phones || []).filter(Boolean).join(' | ')
  if (phones) { marker(cy); doc.text(phones, M + 9, cy); cy += 12 }
  if (company.email) { marker(cy); doc.text(company.email, M + 9, cy); cy += 12 }
  // GST number (optional)
  if (company.gst_enabled && company.gst_number) {
    marker(cy)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text(`GSTIN: ${company.gst_number}`, M + 9, cy)
    cy += 12
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.2)
  }

  // Dark panel (top-right) with car silhouette + INVOICE
  const pX = W * 0.5, pY = 24, pW = W - M - pX, pH = 64
  fill(CHARCOAL); doc.roundedRect(pX, pY, pW, pH, 10, 10, 'F')
  carSilhouette(doc, pX + 16, pY + pH - 18, 72, [70, 78, 92])
  text(WHITE); doc.setFont('helvetica', 'bold'); doc.setFontSize(28)
  doc.text('INVOICE', pX + pW - 12, pY + 44, { align: 'right' })
  fill(RED); doc.rect(pX + pW - 92, pY + 52, 80, 3, 'F')

  const bY = pY + pH + 6
  const labelW = 84, valW = pW - labelW, rowH = 20
  const infoRow = (i: number, label: string, value: string) => {
    const y = bY + i * (rowH + 6)
    fill(RED); doc.roundedRect(pX, y, labelW, rowH, 4, 4, 'F')
    text(WHITE); doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
    doc.text(label, pX + labelW / 2, y + 14.5, { align: 'center' })
    fill(WHITE); stroke(BORDER); doc.setLineWidth(0.8)
    doc.roundedRect(pX + labelW + 4, y, valW - 4, rowH, 4, 4, 'FD')
    text(INK); doc.setFontSize(10.5)
    doc.text(value, pX + labelW + 14, y + 14.5)
  }
  infoRow(0, 'Invoice No.', data.invoiceNo)
  infoRow(1, 'Date', data.date)

  // ------------------------------------------------------ BILL TO / VEHICLE
  let y = Math.max(cy + 4, bY + 2 * (rowH + 6) + 4, 146)
  const cardW = (CW - 14) / 2, cardH = 76
  drawInfoCard(doc, M, y, cardW, cardH, 'BILL TO', 'person', [
    ['Name', data.customerName || '—'],
    ['Phone', data.customerPhone || '—'],
    ['Address', data.customerAddress || '—'],
  ])
  drawInfoCard(doc, M + cardW + 14, y, cardW, cardH, 'VEHICLE DETAILS', 'car', [
    ['Vehicle', data.vehicleLabel || '—'],
    ['Reg. No.', data.regNumber || '—'],
    ['Kms.', data.odometer != null ? `${new Intl.NumberFormat('en-IN').format(data.odometer)} Kms` : '—'],
    ...(data.fuelType ? [['Fuel', data.fuelType]] : []),
    ['Service', data.serviceDate || data.date],
  ] as [string, string][])
  y += cardH + 16

  // -------------------------------------------------------- SERVICE DETAILS
  sectionBar(doc, M, y, CW, 'SERVICE DETAILS')
  y += 26 + 6

  const body: (string | number)[][] = []
  let sno = 1
  data.services.forEach((s) => body.push([sno++, s.description, 'Service', s.qty, money(s.rate), money(s.amount)]))
  data.parts.forEach((p) => body.push([sno++, p.description, 'Spare Part', p.qty, money(p.rate), money(p.amount)]))
  if (data.labour > 0) body.push([sno++, 'Labour Charges', 'Labour', 1, money(data.labour), money(data.labour)])

  autoTable(doc, {
    startY: y,
    head: [['#', 'Description', 'Type', 'Qty', 'Rate', 'Amount']],
    body,
    theme: 'grid',
    pageBreak: 'avoid',
    styles: { lineColor: BORDER, lineWidth: 0.55, textColor: INK, fontSize: 9, cellPadding: 5, minCellHeight: 12 },
    headStyles: { fillColor: RED, textColor: WHITE, fontStyle: 'bold', fontSize: 9, halign: 'left' },
    alternateRowStyles: { fillColor: LIGHT },
    columnStyles: {
      0: { cellWidth: 28, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 68, halign: 'center' },
      3: { cellWidth: 36, halign: 'center' },
      4: { cellWidth: 72, halign: 'right' },
      5: { cellWidth: 80, halign: 'right' },
    },
    margin: { left: M, right: M, top: 0, bottom: M },
  })
  // @ts-expect-error autotable attaches lastAutoTable
  y = doc.lastAutoTable.finalY + 14

  const inspectionItems = [
    'Engine Oil', 'Coolant', 'Battery', 'Tyres', 'Brakes', 'Lights', 'Horn', 'AC',
    'Suspension', 'Steering', 'Clutch', 'Gearbox', 'Wipers', 'Fluid Leakage', 'Body Damage', 'Interior Condition',
  ]
  const inspectionData = inspectionItems.map((item) => {
    const found = data.inspection?.find((it) => it.item?.toLowerCase().trim() === item.toLowerCase().trim())
    return { item, status: found?.status ?? 'not_checked' }
  })

  // ------------------------- INSPECTION (left) + SUMMARY / PAYMENT (right)
  const rightW = 208
  const leftW = CW - rightW - 14
  const rightX = M + leftW + 14
  const summaryRows = 1 + (data.discount ? 1 : 0) + (company.gst_enabled ? 2 : 0)
  // top pad(20) + normal rows(16 each) + grand block(38) + paid(16) + balance + bottom pad
  const summaryH = 82 + summaryRows * 16
  const payModeH = 78
  const rightH = summaryH + 10 + payModeH
  const inspRows = Math.ceil(inspectionData.length / 2)
  const inspH = inspRows * 15 + 14

  sectionBar(doc, M, y, leftW, 'VEHICLE INSPECTION CHECKLIST')
  const boxY = y + 26
  fill(WHITE); stroke(BORDER); doc.setLineWidth(0.8)
  doc.roundedRect(M, boxY, leftW, inspH, 8, 8, 'FD')
  const pad = 12, colGap = 10
  const colW = (leftW - 2 * pad - colGap) / 2
  inspectionData.forEach((it, i) => {
    const col = i % 2
    const row = Math.floor(i / 2)
    const colStart = M + pad + col * (colW + colGap)
    const iy = boxY + 16 + row * 15
    const st = inspectionStatus(it.status)
    drawInspIcon(doc, it.item, colStart + 5, iy - 3.2, 9)
    // item label (left, truncated so it never collides with the status)
    text(INK); doc.setFont('helvetica', 'normal'); doc.setFontSize(8)
    doc.text(it.item, colStart + 16, iy, { maxWidth: colW - 16 - 46 })
    // status label (right-aligned within the column)
    text(st.color); doc.setFont('helvetica', 'bold'); doc.setFontSize(7.6)
    doc.text(st.label, colStart + colW, iy, { align: 'right' })
  })

  // Payment summary (right)
  let ry = y
  fill(WHITE); stroke(BORDER); doc.setLineWidth(0.8)
  doc.roundedRect(rightX, ry, rightW, summaryH, 8, 8, 'FD')
  const sumLine = (label: string, value: string, opts: { bold?: boolean } = {}) => {
    doc.setFont('helvetica', opts.bold ? 'bold' : 'normal'); doc.setFontSize(10); text(INK)
    doc.text(label, rightX + 14, ry)
    doc.text(value, rightX + rightW - 14, ry, { align: 'right' })
    ry += 16
  }
  ry += 20
  const subtotal = data.grandTotal - data.cgst - data.sgst + data.discount
  sumLine('Sub Total', money(subtotal))
  if (data.discount) sumLine('Discount', `- ${money(data.discount)}`)
  if (company.gst_enabled) {
    sumLine(`CGST ${company.cgst_percent}%`, money(data.cgst))
    sumLine(`SGST ${company.sgst_percent}%`, money(data.sgst))
  }
  // GRAND TOTAL red band
  ry += 4
  fill(RED); doc.rect(rightX, ry - 2, rightW, 26, 'F')
  text(WHITE); doc.setFont('helvetica', 'bold'); doc.setFontSize(11)
  doc.text('GRAND TOTAL', rightX + 14, ry + 15)
  doc.text(money(data.grandTotal), rightX + rightW - 14, ry + 15, { align: 'right' })
  ry += 34
  sumLine('Paid', money(data.paid))
  text(data.balance > 0 ? RED : INK)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10)
  doc.text('Balance', rightX + 14, ry)
  doc.text(money(data.balance), rightX + rightW - 14, ry, { align: 'right' })

  // Payment mode card (right, below summary)
  const pmY = y + summaryH + 10
  fill(WHITE); stroke(BORDER); doc.setLineWidth(0.8)
  doc.roundedRect(rightX, pmY, rightW, payModeH, 8, 8, 'FD')
  fill(RED); doc.circle(rightX + 18, pmY + 18, 7.5, 'F')
  text(WHITE); doc.setFont('helvetica', 'bold'); doc.setFontSize(8.8); doc.text('Rs', rightX + 18, pmY + 22, { align: 'center' })
  text(RED); doc.setFont('helvetica', 'bold'); doc.setFontSize(10)
  doc.text('PAYMENT MODE', rightX + 36, pmY + 22)
  const status = data.paymentStatus ?? (data.balance <= 0 ? 'Paid' : data.paid > 0 ? 'Partial' : 'Pending')
  const pmLine = (i: number, label: string, value: string) => {
    const yy = pmY + 40 + i * 14
    text(GREY); doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
    doc.text(label, rightX + 14, yy)
    doc.text(':', rightX + 92, yy)
    text(INK); doc.setFont('helvetica', 'bold')
    doc.text(value, rightX + 100, yy)
  }
  pmLine(0, 'Mode', data.paymentMode || 'Cash')
  pmLine(1, 'Date', data.date)
  pmLine(2, 'Status', status)

  y = Math.max(y + inspH, pmY + payModeH) + 16

  // -------------------------------------------------- NOTES + SIGNATURE
  text(RED); doc.setFont('helvetica', 'bold'); doc.setFontSize(10)
  doc.text('NOTE:', M, y)
  text(GREY); doc.setFont('helvetica', 'normal'); doc.setFontSize(8.6)
  const notes = (company.terms || 'Goods once sold will not be taken back.\nWarranty as per manufacturer terms.').split('\n')
  notes.forEach((n, i) => doc.text(`•  ${n}`, M, y + 16 + i * 12, { maxWidth: CW * 0.55 }))
  // Signature (right)
  stroke([180, 180, 180]); doc.setLineWidth(0.7)
  doc.line(rightX, y + 26, rightX + rightW, y + 26)
  text(INK); doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5)
  doc.text('Authorised Signature', rightX + rightW, y + 40, { align: 'right' })

  // -------------------------------------------------------------- FOOTER
  drawFooter(doc, W, H, M)

  return doc
}

// --------------------------------------------------------------- helpers
function sectionBar(doc: jsPDF, x: number, y: number, w: number, title: string) {
  doc.setFillColor(INK[0], INK[1], INK[2])
  doc.roundedRect(x, y, w, 26, 6, 6, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(title, x + 14, y + 17.5)
}

function drawInfoCard(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  title: string,
  icon: 'person' | 'car',
  rows: [string, string][],
) {
  doc.setFillColor(LIGHT[0], LIGHT[1], LIGHT[2])
  doc.setDrawColor(BORDER[0], BORDER[1], BORDER[2])
  doc.setLineWidth(0.8)
  doc.roundedRect(x, y, w, h, 8, 8, 'FD')
  // black title tag
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  const tagW = doc.getTextWidth(title) + 22
  doc.setFillColor(INK[0], INK[1], INK[2])
  doc.roundedRect(x + 14, y - 9, tagW, 18, 5, 5, 'F')
  doc.setTextColor(255, 255, 255)
  doc.text(title, x + 14 + tagW / 2, y + 3, { align: 'center' })
  // icon box
  doc.setFillColor(CHARCOAL[0], CHARCOAL[1], CHARCOAL[2])
  doc.roundedRect(x + 14, y + 20, 34, 40, 6, 6, 'F')
  if (icon === 'person') personGlyph(doc, x + 31, y + 40)
  else carGlyph(doc, x + 31, y + 41)
  // rows
  const tx = x + 60
  doc.setFontSize(9)
  rows.forEach((r, i) => {
    const ry = y + 24 + i * 12
    doc.setTextColor(GREY[0], GREY[1], GREY[2])
    doc.setFont('helvetica', 'normal')
    doc.text(r[0], tx, ry)
    doc.text(':', tx + 48, ry)
    doc.setTextColor(INK[0], INK[1], INK[2])
    doc.setFont('helvetica', 'bold')
    doc.text(r[1], tx + 56, ry, { maxWidth: w - (tx - x) - 62 })
  })
}

function personGlyph(doc: jsPDF, cx: number, cy: number) {
  doc.setFillColor(255, 255, 255)
  doc.circle(cx, cy - 6, 4.5, 'F')
  // shoulders
  doc.roundedRect(cx - 8, cy, 16, 9, 4, 4, 'F')
}

function carGlyph(doc: jsPDF, cx: number, cy: number) {
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(cx - 11, cy - 4, 22, 8, 3, 3, 'F') // body
  doc.roundedRect(cx - 6, cy - 9, 12, 6, 2, 2, 'F') // cabin
  doc.setFillColor(CHARCOAL[0], CHARCOAL[1], CHARCOAL[2])
  doc.circle(cx - 6, cy + 5, 2.4, 'F')
  doc.circle(cx + 6, cy + 5, 2.4, 'F')
  doc.setFillColor(255, 255, 255)
  doc.circle(cx - 6, cy + 5, 1.1, 'F')
  doc.circle(cx + 6, cy + 5, 1.1, 'F')
}

/** Subtle side-view car silhouette used in the dark header panel. */
function carSilhouette(doc: jsPDF, x: number, baseline: number, width: number, color: RGB) {
  const u = width / 78
  doc.setFillColor(color[0], color[1], color[2])
  doc.roundedRect(x, baseline - 14 * u, 62 * u, 12 * u, 5 * u, 5 * u, 'F') // body
  doc.roundedRect(x + 14 * u, baseline - 24 * u, 30 * u, 12 * u, 4 * u, 4 * u, 'F') // cabin
  doc.setFillColor(20, 24, 30)
  doc.circle(x + 16 * u, baseline, 6 * u, 'F')
  doc.circle(x + 48 * u, baseline, 6 * u, 'F')
  doc.setFillColor(color[0], color[1], color[2])
  doc.circle(x + 16 * u, baseline, 2.6 * u, 'F')
  doc.circle(x + 48 * u, baseline, 2.6 * u, 'F')
}

/**
 * Small monochrome inspection icon drawn with vector primitives (jsPDF can't
 * render the Lucide React components). Centred at (cx, cy), fits a box of `s`.
 * Mirrors the icons used on the Inspection Checklist page.
 */
function drawInspIcon(doc: jsPDF, item: string, cx: number, cy: number, s: number) {
  const r = s / 2
  const C: RGB = [55, 62, 74]
  doc.setDrawColor(C[0], C[1], C[2])
  doc.setFillColor(C[0], C[1], C[2])
  doc.setLineWidth(0.7)
  const ring = (rr: number) => doc.circle(cx, cy, rr, 'S')

  switch (item) {
    case 'Engine Oil': // oil drop
      doc.triangle(cx, cy - r, cx - r * 0.62, cy + r * 0.15, cx + r * 0.62, cy + r * 0.15, 'F')
      doc.circle(cx, cy + r * 0.35, r * 0.62, 'F')
      break
    case 'Coolant': // flask
      doc.line(cx - 1.3, cy - r, cx - 1.3, cy - r * 0.1)
      doc.line(cx + 1.3, cy - r, cx + 1.3, cy - r * 0.1)
      doc.triangle(cx - r, cy + r, cx + r, cy + r, cx, cy - r * 0.1, 'S')
      doc.line(cx - r * 0.5, cy - r, cx + r * 0.5, cy - r)
      break
    case 'Battery':
      doc.roundedRect(cx - r, cy - r * 0.55, 2 * r, r * 1.2, 1, 1, 'S')
      doc.rect(cx - r * 0.4, cy - r * 0.55 - 1.4, r * 0.8, 1.4, 'F')
      doc.line(cx, cy - r * 0.2, cx, cy + r * 0.35)
      doc.line(cx - r * 0.28, cy + r * 0.07, cx + r * 0.28, cy + r * 0.07)
      break
    case 'Tyres':
      ring(r); ring(r * 0.42)
      break
    case 'Brakes':
      ring(r); ring(r * 0.35)
      for (let a = 0; a < 4; a++) {
        const t = (a * Math.PI) / 2 + Math.PI / 4
        doc.circle(cx + Math.cos(t) * r * 0.68, cy + Math.sin(t) * r * 0.68, 0.5, 'F')
      }
      break
    case 'Lights':
      doc.circle(cx, cy - r * 0.25, r * 0.72, 'S')
      doc.line(cx - r * 0.4, cy + r * 0.55, cx + r * 0.4, cy + r * 0.55)
      doc.line(cx - r * 0.3, cy + r * 0.82, cx + r * 0.3, cy + r * 0.82)
      break
    case 'Horn':
      doc.triangle(cx - r, cy - r * 0.55, cx - r, cy + r * 0.55, cx + r * 0.5, cy, 'F')
      doc.rect(cx + r * 0.5, cy - 1, r * 0.5, 2, 'F')
      break
    case 'AC':
      doc.line(cx, cy - r, cx, cy + r)
      doc.line(cx - r * 0.87, cy - r * 0.5, cx + r * 0.87, cy + r * 0.5)
      doc.line(cx - r * 0.87, cy + r * 0.5, cx + r * 0.87, cy - r * 0.5)
      break
    case 'Suspension': {
      let px = cx, py = cy - r
      const zig: [number, number][] = [
        [cx + r * 0.75, cy - r * 0.55], [cx - r * 0.75, cy - r * 0.1],
        [cx + r * 0.75, cy + r * 0.35], [cx - r * 0.75, cy + r * 0.6], [cx, cy + r],
      ]
      zig.forEach((p) => { doc.line(px, py, p[0], p[1]); px = p[0]; py = p[1] })
      break
    }
    case 'Steering':
      ring(r); ring(r * 0.22)
      doc.line(cx, cy, cx, cy - r)
      doc.line(cx, cy, cx - r * 0.87, cy + r * 0.5)
      doc.line(cx, cy, cx + r * 0.87, cy + r * 0.5)
      break
    case 'Clutch':
    case 'Gearbox':
      doc.circle(cx, cy, r * 0.62, 'S')
      for (let a = 0; a < 8; a++) {
        const t = (a * Math.PI) / 4
        doc.line(cx + Math.cos(t) * r * 0.62, cy + Math.sin(t) * r * 0.62, cx + Math.cos(t) * r, cy + Math.sin(t) * r)
      }
      if (item === 'Gearbox') doc.circle(cx, cy, r * 0.22, 'S')
      else doc.circle(cx, cy, r * 0.15, 'F')
      break
    case 'Wipers':
      doc.line(cx - r * 0.8, cy + r * 0.85, cx + r * 0.7, cy - r * 0.7)
      doc.circle(cx - r * 0.8, cy + r * 0.85, 1, 'F')
      doc.line(cx + r * 0.2, cy - r * 0.9, cx + r * 0.9, cy - r * 0.35)
      break
    case 'Fluid Leakage': {
      const drop = (dx: number, dy: number, rr: number) => {
        doc.triangle(dx, dy - rr, dx - rr * 0.6, dy + rr * 0.15, dx + rr * 0.6, dy + rr * 0.15, 'F')
        doc.circle(dx, dy + rr * 0.35, rr * 0.6, 'F')
      }
      drop(cx - r * 0.45, cy - r * 0.1, r * 0.62)
      drop(cx + r * 0.5, cy + r * 0.25, r * 0.5)
      break
    }
    case 'Body Damage': // mini side-view car
      doc.roundedRect(cx - r, cy - r * 0.1, 2 * r, r * 0.7, 1.5, 1.5, 'S')
      doc.roundedRect(cx - r * 0.5, cy - r * 0.6, r, r * 0.55, 1, 1, 'S')
      doc.circle(cx - r * 0.5, cy + r * 0.62, r * 0.28, 'F')
      doc.circle(cx + r * 0.5, cy + r * 0.62, r * 0.28, 'F')
      break
    case 'Interior Condition': // seat
      doc.roundedRect(cx - r * 0.75, cy - r, r * 0.5, r * 1.5, 1, 1, 'S') // backrest
      doc.roundedRect(cx - r * 0.75, cy + r * 0.35, r * 1.5, r * 0.5, 1, 1, 'S') // seat base
      break
    default:
      doc.circle(cx, cy, r * 0.5, 'F')
  }
}

function drawFooter(doc: jsPDF, W: number, H: number, M: number) {
  const items = [
    ['Expert Technicians', 'Skilled & Experienced'],
    ['Genuine Spare Parts', 'Quality You Can Trust'],
    ['Best Price Guarantee', 'Affordable & Transparent'],
    ['Customer Satisfaction', 'Our Top Priority'],
  ]
  const bandH = 30
  const benY = H - bandH - 40
  const colW = (W - 2 * M) / items.length
  items.forEach((it, i) => {
    const x = M + i * colW
    doc.setFillColor(RED[0], RED[1], RED[2])
    doc.circle(x + 9, benY + 6, 6.5, 'F')
    doc.setTextColor(INK[0], INK[1], INK[2])
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.6)
    doc.text(it[0], x + 22, benY + 4)
    doc.setTextColor(GREY[0], GREY[1], GREY[2])
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.6)
    doc.text(it[1], x + 22, benY + 14)
  })
  // dark slogan band
  doc.setFillColor(INK[0], INK[1], INK[2])
  doc.rect(0, H - bandH, W, bandH, 'F')
  doc.setTextColor(RED[0], RED[1], RED[2])
  doc.setFont('helvetica', 'bolditalic')
  doc.setFontSize(14)
  doc.text('Drive Safe, We Care!', W / 2, H - bandH / 2 + 5, { align: 'center' })
}

export async function downloadInvoicePdf(company: CompanySettings, data: InvoicePdfData) {
  const doc = await buildInvoicePdf(company, data)
  doc.save(`${data.invoiceNo}.pdf`)
}

/** Build the invoice PDF as a Blob (for the Web Share API / manual attach). */
export async function invoicePdfBlob(company: CompanySettings, data: InvoicePdfData): Promise<Blob> {
  const doc = await buildInvoicePdf(company, data)
  return doc.output('blob')
}
