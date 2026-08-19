// Converts a legacy customer/service-history spreadsheet into a one-time SQL import script.
// Usage: node scripts/excel-to-sql.js <path-to-xlsx> [batchTag]
//   (no args -> defaults to velcare_two_sheets_combined.xlsx, batch tag derived from filename)
// Run manually, review the generated SQL file, then execute it against Supabase.
//
// Designed to be run once per source file. Each run is namespaced by a batch tag (derived from
// the filename unless overridden) so placeholder reg numbers / job card / invoice numbers never
// collide with a previous run's, even if run against the same live database.
//
// Source sheet quirks handled here:
// - "Description N" text is almost always blank while "Price N" is filled; the real item name
//   lives in the positionally-matching "Part Description N" column. Each (Description||Part
//   Description, Price) pair becomes one invoice line item.
// - "Total" frequently exceeds the sum of the 4 price slots (unlisted extra charges in the
//   original paper records) — the difference is added as an "Other charges (legacy total)" line
//   so the invoice grand total always matches the source Total exactly.
// - Some rows have NO name/mobile/make at all but DO have price/part data — these are a second
//   (or third...) visit continuing the identity established by the nearest preceding row that had
//   one, not a new customer. They reuse that customer + vehicle and just add another job
//   card/invoice.
// - No registration numbers, dates, or reliable model names exist in the sheet, so vehicles get a
//   placeholder reg number and job cards/invoices get a backdated (2020) import date so the app's
//   "newest first" ordering always puts real/new data above this imported data — flagged in the
//   report.
// - Customers with a real phone number are inserted via INSERT ... WHERE NOT EXISTS keyed on that
//   phone, and referenced downstream via a subquery — so if the same phone already exists (a
//   previous legacy batch, or a genuine live customer), no duplicate customer row is created.

import XLSX from 'xlsx'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SRC = process.argv[2] || path.join(__dirname, '..', 'velcare_two_sheets_combined.xlsx')
const BATCH =
  (process.argv[3] || path.basename(SRC, path.extname(SRC)))
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '')
    .slice(0, 12) || 'BATCH'
const OUT_SQL = path.join(__dirname, '..', 'supabase', `legacy_import_${BATCH.toLowerCase()}.sql`)
const OUT_REPORT = path.join(__dirname, `import-report-${BATCH.toLowerCase()}.txt`)

const ne = (v) => v !== '' && v !== null && v !== undefined
const str = (v) => (ne(v) ? String(v).trim() : '')
const num = (v) => {
  if (!ne(v)) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}
