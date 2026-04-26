# User Stories — Purzaa Parts Order Platform

## Overview
This folder contains user stories, acceptance criteria, and non-functional requirements for all pages
in the Purzaa B2B spare parts ordering platform.

---

## Roles
| Role | Description |
|---|---|
| **Vendor** | Supplier who lists products, reviews orders, dispatches, manages returns |
| **Retailer** | Buyer who browses parts, places orders, tracks delivery, requests returns |

---

## Document Index

### Vendor Flow
| File | Page | Summary |
|---|---|---|
| [US-V01 — Pending Orders](vendor/US-V01-pending-orders.md) | VendorHome | Accept/reject individual and bulk orders; handle return requests |
| [US-V02 — Dispatch](vendor/US-V02-dispatch.md) | VendorDispatch | Create dispatches by city, track delivery, print manifests |
| [US-V03 — Returns](vendor/US-V03-returns.md) | VendorReturns | Process inbound return requests; accept, settle, track |
| [US-V04 — Order History](vendor/US-V04-order-history.md) | VendorOrders | Search, filter, and export full order history |
| [US-V05 — Products](vendor/US-V05-products.md) | VendorProducts | Manage spare parts catalog (add, edit, stock status) |
| [US-V06 — Dashboard](vendor/US-V06-dashboard.md) | VendorDashboard | KPIs, demand trends, charts, bulk actions |
| [US-V07 — Retailers](vendor/US-V07-retailers.md) | VendorRetailers + VendorRetailerDetail | Browse and inspect retail partner profiles |

### Retailer Flow
| File | Page | Summary |
|---|---|---|
| [US-R01 — Landing](retailer/US-R01-landing.md) | RetailerLanding | Home screen; start order, quick reorder, track orders |
| [US-R02 — Order Wizard](retailer/US-R02-order-wizard.md) | VehicleTypeStep + BrandStep + ModelStep | 3-step vehicle selection before browsing parts |
| [US-R03 — Product List & Cart](retailer/US-R03-product-list-cart.md) | ProductList + Cart | Browse parts, add to cart, place order |
| [US-R04 — My Orders](retailer/US-R04-my-orders.md) | MyOrders | Track orders, confirm receipt, request/cancel returns |
| [US-R05 — Photo Order](retailer/US-R05-photo-order.md) | PhotoOrderPage | Order unknown parts via photo upload |
| [US-R06 — Search](retailer/US-R06-search.md) | SearchResults | Search parts by name or SKU across catalog |

### Non-Functional Requirements
| File | Scope |
|---|---|
| [NFR.md](NFR.md) | Platform-wide performance, security, accessibility, reliability |

---

## Story ID Convention
- `US-V##` — Vendor stories
- `US-R##` — Retailer stories
- `AC-##` — Acceptance Criteria (numbered within each story)
- `NFR-##` — Non-Functional Requirements

## Priority Scale
| Label | Meaning |
|---|---|
| **P1 — Critical** | Core functionality; platform unusable without it |
| **P2 — High** | Important workflow; significant user impact |
| **P3 — Medium** | Improves efficiency or UX; workaround exists |
| **P4 — Low** | Nice-to-have; minimal user impact |
