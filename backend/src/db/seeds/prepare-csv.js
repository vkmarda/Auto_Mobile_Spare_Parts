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
  'clutch': 'clutch-plate',
  'air filter': 'filters',
  'oil filter': 'filters',
  'fuel filter': 'filters',
  'filter': 'filters',
  'spark plug': 'engine',
  'carburetor': 'carburetor',
  'brake shoe': 'brakes',
  'brake disc': 'brakes',
  'brake pad': 'brakes',
  'brake': 'brakes',
  'tyre': 'tyre',
  'tire': 'tyre',
  'battery': 'electrical',
  'led bulb': 'electrical',
  'bulb': 'electrical',
  'cdi': 'electrical',
  'rectifier': 'electrical',
  'horn': 'electrical',
  'wiring': 'electrical',
  'switch': 'electrical',
  'indicator': 'electrical',
  'headlight': 'headlight',
  'head light': 'headlight',
  'fog lamp': 'headlight',
  'tail light': 'headlight',
  'speedometer': 'speedometer',
  'meter': 'speedometer',
  'suspension': 'suspension',
  'drive belt': 'transmission',
  'variator': 'transmission',
  'transmission': 'transmission',
  'timing chain': 'engine',
  'piston': 'engine',
  'engine': 'engine',
  'radiator': 'cooling',
  'thermostat': 'cooling',
  'coolant': 'cooling',
  'body': 'body',
  'panel': 'body',
  'mudguard': 'body',
  'tank cover': 'body',
  'seat': 'body',
  'mirror': 'body',
  'stand': 'body',
  'handle bar': 'body',
  'footrest': 'body',
}



function generateSKU(brand, productType, index) {
  const b = (brand || 'GEN').replace(/\s+/g, '').substring(0, 4).toUpperCase()
  const t = (productType || 'PART').replace(/\s+/g, '').substring(0, 4).toUpperCase()
  const n = String(index).padStart(5, '0')
  return `PRZ-${b}-${t}-${n}`
}

function cleanText(val, maxLen = 500) {
  if (!val) return ''
  return val.toString().trim()
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

  const sku = generateSKU(
    record['Vendor / Part Brand'],
    record['Product Type'],
    counter
  )

 

  const name = cleanText(
    record['Product Title'] || record['Part Name'] || 'Unknown',
    500
  )
  const description = cleanText(record['Description'], 2000)
  const imageUrl = record['First Image URL']?.toString().trim() || ''
  const brand = cleanText(record['Vendor / Part Brand'], 100)
  const vehicleBrand = cleanText(record['Vehicle Brand'], 100)
  const vehicleModel = cleanText(record['Vehicle Model'], 100)
  const modelVariant = cleanText(record['Model Variant'], 100)
  const vehicleType = cleanText(record['Vehicle Type'], 100)
  const emissionStd = cleanText(record['Emission Standard'], 50)
  const tags = cleanText(record['Tags'], 500)
  const sourceUrl = cleanText(record['Product URL'], 500)
  const partName = cleanText(record['Part Name'], 300)
  const productType = cleanText(record['Product Type'], 200)

  rows.push({
    name,
    sku,
    description,
    image_url: imageUrl,
    brand,
    vehicle_brand: vehicleBrand,
    vehicle_model: vehicleModel,
    model_variant: modelVariant,
    vehicle_type_detail: vehicleType,
    emission_standard: emissionStd,
    tags,
    source_url: sourceUrl,
    part_name: partName,
    product_type: productType,
    handle,
  })

  counter++
}

// Write CSV
const headers = Object.keys(rows[0])
const csvLines = [
  headers.join(','),
  ...rows.map(row =>
    headers.map(h => `"${(row[h] || '').toString().replace(/"/g, '""')}"`).join(',')
  )
]

const outputPath = path.join(__dirname, 'products-import.csv')
fs.writeFileSync(outputPath, csvLines.join('\n'), 'utf-8')

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log(`✅ Prepared: ${rows.length} products`)
console.log(`⏭️  Skipped:  ${skipped} duplicates`)
console.log(`📄 Output:   src/db/seeds/products-import.csv`)
