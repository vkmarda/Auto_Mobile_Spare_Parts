# US-V01 — Pending Orders (VendorHome)

**Page:** `/vendor/pending`
**Role:** Vendor
**Last Updated:** 2026-04-26

---

## Context
The Pending Orders page is the vendor's primary action hub. It shows a real-time count of
orders needing attention (pending, accepted, in-transit, returns) and surfaces individual
order cards with inline Accept/Reject controls. Return requests from retailers are also
reviewed and acted upon here.

---

## User Stories

---

### US-V01-01 — View Pending Order Summary

**As a** vendor,
**I want to** see a real-time summary of how many orders are pending, accepted, in transit, and
have active returns,
**So that** I can quickly assess my workload without scrolling through individual orders.

**Priority:** P1 — Critical

#### Acceptance Criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC-01 | I am logged in as a vendor | I navigate to the Pending Orders page | I see four stat cards: "Need Action" (pending), "Accepted", "In Transit" (dispatched), "Returns" |
| AC-02 | There are 3 pending orders | The page loads | The "Need Action" card shows the number 3 |
| AC-03 | A greeting is shown | The page loads | The greeting says "Good morning/afternoon/evening, [First Name]" based on current time |
| AC-04 | There are pending orders | The page loads | The subtitle next to the date shows "· N order(s) need action" in amber |
| AC-05 | The page is loading | Data is being fetched | Skeleton placeholders are shown for stat cards and order rows |

---

### US-V01-02 — Accept a Single Pending Order

**As a** vendor,
**I want to** accept an individual pending order after reviewing its details,
**So that** the retailer knows their order is confirmed and I can prepare it for dispatch.

**Priority:** P1 — Critical

#### Acceptance Criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC-01 | A pending order exists in the list | I click the "Accept" button on an order card | A confirmation modal appears showing order number, retailer name, and unit count |
| AC-02 | The confirmation modal is open | I click "Accept Order" | The order status changes to "accepted", the card disappears from the pending list, and a green toast "Order ORD-XXX accepted" appears |
| AC-03 | The confirmation modal is open | I click "Cancel" | The modal closes and the order remains in the pending list unchanged |
| AC-04 | An accept action is in progress | I view the modal | The confirm button shows a spinner and is disabled |
| AC-05 | The accept action succeeds | The data refreshes | The page updates without showing a full skeleton reload |

---

### US-V01-03 — Reject a Pending Order with Reason

**As a** vendor,
**I want to** reject an order and provide a reason,
**So that** the retailer understands why their order was not fulfilled.

**Priority:** P1 — Critical

#### Acceptance Criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC-01 | A pending order exists | I click the "Reject" button | A rejection modal appears with the order summary and a reason picker |
| AC-02 | The rejection modal is open | I select a preset reason (e.g., "Out of stock") | The reason chip highlights and populates the text field |
| AC-03 | The rejection modal is open | I type a custom reason in the text field | The text input overrides any preset selection |
| AC-04 | No reason has been entered | I try to click "Reject Order" | The button remains disabled until a reason is provided |
| AC-05 | A reason is entered and I confirm | I click "Reject Order" | The order is rejected, removed from the pending list, and a blue toast "Order ORD-XXX rejected" appears |
| AC-06 | — | — | Preset reasons available: "Out of stock", "Duplicate order", "Incomplete details", "Price issue" |

---

### US-V01-04 — Bulk Accept All Pending Orders

**As a** vendor,
**I want to** accept all pending orders with a single click,
**So that** I can process high volumes quickly without reviewing each order individually.

**Priority:** P2 — High

#### Acceptance Criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC-01 | There are pending orders | I view the Pending Orders page | An "Accept All (N)" button is shown in the section header |
| AC-02 | I click "Accept All" | The button is clicked | A confirmation modal appears showing "This will accept all N orders at once" |
| AC-03 | The confirmation modal is open | I confirm | All pending orders are accepted, the pending list empties, and a toast "N orders accepted" appears |
| AC-04 | There are no pending orders | I view the page | The "Accept All" button is not shown |
| AC-05 | A bulk action is in progress | I view the button | All action buttons are disabled until the action completes |

---

### US-V01-05 — Review and Accept a Return Request

**As a** vendor,
**I want to** review and accept a return request from a retailer,
**So that** the return can be grouped into the next outbound dispatch for pickup.

**Priority:** P2 — High

#### Acceptance Criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC-01 | A return request exists | I scroll to "Pending Returns" | I see the return number, linked order number, retailer name, city, and reason |
| AC-02 | I click "Accept" on a return | — | A confirmation modal shows the return number, linked order, retailer, and reason |
| AC-03 | I confirm acceptance | — | The return moves to "return_accepted" status, disappears from the pending list, and a toast "Return RET-XXX accepted" appears |
| AC-04 | No pending returns exist | I view the section | An empty state is shown: "No pending returns" with a checkmark |

---

### US-V01-06 — Settle a Return Request Directly

**As a** vendor,
**I want to** mark a return as settled without routing it through dispatch,
**So that** minor or already-resolved returns don't create unnecessary paperwork.

**Priority:** P3 — Medium

#### Acceptance Criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC-01 | A return request is in the pending list | I click "Settle" | A confirmation modal appears with the return details |
| AC-02 | I confirm settlement | — | The return status becomes "return_settled", it disappears from the list, and a toast "Return RET-XXX settled" appears |

---

## Non-Functional Requirements

| ID | Category | Requirement |
|---|---|---|
| NFR-V01-01 | Performance | Page must load initial data (orders + returns) within 2 seconds on a standard connection |
| NFR-V01-02 | Performance | After an accept/reject action, the list must update without a full-page skeleton flash |
| NFR-V01-03 | Usability | Confirmation modals must be dismissed with a clear "Cancel" option before any destructive action |
| NFR-V01-04 | Usability | Age of pending orders must be shown (e.g., "3d ago") with color-coded urgency: orange ≥3 days, red ≥5 days |
| NFR-V01-05 | Security | Only users with `role = vendor` can access this page; others are redirected to login |
| NFR-V01-06 | Reliability | If an accept/reject API call fails, the order must remain in its original state and an error must be surfaced |
