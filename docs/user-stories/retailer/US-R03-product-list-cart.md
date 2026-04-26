# US-R03 — Product List & Cart

**Pages:** `/products`, `/cart`
**Role:** Retailer
**Last Updated:** 2026-04-26

---

## Context
After completing the vehicle selection wizard, the retailer lands on the product list where
they browse parts compatible with their vehicle. They add items to a cart (managed in
React state + localStorage), adjust quantities, add order notes, and place the order.
Cart state persists across page refreshes until the order is placed.

---

## User Stories

---

### US-R03-01 — Browse Parts for a Selected Vehicle

**As a** retailer,
**I want to** browse all spare parts available for my selected vehicle,
**So that** I can find what my customer needs and add it to my order.

**Priority:** P1 — Critical

#### Acceptance Criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC-01 | I arrive from the model step | — | I see a product grid with all parts compatible with the selected vehicle type, brand, and model |
| AC-02 | I view the breadcrumb | — | It shows clickable links: Vehicle Type › Brand › Model, allowing me to jump back to any step |
| AC-03 | I click "Change Vehicle" | — | I am taken back to the vehicle type step and the order flow context is reset |
| AC-04 | I view the category pill bar | — | I see "All Parts" and one pill per category present in the results, each showing a product count |
| AC-05 | I click a category pill | — | The product grid filters to only show products in that category |
| AC-06 | I click "All Parts" | — | The filter is cleared and all products are shown |

---

### US-R03-02 — Search for a Part by Name or SKU

**As a** retailer,
**I want to** search within the product list by name or SKU,
**So that** I can quickly find a specific part without scrolling through all results.

**Priority:** P2 — High

#### Acceptance Criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC-01 | I type in the search bar | — | The product grid filters in real-time to items whose name, part name, or SKU contains the typed text |
| AC-02 | I combine search and category filter | — | Both filters are applied together (AND logic) |
| AC-03 | No products match | — | An empty state is shown |
| AC-04 | I clear the search field | — | All products (within the active category) are shown again |

---

### US-R03-03 — Add a Part to the Cart

**As a** retailer,
**I want to** add a part to my cart,
**So that** I can accumulate all the items I need before placing the order.

**Priority:** P1 — Critical

#### Acceptance Criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC-01 | I click "Add to Cart" on a product | — | The item is added to the cart with a quantity of 1 |
| AC-02 | The item is already in the cart | I add it again | The quantity increments by 1 instead of creating a duplicate |
| AC-03 | I view the sticky bottom bar | — | A "View Cart (N)" button shows the total number of unique items in the cart |
| AC-04 | The cart is empty | I view the bottom bar | The "View Cart" button is disabled |

---

### US-R03-04 — Review and Adjust Cart Contents

**As a** retailer,
**I want to** review my cart items, adjust quantities, and remove items before placing my order,
**So that** I can ensure the order is accurate.

**Priority:** P1 — Critical

#### Acceptance Criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC-01 | I open the cart | — | I see all added items with product name, SKU, quantity adjuster, and a remove button |
| AC-02 | I click "+" on an item | — | The quantity increases by 1 |
| AC-03 | I click "−" on an item | — | The quantity decreases by 1 (minimum 1; the button is disabled at quantity = 1) |
| AC-04 | I click "✕" on an item | — | The item is removed from the cart |
| AC-05 | I view the order summary panel | — | It shows a list of all items with their quantities and the total item count |
| AC-06 | A vehicle was selected before browsing | I view the cart | A blue banner shows "Parts for: [VehicleType › Brand › Model]" |

---

### US-R03-05 — Add Order Notes

**As a** retailer,
**I want to** add notes to my order before placing it,
**So that** I can communicate special requirements to the vendor (e.g., delivery instructions).

**Priority:** P3 — Medium

#### Acceptance Criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC-01 | I view the order summary panel in the cart | — | A textarea is available labelled "Order notes (optional)" |
| AC-02 | I type a note | I place the order | The note is submitted with the order and visible to the vendor |

---

### US-R03-06 — Place an Order

**As a** retailer,
**I want to** place my order once I'm satisfied with my cart,
**So that** the vendor receives my request and can begin processing it.

**Priority:** P1 — Critical

#### Acceptance Criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC-01 | My cart has at least one item | I click "Place Order" | The order is submitted and a success screen appears |
| AC-02 | The order is submitted successfully | I view the success screen | I see a checkmark, the message "Order(s) Placed!", the order number(s) in badges, and a fulfilment timeline (Placed ✓ → Vendor confirms → Dispatched → Collect) |
| AC-03 | The order is placed | — | The cart is cleared from state and localStorage |
| AC-04 | I click "Track My Orders" on the success screen | — | I am taken to /orders |
| AC-05 | The cart is empty | I view the cart page | An empty state is shown with a "Browse Products" link |
| AC-06 | The order submission fails | — | An error message is shown and the cart is preserved so I can retry |
| AC-07 | The submission is in progress | I view the button | It shows a spinner and is disabled |