const esc = (v) => (v === null || v === undefined ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`)
const money = (n) => (n === null || n === undefined ? '0' : String(Math.round(n * 100) / 100))
const pad = (n, w) => String(n).padStart(w, '0')

// All legacy rows are backdated well before real app usage so that the app's default "newest
// first" list ordering naturally puts new/real data on top and this imported old data at the
// bottom. Each row gets its own second so ordering stays deterministic.
const LEGACY_BASE = Date.parse('2020-01-01T00:00:00Z')
let legacyClock = 0
function nextLegacyTs() {
  legacyClock += 1
  return new Date(LEGACY_BASE + legacyClock * 1000).toISOString()
}

function parsePhones(raw) {
  const s = str(raw)
  if (!s) return []
  return s
    .split(/[,/]| and /i)
    .map((p) => p.replace(/[^\d]/g, ''))
    .filter((p) => p.length >= 7)
}

function main() {
  if (!fs.existsSync(SRC)) {
    console.error(`Source file not found: ${SRC}`)
    process.exit(1)
  }
  const wb = XLSX.readFile(SRC)
  const sheetName = wb.SheetNames[0]
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, defval: '' })
  const data = rows.slice(1).filter((r) => str(r[0]) !== 'Customer Name') // drop stray repeated header rows

  const realPhoneCustomers = new Map() // phone -> { name, alt_phone, created_at }
  const placeholderCustomers = [] // { id, name, phone, created_at }
  const vehicles = []
  const jobCards = []
  const invoices = []
  const invoiceItems = []

  const blankRows = []
  const continuationRows = []
  const orphanContinuationRows = []
  const placeholderNameRows = []
  const placeholderPhoneRows = []
  const totalMismatchRows = []
  const zeroTotalRows = []

  let vehicleSeq = 0
  let jobSeq = 0
  let placeholderPhoneSeq = 0
  let active = null // { customerSqlRef, vehicleId }

  data.forEach((r, i) => {
    const rowNum = i + 2 // 1-based + header row
    const nameRaw = str(r[0])
    const makeRaw = str(r[2])
    const mobileRaw = str(r[1])
    const complaint = str(r[3]) || null

    const hasIdentity = !!(nameRaw || makeRaw || mobileRaw)
    const hasLineData =
      complaint ||
      ne(r[12]) ||
      [4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 15, 16].some((idx) => ne(r[idx]))

    if (!hasIdentity && !hasLineData) {
      blankRows.push(rowNum)
      return
    }

    const rowTs = nextLegacyTs()
    let vehicleId

    if (hasIdentity) {
      // --- establishes a new customer + vehicle identity ---
      const name = nameRaw || `Unknown Customer (${makeRaw})`
      if (!nameRaw) placeholderNameRows.push(rowNum)

      const phones = parsePhones(mobileRaw)
      let customerSqlRef
      if (phones[0]) {
        const phone = phones[0]
        const altPhone = phones[1] || null
        if (!realPhoneCustomers.has(phone)) {
          realPhoneCustomers.set(phone, { phone, name, alt_phone: altPhone, created_at: rowTs })
        }
        customerSqlRef = `(select id from customers where phone = ${esc(phone)} order by created_at asc limit 1)`
      } else {
        placeholderPhoneSeq += 1
        const placeholderPhone = `NA-${BATCH}-${pad(placeholderPhoneSeq, 4)}`
        placeholderPhoneRows.push(rowNum)
        const id = crypto.randomUUID()
        placeholderCustomers.push({ id, name, phone: placeholderPhone, alt_phone: null, created_at: rowTs })
        customerSqlRef = esc(id)
      }

      vehicleSeq += 1
      vehicleId = crypto.randomUUID()
      vehicles.push({
        id: vehicleId,
        customerSqlRef,
        reg_number: `LEGACY-${BATCH}-${pad(vehicleSeq, 4)}`,
        brand: makeRaw || null,
        created_at: rowTs,
      })

      active = { customerSqlRef, vehicleId }
    } else if (active) {
      // --- continuation row: another visit for the previously-established customer/vehicle ---
      continuationRows.push(rowNum)
      vehicleId = active.vehicleId
    } else {
      // --- orphan continuation row with no preceding identity to attach to ---
      orphanContinuationRows.push(rowNum)
      const id = crypto.randomUUID()
      placeholderPhoneSeq += 1
      const placeholderPhone = `NA-${BATCH}-${pad(placeholderPhoneSeq, 4)}`
      placeholderCustomers.push({ id, name: 'Unknown Customer', phone: placeholderPhone, alt_phone: null, created_at: rowTs })
      const customerSqlRef = esc(id)
      vehicleSeq += 1
      vehicleId = crypto.randomUUID()
      vehicles.push({
        id: vehicleId,
        customerSqlRef,
        reg_number: `LEGACY-${BATCH}-${pad(vehicleSeq, 4)}`,
        brand: null,
        created_at: rowTs,
      })
      active = { customerSqlRef, vehicleId }
    }

    // --- line items: (Description||Part Description, Price) x4 ---
    const items = []
    for (let slot = 0; slot < 4; slot++) {
      const descIdx = 4 + slot * 2
      const priceIdx = 5 + slot * 2
      const partIdx = 13 + slot
      const label = str(r[descIdx]) || str(r[partIdx])
      const price = num(r[priceIdx]) || 0
      if (label || price) {
        items.push({
          name: label || `Item ${slot + 1}`,
          price,
          kind: /^labour$/i.test(label) ? 'labour' : 'service',
        })
      }
    }
    const sumPrices = items.reduce((s, x) => s + x.price, 0)
    const totalRaw = num(r[12])
    const grandTotal = totalRaw !== null ? totalRaw : sumPrices
    const diff = Math.round((grandTotal - sumPrices) * 100) / 100
    if (diff > 0.5) {
      items.push({ name: 'Other charges (legacy total)', price: diff, kind: 'service' })
      totalMismatchRows.push(rowNum)
    }
    if (grandTotal <= 0) zeroTotalRows.push(rowNum)

    // --- job card + invoice (paired, mirrors the app's own auto-job-card-on-invoice flow) ---
    jobSeq += 1
    const jobcardNo = `JC-OLD-${BATCH}-${pad(jobSeq, 4)}`
    const invoiceNo = `INV-OLD-${BATCH}-${pad(jobSeq, 4)}`
    const jobCardId = crypto.randomUUID()
    const invoiceId = crypto.randomUUID()
    const customerSqlRef = active.customerSqlRef

    jobCards.push({
      id: jobCardId,
      jobcard_no: jobcardNo,
      customerSqlRef,
      vehicle_id: vehicleId,
      complaints: complaint,
      grand_total: grandTotal,
      notes: 'Imported from legacy records — original visit date unknown.',
      received_at: rowTs,
      created_at: rowTs,
    })

    invoices.push({
      id: invoiceId,
      invoice_no: invoiceNo,
      customerSqlRef,
      vehicle_id: vehicleId,
      job_card_id: jobCardId,
      subtotal: grandTotal,
      grand_total: grandTotal,
      paid: grandTotal,
      created_at: rowTs,
    })

    items.forEach((it) => {
      invoiceItems.push({
        id: crypto.randomUUID(),
        invoice_id: invoiceId,
        kind: it.kind,
        name: it.name,
        price: it.price,
      })
    })
  })

  // --- SQL generation ---
  const lines = []
  lines.push('-- ============================================================================')
  lines.push('-- Legacy customer/service history import (generated by scripts/excel-to-sql.js)')
  lines.push(`-- Source: ${path.basename(SRC)}, sheet "${sheetName}" — batch tag "${BATCH}"`)
  lines.push('-- Review this file before running it. Not part of the numbered migration chain —')
  lines.push('-- run once manually in the Supabase SQL editor (or `supabase db execute -f ...`).')
  lines.push('-- ============================================================================')
  lines.push('begin;')
  lines.push('')

  if (realPhoneCustomers.size) {
    lines.push('-- Real-phone customers: skipped automatically if that phone already exists.')
    for (const c of realPhoneCustomers.values()) {
      lines.push(
        `insert into customers (id, name, phone, alt_phone, created_at, updated_at)\n` +
          `  select gen_random_uuid(), ${esc(c.name)}, ${esc(c.phone)}, ${esc(c.alt_phone)}, ${esc(
            c.created_at
          )}, ${esc(c.created_at)}\n` +
          `  where not exists (select 1 from customers where phone = ${esc(c.phone)});`
      )
    }
    lines.push('')
  }

  if (placeholderCustomers.length) {
    lines.push('insert into customers (id, name, phone, alt_phone, created_at, updated_at) values')
    lines.push(
      placeholderCustomers
        .map(
          (c) =>
            `  (${esc(c.id)}, ${esc(c.name)}, ${esc(c.phone)}, ${esc(c.alt_phone)}, ${esc(c.created_at)}, ${esc(
              c.created_at
            )})`
        )
        .join(',\n') + ';'
    )
    lines.push('')
  }

  if (vehicles.length) {
    lines.push('insert into vehicles (id, customer_id, reg_number, brand, created_at, updated_at) values')
    lines.push(
      vehicles
        .map(
          (v) =>
            `  (${esc(v.id)}, ${v.customerSqlRef}, ${esc(v.reg_number)}, ${esc(v.brand)}, ${esc(
              v.created_at
            )}, ${esc(v.created_at)})`
        )
        .join(',\n') + ';'
    )
    lines.push('')
  }

  if (jobCards.length) {
    lines.push(
      "insert into job_cards (id, jobcard_no, customer_id, vehicle_id, complaints, status, services_total, grand_total, notes, received_at, created_at, updated_at) values"
    )
    lines.push(
      jobCards
        .map(
          (j) =>
            `  (${esc(j.id)}, ${esc(j.jobcard_no)}, ${j.customerSqlRef}, ${esc(j.vehicle_id)}, ${esc(
              j.complaints
            )}, 'delivered', ${money(j.grand_total)}, ${money(j.grand_total)}, ${esc(j.notes)}, ${esc(
              j.received_at
            )}, ${esc(j.created_at)}, ${esc(j.created_at)})`
        )
        .join(',\n') + ';'
    )
    lines.push('')
  }

  if (invoices.length) {
    lines.push(
      "insert into invoices (id, invoice_no, customer_id, vehicle_id, job_card_id, subtotal, grand_total, paid, balance, status, created_at, updated_at) values"
    )
    lines.push(
      invoices
        .map(
          (inv) =>
            `  (${esc(inv.id)}, ${esc(inv.invoice_no)}, ${inv.customerSqlRef}, ${esc(inv.vehicle_id)}, ${esc(
              inv.job_card_id
            )}, ${money(inv.subtotal)}, ${money(inv.grand_total)}, ${money(inv.paid)}, 0, 'paid', ${esc(
              inv.created_at
            )}, ${esc(inv.created_at)})`
        )
        .join(',\n') + ';'
    )
    lines.push('')
  }

  if (invoiceItems.length) {
    lines.push('insert into invoice_items (id, invoice_id, kind, name, qty, price, gst, amount) values')
    lines.push(
      invoiceItems
        .map(
          (it) =>
            `  (${esc(it.id)}, ${esc(it.invoice_id)}, ${esc(it.kind)}, ${esc(it.name)}, 1, ${money(
              it.price
            )}, 0, ${money(it.price)})`
        )
        .join(',\n') + ';'
    )
    lines.push('')
  }

  lines.push('commit;')
  fs.writeFileSync(OUT_SQL, lines.join('\n'), 'utf8')

  // --- report ---
  const report = []
  report.push(`Legacy import report — batch "${BATCH}" — ${new Date().toISOString()}`)
  report.push(`Source: ${SRC}`)
  report.push('')
  report.push(`Rows in sheet (excluding header): ${data.length}`)
  report.push(`Fully blank spacer rows skipped: ${blankRows.length} -> rows ${blankRows.join(', ') || '-'}`)
  report.push(
    `Continuation rows (2nd+ visit for the nearest preceding customer, no new customer/vehicle created): ${continuationRows.length} -> rows ${continuationRows.join(', ') || '-'}`
  )
  report.push(
    `Orphan continuation rows (price data but no preceding identity to attach to — created as standalone "Unknown Customer"): ${orphanContinuationRows.length} -> rows ${orphanContinuationRows.join(', ') || '-'}`
  )
  report.push(`Distinct real-phone customers: ${realPhoneCustomers.size} (auto-skipped if phone already exists in the DB)`)
  report.push(`Placeholder-phone customers created: ${placeholderCustomers.length}`)
  report.push(`Vehicles created: ${vehicles.length} (placeholder reg numbers LEGACY-${BATCH}-####, one per identity row)`)
  report.push(`Job cards / invoices created: ${jobCards.length}`)
  report.push(`Invoice line items created: ${invoiceItems.length}`)
  report.push('')
  report.push(
    `Rows with placeholder name "Unknown Customer (Make)" (no name in sheet, only Make): ${placeholderNameRows.length} -> rows ${placeholderNameRows.join(', ') || '-'}`
  )
  report.push(
    `Rows with placeholder phone NA-${BATCH}-####... (no phone in sheet): ${placeholderPhoneRows.length} -> rows ${placeholderPhoneRows.join(', ') || '-'}`
  )
  report.push(
    `Rows where Total > sum of the 4 priced items (difference added as "Other charges (legacy total)"): ${totalMismatchRows.length} -> rows ${totalMismatchRows.join(', ') || '-'}`
  )
  report.push(`Rows with zero grand total (no price data at all): ${zeroTotalRows.length} -> rows ${zeroTotalRows.join(', ') || '-'}`)
  report.push('')
  report.push('Known gaps (source sheet limitation, not a script bug):')
  report.push(`- No vehicle registration numbers in the source -> placeholder LEGACY-${BATCH}-#### used, fix per-vehicle later.`)
  report.push('- No visit dates in the usable columns -> every legacy row is stamped with a synthetic, strictly-increasing timestamp starting 2020-01-01 (one second apart, in original sheet row order) purely so the app\'s "newest first" list ordering puts real/new data on top and this imported data at the bottom.')
  report.push('- Item classification (service vs spare part vs labour) is not reliable from free text -> defaulted to "service" except literal "Labour" entries.')
  report.push('- Real-phone customers are inserted only if that phone does not already exist anywhere in the customers table, so re-running this against a DB that already has overlapping customers (e.g. from another legacy batch) will not create duplicates — but it also means if two DIFFERENT people in this sheet share a mistyped/reused phone number, they will be merged into one customer record.')

  fs.writeFileSync(OUT_REPORT, report.join('\n'), 'utf8')

  console.log(report.join('\n'))
  console.log('')
  console.log(`SQL written to: ${OUT_SQL}`)
  console.log(`Report written to: ${OUT_REPORT}`)
}

main()
