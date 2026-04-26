# US-V03 — Returns Management (VendorReturns)

**Page:** `/vendor/returns`
**Role:** Vendor
**Last Updated:** 2026-04-26

---

## Context
The Returns page gives vendors a complete view of all inbound return requests initiated by retailers.
Vendors can accept returns (scheduling them for pickup on the next city dispatch), settle them directly,
or track returns that are already in transit. The page handles both standard product orders and photo orders.

---

## User Stories

---

### US-V03-01 — View All Return Requests with Status Overview

**As a** vendor,
**I want to** see all return requests organised by status with summary counts,
**So that** I can quickly understand the volume and stage of returns without opening each record.

**Priority:** P1 — Critical

#### Acceptance Criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC-01 | I open the Returns page | — | I see five stat cards: Requested, Accepted, In Transit, Received, Settled — each showing the count for that status |
| AC-02 | I view the filter tabs | — | Tabs show: All, Requested, Accepted, In Transit, Received, Settled — each with a count badge |
| AC-03 | I click a tab | — | The list filters to show only returns of that status |
| AC-04 | No returns exist in the selected tab | — | An empty state is shown: "No returns in this status" |
| AC-05 | Returns exist | I view each return card | I can see: return number, linked order number, retailer name, city/state, reason (if provided), status badge, and creation date |

---

### US-V03-02 — Accept a Return Request

**As a** vendor,
**I want to** accept a retailer's return request,
**So that** it gets scheduled for pickup on the next dispatch to that city.

**Priority:** P1 — Critical

#### Acceptance Criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC-01 | A return is in "return_requested" status | I view the return card | An "Accept Return" button is visible |
| AC-02 | I click "Accept Return" | — | The action executes, status changes to "return_accepted", and a toast "Return RET-XXX accepted" appears |
| AC-03 | A return has been accepted | I view its card | A note reads: "Will be grouped in next dispatch" |
| AC-04 | An action is in progress | I view the button | It shows "Processing..." and is disabled |

---

### US-V03-03 — Settle a Return Directly

**As a** vendor,
**I want to** mark a return as settled without waiting for a physical pickup,
**So that** cases resolved offline (e.g., credit notes, replacements) are reflected accurately.

**Priority:** P2 — High

#### Acceptance Criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC-01 | A return is in "return_requested" or "return_accepted" status | I view the card | A "Settled" / "Mark Settled" button is visible |
| AC-02 | I click the settle button | — | A confirmation modal appears: "Mark this return as settled? No further action will be needed." |
| AC-03 | I confirm settlement | — | The return status becomes "return_settled", the card shows "✓ Settled — no further action needed", and a toast "Return RET-XXX settled" appears |
| AC-04 | I dismiss the confirmation modal | — | No status change occurs |

---

### US-V03-04 — View Items in a Return Request

**As a** vendor,
**I want to** see exactly which products are being returned and in what quantity,
**So that** I can verify the return contents before accepting or settling.

**Priority:** P2 — High

#### Acceptance Criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC-01 | A return is for a standard order | I view the return card | A table shows: product name, SKU, and quantity for each returned item |
| AC-02 | A return is for a photo order | I view the return card | A photo grid shows: item photo, vehicle brand/model/year, and quantity |
| AC-03 | The retailer attached return photos | I view the return card | Thumbnails of return photos are shown and each is clickable to open full size in a new tab |
| AC-04 | I click "More Details" | — | A detail modal opens showing the full return timeline, items, photos, and retailer info |

---

### US-V03-05 — Track Returns Grouped by Dispatch

**As a** vendor,
**I want to** see return pickups that are part of outgoing dispatches grouped together,
**So that** I can track which physical trips include return collection.

**Priority:** P3 — Medium

#### Acceptance Criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC-01 | Returns are in "return_dispatched" or "return_received" status and are linked to a dispatch | I view the page | A "Return Deliveries" section appears above the main list, grouping these returns by dispatch number |
| AC-02 | I view a Return Delivery group | — | I see the dispatch number, return count, and each return's number, retailer, city, and status |
| AC-03 | A dispatch is marked as delivered | — | Linked returns automatically move from "return_dispatched" to "return_received" |

---

## Non-Functional Requirements

| ID | Category | Requirement |
|---|---|---|
| NFR-V03-01 | Performance | The returns list must load within 2 seconds |
| NFR-V03-02 | Usability | Settlement requires a confirmation step to prevent accidental clicks |
| NFR-V03-03 | Usability | Return cards must clearly differentiate between standard and photo order returns |
| NFR-V03-04 | Data Integrity | A return cannot be accepted or settled once it has reached "return_dispatched" or later status |
| NFR-V03-05 | Security | Only vendors can update return statuses |
| NFR-V03-06 | Accessibility | Return photos must be accessible via link (not relying solely on color to convey state) |
