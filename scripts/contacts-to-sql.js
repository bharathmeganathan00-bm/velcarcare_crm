// Matches contacts_extracted.xlsx (a raw phone-contacts export) against existing CRM customers by
// name, to backfill the placeholder phone numbers assigned during the legacy job-card imports
// (customers whose name is a bare code like "C60" because the original paper record had no phone).
// Usage: node scripts/contacts-to-sql.js <path-to-xlsx>
//
// Design notes:
// - The source file mixes real customers (named like "C37 Celerio Doctor", "C67 Indica EB" — the
//   leading C## code is what actually got stored as the customer's name during import) with
//   vendors/mechanics/shops ("Priya Traders", "Gas Welding Suresh", "Addblue Pump KPM", ...). Only
//   414 of 665 rows are C##-coded; the rest are plain names, almost all of which are clearly not
//   customers on inspection.
// - Matching happens live in SQL (name equality against the `customers` table at execution time),
//   not against a local snapshot, since this script has no direct database access.
// - C##-code matches are high confidence (that exact code is how the customer was named on import,
//   collision with an unrelated vendor is effectively impossible). Plain-name matches are lower
//   confidence (a vendor could coincidentally share a customer's literal name) and are emitted in
//   a clearly separate, labeled block of the SQL so they can be reviewed/skipped independently.
// - Only customers with a placeholder phone (phone LIKE 'NA%', matching both the older bare
//   "NA0001" style and the batch-namespaced "NA-ATS2-0001" style) are updated — a real phone number
//   already on file is never overwritten.
// - Rows whose phone number doesn't normalize to a plausible 10-digit Indian mobile (garbled
//   OCR/export artifacts like "703-405-502") are skipped and reported, not guessed at.
// - Codes/names with more than one conflicting phone number in the source file are skipped and
//   reported for manual resolution rather than picking one arbitrarily.

import XLSX from 'xlsx'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SRC = process.argv[2] || path.join(__dirname, '..', 'contacts_extracted.xlsx')
const OUT_SQL = path.join(__dirname, '..', 'supabase', 'legacy_contacts_backfill.sql')
const OUT_REPORT = path.join(__dirname, 'contacts-backfill-report.txt')

const ne = (v) => v !== '' && v !== null && v !== undefined
const str = (v) => (ne(v) ? String(v).trim() : '')
const esc = (v) => `'${String(v).replace(/'/g, "''")}'`

const CODE_RE = /^C\s*-?\s*(\d+)\b/i

function normalizePhone(raw) {
  const digits = str(raw).replace(/[^0-9]/g, '')
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2)
  if (digits.length === 10) return digits
  return null
}

