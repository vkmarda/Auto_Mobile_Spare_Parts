# US-V02 — Dispatch Management (VendorDispatch)

**Page:** `/vendor/dispatch`
**Role:** Vendor
**Last Updated:** 2026-04-26

---

## Context
The Dispatch page lets vendors bundle accepted orders into named dispatches (grouped by destination city),
print manifests, track in-transit shipments, and mark deliveries complete. Return pickups are
automatically included when a dispatch is created for a city that has accepted return requests.

---

## User Stories

---

### US-V02-01 — View Orders Ready to Dispatch

**As a** vendor,
**I want to** see all accepted orders grouped by destination city,
**So that** I can plan and batch my deliveries efficiently.

**Priority:** P1 — Critical

#### Acceptance Criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC-01 | There are accepted orders | I open the Dispatch page | I see a "Ready to Dispatch" section with a table listing each accepted order: order number, retailer, city, item count |
| AC-02 | Accepted orders exist for multiple cities | I view the section | Below the table, city summary rows show total orders per city and a "Dispatch [City] Only" button |
| AC-03 | An accepted city also has accepted return requests | I view the city row | The row shows "+ N return(s)" in amber alongside the order count |
| AC-04 | No accepted orders exist | I open the page | An empty state is shown: "Nothing to dispatch — All accepted orders have been sent" |
| AC-05 | An accepted order has been waiting 3+ days | I view the page | An orange banner warns: "N accepted order(s) have been waiting 3+ days without dispatch" with the order numbers listed |

---

### US-V02-02 — Dispatch Orders to a Single City

**As a** vendor,
**I want to** dispatch all accepted orders destined for a specific city in one action,
**So that** I can create targeted shipments without affecting other cities.

**Priority:** P1 — Critical

#### Acceptance Criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC-01 | I click "Dispatch [City] Only" on a city row | — | A confirmation modal opens showing: city name, order count, retailer breakdown (name + order count each), return pickup count (if any), warning if unconfirmed prior deliveries exist |
| AC-02 | The modal is open | I click "Confirm Dispatch" | A dispatch is created, a success toast "Dispatch created: D-XXX" appears, and the dispatched orders disappear from "Ready to Dispatch" |
| AC-03 | The modal is open and there are unconfirmed prior deliveries to that city | I view the modal | A warning reads: "N previous delivery/ies to this city not yet confirmed by retailers" |
| AC-04 | The modal is open and returns need pickup | I view the modal | A note reads: "Also picking up N return(s)" |
| AC-05 | I click "Cancel" in the modal | — | The modal closes and no dispatch is created |

---

### US-V02-03 — Dispatch All Accepted Orders at Once

**As a** vendor,
**I want to** dispatch all accepted orders across all cities in one action,
**So that** I can process bulk outbound in a single step.

**Priority:** P2 — High

#### Acceptance Criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC-01 | Accepted orders exist | I click "Dispatch All" | A confirmation modal shows total order count and total dispatch count (one per city) |
| AC-02 | I confirm | — | Dispatches are created for each city, a toast lists all dispatch numbers, and the "Ready to Dispatch" section empties |
| AC-03 | The creation is in progress | I view the modal | The confirm button shows a spinner and text "Creating…" |

---

### US-V02-04 — View and Print a Dispatch Sheet

**As a** vendor,
**I want to** view and print the manifest for a specific dispatch,
**So that** the delivery driver has a clear list of orders and items to deliver.

**Priority:** P2 — High

#### Acceptance Criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC-01 | A dispatch exists in history | I click "View Sheet" | A modal opens showing dispatch number, city, date, and all orders with retailer names, phone numbers, and items with quantities |
| AC-02 | The sheet modal is loading | — | A spinner is shown inside the modal |
| AC-03 | I click "Print" on a dispatch card | — | A print-ready view of the dispatch sheet is triggered (browser print dialog) |
| AC-04 | The print data is loading | I view the Print button | It shows a spinner and "Preparing…" text, and is disabled |

---

### US-V02-05 — Mark a Dispatch as Delivered

**As a** vendor,
**I want to** mark a dispatched shipment as delivered once it has reached the retailer,
**So that** the retailer can confirm receipt and the order status updates accordingly.

**Priority:** P1 — Critical

#### Acceptance Criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC-01 | A dispatch has status "dispatched" | I view its card in Dispatch History | A green "Mark Delivered" button is visible |
| AC-02 | I click "Mark Delivered" | — | The dispatch status updates to "delivered", the button disappears, and a toast "Dispatch marked as delivered" appears |
| AC-03 | The mark-delivered action is in progress | I view the button | It shows a spinner and is disabled |
| AC-04 | A dispatch has been in "dispatched" state for 5+ days | I view the card | An orange warning banner appears: "Dispatched N days ago — delivery not yet confirmed" |

---

### US-V02-06 — Filter and Browse Dispatch History

**As a** vendor,
**I want to** filter past dispatches by destination city and browse them in chronological groups,
**So that** I can quickly find a specific shipment's status without scrolling through all records.

**Priority:** P3 — Medium

#### Acceptance Criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC-01 | Dispatch history has entries | I view the Dispatch History section | Dispatches are grouped by: "Today", "Yesterday", "Earlier" |
| AC-02 | I select a city from the filter dropdown | — | Only dispatches for that city are shown; the count badge updates |
| AC-03 | I click "Clear" next to the filter | — | All dispatches are shown again |
| AC-04 | I expand a dispatch card using "Details ↓" | — | All linked orders and any return pickups are listed with their statuses |

---

## Non-Functional Requirements

| ID | Category | Requirement |
|---|---|---|
| NFR-V02-01 | Performance | Dispatch creation must complete within 3 seconds including data refresh |
| NFR-V02-02 | Performance | Dispatch history must load within 2 seconds |
| NFR-V02-03 | Usability | Confirmation modals must always show what will be dispatched before the vendor commits |
| NFR-V02-04 | Usability | Print output must be legible in A4 format with no truncated content |
| NFR-V02-05 | Data Integrity | Creating a dispatch must atomically move all included orders to "dispatched" status |
| NFR-V02-06 | Security | Only vendors can create dispatches or mark deliveries |
| NFR-V02-07 | Reliability | If dispatch creation fails (e.g., no orders for city), a clear error is shown and no partial state is created |
