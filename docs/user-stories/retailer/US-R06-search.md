# US-R06 — Search Results

**Page:** `/search`
**Role:** Retailer
**Last Updated:** 2026-04-26

---

## Context
The Search Results page lets retailers search for spare parts by name or SKU across the
entire catalog — bypassing the vehicle selection wizard for cases where they already know
exactly what they need. Results can be further filtered by vendor if multiple vendors
carry the same part.

---

## User Stories

---

### US-R06-01 — Search for a Part by Name or SKU

**As a** retailer,
**I want to** search for a spare part by entering a name or SKU,
**So that** I can find what I need quickly without navigating the full vehicle wizard.

**Priority:** P1 — Critical

#### Acceptance Criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC-01 | I open the search page with a query in the URL | — | The search is automatically executed and results are shown |
| AC-02 | I type in the search bar and press Enter or click the search icon | — | The search executes and matching products are shown in a grid |
| AC-03 | I type a partial name or SKU | — | Products whose name, part name, or SKU contains the typed text are returned |
| AC-04 | No products match | — | A "No results found" message is shown with a suggestion to try a different search term |
| AC-05 | I have not typed anything | — | A "Type something to search" message is shown and no API call is made |

---

### US-R06-02 — Filter Search Results by Vendor

**As a** retailer,
**I want to** filter search results by a specific vendor,
**So that** I can order from my preferred supplier when multiple vendors carry the same part.

**Priority:** P3 — Medium

#### Acceptance Criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC-01 | Search results include products from multiple vendors | — | A vendor dropdown appears populated with vendor names from the results |
| AC-02 | I select a vendor | — | Only products from that vendor are shown |
| AC-03 | I select "All Vendors" | — | All results are shown again |
| AC-04 | All results are from a single vendor | — | The vendor dropdown is not shown |

---

### US-R06-03 — Add a Search Result to Cart

**As a** retailer,
**I want to** add a part from the search results directly to my cart,
**So that** I can order it without going back to the product list.

**Priority:** P1 — Critical

#### Acceptance Criteria

| ID | Given | When | Then |
|---|---|---|---|
| AC-01 | I click "Add to Cart" on a search result | — | The item is added to the cart |
| AC-02 | I view the sticky bottom bar | — | A "View Cart (N)" button shows the total item count |
| AC-03 | I click "View Cart" | — | I am taken to /cart |
| AC-04 | The cart is empty | I view the bottom bar | "View Cart" is disabled |
| AC-05 | I click Back | — | I return to the retailer landing page |
