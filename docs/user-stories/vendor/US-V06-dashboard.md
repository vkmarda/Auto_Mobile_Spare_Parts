# US-V06 — Analytics Dashboard (VendorDashboard)

**Page:** `/vendor/dashboard`
**Role:** Vendor
**Last Updated:** 2026-04-26

---

## Context
The Dashboard is the vendor's business intelligence view. It combines KPI cards, trend charts,
a pending demand table, a retailer leaderboard, and an inline order management panel — giving
vendors both strategic visibility and the ability to take immediate action from one screen.

---

## User Stories

---

### US-V06-01 — View Business KPIs for a Selected Time Period

**As a** vendor,
**I want to** see key metrics (unique parts, total quantity ordered, fulfilment rate) for a chosen
date range,
**So that** I can evaluate business performance and compare it to previous periods.

**Priority:** P2 — High

#### Acceptance Criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC-01 | I open the Dashboard | — | I see three KPI cards: Unique Parts Ordered, Total Quantity, Fulfilment Rate — each with a current value and a trend indicator vs. the prior period |
| AC-02 | I select "Last 7 days" | — | All KPI cards update to reflect the 7-day window |
| AC-03 | I select "Last 30 days" or "Last 90 days" | — | KPI cards update accordingly |
| AC-04 | I click "Since last dispatch" | — | The range auto-calculates as the number of days since the first dispatch was created |
| AC-05 | Fulfilment rate is calculated | — | It is shown as: accepted / (accepted + rejected) × 100%, or "—" if no decisions have been made |
| AC-06 | A KPI value increased vs. prior period | I view the card | A green upward trend indicator is shown |
| AC-07 | A KPI value decreased | I view the card | A red downward trend indicator is shown |

---

### US-V06-02 — View Demand Trends via Charts

**As a** vendor,
**I want to** see a chart of daily order quantities and a ranking of top-selling products,
**So that** I can identify demand patterns and focus restocking efforts.

**Priority:** P3 — Medium

#### Acceptance Criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC-01 | I view the Charts section | — | I see two charts: "Top Products by Quantity" (horizontal bar, top 5) and "Daily Orders" (area chart over the selected date range) |
| AC-02 | I change the date range selector | — | Both charts update to reflect the new window |
| AC-03 | No data exists for the range | — | Empty-state placeholders are shown inside the chart area |

---

### US-V06-03 — View Pending Demand by Product and City

**As a** vendor,
**I want to** see what products are being ordered and in what quantities per city,
**So that** I can pre-pack or prioritise production before dispatching.

**Priority:** P2 — High

#### Acceptance Criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC-01 | I view the Pending Demand table | — | I see a row per product showing: product name, SKU, total pending quantity, quantity breakdown by city |
| AC-02 | A product is out of stock | I view its row | The stock status is highlighted (e.g., red badge) |
| AC-03 | No pending demand exists | — | An empty state is shown in the table |

---

### US-V06-04 — Filter Orders by Status from Dashboard

**As a** vendor,
**I want to** click a status card to filter the inline order list,
**So that** I can review a specific set of orders without leaving the dashboard.

**Priority:** P3 — Medium

#### Acceptance Criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC-01 | I view the order status cards | — | Eight status cards are shown: All, Pending, Accepted, Rejected, Dispatched, Delivered, Confirmed, Returns — each with a count |
| AC-02 | I click "Pending" | — | The order list below filters to pending orders only; the clicked card highlights |
| AC-03 | I click "All" | — | All orders are shown |

---

### US-V06-05 — Bulk Accept Selected Pending Orders

**As a** vendor,
**I want to** select specific pending orders using checkboxes and bulk-accept them,
**So that** I can accept a subset without accepting all pending orders.

**Priority:** P2 — High

#### Acceptance Criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC-01 | The order list is filtered to "Pending" or "All" | I view pending order rows | Each pending order has a checkbox on the left |
| AC-02 | I check one or more orders | — | An "Accept Selected (N)" button appears in the section header |
| AC-03 | I click "Accept Selected" | — | Only the checked orders are accepted; unchecked orders remain pending |
| AC-04 | I click "Select All Pending" | — | All pending order checkboxes are checked |
| AC-05 | No orders are checked | — | The "Accept Selected" button is hidden |

---

### US-V06-06 — View Most Active Retailers

**As a** vendor,
**I want to** see which retailers are placing the most orders,
**So that** I can identify my most valuable customers and track engagement.

**Priority:** P3 — Medium

#### Acceptance Criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC-01 | I view the Retailers section | — | A table shows retailers ranked by total order count, with columns: Rank, Name, Location, Order Count, Last Order Date |
| AC-02 | A retailer has placed orders recently | I view their row | The "Last Order" date is displayed |
