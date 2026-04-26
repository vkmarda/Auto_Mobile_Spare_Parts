# US-R01 — Retailer Landing Page

**Page:** `/retailer`
**Role:** Retailer
**Last Updated:** 2026-04-26

---

## Context
The Retailer Landing page is the home screen after login. Its purpose is to get the retailer
to the right action as fast as possible — whether that's starting a new order, continuing
with a saved vehicle, quickly reordering the same items as last time, or checking on an
existing order's status.

---

## User Stories

---

### US-R01-01 — Start a New Order by Browsing Parts

**As a** retailer,
**I want to** start a new order by selecting my vehicle type, brand, and model,
**So that** I can browse parts specifically compatible with my customer's vehicle.

**Priority:** P1 — Critical

#### Acceptance Criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC-01 | I am on the landing page | I click "Select Part" | I am taken to the vehicle type selection step (/order/vehicle-type) |
| AC-02 | I view the "Place New Order" section | — | Two options are clearly displayed: "Select Part" (amber/primary) and "Add Photo" (secondary) |

---

### US-R01-02 — Quickly Reorder Using a Saved Vehicle

**As a** retailer,
**I want to** select a vehicle I've ordered for previously without going through the full wizard,
**So that** I save time on repeat orders for the same bike or scooter.

**Priority:** P2 — High

#### Acceptance Criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC-01 | I have previously ordered parts for a vehicle | I view the landing page | A "Saved Vehicles" section shows chips for up to 3 recent vehicles (vehicleType + brand + model) |
| AC-02 | I click a saved vehicle chip | — | I am taken directly to the product list for that vehicle, skipping the wizard |
| AC-03 | I have never ordered before | I view the landing page | The saved vehicles section is not shown |

---

### US-R01-03 — Quick Reorder from Last Order

**As a** retailer,
**I want to** reorder the same items from my most recent order with a single click,
**So that** I can place repeat orders without browsing the catalog again.

**Priority:** P2 — High

#### Acceptance Criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC-01 | I have at least one past order | I view the landing page | A "Quick Reorder" section shows the last order number and item count |
| AC-02 | I click "Reorder" | — | All items from the last order are added to the cart and I am taken to /cart |
| AC-03 | I have no past orders | — | The Quick Reorder section is not shown |

---

### US-R01-04 — Navigate to Order Tracking

**As a** retailer,
**I want to** go to my order history from the home screen,
**So that** I can check whether my pending orders have been accepted or dispatched.

**Priority:** P1 — Critical

#### Acceptance Criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC-01 | I am on the landing page | I click "Track My Orders" | I am taken to /orders (MyOrders page) |
