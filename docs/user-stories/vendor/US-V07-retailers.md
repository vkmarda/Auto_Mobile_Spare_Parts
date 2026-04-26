# US-V07 — Retailer Network (VendorRetailers + VendorRetailerDetail)

**Pages:** `/vendor/retailers`, `/vendor/retailers/:id`
**Role:** Vendor
**Last Updated:** 2026-04-26

---

## Context
The Retailers pages give vendors visibility into their retail partner network. The list page lets
vendors search and filter all retailers. The detail page drills into a single retailer's full
order history, contact information, and order status breakdown.

---

## User Stories

---

### US-V07-01 — Browse the Retailer Network

**As a** vendor,
**I want to** see a list of all retailers who have placed orders with me,
**So that** I can understand my customer base and identify partners with outstanding actions.

**Priority:** P2 — High

#### Acceptance Criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC-01 | I open the Retailers page | — | A table shows all retailers with: Name, Email, City, State, Mobile, Total Orders, Pending count, In-Transit count |
| AC-02 | A retailer has pending orders | I view their row | The Pending count is highlighted with an amber badge |
| AC-03 | A retailer has in-transit orders | I view their row | The In-Transit count is highlighted with a violet badge |
| AC-04 | A retailer has a phone number | I view their row | The mobile is a clickable `tel:` link that opens the dialler |
| AC-05 | I view the page header | — | The total filtered retailer count is displayed |

---

### US-V07-02 — Search and Filter Retailers

**As a** vendor,
**I want to** search by retailer name and filter by city,
**So that** I can quickly locate a specific partner or review all customers in a region.

**Priority:** P2 — High

#### Acceptance Criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC-01 | I type in the name search field | — | The table instantly filters to retailers whose name contains the typed string (case-insensitive) |
| AC-02 | I select a city from the dropdown | — | Only retailers in that city are shown |
| AC-03 | I apply both name and city filters | — | Both are applied together (AND logic) |
| AC-04 | I click "Clear" | — | All filters reset and the full list is shown |

---

### US-V07-03 — View a Retailer's Full Profile

**As a** vendor,
**I want to** open a detailed profile page for a specific retailer,
**So that** I can review their order history, contact them, and understand their order patterns.

**Priority:** P2 — High

#### Acceptance Criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC-01 | I click "View Details" on a retailer row | — | I navigate to the retailer detail page showing: name, city/state, mobile (clickable), email (clickable), and last dispatch date |
| AC-02 | I view the stats section | — | Chips show total orders and a count for each non-zero status (Pending, Accepted, Dispatched, etc.) |
| AC-03 | The retailer has no orders | I view the page | The order list is empty with a relevant message |

---

### US-V07-04 — Filter a Retailer's Orders by Status

**As a** vendor,
**I want to** filter a specific retailer's orders by status on their detail page,
**So that** I can focus on orders in a particular stage (e.g., all dispatched orders for this retailer).

**Priority:** P3 — Medium

#### Acceptance Criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC-01 | I view the retailer detail page | — | Status filter buttons are shown: All, Pending, Accepted, Dispatched, Delivered, Confirmed, Rejected |
| AC-02 | I click a status button | — | Only orders of that status are shown in the list |
| AC-03 | I click "All" | — | All of the retailer's orders are shown |
| AC-04 | I click the back link | — | I navigate back to the Retailers list |
