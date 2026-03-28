const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
require('dotenv').config({ path: envFile });

const required = ['DATABASE_URL', 'JWT_SECRET'];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const NODE_ENV = process.env.NODE_ENV || 'development';

if (NODE_ENV === 'production') {
  console.log('Environment: e3 (production)');
} else {
  console.log('Environment: e1 (local)');
}

module.exports = {
  PORT:         process.env.PORT || 4000,
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET:   process.env.JWT_SECRET,
  NODE_ENV,
};
