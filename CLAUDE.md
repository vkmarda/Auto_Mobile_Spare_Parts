\# Parts Order Platform — MVP



\## Project Context



B2B order platform connecting 10 automobile spare parts retailers with 1 vendor.



\### Problem

Retailers order small quantities. Vendor prefers large orders.

This causes slow fulfillment, low fulfillment rate, high transport costs.



\### Solution

Platform where retailers place orders, vendor views and manages them,

with simple demand aggregation visibility (totals per product).



\---



\## Users

\- retailer: login, view products, cart, place order, view order status

\- vendor: login, view all orders, accept/reject, view demand summary

\- admin: read-only (optional)



\## Order Status Flow

pending → accepted / rejected



\---



\## Tech Stack

\- Backend: Node.js + Express + pg (raw SQL, NO ORM)

\- Frontend: React + Vite + Tailwind CSS

\- Database: PostgreSQL via Supabase

\- Auth: JWT + bcryptjs

\- Frontend hosting: Netlify

\- Backend hosting: Render



\---



\## Folder Structure



\### Backend: /backend

\- /src/config       → db.js, env.js

\- /src/middleware   → auth.js, requireRole.js, errorHandler.js

\- /src/routes       → auth, products, orders, vendor

\- /src/controllers  → auth, products, orders, vendor

\- /src/db/migrations → raw SQL files

\- /src/db/seeds      → seed users + products

\- app.js, server.js



\### Frontend: /frontend

\- React + Vite

\- /src/api           → client.js, auth.api.js, products.api.js, orders.api.js, vendor.api.js

\- /src/context       → AuthContext.jsx, CartContext.jsx

\- /src/pages         → Login, ProductList, Cart, MyOrders, VendorDashboard

\- /src/components    → Navbar, OrderCard, ProductCard, DemandSummaryTable



\---



\## Database Tables

\- users: id, name, email, password (bcrypt), role, created\_at

\- products: id, name, sku, description, unit\_price, stock, created\_at

\- orders: id, retailer\_id, status (pending/accepted/rejected), total\_amount, notes, created\_at, updated\_at

\- order\_items: id, order\_id, product\_id, quantity, unit\_price (snapshot), created\_at



\---



\## API Routes

POST   /api/v1/auth/login

GET    /api/v1/auth/me

GET    /api/v1/products

POST   /api/v1/products         (vendor only)

PUT    /api/v1/products/:id     (vendor only)

POST   /api/v1/orders           (retailer only)

GET    /api/v1/orders           (retailer = own, vendor = all)

GET    /api/v1/orders/:id

POST   /api/v1/orders/:id/accept  (vendor only)

POST   /api/v1/orders/:id/reject  (vendor only)

GET    /api/v1/vendor/demand      (vendor only)



\---



\## Rules — Claude Must Follow

\- NO ORM — raw pg queries only

\- Plain JavaScript — no TypeScript

\- Parameterized SQL queries only — never string interpolate

\- Keep files under 150 lines

\- No extra libraries without asking first

\- Cart lives in React state + localStorage (no cart table in DB)



\---



\## Build Plan

\- Week 1: Auth + Products (backend + frontend)

\- Week 2: Orders (place order, view orders)

\- Week 3: Vendor dashboard + demand aggregation summary



\---



\## Progress

\- \[x] Week 1: Auth + Products

\- \[x] Week 2: Orders

\- \[x] Week 3: Vendor Dashboard

\- \[x] Frontend

