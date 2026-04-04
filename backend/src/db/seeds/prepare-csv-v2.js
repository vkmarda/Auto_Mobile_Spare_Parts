const XLSX = require('xlsx')
const fs = require('fs')
const path = require('path')

const CATEGORY_MAP = {
  'fuel pump': 'fuel-pump-assembly',
  'shock absorber': 'shock-absorber',
  'chain sprocket': 'chain-sprocket',
  'chain & sprocket': 'chain-sprocket',
  'lock set': 'ignition-lock-set',
  'ignition': 'ignition-lock-set',
  'clutch plate': 'clutch-plate',
  'clutch assembly': 'clutch-assembly',
  'clutch': 'clutch-plate',
  'air filter': 'filters',
  'oil filter': 'filters',
  'fuel filter': 'filters',
  'filter': 'filters',
  'spark plug': 'engine',
  'carburetor': 'carburetor',
  'carburettor': 'carburetor',
  'brake shoe': 'brakes',
  'brake disc': 'brake-disc',
  'brake drum': 'brake-drum',
  'brake pad': 'brakes',
  'brake': 'brakes',
  'tyre': 'tyre',
  'tire': 'tyre',
  'battery': 'electrical',
  'led bulb': 'led-bulb',
  'bulb': 'led-bulb',
  'cdi': 'cdi',
  'tci': 'cdi',
  'rectifier': 'electrical',
  'horn': 'electrical',
  'wiring': 'wiring-harness',
  'switch': 'handle-bar-switch',
  'indicator': 'electrical',
  'head light': 'head-light',
  'headlight': 'head-light',
  'fog lamp': 'head-light',
  'tail light': 'tail-light',
  'speedometer': 'speedometer',
  'meter': 'speedometer',
  'suspension': 'shock-absorber',
  'fork': 'fork-assembly',
  'engine belt': 'engine-belt',
  'drive belt': 'engine-belt',
  'variator': 'transmission',
  'timing chain': 'engine',
  'piston': 'piston-kit',
  'engine': 'engine',
  'radiator': 'radiator',
  'silencer': 'silencer',
  'starter motor': 'starter-motor',
  'self': 'starter-motor',
  'panel': 'side-panel',
  'petrol tank': 'petrol-tank',
  'tank': 'petrol-tank',
  'rim': 'wheel-rim',
  'wheel': 'wheel-rim',
  'sticker': 'sticker-set',
}

function findCategorySlug(productType, partCategory) {
  const searchTerm = (productType || partCategory || '').toLowerCase()
  for (const [key, slug] of Object.entries(CATEGORY_MAP)) {
    if (searchTerm.includes(key)) return slug
  }
  return null
}

function generateSKU(productType, index) {
  const t = (productType || 'PART')
    .replace(/\s+/g, '')
    .substring(0, 5)
    .toUpperCase()
  const n = String(index).padStart(5, '0')
  return `PRZ-${t}-${n}`
}

function clean(val, maxLen = 500) {
  if (!val) return ''
  return val.toString().trim()
    .replace(/\r?\n/g, ' ')
    .replace(/"/g, '""')
    .substring(0, maxLen)
}

console.log('Reading Excel...')
const wb = XLSX.readFile(path.join(__dirname, 'eauto_products.xlsx'))
const ws = wb.Sheets[wb.SheetNames[0]]
const records = XLSX.utils.sheet_to_json(ws)
console.log(`Found ${records.length} rows`)

const seenHandles = new Set()
const rows = []
let skipped = 0
let counter = 1

for (const record of records) {
  const handle = record['Handle']?.toString().trim()
  if (!handle) { skipped++; continue }
  if (seenHandles.has(handle)) { skipped++; continue }
  seenHandles.add(handle)

  const productType = clean(record['Product Type'], 100)
  const categorySlug = findCategorySlug(
    productType,
    clean(record['Part Category'], 100)
  )

  const sku = generateSKU(productType, counter)
  const name = clean(
    record['Part Name'] || record['Product Title'] || 'Unknown Part',
    300
  )
  const description = clean(record['Description'], 2000)
  const imageUrl = record['First Image URL']?.toString().trim() || ''
  const sourceUrl = clean(record['Product URL'], 500)

  rows.push({
    name,
    sku,
    description,
    stock: 0,
    image_url: imageUrl,
    handle,
    source_url: sourceUrl,
    product_type: productType,
    category_slug: categorySlug || '',
    vehicle_brand: clean(record['Vehicle Brand'], 100),
    vehicle_model: clean(record['Vehicle Model'], 100),
    emission_standard: clean(record['Emission Standard'], 20),
    part_name: clean(record['Part Name'], 300),
    vehicle_type: clean(record['Vehicle Type'], 50),
    model_variant: clean(record['Model Variant'], 100),
  })

  counter++
}

// Write main products CSV
const headers = [
  'name', 'sku', 'description',
  'stock', 'image_url', 'handle',
  'source_url', 'product_type',
  'vehicle_brand', 'vehicle_model',
  'emission_standard', 'part_name',
  'vehicle_type', 'model_variant'
]

const csvLines = [
  headers.join(','),
  ...rows.map(row =>
    headers.map(h =>
      `"${(row[h] ?? '').toString().replace(/"/g, '""')}"`
    ).join(',')
  )
]

const outputPath = path.join(__dirname, 'products-v2.csv')
fs.writeFileSync(outputPath, csvLines.join('\n'), 'utf-8')

// Write category mapping CSV separately
// (used to update category_id after import via SQL)
const catHeaders = ['handle', 'category_slug']
const catLines = [
  catHeaders.join(','),
  ...rows
    .filter(r => r.category_slug)
    .map(r =>
      `"${r.handle.replace(/"/g, '""')}","${r.category_slug}"`
    )
]
const catPath = path.join(__dirname, 'category-mapping.csv')
fs.writeFileSync(catPath, catLines.join('\n'), 'utf-8')

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log(`✅ Products CSV: ${rows.length} rows`)
console.log(`⏭️  Skipped: ${skipped} duplicates`)
console.log(`📄 Output: products-v2.csv`)
console.log(`📄 Category map: category-mapping.csv`)
