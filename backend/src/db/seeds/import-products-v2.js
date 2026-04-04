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

function findCategoryId(productType, partCategory, categories) {
  const searchTerm = (productType || partCategory || '').toLowerCase()
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
    ) return cat.id
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

// Parse tags to extract vehicle models
// Tags look like: VehicleModel_CB Shine 125 BS6 (2020-Present)
function extractVehicleModels(tags) {
  if (!tags) return []
  const matches = tags.match(/VehicleModel_([^,]+)/g) || []
  return matches.map(m => m.replace('VehicleModel_', '').trim())
}

// Extract emission standard from model string
// e.g. "CB Shine 125 BS6 (2020-Present)" → "BS6"
function extractEmissionStd(modelStr) {
  if (modelStr.includes('BS6')) return 'BS6'
  if (modelStr.includes('BS4')) return 'BS4'
  if (modelStr.includes('BS3')) return 'BS3'
  return 'Any'
}

// Normalize model name for matching
// "CB Shine 125 BS6 (2020-Present)" → "cb shine 125"
function normalizeModelName(modelStr) {
  return modelStr
    .replace(/BS[346]/gi, '')
    .replace(/\([^)]+\)/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

async function importProducts() {
  console.log('Reading Excel file...')

  const wb = XLSX.readFile(
    path.join(__dirname, 'eauto_products.xlsx')
  )
  const ws = wb.Sheets[wb.SheetNames[0]]
  const records = XLSX.utils.sheet_to_json(ws)
  console.log(`Found ${records.length} rows`)

  // Load reference data
  const [catResult, modelResult, variantResult] = await Promise.all([
    query('SELECT id, name, slug FROM categories'),
    query(`
      SELECT m.id, m.name, m.slug, b.name AS brand_name
      FROM models m
      JOIN brands b ON b.id = m.brand_id
    `),
    query(`
      SELECT mv.id, mv.emission_standard, mv.engine_cc,
             m.name AS model_name, m.slug AS model_slug
      FROM model_variants mv
      JOIN models m ON m.id = mv.model_id
    `)
  ])

  const categories = catResult.rows
  const models = modelResult.rows
  const variants = variantResult.rows

  console.log(`Loaded: ${categories.length} categories, ${models.length} models, ${variants.length} variants`)

  const seenHandles = new Set()
  let imported = 0
  let skipped = 0
  let errors = 0
  let variantsLinked = 0

  for (let i = 0; i < records.length; i++) {
    const record = records[i]
    try {
      const handle = record['Handle']?.toString().trim()
      if (!handle) { skipped++; continue }
      if (seenHandles.has(handle)) { skipped++; continue }
      seenHandles.add(handle)

      const existing = await query(
        'SELECT id FROM products WHERE handle = $1', [handle]
      )
      if (existing.rows.length > 0) { skipped++; continue }

      const sku = generateSKU(record['Product Type'], imported + 1)
      const skuCheck = await query(
        'SELECT id FROM products WHERE sku = $1', [sku]
      )
      const finalSku = skuCheck.rows.length > 0
        ? `${sku}-${Date.now()}` : sku

      const categoryId = findCategoryId(
        record['Product Type']?.toString().trim(),
        record['Part Category']?.toString().trim(),
        categories
      )

      const imageUrl = record['First Image URL']?.toString().trim() || null
      const name = (
        record['Part Name']?.toString().trim() ||
        record['Product Title']?.toString().trim() ||
        'Unknown Part'
      ).substring(0, 300)

      const description = record['Description']?.toString()
        .trim().substring(0, 2000) || null
      const productType = record['Product Type']?.toString().trim() || null
      const sourceUrl = record['Product URL']?.toString().trim() || null

      const productResult = await query(`
        INSERT INTO products (
          name, sku, description, unit_price, stock,
          category_id, image_url, handle,
          source_url, product_type
        ) VALUES ($1,$2,$3,0,0,$4,$5,$6,$7,$8)
        RETURNING id
      `, [
        name, finalSku, description,
        categoryId, imageUrl, handle,
        sourceUrl, productType
      ])

      const productId = productResult.rows[0].id

      // Insert product images
      if (imageUrl) {
        const allImageUrls = record['All Image URLs']?.toString().trim()
        if (allImageUrls) {
          const urls = allImageUrls.split(' | ')
            .map(u => u.trim())
            .filter(u => u.startsWith('http'))
          for (let j = 0; j < urls.length; j++) {
            await query(`
              INSERT INTO product_images
                (product_id, image_url, is_primary, sort_order)
              VALUES ($1,$2,$3,$4)
              ON CONFLICT DO NOTHING
            `, [productId, urls[j], j === 0, j])
          }
        } else {
          await query(`
            INSERT INTO product_images
              (product_id, image_url, is_primary, sort_order)
            VALUES ($1,$2,true,0)
            ON CONFLICT DO NOTHING
          `, [productId, imageUrl])
        }
      }

      // Link to model variants using Tags column
      const vehicleModelTags = extractVehicleModels(
        record['Tags']?.toString()
      )

      for (const modelTag of vehicleModelTags) {
        const emissionStd = extractEmissionStd(modelTag)
        const normalizedTag = normalizeModelName(modelTag)

        // Find matching model
        const matchedModel = models.find(m => {
          const normalizedModel = m.name.toLowerCase()
          return normalizedTag.includes(normalizedModel) ||
                 normalizedModel.includes(normalizedTag.substring(0, 6))
        })

        if (matchedModel) {
          // Find matching variant
          const matchedVariant = variants.find(v =>
            v.model_slug === matchedModel.slug &&
            (v.emission_standard === emissionStd ||
             v.emission_standard === 'Any')
          )

          if (matchedVariant) {
            await query(`
              INSERT INTO product_variants
                (product_id, model_variant_id)
              VALUES ($1, $2)
              ON CONFLICT DO NOTHING
            `, [productId, matchedVariant.id])
            variantsLinked++
          }
        }
      }

      imported++
      if (imported % 200 === 0) {
        console.log(
          `✅ ${imported} imported | ` +
          `🔗 ${variantsLinked} variants linked | ` +
          `⏭️  ${skipped} skipped | ` +
          `❌ ${errors} errors`
        )
      }

    } catch (err) {
      errors++
      console.error(`Row ${i + 1}: ${err.message}`)
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('Import complete!')
  console.log(`✅ Imported:        ${imported}`)
  console.log(`🔗 Variants linked: ${variantsLinked}`)
  console.log(`⏭️  Skipped:         ${skipped}`)
  console.log(`❌ Errors:          ${errors}`)
  process.exit(0)
}

importProducts().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