function main() {
  if (!fs.existsSync(SRC)) {
    console.error(`Source file not found: ${SRC}`)
    process.exit(1)
  }
  const wb = XLSX.readFile(SRC)
  const sheetName = wb.SheetNames[0]
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, defval: '' })
  const data = rows.slice(1).filter((r) => str(r[1]))

  const codeGroups = new Map() // 'C60' -> [{ name, phone1raw, phone2raw, rowNum }]
  const nameGroups = new Map() // 'PLAIN NAME' -> [...]

  const invalidPhoneRows = []

  data.forEach((r, i) => {
    const rowNum = i + 2
    const name = str(r[1])
    const phone1raw = r[2]
    const phone2raw = r[3]
    if (!normalizePhone(phone1raw)) {
      invalidPhoneRows.push({ rowNum, name, phone1raw })
      return
    }
    const m = name.match(CODE_RE)
    if (m) {
      const code = `C${m[1]}`
      if (!codeGroups.has(code)) codeGroups.set(code, [])
      codeGroups.get(code).push({ name, phone1raw, phone2raw, rowNum })
    } else {
      const key = name.toUpperCase()
      if (!nameGroups.has(key)) nameGroups.set(key, [])
      nameGroups.get(key).push({ name, phone1raw, phone2raw, rowNum })
    }
  })

  function resolve(groups) {
    const clean = []
    const conflicts = []
    for (const [key, entries] of groups) {
      const phones = new Set(entries.map((e) => normalizePhone(e.phone1raw)))
      if (phones.size > 1) {
        conflicts.push({ key, entries })
      } else {
        const e = entries[0]
        clean.push({
          key,
          phone: normalizePhone(e.phone1raw),
          altPhone: normalizePhone(e.phone2raw),
          sourceRows: entries.map((x) => x.rowNum),
        })
      }
    }
    return { clean, conflicts }
  }

  const codeResolved = resolve(codeGroups)
  const nameResolved = resolve(nameGroups)

  // --- SQL generation ---
  const lines = []
  lines.push('-- ============================================================================')
  lines.push('-- Backfill placeholder customer phone numbers from contacts_extracted.xlsx')
  lines.push('-- Review this file before running it. Not part of the numbered migration chain —')
  lines.push('-- run once manually in the Supabase SQL editor (or `supabase db execute -f ...`).')
  lines.push('-- Matching happens live against whatever is currently in `customers` — only rows')
  lines.push("-- with a placeholder phone (phone LIKE 'NA%') are touched; real numbers are never")
  lines.push('-- overwritten.')
  lines.push('-- ============================================================================')
  lines.push('begin;')
  lines.push('')

  lines.push('-- ---- HIGH CONFIDENCE: matched by customer code (e.g. "C60") ----')
  codeResolved.clean.forEach(({ key, phone, altPhone }) => {
    if (altPhone) {
      lines.push(
        `update customers set phone = ${esc(phone)}, alt_phone = coalesce(alt_phone, ${esc(
          altPhone
        )}), updated_at = now() where upper(trim(name)) = ${esc(key)} and phone like 'NA%';`
      )
    } else {
      lines.push(
        `update customers set phone = ${esc(phone)}, updated_at = now() where upper(trim(name)) = ${esc(
          key
        )} and phone like 'NA%';`
      )
    }
  })
  lines.push('')

  lines.push('-- ---- LOWER CONFIDENCE: matched by exact plain customer name ----')
  lines.push('-- Review this block before running — most plain names in the source file are')
  lines.push('-- vendors/mechanics, not customers, but an exact name match against a customer')
  lines.push('-- with a placeholder phone is very unlikely to be coincidental. Comment out any')
  lines.push('-- lines you are not confident about.')
  nameResolved.clean.forEach(({ key, phone, altPhone }) => {
    if (altPhone) {
      lines.push(
        `update customers set phone = ${esc(phone)}, alt_phone = coalesce(alt_phone, ${esc(
          altPhone
        )}), updated_at = now() where upper(trim(name)) = ${esc(key)} and phone like 'NA%';`
      )
    } else {
      lines.push(
        `update customers set phone = ${esc(phone)}, updated_at = now() where upper(trim(name)) = ${esc(
          key
        )} and phone like 'NA%';`
      )
    }
  })
  lines.push('')

  lines.push('commit;')
  fs.writeFileSync(OUT_SQL, lines.join('\n'), 'utf8')

  // --- report ---
  const report = []
  report.push(`Contacts backfill report — ${new Date().toISOString()}`)
  report.push(`Source: ${SRC}`)
  report.push('')
  report.push(`Rows with a name (excluding header): ${data.length}`)
  report.push(`Rows with an unparseable phone number (skipped): ${invalidPhoneRows.length}`)
  if (invalidPhoneRows.length) {
    report.push(
      invalidPhoneRows.map((r) => `  row ${r.rowNum}: "${r.name}" phone="${r.phone1raw}"`).join('\n')
    )
  }
  report.push('')
  report.push(`Distinct C##-code customers matched (high confidence): ${codeResolved.clean.length}`)
  report.push(`C##-code entries with conflicting phone numbers in the source (skipped, needs manual review): ${codeResolved.conflicts.length}`)
  codeResolved.conflicts.forEach((c) => {
    report.push(`  ${c.key}: ${c.entries.map((e) => `"${e.name}" -> ${e.phone1raw} (row ${e.rowNum})`).join(' vs ')}`)
  })
  report.push('')
  report.push(`Distinct plain-name customers matched (lower confidence): ${nameResolved.clean.length}`)
  report.push(`Plain names with conflicting phone numbers in the source (skipped): ${nameResolved.conflicts.length}`)
  nameResolved.conflicts.forEach((c) => {
    report.push(`  "${c.key}": ${c.entries.map((e) => `${e.phone1raw} (row ${e.rowNum})`).join(' vs ')}`)
  })
  report.push('')
  report.push('IMPORTANT: the counts above are candidate matches found in the source file, not')
  report.push('guaranteed hits — the actual number of customers updated depends on how many of')
  report.push('these names/codes exist in the live `customers` table with a placeholder phone')
  report.push('when the SQL is run (each UPDATE only affects rows matching both conditions).')

  fs.writeFileSync(OUT_REPORT, report.join('\n'), 'utf8')

  console.log(report.join('\n'))
  console.log('')
  console.log(`SQL written to: ${OUT_SQL}`)
  console.log(`Report written to: ${OUT_REPORT}`)
}

main()
