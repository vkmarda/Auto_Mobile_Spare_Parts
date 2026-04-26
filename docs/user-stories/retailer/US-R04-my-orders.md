# US-R04 — My Orders (Order Tracking)

**Page:** `/orders`
**Role:** Retailer
**Last Updated:** 2026-04-26

---

## Context
My Orders is the retailer's post-purchase hub. It shows every order placed, filterable by
status. Each order card expands to reveal a visual status timeline, item list, and
contextual action buttons — confirming delivery, requesting returns, or cancelling pending orders.

---

## User Stories

---

### US-R04-01 — View All My Orders

**As a** retailer,
**I want to** see all my orders in one place with their current status,
**So that** I can track which ones are pending, dispatched, or delivered.

**Priority:** P1 — Critical

#### Acceptance Criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC-01 | I open My Orders | — | I see a list of all my orders with: order number, status badge, vendor name, date, and unit count |
| AC-02 | I view the summary row | — | I see pills showing: Total orders, Pending count, and "To confirm" (delivered but not yet confirmed) |
| AC-03 | I click "Details ↓" on an order | — | The card expands to show a status timeline, all items, any notes, and available action buttons |
| AC-04 | I click "Hide ↑" | — | The card collapses |
| AC-05 | I have no orders | — | An empty state is shown with a "Browse Products" link |

---

### US-R04-02 — Filter Orders by Status

**As a** retailer,
**I want to** filter my orders by status,
**So that** I can quickly find orders that need my attention (e.g., delivered orders awaiting confirmation).

**Priority:** P2 — High

#### Acceptance Criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC-01 | I view the page | — | Status filter tabs are shown with counts: All, Pending, Accepted, Dispatched, Delivered, Confirmed, Rejected, Returns, Cancelled |
| AC-02 | I click "Delivered" | — | Only delivered orders are shown |
| AC-03 | I click "Returns" | — | Orders with any return-related status are shown |
| AC-04 | I click "All" | — | All orders are shown |

---

### US-R04-03 — View Order Status Timeline

**As a** retailer,
**I want to** see a visual timeline of where my order is in the fulfilment process,
**So that** I can understand what has happened and what comes next without contacting the vendor.

**Priority:** P2 — High

#### Acceptance Criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC-01 | I expand an order card | — | A 5-step timeline is shown: Placed → Accepted / Rejected → Dispatched → Delivered → Confirmed |
| AC-02 | An order is dispatched | I view the timeline | The "Dispatched" step is filled/highlighted; the previous steps show timestamps |
| AC-03 | An order is rejected | I view the timeline | The "Accepted/Rejected" step shows "Rejected" with the rejection reason |
| AC-04 | An order has timestamps | I view the timeline | Each completed step shows the date and time it occurred |

---

### US-R04-04 — Confirm Receipt of a Delivered Order

**As a** retailer,
**I want to** confirm that I have received my order,
**So that** the vendor is notified and the order moves to "Confirmed" status.

**Priority:** P1 — Critical

#### Acceptance Criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC-01 | An order has status "delivered" | I expand the card | A green "Confirm Receipt" button is shown |
| AC-02 | I click "Confirm Receipt" | — | A confirmation modal asks me to confirm |
| AC-03 | I confirm | — | The order status changes to "confirmed", the button disappears, and the timeline updates |
| AC-04 | An order is not in "delivered" status | I view the card | The "Confirm Receipt" button is not shown |

---

### US-R04-05 — Request a Return on a Confirmed Order

**As a** retailer,
**I want to** request a return for items I received that are wrong, damaged, or surplus,
**So that** the vendor can arrange a pickup and process a credit.

**Priority:** P2 — High

#### Acceptance Criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC-01 | An order has status "confirmed" | I expand the card | A "Request Return" button is shown |
| AC-02 | I click "Request Return" | — | A return form opens inside the card allowing me to: select which items to return, enter a reason, and upload 1–5 photos |
| AC-03 | I submit the return without selecting items | — | Submission is blocked; I must select at least one item |
| AC-04 | I submit without a reason | — | Submission is blocked; reason is required |
| AC-05 | I submit without at least one photo | — | Submission is blocked; minimum 1 photo is required |
| AC-06 | I submit a valid return request | — | A return is created with status "return_requested" and the form closes |
| AC-07 | Photos are being uploaded | I view the form | A progress indicator is shown and the submit button is disabled |
| AC-08 | Return quantities exceed original order quantities | I set a return quantity | The input is capped at the originally ordered quantity for each item |

---

### US-R04-06 — Cancel a Pending Order

**As a** retailer,
**I want to** cancel an order that has not yet been accepted,
**So that** I can correct a mistake or remove an order I no longer need.

**Priority:** P2 — High

#### Acceptance Criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC-01 | An order has status "pending" | I expand the card | A "Cancel Order" button is shown |
| AC-02 | I click "Cancel Order" | — | A confirmation modal asks me to confirm the cancellation |
| AC-03 | I confirm | — | The order is cancelled, the status updates, and the order is removed from the "Pending" tab |
| AC-04 | An order has any status other than "pending" | I view the card | No "Cancel Order" button is shown |

---

### US-R04-07 — Cancel a Return Request

**As a** retailer,
**I want to** cancel a return request I raised if I change my mind,
**So that** I can withdraw a request before the vendor has acted on it.

**Priority:** P3 — Medium

#### Acceptance Criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC-01 | A return has status "return_requested" | I view the linked order card | A "Cancel Return" button is shown |
| AC-02 | I confirm cancellation | — | The return is cancelled and the order returns to "confirmed" status |
| AC-03 | A return has moved past "return_requested" | I view the card | The "Cancel Return" button is not shown |

---

### US-R04-08 — Quick Reorder from a Past Order

**As a** retailer,
**I want to** add all items from a past order to my cart in one click,
**So that** I can reorder quickly without going through the full wizard again.

**Priority:** P2 — High

#### Acceptance Criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC-01 | I expand an order card | — | A "Reorder" button is visible |
| AC-02 | I click "Reorder" | — | All items from that order are added to the cart and I am navigated to /cart |

---

### US-R04-09 — Understand Order Status Labels

**As a** retailer,
**I want to** read an explanation of each order status,
**So that** I know what each status means without needing to contact the vendor.

**Priority:** P3 — Medium

#### Acceptance Criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC-01 | I view the My Orders page | — | A collapsible "What do statuses mean?" section is shown near the top |
| AC-02 | I expand it | — | Each status is listed with a plain-language description of what it means |
| AC-03 | I collapse it | — | It hides and the order list has more vertical space |
