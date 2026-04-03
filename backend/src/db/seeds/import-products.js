const XLSX = require('xlsx')
const path = require('path')
const { query } = require('../../config/db')
require('dotenv').config({
  path: path.join(__dirname, '../../../.env')
})

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

function findCategoryId(productType, partCategory, categories) {
  const searchTerm = (
    productType || partCategory || ''
  ).toLowerCase()

  for (const [key, slug] of Object.entries(CATEGORY_MAP)) {
    if (searchTerm.includes(key)) {
      const cat = categories.find(c => c.slug === slug)
      if (cat) return cat.id
    }
  }

  for (const cat of categories) {
    if (
      searchTerm.includes(cat.name.toLowerCase()) ||
      cat.name.toLowerCase().includes(searchTerm)
    ) {
      return cat.id
    }
  }
  return null
}

function generateSKU(brand, productType, index) {
  const b = (brand || 'GEN')
    .replace(/\s+/g, '')
    .substring(0, 4)
    .toUpperCase()
  const t = (productType || 'PART')
    .replace(/\s+/g, '')
    .substring(0, 4)
    .toUpperCase()
  const n = String(index).padStart(5, '0')
  return `PRZ-${b}-${t}-${n}`
}

async function importProducts() {
  console.log('Reading Excel file...')

  const wb = XLSX.readFile(
    path.join(__dirname, 'eauto_products.xlsx')
  )
  const ws = wb.Sheets[wb.SheetNames[0]]
  const records = XLSX.utils.sheet_to_json(ws)

  console.log(`Found ${records.length} rows`)

  // Load categories
  const catResult = await query(
    'SELECT id, name, slug FROM categories'
  )
  const categories = catResult.rows
  console.log(`Loaded ${categories.length} categories`)

  const seenHandles = new Set()
  let imported = 0
  let skipped = 0
  let errors = 0

  for (let i = 0; i < records.length; i++) {
    const record = records[i]
    try {
      const handle = record['Handle']?.toString().trim()
      if (!handle) { skipped++; continue }

      // Skip duplicate handles
      if (seenHandles.has(handle)) { skipped++; continue }
      seenHandles.add(handle)

      // Skip if already exists
      const existing = await query(
        'SELECT id FROM products WHERE handle = $1',
        [handle]
      )
      if (existing.rows.length > 0) { skipped++; continue }

      // Generate SKU
      const sku = generateSKU(
        record['Vendor / Part Brand'],
        record['Product Type'],
        imported + 1
      )

      // Verify SKU uniqueness
      const skuCheck = await query(
        'SELECT id FROM products WHERE sku = $1',
        [sku]
      )
      const finalSku = skuCheck.rows.length > 0
        ? `${sku}-${Date.now()}`
        : sku

      // Category
      const categoryId = findCategoryId(
        record['Product Type']?.toString().trim(),
        record['Part Category']?.toString().trim(),
        categories
      )

      // Stock
      

      // Image — use Shopify CDN URL directly
      const imageUrl = record['First Image URL']?.toString()
        .trim() || null

      // All image URLs for product_images table
      const allImageUrls = record['All Image URLs']?.toString()
        .trim() || null

      // Clean fields
      const name = (
        record['Product Title']?.toString().trim() ||
        record['Part Name']?.toString().trim() ||
        'Unknown Product'
      ).substring(0, 500)

      const partName = record['Part Name']?.toString()
        .trim() || null
      const productType = record['Product Type']?.toString()
        .trim() || null
      const vehicleBrand = record['Vehicle Brand']?.toString()
        .trim() || null
      const vehicleModel = record['Vehicle Model']?.toString()
        .trim() || null
      const modelVariant = record['Model Variant']?.toString()
        .trim() || null
      const emissionStd = record['Emission Standard']?.toString()
        .trim() || null
      const vehicleType = record['Vehicle Type']?.toString()
        .trim() || null
      const brand = record['Vendor / Part Brand']?.toString()
        .trim() || null
      const tags = record['Tags']?.toString().trim() || null
      const sourceUrl = record['Product URL']?.toString()
        .trim() || null
      const description = record['Description']?.toString()
        .trim().substring(0, 2000) || null

      // Insert product
       const productResult = await query(`
        INSERT INTO products (
          name, sku, description,
          category_id, image_url, brand, vehicle_brand,
          vehicle_model, model_variant, vehicle_type_detail,
          emission_standard, tags, source_url,
          part_name, product_type, handle
        ) VALUES (
          $1,$2,$3,
          $4,$5,$6,$7,
          $8,$9,$10,
          $11,$12,$13,
          $14,$15,$16
        ) RETURNING id
      `, [
        name, finalSku, description,
        categoryId, imageUrl, brand, vehicleBrand,
        vehicleModel, modelVariant, vehicleType,
        emissionStd, tags, sourceUrl,
        partName, productType, handle
      ])

      const productId = productResult.rows[0].id

      // Insert product images
      if (allImageUrls) {
        const urls = allImageUrls.split(' | ')
          .map(u => u.trim())
          .filter(u => u.startsWith('http'))

        for (let j = 0; j < urls.length; j++) {
          await query(`
            INSERT INTO product_images
              (product_id, image_url, is_primary, sort_order)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT DO NOTHING
          `, [productId, urls[j], j === 0, j])
        }
      } else if (imageUrl) {
        await query(`
          INSERT INTO product_images
            (product_id, image_url, is_primary, sort_order)
          VALUES ($1, $2, true, 0)
          ON CONFLICT DO NOTHING
        `, [productId, imageUrl])
      }

      imported++

      if (imported % 200 === 0) {
        console.log(
          `✅ ${imported} imported | ` +
          `⏭️  ${skipped} skipped | ` +
          `❌ ${errors} errors`
        )
      }

    } catch (err) {
      errors++
      console.error(
        `Row ${i + 1} error: ${err.message}`
      )
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('Import complete!')
  console.log(`✅ Imported: ${imported}`)
  console.log(`⏭️  Skipped:  ${skipped}`)
  console.log(`❌ Errors:   ${errors}`)
  process.exit(0)
}

importProducts().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
