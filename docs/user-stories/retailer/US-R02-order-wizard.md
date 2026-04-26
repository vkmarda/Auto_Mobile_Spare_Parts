# US-R02 — Order Wizard (Vehicle Type → Brand → Model)

**Pages:** `/order/vehicle-type`, `/order/brand`, `/order/model`
**Role:** Retailer
**Last Updated:** 2026-04-26

---

## Context
Before browsing parts, retailers must identify the vehicle they are ordering for.
The wizard is a 3-step flow: select vehicle type (Bike / Scooter), then brand (Honda, Yamaha, etc.),
then model. Each step cascades into the next and the selected context is carried forward to the
product list. A breadcrumb lets users jump back without losing context.

---

## User Stories

---

### US-R02-01 — Select Vehicle Type (Step 1)

**As a** retailer,
**I want to** choose the type of vehicle (Bike or Scooter) at the start of the ordering flow,
**So that** the subsequent brand and model options are relevant to what my customer drives.

**Priority:** P1 — Critical

#### Acceptance Criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC-01 | I open the vehicle type step | — | I see large selectable buttons for each vehicle type (e.g., Bike 🏍️, Scooter 🛵) with a name and subtitle |
| AC-02 | I click a vehicle type | — | The button highlights (blue border + blue background) and I am automatically navigated to the brand step after a brief delay |
| AC-03 | I click Back | — | I return to the retailer landing page |
| AC-04 | I type in the search bar at the top | — | I am navigated to the Search Results page with the typed query |
| AC-05 | Vehicle types are loading | — | The buttons show a skeleton placeholder |

---

### US-R02-02 — Select a Brand (Step 2)

**As a** retailer,
**I want to** choose the vehicle's manufacturer from a list filtered to the selected vehicle type,
**So that** I only see brands relevant to the type I selected.

**Priority:** P1 — Critical

#### Acceptance Criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC-01 | I arrive at the brand step | — | A progress bar shows "Step 2 of 3" with Vehicle ✓ checked; I see the selected vehicle type in the breadcrumb |
| AC-02 | I view the brand grid | — | Brands are shown with name, product count, and brand-specific colour coding (e.g., Honda = red, Yamaha = blue) |
| AC-03 | I type in the brand search field | — | The brand grid filters in real-time to brands whose name contains the typed text |
| AC-04 | I click a brand | — | It highlights and I navigate to the model step |
| AC-05 | I click Back or click the vehicle-type breadcrumb | — | I return to the vehicle type step |
| AC-06 | I arrive without a vehicle type selected | — | I am redirected back to the vehicle type step |

---

### US-R02-03 — Select a Model (Step 3)

**As a** retailer,
**I want to** pick the exact vehicle model after choosing the brand,
**So that** only compatible spare parts are shown on the next screen.

**Priority:** P1 — Critical

#### Acceptance Criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC-01 | I arrive at the model step | — | A progress bar shows "Step 3 of 3" with Vehicle ✓ and Brand ✓; I see the selected brand in the breadcrumb |
| AC-02 | I view the model list | — | Each row shows model name and part count (right-aligned), styled as a tappable list row |
| AC-03 | I type in the model search field | — | The list filters in real-time to matching model names |
| AC-04 | I click a model | — | The vehicle selection (type + brand + model) is saved to localStorage and I am navigated to /products |
| AC-05 | The vehicle is saved to localStorage | — | It appears as a "saved vehicle" chip on the retailer landing page on future visits (max 3 stored) |
| AC-06 | I click Back or click a breadcrumb | — | I return to the brand step with the brand still selected |
| AC-07 | I arrive without a brand selected | — | I am redirected back to the brand step |
