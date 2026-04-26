# US-V04 — Order History (VendorOrders)

**Page:** `/vendor/orders`
**Role:** Vendor
**Last Updated:** 2026-04-26

---

## Context
The Order History page provides vendors with a searchable, filterable view of every order ever placed
through the platform. Vendors can narrow results by status, retailer, city, date range, order/return
number, or product name. The page also supports CSV and PDF export for reporting and reconciliation.

---

## User Stories

---

### US-V04-01 — View Complete Order History

**As a** vendor,
**I want to** see all orders across every status in one consolidated table,
**So that** I have a single source of truth for all activity on the platform.

**Priority:** P1 — Critical

#### Acceptance Criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC-01 | I open the Orders page | — | A table shows all orders with columns: Order number, Retailer, City, Date, Status, Notes/Products, Return number (if linked) |
| AC-02 | An order has a linked return | I view the row | The return number is shown as a clickable amber badge in the Return column |
| AC-03 | An order was rejected | I view the Notes column | The rejection reason is displayed in red italic text |
| AC-04 | The page is loading | — | Skeleton placeholders are shown for the table rows |
| AC-05 | I click "Details" on an order | — | A modal opens showing the full order details: retailer info, items, dispatch, and timeline |
| AC-06 | I click a return number badge | — | A modal opens showing the return details |

---

### US-V04-02 — Filter Orders by Status

**As a** vendor,
**I want to** filter orders by their current status,
**So that** I can focus on a specific part of the fulfilment pipeline (e.g., all pending orders).

**Priority:** P2 — High

#### Acceptance Criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC-01 | I view the page | — | Status tabs are shown: All, Pending, Accepted, Dispatched, Delivered, Confirmed, Returned — each with a live count |
| AC-02 | I click the "Pending" tab | — | Only orders with status "pending" are shown in the table |
| AC-03 | I click the "Returned" tab | — | Orders with any return-related status (return_requested, return_accepted, etc.) are shown |
| AC-04 | I click "All" | — | All orders are shown regardless of status |

---

### US-V04-03 — Search and Filter Orders

**As a** vendor,
**I want to** search and filter by multiple criteria simultaneously,
**So that** I can find a specific order or group of orders quickly.

**Priority:** P2 — High

#### Acceptance Criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC-01 | I type in the Order/Return number field | — | The table instantly filters to orders or returns whose number starts with the typed prefix (case-insensitive) |
| AC-02 | I type in the Product Name field | — | Only orders containing that product name (partial match, case-insensitive) are shown |
| AC-03 | I select a retailer from the dropdown | — | Only orders from that retailer are shown |
| AC-04 | I select a city from the dropdown | — | Only orders with that destination city are shown |
| AC-05 | I set a date range | — | Only orders created between the "from" and "to" dates are shown (inclusive, "to" includes the full day) |
| AC-06 | Multiple filters are active | — | All active filters are applied with AND logic |
| AC-07 | I click "Clear filters" | — | All filters reset and the full list is restored |
| AC-08 | Filters are active | I view the table | A count shows "N order(s)" matching the current filters |

---

### US-V04-04 — Export Orders to CSV

**As a** vendor,
**I want to** export the currently filtered order list to a CSV file,
**So that** I can use it for reconciliation, reporting, or sharing with my team.

**Priority:** P2 — High

#### Acceptance Criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC-01 | I click "↓ CSV" | — | A CSV file is downloaded named `orders_YYYY-MM-DD.csv` |
| AC-02 | The CSV is opened | — | Each row includes: Order No, Retailer, Mobile, City, State, Date, Order Status, Brand, Model, Year, Product/Part, SKU, Qty, Return No, Ret Brand, Ret Model, Ret Product, Ret Qty, Return Status |
| AC-03 | An order has multiple items | I view the CSV | Each item is on its own row; the order-level columns repeat only on the first item row |
| AC-04 | An order has a linked return with items | I view the CSV | Return items are appended as additional rows below the order's item rows |
| AC-05 | The export is generating | I view the button | It shows a spinner and "Preparing…" and is disabled |
| AC-06 | Phone numbers are in the CSV | — | Mobile numbers are formatted as `="0901234567"` to prevent Excel from stripping leading zeros |

---

### US-V04-05 — Export Orders to PDF

**As a** vendor,
**I want to** export the filtered order list as a printable PDF,
**So that** I can produce a formatted report for physical records or sharing in meetings.

**Priority:** P3 — Medium

#### Acceptance Criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC-01 | I click "🖨 PDF" | — | The browser print dialog opens with a formatted order report |
| AC-02 | Active filters are set | The PDF is generated | The active filter summary (retailer, city, date range) is shown at the top of the report |
| AC-03 | The PDF is generating | I view the button | It shows a spinner and "Preparing…" and is disabled |

---

## Non-Functional Requirements

| ID | Category | Requirement |
|---|---|---|
| NFR-V04-01 | Performance | The order table must render within 2 seconds for up to 500 orders |
| NFR-V04-02 | Performance | All filtering and search operations are client-side and must update the list in under 100ms |
| NFR-V04-03 | Performance | CSV and PDF export for up to 500 orders must complete within 5 seconds |
| NFR-V04-04 | Usability | Retailer and city dropdowns must auto-populate from the loaded order data |
| NFR-V04-05 | Usability | Date range filter must support the full-day boundary on the "to" date |
| NFR-V04-06 | Security | Vendors can only see orders associated with their account |
| NFR-V04-07 | Data Integrity | Exported data must match what is visible on screen given the active filters |
