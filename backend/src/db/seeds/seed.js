require('dotenv').config();
const bcrypt = require('bcryptjs');
const { query } = require('../../config/db');

const VENDOR_PASSWORD = 'vendor123';
const RETAILER_PASSWORD = 'retailer123';

const products = [
  { name: 'Brake Pad Set',      sku: 'BP-001', description: null, stock: 100 },
  { name: 'Oil Filter',         sku: 'OF-002', description: null, stock: 200 },
  { name: 'Air Filter',         sku: 'AF-003', description: null, stock: 150 },
  { name: 'Spark Plug Set',     sku: 'SP-004', description: null, stock: 120 },
  { name: 'Clutch Plate',       sku: 'CP-005', description: null, stock: 50  },
  { name: 'Radiator Cap',       sku: 'RC-006', description: null, stock: 300 },
  { name: 'Timing Belt',        sku: 'TB-007', description: null, stock: 60  },
  { name: 'Fuel Filter',        sku: 'FF-008', description: null, stock: 180 },
  { name: 'Alternator Belt',    sku: 'AB-009', description: null, stock: 90  },
  { name: 'Coolant Reservoir',  sku: 'CR-010', description: null, stock: 75  },
];

async function seed() {
  // Vendor
  const vendorHash = await bcrypt.hash(VENDOR_PASSWORD, 10);
  await query(
    'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING',
    ['Main Vendor', 'vendor@parts.com', vendorHash, 'vendor']
  );
  console.log('Seeded: vendor@parts.com');

  // Retailers
  const retailerHash = await bcrypt.hash(RETAILER_PASSWORD, 10);
  for (let i = 1; i <= 10; i++) {
    await query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING',
      [`Retailer ${i}`, `retailer${i}@parts.com`, retailerHash, 'retailer']
    );
    console.log(`Seeded: retailer${i}@parts.com`);
  }

  // Products
  for (const p of products) {
    await query(
      'INSERT INTO products (name, sku, description, stock) VALUES ($1, $2, $3, $4) ON CONFLICT (sku) DO NOTHING',
      [p.name, p.sku, p.description, p.stock]
    );
    console.log(`Seeded product: ${p.name}`);
  }

  console.log('Seed complete.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
